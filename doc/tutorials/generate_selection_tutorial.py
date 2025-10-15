"""Utility for generating a CadQuery selection tutorial markdown document.

This script writes a pre-authored tutorial that introduces CadQuery's
selection system, progressing from basic operations to more advanced
scenarios. The markdown content is not stored in the repository; instead,
users can invoke this script to produce a downloadable document wherever
they need it.
"""

from __future__ import annotations

import argparse
from pathlib import Path

TUTORIAL_CONTENT = """# CadQuery Selection Tutorial

CadQuery's selection system gives you precise control over which geometry
you modify. This tutorial guides you from the basics of picking faces and
edges to more advanced selector logic that handles dynamic models and
assemblies.

## Prerequisites

* CadQuery 2.x installed (for example via the `cadquery` Python package or the
  [CadQuery GUI](https://github.com/CadQuery/CQ-Editor)).
* Familiarity with Python and the CadQuery `Workplane` API.
* Optional: the `show_object` helper from the CQ-Editor or the
  `cadquery.occ_impl.exporters` module for viewing results.

Each example uses the conventional import:

```python
import cadquery as cq
```

## 1. Getting Started with Basic Selections

The simplest way to select geometry is with the workplane helpers such as
`faces`, `edges`, and `vertices`. These methods accept selector strings.

```python
result = (
    cq.Workplane("XY")
    .box(40, 30, 10)
    .faces("+Z")  # select the top face
    .workplane()
    .circle(10)
    .cutBlind(-5)
)
```

Selector strings are built from:

* An orientation prefix (`+` or `-`) to choose the positive/negative side of an
  axis.
* An axis character (`X`, `Y`, `Z`).
* Optional chaining using `|` (logical OR) or `>` (next selection step).

Common basic selectors:

| Selector | Meaning |
|----------|---------|
| `"+Z"`   | The face whose normal points along +Z. |
| `"<Z"`   | The face whose normal points opposite +Z (same as `"-Z"`). |
| `"|Z"`   | All faces perpendicular to Z. |
| `"@origin"` | The vertex at the world origin. |
| `"(>Y and +Z)"` | Chained expression: start with faces parallel to Y, then choose the one facing +Z. |

### 1.1 Selecting Edges and Vertices

```python
hole_pattern = (
    cq.Workplane("XY")
    .box(40, 30, 10)
    .edges("|Z")  # all vertical edges
    .fillet(2)
)
```

Use `vertices` for points. When you need all vertices of an edge selection,
chain with `vertices()`.

```python
points = (
    cq.Workplane("XY")
    .box(40, 30, 10)
    .faces("+Z")
    .vertices()  # every vertex on the top face
)
```

## 2. Using Named Selections

When geometry must be reused later, give it a name. Named selections are
especially helpful in parametric models where the target face or edge might
change after feature updates.

```python
result = (
    cq.Workplane("XY")
    .box(60, 40, 15)
    .faces("+Z").tag("top")
    .workplaneFromTagged("top")
    .circle(8)
    .cutBlind(-15)
)
```

`tag` marks the current selection, while `workplaneFromTagged` reorients the
workplane on that selection later in the model.

## 3. Filtered Selectors and Logical Expressions

CadQuery selectors support boolean expressions with `and`, `or`, and `not`.
You can filter by geometric properties such as area, length, or position.

```python
result = (
    cq.Workplane("XY")
    .box(60, 30, 20)
    .faces("|Z")
    .faces(">Y")  # chained to keep the far side wall
    .faces("+Z or -Z")  # combine selections
)
```

For more complex filters, use the object filter API:

```python
thick_edges = (
    cq.Workplane("XY")
    .box(60, 30, 20)
    .edges("|Z")
    .filter(lambda e: e.Length() > 25)
)
```

## 4. Working with Selectors Module

CadQuery exposes reusable selector classes in `cadquery.selectors`. They are
powerful when you need repeatable logic or selections that depend on spatial
relationships.

```python
from cadquery import selectors

result = (
    cq.Workplane("XY")
    .box(60, 40, 20)
    .faces(selectors.DirectionSelector((0, 0, 1)))  # +Z faces
    .vertices(selectors.BoxSelector((-20, -20, 10), (20, 20, 20)))
)
```

Common selector classes:

* `DirectionSelector(direction_vector, tol=1e-6)` – normals aligned with a
  vector.
* `BoxSelector(min_point, max_point)` – geometry inside an axis-aligned box.
* `PlaneSelector(origin, normal)` – objects on a plane.
* `StringSyntaxSelector("+Z")` – use when you prefer dynamic construction of
  text selectors.

Selectors can be combined with the `|` and `&` operators when using class-based
selectors:

```python
from cadquery import selectors as s

selector = s.DirectionSelector((0, 0, 1)) & s.AreaSelector(min=200)
result = cq.Workplane("XY").box(80, 60, 10).faces(selector)
```

## 5. Traversing Assemblies and Compounds

When working with `Assembly` objects, use `selectGeometry` and
`collectSolids` helpers. They accept the same selector language but operate on
nested sub-assemblies.

```python
assembly = cq.Assembly()
base = cq.Workplane("XY").box(80, 50, 10)
post = cq.Workplane("XY").workplane(offset=10).circle(8).extrude(40)
assembly.add(base, name="base")
assembly.add(post, name="post", loc=cq.Location(cq.Vector(0, 0, 10)))

selected = assembly.selectGeometry("post", kind="faces", selector="+Z")
```

`selectGeometry` traverses the assembly tree; provide the part name to limit the
search, or omit it to search the whole assembly. The return value is a list of
CadQuery shapes matching the criteria.

## 6. Dynamic Models and Robust Selections

Parametric changes can reorder faces and edges. To create robust selectors:

1. Prefer named selections for features that will be reused.
2. Use geometric filters (e.g., `AreaSelector`, `RadiusSelector`) rather than
   relying on index order.
3. When necessary, derive reference planes from stable geometry such as the
   origin or input sketch.

```python
def make_plate(length=80, width=60, height=12, hole_spacing=40):
    plate = cq.Workplane("XY").box(length, width, height)
    top = plate.faces("+Z").tag("top")
    hole_centers = (
        top.workplaneFromTagged("top")
        .rect(hole_spacing, hole_spacing, forConstruction=True)
        .vertices()
    )
    return hole_centers.circle(4).cutThruAll()
```

`forConstruction=True` builds reference geometry that survives changes in
dimensions, keeping the vertex selection stable.

## 7. Debugging Selections

When a selector fails, use these techniques:

* `val().exportStep("debug.step")` to inspect the result in a CAD viewer.
* `objects = workplane.objects` to access the current stack and verify the
  selected geometry.
* `cq.Shape.toSvg()` or `show_object` for quick visualization.
* Insert `.size()` after a selection to ensure you have the expected number of
  entities.

```python
selected_count = (
    cq.Workplane("XY")
    .box(40, 30, 10)
    .faces("+Z")
    .size()
)
print(f"Faces selected: {selected_count}")
```

## 8. Advanced Example: Combining Multiple Selection Strategies

This example builds a heat sink with fins and mounting holes, showcasing chained
selectors, named references, and class-based filters.

```python
from cadquery import selectors as s

def make_heat_sink(fin_count=5):
    base = cq.Workplane("XY").box(80, 80, 8)
    base.faces("+Z").tag("top")

    fins = (
        base.workplaneFromTagged("top")
        .rarray(10, 20, fin_count, 2)
        .rect(6, 18)
        .extrude(20)
    )

    holes = (
        base.workplaneFromTagged("top")
        .rect(60, 60, forConstruction=True)
        .vertices()
        .hole(5)
    )

    chamfer_selector = s.DirectionSelector((0, 0, 1)) & s.AreaSelector(max=200)
    finished = fins.faces(chamfer_selector).chamfer(0.8)

    return finished.union(holes)
```

Key ideas demonstrated:

* Named selections (`tag`) anchor the top face before modifying it.
* `rarray` generates a rectangular pattern used to place fins.
* Class-based selectors trim only the fin tips based on orientation and area.

## 9. Further Reading and Tools

* CadQuery documentation on [selectors](https://cadquery.readthedocs.io/en/latest/selectors.html).
* `cadquery.selectors` module reference for available selector classes.
* CQ-Editor provides a selector inspector that visualizes the current selection.
* Explore the [CadQuery examples repository](https://github.com/CadQuery/cadquery/tree/master/examples)
  for more selection patterns in real models.

## 10. Next Steps

Practice by:

1. Rebuilding an existing model with named selectors.
2. Creating a function that selects faces by area range and applies surface
   treatments (fillets or chamfers).
3. Experimenting with selectors on assembly hierarchies to understand how names
   and locations influence results.

With a firm grasp of selectors, you can build resilient CadQuery models that
remain stable even as dimensions and design intent evolve.
"""


def write_tutorial(output: Path, force: bool = False) -> Path:
    """Write the tutorial markdown content to *output*.

    Parameters
    ----------
    output:
        Target path or directory for the generated markdown file.
    force:
        If ``True`` overwrite an existing file, otherwise raise an error when the
        destination already exists.
    """

    output = Path(output)
    if output.is_dir():
        output = output / "cadquery_selection_tutorial.md"

    if output.exists() and not force:
        raise FileExistsError(
            f"Refusing to overwrite existing file: {output}. Use --force to overwrite."
        )

    output.write_text(TUTORIAL_CONTENT, encoding="utf-8")
    return output


def main(argv: list[str] | None = None) -> None:
    """Console script entry point."""

    parser = argparse.ArgumentParser(
        description=(
            "Generate the CadQuery selection tutorial markdown file without "
            "storing it in the repository."
        )
    )
    parser.add_argument(
        "output",
        nargs="?",
        default="cadquery_selection_tutorial.md",
        help=(
            "Output path for the markdown document. If a directory is provided, "
            "the tutorial will be created inside it with a default filename."
        ),
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite the destination file if it already exists.",
    )

    args = parser.parse_args(argv)

    try:
        destination = write_tutorial(Path(args.output), force=args.force)
    except FileExistsError as exc:
        parser.error(str(exc))

    print(f"Tutorial written to {destination.resolve()}")


if __name__ == "__main__":  # pragma: no cover
    main()
