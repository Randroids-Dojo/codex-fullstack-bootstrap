FROM python:3.11-slim

WORKDIR /app

# Install runtime deps
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir fastapi uvicorn[standard] sqlalchemy asyncpg python-jose[cryptography] psycopg2-binary python-dotenv redis pydantic-settings httpx

COPY ./app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
