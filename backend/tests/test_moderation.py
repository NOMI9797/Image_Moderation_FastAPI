import pytest
from fastapi.testclient import TestClient
from fastapi import UploadFile
import io
import os
import sys
from unittest.mock import patch, MagicMock
from PIL import Image

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.services.moderation import moderate_image

client = TestClient(app)

# Mock data for SightEngine API response
MOCK_SAFE_RESPONSE = {
    "status": "success",
    "nudity": {"sexual_activity": 0.01, "sexual_display": 0.01, "erotica": 0.01, "suggestive": 0.01},
    "weapon": {"classes": {"firearm": 0.01, "knife": 0.01}},
    "alcohol": {"prob": 0.01},
    "recreational_drug": {"prob": 0.01},
    "offensive": {"nazi": 0.01, "supremacist": 0.01, "terrorist": 0.01},
    "gore": {"prob": 0.01},
    "tobacco": {"prob": 0.01},
    "violence": {"prob": 0.01},
    "self-harm": {"prob": 0.01}
}

MOCK_UNSAFE_RESPONSE = {
    "status": "success",
    "nudity": {"sexual_activity": 0.01, "sexual_display": 0.01, "erotica": 0.01, "suggestive": 0.01},
    "weapon": {"classes": {"firearm": 0.9, "knife": 0.01}},  # High weapon probability
    "alcohol": {"prob": 0.01},
    "recreational_drug": {"prob": 0.01},
    "offensive": {"nazi": 0.01, "supremacist": 0.01, "terrorist": 0.01},
    "gore": {"prob": 0.01},
    "tobacco": {"prob": 0.01},
    "violence": {"prob": 0.01},
    "self-harm": {"prob": 0.01}
}

def create_test_image():
    """Create a simple test image in memory"""
    file = io.BytesIO()
    image = Image.new('RGB', size=(100, 100), color=(255, 0, 0))
    image.save(file, 'png')
    file.name = 'test.png'
    file.seek(0)
    return file

@pytest.mark.asyncio
@patch('app.services.moderation.requests.post')
@patch('app.services.moderation.magic.Magic')
async def test_moderate_safe_image(mock_magic, mock_post):
    """Test that safe images are correctly identified"""
    # Setup mocks
    mock_magic_instance = MagicMock()
    mock_magic_instance.from_buffer.return_value = 'image/png'
    mock_magic.return_value = mock_magic_instance
    
    mock_response = MagicMock()
    mock_response.text = '{"status": "success", "nudity": {"sexual_activity": 0.01, "sexual_display": 0.01, "erotica": 0.01, "suggestive": 0.01}, "weapon": {"classes": {"firearm": 0.01, "knife": 0.01}}, "alcohol": {"prob": 0.01}, "recreational_drug": {"prob": 0.01}, "offensive": {"nazi": 0.01, "supremacist": 0.01, "terrorist": 0.01}, "gore": {"prob": 0.01}, "tobacco": {"prob": 0.01}, "violence": {"prob": 0.01}, "self-harm": {"prob": 0.01}}'
    mock_post.return_value = mock_response
    
    # Create test file
    test_file = create_test_image()
    file = UploadFile(filename="test.png", file=test_file)
    
    # Call the function
    result = await moderate_image(file)
    
    # Assertions
    assert result["is_safe"] == True
    assert result["message"] == "Image is safe"
    assert "violations" in result["details"]
    assert len(result["details"]["violations"]) == 0

@pytest.mark.asyncio
@patch('app.services.moderation.requests.post')
@patch('app.services.moderation.magic.Magic')
async def test_moderate_unsafe_image(mock_magic, mock_post):
    """Test that unsafe images are correctly identified"""
    # Setup mocks
    mock_magic_instance = MagicMock()
    mock_magic_instance.from_buffer.return_value = 'image/png'
    mock_magic.return_value = mock_magic_instance
    
    mock_response = MagicMock()
    mock_response.text = '{"status": "success", "nudity": {"sexual_activity": 0.01, "sexual_display": 0.01, "erotica": 0.01, "suggestive": 0.01}, "weapon": {"classes": {"firearm": 0.9, "knife": 0.01}}, "alcohol": {"prob": 0.01}, "recreational_drug": {"prob": 0.01}, "offensive": {"nazi": 0.01, "supremacist": 0.01, "terrorist": 0.01}, "gore": {"prob": 0.01}, "tobacco": {"prob": 0.01}, "violence": {"prob": 0.01}, "self-harm": {"prob": 0.01}}'
    mock_post.return_value = mock_response
    
    # Create test file
    test_file = create_test_image()
    file = UploadFile(filename="test.png", file=test_file)
    
    # Call the function
    result = await moderate_image(file)
    
    # Assertions
    assert result["is_safe"] == False
    assert result["message"] == "Image contains inappropriate content"
    assert "violations" in result["details"]
    assert "weapon" in result["details"]["violations"] 