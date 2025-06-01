# Image Moderation API

A FastAPI-based API for moderating images, detecting harmful content, and managing access through bearer tokens.

## Features

- Image moderation and content safety analysis
- Bearer token authentication
- MongoDB integration for token and usage tracking
- Docker containerization
- Simple frontend interface
- CI/CD with GitHub Actions

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
cd backend
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
cd backend
uvicorn app.main:app --reload --port 7000
```

### Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

## API Documentation

Once the application is running, visit:
- Swagger UI: http://localhost:7001/docs
- ReDoc: http://localhost:7001/redoc

## Testing

Run tests with pytest:
```bash
cd backend
pytest
```

The project includes the following tests:

- **Authentication Tests**: Tests for token validation, admin privileges, and authentication middleware.
- **Image Moderation Tests**: Tests for the image moderation service, including detection of safe and unsafe content.

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── db/             # Database configuration
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── main.py         # FastAPI application entry point
|  ├── tests/               # test cases files
│  ├── Dockerfile
│  └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── .github/
│   └── workflows/          # GitHub Actions workflows
│       └── code-quality.yml # Code quality checks for frontend and backend
├── docker-compose.yml
└── README.md
```

## CI/CD

This project uses GitHub Actions for continuous integration:

- **Code Quality**: Runs ESLint on frontend code and flake8 on backend code to ensure code quality standards are met.

GitHub workflows are triggered on push to main/master branches and on pull requests.

## License

MIT