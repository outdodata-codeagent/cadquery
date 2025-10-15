import cadquery as cq

base = cq.Workplane('XY').box(120, 60, 12)
post = (
    cq.Workplane('XY')
    .workplane(offset=6)
    .pushPoints([(-40, -20), (-40, 20), (40, -20), (40, 20)])
    .circle(6)
    .extrude(30)
)

top = (
    cq.Workplane('XY')
    .workplane(offset=42)
    .rect(80, 40)
    .extrude(6)
)

result = base.union(post).union(top)
