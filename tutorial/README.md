# CadQuery Selection Tutorial

This directory hosts the standalone CadQuery selection tutorial. It contains the FastAPI backend, sandbox utilities, authored lesson data, reusable CadQuery example scripts, and the React front-end that lives in [`./web/`](./web/).

## Directory layout

```
/tutorial
├── Dockerfile           # FastAPI + CadQuery backend image
├── README.md            # You are here
├── cq_examples/         # Sample CadQuery models used for lessons/playground
├── data/                # JSON lesson definitions and example listings
├── fastapi_app.py       # FastAPI entry point
├── requirements.txt     # Backend Python dependencies
├── sandbox/             # Restricted execution utilities for user code/selectors
├── tests/               # Pytest suite exercising selector helpers
└── web/                 # React + Vite front-end (react-three-fiber viewer)
```

## Run with Docker Compose

From the repository root run:

```bash
docker-compose up --build
```

This launches both the backend (`tutorial-api` on http://localhost:8000) and the front-end (`web` on http://localhost:5173) with hot reloading enabled for local files.

## Local backend development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r tutorial/requirements.txt
uvicorn tutorial.fastapi_app:app --reload
```

The API is available at http://localhost:8000 with interactive Swagger docs under `/docs`.

## Local front-end development

```bash
cd tutorial/web
npm install
npm run dev -- --host
```

During development the Vite dev server proxies API calls to http://localhost:8000.

## Testing

Run the backend tests with:

```bash
pytest tutorial/tests
```

(Ensure CadQuery's OCP bindings are installed; see `tutorial/requirements.txt`.)

## Authoring new lessons

1. Create or update a CadQuery example under [`cq_examples/`](./cq_examples/).
2. Add a JSON lesson file inside [`data/lessons/`](./data/lessons/) referencing the example.
3. Restart the backend (or trigger an auto-reload) so the new lesson metadata is available to the UI.
