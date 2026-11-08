const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const katex=require('katex');
const root=path.resolve(__dirname,'../public');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
test('网站正文与已经审校的Markdown讲解一致',()=>{
  const content=path.resolve(__dirname,'../content');let count=0;
  for(const file of fs.readdirSync(content).filter(n=>/^guides-.*\.md$/.test(n))){
    const text=fs.readFileSync(path.join(content,file),'utf8').replace(/\r\n/g,'\n');
    const blocks=text.split(/^## ([a-z0-9-]+)[ \t]*\n/gm);
    for(let i=1;i<blocks.length;i+=2){assert.equal(read(`data/lessons/${blocks[i]}.json`).guide,blocks[i+1].trim(),`讲解更改后须重新构建：${blocks[i]}`);count++;}
  }
  assert.equal(count,91);
});
test('17份来源的9024页全部可定位，且每页只属于一个主题',()=>{
  const catalog=read('data/catalog.json');
  assert.equal(catalog.stats.pages,9024);assert.equal(catalog.sources.length,17);
  const lessons=new Map(catalog.chapters.flatMap(c=>c.sections.flatMap(s=>s.lessons.map(l=>[l.id,l]))));
  let count=0;
  for(const source of catalog.sources){
    const data=read(`data/sources/${source.id}.json`);
    assert.equal(data.pages.length,source.pages);
    data.pages.forEach((page,index)=>{
      assert.equal(page.page,index+1);
      assert.ok(lessons.has(page.lesson));
      assert.ok(fs.existsSync(path.join(root,'slides',page.asset+'.webp')));
      const lesson=read(`data/lessons/${page.lesson}.json`);
      const refs=lesson.refs.filter(r=>r.source===source.id&&r.start<=page.page&&page.page<=r.end);
      assert.equal(refs.length,1,`${source.id}/${page.page}`);
    });count+=data.pages.length;
  }
  assert.equal(count,9024);
});
test('正式发布时91个主题均有讲解，标准LaTeX所有公式可解析',()=>{
  const catalog=read('data/catalog.json');assert.equal(catalog.draft,false,'不允许发布讲解未完成的草稿');
  let topicCount=0,formulaCount=0;
  for(const c of catalog.chapters)for(const s of c.sections)for(const l of s.lessons){
    const lesson=read(`data/lessons/${l.id}.json`);
    assert.ok(lesson.guide.length>150,`讲解过短：${l.id}`);
    assert.equal(lesson.chapter,c.id);assert.equal(lesson.section,s.id);
    assert.ok(lesson.refs.length>0);assert.ok(lesson.items.length>0);
    for(const m of lesson.guide.matchAll(/\$\$([\s\S]*?)\$\$|\$([^\n$]+)\$/g)){
      const expression=m[1]??m[2];
      assert.doesNotThrow(()=>katex.renderToString(expression,{throwOnError:true,strict:'ignore',displayMode:m[1]!==undefined}),`${l.id}: ${expression}`);
      formulaCount++;
    }
    for(const item of lesson.items){
      const src=read(`data/sources/${item.source}.json`);
      assert.ok(item.start>=1&&item.end>=item.start&&item.end<=src.pages.length);
      assert.ok(lesson.refs.some(r=>r.source===item.source&&r.start<=item.start&&item.end<=r.end));
    }
    topicCount++;
  }
  assert.equal(topicCount,91);assert.ok(formulaCount>400);
});
test('公开文件不含雨课堂会话、签名链接或本机绝对路径',()=>{
  const dataPaths=[];
  function collect(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())collect(p);else if(/\.(json|html|js|css|md)$/i.test(p))dataPaths.push(p);}}
  collect(path.join(root,'data'));
  for(const file of dataPaths){const text=fs.readFileSync(file,'utf8');assert.ok(!/auth_key=|student-lesson-report|C:\\\\Users|Bearer\s+[A-Za-z0-9_-]{20}|gh[pousr]_[A-Za-z0-9]{20}/.test(text),file);}
});
