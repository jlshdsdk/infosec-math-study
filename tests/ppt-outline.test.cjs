const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../public');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'ppt-outline.js'),'utf8'),context);
const outline=JSON.parse(JSON.stringify(context.window.PPT_OUTLINE));
const nodes=Object.values(outline).flatMap(chapter=>chapter.sections.flatMap(section=>[section,...section.topics]));
const nodeMap=new Map(nodes.map(node=>[node.key,node]));
const lessons=new Map(catalog.chapters.flatMap(chapter=>chapter.sections.flatMap(section=>section.lessons.map(lesson=>[lesson.id,JSON.parse(fs.readFileSync(path.join(root,'data/lessons',lesson.id+'.json'),'utf8'))]))));
const sections={
  1:['整除的概念 欧几里得除法','整数的表示','最大公因数与广义欧几里得除法','整除的进一步性质及最小公倍数','整数分解','素数的算术基本定理','素数定理'],
  2:['同余的概念及基本性质','剩余类及完全剩余系','简化剩余系与欧拉函数','欧拉定理、费马小定理和Wilson定理','模重复平方计算法'],
  3:['基本概念及一次同余式','中国剩余定理','高次同余式的解数及解法','素数模的同余式'],
  4:['一般二次同余式','模为奇素数的平方剩余与平方非剩余','勒让得符号','二次互反律','雅可比符号','模平方根','x²+y²=p'],
  8:['群','子群','子群的陪集','群的同态与同构','环与域']
};
function bounds(lesson,part){
  const start=part.from?lesson.guide.indexOf(part.from):0;
  const end=part.until?lesson.guide.indexOf(part.until,start+1):lesson.guide.length;
  assert.ok(start>=0&&end>start,`正文定位不存在：${part.anchor}`);
  if(part.from){assert.equal(lesson.guide.indexOf(part.from,start+1),-1,`正文起点不唯一：${part.anchor}`);assert.ok(start===0||lesson.guide.slice(start-2,start)==='\n\n',`起点不能切断段落：${part.anchor}`);}
  if(part.until)assert.equal(lesson.guide.slice(end-2,end),'\n\n',`终点不能切断段落：${part.anchor}`);
  return {start,end};
}

test('正式二级逐项等于课件章首页，导学不占正式二级，第3章恰好四节',()=>{
  assert.deepEqual(Object.keys(outline),['1','2','3','4','8']);
  for(const [chapter,titles]of Object.entries(sections)){
    assert.deepEqual(outline[chapter].sections.map(section=>section.title),titles);
    assert.deepEqual(outline[chapter].sections.map(section=>section.number),titles.map((_,i)=>`${chapter}.${i+1}`));
    assert.equal(outline[chapter].intro,`${chapter}-intro`);
    assert.ok(!outline[chapter].sections.some(section=>section.number.endsWith('.0')));
  }
  assert.equal(outline[3].sections.length,4);
  assert.equal(outline[8].title,'群、环、域');
});

test('三级保留真实数字编号及顺序，不推导3.3.3或伪造第8章数字编号',()=>{
  const expected={
    '1.1':['1.1.1','1.1.2','1.1.3','1.1.4','1.1.5'],
    '1.2':['1.2.1','1.2.2'],'1.3':['1.3.1','1.3.2','1.3.3','1.3.4','1.3.5','1.3.6','1.3.7'],
    '1.4':['1.4.1','1.4.2','1.4.3','1.4.4'],'1.6':['1.6.1','1.6.2'],
    '2.1':['2.1.1','2.1.2','2.1.3'],'2.2':['2.2.1','2.2.2','2.2.3','2.2.4'],
    '2.3':['2.3.1','2.3.2','2.3.3','2.3.4'],'2.4':['2.4.1','2.4.2','2.4.3'],
    '3.1':['3.1.1','3.1.2'],'3.2':['3.2.1','3.2.2','3.2.3','3.2.4','3.2.5'],
    '3.3':['3.3.1','3.3.2'],'3.4':['3.4.1','3.4.2','3.4.3','3.4.4'],
    '4.2':['4.2.1','4.2.2'],'4.3':['4.3.1','4.3.2'],'4.6':['4.6.1','4.6.2','4.6.3'],
    '8.1':['8.1.1','8.1.2']
  };
  for(const node of nodes.filter(node=>node.key===node.section))assert.deepEqual(node.topics.filter(topic=>topic.number).map(topic=>topic.number),expected[node.key]||[],node.key);
  assert.equal(nodeMap.get('3.2.1').title,'两个方程的中国剩余定理');
  assert.equal(nodeMap.get('4.6.3').parts.length,3);
  assert.deepEqual(nodeMap.get('8.1').topics.filter(topic=>!topic.number).map(topic=>[topic.sourceLabel||null,topic.title]),[
    ['三','群的性质'],[null,'群的判定'],['§6.2','群的定义'],['四','置换群']
  ]);
  assert.ok(nodeMap.get('8.2').topics.every(topic=>topic.number===null));
  assert.ok(nodeMap.get('8.3').topics.every(topic=>topic.number===null));
  assert.ok(!nodeMap.has('3.3.3'));
});

test('全部91篇旧讲解均有入口，分段覆盖原文全部正文，不切断段落或共享同一宽泛起点',()=>{
  assert.equal(lessons.size,91);
  const reached=new Set(Object.values(outline).map(chapter=>chapter.intro));
  const intervals=new Map();const anchors=new Set();
  for(const node of nodes)for(const part of node.parts){
    assert.ok(lessons.has(part.lesson),`映射文章不存在：${part.lesson}`);
    assert.equal(String(lessons.get(part.lesson).chapter),node.chapter,`文章放错章：${part.lesson}`);
    assert.ok(!anchors.has(part.anchor),`锚点重复：${part.anchor}`);anchors.add(part.anchor);
    reached.add(part.lesson);
    const range=bounds(lessons.get(part.lesson),part);
    if(!intervals.has(part.lesson))intervals.set(part.lesson,[]);
    intervals.get(part.lesson).push(range);
  }
  assert.deepEqual([...reached].sort(),[...lessons.keys()].sort());
  for(const [id,ranges]of intervals){
    const text=lessons.get(id).guide;const covered=new Uint8Array(text.length);
    for(const {start,end}of ranges)covered.fill(1,start,end);
    const missing=text.split('').find((char,index)=>!covered[index]&&/\S/.test(char));
    assert.equal(missing,undefined,`分段漏掉正文：${id}`);
    if(ranges.length>1)assert.equal(new Set(ranges.map(range=>`${range.start}-${range.end}`)).size,ranges.length,`多个子目不得重复使用整篇开头：${id}`);
  }
});

test('8.4和8.5明确为仅章首页，保留目录却不伪装有独立正文和完成状态',()=>{
  for(const key of ['8.4','8.5']){
    const node=nodeMap.get(key);assert.equal(node.coverage,'chapter_home_only');
    assert.deepEqual(node.parts,[]);assert.deepEqual(node.topics,[]);
    assert.match(node.note,/未找到对应正文课件与独立讲解/);
    assert.equal(node.sources[0].page,3);assert.equal(node.sources[0].source,'lesson-35006615');
  }
  assert.equal(nodeMap.get('8.2-heading-5').parts[0].lesson,'generators');
  assert.match(nodeMap.get('8.2-heading-5').note,/不代表8.4/);
});

test('所有目录证据与正文原页均指向已收录的本地原图，11月4日课件全页仍有讲解入口',()=>{
  const sourceCache=new Map();
  function source(id){if(!sourceCache.has(id))sourceCache.set(id,JSON.parse(fs.readFileSync(path.join(root,'data/sources',id+'.json'),'utf8')));return sourceCache.get(id);}
  for(const node of nodes)for(const entry of [...node.evidence,...node.sources]){
    const page=source(entry.source).pages[entry.page-1];assert.ok(page,`${node.key}/${entry.source}/${entry.page}`);
    assert.equal(page.asset,entry.asset);assert.ok(fs.existsSync(path.join(root,'slides',entry.asset+'.webp')));
  }
  const ids=new Set(nodes.flatMap(node=>node.parts.map(part=>part.lesson)));
  assert.equal(source('chapter8-4').pages.length,625);
  assert.deepEqual(outline[8].sourceParts.map(part=>[part.source,part.start,part.end]),[['chapter8-4',1,320],['chapter8-4',321,625]]);
  assert.equal(nodeMap.get('8.2').material.title,'11月4日 · 第八章-4-原版');
  assert.equal(nodeMap.get('8.3').material.title,'11月4日 · 第八章-5-原版');
  assert.ok(source('chapter8-4').pages.every(page=>ids.has(page.lesson)));
  assert.equal(nodeMap.get('1.4.4').sources[0].page,457);
  assert.equal(nodeMap.get('4.2.2').sources[0].page,146);
});

test('页面在旧课件路线之外加载正式目录，并保留旧存储和旧lesson路由',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  assert.ok(html.indexOf('ppt-outline.js')<html.indexOf('src="app.js'));
  assert.match(app,/const STORAGE_KEY = 'math-self-study\.v1'/);
  assert.match(app,/if\(parts\[0\]==='lesson'\)/);
  assert.match(app,/parts\[0\]==='topic'\|\|parts\[0\]==='section'/);
  assert.match(app,/guideWithOutlineAnchors\(lesson\)/);
});

test('仅见目录与另处已有讲解分别标明，空parts不冒充新的待学文章',()=>{
  const complexity=nodeMap.get('1.2.2');
  assert.equal(complexity.readingStatus,'toc_only');
  assert.equal(complexity.readingLabel,'仅找到目录原页，正文待核查');
  assert.deepEqual(complexity.parts,[]);
  assert.equal(complexity.coverage,'toc_heading_only_or_ocr_missed');
  assert.match(complexity.note,/独立正文及对应讲解仍待核查/);
  assert.equal(complexity.sources[0].page,265);
  const heading=nodeMap.get('8.1-heading-3');
  assert.equal(heading.readingStatus,'related_reading');
  assert.equal(heading.readingLabel,'教材标题，讲解见8.1.2');
  assert.deepEqual(heading.parts,[]);
  assert.equal(heading.coverage,'source_heading');
  assert.equal(heading.number,null);assert.equal(heading.sourceLabel,'§6.2');
  assert.deepEqual(heading.relatedTopics,[{key:'8.1.2',label:'8.1.2 半群与群'}]);
  for(const related of heading.relatedTopics){
    const target=nodeMap.get(related.key);
    assert.ok(target&&target.parts.length>0,'关联入口必须有已有讲解');
    assert.equal(target.chapter,heading.chapter);
    assert.notEqual(target.key,heading.key);
  }
  for(const key of ['8.4','8.5']){
    assert.equal(nodeMap.get(key).readingStatus,'toc_only');
    assert.equal(nodeMap.get(key).readingLabel,'仅找到章首页目录');
  }
});

test('第8章section级核心正文有独立入口标签，26篇讲解完整且恰好映射一次',()=>{
  const subgroup=nodeMap.get('8.2'),cosets=nodeMap.get('8.3');
  assert.equal(subgroup.sectionReadingLabel,'子群定义、循环群与本节例题');
  assert.equal(cosets.sectionReadingLabel,'陪集定义、正规子群与本节例题');
  assert.deepEqual(subgroup.parts.map(part=>part.lesson),['subgroup','generated','cyclic','generators','cyclic-subgroup']);
  assert.deepEqual(cosets.parts.map(part=>part.lesson),['cosets','normal','cyclic-subgroups','small-groups','order-criterion']);
  for(const section of [subgroup,cosets]){
    assert.equal(section.coverage,'body');
    assert.match(section.note,/本节正文入口/);
    assert.match(section.note,/不能代替本节全部正文/);
    assert.ok(section.topics.every(topic=>topic.number===null));
  }
  const rangesByLesson=new Map();
  for(const section of outline['8'].sections)for(const node of [section,...section.topics])for(const part of node.parts){
    const range=bounds(lessons.get(part.lesson),part);
    if(!rangesByLesson.has(part.lesson))rangesByLesson.set(part.lesson,[]);
    rangesByLesson.get(part.lesson).push(range);
  }
  assert.equal(rangesByLesson.size,26);
  for(const [id,ranges]of rangesByLesson){
    const text=lessons.get(id).guide;
    ranges.sort((a,b)=>a.start-b.start);
    assert.equal(ranges[0].start,0,`${id}: 首段不可丢失`);
    assert.equal(ranges.at(-1).end,text.length,`${id}: 末段不可丢失`);
    for(let i=1;i<ranges.length;i++){
      assert.ok(ranges[i].start>=ranges[i-1].end,`${id}: 正文不可重复挂载`);
      assert.equal(text.slice(ranges[i-1].end,ranges[i].start).trim(),'',`${id}: 分段之间不可遗漏正文`);
    }
  }
});
