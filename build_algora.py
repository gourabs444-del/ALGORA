# Complete Didone Wordmark Generator for ALGORA
import math
import os

# Target dimensions
VIEWBOX_W = 1800.0
VIEWBOX_H = 600.0

# Typography System: Cap Height = 260.0
Y_TOP = 170.0
Y_BASE = 430.0
H = Y_BASE - Y_TOP  # 260.0
Y_MID = (Y_TOP + Y_BASE) / 2.0  # 300.0

STEM = 32.0         # Master stem width
HAIR = 2.6          # Razor-sharp hairline
OVERSHOOT = 4.2     # Optical overshoot for curves
SERIF_LEN = 16.0    # Serif horizontal reach
SERIF_H = 2.6       # Serif hairline thickness
BRACKET_H = 8.0     # Sharp triangular bracket rise

def fmt(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.')

def make_A(x0):
    w = 166.0
    x_apex = x0 + w / 2.0
    
    # Apex top
    # Left hairline foot center: x0 + 24
    # Right stem foot center: x0 + w - 26
    x_l_foot = x0 + 24.0
    x_r_foot = x0 + w - 26.0
    
    # Waist (Crossbar)
    y_bar = Y_BASE - H * 0.34
    h_bar = HAIR
    
    # Slopes
    # Left hairline: Outer runs from (x_apex - 2.0, Y_TOP) to (x_l_foot - HAIR*0.8, Y_BASE)
    # Right stem: Outer runs from (x_apex + 2.0, Y_TOP) to (x_r_foot + STEM/2, Y_BASE)
    # Right stem inner: from (x_apex + 2.0 - HAIR, Y_TOP + 12) to (x_r_foot - STEM/2, Y_BASE)
    
    # Crossbar intersections:
    # Inner Right stem X at y:
    def in_r_x(y):
        t = (y - (Y_TOP + 12)) / (Y_BASE - (Y_TOP + 12))
        return (x_apex) + t * (x_r_foot - STEM/2 - (x_apex))
        
    def in_l_x(y):
        t = (y - (Y_TOP + 12)) / (Y_BASE - (Y_TOP + 12))
        return (x_apex - 2.0) + t * (x_l_foot + HAIR - (x_apex - 2.0))
        
    p = []
    # Outer path
    p.append(f'M {fmt(x_apex - 16.0)} {fmt(Y_TOP)}')  # Top apex serif left tip
    p.append(f'L {fmt(x_apex + 4.0)} {fmt(Y_TOP)}')    # Apex top right
    
    # Down right outer stem to right foot serif
    p.append(f'L {fmt(x_r_foot + STEM/2 - 2.0)} {fmt(Y_BASE - BRACKET_H)}')
    p.append(f'L {fmt(x_r_foot + STEM/2 + SERIF_LEN)} {fmt(Y_BASE)}')  # Right outer serif tip
    p.append(f'L {fmt(x_r_foot - STEM/2 - SERIF_LEN*0.6)} {fmt(Y_BASE)}')  # Right inner serif tip
    p.append(f'L {fmt(x_r_foot - STEM/2 + 2.0)} {fmt(Y_BASE - BRACKET_H)}')
    
    # Up to crossbar bottom-right
    p.append(f'L {fmt(in_r_x(y_bar + h_bar))} {fmt(y_bar + h_bar)}')
    # Crossbar bottom-left
    p.append(f'L {fmt(in_l_x(y_bar + h_bar))} {fmt(y_bar + h_bar)}')
    
    # Down to left inner foot serif
    p.append(f'L {fmt(x_l_foot + HAIR + SERIF_LEN*0.6)} {fmt(Y_BASE)}')
    p.append(f'L {fmt(x_l_foot - HAIR - SERIF_LEN)} {fmt(Y_BASE)}')     # Left outer serif tip
    p.append(f'L {fmt(x_l_foot - HAIR + 1.0)} {fmt(Y_BASE - BRACKET_H)}')
    
    # Up left hairline to apex serif
    p.append(f'L {fmt(x_apex - 16.0)} {fmt(Y_TOP + SERIF_H)}')
    p.append('Z')
    
    # Counter triangle
    y_apex_in = Y_TOP + 34.0
    x_apex_in = x_apex - 0.5
    p.append(f'M {fmt(x_apex_in)} {fmt(y_apex_in)}')
    p.append(f'L {fmt(in_l_x(y_bar))} {fmt(y_bar)}')
    p.append(f'L {fmt(in_r_x(y_bar))} {fmt(y_bar)}')
    p.append('Z')
    
    return ' '.join(p), w

def make_L(x0):
    w = 126.0
    stem_x = x0 + 16.0
    
    # L has vertical stem from (stem_x, Y_TOP) to (stem_x, Y_BASE)
    # Top serif: unilateral left serif to stem_x - SERIF_LEN, top flat at Y_TOP
    # Bottom left serif: left to stem_x - SERIF_LEN
    # Bottom arm: hairline along baseline to x0 + w
    # Arm terminal: tall vertical Didone triangular/slab serif rising to Y_BASE - 40.0
    
    arm_end = x0 + w
    spur_h = 38.0
    
    p = []
    p.append(f'M {fmt(stem_x - SERIF_LEN)} {fmt(Y_TOP)}')
    p.append(f'L {fmt(stem_x + STEM)} {fmt(Y_TOP)}')
    p.append(f'L {fmt(stem_x + STEM)} {fmt(Y_BASE - HAIR)}')
    p.append(f'L {fmt(arm_end - 6.0)} {fmt(Y_BASE - HAIR)}')
    # Up to terminal spur top
    p.append(f'L {fmt(arm_end - 6.0)} {fmt(Y_BASE - spur_h + 3.0)}')
    p.append(f'L {fmt(arm_end)} {fmt(Y_BASE - spur_h)}')
    p.append(f'L {fmt(arm_end)} {fmt(Y_BASE)}')
    p.append(f'L {fmt(stem_x - SERIF_LEN)} {fmt(Y_BASE)}')
    p.append(f'L {fmt(stem_x - SERIF_LEN)} {fmt(Y_BASE - SERIF_H)}')
    p.append(f'L {fmt(stem_x)} {fmt(Y_BASE - BRACKET_H)}')
    p.append(f'L {fmt(stem_x)} {fmt(Y_TOP + BRACKET_H)}')
    p.append(f'L {fmt(stem_x - SERIF_LEN)} {fmt(Y_TOP + SERIF_H)}')
    p.append('Z')
    
    return ' '.join(p), w

def make_O(x0):
    w = 178.0
    cx = x0 + w / 2.0
    cy = Y_MID
    
    rx_out = w / 2.0
    ry_out = H / 2.0 + OVERSHOOT
    
    rx_in = rx_out - STEM
    ry_in = ry_out - HAIR
    
    # Didone O: kappa parameters for extreme contrast vertical Didone curves
    # To get ultra-thin top/bottom hairlines and thick vertical belly, standard kappa ~ 0.55228475
    # For Didone, horizontal control handles on top/bottom are narrower (e.g. 0.44),
    # while vertical control handles on sides are taller (e.g. 0.60).
    
    k_x_out = rx_out * 0.52
    k_y_out = ry_out * 0.58
    
    k_x_in = rx_in * 0.40
    k_y_in = ry_in * 0.62
    
    p = []
    # Outer ellipse clockwise
    # Start at top center
    p.append(f'M {fmt(cx)} {fmt(cy - ry_out)}')
    p.append(f'C {fmt(cx + k_x_out)} {fmt(cy - ry_out)}, {fmt(cx + rx_out)} {fmt(cy - k_y_out)}, {fmt(cx + rx_out)} {fmt(cy)}')
    p.append(f'C {fmt(cx + rx_out)} {fmt(cy + k_y_out)}, {fmt(cx + k_x_out)} {fmt(cy + ry_out)}, {fmt(cx)} {fmt(cy + ry_out)}')
    p.append(f'C {fmt(cx - k_x_out)} {fmt(cy + ry_out)}, {fmt(cx - rx_out)} {fmt(cy + k_y_out)}, {fmt(cx - rx_out)} {fmt(cy)}')
    p.append(f'C {fmt(cx - rx_out)} {fmt(cy - k_y_out)}, {fmt(cx - k_x_out)} {fmt(cy - ry_out)}, {fmt(cx)} {fmt(cy - ry_out)}')
    p.append('Z')
    
    # Inner counter counter-clockwise
    p.append(f'M {fmt(cx)} {fmt(cy - ry_in)}')
    p.append(f'C {fmt(cx - k_x_in)} {fmt(cy - ry_in)}, {fmt(cx - rx_in)} {fmt(cy - k_y_in)}, {fmt(cx - rx_in)} {fmt(cy)}')
    p.append(f'C {fmt(cx - rx_in)} {fmt(cy + k_y_in)}, {fmt(cx - k_x_in)} {fmt(cy + ry_in)}, {fmt(cx)} {fmt(cy + ry_in)}')
    p.append(f'C {fmt(cx + k_x_in)} {fmt(cy + ry_in)}, {fmt(cx + rx_in)} {fmt(cy + k_y_in)}, {fmt(cx + rx_in)} {fmt(cy)}')
    p.append(f'C {fmt(cx + rx_in)} {fmt(cy - k_y_in)}, {fmt(cx + k_x_in)} {fmt(cy - ry_in)}, {fmt(cx)} {fmt(cy - ry_in)}')
    p.append('Z')
    
    return ' '.join(p), w

def make_G(x0):
    w = 176.0
    cx = x0 + (w - 10.0) / 2.0
    cy = Y_MID
    
    rx_out = (w - 10.0) / 2.0
    ry_out = H / 2.0 + OVERSHOOT
    
    rx_in = rx_out - STEM
    ry_in = ry_out - HAIR
    
    # Right stem & horizontal spur
    x_stem_r = x0 + w - 4.0
    x_stem_l = x_stem_r - STEM * 0.85
    y_spur_top = Y_MID - 2.0
    y_spur_bot = Y_MID + 18.0
    x_spur_in = cx - 4.0  # Horizontal spur extends well into the counter
    
    # Top terminal serif
    x_top_term = x0 + w - 16.0
    y_top_term = Y_TOP + 36.0
    
    # G path with Didone curves, upper triangular serif, bottom curve into vertical stem and horizontal spur
    p = []
    # Start at top terminal Didone triangular serif tip
    p.append(f'M {fmt(x_top_term)} {fmt(y_top_term)}')
    # Downward sharp beak/spur
    p.append(f'L {fmt(x_top_term + 1.0)} {fmt(y_top_term + 24.0)}')
    p.append(f'L {fmt(x_top_term - 5.0)} {fmt(y_top_term + 24.0)}')
    # Up inner curve
    p.append(f'C {fmt(x_top_term - 25.0)} {fmt(Y_TOP + 8.0)}, {fmt(cx + rx_in*0.5)} {fmt(cy - ry_in)}, {fmt(cx)} {fmt(cy - ry_in)}')
    # Inner left Didone belly
    p.append(f'C {fmt(cx - rx_in*0.4)} {fmt(cy - ry_in)}, {fmt(cx - rx_in)} {fmt(cy - ry_in*0.62)}, {fmt(cx - rx_in)} {fmt(cy)}')
    p.append(f'C {fmt(cx - rx_in)} {fmt(cy + ry_in*0.62)}, {fmt(cx - rx_in*0.4)} {fmt(cy + ry_in)}, {fmt(cx)} {fmt(cy + ry_in)}')
    # Bottom inner curve to spur junction
    p.append(f'C {fmt(cx + rx_in*0.45)} {fmt(cy + ry_in)}, {fmt(x_stem_l)} {fmt(Y_BASE - 20.0)}, {fmt(x_stem_l)} {fmt(y_spur_bot)}')
    # Horizontal spur into counter
    p.append(f'L {fmt(x_spur_in)} {fmt(y_spur_bot)}')
    p.append(f'L {fmt(x_spur_in)} {fmt(y_spur_top)}')
    p.append(f'L {fmt(x_stem_r)} {fmt(y_spur_top)}')
    # Down outer right stem
    p.append(f'L {fmt(x_stem_r)} {fmt(Y_BASE - 18.0)}')
    # Bottom outer curve
    p.append(f'C {fmt(x_stem_r)} {fmt(cy + ry_out*0.88)}, {fmt(cx + rx_out*0.55)} {fmt(cy + ry_out)}, {fmt(cx)} {fmt(cy + ry_out)}')
    # Outer left belly
    p.append(f'C {fmt(cx - rx_out*0.52)} {fmt(cy + ry_out)}, {fmt(cx - rx_out)} {fmt(cy + ry_out*0.58)}, {fmt(cx - rx_out)} {fmt(cy)}')
    p.append(f'C {fmt(cx - rx_out)} {fmt(cy - ry_out*0.58)}, {fmt(cx - rx_out*0.52)} {fmt(cy - ry_out)}, {fmt(cx)} {fmt(cy - ry_out)}')
    # Top outer curve to top terminal
    p.append(f'C {fmt(cx + rx_out*0.52)} {fmt(cy - ry_out)}, {fmt(x_top_term - 10.0)} {fmt(Y_TOP - 2.0)}, {fmt(x_top_term)} {fmt(y_top_term)}')
    p.append('Z')
    
    return ' '.join(p), w

def make_R(x0):
    w = 160.0
    stem_x = x0 + 16.0
    
    # Stem from Y_TOP to Y_BASE
    # Top serif: unilateral left
    # Bottom left serif: unilateral left
    # Upper bowl: from Y_TOP to Y_MID + 12.0
    # Bowl width: ~ 100.0
    # Curved leg: starts at (stem_x + STEM, Y_MID + 4) and sweeps down to (x0 + w, Y_BASE)
    
    y_waist = Y_MID + 12.0
    bowl_w = 98.0
    bowl_r_out = stem_x + bowl_w
    bowl_cy = (Y_TOP + y_waist) / 2.0
    bowl_ry = (y_waist - Y_TOP) / 2.0
    
    # Leg geometry: Couture S-curve flared leg
    # Starts at stem-waist junction
    # Gracefully flares out to the right with Didone contrast, ending in a sharp upturned flick / terminal
    leg_end_x = x0 + w
    leg_foot_y = Y_BASE
    
    p = []
    # Main outer trace
    # Top serif
    p.append(f'M {fmt(stem_x - SERIF_LEN)} {fmt(Y_TOP)}')
    p.append(f'L {fmt(bowl_r_out - 35.0)} {fmt(Y_TOP)}')
    # Outer upper bowl
    p.append(f'C {fmt(bowl_r_out - 6.0)} {fmt(Y_TOP)}, {fmt(bowl_r_out)} {fmt(bowl_cy - bowl_ry*0.5)}, {fmt(bowl_r_out)} {fmt(bowl_cy)}')
    p.append(f'C {fmt(bowl_r_out)} {fmt(bowl_cy + bowl_ry*0.5)}, {fmt(bowl_r_out - 12.0)} {fmt(y_waist)}, {fmt(stem_x + STEM + 10.0)} {fmt(y_waist)}')
    
    # Leg starts here
    # Upper sweep of leg:
    p.append(f'C {fmt(stem_x + STEM + 35.0)} {fmt(y_waist)}, {fmt(leg_end_x - 45.0)} {fmt(Y_BASE - 70.0)}, {fmt(leg_end_x - 12.0)} {fmt(leg_foot_y - 28.0)}')
    # Flare into upturned terminal
    p.append(f'C {fmt(leg_end_x - 4.0)} {fmt(leg_foot_y - 20.0)}, {fmt(leg_end_x)} {fmt(leg_foot_y - 12.0)}, {fmt(leg_end_x + 4.0)} {fmt(leg_foot_y - 20.0)}')
    p.append(f'L {fmt(leg_end_x + 4.0)} {fmt(leg_foot_y)}')
    # Foot flat baseline
    p.append(f'L {fmt(leg_end_x - 28.0)} {fmt(leg_foot_y)}')
    # Inner lower curve of leg
    p.append(f'C {fmt(leg_end_x - 30.0)} {fmt(leg_foot_y - 18.0)}, {fmt(stem_x + STEM + 28.0)} {fmt(Y_BASE - 60.0)}, {fmt(stem_x + STEM)} {fmt(y_waist + 8.0)}')
    
    # Down right side of vertical stem to bottom serif
    p.append(f'L {fmt(stem_x + STEM)} {fmt(Y_BASE)}')
    p.append(f'L {fmt(stem_x - SERIF_LEN)} {fmt(Y_BASE)}')
    p.append(f'L {fmt(stem_x - SERIF_LEN)} {fmt(Y_BASE - SERIF_H)}')
    p.append(f'L {fmt(stem_x)} {fmt(Y_BASE - BRACKET_H)}')
    p.append(f'L {fmt(stem_x)} {fmt(Y_TOP + BRACKET_H)}')
    p.append(f'L {fmt(stem_x - SERIF_LEN)} {fmt(Y_TOP + SERIF_H)}')
    p.append('Z')
    
    # Counter inside upper bowl
    p.append(f'M {fmt(stem_x + STEM)} {fmt(Y_TOP + HAIR)}')
    p.append(f'L {fmt(bowl_r_out - 38.0)} {fmt(Y_TOP + HAIR)}')
    p.append(f'C {fmt(bowl_r_out - STEM*0.9)} {fmt(Y_TOP + HAIR)}, {fmt(bowl_r_out - STEM*0.9)} {fmt(y_waist - HAIR)}, {fmt(bowl_r_out - 38.0)} {fmt(y_waist - HAIR)}')
    p.append(f'L {fmt(stem_x + STEM)} {fmt(y_waist - HAIR)}')
    p.append('Z')
    
    return ' '.join(p), w

print('All glyph functions defined')
