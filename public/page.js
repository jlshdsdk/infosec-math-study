'use strict';
// MPA runtime for the pre-rendered static pages: settings, progress,
// notes, search, dialogs and the on-demand slide reader. Content itself is
// already rendered at build time — nothing here parses markdown or KaTeX.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const STORAGE_KEY = 'math-self-study.v1';
  const DATA_VERSION = document.documentElement.dataset.version || 'ppt';
  const REL = document.body.dataset.mpa ? (location.pathname.endsWith('/') || /\/(index\.html)?$/.test(location.pathname) ? '' : '../') : '../';
  let catalogPromise = null;
  const catalog = () => {
    if (!catalogPromise) catalogPromise = fetch(`data/catalog.json?v=${DATA_VERSION}`).then(r => r.json());
    return catalogPromise;
  };
  let state = { completed: [], bookmarks: [], notes: {}, lastPages: {}, lastLesson: null, settings: { theme: 'light', font: 'normal' } };
  const lessonURL = id => `${REL}read/${encodeURIComponent(id)}.html`;
  const lessonTabURL = (id, tab) => `${REL}tools.html#/lesson/${encodeURIComponent(id)}?tab=${tab}`;

  // ---------- state ----------
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); $('#storage-warning').hidden = true; return true; }
    catch { $('#storage-warning').hidden = false; return false; }
  }
  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored && typeof stored === 'object') {
        state = { ...state, ...stored, settings: { ...state.settings, ...(stored.settings || {}) } };
        state.completed = Array.isArray(stored.completed) ? stored.completed : [];
        state.bookmarks = Array.isArray(stored.bookmarks) ? stored.bookmarks : [];
        state.notes = stored.notes && typeof stored.notes === 'object' ? stored.notes : {};
        state.lastPages = stored.lastPages && typeof stored.lastPages === 'object' ? stored.lastPages : {};
      }
    } catch { /* fresh start */ }
    document.documentElement.dataset.theme = state.settings.theme;
    document.body.dataset.font = state.settings.font;
  }

  // ---------- progress ----------
  function syncProgress() {
    const done = state.completed.length;
    const counts = $$('.progress-count');
    catalog().then(c => {
      counts.forEach(n => { n.textContent = `${done} / ${c.stats.topics}`; });
      const fill = $('.sidebar-bottom .progress-fill');
      if (fill) fill.style.width = `${Math.round(done / c.stats.topics * 100)}%`;
    }).catch(() => {});
    $$('[data-node-lessons]').forEach(card => {
      const ids = card.dataset.nodeLessons.split(',').filter(Boolean);
      const complete = ids.length && ids.every(id => state.completed.includes(id));
      card.classList.toggle('is-complete', complete);
      const mark = $('.node-state', card);
      if (mark && card.classList.contains('course-lesson')) {
        const node = card.getAttribute('href');
        if (mark.textContent === '○' || mark.textContent === '✓') mark.textContent = complete ? '✓' : '○';
      }
    });
    $$('.part-state[data-lesson]').forEach(span => { span.textContent = state.completed.includes(span.dataset.lesson) ? '✓ 已完成' : '待学习'; });
    $$('[data-chapter-progress]').forEach(card => {
      const ids = card.dataset.chapterProgress.split(',').filter(Boolean);
      const label = $('.chapter-done', card);
      if (label) label.textContent = ids.filter(id => state.completed.includes(id)).length;
    });
    const chapterDone = $('.course-progress .chapter-done');
    if (chapterDone && $('[data-total]')) {
      const box = $(`[data-chapter-progress="${$$('.course-unit').length ? '' : ''}"]`);
      chapterDone.textContent = chapterDone.dataset.ids ? chapterDone.dataset.ids.split(',').filter(id => state.completed.includes(id)).length : chapterDone.textContent;
    }
    const resume = $('[data-resume]');
    if (resume && state.lastLesson) {
      resume.href = lessonURL(state.lastLesson);
      resume.textContent = '继续上次学习 →';
    }
    syncLessonButtons();
  }
  function syncLessonButtons() {
    $$('[data-action="complete"]').forEach(btn => {
      const id = btn.dataset.lesson, on = state.completed.includes(id);
      btn.classList.toggle('is-active', on); btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? '✓ 已完成' : '标记为完成';
    });
    $$('[data-action="bookmark"]').forEach(btn => {
      const id = btn.dataset.lesson, on = state.bookmarks.includes(id);
      btn.classList.toggle('is-active', on); btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? '★ 已收藏' : '☆ 收藏';
    });
  }

  // ---------- notes ----------
  let noteTimer;
  const note = $('#lesson-note');
  if (note) {
    const id = note.dataset.lesson;
    note.value = state.notes[id]?.text || '';
    const status = $('#note-save-status');
    if (state.notes[id]?.text) status.textContent = '已保存在此浏览器';
    note.addEventListener('input', () => {
      state.notes[id] = { text: note.value, updatedAt: Date.now() };
      state.lastLesson = id;
      status.textContent = '正在保存…';
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => { status.textContent = save() ? '已保存在此浏览器' : '保存失败，请导出备份'; }, 500);
    });
  }

  // ---------- dialogs ----------
  function openDialog(sel) { const d = $(sel); if (d && !d.open) d.showModal(); }
  function openImage(info) {
    $('#image-title').textContent = info.alt || '课件原页';
    $('#large-image').src = info.url; $('#large-image').alt = info.alt || '';
    $('#image-dialog').classList.remove('zoomed'); openDialog('#image-dialog');
  }

  // ---------- search ----------
  let searchWorker, searchReady = false, searchFailed = false, searchData, searchLoad, sequence = 0;
  const SEARCH_STATIC = { '知识点': id => lessonURL(id), '原页': row => row.source ? `${REL}tools.html#/library?source=${encodeURIComponent(row.source)}&page=${row.page}` : lessonURL(row.lesson) };
  function highlight(text, terms) {
    let out = esc(text); const safe = terms.map(esc).filter(Boolean).sort((a, b) => b.length - a.length);
    for (const t of safe) out = out.split(t).join(`<mark>${t}</mark>`);
    return out;
  }
  function renderResults(rows, terms) {
    $('#search-results').innerHTML = rows.slice(0, 60).map(row => {
      const href = (SEARCH_STATIC[row.type] || SEARCH_STATIC['原页'])(row);
      const kind = row.type === '知识点' ? '知识点' : `课件原页 · 第 ${row.page} 页`;
      return `<a class="search-result" href="${href}"><h3>${highlight(row.title || row.lesson || '', terms)}</h3><p>${highlight(String(row.text || '').slice(0, 130), terms)}</p><small>${esc(kind)} ↗</small></a>`;
    }).join('') || '<div class="empty-state compact"><p>没有找到相关内容，换个关键词试试。</p></div>';
  }
  function startWorker() {
    if (searchWorker || searchFailed || searchData) return;
    try {
      searchWorker = new Worker(`search-worker.js?v=${DATA_VERSION}`);
      searchWorker.onmessage = e => {
        const m = e.data || {};
        if (m.type === 'ready') { searchReady = true; runSearch(); }
        else if (m.type === 'results' && m.sequence === sequence) renderResults(m.matches, m.terms);
        else if (m.type === 'error') failSearch();
      };
      searchWorker.onerror = failSearch;
      searchWorker.postMessage({ type: 'init' });
    } catch { failSearch(); }
  }
  function failSearch() { searchFailed = true; if (!searchData) loadFallback(); }
  function loadFallback() {
    if (searchData || searchLoad) return;
    searchLoad = fetch(`data/search.json?v=${DATA_VERSION}`).then(r => r.json()).then(data => {
      searchData = data.map(row => ({ ...row, haystack: `${row.title || ''} ${row.text || ''}`.toLocaleLowerCase() }));
      runSearch();
    }).catch(() => {});
  }
  function runSearch() {
    const terms = $('#search-input').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
    if (!terms.length) { $('#search-results').innerHTML = '<div class="empty-state compact"><p>输入知识点、定理名称，或原页中的关键词。</p></div>'; return; }
    if (searchWorker && searchReady) { sequence++; searchWorker.postMessage({ type: 'search', sequence, terms }); return; }
    if (!searchData) { loadFallback(); $('#search-results').innerHTML = '<div class="empty-state compact" role="status"><p>正在准备课件全文…</p></div>'; return; }
    const hits = searchData.filter(row => terms.every(t => row.haystack.includes(t)));
    const guides = hits.filter(r => r.type === '知识点'), originals = hits.filter(r => r.type !== '知识点');
    renderResults([...guides.slice(0, 20), ...originals.slice(0, 40)], terms);
  }

  // ---------- backup ----------
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `math-self-study-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('已导出学习进度备份。');
  }
  async function importData(file) {
    const status = $('#import-status');
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('文件超过 8 MB。');
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !Array.isArray(data.completed)) throw new Error('不是本手册导出的备份文件。');
      const c = await catalog();
      const valid = new Set(c.chapters.flatMap(ch => ch.sections.flatMap(s => s.lessons.map(l => l.id))));
      const merge = (list, old) => [...new Set([...(Array.isArray(list) ? list : []), ...old])].filter(id => valid.has(id));
      state.completed = merge(data.completed, state.completed);
      state.bookmarks = merge(data.bookmarks, state.bookmarks);
      for (const [id, note] of Object.entries(data.notes || {})) {
        if (!valid.has(id) || !note || typeof note.text !== 'string') continue;
        const old = state.notes[id];
        if (!old || (note.updatedAt || 0) >= (old.updatedAt || 0)) state.notes[id] = { text: note.text.slice(0, 20000), updatedAt: note.updatedAt || Date.now() };
      }
      save(); syncProgress();
      status.className = 'import-status'; status.textContent = '导入完成：完成记录与收藏取并集，笔记保留较新版本。';
    } catch (error) { status.className = 'import-status error'; status.textContent = error.message || '导入失败，请检查文件。'; }
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(text) {
    const node = $('#toast'); node.textContent = text; node.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.hidden = true; }, 3600);
  }

  // ---------- slide reader (on demand) ----------
  let reader = null, readerLesson = null;
  const sourceCache = new Map();
  const getSource = id => {
    if (!sourceCache.has(id)) sourceCache.set(id, fetch(`data/sources/${encodeURIComponent(id)}.json?v=${DATA_VERSION}`).then(r => r.json()));
    return sourceCache.get(id);
  };
  async function mountReader(mount) {
    if (reader || !window.mountSlideReader) return;
    const id = mount.dataset.lesson;
    try {
      const [lessonData, catalogData] = await Promise.all([fetch(`data/lessons/${encodeURIComponent(id)}.json?v=${DATA_VERSION}`).then(r => r.json()), catalog()]);
      readerLesson = id;
      reader = window.mountSlideReader({
        mount, lesson: lessonData, catalog: catalogData, getSource,
        initial: state.lastPages[id],
        onPageChange(info) { state.lastPages[id] = { source: info.source, page: info.page }; save(); },
        onZoom: openImage,
      });
    } catch { mount.innerHTML = '<p class="notice">课件阅读器暂时无法打开，请刷新重试。</p>'; }
  }
  const book = $('#slide-book');
  if (book) book.addEventListener('toggle', () => { if (book.open) mountReader($('#inline-slide-reader')); });

  // ---------- events ----------
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'menu') { $('#sidebar').classList.add('is-open'); $('#sidebar-scrim').hidden = false; target.setAttribute('aria-expanded', 'true'); }
    else if (action === 'close-menu') { $('#sidebar').classList.remove('is-open'); $('#sidebar-scrim').hidden = true; $('[data-action="menu"]')?.setAttribute('aria-expanded', 'false'); }
    else if (action === 'theme') { state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = state.settings.theme; save(); }
    else if (action === 'font') { const order = ['normal', 'large', 'larger']; state.settings.font = order[(order.indexOf(state.settings.font) + 1) % 3]; document.body.dataset.font = state.settings.font; save(); }
    else if (action === 'search') { openDialog('#search-dialog'); $('#search-input').focus(); startWorker(); }
    else if (action === 'close-dialog') target.closest('dialog')?.close();
    else if (action === 'data') openDialog('#data-dialog');
    else if (action === 'export') exportData();
    else if (action === 'inline-image') openImage({ url: target.dataset.image, alt: target.dataset.alt });
    else if (action === 'image-zoom') $('#image-dialog').classList.toggle('zoomed');
    else if (action === 'complete') {
      const id = target.dataset.lesson;
      state.completed = state.completed.includes(id) ? state.completed.filter(x => x !== id) : [...state.completed, id];
      state.lastLesson = id; save(); syncProgress();
      toast(state.completed.includes(id) ? '已标记为完成。' : '已取消完成标记。');
    }
    else if (action === 'bookmark') {
      const id = target.dataset.lesson;
      state.bookmarks = state.bookmarks.includes(id) ? state.bookmarks.filter(x => x !== id) : [...state.bookmarks, id];
      save(); syncProgress();
      toast(state.bookmarks.includes(id) ? '已收藏。' : '已取消收藏。');
    }
  });
  document.addEventListener('input', event => { if (event.target.id === 'search-input') runSearch(); });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !/input|textarea/i.test(document.activeElement?.tagName || '')) { event.preventDefault(); $('[data-action="search"]')?.click(); }
  });
  $('#import-file')?.addEventListener('change', event => { if (event.target.files[0]) importData(event.target.files[0]); });

  // ---------- legacy hash redirects ----------
  const hash = location.hash;
  if (hash.startsWith('#/')) {
    const parts = hash.slice(2).split('?');
    const params = new URLSearchParams(parts[1] || '');
    const kind = parts[0].split('/')[0], key = parts[0].split('/')[1];
    let dest = null;
    if (kind === 'topic' || kind === 'section') dest = `topic/${encodeURIComponent(key)}.html`;
    else if (kind === 'chapter') dest = `chapter/${encodeURIComponent(key)}.html`;
    else if (kind === 'lesson') {
      const tab = params.get('tab');
      if (tab === 'pages' || tab === 'items') dest = `tools.html${hash}`;
      else dest = `read/${encodeURIComponent(key)}.html${params.get('focus') ? `?focus=${encodeURIComponent(params.get('focus'))}` : ''}`;
    }
    if (dest) location.replace(`${REL}${dest}`);
  }
  const focus = new URLSearchParams(location.search).get('focus');
  if (focus) setTimeout(() => document.getElementById(`ppt-${CSS.escape(focus)}`)?.scrollIntoView({ block: 'start' }), 60);

  load(); syncProgress();
})();
