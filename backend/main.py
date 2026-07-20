import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database.connection import engine, Base
from backend.routers import auth, chat, health

# Create SQLite database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EduAI Assistant API",
    description="Backend API for the EduAI Assistant application, featuring JWT Auth and SSE Streaming",
    version="1.0.0"
)

# Configure CORS to support frontend dev servers and deployment setups
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(health.router)

# Serve React static assets in production if built
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check if static directory exists (where React builds are placed)
if os.path.exists("static") or os.path.exists("backend/static"):
    static_dir = "static" if os.path.exists("static") else "backend/static"
    # Mount assets folder for bundle styles/scripts
    if os.path.exists(os.path.join(static_dir, "assets")):
        app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    
    @app.get("/{catchall:path}")
    async def serve_react_app(catchall: str):
        # If it's a request for an existing static file, return it
        file_path = os.path.join(static_dir, catchall)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise, fall back to index.html to support React Router client-side routing
        return FileResponse(os.path.join(static_dir, "index.html"))

# Custom Exception Handler for global error handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected system error occurred: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

