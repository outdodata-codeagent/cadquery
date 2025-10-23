import cadquery as cq

fin_count = 6
fin_spacing = 8
fin_width = 3
fin_height = 20
base = cq.Workplane('XY').box(60, 40, 6)

fins = (
    cq.Workplane('XY')
    .transformed(offset=(0, 0, 6))
    .rarray(fin_spacing, 1, fin_count, 1)
    .rect(fin_width, 38)
    .extrude(fin_height)
)

result = base.union(fins)
