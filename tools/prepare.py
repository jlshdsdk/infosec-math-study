import os, json, hashlib, re, time
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
TEMP = Path(os.environ['TEMP']) / 'codex-yuketang'
PDFROOT = Path.home() / 'Desktop' / '信息安全数学基础'
WORK = ROOT / '.work'
WORK.mkdir(exist_ok=True)

def inventory():
    sources, assets = [], {}
    pdfs = {p.stem:p for p in PDFROOT.rglob('*.pdf')}
    for f in sorted(TEMP.glob('*.json')):
        raw = json.loads(f.read_text(encoding='utf-8-sig'))
        if not isinstance(raw,dict) or not isinstance(raw.get('data'),dict): continue
        d=raw['data'].get('result')
        if not isinstance(d,dict) or not d.get('slides') or not d.get('title'): continue
        title=d['title']
        if title not in pdfs: raise RuntimeError(title)
        pdf=pdfs[title]
        chapter={'第一':1,'第二':2,'第三':3,'第四':4,'第八':8}[pdf.parent.name[:2]]
        pages=[]
        for p in d['slides']:
            img=TEMP/f.stem/f"{p['page']:04}.jpg"
            if not img.exists(): raise RuntimeError(str(img))
            key=hashlib.sha256(img.read_bytes()).hexdigest()[:20]
            if key not in assets:
                with Image.open(img) as im: size=im.size
                assets[key]={'id':key,'path':str(img),'size':size}
            pages.append({'page':p['page'],'asset':key,'cover':int(re.search(r'cover(\d+)',p['url']).group(1)) if re.search(r'cover(\d+)',p['url']) else None})
        sources.append({'id':f.stem,'title':title,'chapter':chapter,'pdf':str(pdf),'pages':pages})
    assert len(sources)==17,len(sources)
    assert sum(len(s['pages']) for s in sources)==9024
    (WORK/'inventory.json').write_text(json.dumps({'sources':sources,'assets':assets},ensure_ascii=False),encoding='utf-8')
    (WORK/'ocr-input.json').write_text(json.dumps(list(assets.values()),ensure_ascii=False),encoding='utf-8-sig')
    print(json.dumps({'sources':[(s['id'],s['title'],s['chapter'],len(s['pages'])) for s in sources],'assets':len(assets)},ensure_ascii=False),flush=True)
    samples=list(sources[1]['pages'][:24])
    font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',15)
    sheet=Image.new('RGB',(4*410,6*330),'#eee')
    draw=ImageDraw.Draw(sheet)
    for n,p in enumerate(samples):
        im=Image.open(assets[p['asset']]['path']).convert('RGB'); im.thumbnail((400,294))
        x=(n%4)*410;y=(n//4)*330
        sheet.paste(im,(x,y+26));draw.text((x+5,y+4),f"PDF {p['page']} / cover{p['cover']}",font=font,fill='black')
    sheet.save(WORK/'contact.jpg',quality=90)

if __name__=='__main__': inventory()
