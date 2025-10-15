import os
import tempfile
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict

import cadquery as cq

CACHE_DIR = Path(os.environ.get('CQ_TUTORIAL_CACHE', Path(__file__).resolve().parent.parent / '.cache'))
CACHE_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class ModelRecord:
    model_id: str
    shape: cq.Shape
    mesh_path: Path
    meta: Dict
    subshape_index: Dict[int, str] = field(default_factory=dict)


class ModelStore:
    def __init__(self) -> None:
        self._store: Dict[str, ModelRecord] = {}

    def add(self, shape: cq.Shape, meta: Dict) -> ModelRecord:
        model_id = uuid.uuid4().hex
        mesh_path = CACHE_DIR / f"{model_id}.glb"
        cq.exporters.export(shape, str(mesh_path))
        record = ModelRecord(model_id=model_id, shape=shape, mesh_path=mesh_path, meta=meta)
        record.subshape_index = self._build_index(shape)
        self._store[model_id] = record
        return record

    def get(self, model_id: str) -> ModelRecord:
        return self._store[model_id]

    def _build_index(self, shape: cq.Shape) -> Dict[int, str]:
        index: Dict[int, str] = {}
        for face in shape.Faces():
            index[face.hashCode()] = f"face-{face.hashCode()}"
        for edge in shape.Edges():
            index[edge.hashCode()] = f"edge-{edge.hashCode()}"
        for vertex in shape.Vertices():
            index[vertex.hashCode()] = f"vertex-{vertex.hashCode()}"
        return index


MODEL_STORE = ModelStore()
