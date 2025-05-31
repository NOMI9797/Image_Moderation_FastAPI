from fastapi import UploadFile, HTTPException
import magic
import requests
import json
import os
from typing import Dict, List, Tuple
from dotenv import load_dotenv

load_dotenv()

# SightEngine API credentials
API_USER = os.getenv("SIGHTENGINE_API_USER", "86502181")
API_SECRET = os.getenv("SIGHTENGINE_API_SECRET", "DFqvSFjWzDx3gGcBUaYCCf8KxEh3JyLt")

# Define content categories and their thresholds
CONTENT_CATEGORIES = {
    'nudity': 0.5,     # Nudity detection
    'violence': 0.5,   # Violence
    'weapon': 0.5,     # Weapons
    'alcohol': 0.5,    # Alcohol 
    'drugs': 0.5,      # Recreational drugs
    'offensive': 0.5,  # Offensive content (nazi, etc.)
    'gore': 0.5,       # Gore content
    'tobacco': 0.5,    # Tobacco
    'self-harm': 0.5,  # Self-harm content
}

async def moderate_image(file: UploadFile) -> dict:
    try:
        # Read the file content
        content = await file.read()
        
        # Check if the file is a valid image
        mime = magic.Magic(mime=True)
        file_type = mime.from_buffer(content)
        if not file_type.startswith('image/'):
            return {
                "is_safe": False,
                "message": "File is not a valid image",
                "details": {"error": "Invalid file type"}
            }

        # Create a temporary file to send to SightEngine API
        temp_file_path = f"/tmp/{file.filename}"
        with open(temp_file_path, "wb") as temp_file:
            temp_file.write(content)
        
        # Set up parameters for SightEngine API
        params = {
            'models': 'nudity-2.1,weapon,alcohol,recreational_drug,medical,offensive-2.0,gore-2.0,tobacco,violence,self-harm',
            'api_user': API_USER,
            'api_secret': API_SECRET
        }
        
        # Send request to SightEngine API
        files = {'media': open(temp_file_path, 'rb')}
        response = requests.post('https://api.sightengine.com/1.0/check.json', files=files, data=params)
        
        # Close and remove temporary file
        files['media'].close()
        os.remove(temp_file_path)
        
        # Parse the API response
        sightengine_result = json.loads(response.text)
        
        if sightengine_result.get('status') != 'success':
            return {
                "is_safe": False,
                "message": "Error analyzing image",
                "details": {"error": sightengine_result.get('error', {}).get('message', 'Unknown error')}
            }
        
        # Analyze content for violations
        violations = []
        
        # Check nudity violations
        if sightengine_result.get('nudity'):
            nudity_data = sightengine_result['nudity']
            if (nudity_data.get('sexual_activity', 0) > CONTENT_CATEGORIES['nudity'] or
                nudity_data.get('sexual_display', 0) > CONTENT_CATEGORIES['nudity'] or
                nudity_data.get('erotica', 0) > CONTENT_CATEGORIES['nudity'] or
                nudity_data.get('suggestive', 0) > CONTENT_CATEGORIES['nudity']):
                violations.append('nudity')
        
        # Check weapon violations
        if sightengine_result.get('weapon'):
            weapon_data = sightengine_result['weapon']['classes']
            if (weapon_data.get('firearm', 0) > CONTENT_CATEGORIES['weapon'] or
                weapon_data.get('knife', 0) > CONTENT_CATEGORIES['weapon']):
                violations.append('weapon')
        
        # Check alcohol violations
        if sightengine_result.get('alcohol', {}).get('prob', 0) > CONTENT_CATEGORIES['alcohol']:
            violations.append('alcohol')
        
        # Check drug violations
        if sightengine_result.get('recreational_drug', {}).get('prob', 0) > CONTENT_CATEGORIES['drugs']:
            violations.append('drugs')
        
        # Check offensive content violations
        if sightengine_result.get('offensive'):
            offensive_data = sightengine_result['offensive']
            if (offensive_data.get('nazi', 0) > CONTENT_CATEGORIES['offensive'] or
                offensive_data.get('supremacist', 0) > CONTENT_CATEGORIES['offensive'] or
                offensive_data.get('terrorist', 0) > CONTENT_CATEGORIES['offensive']):
                violations.append('offensive')
        
        # Check gore violations
        if sightengine_result.get('gore', {}).get('prob', 0) > CONTENT_CATEGORIES['gore']:
            violations.append('gore')
        
        # Check tobacco violations
        if sightengine_result.get('tobacco', {}).get('prob', 0) > CONTENT_CATEGORIES['tobacco']:
            violations.append('tobacco')
        
        # Check violence violations
        if sightengine_result.get('violence', {}).get('prob', 0) > CONTENT_CATEGORIES['violence']:
            violations.append('violence')
        
        # Check self-harm violations
        if sightengine_result.get('self-harm', {}).get('prob', 0) > CONTENT_CATEGORIES['self-harm']:
            violations.append('self-harm')
        
        # Determine if image is safe
        is_safe = len(violations) == 0
        
        # Prepare detailed response
        response = {
            "is_safe": is_safe,
            "message": "Image is safe" if is_safe else "Image contains inappropriate content",
            "details": {
                "violations": violations,
                "content_analysis": sightengine_result,
            }
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        ) 