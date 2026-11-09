"""Build an auditable static corpus from the 17 locally saved source groups."""
import argparse,collections,hashlib,json,re,shutil,sys
from pathlib import Path
from syllabus import CHAPTERS,SECTIONS,TOPICS,RANGES

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
WORK=ROOT/'.work'

def dump(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

def clean(t):
    return re.sub(r'\s+','',t).replace('·','.').replace('．','.').replace('。','。')

def marker(line):
    t=clean(line)
    if re.match(r'^例[0-9]{5}',t): return None
    m=re.match(r'^(定义|定理|引理|推论|例题|例)\s*([0-9]+(?:[.,][0-9]+){0,3})?',t)
    if m:
        kind=m[1];label=m[2] or ''
        if kind=='例' and not label:return None
        title=kind+(' '+label.replace(',','.') if label else '')
        return ('例题' if kind in ['例','例题'] else '定理' if kind in ['引理','推论','定理'] else '定义',title)
    m=re.match(r'^(思考题|思考|练习题|练习|课后练习|课后思考|拓展题|作业|填空题|单选题|多选题)',t)
    if m:return ('练习',m[1])
    return None

def load_guides():
    guides={}
    for file in sorted((ROOT/'content').glob('guides-*.md')):
        text=file.read_text(encoding='utf-8')
        for match in re.finditer(r'^## ([a-z0-9-]+)\s*\n(.*?)(?=^## |\Z)',text,re.M|re.S):
            if match[1] in guides:raise ValueError(f'Duplicate guide {match[1]}')
            guides[match[1]]=match[2].strip()
    return guides

def build(draft=False):
    inv=json.loads((WORK/'inventory.json').read_text(encoding='utf-8'))
    ocr={p.stem:json.loads(p.read_text(encoding='utf-8-sig')) for p in (WORK/'ocr').glob('*.json')}
    guides=load_guides()
    lessons={id:{'id':id,'title':title,'section':section,'chapter':section.split('.')[0],'guide':guides.get(id,''),'refs':[],'items':[],'pages':0} for id,section,title in TOPICS}
    missing=[id for id,l in lessons.items() if not l['guide']]
    if missing and not draft:raise ValueError(f'Missing authored guides: {missing}')
    if any(p['asset'] not in ocr for s in inv['sources'] for p in s['pages']):raise ValueError('Missing OCR pages')
    search=[];sources=[];evidence=[]
    total=0
    for source in inv['sources']:
        sid=source['id'];pages=source['pages'];boundaries=RANGES[sid]
        # The 11/4 classroom used two different decks. Historical download
        # combined their slide frames, so preserve stable global pages and IDs
        # while exposing the real source deck boundaries to readers.
        if sid=='chapter8-4':
            source={**source,'title':'11月4日授课','segments':[
                {'title':'第八章-4-原版','start':1,'end':320},
                {'title':'第八章-5-原版','start':321,'end':625},
            ]}
        assert boundaries[0][0]==1
        assert all(a[0]<b[0] for a,b in zip(boundaries,boundaries[1:]))
        assert boundaries[-1][0]<=len(pages)
        src={'id':sid,'title':source['title'],'pages':[]}
        if source.get('segments'):src['segments']=source['segments']
        for b,(start,lessonid) in enumerate(boundaries):
            end=boundaries[b+1][0]-1 if b+1<len(boundaries) else len(pages)
            lesson=lessons[lessonid]
            lesson['refs'].append({'source':sid,'title':source['title'],'start':start,'end':end})
            lesson['pages']+=end-start+1
            # Multiple definitions/theorems/examples on one frame remain separately indexed.
            groups=[];last={}
            for page in pages[start-1:end]:
                p=page['page'];asset=page['asset'];original=ocr[asset]
                text=clean(original['text'])
                found={m for line in original.get('lines',[]) if (m:=marker(line['text']))}
                tags=sorted({m[0] for m in found})
                src['pages'].append({'page':p,'asset':asset,'text':text,'lesson':lessonid,'tags':tags})
                search.append({'lesson':lessonid,'title':lesson['title'],'type':'原页','text':text,'source':sid,'page':p})
                for kind,label in sorted(found):
                    key=(kind,label)
                    g=last.get(key)
                    if g is None or p-g['end']>4:
                        g={'id':f'{sid}-{p}-{len(groups)}','title':label,'type':kind,'source':sid,'start':p,'end':p,'asset':asset,'summary':text[:900],'frames':1}
                        groups.append(g);last[key]=g
                    else:
                        g['end']=p;g['frames']=p-g['start']+1
                        if len(text)>len(g['summary']):g['asset']=asset;g['summary']=text[:900]
            if not groups:
                page=pages[end-1]
                groups=[{'id':f'{sid}-{start}-page','title':lesson['title'],'type':'原页','source':sid,'start':start,'end':end,'asset':page['asset'],'summary':'','frames':end-start+1}]
            lesson['items'].extend(groups)
            evidence.append({'source':sid,'file':source['title']+'.pdf','start':start,'end':end,'chapter':lesson['chapter'],'section':lesson['section'],'lesson':lessonid,'topic':lesson['title']})
        src['pages'].sort(key=lambda p:p['page'])
        assert [p['page'] for p in src['pages']]==list(range(1,len(pages)+1)),sid
        for page in src['pages']:
            if not (PUBLIC/'slides'/(page['asset']+'.webp')).exists():raise ValueError(f'Missing image {page["asset"]}')
        dump(PUBLIC/'data/sources'/f'{sid}.json',src)
        source_info={'id':sid,'title':source['title'],'pages':len(pages),'chapters':sorted({p['lesson'] and lessons[p['lesson']]['chapter'] for p in src['pages']},key=int)}
        if source.get('segments'):source_info['segments']=source['segments']
        sources.append(source_info)
        total+=len(pages)
    assert total==9024
    assert sum(l['pages'] for l in lessons.values())==total
    assert set(guides)<=set(lessons)
    for lesson in lessons.values():
        assert lesson['refs'],lesson['id']
        lesson['items'].sort(key=lambda i:(next(n for n,r in enumerate(lesson['refs']) if r['source']==i['source'] and r['start']<=i['start']<=r['end']),i['start'],i['title']))
        lesson['minutes']=max(5,round(len(lesson['guide'])/240+3))
        lesson['excerpt']=re.sub(r'[$#*\\]','',lesson['guide'].split('\n\n')[0])[:92]
        dump(PUBLIC/'data/lessons'/f'{lesson["id"]}.json',lesson)
        search.append({'lesson':lesson['id'],'title':lesson['title'],'type':'知识点','text':lesson['guide'],'source':'','page':0})
    chapters=[]
    for number,title,description in CHAPTERS:
        sections=[]
        for section,stitle in SECTIONS.items():
            if not section.startswith(str(number)+'.'):continue
            members=[{k:l[k] for k in ['id','title','section','chapter','pages','minutes','excerpt']} for l in lessons.values() if l['section']==section]
            sections.append({'id':section,'title':stitle,'lessons':members})
        chapters.append({'id':str(number),'number':number,'title':title,'description':description,'sections':sections})
    catalog={'version':1,'title':'信息安全数学基础','description':'按课件逐章学习，从第一步理解数学。','stats':{'sources':17,'pages':total,'assets':len(inv['assets']),'topics':len(lessons),'items':sum(len(l['items']) for l in lessons.values())},'chapters':chapters,'sources':sources,'gaps':['9月9日第二份课件在雨课堂列有107帧，其中第57–107帧未返回图片；1.2.2计算复杂性的正文暂未确认。','现有资料未找到独立标注第五、六、七章的课件。','第八章8.4群的同态与同构、8.5环与域仅找到章首页目录，尚未找到对应正文。'],'draft':bool(missing)}
    dump(PUBLIC/'data/catalog.json',catalog)
    dump(PUBLIC/'data/search.json',search)
    dump(PUBLIC/'data/coverage.json',{'stats':catalog['stats'],'ranges':evidence,'sources':sources,'notes':['本地已收录的9024帧均有且只有一个学习主题归属；这不能证明雨课堂课件已全部收齐。','9月9日第二份课件列有107帧，雨课堂第57–107帧未返回图片。','完全相同的图片文件按内容哈希复用；动画步骤仍保留其来源页码。','原页索引和搜索文字由OCR辅助生成，原始数学内容以图像为准。','第三章第3节采用此前导出的190页PDF重新渲染，字体和动画显示可能与雨课堂网页不同。']})
    (PUBLIC/'.nojekyll').touch()
    vendor=PUBLIC/'vendor';vendor.mkdir(exist_ok=True)
    kd=ROOT/'node_modules/katex/dist'
    if kd.exists():
        (vendor/'katex').mkdir(exist_ok=True)
        for name in ['katex.min.js','katex.min.css']:shutil.copy2(kd/name,vendor/'katex'/name)
        shutil.copy2(ROOT/'node_modules/katex/LICENSE',vendor/'katex/LICENSE')
        shutil.copytree(kd/'fonts',vendor/'katex/fonts',dirs_exist_ok=True)
    mk=ROOT/'node_modules/marked/lib/marked.umd.js'
    if mk.exists():
        shutil.copy2(mk,vendor/'marked.umd.js')
        shutil.copy2(ROOT/'node_modules/marked/LICENSE.md',vendor/'marked.LICENSE.md')
    print(json.dumps({'stats':catalog['stats'],'missing_guides':missing,'sources':len(sources)},ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--draft',action='store_true');args=parser.parse_args();build(args.draft)
