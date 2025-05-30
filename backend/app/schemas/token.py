from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TokenBase(BaseModel):
    token: str = Field(..., description="The bearer token string")
    isAdmin: bool = Field(..., description="Is this token an admin token?")

class TokenCreate(BaseModel):
    isAdmin: bool = Field(..., description="Is this token an admin token?")

class TokenResponse(TokenBase):
    createdAt: datetime

class TokenInDB(TokenBase):
    createdAt: datetime
    _id: Optional[str] = None 