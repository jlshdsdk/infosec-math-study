import re,json,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
inv=json.loads((ROOT/'.work/inventory.json').read_text(encoding='utf-8'))
def clean(t):return re.sub(r'\s+','',t).replace('·','.').replace('．','.').replace('，',',')
oc={p.stem:json.loads(p.read_text(encoding='utf-8-sig')) for p in (ROOT/'.work/ocr').glob('*.json')}
lines=[]
for s in sorted(inv['sources'],key=lambda x:(x['chapter'],x['id'])):
    lines.append(f'\n{s["id"]} {s["title"]}')
    seen=set()
    for p in s['pages']:
        o=oc.get(p['asset'])
        if not o: continue
        for l in o['lines']:
            t=clean(l['text'])
            if len(t)>4 and re.match(r'^(?:[1-48][.,][1-9](?:[.,][1-9])?(?![0-9])|[§&][1-9]|第[一二三四五六七八九十]+节)',t) and l['words'] and l['words'][0]['y']<180:
                key=t.split('设')[0]
                if key not in seen:
                    seen.add(key);lines.append(f'p{p["page"]} {t[:100]}')
(ROOT/'.work/headings.txt').write_text('\n'.join(lines),encoding='utf-8')
print('\n'.join(lines))
