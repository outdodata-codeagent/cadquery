import cadquery as cq

holes = [(x, y) for x in [-20, 0, 20] for y in [-20, 0, 20]]
result = (
    cq.Workplane('XY')
    .box(80, 80, 10)
    .faces('>Z')
    .workplane()
    .pushPoints(holes)
    .hole(6)
)
