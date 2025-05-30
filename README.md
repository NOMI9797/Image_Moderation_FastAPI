# Image Moderation API

A FastAPI-based API for moderating images, detecting harmful content, and managing access through bearer tokens.

## Features

- Image moderation and content safety analysis
- Bearer token authentication
- MongoDB integration for token and usage tracking
- Docker containerization
- Simple frontend interface

## Prerequisites

- Python 3.8+
- MongoDB
- Docker and Docker Compose (for containerized deployment)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd image-moderation-api
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a .env file:
```bash
cp .env.example .env
```
Edit the .env file with your configuration.

## Running the Application

### Development Mode

1. Start MongoDB:
```bash
mongod
```

2. Run the FastAPI application:
```bash
uvicorn app.main:app --reload --port 7000
```

### Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

## API Documentation

Once the application is running, visit:
- Swagger UI: http://localhost:7000/docs
- ReDoc: http://localhost:7000/redoc

## Testing

Run tests with pytest:
```bash
pytest
```

## Project Structure

```
.
├── app/
│   ├── api/            # API routes
│   ├── core/           # Core functionality
│   ├── db/             # Database configuration
│   ├── models/         # Database models
│   ├── schemas/        # Pydantic schemas
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
├── tests/              # Test files
├── frontend/           # Frontend application
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## License

MIT 