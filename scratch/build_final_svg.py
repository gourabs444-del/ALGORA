import cv2
import numpy as np
import potrace
import os

img_path = r'C:/Users/GOURAB/.gemini/antigravity/brain/2049cbf9-3507-44c4-a485-0883d2646c64/.user_uploaded/media_1787817497824.png'
ref_img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
h, w = ref_img.shape

# 8x sub-pixel upscaling with Lanczos interpolation
scale = 8
up = cv2.resize(ref_img, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)

# Threshold for clean vector outline
thresh_val = 180
bin_up = up < thresh_val

bmp = potrace.Bitmap(bin_up)
# opttolerance = 0.2 provides high fidelity while producing clean, smooth Bézier curves
path = bmp.trace(turdsize=10 * scale, alphamax=1.0, opttolerance=0.2)

# Extract and filter curves
valid_curves = []
for c in path.curves:
    pts = []
    fs = c.start_point
    pts.append((fs.x / scale, fs.y / scale))
    for seg in c.segments:
        if seg.is_corner:
            pts.append((seg.c.x / scale, seg.c.y / scale))
            pts.append((seg.end_point.x / scale, seg.end_point.y / scale))
        else:
            pts.append((seg.c1.x / scale, seg.c1.y / scale))
            pts.append((seg.c2.x / scale, seg.c2.y / scale))
            pts.append((seg.end_point.x / scale, seg.end_point.y / scale))
    min_x = min(p[0] for p in pts)
    max_x = max(p[0] for p in pts)
    min_y = min(p[1] for p in pts)
    max_y = max(p[1] for p in pts)
    
    # Ignore full image bounding box
    if max_x - min_x > w * 0.95 and max_y - min_y > h * 0.95:
        continue
    valid_curves.append((min_x, max_x, min_y, max_y, c))

valid_curves = sorted(valid_curves, key=lambda x: x[0])

def curve_to_d(curve, s=scale):
    fs = curve.start_point
    p_str = f"M{fs.x/s:.2f},{fs.y/s:.2f}"
    for seg in curve.segments:
        if seg.is_corner:
            c = seg.c
            end = seg.end_point
            p_str += f" L{c.x/s:.2f},{c.y/s:.2f} L{end.x/s:.2f},{end.y/s:.2f}"
        else:
            c1 = seg.c1
            c2 = seg.c2
            end = seg.end_point
            p_str += f" C{c1.x/s:.2f},{c1.y/s:.2f} {c2.x/s:.2f},{c2.y/s:.2f} {end.x/s:.2f},{end.y/s:.2f}"
    p_str += "Z"
    return p_str

# Assign curves to letters
letter_groups = {
    'A_1': [],
    'L': [],
    'G': [],
    'O': [],
    'R': [],
    'A_2': []
}

for min_x, max_x, min_y, max_y, c in valid_curves:
    cx = (min_x + max_x) / 2
    if cx < 240:
        letter_groups['A_1'].append(c)
    elif cx < 360:
        letter_groups['L'].append(c)
    elif cx < 520:
        letter_groups['G'].append(c)
    elif cx < 660:
        letter_groups['O'].append(c)
    elif cx < 800:
        letter_groups['R'].append(c)
    else:
        letter_groups['A_2'].append(c)

all_min_x = min(vc[0] for vc in valid_curves)
all_max_x = max(vc[1] for vc in valid_curves)
all_min_y = min(vc[2] for vc in valid_curves)
all_max_y = max(vc[3] for vc in valid_curves)

# Combine all curves for single unified path
all_d_parts = []
letter_g_elements = []

for k, clist in letter_groups.items():
    d_list = [curve_to_d(c) for c in clist]
    combined_letter_d = " ".join(d_list)
    all_d_parts.append(combined_letter_d)
    letter_g_elements.append(
        f'    <!-- Letter {k.replace("_", " ")} -->\n'
        f'    <g id="letter-{k}">\n'
        f'      <path d="{combined_letter_d}" />\n'
        f'    </g>'
    )

unified_d = " ".join(all_d_parts)

# 1. Full Canvas SVG (1024x682)
full_canvas_svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <!-- ALGORA Luxury Wordmark (Vector Re-creation) -->
  <g fill="#000000" fill-rule="evenodd">
{chr(10).join(letter_g_elements)}
  </g>
</svg>
'''

# 2. Tight Fitted Wordmark SVG
pad_x = 24.0
pad_y = 16.0
tight_x = all_min_x - pad_x
tight_y = all_min_y - pad_y
tight_w = (all_max_x - all_min_x) + pad_x * 2
tight_h = (all_max_y - all_min_y) + pad_y * 2

fitted_svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{tight_x:.2f} {tight_y:.2f} {tight_w:.2f} {tight_h:.2f}" width="{tight_w:.2f}" height="{tight_h:.2f}">
  <!-- ALGORA Luxury Wordmark (Production Asset) -->
  <g fill="#000000" fill-rule="evenodd">
{chr(10).join(letter_g_elements)}
  </g>
</svg>
'''

# 3. Clean Single-Path SVG (Zero overhead, maximum compatibility)
single_path_svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{tight_x:.2f} {tight_y:.2f} {tight_w:.2f} {tight_h:.2f}" width="{tight_w:.2f}" height="{tight_h:.2f}">
  <path d="{unified_d}" fill="#000000" fill-rule="evenodd"/>
</svg>
'''

out_dir = r'D:\STACK\PORTFOLIO\SVG'
os.makedirs(out_dir, exist_ok=True)

with open(os.path.join(out_dir, 'algora.svg'), 'w', encoding='utf-8') as f:
    f.write(full_canvas_svg)

with open(os.path.join(out_dir, 'algora-wordmark.svg'), 'w', encoding='utf-8') as f:
    f.write(fitted_svg)

with open(os.path.join(out_dir, 'algora-single-path.svg'), 'w', encoding='utf-8') as f:
    f.write(single_path_svg)

print("SVG files generated successfully in", out_dir)
