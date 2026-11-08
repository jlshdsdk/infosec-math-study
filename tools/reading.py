import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
inv=json.loads((ROOT/'.work/inventory.json').read_text(encoding='utf-8'))
def clean(t):return re.sub(r'\s+','',t).replace('·','.').replace('．','.')
oc={p.stem:json.loads(p.read_text(encoding='utf-8-sig')) for p in (ROOT/'.work/ocr').glob('*.json')}
out=ROOT/'.work/reading';out.mkdir(exist_ok=True)
for s in inv['sources']:
    groups=[];current=None
    for p in s['pages']:
        o=oc.get(p['asset']);text=clean(o['text']) if o else ''
        text=text.replace('智能信息处理教研室','')
        markers=[]
        for l in o.get('lines',[]) if o else []:
            t=clean(l['text'])
            if re.match(r'^(定义|定理|引理|推论|结论|例[0-9]|例题|思考|作业|练习|拓展题|课后练习)',t):
                markers.append(t)
        anchor=markers[0] if markers else ''
        m=re.match(r'(定义|定理|引理|例)([0-9][0-9.]*)',anchor)
        key=m.group(0).rstrip('.') if m else anchor[:14]
        if key and (current is None or key!=current['key']):
            current={'key':key,'p':p['page'],'end':p['page'],'text':text};groups.append(current)
        elif current:
            current['end']=p['page']
            if len(text)>len(current['text']):current['text']=text
    (out/(s['id']+'.txt')).write_text('\n\n'.join(f"p{g['p']}-{g['end']} {g['key']}\n{g['text']}" for g in groups),encoding='utf-8')
print('Reading files ready')
