import cadquery as cq

spokes = 8
outer = 50
hub = 15
thickness = 12

result = (
    cq.Workplane('XY')
    .circle(outer / 2)
    .extrude(thickness)
    .faces('>Z')
    .workplane()
    .polygon(6, 12)
    .cutThruAll()
    .faces('>Z')
    .workplane()
    .pushPoints([(0, 0)])
    .hole(hub)
)
