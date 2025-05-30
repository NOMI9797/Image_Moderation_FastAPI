from app.db.mongodb import MongoDB
from app.schemas.token import TokenCreate, TokenInDB
from datetime import datetime
import secrets
from typing import Optional, List

COLLECTION_NAME = "tokens"

def get_tokens_collection():
    return MongoDB.get_database()[COLLECTION_NAME]

async def create_token(token_data: TokenCreate) -> TokenInDB:
    token_str = secrets.token_urlsafe(32)
    doc = {
        "token": token_str,
        "isAdmin": token_data.isAdmin,
        "createdAt": datetime.utcnow()
    }
    collection = get_tokens_collection()
    await collection.insert_one(doc)
    return TokenInDB(**doc)

async def get_token(token: str) -> Optional[TokenInDB]:
    collection = get_tokens_collection()
    doc = await collection.find_one({"token": token})
    if doc:
        doc["_id"] = str(doc["_id"])
        return TokenInDB(**doc)
    return None

async def delete_token(token: str) -> bool:
    collection = get_tokens_collection()
    result = await collection.delete_one({"token": token})
    return result.deleted_count == 1

async def list_tokens() -> List[TokenInDB]:
    collection = get_tokens_collection()
    cursor = collection.find({})
    tokens = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        tokens.append(TokenInDB(**doc))
    return tokens 