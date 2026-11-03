"""Logo alpha -> solid chicken silhouette (text holes filled) and logo-with-text, as PGM for potrace."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, out_dir = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert('RGBA'))[..., 3]
a = np.asarray(Image.fromarray(a).resize((a.shape[1] * 2, a.shape[0] * 2), Image.BICUBIC))
ink = a > 127
solid = ndimage.binary_fill_holes(ink)
solid = ndimage.binary_opening(solid, iterations=2)          # drop the distressed speckle on the edge
for name, m in (('solid', solid), ('logo', ink)):
    Image.fromarray(np.where(m, 0, 255).astype('uint8')).save(f'{out_dir}/{name}.pgm')
print(a.shape)
letters = ndimage.binary_opening(solid & ~ink, iterations=1)
Image.fromarray(np.where(letters, 0, 255).astype('uint8')).save(f'{out_dir}/letters.pgm')
