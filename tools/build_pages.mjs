// Build static MPA pages: home, chapters, topics/sections, lesson reading
// pages — all markdown and KaTeX rendered here at build time.
// Usage: node tools/build_pages.mjs [--check]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const marked = require('marked');
const katex = require('katex');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const catalog = readJSON(path.join(PUBLIC, 'data/catalog.json'));
const inlineSlides = readJSON(path.join(PUBLIC, 'data/inline-slides.json'));
const lessonsById = new Map();
for (const file of fs.readdirSync(path.join(PUBLIC, 'data/lessons'))) {
  const lesson = readJSON(path.join(PUBLIC, 'data/lessons', file));
  lessonsById.set(lesson.id, lesson);
}
const outlineSrc = fs.readFileSync(path.join(PUBLIC, 'ppt-outline.js'), 'utf8');
const brace = outlineSrc.indexOf('{', outlineSrc.indexOf('window.PPT_OUTLINE'));
const outline = JSON.parse(outlineSrc.slice(brace, outlineSrc.lastIndexOf('}') + 1));
const courseMapSrc = fs.readFileSync(path.join(PUBLIC, 'course-map.js'), 'utf8');
const vm = require('node:vm');
const cmCtx = { window: {} };
vm.createContext(cmCtx);
vm.runInContext(courseMapSrc, cmCtx, { filename: 'course-map.js' });
const coursePaths = cmCtx.window.COURSE_PATHS || {};
const lessonStarters = cmCtx.window.LESSON_STARTERS || {};
const VERSION = (fs.readFileSync(path.join(PUBLIC, 'app.js'), 'utf8').match(/DATA_VERSION\s*=\s*'([^']+)'/) || [null, 'ppt-x'])[1];

// ---------- shared helpers (ported from app.js) ----------
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => Number(v || 0).toLocaleString('zh-CN');
const paths = coursePaths, outlineData = outline;
const outlineNodes = Object.values(outlineData).flatMap(ch => ch.sections.flatMap(s => [s, ...s.topics]));
const outlineMap = new Map(outlineNodes.map(n => [n.key, n]));
const nodesForLesson = id => outlineNodes.filter(n => n.parts.some(p => p.lesson === id));
const outlineLabel = node => {
  const prefix = node.number || node.displayNumber || node.sourceLabel || '';
  return `${prefix}${prefix === node.sourceLabel && /^[一二三四五六七八九十]+$/.test(prefix) ? '、' : ' '}${node.title}`.trim();
};
const outlineOrigin = node => node.numberOrigin === 'website' ? '<small class="outline-origin">整理</small>' : '';
const outlineOriginNotice = node => node.numberOrigin === 'website'
  ? `<p class="ppt-source-label">此编号由网站按课件知识点顺序整理，并非课件原编号。${node.sourceLabel ? `课件原标记：${esc(node.sourceLabel)}。` : ''}</p>`
  : !node.number && node.sourceLabel ? `<p class="ppt-source-label">课件原标记：${esc(node.sourceLabel)}。</p>` : '';
const nodeLessonIDs = node => [...new Set([...node.parts, ...(node.topics || []).flatMap(t => t.parts)].map(p => p.lesson))];
const outlineOrder = outlineNodes.filter(n => n.key === n.section ? (!n.topics.length || n.parts.length || true) : true);
// URL builders: pages live one directory deep, tools at root.
const U = {
  home: '../', chapter: id => `../chapter/${esc(id)}.html`, topic: key => `../topic/${esc(key)}.html`,
  lesson: id => `../read/${encodeURIComponent(id)}.html`,
  library: (source, page) => `../tools.html#/library?source=${encodeURIComponent(source)}&page=${page}`,
  lessonTab: (id, tab, extra = '') => `../tools.html#/lesson/${encodeURIComponent(id)}?tab=${tab}${extra}`,
  notebook: '../tools.html#/notebook', practice: '../tools.html#/practice',
};

// ---------- markdown + full KaTeX rendering (build-time) ----------
function sanitizeBuild(html) {
  return html
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|svg|math|link|meta)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|svg|math|link|meta)\b[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\sstyle\s*=\s*"[^"]*"/gi, '')
    .replace(/\sstyle\s*=\s*'[^']*'/gi, '');
}
function renderMarkdown(text) {
  const math = [];
  const protectedText = String(text || '').replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<![\\$])\$(?!\$)([^\n$]+?)(?<!\\)\$(?!\$)/g, (full, a, b, c, d) => {
    math.push({ text: a ?? b ?? c ?? d, display: a !== undefined || b !== undefined });
    return `MATHPLACEHOLDER${math.length - 1}ENDMATH`;
  });
  let html = marked.parse(protectedText, { breaks: false, gfm: true });
  html = sanitizeBuild(html);
  html = html.replace(/MATHPLACEHOLDER(\d+)ENDMATH/g, (full, index) => {
    const formula = math[Number(index)];
    if (!formula) return full;
    try { return katex.renderToString(formula.text, { displayMode: formula.display, throwOnError: false, trust: false, strict: 'ignore', output: 'htmlAndMathml' }); }
    catch { return `<code class="math-error">${esc(formula.text)}</code>`; }
  });
  return html;
}
const stripTags = html => String(html).replace(/<[^>]*>/g, '');
function guideWithOutlineAnchors(lesson) {
  const insertions = new Map();
  for (const node of nodesForLesson(lesson.id)) for (const part of node.parts.filter(p => p.lesson === lesson.id && p.from)) {
    const index = lesson.guide.indexOf(part.from);
    if (index < 0) continue;
    insertions.set(index, (insertions.get(index) || '') + `<span class="ppt-fragment-anchor" id="ppt-${esc(part.anchor)}"></span>\n\n`);
  }
  let text = lesson.guide;
  for (const [index, html] of [...insertions].sort((a, b) => b[0] - a[0])) text = text.slice(0, index) + html + text.slice(index);
  return text;
}
function sourceTitleAt(id, page) {
  const source = catalog.sources.find(s => s.id === id);
  const segment = (source?.segments || Object.values(outlineData).flatMap(ch => ch.sourceParts || [])).find(item => (!item.source || item.source === id) && item.start <= page && page <= item.end);
  return segment ? `${segment.title}（合并来源第 ${page} 页 / 本份第 ${page - segment.start + 1} 页）` : source?.title || '课件原页';
}
function inlineFigure(item, prefix = '../') {
  const title = sourceTitleAt(item.source, item.page);
  const imageURL = `${prefix}slides/${encodeURIComponent(item.asset)}.webp`;
  const alt = `${title}，第 ${item.page} 页课件原图`;
  return { alt, html: `<figure class="inline-slide"><button type="button" class="inline-slide-image" data-action="inline-image" data-image="${esc(imageURL)}" data-alt="${esc(alt)}" aria-label="放大${esc(alt)}"><img src="${esc(imageURL)}" alt="${esc(alt)}" width="1280" height="960" loading="lazy" decoding="async"></button><figcaption><span>课件原图 · ${esc(title)} · 第 ${Number(item.page)} 页</span><a href="${U.lessonTab(item.originTopic, 'pages', `&source=${encodeURIComponent(item.source)}&page=${item.page}`)}">查看前后已收录原页 →</a></figcaption></figure>` };
}
// insert figures into RENDERED article html at heading boundaries (parity
// with the runtime insertInlineSlides: after the section's content, before
// the next h2/h3).
function insertInlineIntoHTML(articleHTML, items) {
  if (!items?.length) return articleHTML;
  const headings = [...articleHTML.matchAll(/<(h2|h3)\b[^>]*>[\s\S]*?<\/\1>/g)];
  const insertAt = new Map(); // position -> figures html
  for (const item of items) {
    const { html } = inlineFigure(item);
    const hi = Number.isInteger(item.headingIndex) ? item.headingIndex : null;
    const position = hi !== null && headings[hi] ? headings[hi].index + headings[hi][0].length : (headings[0] ? headings[0].index : articleHTML.length);
    // place right before the NEXT heading after the section start
    let nextPos = articleHTML.length;
    if (hi !== null && headings[hi]) {
      const next = headings[hi + 1];
      nextPos = next ? next.index : articleHTML.length;
    } else if (headings[0]) {
      nextPos = headings[0].index;
    }
    insertAt.set(nextPos, (insertAt.get(nextPos) || '') + html + '\n');
  }
  let result = articleHTML;
  for (const [pos, html] of [...insertAt].sort((a, b) => b[0] - a[0])) result = result.slice(0, pos) + '\n' + html + result.slice(pos);
  return result;
}
function partBounds(lesson, part) {
  const start = part.from ? lesson.guide.indexOf(part.from) : 0;
  const end = part.until ? lesson.guide.indexOf(part.until, start + 1) : lesson.guide.length;
  if (start < 0 || end <= start) throw new Error('bounds');
  return { start, end, text: lesson.guide.slice(start, end).trim() };
}

export { catalog, inlineSlides, lessonsById, outlineData, outlineMap, outlineNodes, outlineOrder, paths, VERSION, esc, num, outlineLabel, outlineOrigin, outlineOriginNotice, nodeLessonIDs, nodesForLesson, U, renderMarkdown, guideWithOutlineAnchors, insertInlineIntoHTML, partBounds, sourceTitleAt, stripTags, PUBLIC };

// ================= templates & generation (below) =================
const files = new Map(); // relative path -> content

function shell({ title, mainHTML, active = {}, activeChapter, activeSection, activeTopic, activeLesson, prefix = '../', mainClass = 'notes-reader' }) {
  const nav = catalog.chapters.map(chapter => {
    const course = outlineData[String(chapter.id)];
    const open = String(chapter.id) === String(activeChapter);
      const introActive = course.intro === activeLesson;
      return `<details class="chapter-nav" data-chapter="${esc(chapter.id)}"${open ? ' open' : ''}><summary><span class="tree-icon" aria-hidden="true">📁</span> <a href="${U.chapter(chapter.id)}">第${esc(chapter.number)}章 ${esc(course.title)}</a></summary><a class="chapter-intro-link${introActive ? ' active' : ''}"${introActive ? ' aria-current="page"' : ''} data-lesson="${esc(course.intro)}" href="${U.lesson(course.intro)}">本章导学与课件说明</a>${course.sections.map(section => {
      const openSection = open && section.key === activeSection;
      return `<details class="section-nav" data-section="${esc(section.key)}"${openSection ? ' open' : ''}><summary><span class="tree-icon" aria-hidden="true">📁</span> <a href="${U.topic(section.key)}">${esc(outlineLabel(section))}${section.coverage === 'chapter_home_only' ? '<small class="missing-material">（未找到正文）</small>' : ''}</a></summary>${section.topics.map(topic => `<a class="lesson-nav${topic.key === activeTopic ? ' active' : ''}"${topic.key === activeTopic ? ' aria-current="page"' : ''} data-topic="${esc(topic.key)}" href="${U.topic(topic.key)}"><span aria-hidden="true">📄</span> ${esc(outlineLabel(topic))}${outlineOrigin(topic)}${topic.readingLabel ? `<small class="missing-material"><br>${esc(topic.readingLabel)}</small>` : ''}</a>`).join('')}${section.parts.length || !section.topics.length ? `<a class="section-content-link" href="${U.topic(section.key)}">${esc(section.sectionReadingLabel || (section.coverage === 'chapter_home_only' ? '查看资料情况与章首页' : '阅读本节正文与原页'))} →</a>` : ''}</details>`;
    }).join('')}</details>`;
  }).join('');
  return `<!doctype html>
<html lang="zh-CN" data-theme="light" data-version="${VERSION}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#f8f4f3">
<meta name="description" content="信息安全数学基础自学手册：按课件原目录学习，阅读已收录原页与资料待查说明，保存笔记和进度。">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${prefix}vendor/katex/katex.min.css">
<link rel="stylesheet" href="${prefix}styles.css?v=${VERSION}">
<link rel="stylesheet" href="${prefix}notes-theme.css?v=${VERSION}">
<script defer src="${prefix}course-map.js?v=${VERSION}"></script>
<script defer src="${prefix}ppt-outline.js?v=${VERSION}"></script>
<script defer src="${prefix}slide-reader.js?v=${VERSION}"></script>
<script defer src="${prefix}page.js?v=${VERSION}"></script>
</head>
<body class="notes-theme" data-mpa="1">
<a class="skip-link" href="#main">跳到正文</a>
<header class="notes-topbar">
<button class="notes-mobile-toggle" data-action="menu" aria-label="打开课程目录" aria-expanded="false" aria-controls="sidebar">☰</button>
<a class="notes-brand" href="${U.home}">信息安全数学基础</a>
<button class="notes-global-search" data-action="search" aria-label="搜索知识点和课件">搜索知识点、定理、例题… <kbd>/</kbd></button>
<div class="notes-top-actions"><button class="icon-button" data-action="font" title="调整正文字号" aria-label="调整正文字号">A<span class="small-a">A</span></button><button class="icon-button" data-action="theme" title="切换明暗主题" aria-label="切换明暗主题">◐</button><button class="notes-backup" data-action="data">备份进度</button></div>
</header>
<div id="app" class="notes-shell">
<aside id="sidebar" class="notes-sidebar" aria-label="课程目录">
<div class="notes-sidebar-header"><strong>目录</strong><a href="${U.home}" aria-label="查看全部章节"${active.home ? ' aria-current="page"' : ''}>全部章节</a></div>
<nav id="course-nav" class="notes-tree" aria-label="三级课程目录">${nav}</nav>
<nav class="notes-quick-links" aria-label="学习工具"><a href="${U.notebook}">笔记与收藏</a><a href="${U.practice}">计算练习</a><a href="${prefix}tools.html#/library">已收录原页</a><a href="${prefix}coverage.html?v=${VERSION}">课件对照</a></nav>
<div class="notes-sidebar-bottom"><div id="sidebar-progress"><div class="mini-progress-label"><span>我的学习进度</span><span class="progress-count">…</span></div><div class="progress-track" role="progressbar" aria-label="总学习进度"><div class="progress-fill"></div></div></div><button class="text-button" data-action="data">导出 / 导入进度</button></div>
</aside>
<button id="sidebar-scrim" class="sidebar-scrim" data-action="close-menu" aria-label="关闭课程目录" hidden></button>
<div class="notes-workspace">
<div id="storage-warning" class="storage-warning" role="status" hidden></div>
<main id="main" class="${mainClass}" tabindex="-1">${mainHTML}</main>
</div>
</div>
<dialog id="search-dialog" class="search-dialog" aria-labelledby="search-title"><div class="dialog-top"><h2 id="search-title">搜索手册</h2><button class="icon-button" data-action="close-dialog" aria-label="关闭搜索">×</button></div><div class="search-box"><span aria-hidden="true">⌕</span><input id="search-input" type="search" placeholder="试试「欧几里得」「逆元」「Lagrange」" autocomplete="off" aria-label="搜索关键词"><kbd>Esc</kbd></div><p class="search-help">检索知识点与课件原页文字；公式和识别不清的内容请对照原图。</p><div id="search-results" class="search-results" aria-live="polite"><div class="empty-state compact"><p>从一个概念开始寻找。</p></div></div></dialog>
<dialog id="data-dialog" class="data-dialog" aria-labelledby="data-title"><div class="dialog-top"><h2 id="data-title">把学习进度带走</h2><button class="icon-button" data-action="close-dialog" aria-label="关闭备份窗口">×</button></div><p>完成记录、收藏和笔记保存在当前浏览器。换设备或清理浏览器前，请导出一份备份。</p><div class="transfer-step"><span class="step-number">01</span><div><h3>导出到文件</h3><p>下载 JSON 备份，再传到另一台设备。</p><button class="button primary" data-action="export">导出学习进度 <span aria-hidden="true">↓</span></button></div></div><div class="transfer-step"><span class="step-number">02</span><div><h3>在新设备导入</h3><p>打开同一个网址，选择备份。完成记录和收藏取并集，同一笔记保留较新的版本。</p><label class="button secondary file-button">选择备份文件 <input id="import-file" type="file" accept=".json,application/json"></label><small>仅支持本手册导出的 JSON 文件，最大 8 MB。</small></div></div><p class="notice">设备之间不会自动同步。建议在一次学习结束后重新导出备份。</p><div id="import-status" role="status" class="import-status"></div></dialog>
<dialog id="image-dialog" class="image-dialog" aria-labelledby="image-title"><div class="dialog-top"><h2 id="image-title">课件原页</h2><div><button class="button secondary small" data-action="image-zoom">切换放大</button><button class="icon-button" data-action="close-dialog" aria-label="关闭原图">×</button></div></div><div class="image-stage"><img id="large-image" alt="课件原页放大图"></div><p class="image-hint">可滚动查看原图；按 Esc 返回。</p></dialog>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
</body>
</html>`;
}

// ---------- home ----------
function buildHome() {
  const mainHTML = `<div class="notes-paper notes-home"><div class="notes-reader-toolbar"><h1 class="notes-reader-title">信息安全数学基础 · 学习笔记</h1><a class="notes-resume" data-resume href="${U.lesson(catalog.chapters[0].sections[0].lessons[0].id)}">从第一课开始 →</a></div><div class="notes-home-body"><p class="notes-welcome">按照课件原目录，从基本定义开始，一步步学会看定理、做例题。左侧依次列出章、小节和课件原有知识点。</p><h2>课程目录</h2><div class="home-chapters">${catalog.chapters.map(chapter => {
    const course = outlineData[String(chapter.id)];
    const ids = chapter.sections.flatMap(s => s.lessons.map(l => l.id));
    return `<a class="home-chapter" data-chapter-progress="${esc(ids.join(','))}" href="${U.chapter(chapter.id)}"><span class="home-chapter-number">${String(chapter.number).padStart(2, '0')}</span><span><strong>第${chapter.number}章 ${esc(course.title)}</strong><small>${esc(paths[String(chapter.id)]?.question || chapter.description)}</small></span><span class="home-chapter-progress"><span class="chapter-done">0</span>/${ids.length} →</span></a>`;
  }).join('')}</div><p class="notes-scope">目前本地已核对 ${catalog.stats.sources} 个来源组、${num(catalog.stats.pages)} 帧，涉及第 1、2、3、4、8 章；来源组可能合并多份 PPT，不能据此认定课程资料已收齐。11月4日两份分别320/305帧。9月9日第二份的雨课堂列表显示107帧，前56帧有图片并已保存，第57—107页未返回图片，内容暂不能确认，其他课堂未找到该课件的重复版本，后续取得材料后再补充；1.2.2正文尚未确认，不能据此推断无图页的内容。8.4、8.5未找到正文，第5—7章未找到独立课件。</p></div></div>`;
  files.set('index.html', shell({ title: '信息安全数学基础 · 自学手册', mainHTML, active: { home: true }, prefix: '' }).replace(/(href|src)="\.\.\//g, '$1="'));
}

// ---------- chapters ----------
function buildChapters() {
  for (const chapter of catalog.chapters) {
    const course = outlineData[String(chapter.id)], learning = paths[String(chapter.id)];
    const ids = chapter.sections.flatMap(s => s.lessons.map(l => l.id));
    const mainHTML = `<div class="notes-paper course-overview"><div class="notes-reader-toolbar"><h1 class="notes-reader-title">第${chapter.number}章 ${esc(course.title)}</h1><span class="course-progress">已学 <span class="chapter-done">0</span> / ${ids.length} 篇讲解 · 共 <span data-total="${ids.length}">${ids.length}</span></span></div><div class="course-overview-body"><p>${esc(learning?.bridge || chapter.description)}</p><div class="chapter-introduction"><a class="button secondary" href="${U.lesson(course.intro)}">本章导学与课件说明 →</a><a class="text-button" href="${U.library(course.home.source, course.home.page)}">查看课件章首页 ↗</a></div>${(course.sourceParts || []).map(materialHTML).join('')}<h2 class="course-route-title">课件原目录</h2><p class="ppt-number-explanation">三级知识点沿用课件编号；标有“整理”的序号由网站按课件顺序添加。</p>${course.sections.map(section => `<section class="course-unit"><div class="course-unit-head"><div><h3><a href="${U.topic(section.key)}">${esc(outlineLabel(section))} →</a></h3>${section.coverage === 'chapter_home_only' ? '<p class="missing-material">现有资料未找到对应正文课件与独立讲解。</p>' : section.material ? `<p>${esc(section.material.title)} · 合并来源第 ${section.material.start}—${section.material.end} 页</p>` : ''}</div></div><div class="course-unit-lessons">${section.parts.length ? `<a class="section-reading-link" href="${U.topic(section.key)}">${esc(section.sectionReadingLabel || (section.topics.length ? '阅读本节引入、例题与补充讲解' : '阅读本节讲解与全部原页'))} →</a>` : ''}${section.topics.map(topic => outlineCardStatic(topic)).join('')}${section.coverage === 'chapter_home_only' ? `<a class="section-reading-link" href="${U.topic(section.key)}">查看资料情况与章首页 →</a>` : ''}</div></section>`).join('')}</div><p class="ppt-return-link" style="margin-top:28px"><a href="${U.home}">← 返回全部章节</a></p></div>`;
    files.set(`chapter/${chapter.id}.html`, shell({ title: `第${chapter.number}章 ${course.title} · 信息安全数学基础`, mainHTML, activeChapter: chapter.id }));
  }
}
const materialHTML = material => material ? `<p class="ppt-source-material"><strong>${esc(material.title)}</strong> · 合并来源第 ${material.start}—${material.end} 页 <a href="${U.library(material.source, material.start)}">从本份封面打开 →</a></p>` : '';
function outlineCardStatic(node) {
  return `<a class="course-lesson" data-node-lessons="${esc(nodeLessonIDs(node).join(','))}" href="${U.topic(node.key)}"><span class="node-state">${node.readingStatus === 'toc_only' ? '目录' : node.readingStatus === 'related_reading' ? '↗' : '○'}</span><span>${esc(outlineLabel(node))}${outlineOrigin(node)}${node.readingLabel ? `<small class="missing-material"> · ${esc(node.readingLabel)}</small>` : ''}</span><span>→</span></a>`;
}

// ---------- topic & section pages ----------
function outlineNavigationStatic(node) {
  const order = outlineOrder;
  const index = order.findIndex(item => item.key === node.key), previous = order[index - 1], next = order[index + 1];
  return `<nav class="lesson-navigation" aria-label="课件目录相邻内容">${previous ? `<a href="${U.topic(previous.key)}"><small>← 上一项</small><span>${esc(outlineLabel(previous))}</span></a>` : '<span></span>'}${next ? `<a href="${U.topic(next.key)}"><small>下一项 →</small><span>${esc(outlineLabel(next))}</span></a>` : `<a href="${U.chapter(node.chapter)}">返回本章目录 →</a>`}</nav>`;
}
function buildTopics() {
  for (const node of outlineNodes) {
    const chapter = outlineData[node.chapter], section = outlineMap.get(node.section);
    const missing = node.coverage === 'chapter_home_only';
    const partsHTML = node.parts.map((part, index) => {
      const lesson = lessonsById.get(part.lesson);
      let text = '';
      try { text = partBounds(lesson, part).text; } catch { text = ''; }
      if (!text) return `<section class="ppt-reading-part" id="part-${esc(part.anchor)}"><div class="ppt-part-toolbar"><h2>${esc(part.label || lesson.title)}</h2><span class="part-state" data-lesson="${esc(part.lesson)}">待学习</span></div><div class="ppt-part-links"><a href="${U.lesson(part.lesson)}">阅读全文、收藏与记笔记 →</a><a href="${U.lessonTab(part.lesson, 'pages')}">本篇已收录课件原页 →</a></div><p class="notice">这段讲解暂时未能打开，请使用完整文章入口重试。</p></section>`;
      // inline slides for this part (same selection logic as the SPA)
      let bounds; try { bounds = partBounds(lesson, part); } catch { bounds = null; }
      let images = [];
      if (bounds) {
        const originalHeadings = [...lesson.guide.matchAll(/^#{2,3} .*$/gm)];
        const selected = originalHeadings.map((h, i) => ({ position: h.index, i })).filter(item => item.position >= bounds.start && item.position < bounds.end);
        images = (inlineSlides[lesson.id] || []).filter(item => Number.isInteger(item.headingIndex) ? selected.some(h => h.i === item.headingIndex) : bounds.start === 0).map(item => ({ ...item, headingIndex: Number.isInteger(item.headingIndex) ? selected.findIndex(h => h.i === item.headingIndex) : null }));
      }
      const article = insertInlineIntoHTML(renderMarkdown(text), images);
      return `<section class="ppt-reading-part" id="part-${esc(part.anchor)}"><div class="ppt-part-toolbar"><h2>${esc(part.label || lesson.title)}</h2><span class="part-state" data-lesson="${esc(part.lesson)}">待学习</span></div><div class="ppt-part-links"><a href="${U.lesson(part.lesson)}${part.from || part.until ? `?focus=${esc(part.anchor)}` : ''}">${part.from || part.until ? '在完整文章中定位本段' : '阅读全文、收藏与记笔记'} →</a><a href="${U.lessonTab(part.lesson, 'pages')}">本篇已收录课件原页 →</a></div><article class="prose ppt-fragment" data-part-index="${index}">${article}</article></section>`;
    }).join('');
    const source = node.sources?.[0];
    const original = source?.asset ? (() => {
      const title = sourceTitleAt(source.source, source.page), alt = `${title}，第 ${source.page} 页课件原图`;
      return `<figure class="inline-slide ppt-original"><button type="button" class="inline-slide-image" data-action="inline-image" data-image="../slides/${esc(source.asset)}.webp" data-alt="${esc(alt)}" aria-label="放大${esc(alt)}"><img src="../slides/${esc(source.asset)}.webp" alt="${esc(alt)}" width="1280" height="960" loading="lazy" decoding="async"></button><figcaption><span>${esc(title)}${source.source === 'chapter8-4' ? '' : ` · 第 ${source.page} 页`}</span><a href="${U.library(source.source, source.page)}">查看前后已收录原页 →</a></figcaption></figure>`;
    })() : '';
    const mainHTML = `<div class="notes-paper ppt-topic"><div class="notes-reader-toolbar"><div><p class="notes-breadcrumb"><a href="${U.chapter(node.chapter)}">第${esc(node.chapter)}章 ${esc(chapter.title)}</a>${node.key !== node.section ? ` / <a href="${U.topic(section.key)}">${esc(outlineLabel(section))}</a>` : ''}</p><h1 class="notes-reader-title">${esc(outlineLabel(node))}</h1></div></div><div class="notes-article-wrap ppt-topic-body">${materialHTML(node.material)}${node.readingLabel ? `<p class="notice">${esc(node.readingLabel)}</p>` : ''}${node.relatedTopics?.length ? `<nav class="ppt-child-topics" aria-label="相关讲解入口">${node.relatedTopics.map(t => `<a class="course-lesson" href="${U.topic(t.key)}">${esc(t.label)} →</a>`).join('')}</nav>` : ''}${node.note ? `<p class="notice ${missing ? 'missing-material' : ''}">${esc(node.note)}</p>` : ''}${outlineOriginNotice(node)}${missing ? '<h2>未找到本节正文资料</h2><p>目前仅找到章首页上的目录条目。下方保留章首页，供核对课程原结构。</p>' : ''}${node.topics?.length ? `<nav class="ppt-child-topics" aria-label="本节课件知识点">${node.topics.map(t => outlineCardStatic(t)).join('')}</nav>` : ''}${node.parts.length ? `<p class="ppt-reading-note">下面按本目录项展示相关讲解。每篇都保留完整文章、收藏、笔记和已收录课件原页入口；完成状态仍按原有讲解记录。</p>${partsHTML}` : !missing && !node.topics?.length && !node.relatedTopics?.length ? '<p class="notice">现有资料尚未找到可独立对应本标题的讲解，请先核对下方课件原页。</p>' : ''}${original}${node.sources?.length > 1 ? `<details class="ppt-other-sources"><summary>其他来源与重复课件中的同一标题</summary>${node.sources.slice(1).map(s => `<a href="${U.library(s.source, s.page)}">${esc(catalog.sources.find(i => i.id === s.source)?.title || s.source)} · 第 ${s.page} 页 ↗</a>`).join('')}</details>` : ''}${outlineNavigationStatic(node)}</div></div>`;
    files.set(`topic/${node.key}.html`, shell({ title: `${outlineLabel(node)} · 信息安全数学基础`, mainHTML, activeChapter: node.chapter, activeSection: node.section, activeTopic: node.key }));
  }
}

// ---------- lesson reading pages ----------
function buildLessons() {
  for (const lesson of lessonsById.values()) {
    const chapter = catalog.chapters.find(c => String(c.id) === String(lesson.chapter));
    const node = nodesForLesson(lesson.id)[0];
    const section = node ? outlineMap.get(node.section) : null;
    const breadcrumb = node ? `<a href="${U.topic(section.key)}">${esc(outlineLabel(section))}</a>${node.key !== node.section ? ` / <a href="${U.topic(node.key)}">${esc(outlineLabel(node))}</a>` : ''}` : esc(lesson.id.endsWith('-intro') ? '本章导学' : lesson.section);
    const starter = lessonStarters[lesson.id];
    const starterHTML = starter ? `<aside class="lesson-intro"><strong>这一节怎么学</strong><p>${esc(starter.question || '')}</p>${starter.prerequisites?.length ? `<p><b>先回顾：</b>${starter.prerequisites.map(p => `<a href="${U.lesson(p.id)}">${esc(p.label)}</a>`).join(' · ')}</p>` : ''}${starter.steps?.length ? `<p><b>学习顺序：</b>${starter.steps.map(esc).join(' → ')}</p>` : ''}</aside>` : '';
    // render article, then stamp heading ids in document order
    let articleHTML = insertInlineIntoHTML(renderMarkdown(guideWithOutlineAnchors(lesson)), inlineSlides[lesson.id] || []);
    const headingLabels = [];
    articleHTML = articleHTML.replace(/<(h2|h3)\b([^>]*)>([\s\S]*?)<\/\1>/g, (full, tag, attrs, inner) => {
      const id = `guide-heading-${headingLabels.length}`;
      headingLabels.push(stripTags(inner).slice(0, 90));
      return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
    });
    const outlineNavHTML = headingLabels.map((label, i) => `<a href="#guide-heading-${i}">${esc(label)}</a>`).join('') || '<span class="muted">顺着正文开始阅读</span>';
    const mainHTML = `<div class="notes-paper"><div class="notes-reader-toolbar"><div><p class="notes-breadcrumb"><a href="${U.chapter(lesson.chapter)}">第${esc(chapter?.number || lesson.chapter)}章</a> / ${breadcrumb}</p><h1 class="notes-reader-title">${esc(lesson.title)}</h1></div><div class="lesson-actions"><button class="button secondary bookmark-button" data-action="bookmark" data-lesson="${esc(lesson.id)}" aria-pressed="false">☆ 收藏</button><button class="button primary complete-button" data-action="complete" data-lesson="${esc(lesson.id)}" aria-pressed="false">标记为完成</button></div></div><div class="notes-article-wrap"><div class="lesson-tabs" role="tablist" aria-label="学习内容"><span role="tab" id="tab-guide" class="active" aria-selected="true">图文讲解</span><a role="tab" id="tab-pages" href="${U.lessonTab(lesson.id, 'pages')}">已收录课件原页</a><a role="tab" id="tab-items" href="${U.lessonTab(lesson.id, 'items')}">原页索引</a></div><section id="lesson-panel" role="tabpanel" tabindex="0">${starterHTML}<details class="notes-outline"><summary>本篇内容</summary><nav id="guide-outline" aria-label="本篇内容">${outlineNavHTML}</nav></details><article class="prose" id="guide-content" data-lesson="${esc(lesson.id)}">${articleHTML}</article><details class="slide-book" id="slide-book"><summary>查看本节已收录课件原页 <span>${num(lesson.pages)} 页 · 含动画步骤</span></summary><div id="inline-slide-reader" data-lesson="${esc(lesson.id)}"></div></details></section><details class="notes-box"><summary>我的笔记 <span id="note-save-status">保存在此浏览器</span></summary><textarea id="lesson-note" data-lesson="${esc(lesson.id)}" maxlength="20000" placeholder="写下自己对这个知识点的理解……" aria-label="本知识点的学习笔记"></textarea><p class="note-foot">输入后自动保存 · 换设备前可导出备份</p></details>${lessonReturnNav(lesson, node)}</div></div>`;
    files.set(`read/${lesson.id}.html`, shell({ title: `${lesson.title} · 信息安全数学基础`, mainHTML, activeChapter: lesson.chapter, activeSection: node?.section, activeTopic: node?.key, activeLesson: lesson.id }));
  }
}
function lessonReturnNav(lesson, node) {
  if (node) return `<p class="ppt-return-link"><a href="${U.topic(node.key)}">返回 ${esc(outlineLabel(node))} →</a></p>${outlineNavigationStatic(node)}`;
  const all = [...lessonsById.values()];
  const index = all.findIndex(l => l.id === lesson.id), previous = all[index - 1], next = all[index + 1];
  return `<nav class="lesson-navigation" aria-label="相邻知识点">${previous ? `<a href="${U.lesson(previous.id)}"><small>← 上一个知识点</small><span>${esc(previous.title)}</span></a>` : '<span></span>'}${next ? `<a href="${U.lesson(next.id)}"><small>下一个知识点 →</small><span>${esc(next.title)}</span></a>` : `<a href="${U.home}"><small>回到总览 →</small><span>回顾你的学习进度</span></a>`}</nav>`;
}

// ---------- tools.html (the interactive SPA for slide reader, library, practice, notebook) ----------
function buildTools() {
  const html = `<!doctype html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#f8f4f3">
<meta name="robots" content="noindex">
<title>学习工具 · 信息安全数学基础</title>
<link rel="stylesheet" href="vendor/katex/katex.min.css">
<link rel="stylesheet" href="styles.css?v=${VERSION}">
<link rel="stylesheet" href="notes-theme.css?v=${VERSION}">
<link rel="stylesheet" href="slide-reader.css?v=${VERSION}">
<script defer src="vendor/marked.umd.js"></script>
<script defer src="vendor/katex/katex.min.js"></script>
<script defer src="course-map.js?v=${VERSION}"></script>
<script defer src="ppt-outline.js?v=${VERSION}"></script>
<script defer src="slide-reader.js?v=${VERSION}"></script>
<script defer src="app.js?v=${VERSION}"></script>
</head>
<body class="notes-theme">
<a class="skip-link" href="#main">跳到正文</a>
<header class="notes-topbar">
<button class="notes-mobile-toggle" data-action="menu" aria-label="打开课程目录" aria-expanded="false" aria-controls="sidebar">☰</button>
<a class="notes-brand" href="./">信息安全数学基础</a>
<button class="notes-global-search" data-action="search" aria-label="搜索知识点和课件">搜索知识点、定理、例题… <kbd>/</kbd></button>
<div class="notes-top-actions"><button class="icon-button" data-action="font" title="调整正文字号" aria-label="调整正文字号">A<span class="small-a">A</span></button><button class="icon-button" data-action="theme" title="切换明暗主题" aria-label="切换明暗主题">◐</button><button class="notes-backup" data-action="data">备份进度</button></div>
</header>
<div id="app" class="notes-shell">
<aside id="sidebar" class="notes-sidebar" aria-label="课程目录">
<div class="notes-sidebar-header"><strong>目录</strong><a href="./" aria-label="查看全部章节">全部章节</a></div>
<nav id="course-nav" class="notes-tree" aria-label="三级课程目录"><p class="muted loading-text">正在整理目录…</p></nav>
<nav class="notes-quick-links" aria-label="学习工具"><a href="#/notebook" data-nav="notebook">笔记与收藏</a><a href="#/practice" data-nav="practice">计算练习</a><a href="#/library" data-nav="library">已收录原页</a><a href="coverage.html?v=${VERSION}">课件对照</a></nav>
<div class="notes-sidebar-bottom"><div id="sidebar-progress"></div><button class="text-button" data-action="data">导出 / 导入进度</button></div>
</aside>
<button id="sidebar-scrim" class="sidebar-scrim" data-action="close-menu" aria-label="关闭课程目录" hidden></button>
<div class="notes-workspace">
<div id="storage-warning" class="storage-warning" role="status" hidden></div>
<main id="main" class="notes-reader" tabindex="-1"><div class="initial-loading" role="status"><span class="loading-orbit" aria-hidden="true"></span><h1>正在打开学习工具</h1><p>准备目录与课件，请稍候。</p></div></main>
</div>
</div>
<dialog id="search-dialog" class="search-dialog" aria-labelledby="search-title"><div class="dialog-top"><h2 id="search-title">搜索手册</h2><button class="icon-button" data-action="close-dialog" aria-label="关闭搜索">×</button></div><div class="search-box"><span aria-hidden="true">⌕</span><input id="search-input" type="search" placeholder="试试「欧几里得」「逆元」「Lagrange」" autocomplete="off" aria-label="搜索关键词"><kbd>Esc</kbd></div><p class="search-help">检索知识点与课件原页文字；公式和识别不清的内容请对照原图。</p><div id="search-results" class="search-results" aria-live="polite"><div class="empty-state compact"><p>从一个概念开始寻找。</p></div></div></dialog>
<dialog id="data-dialog" class="data-dialog" aria-labelledby="data-title"><div class="dialog-top"><h2 id="data-title">把学习进度带走</h2><button class="icon-button" data-action="close-dialog" aria-label="关闭备份窗口">×</button></div><p>完成记录、收藏和笔记保存在当前浏览器。换设备或清理浏览器前，请导出一份备份。</p><div class="transfer-step"><span class="step-number">01</span><div><h3>导出到文件</h3><p>下载 JSON 备份，再传到另一台设备。</p><button class="button primary" data-action="export">导出学习进度 <span aria-hidden="true">↓</span></button></div></div><div class="transfer-step"><span class="step-number">02</span><div><h3>在新设备导入</h3><p>打开同一个网址，选择备份。完成记录和收藏取并集，同一笔记保留较新的版本。</p><label class="button secondary file-button">选择备份文件 <input id="import-file" type="file" accept=".json,application/json"></label><small>仅支持本手册导出的 JSON 文件，最大 8 MB。</small></div></div><p class="notice">设备之间不会自动同步。建议在一次学习结束后重新导出备份。</p><div id="import-status" role="status" class="import-status"></div></dialog>
<dialog id="image-dialog" class="image-dialog" aria-labelledby="image-title"><div class="dialog-top"><h2 id="image-title">课件原页</h2><div><button class="button secondary small" data-action="image-zoom">切换放大</button><button class="icon-button" data-action="close-dialog" aria-label="关闭原图">×</button></div></div><div class="image-stage"><img id="large-image" alt="课件原页放大图"></div><p class="image-hint">可滚动查看原图；按 Esc 返回。</p></dialog>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
</body>
</html>`;
  files.set('tools.html', html);
}

// ---------- write / check ----------
const check = process.argv.includes('--check');
buildHome(); buildChapters(); buildTopics(); buildLessons(); buildTools();
let changed = 0, missing = 0;
for (const [rel, content] of files) {
  const target = path.join(PUBLIC, rel);
  if (check) {
    if (!fs.existsSync(target)) { console.error(`缺少静态页 ${rel}`); missing++; continue; }
    if (fs.readFileSync(target, 'utf8') !== content) { console.error(`静态页过期 ${rel}`); missing++; }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    changed++;
  }
}
if (check && missing) { console.error(`${missing} 个静态页需要重新生成`); process.exit(1); }
if (!check) console.log(`生成 ${changed} 个静态页（index + ${catalog.chapters.length} 章 + ${outlineNodes.length} 目录页 + ${lessonsById.size} 课）`);
