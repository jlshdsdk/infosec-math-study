import json,hashlib
from pathlib import Path
import fitz

ROOT=Path(__file__).resolve().parents[1]
invpath=ROOT/'.work/inventory.json'
inv=json.loads(invpath.read_text(encoding='utf-8'))
source=next(s for s in inv['sources'] if s['id']=='section3')
folder=ROOT/'.work/section3-full'
folder.mkdir(exist_ok=True)
doc=fitz.open(source['pdf'])
new=[]
for n,page in enumerate(doc):
    target=folder/f'{n+1:04}.png'
    pix=page.get_pixmap(matrix=fitz.Matrix(1280/page.rect.width,1280/page.rect.width),alpha=False)
    pix.save(target)
    key=hashlib.sha256(target.read_bytes()).hexdigest()[:20]
    inv['assets'][key]={'id':key,'path':str(target),'size':[pix.width,pix.height]}
    source['pages'][n]['asset']=key
    new.append(inv['assets'][key])
used={p['asset'] for s in inv['sources'] for p in s['pages']}
inv['assets']={k:v for k,v in inv['assets'].items() if k in used}
invpath.write_text(json.dumps(inv,ensure_ascii=False),encoding='utf-8')
(ROOT/'.work/section3-ocr-input.json').write_text(json.dumps(new,ensure_ascii=False),encoding='utf-8-sig')
print(f'Replaced {len(new)} low-resolution thumbnails with rendered source pages; assets {len(inv["assets"])}')
