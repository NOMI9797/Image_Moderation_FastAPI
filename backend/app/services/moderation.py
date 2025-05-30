from fastapi import UploadFile, HTTPException
import magic
from google.cloud import vision
import os
from typing import Dict, List, Tuple

# Initialize the Vision API client
client = vision.ImageAnnotatorClient()

# Define content categories and their thresholds
CONTENT_CATEGORIES = {
    'adult': 0.5,  # Explicit nudity
    'violence': 0.5,  # Graphic violence
    'medical': 0.5,  # Medical conditions
    'spoof': 0.5,  # Spoofed content
    'racy': 0.5,  # Suggestive content
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

        # Create Vision API image object
        image = vision.Image(content=content)
        
        # Perform safe search detection
        safe_search = client.safe_search_detection(image=image).safe_search_annotation
        
        # Check for explicit content
        content_checks = {
            'adult': safe_search.adult,
            'violence': safe_search.violence,
            'medical': safe_search.medical,
            'spoof': safe_search.spoof,
            'racy': safe_search.racy
        }
        
        # Check for text in image (OCR)
        text_detection = client.text_detection(image=image).text_annotations
        detected_text = text_detection[0].description if text_detection else ""
        
        # Check for objects and labels
        objects = client.object_localization(image=image).localized_object_annotations
        labels = client.label_detection(image=image).label_annotations
        
        # Analyze content
        violations = []
        for category, threshold in CONTENT_CATEGORIES.items():
            if getattr(safe_search, category).value > threshold:
                violations.append(category)
        
        # Check for hate symbols or extremist content in text
        hate_keywords = ['hate', 'extremist', 'terrorist', 'nazi', 'racist']
        text_violations = [word for word in hate_keywords if word in detected_text.lower()]
        
        if text_violations:
            violations.append('hate_speech')
        
        # Determine if image is safe
        is_safe = len(violations) == 0
        
        # Prepare detailed response
        response = {
            "is_safe": is_safe,
            "message": "Image is safe" if is_safe else "Image contains inappropriate content",
            "details": {
                "violations": violations,
                "content_analysis": {
                    category: getattr(safe_search, category).name
                    for category in CONTENT_CATEGORIES.keys()
                },
                "detected_text": detected_text if detected_text else None,
                "detected_objects": [obj.name for obj in objects],
                "detected_labels": [label.description for label in labels]
            }
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        ) 