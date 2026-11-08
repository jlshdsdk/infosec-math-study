import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
inv=json.loads((ROOT/'.work/inventory.json').read_text(encoding='utf-8'))

def check(item):
    file=ROOT/'public/slides'/(item['id']+'.webp')
    with Image.open(file) as im:
        assert list(im.size)==item['size'],file
        im.verify()
    return file.stat().st_size

with ThreadPoolExecutor(max_workers=8) as pool:
    sizes=list(pool.map(check,inv['assets'].values()))
print(f'All {len(sizes)} referenced images decode correctly; {sum(sizes)/1e6:.1f} MB')
