import cadquery as cq

result = (
    cq.Workplane('XY')
    .cylinder(20, 40)
    .faces('>Z')
    .workplane()
    .circle(10)
    .extrude(20)
)
