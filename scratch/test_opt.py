import cv2
import numpy as np
import potrace
import os

img_path = r'C:/Users/GOURAB/.gemini/antigravity/brain/2049cbf9-3507-44c4-a485-0883d2646c64/.user_uploaded/media_1787817497824.png'
ref_img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
h, w = ref_img.shape

# Let's test different opttolerance and alphamax settings in potrace to find the optimal balance
# between minimal nodes, ultra-clean geometry, and 100% exact fidelity.

scale = 8
up = cv2.resize(ref_img, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)
_, bin_up = cv2.threshold(up, 180, 255, cv2.THRESH_BINARY_INV)

for opt_tol in [0.2, 0.4, 0.6, 0.8, 1.0]:
    bmp = potrace.Bitmap(bin_up)
    path = bmp.trace(turdsize=10 * scale, alphamax=1.0, opttolerance=opt_tol)
    total_segs = sum(len(c.segments) for c in path.curves)
    print(f"opttolerance={opt_tol}: {len(path.curves)} curves, total segments={total_segs}")
