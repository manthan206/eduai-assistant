import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from sse_starlette.sse import EventSourceResponse

from backend.database.connection import get_db, SessionLocal
from backend.models.models import Chat, Message, User
from backend.utils.deps import get_current_user
from backend.services.openai_service import generate_chat_stream

logger = logging.getLogger(__name__)
router = APIRouter(prefix="", tags=["chat"])

class ChatCreate(BaseModel):
    title: Optional[str] = "New Chat"

class ChatRequest(BaseModel):
    chat_id: int
    message: str
    model: Optional[str] = "llama-3.3-70b-versatile"
    temperature: Optional[float] = 0.7

class MessageResponse(BaseModel):
    id: int
    role: str
    message: str
    timestamp: str

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    id: int
    title: str
    created_at: str

    class Config:
        from_attributes = True

@router.post("/new-chat")
def create_chat(chat_data: ChatCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_chat = Chat(
        user_id=current_user.id,
        title=chat_data.title
    )
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return {
        "id": new_chat.id,
        "title": new_chat.title,
        "created_at": new_chat.created_at.isoformat()
    }

@router.get("/history")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).order_by(Chat.created_at.desc()).all()
    history = []
    for chat in chats:
        # Fetch messages for each chat
        messages = db.query(Message).filter(Message.chat_id == chat.id).order_by(Message.timestamp.asc()).all()
        history.append({
            "id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at.isoformat(),
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "message": msg.message,
                    "timestamp": msg.timestamp.isoformat()
                } for msg in messages
            ]
        })
    return history

@router.delete("/history/{id}")
def delete_chat(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chat = db.query(Chat).filter(Chat.id == id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )
    db.delete(chat)
    db.commit()
    return {"message": "Chat deleted successfully", "id": id}

@router.post("/chat")
async def chat_message(
    chat_req: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Accepts user message, stores it, streams response token-by-token via SSE,
    and stores the generated answer in the database.
    """
    # Open db connection inside SSE stream to ensure safe async operations
    db = SessionLocal()
    try:
        # Verify chat ownership
        chat = db.query(Chat).filter(Chat.id == chat_req.chat_id, Chat.user_id == current_user.id).first()
        if not chat:
            db.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )

        # Update chat title if it's currently default "New Chat" and this is the first message
        message_count = db.query(Message).filter(Message.chat_id == chat.id).count()
        if message_count == 0 and chat.title == "New Chat":
            # Auto-title based on user prompt (first 30 characters)
            chat.title = chat_req.message[:35] + ("..." if len(chat_req.message) > 35 else "")
            db.commit()

        # Save user message to database
        user_msg = Message(
            chat_id=chat_req.chat_id,
            role="user",
            message=chat_req.message
        )
        db.add(user_msg)
        db.commit()

        # Retrieve full conversation history (ordered by timestamp) for the LLM context
        history_msgs = db.query(Message).filter(Message.chat_id == chat_req.chat_id).order_by(Message.timestamp.asc()).all()
        messages_payload = [
            {"role": msg.role, "message": msg.message} for msg in history_msgs
        ]

    except Exception as e:
        db.close()
        raise e

    async def event_generator():
        # Open separate database session for the background generation to prevent async collisions
        generator_db = SessionLocal()
        full_response = ""
        try:
            # Yield user message details first so the client can confirm it is saved
            yield {
                "event": "user_msg",
                "data": json.dumps({
                    "id": user_msg.id,
                    "chat_id": chat_req.chat_id,
                    "role": "user",
                    "message": chat_req.message,
                    "timestamp": user_msg.timestamp.isoformat()
                })
            }

            # Generate and stream response tokens
            async for token in generate_chat_stream(
                messages=messages_payload, 
                model=chat_req.model, 
                temperature=chat_req.temperature
            ):
                full_response += token
                yield {
                    "event": "token",
                    "data": json.dumps({"token": token})
                }

            # Save the final complete message to database once generation is finished
            assistant_msg = Message(
                chat_id=chat_req.chat_id,
                role="assistant",
                message=full_response
            )
            generator_db.add(assistant_msg)
            generator_db.commit()
            generator_db.refresh(assistant_msg)

            # Signal completion and send the saved message ID
            yield {
                "event": "done",
                "data": json.dumps({
                    "id": assistant_msg.id,
                    "message": full_response,
                    "timestamp": assistant_msg.timestamp.isoformat()
                })
            }

        except GeneratorExit:
            # Handle client disconnecting or stopping response generation mid-stream
            logger.info("Client disconnected. Saving partial assistant response.")
            if full_response.strip():
                assistant_msg = Message(
                    chat_id=chat_req.chat_id,
                    role="assistant",
                    message=full_response + "\n\n*(Generation stopped by user)*"
                )
                generator_db.add(assistant_msg)
                generator_db.commit()

        except Exception as ex:
            logger.error(f"Error during streaming response: {str(ex)}")
            yield {
                "event": "error",
                "data": json.dumps({"error": f"Streaming failed: {str(ex)}"})
            }
        finally:
            generator_db.close()

    db.close()
    return EventSourceResponse(event_generator())
