'use strict';

// Keep the larger original-page index and its matching work off the UI thread.
let rows = [];
self.onmessage = async event => {
  const message=event.data||{};
  if(message.type==='init'){
    try{
      const response=await fetch('data/search.json?v=ppt-20261109b');
      if(!response.ok)throw new Error(`学习资料暂未能打开（${response.status}）`);
      const data=await response.json();
      if(!Array.isArray(data))throw new Error('搜索索引格式有误');
      rows=data.map(row=>({row,haystack:`${row.title||''} ${row.text||''}`.toLocaleLowerCase()}));
      self.postMessage({type:'ready'});
    }catch(error){self.postMessage({type:'error',message:error.message||'全文索引暂时无法加载'});}
  }else if(message.type==='search'){
    const terms=message.terms||[],guides=[],originals=[];let total=0;
    for(const entry of rows){
      if(!terms.every(term=>entry.haystack.includes(term)))continue;
      total++;
      const row=entry.row,title=String(row.title||'').toLocaleLowerCase();
      const titleMatches=terms.every(term=>title.includes(term));
      const titleScore=terms.reduce((sum,term)=>sum+(title.includes(term)?10:0),0);
      if(row.type==='知识点')guides.push({...row,score:(titleMatches?2000:1000)+titleScore,matchKind:titleMatches?'导读标题匹配':'导读正文匹配'});
      else if(originals.length<500)originals.push({...row,score:titleScore,matchKind:'课件原页'});
    }
    const matches=[...guides.sort((a,b)=>b.score-a.score),...originals.sort((a,b)=>b.score-a.score)].slice(0,Math.max(500,guides.length));
    self.postMessage({type:'results',sequence:message.sequence,terms,total,matches});
  }
};
