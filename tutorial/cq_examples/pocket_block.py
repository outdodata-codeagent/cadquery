import cadquery as cq

result = (
    cq.Workplane('XY')
    .box(80, 50, 20)
    .faces('>Z')
    .workplane()
    .rect(60, 30)
    .cutBlind(-10)
    .faces('>Z')
    .workplane(offset=-5)
    .rect(30, 15)
    .cutBlind(-5)
)
