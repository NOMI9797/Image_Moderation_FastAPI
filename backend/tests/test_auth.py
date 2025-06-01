import pytest
from unittest.mock import patch, AsyncMock
from types import SimpleNamespace
from fastapi import HTTPException

from app.core.auth import get_admin_token

# Mock tokens using SimpleNamespace for attribute-style access
MOCK_ADMIN_TOKEN = SimpleNamespace(
    token="admin_token_123",
    name="Admin User",
    isAdmin=True,
    createdAt="2023-01-01T00:00:00"
)

MOCK_REGULAR_TOKEN = SimpleNamespace(
    token="user_token_456",
    name="Regular User",
    isAdmin=False,
    createdAt="2023-01-01T00:00:00"
)

@pytest.mark.asyncio
@patch('app.core.auth.get_token')
async def test_get_admin_token_valid(mock_get_token):
    """Test that admin tokens are properly authenticated for admin routes"""
    mock_get_token.return_value = MOCK_ADMIN_TOKEN

    token = await get_admin_token("admin_token_123")
    assert token == "admin_token_123"

@pytest.mark.asyncio
@patch('app.core.auth.get_token')
async def test_get_admin_token_non_admin(mock_get_token):
    """Test that non-admin tokens are rejected for admin routes"""
    mock_get_token.return_value = MOCK_REGULAR_TOKEN

    with pytest.raises(HTTPException) as excinfo:
        await get_admin_token("user_token_456")

    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "Admin privileges required"
