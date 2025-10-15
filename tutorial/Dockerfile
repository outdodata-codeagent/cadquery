FROM python:3.11-slim

WORKDIR /app

# Copy dependency manifest first to leverage Docker layer caching during installs.
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Bring in the rest of the backend sources.
COPY . /app

ENV CQ_TUTORIAL_CACHE=/app/.cache
EXPOSE 8000
CMD ["uvicorn", "fastapi_app:app", "--host", "0.0.0.0", "--port", "8000"]
