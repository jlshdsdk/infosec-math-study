const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../public'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'ppt-outline.js'),'utf8'),context);
const outline=JSON.parse(JSON.stringify(context.window.PPT_OUTLINE));
const sections=Object.values(outline).flatMap(chapter=>chapter.sections);
const expected={
  '1.5':['整数分解定理及证明','平方同余分解实例'],
  '1.7':['素数分布、计数函数与素数定理','阶乘素因数指数与本章练习'],
  '2.5':['重复平方入门例题','二进制算法及运算次数','模幂应用与课件练习'],
  '4.1':['一般二次式的化简与配方','平方剩余与平方非剩余','模7曲线点枚举'],
  '4.4':['二次互反律及证明','符号计算与有解判断','素数形状与证明应用'],
  '4.5':['Jacobi符号定义与判断局限','运算性质、补充公式与互反律','符号计算与同余式例题'],
  '4.7':['素数平方和的可解条件','下降法及证明','平方和实例与课堂练习']
};
const affected=sections.filter(section=>Object.hasOwn(expected,section.key));
const nodes=sections.flatMap(section=>[section,...section.topics]);
const readLesson=id=>JSON.parse(fs.readFileSync(path.join(root,'data/lessons',id+'.json'),'utf8'));

test('七节均提供按实际知识点排列的三级入口，网站编号与PPT原号分字段',()=>{
  assert.equal(affected.length,7);
  assert.equal(affected.flatMap(section=>section.topics).length,19);
  const keys=new Set(nodes.map(node=>node.key));
  assert.equal(keys.size,nodes.length,'新入口不能覆盖旧节点key');
  for(const section of affected){
    assert.equal(section.number,section.key);
    assert.equal(section.sourceNumber,section.key);
    assert.deepEqual(section.parts,[],'正文已按段落分给三级入口，不可在二级重复展示');
    assert.deepEqual(section.topics.map(node=>node.title),expected[section.key]);
    assert.match(section.note,/网站整理编号/);
    section.topics.forEach((node,i)=>{
      assert.equal(node.number,null,'网站编号不得放入PPT原号字段');
      assert.equal(node.sourceNumber,null);
      assert.equal(node.numberOrigin,'website');
      assert.equal(node.displayNumber,section.key+'.'+(i+1));
      assert.notEqual(node.key,node.displayNumber,'路由key与可调整的显示编号分离');
      assert.equal(node.section,section.key);
      assert.equal(node.chapter,section.chapter);
      assert.match(node.note,/课件没有给出此三级数字编号/);
      assert.ok(node.parts.length>0);
    });
  }
  assert.equal(sections.find(section=>section.key==='3.1').topics[0].number,'3.1.1');
  assert.equal(sections.find(section=>section.key==='3.1').topics[1].number,'3.1.2');
});

test('九篇原讲解按原文段落独占分配，完整覆盖且保留所有旧正文锚点',()=>{
  const byLesson=new Map(),anchors=new Set();
  for(const section of affected)for(const node of section.topics)for(const part of node.parts){
    const {guide}=readLesson(part.lesson);
    const start=part.from?guide.indexOf(part.from):0;
    const end=part.until?guide.indexOf(part.until,start+1):guide.length;
    assert.ok(start>=0&&end>start,part.anchor);
    if(part.from){
      assert.equal(guide.indexOf(part.from,start+1),-1,part.anchor+': 起点必须唯一');
      assert.equal(guide.slice(start-2,start),'\n\n',part.anchor+': 不切断段落');
    }
    if(part.until)assert.equal(guide.slice(end-2,end),'\n\n',part.anchor+': 不切断段落');
    assert.ok(!anchors.has(part.anchor),part.anchor+': 锚点不能重复');anchors.add(part.anchor);
    if(!byLesson.has(part.lesson))byLesson.set(part.lesson,[]);
    byLesson.get(part.lesson).push({start,end});
  }
  assert.deepEqual([...byLesson.keys()].sort(),['factor','prime-dist','fast-power','quadratic','qr-def','reciprocity','reciprocity-app','jacobi','sum-squares'].sort());
  for(const [id,ranges]of byLesson){
    const {guide}=readLesson(id);ranges.sort((a,b)=>a.start-b.start);
    assert.equal(ranges[0].start,0,id+': 保留原文开头');
    assert.equal(ranges.at(-1).end,guide.length,id+': 保留原文结尾');
    for(let i=1;i<ranges.length;i++){
      assert.ok(ranges[i].start>=ranges[i-1].end,id+': 正文不得重复');
      assert.equal(guide.slice(ranges[i-1].end,ranges[i].start).trim(),'',id+': 正文不得遗漏');
    }
  }
  for(const anchor of ['1-5-1','1-7-1','2-5-1','4-1-1','4-1-2','4-4-1','4-4-2','4-5-1','4-7-1']){
    assert.ok(anchors.has(anchor),anchor+': 保留旧文章定位锚点');
  }
});

test('网站知识点均可核对实际正文原图，跨小节补充题保留其真实来源',()=>{
  const sources=new Map();
  for(const section of affected)for(const node of section.topics){
    assert.ok(node.evidence.length&&node.sources.length,node.key);
    for(const entry of [...node.evidence,...node.sources]){
      if(!sources.has(entry.source))sources.set(entry.source,JSON.parse(fs.readFileSync(path.join(root,'data/sources',entry.source+'.json'),'utf8')));
      assert.equal(sources.get(entry.source).pages[entry.page-1].asset,entry.asset,node.key);
      assert.ok(fs.existsSync(path.join(root,'slides',entry.asset+'.webp')));
    }
  }
  const power=affected.find(section=>section.key==='2.5');
  assert.deepEqual(power.topics.map(node=>node.sources[0].page),[158,200,224],'依PPT先例题、后算法、再应用的顺序');
  assert.ok(power.topics[2].sources.some(source=>source.page===154));
  assert.match(power.topics[2].note,/154页.*2.4末尾/);
  assert.deepEqual(affected.find(section=>section.key==='4.1').topics.map(node=>node.sources[0].page),[4,48,69]);
  assert.deepEqual(affected.find(section=>section.key==='4.5').topics.map(node=>node.sources[0].page),[4,56,107]);
});
