'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = value => Number(value || 0).toLocaleString('zh-CN');
  const STORAGE_KEY = 'math-self-study.v1';
  const SCHEMA = 'math-self-study';
  let catalog, lessons = [], lessonMap = new Map(), currentLesson = null;
  let routeToken = 0, activeTab = 'guide', viewer = null, storageOK = true;
  let searchData, searchPromise, searchSequence = 0, searchMatches = [], searchPage = 0;
  let itemFilter = '全部', itemPage = 0, toastTimer, noteTimer;
  const lessonCache = new Map(), sourceCache = new Map();
  const compactScreen = window.matchMedia('(max-width: 760px)');
  let state = {completed:[], bookmarks:[], notes:{}, lastPages:{}, lastLesson:null, settings:{theme:'light',font:'normal'}};

  function notice(text) {
    const node = $('#toast'); node.textContent = text; node.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.hidden = true; }, 3800);
  }
  function storageWarning() {
    storageOK = false;
    const node = $('#storage-warning'); node.hidden = false;
    node.textContent = '浏览器未能保存学习记录。本次操作暂存在当前页面，请在离开前导出进度备份。';
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageOK = true; $('#storage-warning').hidden = true; return true; }
    catch { storageWarning(); return false; }
  }
  function safeRecord(value) { return value && typeof value === 'object' && !Array.isArray(value); }
  function validID(id) { return typeof id === 'string' && lessonMap.has(id); }
  function normalizeState(input, strict = false) {
    if (!safeRecord(input)) throw new Error('备份内容不是有效的学习记录。');
    if (strict && (!Array.isArray(input.completed) || !Array.isArray(input.bookmarks) || !safeRecord(input.notes))) throw new Error('备份缺少完成记录、收藏或笔记字段，请选择本手册导出的文件。');
    const result = {completed:[], bookmarks:[], notes:{}, lastPages:{}, lastLesson:null, settings:{theme:'light',font:'normal'}};
    for (const field of ['completed','bookmarks']) {
      if (Array.isArray(input[field])) result[field] = [...new Set(input[field].filter(validID))];
    }
    if (safeRecord(input.notes)) for (const [id,note] of Object.entries(input.notes)) {
      if (!validID(id)) continue;
      if (!safeRecord(note) || typeof note.text !== 'string' || note.text.length > 20000 || !Number.isFinite(note.updatedAt) || note.updatedAt < 0) {
        if (strict) throw new Error('笔记格式不正确，或单条笔记超过 20,000 字。');
        continue;
      }
      result.notes[id] = {text:note.text, updatedAt:Math.min(note.updatedAt, Date.now()+86400000)};
    }
    if (safeRecord(input.lastPages)) for (const [id,value] of Object.entries(input.lastPages)) {
      if (validID(id) && safeRecord(value) && typeof value.source === 'string' && /^[a-zA-Z0-9_-]+$/.test(value.source) && Number.isInteger(value.page) && value.page > 0 && value.page <= 100000) result.lastPages[id] = {source:value.source,page:value.page};
    }
    if (validID(input.lastLesson)) result.lastLesson = input.lastLesson;
    if (safeRecord(input.settings)) {
      if (['light','dark'].includes(input.settings.theme)) result.settings.theme = input.settings.theme;
      if (['normal','large','larger'].includes(input.settings.font)) result.settings.font = input.settings.font;
    }
    return result;
  }
  function loadState() {
    try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) state = normalizeState(JSON.parse(stored)); }
    catch { storageWarning(); }
    applySettings();
  }
  function applySettings() {
    document.documentElement.dataset.theme = state.settings.theme;
    document.body.dataset.font = state.settings.font;
    $('meta[name="theme-color"]').content = state.settings.theme === 'dark' ? '#1c2723' : '#f7f6f0';
  }
  async function fetchJSON(path) {
    let response;
    try { response = await fetch(path); } catch { throw new Error('暂时无法连接学习资料，请检查网络后重试。'); }
    if (!response.ok) throw new Error(`学习资料暂未能打开（${response.status}），请稍后重试。`);
    try { return await response.json(); } catch { throw new Error('学习资料格式有误，请重新加载页面，或联系网站维护者。'); }
  }
  function getLesson(id) {
    if (!lessonCache.has(id)) lessonCache.set(id, fetchJSON(`data/lessons/${encodeURIComponent(id)}.json`).catch(error => {lessonCache.delete(id);throw error;}));
    return lessonCache.get(id);
  }
  function getSource(id) {
    if (!sourceCache.has(id)) sourceCache.set(id, fetchJSON(`data/sources/${encodeURIComponent(id)}.json`).catch(error => {sourceCache.delete(id);throw error;}));
    return sourceCache.get(id);
  }
  const lessonURL = id => `#/lesson/${encodeURIComponent(id)}`;
  const pageURL = (id, source, page) => `${lessonURL(id)}?tab=pages&source=${encodeURIComponent(source)}&page=${page}`;
  function routeInfo() {
    const raw = location.hash.slice(1) || '/'; const [path, query = ''] = raw.split('?');
    return {parts:path.split('/').filter(Boolean), params:new URLSearchParams(query)};
  }
  function closeMenu() {
    $('#sidebar').classList.remove('is-open'); $('#sidebar-scrim').hidden = true;
    $('[data-action="menu"]').setAttribute('aria-expanded','false');
    syncSidebar();
  }
  function syncSidebar() {
    const open=$('#sidebar').classList.contains('is-open')&&compactScreen.matches;
    $('#sidebar').inert=compactScreen.matches&&!open;
    document.body.classList.toggle('menu-open',open);
    if(!compactScreen.matches)$('#sidebar-scrim').hidden=true;
  }
  function openDialog(id) {
    const dialog = $(id); if (!dialog.open) dialog.showModal();
  }
  function errorHTML(message, action = 'retry') {
    return `<div class="empty-state"><h2>这部分暂时没能打开</h2><p>${esc(message)}</p><button class="button primary" data-action="${action}">重新加载</button></div>`;
  }
  function updateProgress() {
    const done = state.completed.length, total = lessons.length, percentage = total ? Math.round(done/total*100) : 0;
    $('#sidebar-progress').innerHTML = `<div class="mini-progress-label"><span>我的学习进度</span><span>${done} / ${total}</span></div><div class="progress-track" role="progressbar" aria-label="总学习进度" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><div class="progress-fill" style="width:${percentage}%"></div></div>`;
    $$('.lesson-nav').forEach(a => a.classList.toggle('completed', state.completed.includes(a.dataset.lesson)));
  }
  function renderSidebar() {
    $('#course-nav').innerHTML = catalog.chapters.map(chapter => `<details class="chapter-nav" data-chapter="${esc(chapter.id)}"><summary><span class="chapter-num">${String(chapter.number).padStart(2,'0')}</span><span>${esc(chapter.title)}</span></summary>${chapter.sections.map(section => `<details class="section-nav" data-section="${esc(section.id)}"><summary>${esc(section.id)} ${esc(section.title)}</summary>${section.lessons.map(lesson => `<a class="lesson-nav" data-lesson="${esc(lesson.id)}" href="${lessonURL(lesson.id)}">${esc(lesson.title)}</a>`).join('')}</details>`).join('')}</details>`).join('');
    updateProgress();
  }
  function updateNav(type, lesson) {
    $$('[data-nav]').forEach(a => {const active=a.dataset.nav===type;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $$('.lesson-nav').forEach(a => { const active = lesson && a.dataset.lesson === lesson.id; a.classList.toggle('active', !!active); if (active) a.setAttribute('aria-current','page');else a.removeAttribute('aria-current'); });
    if (lesson) {
      const chapter = $$('[data-chapter]').find(n=>n.dataset.chapter === String(lesson.chapter)); if (chapter) chapter.open = true;
      const section = $$('[data-section]').find(n=>n.dataset.section === String(lesson.section)); if (section) section.open = true;
    }
  }
  function chapterProgress(chapter) {
    const list = chapter.sections.flatMap(s=>s.lessons); return {total:list.length,done:list.filter(l=>state.completed.includes(l.id)).length};
  }
  function renderHome() {
    const next = lessonMap.get(state.lastLesson) || lessons.find(l=>!state.completed.includes(l.id)) || lessons[0];
    const heroFormula = markdownHTML('$a\\equiv b\\pmod m$');
    $('#main').innerHTML = `<section class="hero"><div><div class="eyebrow">FOUNDATIONS, ONE STEP AT A TIME</div><h1>从第一步开始，<br>读懂<span>信息安全的</span><em>数学。</em></h1><p class="hero-description">不跳过定义，也不省略推导。沿着课件的章节顺序，从整数与同余出发，把抽象的概念一步步变成自己的理解。</p><div class="hero-actions"><a class="button primary" href="${lessonURL(next.id)}">${state.lastLesson?'继续上次学习':'开始第一课'} <span aria-hidden="true">→</span></a><a class="button secondary" href="#/library">浏览原始课件 <span aria-hidden="true">↗</span></a></div>${state.lastLesson?`<p class="resume-label">上次读到：${esc(next.title)}</p>`:''}</div><div class="hero-art" aria-hidden="true"><div class="math-sheet"><div class="math-axis"><div class="math-formula">${heroFormula}</div></div><i class="orbit-dot"></i></div><span class="art-note">THE BEAUTY OF UNDERSTANDING</span></div></section><section class="stat-strip" aria-label="手册概况"><div class="stat"><strong>${catalog.chapters.length}</strong><span>个现有课件章节</span></div><div class="stat"><strong>${num(lessons.length)}</strong><span>个学习知识点</span></div><div class="stat"><strong>${num(catalog.stats.pages)}</strong><span>页原始课件帧</span></div><div class="stat"><strong>${Math.round(state.completed.length/lessons.length*100)}<small>%</small></strong><span>已完成 ${state.completed.length} 个知识点</span></div></section><section aria-labelledby="chapters-heading"><div class="section-heading"><h2 id="chapters-heading">循着章节，逐步深入</h2><p>按课件结构 · 从基础到应用</p></div><div class="chapter-grid">${catalog.chapters.map(chapter=>{const progress=chapterProgress(chapter); const first=chapter.sections.flatMap(s=>s.lessons).find(l=>!state.completed.includes(l.id))||chapter.sections[0].lessons[0];return `<a class="chapter-card" href="${lessonURL(first.id)}"><div class="chapter-card-top"><span class="chapter-card-number">${String(chapter.number).padStart(2,'0')}</span><span class="chapter-card-tag">${chapter.sections.length} 节 · ${progress.total} 个知识点</span></div><h3>${esc(chapter.title)}</h3><p>${esc(chapter.description)}</p><span class="card-arrow" aria-hidden="true">↗</span><div class="chapter-card-bottom"><span>第${chapter.number}章</span><span>${progress.done?`已完成 ${progress.done} / ${progress.total}`:'从这里开始'} </span><div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress.total?progress.done/progress.total*100:0}%"></div></div></div></a>`;}).join('')}</div></section><aside class="scope-note"><span aria-hidden="true">ⓘ</span><div><h3>关于这本手册的范围</h3><p>以提供的 ${catalog.stats.sources} 份课件为依据，保留 ${num(catalog.stats.pages)} 页原始帧（含动画步骤与重复复习页）。第 5、6、7 章缺少独立课件；第 8 章实际材料覆盖群相关内容，环与域没有对应原页。${Array.isArray(catalog.gaps)&&catalog.gaps.length?'具体缺页范围可在各章导学中查看。':''}导读是辅助讲解，定义、定理和例题均请对照原页。</p></div></aside><section class="study-method" aria-label="建议学习方法"><div><span class="method-number">01</span><h3>先读懂，再向前</h3><p>从零基础导读入手，跟着定义、推导与例题，逐步搭起知识框架。</p></div><div><span class="method-number">02</span><h3>随时回到原页</h3><p>按定义、定理与例题快速定位，逐帧核对课件中的公式和演算。</p></div><div><span class="method-number">03</span><h3>留下自己的理解</h3><p>记笔记、收藏难点，完成后做个标记；导出备份，即可换设备接着读。</p></div></section>`;
    updateNav('home');
  }
  function sanitizeHTML(html) {
    const template = document.createElement('template'); template.innerHTML = html;
    $$('script,style,iframe,object,embed,form,input,button,textarea,svg,math,link,meta',template.content).forEach(n=>n.remove());
    $$('*',template.content).forEach(node => {
      [...node.attributes].forEach(attr=>{ if (/^on/i.test(attr.name) || ['style','srcdoc'].includes(attr.name)) node.removeAttribute(attr.name); });
      if (node.hasAttribute('href')) {
        const href=node.getAttribute('href');
        if (!/^(?:https?:|mailto:|#|\/|\.\.?\/)/i.test(href)) node.removeAttribute('href');
        if (/^https?:/i.test(href)) {node.setAttribute('target','_blank');node.setAttribute('rel','noopener noreferrer');}
      }
      if (node.tagName === 'IMG') {const src=node.getAttribute('src')||'';if (!/^(?:slides\/|\.\/slides\/)/.test(src)) node.remove();}
    });
    return template.innerHTML;
  }
  function markdownHTML(text) {
    const math=[];
    const protectedText = String(text||'').replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<![\\$])\$(?!\$)([^\n$]+?)(?<!\\)\$(?!\$)/g,(full,a,b,c,d)=>{
      const index=math.push({text:a??b??c??d,display: a!==undefined||b!==undefined})-1;return `MATHPLACEHOLDER${index}ENDMATH`;
    });
    let html = window.marked ? window.marked.parse(protectedText,{breaks:false,gfm:true}) : `<p>${esc(protectedText).replace(/\n/g,'<br>')}</p>`;
    html=sanitizeHTML(html);
    html=html.replace(/MATHPLACEHOLDER(\d+)ENDMATH/g,(full,index)=>{
      const formula=math[Number(index)];if (!formula)return full;
      try {if(window.katex)return window.katex.renderToString(formula.text,{displayMode:formula.display,throwOnError:false,trust:false,strict:'ignore',output:'htmlAndMathml'});}
      catch { /* Preserve the readable original on render failure. */ }
      return `<code class="math-error">${esc(formula.text)}</code>`;
    });
    return html;
  }
  function renderLessonShell(lesson, params = new URLSearchParams()) {
    const info=lessonMap.get(lesson.id), chapter=catalog.chapters.find(c=>String(c.id)===String(lesson.chapter));
    $('#main').innerHTML=`<nav class="breadcrumbs" aria-label="当前位置"><a href="#/">学习总览</a><span aria-hidden="true">/</span><span>第${esc(chapter?.number||lesson.chapter)}章 ${esc(chapter?.title||'')}</span><span aria-hidden="true">/</span><span>${esc(lesson.section)}</span></nav><header class="lesson-header"><div class="lesson-topline"><span class="chapter-pill">${esc(lesson.section)} · ${esc(catalog.chapters.flatMap(c=>c.sections).find(s=>s.id===lesson.section)?.title||'知识点导读')}</span><div class="lesson-actions"><button class="button secondary bookmark-button ${state.bookmarks.includes(lesson.id)?'is-active':''}" data-action="bookmark" aria-pressed="${state.bookmarks.includes(lesson.id)}">${state.bookmarks.includes(lesson.id)?'★ 已收藏':'☆ 收藏'}</button><button class="button primary complete-button ${state.completed.includes(lesson.id)?'is-active':''}" data-action="complete" aria-pressed="${state.completed.includes(lesson.id)}">${state.completed.includes(lesson.id)?'✓ 已完成':'标记为完成'}</button></div></div><h1>${esc(lesson.title)}</h1><div class="lesson-meta"><span>零基础辅助导读</span><span>约 ${info.minutes||15} 分钟</span><span>${num(lesson.pages||info.pages)} 页课件帧</span><span>${(lesson.refs||[]).length} 处来源</span></div></header><div class="lesson-tabs" role="tablist" aria-label="学习内容"><button role="tab" id="tab-guide" data-tab="guide" aria-controls="lesson-panel">知识点讲解</button><button role="tab" id="tab-items" data-tab="items" aria-controls="lesson-panel">原页逐条索引 <span class="tab-count">${(lesson.items||[]).length}</span></button><button role="tab" id="tab-pages" data-tab="pages" aria-controls="lesson-panel">课件原页</button></div><section id="lesson-panel" role="tabpanel" tabindex="0"></section><section class="notes-box" aria-labelledby="notes-title"><div class="notes-heading"><h2 id="notes-title">写下你的理解</h2><span class="note-save-status" id="note-save-status">${state.notes[lesson.id]?.text?'已保存在此浏览器':'笔记仅保存在此浏览器'}</span></div><textarea id="lesson-note" maxlength="20000" placeholder="哪一步还没想通？试着用自己的话写下定义、解题思路，或一个反例……" aria-label="本知识点的学习笔记">${esc(state.notes[lesson.id]?.text||'')}</textarea><p class="note-foot">输入后自动保存 · 最多 20,000 字 · 换设备前请导出备份</p></section>${lessonNavigation(lesson.id)}`;
    updateNav(null,lesson); bindNote(lesson.id); setTab(activeTab,params);
  }
  function lessonNavigation(id) {
    const index=lessons.findIndex(l=>l.id===id),previous=lessons[index-1],next=lessons[index+1];
    return `<nav class="lesson-navigation" aria-label="相邻知识点">${previous?`<a href="${lessonURL(previous.id)}"><small>← 上一个知识点</small><span>${esc(previous.title)}</span></a>`:'<span></span>'}${next?`<a href="${lessonURL(next.id)}"><small>下一个知识点 →</small><span>${esc(next.title)}</span></a>`:`<a href="#/"><small>回到总览 →</small><span>回顾你的学习进度</span></a>`}</nav>`;
  }
  function bindNote(id) {
    $('#lesson-note').addEventListener('input',event=>{
      // Update memory immediately so changing routes cannot lose the last keystroke.
      state.notes[id]={text:event.target.value,updatedAt:Date.now()};
      $('#note-save-status').textContent='正在保存…';
      clearTimeout(noteTimer); noteTimer=setTimeout(()=>{
        const saved=save(); if (currentLesson?.id===id && $('#note-save-status')) $('#note-save-status').textContent=saved?'已保存在此浏览器':'保存失败，请导出备份';
      },500);
    });
  }
  function setTab(tab, params = new URLSearchParams()) {
    if (!currentLesson || !$('#lesson-panel')) return;
    activeTab=['guide','items','pages'].includes(tab)?tab:'guide'; viewer=null;
    try{history.replaceState(null,'',`${lessonURL(currentLesson.id)}${activeTab==='guide'?'':`?tab=${activeTab}`}`);}catch{/* Reading still works when history changes are unavailable. */}
    $$('[data-tab]').forEach(button=>{const active=button.dataset.tab===activeTab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    $('#lesson-panel').setAttribute('aria-labelledby',`tab-${activeTab}`);
    if(activeTab==='guide')renderGuide();else if(activeTab==='items')renderItems();else renderLessonPages(params);
  }
  function renderGuide() {
    $('#lesson-panel').innerHTML=`<div class="reading-layout"><div class="reading-content"><p class="editorial-note">这份导读帮助你补齐前置知识、理解推理步骤。课件原页是概念、定理和例题的依据；点击上方「原页逐条索引」可随时核对。</p><article class="prose" id="guide-content">${markdownHTML(currentLesson.guide)}</article></div><nav class="reading-outline" aria-label="本页导读"><span>这一页的学习线索</span><div id="guide-outline"></div></nav></div>`;
    const headings=$$('h2,h3',$('#guide-content'));
    $('#guide-outline').innerHTML=headings.map((heading,index)=>{heading.id=`guide-heading-${index}`;return `<a href="#${heading.id}" data-action="heading" data-heading="${heading.id}">${esc(heading.textContent)}</a>`;}).join('')||'<span class="muted">顺着正文开始阅读</span>';
  }
  function renderItems() {
    const types=['全部',...new Set((currentLesson.items||[]).map(item=>item.type||'原页'))];
    if(!types.includes(itemFilter))itemFilter='全部';
    const items=(currentLesson.items||[]).filter(item=>itemFilter==='全部'||(item.type||'原页')===itemFilter);
    const pageSize=24,pageCount=Math.ceil(items.length/pageSize);itemPage=Math.max(0,Math.min(itemPage,pageCount-1));
    $('#lesson-panel').innerHTML=`<p class="viewer-intro">索引用于定位课件中的定义、定理、例题与练习。索引标题仅用于定位，部分标题可能重复；完整条件、公式与推导请在原图中阅读。点击任一条可打开对应原页，继续前后逐帧阅读。</p><div class="item-toolbar"><div class="filter-tabs" aria-label="索引类型">${types.map(type=>`<button class="filter-chip ${itemFilter===type?'active':''}" data-filter="${esc(type)}" aria-pressed="${itemFilter===type}">${esc(type)}</button>`).join('')}</div><small class="muted">${items.length} 条索引</small></div><div class="original-index">${items.slice(itemPage*pageSize,(itemPage+1)*pageSize).map(item=>`<button class="original-item" data-source="${esc(item.source)}" data-page="${Number(item.start)}" data-action="item-page"><span class="item-type">${esc(item.type||'原页')}</span><span class="item-text"><h3>${esc(item.title||'课件原页')}</h3><p>打开原页查看完整内容</p><small>${esc(catalog.sources.find(s=>s.id===item.source)?.title||item.source)} · 第 ${item.start}${item.end>item.start?`–${item.end}`:''} 页${item.frames>1?` · ${item.frames} 帧`:''}</small></span><span class="item-arrow" aria-hidden="true">↗</span></button>`).join('')||'<div class="empty-state compact"><p>此类型暂无索引，可以在「课件原页」中逐页阅读。</p></div>'}</div>${pageCount>1?`<div class="pagination"><button class="button secondary small" data-item-page="${itemPage-1}" ${itemPage===0?'disabled':''}>上一页</button><span>${itemPage+1} / ${pageCount}</span><button class="button secondary small" data-item-page="${itemPage+1}" ${itemPage>=pageCount-1?'disabled':''}>下一页</button></div>`:''}`;
  }
  async function renderLessonPages(params) {
    const lesson=currentLesson, token=routeToken;
    $('#lesson-panel').innerHTML='<div class="initial-loading" role="status"><span class="loading-orbit" aria-hidden="true"></span><p>正在打开对应课件原页…</p></div>';
    try {
      const refs=lesson.refs||[];
      if(!refs.length){$('#lesson-panel').innerHTML='<div class="empty-state"><p>这个知识点暂未关联原页，请参看本章课件说明。</p></div>';return;}
      const frames=[];
      // Keep source/page references only. Images and source OCR load on demand.
      const seen=new Set();
      refs.forEach(ref=>{for(let page=ref.start;page<=ref.end;page++){const key=`${ref.source}:${page}`;if(!seen.has(key)){seen.add(key);frames.push({source:ref.source,page});}}});
      let selected=params.get('source')?{source:params.get('source'),page:Number(params.get('page'))}:state.lastPages[lesson.id];
      let index=selected?frames.findIndex(frame=>frame.source===selected.source&&frame.page===selected.page):0;
      viewer={kind:'lesson',frames,index:Math.max(0,index),token,lesson:lesson.id,revision:0};
      $('#lesson-panel').innerHTML=`<p class="viewer-intro">这里保留该知识点关联的全部课件帧，包括逐步出现的动画演算与不同课件的复习页。下方页码对应来源文件中的实际页码；拖动进度条可快速翻阅。点击图片查看大图。</p><div id="page-viewer"></div><details class="ocr-panel"><summary>当前原页的识别文字（仅辅助检索）</summary><div id="ocr-text" class="ocr-text">正在读取…</div></details><div class="ref-list">${refs.map(ref=>`<button class="ref-link" data-action="ref-page" data-source="${esc(ref.source)}" data-page="${ref.start}"><span>${esc(ref.title||catalog.sources.find(s=>s.id===ref.source)?.title||ref.source)}</span><span>第 ${ref.start}–${ref.end} 页 ↗</span></button>`).join('')}</div>`;
      await renderViewer();
    } catch(error) {if(token===routeToken&&activeTab==='pages')$('#lesson-panel').innerHTML=errorHTML(error.message,'retry-pages');}
  }
  async function renderViewer() {
    const current=viewer;if(!current)return;
    const revision=++current.revision, frame=current.frames[current.index];if(!frame)return;
    const mount=$('#page-viewer');if(!mount)return;
    const focused=mount.contains(document.activeElement)?document.activeElement:null;
    const restoreID=focused?.id,restoreAction=focused?.dataset.action;
    const previousHeight=mount.offsetHeight;
    mount.innerHTML=`<div class="initial-loading" style="min-height:${Math.min(previousHeight||400,700)}px" role="status"><span class="loading-orbit" aria-hidden="true"></span><p>正在读取第 ${frame.page} 页…</p></div>`;
    try {
      const source=await getSource(frame.source);
      if(viewer!==current||current.revision!==revision||routeToken!==current.token)return;
      const page=source.pages.find(p=>Number(p.page)===frame.page);
      if(!page)throw new Error('该页未在课件清单中找到，请选择其他页码。');
      current.pageData=page;current.sourceData=source;
      const sourceIds=current.kind==='library'?catalog.sources.map(s=>s.id):[...new Set(current.frames.map(f=>f.source))];
      const sourceFrames=current.frames.filter(f=>f.source===frame.source);
      const min=sourceFrames[0].page,max=sourceFrames[sourceFrames.length-1].page;
      const asset=`slides/${encodeURIComponent(page.asset)}.webp`;
      mount.innerHTML=`<div class="viewer"><div class="viewer-toolbar"><label class="field source-field"><span>课件来源</span><select id="viewer-source" aria-label="选择课件来源">${sourceIds.map(id=>`<option value="${esc(id)}" ${id===frame.source?'selected':''}>${esc(catalog.sources.find(s=>s.id===id)?.title||id)}</option>`).join('')}</select></label><div class="page-controls"><button class="button secondary small" data-action="prev-page" ${current.index===0?'disabled':''} aria-label="上一张原页">← 上一页</button><label class="visually-hidden" for="viewer-page">来源中的实际页码</label><input id="viewer-page" type="number" inputmode="numeric" min="${min}" max="${max}" value="${frame.page}" aria-label="来源中的实际页码，输入后按回车"><span>/ ${max}</span><button class="button secondary small" data-action="next-page" ${current.index===current.frames.length-1?'disabled':''} aria-label="下一张原页">下一页 →</button></div></div><div class="page-image-wrap"><button class="page-image-button" data-action="image" aria-label="放大第 ${frame.page} 页课件原图"><img id="slide-image" src="${asset}" alt="${esc(source.title)}，第 ${frame.page} 页原始课件" loading="lazy" decoding="async"></button><div class="image-loading" id="image-loading" role="status">正在加载课件图片…</div></div><div class="viewer-caption"><span><strong>${esc(source.title)}</strong> · 实际第 ${frame.page} 页</span><button class="text-button" data-action="image">放大原图 ↗</button></div><div class="frame-slider"><label for="frame-range"><span>${current.kind==='lesson'?'当前知识点全部原页帧':'当前课件全部原页'} · ${num(current.index+1)} / ${num(current.frames.length)}</span><span>含动画与复习帧</span></label><input id="frame-range" type="range" min="0" max="${current.frames.length-1}" value="${current.index}" aria-valuetext="第 ${current.index+1} 帧，共 ${current.frames.length} 帧"></div></div>`;
      const image=$('#slide-image');
      image.addEventListener('load',()=>$('#image-loading')?.remove(),{once:true});
      image.addEventListener('error',()=>{if(viewer===current&&current.revision===revision){$('.page-image-wrap').innerHTML='<div class="image-error"><p>这张课件图片暂时没能加载。请检查网络，或尝试重新打开。</p><button class="button secondary" data-action="retry-image">重新加载图片</button></div>'; }},{once:true});
      if(image.complete&&image.naturalWidth)$('#image-loading')?.remove();
      if($('#ocr-text'))$('#ocr-text').textContent=page.text||'这一帧没有可用的识别文字，请直接查看原图。';
      $('#viewer-source').addEventListener('change',event=>{
        if(current.kind==='library'){location.hash=`#/library?source=${encodeURIComponent(event.target.value)}`;return;}
        const index=current.frames.findIndex(f=>f.source===event.target.value);if(index>=0){current.index=index;renderViewer();}
      });
      $('#viewer-page').addEventListener('change',event=>jumpToPage(frame.source,Number(event.target.value)));
      $('#viewer-page').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.target.blur();}});
      $('#frame-range').addEventListener('change',event=>{current.index=Number(event.target.value);renderViewer();});
      if((!document.activeElement||document.activeElement===document.body)&&(restoreID||restoreAction)){
        const nextFocus=restoreID?document.getElementById(restoreID):mount.querySelector(`[data-action="${restoreAction}"]`);if(nextFocus&&!nextFocus.disabled)nextFocus.focus({preventScroll:true});
      }
      if(current.kind==='lesson'){state.lastPages[current.lesson]={source:frame.source,page:frame.page};save();}
      try{history.replaceState(null,'',current.kind==='lesson'?pageURL(current.lesson,frame.source,frame.page):`#/library?source=${encodeURIComponent(frame.source)}&page=${frame.page}`);}catch{/* Keep the viewer usable in restricted browser contexts. */}
      if(current.kind==='library'&&$('#library-lesson-link')){
        const topic=lessonMap.get(page.lesson);$('#library-lesson-link').innerHTML=topic?`这张原页属于「${esc(topic.title)}」。<a class="text-button" href="${lessonURL(topic.id)}">打开辅助导读 →</a>`:'各知识点的导读与原页范围可从左侧目录打开。';
      }
    }catch(error){if(viewer===current&&current.revision===revision)mount.innerHTML=errorHTML(error.message,'retry-image');}
  }
  function jumpToPage(source,page) {
    if(!viewer)return;
    const index=viewer.frames.findIndex(f=>f.source===source&&f.page===page);
    if(index<0){notice('这个页码不在当前知识点的课件范围内。请查看下方来源页码，或前往完整原页库。');const input=$('#viewer-page');if(input)input.value=viewer.frames[viewer.index].page;return;}
    viewer.index=index;renderViewer();
  }
  async function renderLibrary(params,token) {
    updateNav('library');
    const selected=catalog.sources.find(s=>s.id===params.get('source'))||catalog.sources.find(s=>(s.chapters||[]).includes('1'))||catalog.sources[0];
    $('#main').innerHTML=`<div class="eyebrow">THE ORIGINAL MATERIALS</div><h1 class="page-title">每一页，都在这里。</h1><p class="page-subtitle">${catalog.stats.sources} 份原始课件，${num(catalog.stats.pages)} 页帧完整保留。动画展开的每一步、复习页和补充例题，均可按来源与真实页码查看。每次只加载当前图片，手机也能逐页阅读。</p><div class="library-summary">${catalog.sources.map(s=>`<a href="#/library?source=${encodeURIComponent(s.id)}" class="filter-chip ${s.id===selected.id?'active':''}" aria-current="${s.id===selected.id?'page':'false'}">${esc(s.title)} <small>(${s.pages})</small></a>`).join('')}</div><div id="page-viewer"></div><details class="ocr-panel"><summary>当前原页的识别文字（仅辅助检索）</summary><div id="ocr-text" class="ocr-text">正在读取…</div></details><p class="notice" id="library-lesson-link">各知识点的导读与原页范围可从左侧目录打开。</p>`;
    $('#page-viewer').innerHTML='<div class="initial-loading" role="status"><span class="loading-orbit" aria-hidden="true"></span><p>正在打开原页库…</p></div>';
    try {
      const source=await getSource(selected.id);if(token!==routeToken)return;
      const frames=source.pages.map(page=>({source:selected.id,page:Number(page.page)}));
      let index=frames.findIndex(f=>f.page===Number(params.get('page')));if(index<0)index=0;
      viewer={kind:'library',frames,index,token,revision:0};await renderViewer();
    }catch(error){if(token===routeToken)$('#page-viewer').innerHTML=errorHTML(error.message);}
  }
  function renderNotebook() {
    updateNav('notebook');
    const notes=Object.entries(state.notes).filter(([id,note])=>validID(id)&&note.text.trim()).sort((a,b)=>b[1].updatedAt-a[1].updatedAt);
    $('#main').innerHTML=`<div class="eyebrow">YOUR OWN UNDERSTANDING</div><h1 class="page-title">留下一点自己的理解。</h1><p class="page-subtitle">收藏需要回看的概念，也记下推导中的灵光与疑问。这些记录保存在当前浏览器；导出一份备份，就可以带到另一台设备继续学习。</p><div class="hero-actions" style="margin-bottom:32px"><button class="button primary" data-action="data">备份与迁移进度 ↗</button><span class="muted" style="font-size:11px">已完成 ${state.completed.length} / ${lessons.length} 个知识点</span></div><div class="notebook-grid"><section class="notebook-section"><h2>我的笔记 <small class="muted">${notes.length}</small></h2>${notes.map(([id,note])=>`<article class="notebook-entry"><a href="${lessonURL(id)}">${esc(lessonMap.get(id).title)} ↗</a><small>${new Date(note.updatedAt).toLocaleString('zh-CN')}</small><p>${esc(note.text)}</p></article>`).join('')||'<div class="empty-state compact"><p>还没有笔记。<br>在任一知识点正文下方，写下你的第一条理解。</p></div>'}</section><section class="notebook-section"><h2>收藏的知识点 <small class="muted">${state.bookmarks.length}</small></h2>${state.bookmarks.map(id=>`<article class="notebook-entry"><a href="${lessonURL(id)}">${esc(lessonMap.get(id).title)} ↗</a><small>${esc(lessonMap.get(id).section)} · ${state.completed.includes(id)?'已完成':'待学习'}</small><div><button class="text-button" data-action="remove-bookmark" data-id="${esc(id)}">取消收藏</button></div></article>`).join('')||'<div class="empty-state compact"><p>还没有收藏。<br>在知识点顶部点击「收藏」，把难点留下来。</p></div>'}</section></div>`;
  }
  const practiceTools = {
    euclid:{title:'扩展欧几里得法',description:'输入两个不全为零的整数，查看带余除法的每一步，并核对 Bézout 等式。预填课件中的 169 与 121。',fields:[['a','整数 a','169'],['b','整数 b','121']],links:['euclid','bezout','extended']},
    power:{title:'模重复平方',description:'把指数拆成二进制，从低位向高位逐步平方与乘入；每步都取模。底数与模不要求互素。',fields:[['a','底数 a','7'],['e','非负指数 e','128'],['m','正整数模 m','13']],links:['fast-power','euler']},
    linear:{title:'一次同余式',description:'求解 ax ≡ b (mod m)。先检查 gcd(a,m) 是否整除 b，再求出模 m 下的全部解。预填课件中的 169x ≡ 9 (mod 121)。',fields:[['a','系数 a','169'],['b','常数 b','9'],['m','正整数模 m','121']],links:['linear','reduced']},
    crt:{title:'中国剩余定理',description:'每行输入「余数, 模」。逐步合并同余条件；模不互素时也会先检查相容性。预填「物不知数」余 2、3、2，模 3、5、7。',fields:[['conditions','同余条件：每行一个余数与模','2, 3\n3, 5\n2, 7']],links:['crt-story','crt-two','crt-general','crt-iterate']},
    jacobi:{title:'Jacobi 符号',description:'用拆因子 2、互反和取余核对 Jacobi 符号。分母必须为正奇数；合数分母下，符号为 1 不能保证是平方剩余。',fields:[['a','分子 a','1001'],['n','正奇数分母 n','9907']],links:['jacobi','reciprocity','legendre']},
    roots:{title:'模平方根',description:'求 x² ≡ a (mod m) 的全部最小非负解。这里逐个剩余类核对，支持 1 ≤ m ≤ 20,000；请对照课件学习大模下更高效的算法。预填 x² ≡ 8 (mod 17)。',fields:[['a','右端常数 a','8'],['m','模 m（1–20,000）','17']],links:['sqrt-special','sqrt-general','sqrt-composite']}
  };
  let practiceKind='euclid',mathModule;
  function renderPractice(params) {
    updateNav('practice');practiceKind=Object.hasOwn(practiceTools,params.get('tool'))?params.get('tool'):'euclid';
    $('#main').innerHTML=`<div class="eyebrow">LEARN BY WORKING IT OUT</div><h1 class="page-title">先自己算，再核对一步。</h1><p class="page-subtitle">用具体数字观察算法怎样运行。先在纸上完成演算，再展开计算过程核对；如果某一步没想明白，沿着下方链接回到相应知识点。</p><div class="filter-tabs practice-select" aria-label="选择计算练习">${Object.entries(practiceTools).map(([key,tool])=>`<a class="filter-chip ${practiceKind===key?'active':''}" href="#/practice?tool=${key}" aria-current="${practiceKind===key?'page':'false'}">${esc(tool.title)}</a>`).join('')}</div><section class="practice-panel" id="practice-panel"></section><p class="notice" style="margin-top:20px">计算用于核对课件例题与尝试新数字。算法条件、证明和考试书写步骤，请以导读和原课件为依据。输入整数最多 80 位，结果使用整数精确运算。</p>`;
    renderPracticePanel();
  }
  function renderPracticePanel() {
    const tool=practiceTools[practiceKind];
    $('#practice-panel').innerHTML=`<h2>${esc(tool.title)}</h2><p class="practice-description">${esc(tool.description)}</p><form id="practice-form"><div class="practice-fields">${tool.fields.map(([name,label,value])=>`<label class="field"><span>${esc(label)}</span>${name==='conditions'?`<textarea name="conditions" required maxlength="2000" spellcheck="false">${esc(value)}</textarea>`:`<input name="${name}" type="text" inputmode="numeric" maxlength="81" required value="${esc(value)}" autocomplete="off" aria-label="${esc(label)}">`}</label>`).join('')}</div><div class="hero-actions"><button class="button primary" type="submit">展开计算过程 →</button><button class="button secondary" type="button" data-action="reset-practice">重置为示例</button></div></form><div class="practice-links"><span>回到知识点：</span>${tool.links.map(id=>`<a href="${lessonURL(id)}">${esc(lessonMap.get(id)?.title||id)} ↗</a>`).join('')}</div><div id="practice-result" class="practice-result" aria-live="polite"><p class="muted" style="font-size:12px;margin:0">在纸上写下你的答案，再展开过程看看。</p></div>`;
    $('#practice-form').addEventListener('submit',calculatePractice);
  }
  async function calculatePractice(event) {
    event.preventDefault();const result=$('#practice-result'),button=event.target.querySelector('[type="submit"]'),kind=practiceKind;
    const values=Object.fromEntries(new FormData(event.target));button.disabled=true;result.className='practice-result';result.textContent='正在展开计算过程…';
    try{
      for(const [key,value]of Object.entries(values))if(key!=='conditions'&&!/^[+-]?\d{1,80}$/.test(value.trim()))throw new Error('每个输入必须是不超过 80 位的整数。');
      if(!mathModule)mathModule=await import('./math-tools.js');
      const m=mathModule;let content='';
      if(kind==='euclid'){
        const r=m.extendedGcd(values.a,values.b);
        content=`### 最大公因数与 Bézout 等式\n\n$$\\gcd(${values.a},${values.b})=${r.gcd}$$\n\n$$(${r.x})\\cdot(${values.a})+(${r.y})\\cdot(${values.b})=${r.gcd}$$\n\n每行用上一行的除数除以余数，直到余数为零。最后一个非零余数就是最大公因数。\n\n| 步骤 | 带余除法 |\n|---|---|\n${r.steps.map((s,i)=>`| ${i+1} | $${s.a}=${s.q}\\times${s.b}+${s.r}$ |`).join('\n')}`;
      }else if(kind==='power'){
        const r=m.modPow(values.a,values.e,values.m);
        content=`### 重复平方的结果\n\n$$(${values.a})^{${values.e}}\\equiv ${r.value}\\pmod{${values.m}}$$\n\n从二进制的最低位开始。当前位为 1 时，把这一位的幂乘入累积结果；为 0 时保留结果，然后把当前幂平方。\n\n| 二进制位（从 0 起） | 该位 | 当前幂模 m | 累积结果模 m |\n|---|---|---|---|\n${r.steps.map(s=>`| ${s.position} | ${s.bit} | $${s.base}$ | $${s.result}$ |`).join('\n')}${r.steps.length?'':'\n\n指数为 0，直接返回 $1\\bmod m$。'}`;
      }else if(kind==='linear'){
        const r=m.solveLinear(values.a,values.b,values.m);
        content=`### 先判断是否有解\n\n$$d=\\gcd(${values.a},${values.m})=${r.gcd}$$\n\n`;
        if(!r.solvable)content+=`因为 $${r.gcd}\\nmid ${values.b}$，所以这个同余式无解。`;
        else if(r.count===1n)content+=`因为 $d=1$，模 $${values.m}$ 下恰有一个解类：\n\n$$x\\equiv ${r.base}\\pmod{${values.m}}$$\n\n唯一的最小非负解是 $${r.base}$。全部整数解为 $x=${r.base}+${values.m}t$，其中 $t\\in\\mathbb Z$。`;
        else content+=`因为 $d\\mid b$，模 $m$ 恰有 $d=${r.count}$ 个不同的解。约去公因数后，基本解为 $x_0=${r.base}$，解之间相差 $m/d=${r.reducedModulus}$。\n\n$$x=${r.base}+k\\cdot ${r.reducedModulus},\\qquad k=${r.count===2n?'0,1':`0,1,\\ldots,${r.count-1n}`}$$\n\n最小非负解${r.count>32n?'（先列出前 32 个，完整解由上式给出）':''}：\n\n$$${r.solutions.slice(0,32).join(',\\ ')}${r.count>32n?',\\ldots':''}$$`;
      }else if(kind==='crt'){
        const lines=values.conditions.trim().split(/\r?\n/).filter(line=>line.trim());
        if(lines.length<1||lines.length>12)throw new Error('请输入 1 至 12 行同余条件，每行填写一个余数与模。');
        const equations=lines.map((line,index)=>{const pair=line.trim().split(/[,，\s]+/);if(pair.length!==2||!pair.every(value=>/^[+-]?\d{1,80}$/.test(value)))throw new Error(`第 ${index+1} 行格式不正确，请按「余数, 模」填写整数。`);return{remainder:pair[0],modulus:pair[1]};});
        const r=m.crt(equations);
        if(!r.solvable)content=`### 这些条件不相容\n\n${r.reason}。先检查模的最大公因数是否整除余数之差，再使用中国剩余定理。`;
        else content=`### 合并后的同余式\n\n$$x\\equiv ${r.remainder}\\pmod{${r.modulus}}$$\n\n全部整数解为 $x=${r.remainder}+${r.modulus}k$，其中 $k\\in\\mathbb Z$。每次把一个新条件合并到已有条件中，新周期取两个模的最小公倍数。\n\n| 步骤 | 原有条件 | 新条件 | 合并结果 |\n|---|---|---|---|\n${r.steps.map((s,i)=>`| ${i+1} | $x\\equiv${s.remainder}\\pmod{${s.modulus}}$ | $x\\equiv${s.nextRemainder}\\pmod{${s.nextModulus}}$ | $x\\equiv${s.result}\\pmod{${s.period}}$ |`).join('\n')}`;
      }else if(kind==='jacobi'){
        const r=m.jacobi(values.a,values.n);
        content=`### Jacobi 符号的结果\n\n$$\\left(\\frac{${values.a}}{${values.n}}\\right)=${r.value}$$\n\n${r.value===0?'分子与分母不互素。':'注意：正奇数分母为合数时，结果为 1 不能据此断言原同余式有平方根。'}\n\n| 步骤 | 操作 | 当前分子 | 当前分母 | 累积符号 |\n|---|---|---|---|---|\n${r.steps.map((s,i)=>`| ${i+1} | ${s.operation}${s.twos?`（${s.twos} 个 2）`:''} | $${s.a}$ | $${s.n}$ | ${s.sign} |`).join('\n')}`;
      }else if(kind==='roots'){
        const r=m.quadraticRootsBounded(values.a,values.m);
        content=`### 模 ${r.modulus} 的全部平方根\n\n$$x^2\\equiv ${r.reducedA}\\pmod{${r.modulus}}$$\n\n依次核对 $0,1,\\ldots,${r.modulus-1n}$，共找到 **${r.count}** 个不同的最小非负解。\n\n${r.count?`$$x\\in\\{${r.roots.slice(0,100).join(',\\ ')}${r.count>100?',\\ldots':''}\\}$$\n\n${r.count>100?'此处列出前 100 个解。':''}`:'在这个模下没有平方根。'}\n\n${r.count&&r.count<=100?`| 候选解 x | 平方 | 取模后的余数 |\n|---|---|---|\n${r.roots.map(x=>`| $${x}$ | $${x*x}$ | $${x*x%r.modulus}$ |`).join('\n')}`:''}\n\n逐类核对可以帮助理解「解数」的含义；大模计算请回到课件学习模平方根算法、素数幂提升与 CRT。`;
      }
      if(!document.contains(result)||practiceKind!==kind)return;
      result.innerHTML=`<div class="prose">${markdownHTML(content)}</div>`;
    }catch(error){if(document.contains(result)){result.className='practice-result error';result.textContent=error.message||'暂时无法计算，请检查输入后重试。';}}
    finally{if(document.contains(button))button.disabled=false;}
  }
  async function route() {
    if(!catalog)return;
    clearTimeout(noteTimer);save();closeMenu();
    const token=++routeToken, {parts,params}=routeInfo();
    currentLesson=null;viewer=null;itemFilter='全部';itemPage=0;
    document.title='信息安全数学基础 · 自学手册';
    if(parts[0]==='lesson'){
      let id;try{id=decodeURIComponent(parts[1]||'');}catch{id='';}
      if(!validID(id)){updateNav();$('#main').innerHTML='<div class="empty-state"><h1>没有找到这个知识点</h1><p>请从课程目录重新选择，或返回学习总览。</p><a class="button primary" href="#/">返回总览</a></div>';return;}
      activeTab=['guide','items','pages'].includes(params.get('tab'))?params.get('tab'):'guide';
      $('#main').innerHTML='<div class="initial-loading" role="status"><span class="loading-orbit" aria-hidden="true"></span><p>正在打开知识点…</p></div>';updateNav(null,lessonMap.get(id));
      try{const lesson=await getLesson(id);if(token!==routeToken)return;currentLesson=lesson;state.lastLesson=id;save();document.title=`${lesson.title} · 信息安全数学基础`;renderLessonShell(lesson,params);}
      catch(error){if(token===routeToken)$('#main').innerHTML=errorHTML(error.message);}
    }else if(parts[0]==='library'){await renderLibrary(params,token);if(token===routeToken)document.title='完整原页库 · 信息安全数学基础';}
    else if(parts[0]==='notebook'){renderNotebook();document.title='我的笔记与收藏 · 信息安全数学基础';}
    else if(parts[0]==='practice'){renderPractice(params);document.title='计算练习 · 信息安全数学基础';}
    else renderHome();
    if(token===routeToken){window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});}
  }
  async function openSearch() {
    openDialog('#search-dialog');$('#search-input').focus();
    if(!searchData&&!searchPromise){$('#search-results').innerHTML='<div class="empty-state compact" role="status"><p>首次使用正在准备全文索引…</p></div>';searchPromise=fetchJSON('data/search.json').then(data=>{if(!Array.isArray(data))throw new Error('搜索索引格式有误。');searchData=data.map(row=>({...row,haystack:`${row.title||''} ${row.text||''}`.toLocaleLowerCase()}));return searchData;}).catch(error=>{searchPromise=null;$('#search-results').innerHTML=`<div class="empty-state compact"><p>${esc(error.message)}</p><button class="button secondary" data-action="retry-search">重新加载索引</button></div>`;});}
    if(searchPromise)await searchPromise;
    if(searchData)runSearch();
  }
  async function runSearch() {
    const sequence=++searchSequence,query=$('#search-input').value.trim().toLocaleLowerCase();searchPage=0;
    if(!searchData)return;
    if(!query){$('#search-results').innerHTML='<div class="empty-state compact"><p>输入知识点、定理名称，或原页中的关键词。</p></div>';return;}
    const terms=query.split(/\s+/).filter(Boolean).slice(0,8);const guides=[],originals=[];let total=0;
    $('#search-results').innerHTML='<div class="empty-state compact" role="status"><p>正在检索原页与知识点…</p></div>';
    for(let offset=0;offset<searchData.length;offset+=300){
      if(sequence!==searchSequence)return;
      for(const row of searchData.slice(offset,offset+300)){
        if(terms.every(term=>row.haystack.includes(term))){
          total++;
          const title=String(row.title||'').toLocaleLowerCase(),titleMatches=terms.every(term=>title.includes(term));
          const titleScore=terms.reduce((sum,term)=>sum+(title.includes(term)?10:0),0);
          if(row.type==='知识点')guides.push({...row,score:(titleMatches?2000:1000)+titleScore,matchKind:titleMatches?'导读标题匹配':'导读正文匹配'});
          else if(originals.length<500)originals.push({...row,score:titleScore,matchKind:'课件原页'});
        }
      }
      if(searchData.length>1000)await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(sequence!==searchSequence)return;
    // Reserve room for every matching guide before applying the original-frame limit.
    // Repeated animation frames must never displace an explanatory lesson.
    searchMatches=[...guides.sort((a,b)=>b.score-a.score),...originals.sort((a,b)=>b.score-a.score)].slice(0,Math.max(500,guides.length));
    renderSearchResults(total,terms);
  }
  function highlight(text,terms) {
    let result=esc(text);const safeTerms=terms.map(esc).filter(Boolean).sort((a,b)=>b.length-a.length);
    if(!safeTerms.length)return result;
    const pattern=safeTerms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    try{return result.replace(new RegExp(pattern,'gi'),match=>`<mark>${match}</mark>`);}catch{return result;}
  }
  function renderSearchResults(total,terms) {
    const mount=$('#search-results');mount.dataset.total=String(total);mount.dataset.terms=JSON.stringify(terms);
    const pageSize=20,pageCount=Math.ceil(searchMatches.length/pageSize);
    const guideCount=searchMatches.filter(row=>row.type==='知识点').length,shownOriginals=searchMatches.length-guideCount;
    const countDescription=`共找到 ${num(total)} 条匹配：${guideCount} 篇知识点导读、${num(total-guideCount)} 页课件帧。按导读标题、导读正文、原页的顺序展示。${total>searchMatches.length?`当前包含全部 ${guideCount} 篇匹配导读及前 ${shownOriginals} 页原页；更多原页请增加关键词缩小范围，或进入完整原页库逐帧浏览。`:''}`;
    mount.innerHTML=`<p class="search-count">${esc(countDescription)}</p>${searchMatches.slice(searchPage*pageSize,(searchPage+1)*pageSize).map(row=>{
      const text=String(row.text||'').replace(/\s+/g,' ');const hit=terms.map(term=>text.toLowerCase().indexOf(term)).filter(i=>i>=0).sort((a,b)=>a-b)[0]||0;const start=Math.max(0,hit-45);const snippet=(start?'…':'')+text.slice(start,start+150)+(text.length>start+150?'…':'');
      const url=row.source&&row.page?(validID(row.lesson)?pageURL(row.lesson,row.source,row.page):`#/library?source=${encodeURIComponent(row.source)}&page=${row.page}`):lessonURL(row.lesson);
      return `<a class="search-result" href="${url}" data-action="search-result"><h3>${highlight(row.title||lessonMap.get(row.lesson)?.title||'课件原页',terms)}</h3><p>${highlight(snippet,terms)}</p><small>${esc(row.matchKind||row.type||'课件原页')}${row.page?` · 实际第 ${row.page} 页`:''} · ${esc(lessonMap.get(row.lesson)?.title||'查看来源课件')} ↗</small></a>`;
    }).join('')||'<div class="empty-state compact"><p>没有找到匹配内容。<br>试试更短的词，或用「欧拉」「剩余」「群」等概念名称检索。</p></div>'}${pageCount>1?`<div class="pagination"><button class="button secondary small" data-search-page="${searchPage-1}" ${searchPage===0?'disabled':''}>上一页</button><span>${searchPage+1} / ${pageCount}</span><button class="button secondary small" data-search-page="${searchPage+1}" ${searchPage>=pageCount-1?'disabled':''}>下一页</button></div>`:''}`;
  }
  function exportProgress() {
    const payload={schema:SCHEMA,version:1,exportedAt:new Date().toISOString(),data:state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download=`数学基础-学习进度-${new Date().toLocaleDateString('sv-SE')}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
    $('#import-status').className='import-status';$('#import-status').textContent='已发起备份下载，请在浏览器下载列表确认文件已保存。';
  }
  async function importProgress(file) {
    const status=$('#import-status');status.className='import-status';status.textContent='正在检查备份文件…';
    try {
      if(!file) return;
      if(file.size>8*1024*1024)throw new Error('文件超过 8 MB，请选择本手册导出的学习进度文件。');
      let payload;try{payload=JSON.parse(await file.text());}catch{throw new Error('文件不是有效的 JSON 备份，请重新选择。');}
      if(!safeRecord(payload)||payload.schema!==SCHEMA||payload.version!==1)throw new Error('这不是当前版本自学手册的进度备份，请检查文件来源。');
      const imported=normalizeState(payload.data,true);
      let notesMerged=0;
      for(const [id,note]of Object.entries(imported.notes))if(!state.notes[id]||note.updatedAt>state.notes[id].updatedAt){state.notes[id]=note;notesMerged++;}
      state.completed=[...new Set([...state.completed,...imported.completed])];state.bookmarks=[...new Set([...state.bookmarks,...imported.bookmarks])];
      state.lastPages={...imported.lastPages,...state.lastPages};
      if(!state.lastLesson)state.lastLesson=imported.lastLesson;
      const saved=save();updateProgress();
      const rawCount=[...(payload.data.completed||[]),...(payload.data.bookmarks||[])].filter(id=>!validID(id)).length;
      status.textContent=`已合并 ${imported.completed.length} 条完成记录、${imported.bookmarks.length} 条收藏，更新 ${notesMerged} 条笔记。重复记录已去重。${rawCount?'不属于当前目录的记录已忽略。':''}${saved?'已保存在此浏览器。':'浏览器未能保存，请立即重新导出合并后的备份。'}`;
      // Refresh the background view without closing the import report.
      const info=routeInfo();if(info.parts[0]==='notebook')renderNotebook();else if(!info.parts.length)renderHome();else if(currentLesson){renderLessonShell(currentLesson);}
    }catch(error){status.className='import-status error';status.textContent=error.message;}
    finally{$('#import-file').value='';}
  }
  document.addEventListener('click',event=>{
    const actionNode=event.target.closest('[data-action]'),tab=event.target.closest('[data-tab]'),filter=event.target.closest('[data-filter]'),itemPager=event.target.closest('[data-item-page]'),searchPager=event.target.closest('[data-search-page]');
    if(tab){setTab(tab.dataset.tab);return;}
    if(filter){itemFilter=filter.dataset.filter;itemPage=0;renderItems();return;}
    if(itemPager){itemPage=Number(itemPager.dataset.itemPage);renderItems();$('#lesson-panel').scrollIntoView({block:'start'});return;}
    if(searchPager){searchPage=Number(searchPager.dataset.searchPage);const node=$('#search-results');renderSearchResults(Number(node.dataset.total),JSON.parse(node.dataset.terms));node.scrollTop=0;return;}
    if(!actionNode)return;
    const action=actionNode.dataset.action;
    if(action==='search')openSearch();
    else if(action==='retry-search')openSearch();
    else if(action==='menu'){const open=$('#sidebar').classList.toggle('is-open');$('#sidebar-scrim').hidden=!open;actionNode.setAttribute('aria-expanded',String(open));syncSidebar();if(open)$('#sidebar .brand').focus();}
    else if(action==='close-menu')closeMenu();
    else if(action==='close-dialog')actionNode.closest('dialog').close();
    else if(action==='data'){openDialog('#data-dialog');}
    else if(action==='theme'){state.settings.theme=state.settings.theme==='light'?'dark':'light';applySettings();save();notice(`已切换为${state.settings.theme==='dark'?'深色':'浅色'}阅读模式`);}
    else if(action==='font'){const fonts=['normal','large','larger'];state.settings.font=fonts[(fonts.indexOf(state.settings.font)+1)%fonts.length];applySettings();save();notice(`正文字号：${{normal:'标准',large:'大',larger:'更大'}[state.settings.font]}`);}
    else if(action==='retry')route();
    else if(action==='retry-pages')renderLessonPages(new URLSearchParams());
    else if(action==='bookmark'&&currentLesson){const id=currentLesson.id;const active=!state.bookmarks.includes(id);state.bookmarks=active?[...state.bookmarks,id]:state.bookmarks.filter(v=>v!==id);save();actionNode.classList.toggle('is-active',active);actionNode.setAttribute('aria-pressed',String(active));actionNode.textContent=active?'★ 已收藏':'☆ 收藏';notice(active?'已加入收藏':'已取消收藏');}
    else if(action==='complete'&&currentLesson){const id=currentLesson.id;const active=!state.completed.includes(id);state.completed=active?[...state.completed,id]:state.completed.filter(v=>v!==id);save();updateProgress();actionNode.classList.toggle('is-active',active);actionNode.setAttribute('aria-pressed',String(active));actionNode.textContent=active?'✓ 已完成':'标记为完成';notice(active?'这个知识点，向前一步。已标记完成。':'已取消完成标记');}
    else if(action==='remove-bookmark'){state.bookmarks=state.bookmarks.filter(v=>v!==actionNode.dataset.id);save();renderNotebook();notice('已取消收藏');}
    else if(action==='heading'){event.preventDefault();document.getElementById(actionNode.dataset.heading)?.scrollIntoView({block:'start'});}
    else if(action==='item-page'){setTab('pages',new URLSearchParams({source:actionNode.dataset.source,page:actionNode.dataset.page}));$('#lesson-panel').scrollIntoView({block:'start'});}
    else if(action==='ref-page'){jumpToPage(actionNode.dataset.source,Number(actionNode.dataset.page));$('#page-viewer')?.scrollIntoView({block:'start'});}
    else if(action==='prev-page'&&viewer){viewer.index=Math.max(0,viewer.index-1);renderViewer();}
    else if(action==='next-page'&&viewer){viewer.index=Math.min(viewer.frames.length-1,viewer.index+1);renderViewer();}
    else if(action==='retry-image')renderViewer();
    else if(action==='image'&&viewer?.pageData){$('#image-title').textContent=`${viewer.sourceData.title} · 第 ${viewer.frames[viewer.index].page} 页`;$('#large-image').src=`slides/${encodeURIComponent(viewer.pageData.asset)}.webp`;$('#large-image').alt=$('#image-title').textContent;$('#image-dialog').classList.remove('zoomed');openDialog('#image-dialog');}
    else if(action==='image-zoom')$('#image-dialog').classList.toggle('zoomed');
    else if(action==='search-result'){$('#search-dialog').close();if(actionNode.getAttribute('href')===location.hash)route();}
    else if(action==='export')exportProgress();
    else if(action==='reset-practice')renderPracticePanel();
  });
  $('#search-input').addEventListener('input',()=>{clearTimeout($('#search-input')._timer);$('#search-input')._timer=setTimeout(runSearch,150);});
  $('#import-file').addEventListener('change',event=>importProgress(event.target.files[0]));
  document.addEventListener('keydown',event=>{
    const editing=/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
    if(event.key==='/'&&!editing&&!$('dialog[open]')){event.preventDefault();openSearch();}
    if(event.key==='Escape'&&$('#sidebar').classList.contains('is-open')){closeMenu();$('[data-action="menu"]').focus();}
    if(event.key==='Tab'&&compactScreen.matches&&$('#sidebar').classList.contains('is-open')&&!$('dialog[open]')){
      const focusable=$$('a,button,summary,input,select,textarea',$('#sidebar')).filter(node=>node.getClientRects().length&&!node.disabled);
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    if(event.target.matches('[role="tab"]')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      event.preventDefault();const tabs=$$('[role="tab"]');let index=tabs.indexOf(event.target);index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;setTab(tabs[index].dataset.tab);tabs[index].focus();
    }
  });
  window.addEventListener('hashchange',route);
  compactScreen.addEventListener('change',()=>{closeMenu();syncSidebar();});
  syncSidebar();
  window.addEventListener('pagehide',()=>{clearTimeout(noteTimer);if(catalog)save();});
  // Clicks on the backdrop close only when both pointer ends are outside the dialog.
  $$('dialog').forEach(dialog=>{let downOutside=false;dialog.addEventListener('pointerdown',event=>{const r=dialog.getBoundingClientRect();downOutside=event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;});dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(downOutside&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();downOutside=false;});});
  async function init() {
    try {
      catalog=await fetchJSON('data/catalog.json');
      if(!Array.isArray(catalog.chapters)||!catalog.chapters.length||!Array.isArray(catalog.sources))throw new Error('课程目录格式有误，请联系网站维护者。');
      lessons=catalog.chapters.flatMap(chapter=>chapter.sections.flatMap(section=>section.lessons.map(lesson=>({...lesson,chapter:String(chapter.id),section:section.id}))));lessonMap=new Map(lessons.map(lesson=>[lesson.id,lesson]));
      loadState();renderSidebar();await route();
    }catch(error){$('#main').innerHTML=errorHTML(error.message,'reload-app');$('#course-nav').innerHTML='<p class="muted loading-text">目录暂时无法加载。</p>';}
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-action="reload-app"]'))init();});
  init();
})();


