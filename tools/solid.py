"""Clean chicken silhouette: the logo with its stencil lettering filled in (no letters, smooth edge), as PGM for potrace.
The letters cut through the outline, so fill_holes alone fails; a closing restricted to the lettering band bridges them."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert('RGBA'))[..., 3]
a = np.asarray(Image.fromarray(a).resize((a.shape[1] * 2, a.shape[0] * 2), Image.BICUBIC))
ink = a > 127
h, w = ink.shape
r = int(sys.argv[3]) if len(sys.argv) > 3 else 60
yy, xx = np.ogrid[-r:r + 1, -r:r + 1]
disk = xx * xx + yy * yy <= r * r
pad = r + 2
closed = ndimage.binary_closing(np.pad(ink, pad), structure=disk)[pad:-pad, pad:-pad]
band = np.zeros_like(ink)
band[int(h * .27):int(h * .78), int(w * .08):int(w * .97)] = True   # the lettering block, wing to chest
solid = ndimage.binary_fill_holes(ink | (closed & band))
# smooth the edge inside the band only (letter stubs leave dents and bumps); legs, beak and comb stay untouched
soft = ndimage.gaussian_filter(solid.astype(float), 24) > .5
sm = 36; yy, xx = np.ogrid[-sm:sm + 1, -sm:sm + 1]
soft = ndimage.binary_closing(ndimage.binary_opening(soft, structure=xx * xx + yy * yy <= sm * sm), structure=xx * xx + yy * yy <= sm * sm)
solid = np.where(band, soft, solid)
solid = ndimage.binary_opening(solid, iterations=3)
Image.fromarray(np.where(solid, 0, 255).astype('uint8')).save(out)
print(solid.shape, round(solid.mean(), 3))
