const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'../public');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'course-map.js'),'utf8'),context);
// 转成测试进程中的普通数据，避免跨 VM 原型影响深比较。
const {COURSE_PATHS:paths,LESSON_STARTERS:starters}=JSON.parse(JSON.stringify(context.window));
const chapters=catalog.chapters;
const lessons=chapters.flatMap(chapter=>chapter.sections.flatMap(section=>section.lessons));
const lessonMap=new Map(lessons.map(lesson=>[lesson.id,lesson]));
const position=new Map(lessons.map((lesson,index)=>[lesson.id,index]));
const requiredText=(value,label)=>assert.ok(typeof value==='string'&&value.trim().length>0,label);

function checkPrerequisites(prerequisites,before,label){
  assert.ok(Array.isArray(prerequisites),`${label}须提供先修数组`);
  const seen=new Set();
  for(const prerequisite of prerequisites){
    assert.ok(lessonMap.has(prerequisite.id),`${label}先修不存在：${prerequisite.id}`);
    requiredText(prerequisite.label,`${label}先修需要可读标签`);
    assert.ok(!seen.has(prerequisite.id),`${label}先修重复：${prerequisite.id}`);
    assert.ok(position.get(prerequisite.id)<before,`${label}先修不得引用尚未学习的内容：${prerequisite.id}`);
    seen.add(prerequisite.id);
  }
}

// 本文件只检查内部学习路径；网站正式层级由 ppt-outline.test.cjs 验证。
test('内部学习路径仅包含现有五章，91篇内容含导学恰好各出现一次',()=>{
  assert.deepEqual(Object.keys(paths),chapters.map(chapter=>String(chapter.id)));
  const all=[];
  const unitIDs=new Set();
  for(const chapter of chapters){
    const route=paths[chapter.id];
    for(const field of ['title','question','bridge','start'])requiredText(route[field],`${chapter.id}.${field}`);
    assert.ok(Array.isArray(route.units)&&route.units.length>0);
    const chapterTopics=[];
    for(const unit of route.units){
      for(const field of ['id','title','description'])requiredText(unit[field],`${chapter.id}单元${field}`);
      assert.ok(!unitIDs.has(unit.id),`阅读单元ID重复：${unit.id}`);
      unitIDs.add(unit.id);
      assert.ok(Array.isArray(unit.topics)&&unit.topics.length>0,`空阅读单元：${unit.id}`);
      for(const id of unit.topics){
        assert.ok(lessonMap.has(id),`路线内容不存在：${id}`);
        assert.equal(String(lessonMap.get(id).chapter),String(chapter.id),`内容放错章：${id}`);
        chapterTopics.push(id);
        all.push(id);
      }
    }
    assert.equal(route.start,`${chapter.id}-intro`);
    assert.equal(chapterTopics[0],route.start,`${chapter.id}章须从导学起步`);
  }
  assert.equal(all.length,91);
  assert.equal(new Set(all).size,91);
  assert.deepEqual([...all].sort(),lessons.map(lesson=>lesson.id).sort());
});

test('阅读路线保留课件课程先后，所有先修均存在且在当前内容之前',()=>{
  for(const chapter of chapters){
    const route=paths[chapter.id];
    const original=chapter.sections.flatMap(section=>section.lessons.map(lesson=>lesson.id));
    assert.deepEqual(route.units.flatMap(unit=>unit.topics),original,`第${chapter.id}章阅读先后改变`);
    checkPrerequisites(route.prerequisites,position.get(route.start),`第${chapter.id}章`);
  }
  for(const [id,starter] of Object.entries(starters)){
    assert.ok(lessonMap.has(id),`先导卡对应内容不存在：${id}`);
    requiredText(starter.question,`${id}先导卡缺少问题`);
    checkPrerequisites(starter.prerequisites,position.get(id),id);
    assert.ok(Array.isArray(starter.steps)&&starter.steps.length>=2,`${id}缺少阅读步骤`);
    starter.steps.forEach(step=>requiredText(step,`${id}包含空步骤`));
  }
});

test('第八章内部学习路径保留五个阅读组，独立于课件正式小节',()=>{
  const units=paths['8'].units;
  assert.equal(units.length,5);
  assert.deepEqual(units.map(unit=>[unit.topics[0],unit.topics.at(-1)]),[
    ['8-intro','group-power'],
    ['permutation','group-table'],
    ['subgroup','cyclic-subgroup'],
    ['cosets','lagrange'],
    ['cyclic-subgroups','order-criterion']
  ]);
  assert.equal(paths['8'].title,'群');
  assert.ok(units.slice(0,3).flatMap(unit=>unit.topics).filter(id=>id!=='8-intro').every(id=>lessonMap.get(id).section==='8.1'));
  assert.ok(units.slice(3).flatMap(unit=>unit.topics).every(id=>lessonMap.get(id).section==='8.2'));
});

test('容易缺少入口的内容有具体先导，跨章回顾不依赖缺失的第五至七章',()=>{
  for(const id of ['linear','quadratic','hensel','factor','sqrt-general','cosets'])assert.ok(starters[id],`${id}需要具体先导`);
  assert.match(starters.factor.steps.join(''),/第二章/);
  assert.match(starters.hensel.steps.join(''),/多项式/);
  assert.match(starters['sqrt-general'].steps.join(''),/单位根/);
  assert.match(starters.cosets.steps.join(''),/aH/);
  assert.ok(paths['8'].prerequisites.every(item=>['1','2'].includes(String(lessonMap.get(item.id).chapter))));
});
