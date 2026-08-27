import cv2
import numpy as np
import potrace
import vtracer

img_path = r'C:/Users/GOURAB/.gemini/antigravity/brain/2049cbf9-3507-44c4-a485-0883d2646c64/.user_uploaded/media_1787817497824.png'

# 1. Test vtracer
vtracer.convert_image_to_svg_py(
    img_path,
    'scratch/vtracer_test.svg',
    colormode='binary',
    hierarchical='stacked',
    mode='spline',
    filter_speckle=4,
    color_precision=6,
    layer_difference=16,
    corner_threshold=60,
    length_threshold=4.0,
    max_iterations=10,
    splice_threshold=45,
    path_precision=3
)
print('vtracer generated')

# 2. Test Potrace with upscale
img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
scale = 8
up_img = cv2.resize(img, (img.shape[1]*scale, img.shape[0]*scale), interpolation=cv2.INTER_LANCZOS4)
# clean threshold
_, bin_up = cv2.threshold(up_img, 180, 255, cv2.THRESH_BINARY_INV)

bmp = potrace.Bitmap(bin_up > 0)
path = bmp.trace(turdsize=16*scale, alphamax=1.0, opttolerance=0.1)

svg_parts = []
for curve in path.curves:
    fs = curve.start_point
    p_str = f"M {fs.x/scale:.3f},{fs.y/scale:.3f} "
    for segment in curve.segments:
        if segment.is_corner:
            c = segment.c
            end = segment.end_point
            p_str += f"L {c.x/scale:.3f},{c.y/scale:.3f} L {end.x/scale:.3f},{end.y/scale:.3f} "
        else:
            c1 = segment.c1
            c2 = segment.c2
            end = segment.end_point
            p_str += f"C {c1.x/scale:.3f},{c1.y/scale:.3f} {c2.x/scale:.3f},{c2.y/scale:.3f} {end.x/scale:.3f},{end.y/scale:.3f} "
    p_str += "Z"
    svg_parts.append(p_str)

full_d = " ".join(svg_parts)
svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {img.shape[1]} {img.shape[0]}" width="{img.shape[1]}" height="{img.shape[0]}">
  <path d="{full_d}" fill="#000000" fill-rule="evenodd"/>
</svg>'''

with open('scratch/potrace_test.svg', 'w') as f:
    f.write(svg_content)

print('potrace generated')
