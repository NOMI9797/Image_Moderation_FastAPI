from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router
from app.db.mongodb import MongoDB
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await MongoDB.connect_to_database()
    yield
    # Shutdown logic
    await MongoDB.close_database_connection()

app = FastAPI(
    title="Image Moderation API",
    description="API for moderating images using FastAPI",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to Image Moderation API"}
