import ast
import uuid
from pathlib import Path
from typing import Dict, List, Tuple

import cadquery as cq

from .model_store import CACHE_DIR

ALLOWED_AST_NODES = (
    ast.Expression,
    ast.Call,
    ast.Attribute,
    ast.Name,
    ast.Load,
    ast.Constant,
    ast.Tuple,
    ast.List,
    ast.keyword
)


def _validate_ast(node: ast.AST) -> None:
    for child in ast.walk(node):
        if not isinstance(child, ALLOWED_AST_NODES):
            raise ValueError('Unsupported selection expression')
        if isinstance(child, ast.Name) and child.id not in {'wp', 'cq'}:
            raise ValueError('Unsupported identifier in selection expression')


def apply_selection(base_shape: cq.Shape, selection: str, filters: Dict | None = None) -> Tuple[List[cq.Shape], Dict]:
    if not selection:
        raise ValueError('Selection string is required')
    expression = f"wp{selection}" if selection.strip().startswith('.') else f"wp.{selection}"
    node = ast.parse(expression, mode='eval')
    _validate_ast(node)
    wp = cq.Workplane('XY').newObject([base_shape])
    context = {'wp': wp, 'cq': cq}
    result = eval(compile(node, '<selection>', 'eval'), {'__builtins__': {}}, context)
    if not isinstance(result, cq.Workplane):
        raise ValueError('Selection must return a CadQuery Workplane')
    shapes = [cq.Shape.cast(obj) for obj in result.objects]

    if filters:
        shapes = [shape for shape in shapes if _passes_filters(shape, filters or {})]

    counts = {
        'faces': sum(1 for shape in shapes if shape.ShapeType() == 'Face'),
        'edges': sum(1 for shape in shapes if shape.ShapeType() == 'Edge'),
        'vertices': sum(1 for shape in shapes if shape.ShapeType() == 'Vertex')
    }
    return shapes, counts


def _passes_filters(shape: cq.Shape, filters: Dict) -> bool:
    if shape.ShapeType() == 'Face':
        area = shape.Area()
        if filters.get('minArea') and area < filters['minArea']:
            return False
        if filters.get('maxArea') and area > filters['maxArea']:
            return False
    if shape.ShapeType() == 'Edge':
        length = shape.Length()
        if filters.get('minLength') and length < filters['minLength']:
            return False
        if filters.get('maxLength') and length > filters['maxLength']:
            return False
    return True


def build_selection_preview(model_id: str, shapes: List[cq.Shape]) -> Path | None:
    if not shapes:
        return None
    compound = cq.Compound.makeCompound([shape.wrapped for shape in shapes])
    path = CACHE_DIR / f"{model_id}-selection-{uuid.uuid4().hex}.glb"
    cq.exporters.export(compound, str(path))
    return path
