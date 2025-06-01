FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for python-magic
RUN apt-get update && apt-get install -y \
    libmagic-dev \
    file \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port
EXPOSE 7000

# Update uvicorn command to allow external access
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7001", "--reload"] 