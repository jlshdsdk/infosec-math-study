"""Publish the reviewed source-to-guide ledger, with every original item accounted for."""
import argparse,collections,json,re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
VALID={'explained','duplicate','ocr-artifact','source-missing','needs-detail'}

def main(check=False):
    catalog=json.loads((PUBLIC/'data/catalog.json').read_text(encoding='utf-8'))
    lessons={p.stem:json.loads(p.read_text(encoding='utf-8')) for p in (PUBLIC/'data/lessons').glob('*.json')}
    sources={s['id']:s for s in catalog['sources']}
    rows=[]
    for suffix in ('12','34','8'):
        rows.extend(json.loads((ROOT/f'content/coverage-{suffix}.json').read_text(encoding='utf-8')))
    order={id:i for i,id in enumerate(l['id'] for c in catalog['chapters'] for s in c['sections'] for l in s['lessons'])}
    keys=set();items=0;uncovered=[]
    for row in rows:
        lesson=lessons[row['topic']]
        assert row['status'] in VALID,row
        assert row['type'] in {'定义','定理','例题','练习','原页'},row
        assert isinstance(row['label'],str) and row['label'].strip(),row
        assert isinstance(row.get('note',''),str),row
        assert row['sources'],row
        for ref in row['sources']:
            assert ref['source'] in sources,ref
            assert isinstance(ref['start'],int) and isinstance(ref['end'],int),ref
            assert 1<=ref['start']<=ref['end']<=sources[ref['source']]['pages'],ref
            assert any(r['source']==ref['source'] and r['start']<=ref['start']<=ref['end']<=r['end'] for r in lesson['refs']),(row['topic'],ref)
        guide_lesson=lessons[row.get('guideTopic') or row['topic']]
        row['guideTopic']=guide_lesson['id']
        headings=re.findall(r'^#{2,3}\s+(.+)$',guide_lesson['guide'],re.M)
        heading=row.get('guideHeading','').strip()
        if heading in headings:
            row['headingIndex']=headings.index(heading)
        elif heading in ('正文开头','导读开头','知识点导读','正文导读','概念导读'):
            row['headingIndex']=None
        elif not heading and row['status'] in {'ocr-artifact','source-missing'}:
            row['headingIndex']=None
        else:
            raise ValueError(f"{row['topic']} / {row['label']}: 在 {guide_lesson['id']} 找不到实际讲解小节 {heading!r}")
        row.update(chapter=lesson['chapter'],section=lesson['section'],topicTitle=lesson['title'])
    for id,lesson in lessons.items():
        candidates=[r for r in rows if r['topic']==id]
        for item in lesson['items']:
            items+=1
            key=(id,item['type'],item['title']);keys.add(key)
            matching=[r for r in candidates if r['type']==item['type'] and r['label']==item['title']]
            if not any(ref['source']==item['source'] and ref['start']<=item['start'] and item['end']<=ref['end'] for r in matching for ref in r['sources']):
                uncovered.append({'topic':id,'type':item['type'],'label':item['title'],'source':item['source'],'start':item['start'],'end':item['end']})
    if uncovered:
        (ROOT/'.work').mkdir(exist_ok=True)
        (ROOT/'.work/uncovered-items.json').write_text(json.dumps(uncovered,ensure_ascii=False,indent=2),encoding='utf-8')
        raise ValueError(f'{len(uncovered)} 个原页索引尚未在对应清单中核对；见 .work/uncovered-items.json')
    pending=[r for r in rows if r['status']=='needs-detail']
    if pending:raise ValueError(f'{len(pending)} 条讲解待补，不能作为完成版发布')
    rows.sort(key=lambda r:(order[r['topic']],r['sources'][0]['source'],r['sources'][0]['start'],r['type'],r['label']))
    stats={'originalItems':items,'labelGroups':len(keys),'records':len(rows),'statuses':dict(collections.Counter(r['status'] for r in rows))}
    target={'version':1,'date':'2026-11-09','stats':stats,'records':rows}
    path=PUBLIC/'data/coverage-audit.json'
    if check:
        assert json.loads(path.read_text(encoding='utf-8'))==target,'对应清单更改后须重新生成公开数据'
    else:path.write_text(json.dumps(target,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(json.dumps(stats,ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--check',action='store_true')
    main(parser.parse_args().check)
