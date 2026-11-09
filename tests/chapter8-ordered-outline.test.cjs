'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '../public');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,'ppt-outline.js'),'utf8'), context);
const outline = JSON.parse(JSON.stringify(context.window.PPT_OUTLINE));
const chapter = outline['8'];
const nodes = chapter.sections.flatMap(section=>[section,...section.topics]);
const map = new Map(nodes.map(node=>[node.key,node]));
const expected = {
  '8.1': ['8.1.1','8.1.2','8.1-heading-1','8.1-heading-2','8.1-group-examples','8.1-group-power','8.1-heading-3','8.1-heading-4','8.1-cycles','8.1-cycle-decomp','8.1-parity','8.1-group-table'],
  '8.2': ['8.2-subgroup','8.2-heading-1','8.2-heading-2','8.2-generated','8.2-cyclic','8.2-heading-3','8.2-heading-4','8.2-generators','8.2-heading-5','8.2-cyclic-subgroup'],
  '8.3': ['8.3-cosets-definition','8.3-heading-1','8.3-normal','8.3-heading-2','8.3-cyclic-subgroups','8.3-small-groups','8.3-order-criterion']
};
// Fixed compatibility fixtures use the pre-reorganization route and anchor.
// The final owner may differ; changing these would invalidate saved deep links.
const legacyParts = [
  ['8.1.1','binary','8-1-1-1'], ['8.1.1','laws','8-1-1-2'],
  ['8.1.2','semigroup','8-1-2-1'], ['8.1.2','group','8-1-2-2'],
  ['8.1-heading-1','group-props','8-1-heading-1-1'],
  ['8.1-heading-1','group-examples','8-1-heading-1-2'],
  ['8.1-heading-1','group-power','8-1-heading-1-3'],
  ['8.1-heading-2','group-tests','8-1-heading-2-1'],
  ['8.1-heading-4','permutation','8-1-heading-4-1'],
  ['8.1-heading-4','cycles','8-1-heading-4-2'],
  ['8.1-heading-4','cycle-decomp','8-1-heading-4-3'],
  ['8.1-heading-4','parity','8-1-heading-4-4'],
  ['8.1-heading-4','group-table','8-1-heading-4-5'],
  ['8.2','subgroup','8-2-1'], ['8.2','generated','8-2-2'],
  ['8.2','cyclic','8-2-3'], ['8.2','generators','8-2-4'],
  ['8.2','cyclic-subgroup','8-2-5'],
  ['8.2-heading-1','subgroup-tests','8-2-heading-1-1'],
  ['8.2-heading-2','subgroup-tests','8-2-heading-2-1'],
  ['8.2-heading-3','order','8-2-heading-3-1'],
  ['8.2-heading-4','order','8-2-heading-4-1'],
  ['8.2-heading-5','generators','8-2-heading-5-1'],
  ['8.3','cosets','8-3-1'], ['8.3','normal','8-3-2'],
  ['8.3','cyclic-subgroups','8-3-3'], ['8.3','small-groups','8-3-4'],
  ['8.3','order-criterion','8-3-5'],
  ['8.3-heading-1','cosets','8-3-heading-1-1'],
  ['8.3-heading-2','lagrange','8-3-heading-2-1']
];
const parts = nodes.flatMap(node=>node.parts);
const byAnchor = new Map(parts.map(part=>[part.anchor,part]));
const lessonCache = new Map();
function lesson(id) {
  if (!lessonCache.has(id)) lessonCache.set(id, JSON.parse(fs.readFileSync(path.join(ROOT,'data/lessons',id+'.json'),'utf8')));
  return lessonCache.get(id);
}
function bounds(part) {
  const text = lesson(part.lesson).guide;
  const start = part.from ? text.indexOf(part.from) : 0;
  const end = part.until ? text.indexOf(part.until,start+1) : text.length;
  assert.ok(start>=0 && end>start, `Invalid body boundary ${part.anchor}`);
  if (part.from) assert.equal(text.indexOf(part.from,start+1),-1,`Ambiguous start ${part.anchor}`);
  if (start) assert.equal(text.slice(start-2,start),'\n\n',`Paragraph start cut ${part.anchor}`);
  if (end<text.length) assert.equal(text.slice(end-2,end),'\n\n',`Paragraph end cut ${part.anchor}`);
  return {start,end,text};
}

test('chapter 8 final knowledge points have precise PPT order and distinguish display numbers from source numbers',()=>{
  assert.deepEqual(chapter.sections.map(section=>[section.key,section.title]),[
    ['8.1','群'],['8.2','子群'],['8.3','子群的陪集'],['8.4','群的同态与同构'],['8.5','环与域']
  ]);
  for (const [key,keys] of Object.entries(expected)) {
    const section=map.get(key);
    assert.deepEqual(section.topics.map(topic=>topic.key),keys);
    assert.deepEqual(section.parts,[],'Core teaching belongs to ordered knowledge points');
    assert.deepEqual(section.topics.map(topic=>topic.displayNumber),keys.map((_,index)=>key+'.'+(index+1)));
    assert.ok(section.topics.every(topic=>!topic.hidden));
    for (const topic of section.topics) {
      assert.equal(topic.section,key); assert.equal(topic.chapter,'8');
      if (['8.1.1','8.1.2'].includes(topic.key)) {
        assert.equal(topic.number,topic.key); assert.equal(topic.numberOrigin,'ppt');
      } else {
        assert.equal(topic.number,null); assert.equal(topic.numberOrigin,'website');
        assert.match(topic.numberNote,/网站/);
      }
    }
  }
  assert.deepEqual(nodes.filter(node=>node.key!==node.section&&node.number).map(node=>node.number),['8.1.1','8.1.2']);
});

test('all historical topic routes and review/source labels remain usable',()=>{
  for (const key of ['8.1.1','8.1.2',...Array.from({length:4},(_,i)=>'8.1-heading-'+(i+1)),...Array.from({length:5},(_,i)=>'8.2-heading-'+(i+1)),'8.3-heading-1','8.3-heading-2']) assert.ok(map.has(key),`Lost old topic ${key}`);
  assert.equal(map.get('8.1-heading-1').sourceLabel,'三');
  assert.equal(map.get('8.1-heading-4').sourceLabel,'四');
  const review=map.get('8.1-heading-3');
  assert.deepEqual(review.parts,[]); assert.equal(review.sourceLabel,'§6.2');
  assert.equal(review.displayNumber,'8.1.7'); assert.equal(review.readingStatus,'related_reading');
  assert.match(review.readingLabel,/回顾/);
  assert.deepEqual(review.relatedTopics,[{key:'8.1.2',label:'8.1.2 半群与群'}]);
  for (const related of review.relatedTopics) assert.ok(map.get(related.key).parts.length);
  for (const key of ['8.2-heading-1','8.2-heading-2','8.2-heading-3','8.2-heading-4']) assert.ok(map.get(key).parts.length,`Lost historical split topic ${key}`);
});

test('all 30 historical paragraph anchors retain their lesson and resolve even after their owner moves',()=>{
  assert.equal(parts.length,legacyParts.length);
  assert.equal(byAnchor.size,parts.length,'Duplicate anchors make global focus ambiguous');
  assert.deepEqual([...byAnchor.keys()].sort(),legacyParts.map(([, ,anchor])=>anchor).sort());
  for (const [oldOutline,id,anchor] of legacyParts) {
    const params=new URLSearchParams({outline:oldOutline,focus:anchor});
    assert.ok(map.has(params.get('outline')),`Lost historical outline ${oldOutline}`);
    const owner=nodes.find(node=>node.parts.some(part=>part.lesson===id&&part.anchor===params.get('focus')));
    assert.ok(owner,`Lost historical lesson/focus pair ${id}/${anchor}`);
    assert.equal(lesson(id).id,id);
    assert.equal(byAnchor.get(anchor).lesson,id);
  }
  assert.equal(map.get('8.1-group-examples').parts[0].anchor,'8-1-heading-1-2');
  assert.equal(map.get('8.1-group-power').parts[0].anchor,'8-1-heading-1-3');
  assert.equal(map.get('8.1-cycles').parts[0].anchor,'8-1-heading-4-2');
  assert.equal(map.get('8.2-generators').parts[0].anchor,'8-2-4');
  assert.equal(map.get('8.3-normal').parts[0].anchor,'8-3-2');
});

test('historical split boundaries retain their exact semantic paragraph starts',()=>{
  for (const [left,right,prefix] of [
    ['8-2-heading-1-1','8-2-heading-2-1','### 例：倍数集合与交集\n'],
    ['8-2-heading-3-1','8-2-heading-4-1','### 逆元和幂的阶\n'],
    ['8-2-4','8-2-heading-5-1','### 同构：保留运算的重新命名\n'],
    ['8-3-1','8-3-heading-1-1','$b$ 所在等价类是 $bH=\\{bh:h\\in H\\}$。']
  ]) {
    const a=byAnchor.get(left),b=byAnchor.get(right);
    assert.equal(a.lesson,b.lesson); assert.equal(a.until,b.from);
    assert.ok(b.from.startsWith(prefix),`Moved old paragraph focus ${right}`);
    assert.equal(bounds(a).end,bounds(b).start);
  }
});

test('all 26 published chapter 8 guides retain full non-overlapping body coverage',()=>{
  const intervals=new Map();
  for (const part of parts) {
    const interval=bounds(part);
    assert.equal(String(lesson(part.lesson).chapter),'8');
    if (!intervals.has(part.lesson)) intervals.set(part.lesson,[]);
    intervals.get(part.lesson).push(interval);
  }
  const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,'data/catalog.json'),'utf8'));
  const published=catalog.chapters.find(item=>String(item.id)==='8').sections.flatMap(section=>section.lessons).map(item=>item.id).filter(id=>id!==chapter.intro);
  assert.equal(published.length,26); assert.equal(intervals.size,26);
  assert.deepEqual([...intervals.keys()].sort(),published.sort());
  for (const [id,ranges] of intervals) {
    ranges.sort((a,b)=>a.start-b.start);
    const text=lesson(id).guide;
    assert.equal(ranges[0].start,0,`${id}: lost beginning`);
    assert.equal(ranges.at(-1).end,text.length,`${id}: lost end`);
    for (let index=1;index<ranges.length;index++) {
      assert.ok(ranges[index].start>=ranges[index-1].end,`${id}: overlapping duplicate body`);
      assert.equal(text.slice(ranges[index-1].end,ranges[index].start).trim(),'',`${id}: missing middle body`);
    }
  }
});

test('historical source-page locations remain stable and every evidence asset exists in published data',()=>{
  const fixedSources={
    '8.1.1':['lesson-34927552',460], '8.1.2':['lesson-35006615',100],
    '8.1-heading-1':['lesson-35006615',152], '8.1-heading-2':['lesson-35006615',152],
    '8.1-heading-3':['lesson-35159940',311], '8.1-heading-4':['lesson-35239721',2],
    '8.2':['chapter8-4',2], '8.2-heading-1':['chapter8-4',41],
    '8.2-heading-2':['chapter8-4',77], '8.2-heading-3':['chapter8-4',158],
    '8.2-heading-4':['chapter8-4',195], '8.2-heading-5':['chapter8-4',269],
    '8.3':['chapter8-4',322], '8.3-heading-1':['chapter8-4',471],
    '8.3-heading-2':['chapter8-4',514]
  };
  for (const [key,[source,page]] of Object.entries(fixedSources)) {
    assert.equal(map.get(key).sources[0].source,source,key);
    assert.equal(map.get(key).sources[0].page,page,key);
  }
  const sources=new Map();
  for (const node of nodes) for (const entry of [...node.sources,...node.evidence]) {
    if (!sources.has(entry.source)) sources.set(entry.source,JSON.parse(fs.readFileSync(path.join(ROOT,'data/sources',entry.source+'.json'),'utf8')));
    const page=sources.get(entry.source).pages[entry.page-1];
    assert.ok(page,`${node.key}: source page missing`); assert.equal(page.asset,entry.asset);
    assert.ok(fs.existsSync(path.join(ROOT,'slides',entry.asset+'.webp')));
  }
});

test('8.4 and 8.5 retain only their real chapter-home evidence without fabricated teaching',()=>{
  for (const key of ['8.4','8.5']) {
    const node=map.get(key);
    assert.equal(node.number,key); assert.equal(node.coverage,'chapter_home_only');
    assert.equal(node.readingStatus,'toc_only');
    assert.deepEqual(node.parts,[]); assert.deepEqual(node.topics,[]);
    assert.match(node.note,/未找到对应正文课件与独立讲解/);
    assert.equal(node.sources[0].source,'lesson-35006615'); assert.equal(node.sources[0].page,3);
  }
  assert.match(map.get('8.2-heading-5').note,/不代表8.4/);
});
