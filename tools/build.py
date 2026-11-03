"""index.src.html + the traced logo path -> index.html (the path is 100 KB, kept out of the editable source)."""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
src = (root / 'docs/index.src.html').read_text()
path = (root / 'tools/chicken-path.d').read_text().strip()
(root / 'docs/index.html').write_text(src.replace('<!--CHK_PATH-->', path))
print('index.html', len(src) + len(path))
