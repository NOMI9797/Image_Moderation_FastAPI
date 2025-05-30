from app.db.mongodb import MongoDB
from app.schemas.usage import UsageCreate, UsageInDB
from datetime import datetime
from typing import List

COLLECTION_NAME = "usages"

def get_usages_collection():
    return MongoDB.get_database()[COLLECTION_NAME]

async def create_usage(usage_data: UsageCreate) -> UsageInDB:
    doc = {
        "token": usage_data.token,
        "endpoint": usage_data.endpoint,
        "timestamp": datetime.utcnow()
    }
    collection = get_usages_collection()
    await collection.insert_one(doc)
    return UsageInDB(**doc)

async def list_usages_by_token(token: str) -> List[UsageInDB]:
    collection = get_usages_collection()
    cursor = collection.find({"token": token})
    usages = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        usages.append(UsageInDB(**doc))
    return usages

async def list_usages_by_endpoint(endpoint: str) -> List[UsageInDB]:
    collection = get_usages_collection()
    cursor = collection.find({"endpoint": endpoint})
    usages = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        usages.append(UsageInDB(**doc))
    return usages 