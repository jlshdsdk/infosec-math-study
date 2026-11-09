"""Select a few traceable course frames for each guide; retain all frames in the viewer."""
import argparse,collections,json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'

def main(check=False):
    catalog=json.loads((PUBLIC/'data/catalog.json').read_text(encoding='utf-8'))
    rows=json.loads((PUBLIC/'data/coverage-audit.json').read_text(encoding='utf-8'))['records']
    sources={s['id']:json.loads((PUBLIC/'data/sources'/f'{s["id"]}.json').read_text(encoding='utf-8')) for s in catalog['sources']}
    ids=[l['id'] for c in catalog['chapters'] for s in c['sections'] for l in s['lessons']]
    candidates=collections.defaultdict(list)
    priority={'定义':0,'定理':1,'例题':2,'原页':3,'练习':4}
    for row in rows:
        if row['status']!='explained':continue
        ref=row['sources'][0]
        source=sources[ref['source']]
        page=source['pages'][ref['end']-1]
        candidates[row['guideTopic']].append({'originTopic':row['topic'],'headingIndex':row.get('headingIndex'),'source':ref['source'],'page':ref['end'],'asset':page['asset'],'type':row['type'],'label':row['label'],'priority':priority.get(row['type'],9)})
    result={}
    for topic in ids:
        options=candidates[topic]
        if not options:raise ValueError(f'{topic} has no traceable illustrated source')
        # Prefer specific, numbered records to a generic OCR heading, and avoid
        # giving a paragraph two pictures that represent the same source frame.
        best={}
        for item in options:
            key=item['headingIndex'] if item['headingIndex'] is not None else -1
            generic=item['label'] in {'定义','定理','例题','练习','思考'}
            score=(item['originTopic']!=topic,generic,item['priority'],item['page'])
            if key not in best or score<best[key][0]:best[key]=(score,item)
        chosen=[];used_keys=set();used_assets=set()
        def take(key):
            item=best[key][1]
            if key in used_keys or item['asset'] in used_assets:return False
            used_keys.add(key);used_assets.add(item['asset']);chosen.append(dict(item));return True
        # Keep an actual definition, a theorem and a worked example when they
        # exist in distinct sections, before using the remaining slots.
        for role in ('定义','定理','例题'):
            for key in sorted(best,key=lambda k:(best[k][0],k)):
                if best[key][1]['type']==role and take(key):break
        while len(chosen)<3:
            available=[key for key in best if key not in used_keys and best[key][1]['asset'] not in used_assets]
            if not available:break
            def spread(key):
                distance=min((abs(key-k) for k in used_keys),default=0)
                return (-distance,best[key][0],key)
            take(min(available,key=spread))
        chosen.sort(key=lambda i:i['headingIndex'] if i['headingIndex'] is not None else -1)
        for item in chosen:item.pop('priority')
        result[topic]=chosen
    path=PUBLIC/'data/inline-slides.json'
    if check:
        assert json.loads(path.read_text(encoding='utf-8'))==result,'讲解配图清单需要重新生成'
    else:path.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f'{len(result)} 篇讲解，共 {sum(map(len,result.values()))} 张可追溯的正文原图')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');main(parser.parse_args().check)
