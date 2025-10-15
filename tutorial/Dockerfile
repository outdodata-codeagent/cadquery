FROM python:3.11-slim
WORKDIR /app
COPY tutorial/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY tutorial /app
ENV CQ_TUTORIAL_CACHE=/app/.cache
EXPOSE 8000
CMD ["uvicorn", "tutorial.fastapi_app:app", "--host", "0.0.0.0", "--port", "8000"]
