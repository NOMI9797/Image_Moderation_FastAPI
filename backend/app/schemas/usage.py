from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class UsageBase(BaseModel):
    token: str = Field(..., description="The token used for the API call")
    endpoint: str = Field(..., description="The endpoint that was called")

class UsageCreate(UsageBase):
    pass

class UsageInDB(UsageBase):
    timestamp: datetime
    _id: Optional[str] = None 