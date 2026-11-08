import json, sys, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
inv=json.loads((ROOT/'.work/inventory.json').read_text(encoding='utf-8'))
out=ROOT/'public/slides'

def convert(item):
    target=out/(item['id']+'.webp')
    if target.exists(): return target.stat().st_size
    with Image.open(item['path']) as im:
        im=im.convert('RGB')
        im.save(target,'WEBP',quality=88,method=4)
    return target.stat().st_size

t=time.time();total=0
with ThreadPoolExecutor(max_workers=6) as pool:
    for n,size in enumerate(pool.map(convert,inv['assets'].values()),1):
        total+=size
        if n%400==0: print(f'{n}/{len(inv["assets"])} images, {total/1e6:.1f} MB, {time.time()-t:.0f}s',flush=True)
print(f'Complete {len(inv["assets"])} assets {total/1e6:.1f} MB',flush=True)
