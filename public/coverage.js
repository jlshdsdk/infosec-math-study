'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const statuses = {explained:'已对应讲解',duplicate:'重复条目','ocr-artifact':'识别误差','source-missing':'原资料缺失','needs-detail':'待补讲解'};
  let rows = [], catalog, page = 0;
  const pageSize = 36;
  function mathText(value) {
    const text = String(value ?? ''); let html = '', end = 0;
    for (const m of text.matchAll(/\$\$([\s\S]*?)\$\$|\$([^\n$]+)\$/g)) {
      html += esc(text.slice(end,m.index));
      try { html += window.katex.renderToString(m[1] ?? m[2],{throwOnError:true,trust:false,strict:'ignore',displayMode:false}); }
      catch { html += esc(m[0]); }
      end = m.index + m[0].length;
    }
    return html + esc(text.slice(end));
  }
  function sourceLink(row,ref) {
    const source = catalog.sources.find(s=>s.id===ref.source);
    const url = `index.html?v=ppt-20261109b#/lesson/${encodeURIComponent(row.topic)}?tab=pages&source=${encodeURIComponent(ref.source)}&page=${ref.start}`;
    const segment=source?.segments?.find(part=>part.start<=ref.start&&ref.end<=part.end);
    const label=segment?`${source.title} · ${segment.title} · 本份第 ${ref.start-segment.start+1}${ref.end>ref.start?`–${ref.end-segment.start+1}`:''} 页（合并第 ${ref.start}${ref.end>ref.start?`–${ref.end}`:''} 页）`:`${source?.title||ref.source} · ${ref.start}${ref.end>ref.start?`–${ref.end}`:''} 页`;
    return `<a href="${url}">${esc(label)} ↗</a>`;
  }
  function render() {
    const query = $('#audit-search').value.trim().toLocaleLowerCase();
    const chapter = $('#audit-chapter').value, type = $('#audit-type').value, status = $('#audit-status').value;
    const filtered = rows.filter(r=>(!query||r.search.includes(query))&&(!chapter||r.chapter===chapter)&&(!type||r.type===type)&&(!status||r.status===status));
    const pages = Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.max(0,Math.min(page,pages-1));
    $('#audit-count').textContent=`找到 ${filtered.length} 条对应记录${filtered.length>pageSize?` · 第 ${page+1} / ${pages} 页`:''}`;
    $('#audit-results').innerHTML = filtered.slice(page*pageSize,(page+1)*pageSize).map(r=>{
      const guide = `index.html?v=ppt-20261109b#/lesson/${encodeURIComponent(r.guideTopic||r.topic)}${Number.isInteger(r.headingIndex)?`?heading=${r.headingIndex}`:''}`;
      return `<article class="audit-entry"><div class="audit-entry-top"><div><p class="audit-context">第 ${esc(r.chapter)} 章 · ${esc(r.section)} · ${esc(r.topicTitle)}</p><h2>${esc(r.type)} · ${mathText(r.label)}</h2></div><span class="audit-badge ${['needs-detail','source-missing'].includes(r.status)?'review':''}">${esc(statuses[r.status]||r.status)}</span></div>${r.note?`<p class="audit-note">${mathText(r.note)}</p>`:''}${r.guideHeading?`<a class="audit-guide" href="${guide}"><small>对应讲解</small>${mathText(r.guideHeading)} →</a>`:''}<div class="audit-sources">${r.sources.map(ref=>sourceLink(r,ref)).join('')}</div></article>`;
    }).join('') || '<div class="audit-empty"><p>没有找到符合条件的条目。</p><p class="muted">可以缩短关键词，或改选全部章节。</p></div>';
    $('#audit-pagination').innerHTML=pages>1?`<button class="button secondary small" data-page="${page-1}" ${page===0?'disabled':''}>上一页</button><span>${page+1} / ${pages}</span><button class="button secondary small" data-page="${page+1}" ${page>=pages-1?'disabled':''}>下一页</button>`:'';
  }
  async function start() {
    try {
      const responses=await Promise.all(['data/catalog.json','data/coverage-audit.json'].map(url=>fetch(`${url}?v=ppt-20261109b`)));
      if(responses.some(r=>!r.ok))throw new Error('对应清单暂时未能载入，请刷新后重试。');
      const [c,data]=await Promise.all(responses.map(r=>r.json()));catalog=c;
      rows=data.records.map(r=>({...r,search:[r.type,r.label,r.topicTitle,r.guideHeading,r.note,...r.sources.map(s=>catalog.sources.find(x=>x.id===s.source)?.title||s.source)].join(' ').toLocaleLowerCase()}));
      $('#audit-chapter').innerHTML='<option value="">全部章节</option>'+catalog.chapters.map(c=>`<option value="${esc(c.id)}">第 ${c.number} 章 ${esc(c.title)}</option>`).join('');
      const explained=rows.filter(r=>r.status==='explained').length;
      const pending=rows.filter(r=>r.status==='needs-detail').length;
      $('#audit-summary').innerHTML=`<span><strong>${data.stats.originalItems}</strong>处原页索引</span><span><strong>${data.stats.labelGroups}</strong>组来源标签</span><span><strong>${explained}</strong>条已对应讲解</span><span><strong>${pending}</strong>条待补讲解</span>`;
      for(const selector of ['#audit-search','#audit-chapter','#audit-type','#audit-status'])$(selector).addEventListener(selector==='#audit-search'?'input':'change',()=>{page=0;render();});
      $('#audit-pagination').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;page=Number(b.dataset.page);render();$('#audit-results').focus({preventScroll:true});$('#audit-count').scrollIntoView({block:'start',behavior:'instant'});});
      render();
    } catch(error) {$('#audit-summary').textContent=error.message;$('#audit-results').innerHTML='<div class="audit-empty"><p>清单尚未能打开。</p><a class="button secondary" href="coverage.html?v=ppt-20261109b">重新载入</a></div>';}
  }
  start();
})();
