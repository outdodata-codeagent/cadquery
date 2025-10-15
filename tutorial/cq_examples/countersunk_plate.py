import cadquery as cq

result = (
    cq.Workplane('XY')
    .box(100, 60, 12)
    .faces('>Z')
    .workplane()
    .pushPoints([(-30, -20), (-30, 20), (30, -20), (30, 20)])
    .cskHole(6, 12, 90)
)
