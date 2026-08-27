import xml.etree.ElementTree as ET
import cv2
import numpy as np

# Let's inspect the bounding boxes and vertices of each of the 6 paths in vtracer_clean.svg
tree = ET.parse('scratch/vtracer_clean.svg')
root = tree.getroot()
ns = {'svg': 'http://www.w3.org/2000/svg'}
paths = root.findall('.//svg:path', ns) or root.findall('.//path')

print(f"Found {len(paths)} paths:")
char_names = ['A (1)', 'L', 'G', 'O', 'R', 'A (2)']
for i, p in enumerate(paths):
    d = p.attrib['d']
    print(f"\n--- Letter {char_names[i]} ---")
    print(f"d command start: {d[:120]}...")
    print(f"d command end: {d[-60:]}")
