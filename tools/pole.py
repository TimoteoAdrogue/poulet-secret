"""Deepest point of the chicken (farthest from any edge or letter): the hero zooms through it."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
ink = np.asarray(Image.open(sys.argv[1])) < 128            # logo.pgm: black = red ink of the logo
dist = ndimage.distance_transform_edt(ink)
h, w = ink.shape
upper = dist.copy(); upper[int(h * .3):] = 0               # neck/head region, clear of the lettering
for name, d in (('anywhere', dist), ('upper', upper)):
    y, x = np.unravel_index(np.argmax(d), d.shape)
    print(name, 'x', x, 'y', y, 'radius', round(float(d[y, x])))
