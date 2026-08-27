
import math

# Baseline = 0, CapHeight = 240
# We can normalize coordinates where Y=0 is baseline (or Y=240 is baseline in SVG top-down coords)
# In SVG top-down coordinates:
# Top (Cap Height) Y_TOP = 130
# Baseline Y_BASE = 370
# Total Height = 240

Y_TOP = 130.0
Y_BASE = 370.0
H = Y_BASE - Y_TOP  # 240.0
STEM = 28.0         # Main vertical stroke width
HAIR = 2.4          # Hairline thickness
OVERSHOOT = 3.5     # Curves overshoot top and bottom
SERIF_LEN = 16.0    # Serif bracket extension
SERIF_H = 2.4       # Serif thickness

print(f'H={H}, STEM={STEM}, HAIR={HAIR}')
