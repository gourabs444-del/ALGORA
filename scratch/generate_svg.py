import cv2
import numpy as np
import potrace
import os

img_path = r'C:/Users/GOURAB/.gemini/antigravity/brain/2049cbf9-3507-44c4-a485-0883d2646c64/.user_uploaded/media_1787817497824.png'
ref_img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
h, w = ref_img.shape

# 8x upscale for sub-pixel precision with lanczos filtering
scale = 8
up = cv2.resize(ref_img, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)

# We threshold so letters are True (foreground)
thresh_val = 180
bin_up = up < thresh_val

bmp = potrace.Bitmap(bin_up)
# Trace with high precision
path = bmp.trace(turdsize=10 * scale, alphamax=1.0, opttolerance=0.15)

# Separate letters by bounding box
curves = path.curves
# Exclude the full canvas border if present
valid_curves = []
for c in curves:
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
    
    # If it spans entire image, it's border
    if max_x - min_x > w * 0.95 and max_y - min_y > h * 0.95:
        continue
    valid_curves.append((min_x, max_x, min_y, max_y, c))

valid_curves = sorted(valid_curves, key=lambda x: x[0])
print(f'Valid letter contours found: {len(valid_curves)}')

def curve_to_svg_path(curve, s=scale):
    fs = curve.start_point
    p_str = f"M {fs.x/s:.3f},{fs.y/s:.3f} "
    for seg in curve.segments:
        if seg.is_corner:
            c = seg.c
            end = seg.end_point
            p_str += f"L {c.x/s:.3f},{c.y/s:.3f} L {end.x/s:.3f},{end.y/s:.3f} "
        else:
            c1 = seg.c1
            c2 = seg.c2
            end = seg.end_point
            p_str += f"C {c1.x/s:.3f},{c1.y/s:.3f} {c2.x/s:.3f},{c2.y/s:.3f} {end.x/s:.3f},{end.y/s:.3f} "
    p_str += "Z"
    return p_str

# Group by letter
# A1: curves 0, 1 (outer, inner)
# L:  curve 2
# G:  curve 3
# O:  curves 4, 5 (outer, inner)
# R:  curves 6, 7 (outer, inner)
# A2: curves 8, 9 (outer, inner)

letter_names = ['A', 'L', 'G', 'O', 'R', 'A']
# Assign curves to letter groups based on x center
letter_groups = {name: [] for name in ['A_1', 'L', 'G', 'O', 'R', 'A_2']}

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

for k, v in letter_groups.items():
    print(f'Group {k}: {len(v)} curves')

# Compute overall bounding box of the logo artwork
all_min_x = min(vc[0] for vc in valid_curves)
all_max_x = max(vc[1] for vc in valid_curves)
all_min_y = min(vc[2] for vc in valid_curves)
all_max_y = max(vc[3] for vc in valid_curves)
print(f'Artwork bounds: X=[{all_min_x:.2f}, {all_max_x:.2f}], Y=[{all_min_y:.2f}, {all_max_y:.2f}]')
print(f'Artwork size: {all_max_x - all_min_x:.2f} x {all_max_y - all_min_y:.2f}')

# Generate full page SVG (matching reference canvas 1024x682)
full_svg_paths = []
for k, clist in letter_groups.items():
    d_list = [curve_to_svg_path(c) for c in clist]
    full_svg_paths.append(f'  <g id="letter-{k}">\n    <path d="{" ".join(d_list)}" fill="#000000" fill-rule="evenodd"/>\n  </g>')

full_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <!-- ALGORA Luxury Wordmark - Recreated from reference -->
{chr(10).join(full_svg_paths)}
</svg>'''

# Also generate a tightly fitted / padded responsive vector asset version
pad = 20
crop_w = (all_max_x - all_min_x) + pad * 2
crop_h = (all_max_y - all_min_y) + pad * 2
view_x = all_min_x - pad
view_y = all_min_y - pad

cropped_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_x:.2f} {view_y:.2f} {crop_w:.2f} {crop_h:.2f}" width="{crop_w:.2f}" height="{crop_h:.2f}">
  <!-- ALGORA Luxury Wordmark (Fitted Vector Asset) -->
{chr(10).join(full_svg_paths)}
</svg>'''

# Save to destination D:\STACK\PORTFOLIO\SVG
os.makedirs(r'D:\STACK\PORTFOLIO\SVG', exist_ok=True)
with open(r'D:\STACK\PORTFOLIO\SVG\algora.svg', 'w') as f:
    f.write(full_svg)

with open(r'D:\STACK\PORTFOLIO\SVG\algora-wordmark.svg', 'w') as f:
    f.write(cropped_svg)

print('Saved SVGs to D:\STACK\PORTFOLIO\SVG')
