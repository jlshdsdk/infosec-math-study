import json,re,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
inv=json.loads((ROOT/'.work/inventory.json').read_text(encoding='utf-8'))
def clean(s): return re.sub(r'\s+','',s).replace('·','.').replace('．','.')
ocr={p.stem:json.loads(p.read_text(encoding='utf-8-sig')) for p in (ROOT/'.work/ocr').glob('*.json')}
out=[]
for s in sorted(inv['sources'],key=lambda x:(x['chapter'],x['id'])):
    out.append(f'\n===== {s["id"]} {s["title"]} ch{s["chapter"]} =====')
    seen=set()
    for p in s['pages']:
        o=ocr.get(p['asset'])
        if not o: continue
        text=clean(o['text'])
        lines=[clean(l['text']) for l in o['lines']]
        top=[]
        for line in o['lines']:
            if line['words'] and line['words'][0]['y'] < 165:
                t=clean(line['text'])
                if t and not re.search(r'智能|dongxc|吉林大学|单选题|多选题',t): top.append(t)
        title=' | '.join(top)
        if title and title not in seen:
            seen.add(title)
            out.append(f'p{p["page"]}: {title[:300]}')
    out.append('')
(ROOT/'.work/outline.txt').write_text('\n'.join(out),encoding='utf-8')
print(f'OCR {len(ocr)}; outline {len(out)} lines')
