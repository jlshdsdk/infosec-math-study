'use strict';

/* Standalone original-slide reader. Include slide-reader.css alongside this file.
 * mountSlideReader({mount, lesson, catalog, getSource, initial, onPageChange, onZoom})
 * callbacks receive {url, alt, source, page, title, index, total}; index is zero-based.
 * onPageChange runs after a successful image commit, coalesced for 250ms and
 * flushed on destroy. Persistence belongs to the caller; this module never uses storage.
 * show(source, page) resolves to true after display, false for invalid/stale/failed requests.
 */
(() => {
  let instance = 0;

  window.mountSlideReader = function mountSlideReader(options = {}) {
    const {lesson, catalog, getSource, initial, onPageChange, onZoom} = options;
    const mount = typeof options.mount === 'string' ? document.querySelector(options.mount) : options.mount;
    if (!mount || typeof mount.replaceChildren !== 'function') throw new TypeError('原页阅读器缺少挂载位置。');
    if (typeof getSource !== 'function') throw new TypeError('原页阅读器缺少课件读取方法。');

    const frames = [], seen = new Set(), positions = new Map();
    for (const ref of lesson?.refs || []) {
      if (typeof ref.source !== 'string' || !Number.isInteger(ref.start) || !Number.isInteger(ref.end) || ref.start < 1 || ref.end < ref.start) continue;
      for (let page = ref.start; page <= ref.end; page++) {
        const key = `${ref.source}:${page}`;
        if (!seen.has(key)) {
          seen.add(key); positions.set(key, frames.length); frames.push({source:ref.source, page});
        }
      }
    }

    const root = document.createElement('section');
    root.className = 'slide-reader';
    root.setAttribute('aria-label', '知识点对应课件原页');
    const uid = `slide-reader-${++instance}`;
    root.innerHTML = `<div class="slide-reader-toolbar"><label class="slide-reader-source"><span>课件来源</span><select aria-label="选择课件来源"></select></label><div class="slide-reader-controls"><button type="button" data-slide="previous" aria-label="上一张课件原页">← 上一页</button><label class="slide-reader-page"><span>实际页码</span><input type="number" inputmode="numeric" step="1" aria-label="来源课件中的实际页码"><span class="slide-reader-page-limit"></span></label><button type="button" data-slide="next" aria-label="下一张课件原页">下一页 →</button></div></div><div class="slide-reader-stage" aria-busy="false"><button type="button" class="slide-reader-picture" aria-label="放大当前课件原图" disabled><span class="slide-reader-placeholder">正在准备课件原页…</span></button></div><div class="slide-reader-feedback"><p class="slide-reader-status" role="status" aria-live="polite" aria-atomic="true"></p><button type="button" class="slide-reader-retry" hidden>重新加载</button></div><div class="slide-reader-caption"><span class="slide-reader-caption-text"></span><button type="button" class="slide-reader-zoom" disabled>放大原图 ↗</button></div><div class="slide-reader-position"><label for="${uid}-range"><span class="slide-reader-count"></span><span>保留动画与复习帧</span></label><input id="${uid}-range" type="range" min="0" max="${Math.max(0, frames.length - 1)}" step="1" value="0" aria-label="选择当前知识点的课件帧"></div>`;
    mount.replaceChildren(root);
    const $ = selector => root.querySelector(selector);
    const sourceSelect = $('select'), pageInput = $('.slide-reader-page input');
    const previous = $('[data-slide="previous"]'), next = $('[data-slide="next"]');
    const stage = $('.slide-reader-stage'), picture = $('.slide-reader-picture');
    const status = $('.slide-reader-status'), retry = $('.slide-reader-retry');
    const caption = $('.slide-reader-caption-text'), zoom = $('.slide-reader-zoom');
    const range = $('input[type="range"]'), count = $('.slide-reader-count');
    const sourceIds = [...new Set(frames.map(frame => frame.source))];
    const titles = new Map((catalog?.sources || []).map(source => [source.id, source.title]));
    const sourceRanges = new Map(sourceIds.map(id => {
      const pages = frames.filter(frame => frame.source === id).map(frame => frame.page);
      return [id, {min:Math.min(...pages), max:Math.max(...pages)}];
    }));
    for (const id of sourceIds) {
      const option = document.createElement('option'); option.value = id; option.textContent = titles.get(id) || id; sourceSelect.append(option);
    }

    let destroyed = false, version = 0, targetIndex = 0, displayed = null;
    let pendingPosition = null, positionTimer = null, idleTimer = null;
    let activeImage = null, activeCancel = null;
    const sources = new Map(), warmImages = new Map();
    const listeners = [];
    const listen = (node, type, handler) => { node.addEventListener(type, handler); listeners.push(() => node.removeEventListener(type, handler)); };
    const valid = token => !destroyed && token === version;

    function emitPosition() {
      clearTimeout(positionTimer); positionTimer = null;
      const value = pendingPosition; pendingPosition = null;
      if (value && typeof onPageChange === 'function') onPageChange({...value});
    }
    function queuePosition(value) {
      pendingPosition = value; clearTimeout(positionTimer);
      positionTimer = setTimeout(emitPosition, 250);
    }
    async function sourceData(id) {
      if (!sources.has(id)) {
        const promise = Promise.resolve().then(() => getSource(id)).then(source => {
          if (!source || !Array.isArray(source.pages)) throw new Error('课件页码清单格式有误。');
          return {source, pages:new Map(source.pages.map(page => [Number(page.page), page]))};
        }).catch(error => { sources.delete(id); throw error; });
        sources.set(id, promise);
      }
      return sources.get(id);
    }
    async function describe(index) {
      const frame = frames[index];
      const {source, pages} = await sourceData(frame.source);
      const page = pages.get(frame.page);
      if (!page || typeof page.asset !== 'string' || !page.asset) throw new Error('该原页未在课件清单中找到。');
      const title = source.title || titles.get(frame.source) || frame.source;
      return {url:`slides/${encodeURIComponent(page.asset)}.webp`, alt:`${title}，实际第 ${frame.page} 页课件原图`, source:frame.source, page:frame.page, title, index, total:frames.length};
    }
    function updateControls() {
      const frame = frames[targetIndex], limits = sourceRanges.get(frame.source);
      sourceSelect.value = frame.source; pageInput.value = String(frame.page);
      pageInput.min = String(limits.min); pageInput.max = String(limits.max);
      $('.slide-reader-page-limit').textContent = `/ ${limits.max}`;
      previous.disabled = targetIndex === 0; next.disabled = targetIndex === frames.length - 1;
      range.value = String(targetIndex); range.setAttribute('aria-valuetext', `第 ${targetIndex + 1} 帧，共 ${frames.length} 帧`);
      count.textContent = `本知识点全部原页 · ${targetIndex + 1} / ${frames.length} 帧`;
    }
    function stopPrefetch() {
      if (idleTimer !== null) { clearTimeout(idleTimer); idleTimer = null; }
      for (const image of warmImages.values()) { image.onload = image.onerror = null; image.removeAttribute('src'); }
      warmImages.clear();
    }
    function prefetchNeighbors(token, index) {
      stopPrefetch();
      // Nothing else is requested before the current image has loaded and decoded.
      // A short quiet interval gives navigation and scrolling priority.
      idleTimer = setTimeout(() => {
        idleTimer = null;
        if (!valid(token) || document.hidden || navigator.connection?.saveData) return;
        for (const neighbor of [index - 1, index + 1]) {
          if (neighbor < 0 || neighbor >= frames.length) continue;
          describe(neighbor).then(info => {
            if (!valid(token) || info.url === displayed?.url || warmImages.has(info.url)) return;
            const image = new Image(); image.decoding = 'async'; image.fetchPriority = 'low';
            warmImages.set(info.url, image); image.src = info.url;
          }).catch(() => { /* A failed speculative request must not interrupt reading. */ });
        }
      }, 180);
    }
    function loadImage(info) {
      const image = new Image(); image.alt = info.alt;
      image.decoding = 'async'; image.fetchPriority = 'high'; image.loading = 'eager';
      image.width = 1200; image.height = 900;
      activeImage = image;
      return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error) => {
          if (settled) return; settled = true;
          image.onload = image.onerror = null;
          if (activeImage === image) { activeImage = null; activeCancel = null; }
          error ? reject(error) : resolve(image);
        };
        activeCancel = () => { image.removeAttribute('src'); finish(new Error('原页加载已取消。')); };
        image.onerror = () => finish(new Error('这张课件图片暂时无法加载，请检查网络后重试。'));
        image.onload = async () => {
          try { if (typeof image.decode === 'function') await image.decode(); }
          catch { /* Some browsers reject decode for a valid, already loaded image. */ }
          if (image.naturalWidth > 0) finish(); else finish(new Error('课件图片未能正确解码，请重新加载。'));
        };
        image.src = info.url;
      });
    }
    async function open(index) {
      if (destroyed || index < 0 || index >= frames.length) return false;
      const token = ++version;
      activeCancel?.(); stopPrefetch(); targetIndex = index; updateControls();
      stage.setAttribute('aria-busy', 'true'); root.classList.remove('slide-reader-has-error'); retry.hidden = true;
      status.textContent = `正在读取第 ${frames[index].page} 页${displayed ? '，当前原图保持显示。' : '…'}`;
      try {
        const info = await describe(index); if (!valid(token)) return false;
        // A duplicate asset is still a distinct original frame and must update its page.
        if (displayed?.url === info.url && picture.querySelector('img')) {
          picture.querySelector('img').alt = info.alt;
        } else {
          const image = await loadImage(info); if (!valid(token)) return false;
          picture.replaceChildren(image);
        }
        displayed = info;
        picture.disabled = false; zoom.disabled = false;
        picture.setAttribute('aria-label', `放大${info.alt}`);
        caption.textContent = `${info.title} · 实际第 ${info.page} 页`;
        stage.setAttribute('aria-busy', 'false'); status.textContent = `已显示第 ${info.page} 页。`;
        queuePosition(info); prefetchNeighbors(token, index);
        return true;
      } catch (error) {
        if (!valid(token)) return false;
        stage.setAttribute('aria-busy', 'false'); root.classList.add('slide-reader-has-error');
        status.textContent = `${error?.message || '课件原页暂时无法读取。'}${displayed ? ' 当前原图仍可查看。' : ''}`;
        retry.hidden = false; return false;
      }
    }
    function show(source, page) {
      if (destroyed) return Promise.resolve(false);
      const index = positions.get(`${source}:${Number(page)}`);
      if (index === undefined) {
        status.textContent = '这个页码不在当前知识点范围内，请选择对应来源中的有效页码。';
        if (frames.length) updateControls();
        return Promise.resolve(false);
      }
      return open(index);
    }
    function openZoom() {
      if (!displayed || destroyed) return;
      if (typeof onZoom === 'function') onZoom({...displayed});
      else {
        const dialog = document.createElement('dialog'); dialog.className = 'slide-reader-dialog';
        dialog.setAttribute('aria-label', displayed.alt);
        const close = document.createElement('button'); close.type = 'button'; close.textContent = '关闭原图';
        const image = document.createElement('img'); image.src = displayed.url; image.alt = displayed.alt;
        const scroll = document.createElement('div'); scroll.className = 'slide-reader-dialog-scroll'; scroll.append(image);
        dialog.append(close, scroll); root.append(dialog);
        close.addEventListener('click', () => dialog.close());
        dialog.addEventListener('close', () => { dialog.remove(); if (!destroyed) zoom.focus({preventScroll:true}); }, {once:true});
        dialog.showModal();
      }
    }

    listen(previous, 'click', () => open(targetIndex - 1));
    listen(next, 'click', () => open(targetIndex + 1));
    listen(sourceSelect, 'change', () => { const index = frames.findIndex(frame => frame.source === sourceSelect.value); if (index >= 0) open(index); });
    listen(pageInput, 'change', () => show(sourceSelect.value, pageInput.value));
    listen(pageInput, 'keydown', event => { if (event.key === 'Enter') { event.preventDefault(); show(sourceSelect.value, pageInput.value); } });
    listen(range, 'change', () => open(Number(range.value)));
    listen(retry, 'click', () => open(targetIndex));
    listen(picture, 'click', openZoom); listen(zoom, 'click', openZoom);

    if (frames.length) {
      const initialIndex = initial ? positions.get(`${initial.source}:${Number(initial.page)}`) : undefined;
      open(initialIndex ?? 0);
    } else {
      status.textContent = '这个知识点暂未关联课件原页。'; count.textContent = '暂无原页';
      for (const node of [sourceSelect, pageInput, previous, next, range]) node.disabled = true;
      $('.slide-reader-placeholder').textContent = '暂无对应课件原页';
    }

    return {
      show,
      destroy() {
        if (destroyed) return;
        destroyed = true; ++version;
        activeCancel?.(); stopPrefetch(); listeners.forEach(remove => remove());
        for (const dialog of root.querySelectorAll('dialog[open]')) dialog.close();
        try { emitPosition(); } finally { root.remove(); sources.clear(); }
      }
    };
  };
})();
