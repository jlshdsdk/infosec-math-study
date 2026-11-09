const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('后台全文搜索与课件原始索引一致，知识点不会被动画帧淹没',async()=>{
  const root=path.resolve(__dirname,'../public');
  const corpus=JSON.parse(fs.readFileSync(path.join(root,'data/search.json'),'utf8'));
  const messages=[];
  const sandbox={self:{postMessage:message=>messages.push(message)},fetch:async()=>({ok:true,json:async()=>corpus})};
  vm.runInNewContext(fs.readFileSync(path.join(root,'search-worker.js'),'utf8'),sandbox);
  await sandbox.self.onmessage({data:{type:'init'}});
  assert.equal(messages.pop().type,'ready');
  for(const [sequence,query] of [[1,'子群'],[2,'['],[3,'绝无匹配的查询词']]){
    await sandbox.self.onmessage({data:{type:'search',sequence,terms:[query]}});
    const result=messages.pop();
    const expected=corpus.filter(row=>`${row.title||''} ${row.text||''}`.toLocaleLowerCase().includes(query));
    assert.equal(result.sequence,sequence);
    assert.equal(result.total,expected.length);
    assert.equal(result.matches.filter(row=>row.type==='知识点').length,expected.filter(row=>row.type==='知识点').length);
    const firstOriginal=result.matches.findIndex(row=>row.type!=='知识点');
    if(firstOriginal>=0)assert.ok(result.matches.slice(firstOriginal).every(row=>row.type!=='知识点'));
  }
});
