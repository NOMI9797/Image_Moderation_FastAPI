from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Security
from fastapi.security import HTTPAuthorizationCredentials
from app.core.auth import get_current_token, get_admin_token, log_api_usage, security
from app.models.token import create_token, list_tokens, delete_token, get_token
from app.schemas.token import TokenCreate, TokenResponse
from app.services.moderation import moderate_image
from typing import List, Optional

router = APIRouter()

@router.post("/auth/tokens", response_model=TokenResponse)
async def create_new_token(
    token_data: TokenCreate,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
):
    # First check if any tokens exist
    existing_tokens = await list_tokens()
    
    # If no tokens exist, allow creation without authentication (bootstrap)
    if not existing_tokens:
        return await create_token(token_data)
    
    # For subsequent tokens, allow creation without authentication
    return await create_token(token_data)

@router.get("/auth/tokens", response_model=List[TokenResponse])
async def get_all_tokens(token: str = Depends(get_admin_token)):
    await log_api_usage(token, "/auth/tokens")
    return await list_tokens()

@router.delete("/auth/tokens/{token_to_delete}")
async def remove_token(token_to_delete: str, token: str = Depends(get_admin_token)):
    await log_api_usage(token, f"/auth/tokens/{token_to_delete}")
    if await delete_token(token_to_delete):
        return {"message": "Token deleted successfully"}
    raise HTTPException(status_code=404, detail="Token not found")

@router.post("/moderate")
async def moderate_image_endpoint(file: UploadFile = File(...), token: str = Depends(get_current_token)):
    await log_api_usage(token, "/moderate")
    result = await moderate_image(file)
    return result 