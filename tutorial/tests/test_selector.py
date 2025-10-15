import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1].parent))

import cadquery as cq

from tutorial.sandbox.selector import apply_selection


def test_area_selector_filters_faces():
    shape = cq.Workplane('XY').box(20, 20, 10).val()
    faces, counts = apply_selection(shape, ".faces('>Z')")
    assert counts['faces'] == 1
    assert faces[0].Area() == faces[0].Area()


def test_invalid_expression_raises():
    shape = cq.Workplane('XY').box(10, 10, 10).val()
    try:
        apply_selection(shape, "__import__('os').system('echo nope')")
    except ValueError:
        return
    assert False, 'Unsafe expression should raise'
