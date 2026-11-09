'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = value => Number(value || 0).toLocaleString('zh-CN');
  const STORAGE_KEY = 'math-self-study.v1';
  const SCHEMA = 'math-self-study';
  const DATA_VERSION = 'ppt-20261109d';
  let catalog, lessons = [], lessonMap = new Map(), currentLesson = null;
  let routeToken = 0, activeTab = 'guide', viewer = null, storageOK = true, currentOutlineNode = null, currentFocus = null;
  let searchData, searchPromise, searchWorker, searchWorkerReady = false, searchWorkerFailed = false, searchSequence = 0, searchMatches = [], searchPage = 0;
  let itemFilter = '全部', itemPage = 0, toastTimer, noteTimer, slideReader = null, slideSaveTimer = null, inlineIndexPromise;
  const paths = window.COURSE_PATHS || {}, starters = window.LESSON_STARTERS || {}, outline = window.PPT_OUTLINE || {};
  const outlineNodes = Object.values(outline).flatMap(chapter => chapter.sections.flatMap(section => [section, ...section.topics]));
  const outlineMap = new Map(outlineNodes.map(node => [node.key, node]));
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
    $('meta[name="theme-color"]').content = state.settings.theme === 'dark' ? '#211d23' : '#f8f4f3';
  }
  async function fetchJSON(path) {
    let response;
    try { response = await fetch(`${path}${path.includes('?')?'&':'?'}v=${DATA_VERSION}`); } catch { throw new Error('暂时无法连接学习资料，请检查网络后重试。'); }
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
    $$('.lesson-nav[data-topic]').forEach(a => a.classList.toggle('completed', nodeComplete(outlineMap.get(a.dataset.topic))));
  }
  const outlineURL = node => `#/${node.key===node.section?'section':'topic'}/${encodeURIComponent(node.key)}`;
  const outlineLabel = node => {
    const prefix=node.number||node.displayNumber||node.sourceLabel||'';
    return `${prefix}${prefix===node.sourceLabel&&/^[一二三四五六七八九十]+$/.test(prefix)?'、':' '}${node.title}`.trim();
  };
  const outlineOrigin = node => node.numberOrigin==='website'?'<small class="outline-origin">整理</small>':'';
  const outlineOriginNotice = node => node.numberOrigin==='website'
    ? `<p class="ppt-source-label">此编号由网站按课件知识点顺序整理，并非课件原编号。${node.sourceLabel?`课件原标记：${esc(node.sourceLabel)}。`:''}</p>`
    : !node.number&&node.sourceLabel ? `<p class="ppt-source-label">课件原标记：${esc(node.sourceLabel)}。</p>` : '';
  function nodesForLesson(id) { return outlineNodes.filter(node=>node.parts.some(part=>part.lesson===id)); }
  function nodeForLesson(lesson) {
    const selected=outlineMap.get(currentOutlineNode);
    return selected?.parts.some(part=>part.lesson===lesson?.id)?selected:nodesForLesson(lesson?.id)[0];
  }
  function unitFor(lesson) {
    const node=nodeForLesson(lesson);
    if(node)return {id:node.section,title:outlineLabel(outlineMap.get(node.section)),description:node.note||''};
    return (paths[String(lesson?.chapter)]?.units || []).find(unit=>unit.topics.includes(lesson?.id));
  }
  function nodeLessonIDs(node) {
    return [...new Set([...node.parts,...(node.topics||[]).flatMap(topic=>topic.parts)].map(part=>part.lesson))];
  }
  function nodeComplete(node) { if(node.readingStatus==='toc_only')return false;const ids=nodeLessonIDs(node);return ids.length>0&&ids.every(id=>state.completed.includes(id)); }
  function partURL(node,part) {
    const params=new URLSearchParams({outline:node.key});if(part.from)params.set('focus',part.anchor);
    return `${lessonURL(part.lesson)}?${params}`;
  }
  function renderSidebar() {
    $('#course-nav').innerHTML = catalog.chapters.map(chapter => {
      const course=outline[String(chapter.id)];
      return `<details class="chapter-nav" data-chapter="${esc(chapter.id)}"><summary><span class="tree-icon" aria-hidden="true">📁</span><a href="#/chapter/${esc(chapter.id)}">第${esc(chapter.number)}章 ${esc(course.title)}</a></summary><a class="chapter-intro-link" data-lesson="${esc(course.intro)}" href="${lessonURL(course.intro)}">本章导学与课件说明</a>${course.sections.map(section=>`<details class="section-nav" data-section="${esc(section.key)}"><summary><span class="tree-icon" aria-hidden="true">📁</span><a href="${outlineURL(section)}">${esc(outlineLabel(section))}${section.coverage==='chapter_home_only'?'<small class="missing-material">（未找到正文）</small>':''}</a></summary>${section.topics.map(topic=>`<a class="lesson-nav" data-topic="${esc(topic.key)}" href="${outlineURL(topic)}"><span aria-hidden="true">📄</span> ${esc(outlineLabel(topic))}${outlineOrigin(topic)}${topic.readingLabel?`<small class="missing-material"><br>${esc(topic.readingLabel)}</small>`:''}</a>`).join('')}${section.parts.length||!section.topics.length?`<a class="section-content-link" href="${outlineURL(section)}">${esc(section.sectionReadingLabel||(section.coverage==='chapter_home_only'?'查看资料情况与章首页':'阅读本节正文与原页'))} →</a>`:''}</details>`).join('')}</details>`;
    }).join('');
    updateProgress();
  }
  function updateNav(type, lesson, chapterID, node = null) {
    $$('[data-nav]').forEach(a => {const active=a.dataset.nav===type;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    const selected=node||(lesson&&nodeForLesson(lesson));
    $$('.lesson-nav').forEach(a => {const active=selected&&a.dataset.topic===selected.key;a.classList.toggle('active',!!active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $$('.chapter-intro-link').forEach(a=>{const active=lesson&&a.dataset.lesson===lesson.id;a.classList.toggle('active',!!active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    const id=lesson?.chapter||node?.chapter||chapterID;
    if(id){
      const chapter=$$('[data-chapter]').find(n=>n.dataset.chapter===String(id));if(chapter)chapter.open=true;
      const section=selected&&$$('[data-section]').find(n=>n.dataset.section===selected.section);if(section)section.open=true;
    }
  }
  function chapterProgress(chapter) {
    const list=chapter.sections.flatMap(s=>s.lessons);return {total:list.length,done:list.filter(l=>state.completed.includes(l.id)).length};
  }
  function renderHome() {
    const next=lessonMap.get(state.lastLesson)||lessons.find(l=>!state.completed.includes(l.id))||lessons[0];
    $('#main').innerHTML=`<div class="notes-paper notes-home"><div class="notes-reader-toolbar"><h1 class="notes-reader-title">信息安全数学基础 · 学习笔记</h1><a class="notes-resume" href="${lessonURL(next.id)}">${state.lastLesson?'继续上次学习':'从第一课开始'} →</a></div><div class="notes-home-body"><p class="notes-welcome">按照课件原目录，从基本定义开始，一步步学会看定理、做例题。左侧依次列出章、小节和课件原有知识点。</p><h2>课程目录</h2><div class="home-chapters">${catalog.chapters.map(chapter=>{const course=outline[String(chapter.id)],progress=chapterProgress(chapter);return `<a class="home-chapter" href="#/chapter/${esc(chapter.id)}"><span class="home-chapter-number">${String(chapter.number).padStart(2,'0')}</span><span><strong>第${chapter.number}章 ${esc(course.title)}</strong><small>${esc(paths[String(chapter.id)]?.question||chapter.description)}</small></span><span class="home-chapter-progress">${progress.done}/${progress.total} →</span></a>`;}).join('')}</div><p class="notes-scope">目前本地已核对 ${catalog.stats.sources} 个来源组、${num(catalog.stats.pages)} 帧，涉及第 1、2、3、4、8 章；来源组可能合并多份 PPT，不能据此认定课程资料已收齐。11月4日两份分别320/305帧。9月9日第二份的雨课堂列表显示107帧，前56帧有图片并已保存，第57—107页未返回图片，内容暂不能确认，其他课堂未找到该课件的重复版本，后续取得材料后再补充；1.2.2正文尚未确认，不能据此推断无图页的内容。8.4、8.5未找到正文，第5—7章未找到独立课件。</p></div></div>`;
    updateNav('home');
  }
  function outlineCard(node) {
    return `<a class="course-lesson ${nodeComplete(node)?'is-complete':''}" href="${outlineURL(node)}"><span>${node.readingStatus==='toc_only'?'目录':node.readingStatus==='related_reading'?'↗':nodeComplete(node)?'✓':'○'}</span><span>${esc(outlineLabel(node))}${outlineOrigin(node)}${node.readingLabel?`<small class="missing-material"> · ${esc(node.readingLabel)}</small>`:''}</span><span>→</span></a>`;
  }
  function renderChapter(id) {
    const chapter=catalog.chapters.find(c=>String(c.id)===String(id)),course=outline[String(id)],learning=paths[String(id)];
    if(!chapter||!course){$('#main').innerHTML=errorHTML('没有找到这个章节，请从目录重新选择。');return;}
    const progress=chapterProgress(chapter);
    $('#main').innerHTML=`<div class="notes-paper course-overview"><div class="notes-reader-toolbar"><h1 class="notes-reader-title">第${chapter.number}章 ${esc(course.title)}</h1><span class="course-progress">已学 ${progress.done} / ${progress.total} 篇讲解</span></div><div class="course-overview-body"><p>${esc(learning?.bridge||chapter.description)}</p><div class="chapter-introduction"><a class="button secondary" href="${lessonURL(course.intro)}">本章导学与课件说明 →</a><a class="text-button" href="#/library?source=${esc(course.home.source)}&page=${course.home.page}">查看课件章首页 ↗</a></div>${(course.sourceParts||[]).map(materialHTML).join('')}<h2 class="course-route-title">课件原目录</h2><p class="ppt-number-explanation">三级知识点沿用课件编号；标有“整理”的序号由网站按课件顺序添加。</p>${course.sections.map(section=>`<section class="course-unit"><div class="course-unit-head"><div><h3><a href="${outlineURL(section)}">${esc(outlineLabel(section))} →</a></h3>${section.coverage==='chapter_home_only'?'<p class="missing-material">现有资料未找到对应正文课件与独立讲解。</p>':section.material?`<p>${esc(section.material.title)} · 合并来源第 ${section.material.start}—${section.material.end} 页</p>`:''}</div></div><div class="course-unit-lessons">${section.parts.length?`<a class="section-reading-link" href="${outlineURL(section)}">${esc(section.sectionReadingLabel||(section.topics.length?'阅读本节引入、例题与补充讲解':'阅读本节讲解与全部原页'))} →</a>`:''}${section.topics.map(outlineCard).join('')}${section.coverage==='chapter_home_only'?`<a class="section-reading-link" href="${outlineURL(section)}">查看资料情况与章首页 →</a>`:''}</div></section>`).join('')}</div></div>`;
    updateNav(null,null,id);
  }
  function partBounds(lesson,part) {
    const start=part.from?lesson.guide.indexOf(part.from):0;
    const end=part.until?lesson.guide.indexOf(part.until,start+1):lesson.guide.length;
    if(start<0||end<=start)throw new Error('这段讲解的定位需要更新，请使用完整文章入口阅读。');
    return {start,end,text:lesson.guide.slice(start,end).trim()};
  }
  function guideWithOutlineAnchors(lesson) {
    const insertions=new Map();
    for(const node of nodesForLesson(lesson.id))for(const part of node.parts.filter(p=>p.lesson===lesson.id&&p.from)){
      const index=lesson.guide.indexOf(part.from);if(index<0)continue;
      insertions.set(index,(insertions.get(index)||'')+`<span class="ppt-fragment-anchor" id="ppt-${esc(part.anchor)}"></span>\n\n`);
    }
    let text=lesson.guide;
    for(const [index,html]of [...insertions].sort((a,b)=>b[0]-a[0]))text=text.slice(0,index)+html+text.slice(index);
    return text;
  }
  function outlineNavigation(node) {
    const order=outlineNodes.filter(item=>item.key===item.section?(!item.topics.length||item.parts.length||item.key===node.key):true);
    const index=order.findIndex(item=>item.key===node.key),previous=order[index-1],next=order[index+1];
    return `<nav class="lesson-navigation" aria-label="课件目录相邻内容">${previous?`<a href="${outlineURL(previous)}"><small>← 上一项</small><span>${esc(outlineLabel(previous))}</span></a>`:'<span></span>'}${next?`<a href="${outlineURL(next)}"><small>下一项 →</small><span>${esc(outlineLabel(next))}</span></a>`:`<a href="#/chapter/${esc(node.chapter)}">返回本章目录 →</a>`}</nav>`;
  }
  function partPageURL(node,part,lesson) {
    const source=node.sources.find(source=>(lesson.refs||[]).some(ref=>ref.source===source.source&&ref.start<=source.page&&source.page<=ref.end));
    const first=lesson.refs?.[0];
    return source?pageURL(part.lesson,source.source,source.page):first?pageURL(part.lesson,first.source,first.start):`${lessonURL(part.lesson)}?tab=pages`;
  }
  function sourceTitleAt(id,page) {
    const source=catalog.sources.find(item=>item.id===id);
    const segment=(source?.segments||Object.values(outline).flatMap(chapter=>chapter.sourceParts||[])).find(item=>(!item.source||item.source===id)&&item.start<=page&&page<=item.end);
    return segment?`${segment.title}（合并来源第 ${page} 页 / 本份第 ${page-segment.start+1} 页）`:source?.title||'课件原页';
  }
  function materialHTML(material) {
    return material?`<p class="ppt-source-material"><strong>${esc(material.title)}</strong> · 合并来源第 ${material.start}—${material.end} 页 <a href="#/library?source=${esc(material.source)}&page=${material.start}">从本份封面打开 →</a></p>`:'';
  }
  function originalFigure(source) {
    if(!source?.asset)return '';
    const title=sourceTitleAt(source.source,source.page),alt=`${title}，第 ${source.page} 页课件原图`;
    return `<figure class="inline-slide ppt-original"><button type="button" class="inline-slide-image" data-action="inline-image" data-image="slides/${esc(source.asset)}.webp" data-alt="${esc(alt)}" aria-label="放大${esc(alt)}"><img src="slides/${esc(source.asset)}.webp" alt="${esc(alt)}" width="1280" height="960" loading="lazy" decoding="async"></button><figcaption><span>${esc(title)}${source.source==='chapter8-4'?'':` · 第 ${source.page} 页`}</span><a href="#/library?source=${esc(source.source)}&page=${source.page}">查看前后已收录原页 →</a></figcaption></figure>`;
  }
  async function renderOutlineNode(key,params,token) {
    const node=outlineMap.get(key);
    if(!node){$('#main').innerHTML=errorHTML('没有找到这个课件目录项，请从目录重新选择。');updateNav();return;}
    currentOutlineNode=node.key;updateNav(null,null,node.chapter,node);
    const chapter=outline[node.chapter],section=outlineMap.get(node.section);
    document.title=`${outlineLabel(node)} · 信息安全数学基础`;
    $('#main').innerHTML='<div class="initial-loading" role="status"><p>正在打开课件知识点…</p></div>';
    const results=await Promise.allSettled(node.parts.map(part=>getLesson(part.lesson)));
    const inline=await getInlineIndex();if(token!==routeToken)return;
    const missing=node.coverage==='chapter_home_only';
    $('#main').innerHTML=`<div class="notes-paper ppt-topic"><div class="notes-reader-toolbar"><div><p class="notes-breadcrumb"><a href="#/chapter/${esc(node.chapter)}">第${esc(node.chapter)}章 ${esc(chapter.title)}</a>${node.key!==node.section?` / <a href="${outlineURL(section)}">${esc(outlineLabel(section))}</a>`:''}</p><h1 class="notes-reader-title">${esc(outlineLabel(node))}</h1></div></div><div class="notes-article-wrap ppt-topic-body">${materialHTML(node.material)}${node.readingLabel?`<p class="notice">${esc(node.readingLabel)}</p>`:''}${node.relatedTopics?.length?`<nav class="ppt-child-topics" aria-label="相关讲解入口">${node.relatedTopics.map(topic=>`<a class="course-lesson" href="${outlineURL(outlineMap.get(topic.key))}">${esc(topic.label)} →</a>`).join('')}</nav>`:''}${node.note?`<p class="notice ${missing?'missing-material':''}">${esc(node.note)}</p>`:''}${outlineOriginNotice(node)}${missing?'<h2>未找到本节正文资料</h2><p>目前仅找到章首页上的目录条目。下方保留章首页，供核对课程原结构。</p>':''}${node.topics?.length?`<nav class="ppt-child-topics" aria-label="本节课件知识点">${node.topics.map(outlineCard).join('')}</nav>`:''}${node.parts.length?`<p class="ppt-reading-note">下面按本目录项展示相关讲解。每篇都保留完整文章、收藏、笔记和已收录课件原页入口；完成状态仍按原有讲解记录。</p>${node.parts.map((part,index)=>{const result=results[index],lesson=result.status==='fulfilled'?result.value:lessonMap.get(part.lesson);let text='';try{if(result.status==='fulfilled')text=partBounds(lesson,part).text;}catch(error){text='';}return `<section class="ppt-reading-part" id="part-${esc(part.anchor)}"><div class="ppt-part-toolbar"><h2>${esc(part.label||lesson.title)}</h2><span>${state.completed.includes(part.lesson)?'✓ 已完成':'待学习'}</span></div><div class="ppt-part-links"><a href="${partURL(node,part)}">${part.from||part.until?'在完整文章中定位本段':'阅读全文、收藏与记笔记'} →</a><a href="${partPageURL(node,part,lesson)}">本篇已收录课件原页 →</a></div>${text?`<article class="prose ppt-fragment" data-part-index="${index}">${markdownHTML(text)}</article>`:`<p class="notice">这段讲解暂时未能打开，请使用完整文章入口重试。</p>`}</section>`;}).join('')}`:!missing&&!node.topics?.length&&!node.relatedTopics?.length?'<p class="notice">现有资料尚未找到可独立对应本标题的讲解，请先核对下方课件原页。</p>':''}${originalFigure(node.sources[0])}${node.sources.length>1?`<details class="ppt-other-sources"><summary>其他来源与重复课件中的同一标题</summary>${node.sources.slice(1).map(source=>`<a href="#/library?source=${esc(source.source)}&page=${source.page}">${esc(catalog.sources.find(item=>item.id===source.source)?.title||source.source)} · 第 ${source.page} 页 ↗</a>`).join('')}</details>`:''}${outlineNavigation(node)}</div></div>`;
    // Keep original figures attached to the selected heading rather than to every copy of a broad article.
    node.parts.forEach((part,index)=>{
      if(results[index].status!=='fulfilled'||!inline)return;
      const lesson=results[index].value,article=$(`[data-part-index="${index}"]`);if(!article)return;
      let bounds;try{bounds=partBounds(lesson,part);}catch{return;}
      const originalHeadings=[...lesson.guide.matchAll(/^#{2,3} .*$/gm)];
      const selected=originalHeadings.map((heading,originalIndex)=>({position:heading.index,originalIndex})).filter(item=>item.position>=bounds.start&&item.position<bounds.end);
      const images=(inline[lesson.id]||[]).filter(item=>Number.isInteger(item.headingIndex)?selected.some(heading=>heading.originalIndex===item.headingIndex):bounds.start===0).map(item=>({...item,headingIndex:Number.isInteger(item.headingIndex)?selected.findIndex(heading=>heading.originalIndex===item.headingIndex):null}));
      insertInlineSlides(lesson,{[lesson.id]:images},article);
    });
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
      // Deferred: formulas render when they enter the viewport (hydrateMath),
      // so thousand-formula lessons paint their text immediately.
      return `<span class="math-todo" data-d="${formula.display?1:0}">${esc(formula.text)}</span>`;
    });
    return html;
  }
  let mathObserver=null;
  function renderMathSpans(spans){
    for(const el of spans){
      if(!el.isConnected||!el.classList.contains('math-todo'))continue;
      const tex=el.textContent,display=el.dataset.d==='1';
      if(window.katex){
        try{el.innerHTML=window.katex.renderToString(tex,{displayMode:display,throwOnError:false,trust:false,strict:'ignore',output:'htmlAndMathml'});}
        catch{el.innerHTML=`<code class="math-error">${esc(tex)}</code>`;}
      }
      el.classList.remove('math-todo');
    }
  }
  function hydrateMath(root){
    if(!root)return;
    const pending=[...root.querySelectorAll('.math-todo')];
    if(!pending.length)return;
    if(!('IntersectionObserver' in window)||!window.katex){renderMathSpans(pending);return;}
    if(mathObserver)mathObserver.disconnect();
    mathObserver=new IntersectionObserver(entries=>{
      const hit=entries.filter(entry=>entry.isIntersecting).map(entry=>entry.target);
      hit.forEach(el=>mathObserver.unobserve(el));
      if(hit.length)renderMathSpans(hit);
    },{rootMargin:'1200px 0px'});
    pending.forEach(el=>mathObserver.observe(el));
  }
  function renderLessonShell(lesson, params = new URLSearchParams()) {
    const chapter=catalog.chapters.find(c=>String(c.id)===String(lesson.chapter));
    const unit=unitFor(lesson),node=nodeForLesson(lesson);
    const breadcrumb=node?`<a href="${outlineURL(outlineMap.get(node.section))}">${esc(outlineLabel(outlineMap.get(node.section)))}</a>${node.key!==node.section?` / <a href="${outlineURL(node)}">${esc(outlineLabel(node))}</a>`:''}`:esc(lesson.id.endsWith('-intro')?'本章导学':unit?.title||lesson.section);
    $('#main').innerHTML=`<div class="notes-paper"><div class="notes-reader-toolbar"><div><p class="notes-breadcrumb"><a href="#/chapter/${esc(lesson.chapter)}">第${esc(chapter?.number||lesson.chapter)}章</a> / ${breadcrumb}</p><h1 class="notes-reader-title">${esc(lesson.title)}</h1></div><div class="lesson-actions"><button class="button secondary bookmark-button ${state.bookmarks.includes(lesson.id)?'is-active':''}" data-action="bookmark" aria-pressed="${state.bookmarks.includes(lesson.id)}">${state.bookmarks.includes(lesson.id)?'★ 已收藏':'☆ 收藏'}</button><button class="button primary complete-button ${state.completed.includes(lesson.id)?'is-active':''}" data-action="complete" aria-pressed="${state.completed.includes(lesson.id)}">${state.completed.includes(lesson.id)?'✓ 已完成':'标记为完成'}</button></div></div><div class="notes-article-wrap"><div class="lesson-tabs" role="tablist" aria-label="学习内容"><button role="tab" id="tab-guide" data-tab="guide" aria-controls="lesson-panel">图文讲解</button><button role="tab" id="tab-pages" data-tab="pages" aria-controls="lesson-panel">已收录课件原页</button><button role="tab" id="tab-items" data-tab="items" aria-controls="lesson-panel">原页索引</button></div><section id="lesson-panel" role="tabpanel" tabindex="0"></section><details class="notes-box"><summary>我的笔记 <span id="note-save-status">${state.notes[lesson.id]?.text?'已保存在此浏览器':'保存在此浏览器'}</span></summary><textarea id="lesson-note" maxlength="20000" placeholder="写下自己对这个知识点的理解……" aria-label="本知识点的学习笔记">${esc(state.notes[lesson.id]?.text||'')}</textarea><p class="note-foot">输入后自动保存 · 换设备前可导出备份</p></details>${lessonNavigation(lesson.id)}</div></div>`;
    updateNav(null,lesson);bindNote(lesson.id);setTab(activeTab,params);
  }
  function lessonNavigation(id) {
    const node=nodeForLesson(lessonMap.get(id));
    if(node)return `<p class="ppt-return-link"><a href="${outlineURL(node)}">返回 ${esc(outlineLabel(node))} →</a></p>${outlineNavigation(node)}`;
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
  function disposeSlideReader() {
    if(slideReader){const old=slideReader;slideReader=null;old.destroy();}
  }
  function setTab(tab, params = new URLSearchParams()) {
    if (!currentLesson || !$('#lesson-panel')) return;
    disposeSlideReader();
    activeTab=['guide','items','pages'].includes(tab)?tab:'guide';viewer=null;
    const tabParams=new URLSearchParams();
    if(activeTab!=='guide')tabParams.set('tab',activeTab);
    if(currentOutlineNode)tabParams.set('outline',currentOutlineNode);
    if(activeTab==='guide'&&currentFocus)tabParams.set('focus',currentFocus);
    if(activeTab==='guide'&&params.has('heading'))tabParams.set('heading',params.get('heading'));
    try{history.replaceState(null,'',`${lessonURL(currentLesson.id)}${tabParams.size?'?'+tabParams:''}`);}catch{/* Reading remains available. */}
    $$('[data-tab]').forEach(button=>{const active=button.dataset.tab===activeTab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    $('#lesson-panel').setAttribute('aria-labelledby',`tab-${activeTab}`);
    if(activeTab==='guide')renderGuide();else if(activeTab==='items')renderItems();else renderLessonPages(params);
  }
  function starterHTML(lesson) {
    const starter=starters[lesson.id],unit=unitFor(lesson);
    if(!starter&&!unit)return '';
    return `<aside class="lesson-intro"><strong>这一节怎么学</strong><p>${esc(starter?.question||unit?.description||'')}</p>${starter?.prerequisites?.length?`<p><b>先回顾：</b>${starter.prerequisites.map(p=>`<a href="${lessonURL(p.id)}">${esc(p.label)}</a>`).join(' · ')}</p>`:''}${starter?.steps?.length?`<p><b>学习顺序：</b>${starter.steps.map(esc).join(' → ')}</p>`:''}</aside>`;
  }
  function getInlineIndex() {
    if(!inlineIndexPromise)inlineIndexPromise=fetchJSON('data/inline-slides.json').catch(()=>{inlineIndexPromise=null;return null;});
    return inlineIndexPromise;
  }
  function insertInlineSlides(lesson,inlineData,article=$('#guide-content')) {
    if(!article)return;
    const headings=$$('h2,h3',article);
    for(const item of inlineData?.[lesson.id]||[]){
      const title=sourceTitleAt(item.source,item.page);
      const figure=document.createElement('figure');figure.className='inline-slide';
      const imageURL=`slides/${encodeURIComponent(item.asset)}.webp`,alt=`${title}，第 ${item.page} 页课件原图`;
      const link=pageURL(item.originTopic,item.source,item.page);
      figure.innerHTML=`<button type="button" class="inline-slide-image" data-action="inline-image" data-image="${esc(imageURL)}" data-alt="${esc(alt)}" aria-label="放大${esc(alt)}"><img src="${esc(imageURL)}" alt="${esc(alt)}" width="1280" height="960" loading="lazy" decoding="async"></button><figcaption><span>课件原图 · ${esc(title)} · 第 ${Number(item.page)} 页</span><a href="${link}">查看前后已收录原页 →</a></figcaption>`;
      const heading=Number.isInteger(item.headingIndex)?headings[item.headingIndex]:null;
      if(heading){let next=heading.nextElementSibling;while(next&&!/^H[23]$/.test(next.tagName))next=next.nextElementSibling;article.insertBefore(figure,next);}
      else {const first=headings[0]||null;article.insertBefore(figure,first);}
    }
  }
  function renderGuide() {
    const lesson=currentLesson;
    $('#lesson-panel').innerHTML=`${starterHTML(lesson)}<details class="notes-outline"><summary>本篇内容</summary><nav id="guide-outline" aria-label="本篇内容"></nav></details>${window.__inlineSlides===null?'<p class="notice">正文原图暂时没有加载成功，可打开“已收录课件原页”，或稍后刷新重试。</p>':''}<article class="prose" id="guide-content">${markdownHTML(guideWithOutlineAnchors(lesson))}</article><details class="slide-book" id="slide-book"><summary>查看本节已收录课件原页 <span>${num(lesson.pages)} 页 · 含动画步骤</span></summary><div id="inline-slide-reader"></div></details>`;
    const headings=$$('h2,h3',$('#guide-content'));
    $('#guide-outline').innerHTML=headings.map((heading,index)=>{
      heading.id=`guide-heading-${index}`;
      const label=heading.cloneNode(true);
      $$('.katex',label).forEach(math=>math.replaceWith($('.katex-html',math)?.textContent||$('annotation',math)?.textContent||''));
      return `<a href="#${heading.id}" data-action="heading" data-heading="${heading.id}">${esc(label.textContent)}</a>`;
    }).join('')||'<span class="muted">顺着正文开始阅读</span>';
    insertInlineSlides(lesson,window.__inlineSlides);
    $('#slide-book').addEventListener('toggle',event=>{if(event.target.open&&!slideReader)mountLessonSlides(lesson,new URLSearchParams());});
  }
  function renderItems() {
    const types=['全部',...new Set((currentLesson.items||[]).map(item=>item.type||'原页'))];
    if(!types.includes(itemFilter))itemFilter='全部';
    const items=(currentLesson.items||[]).filter(item=>itemFilter==='全部'||(item.type||'原页')===itemFilter);
    const pageSize=24,pageCount=Math.ceil(items.length/pageSize);itemPage=Math.max(0,Math.min(itemPage,pageCount-1));
    $('#lesson-panel').innerHTML=`<p class="viewer-intro">索引用于定位课件中的定义、定理、例题与练习。索引标题仅用于定位，部分标题可能重复；完整条件、公式与推导请在原图中阅读。点击任一条可打开对应原页，继续前后逐帧阅读。</p><div class="item-toolbar"><div class="filter-tabs" aria-label="索引类型">${types.map(type=>`<button class="filter-chip ${itemFilter===type?'active':''}" data-filter="${esc(type)}" aria-pressed="${itemFilter===type}">${esc(type)}</button>`).join('')}</div><small class="muted">${items.length} 条索引</small></div><div class="original-index">${items.slice(itemPage*pageSize,(itemPage+1)*pageSize).map(item=>`<button class="original-item" data-source="${esc(item.source)}" data-page="${Number(item.start)}" data-action="item-page"><span class="item-type">${esc(item.type||'原页')}</span><span class="item-text"><h3>${esc(item.title||'课件原页')}</h3><p>打开原页查看完整内容</p><small>${esc(catalog.sources.find(s=>s.id===item.source)?.title||item.source)} · 第 ${item.start}${item.end>item.start?`–${item.end}`:''} 页${item.frames>1?` · ${item.frames} 帧`:''}</small></span><span class="item-arrow" aria-hidden="true">↗</span></button>`).join('')||'<div class="empty-state compact"><p>此类型暂无索引，可以在「课件原页」中逐页阅读。</p></div>'}</div>${pageCount>1?`<div class="pagination"><button class="button secondary small" data-item-page="${itemPage-1}" ${itemPage===0?'disabled':''}>上一页</button><span>${itemPage+1} / ${pageCount}</span><button class="button secondary small" data-item-page="${itemPage+1}" ${itemPage>=pageCount-1?'disabled':''}>下一页</button></div>`:''}`;
  }
  function openSlideImage(info) {
    $('#image-title').textContent=info.alt;
    $('#large-image').src=info.url;$('#large-image').alt=info.alt;
    $('#image-dialog').classList.remove('zoomed');openDialog('#image-dialog');
  }
  function mountLessonSlides(lesson,params) {
    const mount=$('#inline-slide-reader');if(!mount||!window.mountSlideReader)return;
    const mountedToken=routeToken;
    const requested=params.get('source')?{source:params.get('source'),page:Number(params.get('page'))}:state.lastPages[lesson.id];
    slideReader=window.mountSlideReader({mount,lesson,catalog,getSource,initial:requested,
      onPageChange(info){
        state.lastPages[lesson.id]={source:info.source,page:info.page};
        clearTimeout(slideSaveTimer);slideSaveTimer=setTimeout(save,400);
        const current=routeInfo();
        if(mountedToken===routeToken&&activeTab==='pages'&&current.parts[0]==='lesson'&&current.parts[1]===lesson.id){try{history.replaceState(null,'',pageURL(lesson.id,info.source,info.page)+(currentOutlineNode?`&outline=${encodeURIComponent(currentOutlineNode)}`:''));}catch{/* The image remains readable. */}}
      },
      onZoom:openSlideImage
    });
  }
  function renderLessonPages(params) {
    const lesson=currentLesson;
    $('#lesson-panel').innerHTML=`<p class="viewer-intro">这里展示当前已收录、与本知识点关联的课件原页及动画帧。选择来源或输入页码，可以连续查看；已收录范围不代表雨课堂资料已经齐备。</p><div id="inline-slide-reader"></div>`;
    mountLessonSlides(lesson,params);
  }
  async function renderLibrary(params,token) {
    updateNav('library');
    const selected=catalog.sources.find(s=>s.id===params.get('source'))||catalog.sources.find(s=>(s.chapters||[]).includes('1'))||catalog.sources[0];
    const pseudo={id:'all-slides',refs:catalog.sources.map(s=>({source:s.id,start:1,end:s.pages}))};
    $('#main').innerHTML=`<div class="notes-paper"><div class="notes-reader-toolbar"><div><p class="notes-breadcrumb">课程资料</p><h1 class="notes-reader-title">已收录课件原页</h1></div></div><div class="notes-article-wrap"><p class="viewer-intro">目前本地已核对 ${catalog.stats.sources} 个来源组、${num(catalog.stats.pages)} 帧。来源组可能合并多份 PPT；这里只展示已保存范围。按来源选择课件，也可以输入页码。</p><p class="viewer-intro">11月4日的第4份320帧、第5份305帧已分别列出，本地合并来源共625页。9月9日第二份的雨课堂列表显示107帧，前56帧有图片并已保存，第57—107页未返回图片，暂不能确认内容，其他课堂未找到该课件的重复版本，后续取得材料后再补充；1.2.2正文尚未确认，不能把这些无图页认定为该节内容。8.4、8.5未找到对应正文。</p><div id="inline-slide-reader"></div><p class="notice" id="library-lesson-link"></p></div></div>`;
    if(!window.mountSlideReader){$('#inline-slide-reader').innerHTML=errorHTML('课件阅读器暂时无法打开。');return;}
    slideReader=window.mountSlideReader({mount:$('#inline-slide-reader'),lesson:pseudo,catalog,getSource,
      initial:{source:selected.id,page:Number(params.get('page'))||1},onZoom:openSlideImage,
      async onPageChange(info){
        if(token!==routeToken||routeInfo().parts[0]!=='library')return;
        try{history.replaceState(null,'',`#/library?source=${encodeURIComponent(info.source)}&page=${info.page}`);}catch{/* Keep the current page visible. */}
        try{const data=await getSource(info.source);if(token!==routeToken||routeInfo().parts[0]!=='library')return;const topic=lessonMap.get(data.pages[info.page-1]?.lesson);if($('#library-lesson-link'))$('#library-lesson-link').innerHTML=topic?`这张原页属于「${esc(topic.title)}」。<a class="text-button" href="${lessonURL(topic.id)}">打开相关讲解 →</a>`:'';}catch{/* Original image reading does not depend on the link. */}
      }
    });
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
    const {parts,params}=routeInfo(),token=++routeToken;
    clearTimeout(noteTimer);disposeSlideReader();clearTimeout(slideSaveTimer);save();closeMenu();
    currentLesson=null;currentOutlineNode=null;currentFocus=null;viewer=null;itemFilter='全部';itemPage=0;
    document.title='信息安全数学基础 · 自学手册';
    if(parts[0]==='lesson'){
      let id;try{id=decodeURIComponent(parts[1]||'');}catch{id='';}
      if(!validID(id)){updateNav();$('#main').innerHTML='<div class="empty-state"><h1>没有找到这个知识点</h1><p>请从课程目录重新选择，或返回学习总览。</p><a class="button primary" href="#/">返回总览</a></div>';return;}
      const requestedNode=outlineMap.get(params.get('outline'));
      currentOutlineNode=requestedNode?.parts.some(part=>part.lesson===id)?requestedNode.key:null;
      const focus=params.get('focus');
      currentFocus=nodesForLesson(id).some(node=>node.parts.some(part=>part.lesson===id&&part.anchor===focus))?focus:null;
      activeTab=['guide','items','pages'].includes(params.get('tab'))?params.get('tab'):'guide';
      $('#main').innerHTML='<div class="initial-loading" role="status"><span class="loading-orbit" aria-hidden="true"></span><p>正在打开知识点…</p></div>';updateNav(null,lessonMap.get(id));
      try{const [lesson,inlineSlides]=await Promise.all([getLesson(id),getInlineIndex()]);if(token!==routeToken)return;window.__inlineSlides=inlineSlides;currentLesson=lesson;state.lastLesson=id;save();document.title=`${lesson.title} · 信息安全数学基础`;renderLessonShell(lesson,params);}
      catch(error){if(token===routeToken)$('#main').innerHTML=errorHTML(error.message);}
    }else if(parts[0]==='topic'||parts[0]==='section'){
      let key;try{key=decodeURIComponent(parts[1]||'');}catch{key='';}
      await renderOutlineNode(key,params,token);
    }else if(parts[0]==='chapter'){renderChapter(parts[1]);document.title=`章节导读 · 信息安全数学基础`;}
    else if(parts[0]==='library'){await renderLibrary(params,token);if(token===routeToken)document.title='已收录原页库 · 信息安全数学基础';}
    else if(parts[0]==='notebook'){renderNotebook();document.title='我的笔记与收藏 · 信息安全数学基础';}
    else if(parts[0]==='practice'){renderPractice(params);document.title='计算练习 · 信息安全数学基础';}
    else renderHome();
    if(token===routeToken){
      // Web fonts can change earlier paragraph heights after a deep-link scroll.
      if(parts[0]==='lesson'&&activeTab==='guide'&&(currentFocus||params.has('heading'))&&document.fonts)await document.fonts.ready;
      if(token!==routeToken)return;
      window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});
      const heading=params.get('heading');
      if(parts[0]==='lesson'&&activeTab==='guide'&&currentFocus)document.getElementById('ppt-'+currentFocus)?.scrollIntoView({block:'start',behavior:'instant'});
      else if(parts[0]==='lesson'&&activeTab==='guide'&&heading!==null&&/^\d{1,3}$/.test(heading))$('#guide-heading-'+Number(heading))?.scrollIntoView({block:'start',behavior:'instant'});
    }
  }
  function showSearchTitles(query,withRetry=false) {
    const terms=query.split(/\s+/).filter(Boolean).slice(0,8);
    const found=query?lessons.filter(l=>terms.every(term=>l.title.toLocaleLowerCase().includes(term))):[];
    const header=withRetry?'全文搜索暂时不可用，可以先打开匹配的知识点。':'正在准备课件全文，可以先打开匹配的知识点。';
    $('#search-results').innerHTML=`<p class="search-count">${header}</p>${found.slice(0,20).map(l=>`<a class="search-result" href="${lessonURL(l.id)}" data-action="search-result"><h3>${highlight(l.title,terms)}</h3><small>知识点 · ${esc(l.section)} ↗</small></a>`).join('')}${withRetry?'<button class="button secondary" data-action="retry-search">重新加载全文</button>':''}`;
  }
  function startSearchWorker() {
    if(searchWorker||searchData||searchPromise)return;
    if(typeof Worker==='undefined'||searchWorkerFailed){loadSearchFallback();return;}
    try{
      const worker=new Worker(`search-worker.js?v=${DATA_VERSION}`);searchWorker=worker;
      worker.onmessage=event=>{
        if(searchWorker!==worker)return;
        const message=event.data||{};
        if(message.type==='ready'){searchWorkerReady=true;runSearch();}
        else if(message.type==='results'&&message.sequence===searchSequence){searchMatches=message.matches;renderSearchResults(message.total,message.terms);}
        else if(message.type==='error'){worker.terminate();searchWorker=null;searchWorkerFailed=true;loadSearchFallback();}
      };
      worker.onerror=()=>{if(searchWorker===worker){worker.terminate();searchWorker=null;searchWorkerFailed=true;loadSearchFallback();}};
      worker.postMessage({type:'init'});
    }catch{searchWorker=null;searchWorkerFailed=true;loadSearchFallback();}
  }
  function loadSearchFallback() {
    if(searchData||searchPromise)return;
    searchPromise=fetchJSON('data/search.json').then(data=>{
      if(!Array.isArray(data))throw new Error('搜索索引格式有误。');
      searchData=data.map(row=>({...row,haystack:`${row.title||''} ${row.text||''}`.toLocaleLowerCase()}));
      searchPromise=null;runSearch();
    }).catch(()=>{searchPromise=null;showSearchTitles($('#search-input').value.trim().toLocaleLowerCase(),true);});
  }
  function openSearch() {
    openDialog('#search-dialog');$('#search-input').focus();startSearchWorker();runSearch();
  }
  async function runSearch() {
    const sequence=++searchSequence,query=$('#search-input').value.trim().toLocaleLowerCase();searchPage=0;
    if(!query){$('#search-results').innerHTML='<div class="empty-state compact"><p>输入知识点、定理名称，或原页中的关键词。</p></div>';return;}
    if(searchWorker&&searchWorkerReady){
      $('#search-results').innerHTML='<div class="empty-state compact" role="status"><p>正在检索原页与知识点…</p></div>';
      searchWorker.postMessage({type:'search',sequence,terms:query.split(/\s+/).filter(Boolean).slice(0,8)});return;
    }
    if(!searchData){showSearchTitles(query,!searchWorker&&!searchPromise);return;}
    // Fallback for browsers without Web Workers; yield regularly during matching.
    const terms=query.split(/\s+/).filter(Boolean).slice(0,8);const guides=[],originals=[];let total=0;
    for(let offset=0;offset<searchData.length;offset+=300){
      if(sequence!==searchSequence)return;
      for(const row of searchData.slice(offset,offset+300))if(terms.every(term=>row.haystack.includes(term))){
        total++;const title=String(row.title||'').toLocaleLowerCase(),titleMatches=terms.every(term=>title.includes(term));
        const titleScore=terms.reduce((sum,term)=>sum+(title.includes(term)?10:0),0);
        if(row.type==='知识点')guides.push({...row,score:(titleMatches?2000:1000)+titleScore,matchKind:titleMatches?'导读标题匹配':'导读正文匹配'});
        else if(originals.length<500)originals.push({...row,score:titleScore,matchKind:'课件原页'});
      }
      if(searchData.length>1000)await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(sequence!==searchSequence)return;
    searchMatches=[...guides.sort((a,b)=>b.score-a.score),...originals.sort((a,b)=>b.score-a.score)].slice(0,Math.max(500,guides.length));
    renderSearchResults(total,terms);
  }
  function highlight(text,terms) {
    let result=esc(text);const safeTerms=terms.map(esc).filter(Boolean).sort((a,b)=>b.length-a.length);
    if(!safeTerms.length)return result;
    const pattern=safeTerms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    try{return result.replace(new RegExp(pattern,'gi'),match=>`<mark>${match}</mark>`);}catch{return result;}
  }
  function searchPreview(row,terms) {
    const text=String(row.text||'').replace(/^#{1,6}\s+/gm,'').replace(/\s+/g,' ');
    const hit=terms.map(term=>text.toLowerCase().indexOf(term)).filter(i=>i>=0).sort((a,b)=>a-b)[0]||0;
    let start=Math.max(0,hit-45),end=Math.min(text.length,start+150);
    const math=row.type==='知识点'?[...text.matchAll(/\$\$([\s\S]*?)\$\$|\$([^\n$]+)\$/g)]:[];
    for(const m of math){const stop=m.index+m[0].length;if(m.index<start&&start<stop)start=m.index;if(m.index<end&&end<stop)end=stop;}
    let html=start?'…':'',cursor=start;
    for(const m of math){
      if(m.index<start||m.index>=end)continue;
      html+=highlight(text.slice(cursor,m.index),terms);
      try{html+=window.katex.renderToString(m[1]??m[2],{displayMode:false,throwOnError:true,trust:false,strict:'ignore'});}
      catch{html+=highlight(m[0],terms);}
      cursor=m.index+m[0].length;
    }
    return html+highlight(text.slice(cursor,end),terms)+(end<text.length?'…':'');
  }
  function renderSearchResults(total,terms) {
    const mount=$('#search-results');mount.dataset.total=String(total);mount.dataset.terms=JSON.stringify(terms);
    const pageSize=20,pageCount=Math.ceil(searchMatches.length/pageSize);
    const guideCount=searchMatches.filter(row=>row.type==='知识点').length,shownOriginals=searchMatches.length-guideCount;
    const countDescription=`共找到 ${num(total)} 条匹配：${guideCount} 篇知识点导读、${num(total-guideCount)} 页课件帧。按导读标题、导读正文、原页的顺序展示。${total>searchMatches.length?`当前包含全部 ${guideCount} 篇匹配导读及前 ${shownOriginals} 页原页；更多原页请增加关键词缩小范围，或进入已收录原页库逐帧浏览。`:''}`;
    mount.innerHTML=`<p class="search-count">${esc(countDescription)}</p>${searchMatches.slice(searchPage*pageSize,(searchPage+1)*pageSize).map(row=>{
      const url=row.source&&row.page?(validID(row.lesson)?pageURL(row.lesson,row.source,row.page):`#/library?source=${encodeURIComponent(row.source)}&page=${row.page}`):lessonURL(row.lesson);
      return `<a class="search-result" href="${url}" data-action="search-result"><h3>${highlight(row.title||lessonMap.get(row.lesson)?.title||'课件原页',terms)}</h3><p>${searchPreview(row,terms)}</p><small>${esc(row.matchKind||row.type||'课件原页')}${row.page?` · 实际第 ${row.page} 页`:''} · ${esc(lessonMap.get(row.lesson)?.title||'查看来源课件')} ↗</small></a>`;
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
      const info=routeInfo();if(info.parts[0]==='notebook')renderNotebook();else if(!info.parts.length)renderHome();else if(currentLesson){renderLessonShell(currentLesson);}else if(info.parts[0]==='topic'||info.parts[0]==='section'){await renderOutlineNode(info.parts[1],info.params,routeToken);}
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
    else if(action==='menu'){const open=$('#sidebar').classList.toggle('is-open');$('#sidebar-scrim').hidden=!open;actionNode.setAttribute('aria-expanded',String(open));syncSidebar();if(open)$('#sidebar a, #sidebar summary')?.focus();}
    else if(action==='close-menu')closeMenu();
    else if(action==='close-dialog')actionNode.closest('dialog').close();
    else if(action==='data'){openDialog('#data-dialog');}
    else if(action==='theme'){state.settings.theme=state.settings.theme==='light'?'dark':'light';applySettings();save();notice(`已切换为${state.settings.theme==='dark'?'深色':'浅色'}阅读模式`);}
    else if(action==='font'){const fonts=['normal','large','larger'];state.settings.font=fonts[(fonts.indexOf(state.settings.font)+1)%fonts.length];applySettings();save();notice(`正文字号：${{normal:'标准',large:'大',larger:'更大'}[state.settings.font]}`);}
    else if(action==='retry'){route().then(()=>hydrateMath($('#main')));}
    else if(action==='retry-pages')renderLessonPages(new URLSearchParams());
    else if(action==='bookmark'&&currentLesson){const id=currentLesson.id;const active=!state.bookmarks.includes(id);state.bookmarks=active?[...state.bookmarks,id]:state.bookmarks.filter(v=>v!==id);save();actionNode.classList.toggle('is-active',active);actionNode.setAttribute('aria-pressed',String(active));actionNode.textContent=active?'★ 已收藏':'☆ 收藏';notice(active?'已加入收藏':'已取消收藏');}
    else if(action==='complete'&&currentLesson){const id=currentLesson.id;const active=!state.completed.includes(id);state.completed=active?[...state.completed,id]:state.completed.filter(v=>v!==id);save();updateProgress();actionNode.classList.toggle('is-active',active);actionNode.setAttribute('aria-pressed',String(active));actionNode.textContent=active?'✓ 已完成':'标记为完成';notice(active?'这个知识点，向前一步。已标记完成。':'已取消完成标记');}
    else if(action==='remove-bookmark'){state.bookmarks=state.bookmarks.filter(v=>v!==actionNode.dataset.id);save();renderNotebook();notice('已取消收藏');}
    else if(action==='heading'){event.preventDefault();document.getElementById(actionNode.dataset.heading)?.scrollIntoView({block:'start'});}
    else if(action==='item-page'){setTab('pages',new URLSearchParams({source:actionNode.dataset.source,page:actionNode.dataset.page}));$('#lesson-panel').scrollIntoView({block:'start'});}
    else if(action==='inline-image')openSlideImage({url:actionNode.dataset.image,alt:actionNode.dataset.alt});
    else if(action==='image-zoom')$('#image-dialog').classList.toggle('zoomed');
    else if(action==='search-result'){$('#search-dialog').close();if(actionNode.getAttribute('href')===location.hash)route().then(()=>hydrateMath($('#main')));}
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
  window.addEventListener('hashchange',async()=>{await route();hydrateMath($('#main'));});
  compactScreen.addEventListener('change',()=>{closeMenu();syncSidebar();});
  syncSidebar();
  window.addEventListener('pagehide',()=>{clearTimeout(noteTimer);clearTimeout(slideSaveTimer);disposeSlideReader();if(catalog)save();});
  // Clicks on the backdrop close only when both pointer ends are outside the dialog.
  $$('dialog').forEach(dialog=>{let downOutside=false;dialog.addEventListener('pointerdown',event=>{const r=dialog.getBoundingClientRect();downOutside=event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;});dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(downOutside&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();downOutside=false;});});
  async function init() {
    try {
      catalog=await fetchJSON('data/catalog.json');
      if(!Object.keys(outline).length)throw new Error('课件原目录暂未加载，请刷新页面重试。');
      if(!Array.isArray(catalog.chapters)||!catalog.chapters.length||!Array.isArray(catalog.sources))throw new Error('课程目录格式有误，请联系网站维护者。');
      lessons=catalog.chapters.flatMap(chapter=>chapter.sections.flatMap(section=>section.lessons.map(lesson=>({...lesson,chapter:String(chapter.id),section:section.id}))));lessonMap=new Map(lessons.map(lesson=>[lesson.id,lesson]));
      loadState();renderSidebar();await route();hydrateMath($('#main'));
    }catch(error){$('#main').innerHTML=errorHTML(error.message,'reload-app');$('#course-nav').innerHTML='<p class="muted loading-text">目录暂时无法加载。</p>';}
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-action="reload-app"]'))init();});
  init();
})();


