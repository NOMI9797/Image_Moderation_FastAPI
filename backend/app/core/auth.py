from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.token import get_token
from app.models.usage import create_usage, UsageCreate
from typing import Optional

# Single source of truth for security
security = HTTPBearer(auto_error=False)

async def get_current_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    token = credentials.credentials
    token_data = await get_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    return token

async def get_admin_token(token: str = Depends(get_current_token)) -> str:
    token_data = await get_token(token)
    if not token_data or not token_data.isAdmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return token

async def log_api_usage(token: str, endpoint: str) -> None:
    await create_usage(UsageCreate(token=token, endpoint=endpoint)) 