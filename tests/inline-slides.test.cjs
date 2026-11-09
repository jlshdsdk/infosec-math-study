const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../public');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));

test('每篇讲解插入的课件图均可追溯到原页和对应小节',()=>{
  const catalog=read('data/catalog.json');
  const ids=catalog.chapters.flatMap(c=>c.sections.flatMap(s=>s.lessons.map(l=>l.id)));
  const inline=read('data/inline-slides.json');
  const audit=read('data/coverage-audit.json').records;
  const sources=new Map(catalog.sources.map(s=>[s.id,read(`data/sources/${s.id}.json`)]));
  assert.deepEqual(Object.keys(inline).sort(),ids.sort());
  let crossTopic=0;
  for(const id of ids){
    const slides=inline[id];assert.ok(slides.length>=1&&slides.length<=3,id);
    const guide=read(`data/lessons/${id}.json`).guide;
    const headings=[...guide.matchAll(/^#{2,3}\s+(.+)$/gm)];
    for(const item of slides){
      const source=sources.get(item.source);assert.ok(source,item.source);
      assert.equal(source.pages[item.page-1].asset,item.asset,`${id}: 原页图像不匹配`);
      assert.ok(fs.existsSync(path.join(root,'slides',item.asset+'.webp')));
      const origin=read(`data/lessons/${item.originTopic}.json`);
      assert.ok(origin.refs.some(r=>r.source===item.source&&r.start<=item.page&&item.page<=r.end),`${id}: 原页不属于所链接的知识点`);
      assert.ok(item.headingIndex===null||(Number.isInteger(item.headingIndex)&&item.headingIndex>=0&&item.headingIndex<headings.length),`${id}: 小节不存在`);
      assert.ok(audit.some(r=>r.status==='explained'&&r.guideTopic===id&&r.topic===item.originTopic&&r.headingIndex===item.headingIndex&&r.type===item.type&&r.label===item.label&&r.sources.some(s=>s.source===item.source&&s.end===item.page)),`${id}: 配图没有对应的课件核查记录`);
      if(item.originTopic!==id)crossTopic++;
    }
  }
  assert.ok(crossTopic>0,'应保留跨知识点的原页定位');
});
