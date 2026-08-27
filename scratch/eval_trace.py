import cv2
import numpy as np
import potrace
import os

img_path = r'C:/Users/GOURAB/.gemini/antigravity/brain/2049cbf9-3507-44c4-a485-0883d2646c64/.user_uploaded/media_1787817497824.png'
ref_img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
h, w = ref_img.shape

# Let's upscale using bicubic / lanczos
scale = 8
up = cv2.resize(ref_img, (w*scale, h*scale), interpolation=cv2.INTER_LANCZOS4)

# Test threshold
thresh_val = 180
bin_up = up < thresh_val

bmp = potrace.Bitmap(bin_up)
path = bmp.trace(turdsize=10*scale, alphamax=1.0, opttolerance=0.2)
print(f'Curves found: {len(path.curves)}')

# Let's inspect each curve's bounding box and classify by letter
curves_info = []
for i, curve in enumerate(path.curves):
    pts = []
    fs = curve.start_point
    pts.append((fs.x / scale, fs.y / scale))
    for segment in curve.segments:
        if segment.is_corner:
            pts.append((segment.c.x / scale, segment.c.y / scale))
            pts.append((segment.end_point.x / scale, segment.end_point.y / scale))
        else:
            pts.append((segment.c1.x / scale, segment.c1.y / scale))
            pts.append((segment.c2.x / scale, segment.c2.y / scale))
            pts.append((segment.end_point.x / scale, segment.end_point.y / scale))
    
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    curves_info.append({
        'index': i,
        'min_x': min(xs),
        'max_x': max(xs),
        'min_y': min(ys),
        'max_y': max(ys),
        'num_segments': len(curve.segments),
        'curve': curve
    })

curves_info = sorted(curves_info, key=lambda c: c['min_x'])
for c in curves_info:
    print(f"Curve: x=[{c['min_x']:.1f}, {c['max_x']:.1f}], y=[{c['min_y']:.1f}, {c['max_y']:.1f}], segments={c['num_segments']}")
