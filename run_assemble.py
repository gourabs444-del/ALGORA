
import build_algora as b

# Letters in ALGORA: A, L, G, O, R, A
# Let us define tracking and optical kerning

# Generous letter spacing for luxury editorial feel
BASE_TRACKING = 52.0

# Kerning adjustments between pairs: (L1, L2): offset
KERNING = {
    ('A', 'L'): -12.0,  # A slopes right, L has vertical stem
    ('L', 'G'): -8.0,   # L arm fits under G curve
    ('G', 'O'): 0.0,    # G stem to O curve
    ('O', 'R'): -4.0,   # O curve to R vertical stem
    ('R', 'A'): -10.0,  # R leg tucks towards A left hairline
}

glyphs_spec = ['A', 'L', 'G', 'O', 'R', 'A']
paths = []
widths = []

# First pass: compute positions
x_cursor = 0.0
positions = []

for i, char in enumerate(glyphs_spec):
    if i > 0:
        prev_char = glyphs_spec[i-1]
        kern = KERNING.get((prev_char, char), 0.0)
        x_cursor += BASE_TRACKING + kern
    positions.append(x_cursor)
    
    if char == 'A':
        p, w = b.make_A(x_cursor)
    elif char == 'L':
        p, w = b.make_L(x_cursor)
    elif char == 'G':
        p, w = b.make_G(x_cursor)
    elif char == 'O':
        p, w = b.make_O(x_cursor)
    elif char == 'R':
        p, w = b.make_R(x_cursor)
    
    paths.append(p)
    widths.append(w)
    x_cursor += w

total_word_width = x_cursor
print(f'Total word width: {total_word_width}')

# Target ViewBox
VIEWBOX_W = 1600.0
VIEWBOX_H = 500.0

# Center the wordmark horizontally
shift_x = (VIEWBOX_W - total_word_width) / 2.0
print(f'Shift X for centering: {shift_x}')
