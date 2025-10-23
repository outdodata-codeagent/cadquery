import json
from pathlib import Path
from typing import Dict, List, Optional

import cadquery as cq
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, validator

from tutorial.sandbox.executor import execute_source
from tutorial.sandbox.model_store import MODEL_STORE
from tutorial.sandbox.selector import apply_selection, build_selection_preview

BASE_DIR = Path(__file__).resolve().parent
EXAMPLES_DIR = BASE_DIR / 'cq_examples'
LESSON_DIR = BASE_DIR / 'data' / 'lessons'
EXAMPLES_JSON = BASE_DIR / 'data' / 'examples.json'

app = FastAPI(title='CadQuery Selection Tutorial API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)


class CompileRequest(BaseModel):
    source: Optional[str]
    asset: Optional[str]

    @validator('source')
    def strip_source(cls, value):  # noqa: N805
        return value.strip() if isinstance(value, str) else value


class SelectionFilters(BaseModel):
    minArea: Optional[float]
    maxArea: Optional[float]
    minLength: Optional[float]
    maxLength: Optional[float]


class SelectionRequest(BaseModel):
    modelId: str
    selection: str
    filters: Optional[SelectionFilters]


def _load_examples() -> List[Dict]:
    with EXAMPLES_JSON.open() as handle:
        return json.load(handle)['examples']


def _load_lessons_index() -> List[Dict]:
    lessons = []
    for path in sorted(LESSON_DIR.glob('*.json')):
        with path.open() as handle:
            data = json.load(handle)
            lessons.append({'id': data['id'], 'title': data['title'], 'goal': data['goal']})
    return lessons


def _load_lesson(lesson_id: str) -> Dict:
    path = LESSON_DIR / f'{lesson_id}.json'
    if not path.exists():
        raise HTTPException(status_code=404, detail='Lesson not found')
    with path.open() as handle:
        return json.load(handle)


def _load_asset(asset_name: str) -> cq.Shape:
    asset_path = EXAMPLES_DIR / asset_name
    if not asset_path.exists():
        raise HTTPException(status_code=404, detail='Example not found')
    result = execute_source(asset_path.read_text())
    if result.error:
        raise HTTPException(status_code=400, detail=result.error)
    return result.shape


def _compile_from_source(source: str) -> cq.Shape:
    result = execute_source(source)
    if result.error:
        raise HTTPException(status_code=400, detail=result.error)
    return result.shape


def _compile_from_upload(upload: UploadFile) -> cq.Shape:
    suffix = Path(upload.filename or '').suffix.lower()
    with UploadFileWrapper(upload) as temp_path:
        if suffix in {'.step', '.stp'}:
            shape = cq.importers.importStep(str(temp_path))
            return cq.Shape.cast(shape.val() if hasattr(shape, 'val') else shape)
        if suffix == '.stl':
            return cq.importers.importShape(str(temp_path))
    raise HTTPException(status_code=400, detail='Unsupported upload type')


class UploadFileWrapper:
    def __init__(self, upload: UploadFile):
        self.upload = upload
        self.path: Optional[Path] = None

    def __enter__(self) -> Path:
        from tempfile import NamedTemporaryFile

        suffix = Path(self.upload.filename or 'upload').suffix
        with NamedTemporaryFile(delete=False, suffix=suffix) as handle:
            data = self.upload.file.read()
            handle.write(data)
            handle.flush()
            self.path = Path(handle.name)
        return self.path

    def __exit__(self, exc_type, exc, tb):  # noqa: ANN001
        if self.path and self.path.exists():
            self.path.unlink(missing_ok=True)


@app.get('/api/health')
async def health():
    return {'status': 'ok'}


@app.get('/api/examples')
async def examples():
    return {'examples': _load_examples()}


@app.get('/api/lessons')
async def lessons():
    return {'lessons': _load_lessons_index()}


@app.get('/api/lessons/{lesson_id}')
async def lesson_detail(lesson_id: str):
    return _load_lesson(lesson_id)


@app.post('/api/model/compile')
async def compile_model(payload: CompileRequest = Depends(), file: UploadFile | None = File(default=None)):
    shape: Optional[cq.Shape] = None
    if file is not None:
        shape = _compile_from_upload(file)
    elif payload.asset:
        shape = _load_asset(payload.asset)
    elif payload.source:
        shape = _compile_from_source(payload.source)
    else:
        raise HTTPException(status_code=400, detail='Provide source, asset, or file')

    meta = {
        'bbox': list(shape.BoundingBox().toTuple()),
        'area': float(shape.Area()),
        'volume': float(shape.Volume())
    }
    record = MODEL_STORE.add(shape, meta)
    return {'modelId': record.model_id, 'meshUrl': f"/api/model/{record.model_id}/mesh", 'meta': record.meta}


@app.get('/api/model/{model_id}/mesh')
async def download_mesh(model_id: str):
    record = MODEL_STORE.get(model_id)
    return FileResponse(record.mesh_path, media_type='model/gltf-binary')


@app.post('/api/selection/run')
async def run_selection(payload: SelectionRequest):
    try:
        record = MODEL_STORE.get(payload.modelId)
    except KeyError as exc:  # noqa: F841
        raise HTTPException(status_code=404, detail='Model not found') from exc
    try:
        shapes, counts = apply_selection(record.shape, payload.selection, payload.filters.dict() if payload.filters else None)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    items = []
    for shape in shapes:
        hash_code = shape.hashCode()
        shape_id = record.subshape_index.get(hash_code, f"shape-{hash_code}")
        items.append({'id': shape_id, 'type': shape.ShapeType().lower(), 'hash': hash_code})

    preview_path = build_selection_preview(record.model_id, shapes)
    preview_url = f"/api/selection/{record.model_id}/preview/{preview_path.name}" if preview_path else None

    return {
        'items': items,
        'counts': counts,
        'previewMeshUrl': preview_url
    }


@app.get('/api/selection/{model_id}/preview/{filename}')
async def download_selection_preview(model_id: str, filename: str):
    record = MODEL_STORE.get(model_id)
    path = record.mesh_path.parent / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail='Preview not found')
    return FileResponse(path, media_type='model/gltf-binary')
