import os
import json
import asyncio
import httpx
from dotenv import load_dotenv
from typing import List, Dict, Any, AsyncGenerator

# Load environment variables from .env file immediately
load_dotenv()

SYSTEM_PROMPT = """You are EduAI Assistant, a versatile, intelligent, and helpful AI tutor.
Your goal is to answer ANY and ALL questions asked by the user clearly, accurately, and comprehensively.
You can answer questions on programming, science, mathematics, general knowledge, history, philosophy, writing, business, everyday logic, and any other topic requested.

Formatting rules:
- Provide clear, well-structured markdown formatting with headers and lists.
- For programming tasks, provide clean code blocks with proper syntax highlighting.
- Be polite, direct, helpful, and educational."""

DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
VALID_GROQ_MODELS = {
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
}

def get_llm_config():
    """
    Dynamically re-reads .env variables and returns configuration tuple:
    (api_key, base_url, provider)
    """
    load_dotenv(override=True)
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    
    api_key = groq_key or openai_key
    if not api_key:
        return None, None, None
    
    if groq_key:
        base_url = os.getenv("GROQ_API_BASE_URL", "https://api.groq.com/openai/v1").strip()
        provider = "groq"
    else:
        base_url = os.getenv("OPENAI_API_BASE_URL", "https://api.openai.com/v1").strip()
        provider = "openai"
        
    return api_key, base_url, provider

async def get_mock_stream(prompt: str) -> AsyncGenerator[str, None]:
    """
    Generates a dynamic educational streaming response for ANY user topic.
    Serves as fallback when no GROQ_API_KEY or OPENAI_API_KEY is configured in .env.
    """
    prompt_clean = prompt.strip()
    prompt_lower = prompt_clean.lower()
    
    if "python" in prompt_lower or "code" in prompt_lower or "programming" in prompt_lower:
        response = (
            f"### Answers & Explanation: {prompt_clean}\n\n"
            "Programming concepts require clear structure and practical examples. Here is the detailed breakdown:\n\n"
            "```python\n"
            "# Example implementation for: " + prompt_clean + "\n"
            "def solution_example():\n"
            "    print('Demonstrating solution logic...')\n"
            "    return True\n\n"
            "solution_example()\n"
            "```\n\n"
            "**Key Takeaways:**\n"
            "1. **Logic Structure**: Breakdown complex tasks into functions.\n"
            "2. **Best Practices**: Keep code clean, readable, and well-commented.\n\n"
            "*(Demo Mode active. Add `GROQ_API_KEY=gsk_...` in `.env` for full live Groq AI answers).* "
        )
    else:
        response = (
            f"### Response to: \"{prompt_clean}\"\n\n"
            f"Thank you for asking about **{prompt_clean}**!\n\n"
            "*(Demo Mode Notice: Add your free `GROQ_API_KEY` in `.env` to receive unlimited real-time LLM answers on any question!)*"
        )

    chunk_size = 8
    for i in range(0, len(response), chunk_size):
        chunk = response[i:i+chunk_size]
        yield chunk
        await asyncio.sleep(0.02)

async def generate_chat_stream(
    messages: List[Dict[str, str]], 
    model: str = "llama-3.3-70b-versatile", 
    temperature: float = 0.7
) -> AsyncGenerator[str, None]:
    """
    Streams live LLM responses from Groq (or OpenAI) using direct httpx streaming,
    or falls back gracefully to educational mock streaming if no API key is configured.
    """
    api_key, base_url, provider = get_llm_config()
    
    if not api_key:
        last_user_message = next((m["message"] for m in reversed(messages) if m["role"] == "user"), "")
        async for chunk in get_mock_stream(last_user_message):
            yield chunk
        return

    formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages:
        formatted_messages.append({"role": msg["role"], "content": msg["message"]})

    # Auto-map non-Groq / legacy model names to valid Groq models when Groq provider is active
    target_model = model
    if provider == "groq" and target_model not in VALID_GROQ_MODELS:
        target_model = DEFAULT_GROQ_MODEL

    endpoint_url = f"{base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": target_model,
        "messages": formatted_messages,
        "temperature": temperature,
        "stream": True
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0), follow_redirects=True) as client:
            async with client.stream("POST", endpoint_url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    err_str = err_body.decode('utf-8', errors='ignore')
                    yield f"\n\n*Error from LLM Provider (Status {response.status_code}): {err_str}*"
                    return
                
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            choices = data.get("choices", [])
                            if choices and len(choices) > 0:
                                delta = choices[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except Exception:
                            continue

    except Exception as e:
        error_msg = f"\n\n*Error communicating with LLM Provider: {str(e)}*"
        yield error_msg
