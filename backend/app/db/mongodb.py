from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "image_moderation")

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect_to_database(cls):
        try:
            cls.client = AsyncIOMotorClient(MONGODB_URI)
            cls.db = cls.client[DATABASE_NAME]
            # Verify the connection
            await cls.client.admin.command('ping')
            print("Connected to MongoDB!")
        except ConnectionFailure as e:
            print(f"Could not connect to MongoDB: {e}")
            raise

    @classmethod
    async def close_database_connection(cls):
        if cls.client:
            cls.client.close()
            print("MongoDB connection closed.")

    @classmethod
    def get_database(cls):
        return cls.db 