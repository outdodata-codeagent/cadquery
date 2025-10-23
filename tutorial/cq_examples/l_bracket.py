import cadquery as cq

result = (
    cq.Workplane('XY')
    .box(80, 10, 60)
    .faces('<Y')
    .workplane()
    .rect(80, 10)
    .extrude(60)
    .faces('>Z')
    .workplane()
    .pushPoints([(-30, 0), (30, 0)])
    .hole(6)
)
