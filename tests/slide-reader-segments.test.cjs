const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const readerCode = fs.readFileSync(path.join(__dirname, '../public/slide-reader.js'), 'utf8');
const source = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/sources/chapter8-4.json'), 'utf8'));
const segments = [{title:'第八章-4-原版', start:1, end:320}, {title:'第八章-5-原版', start:321, end:625}];
const tick = () => new Promise(resolve => setImmediate(resolve));

class Element {
  constructor(tag) {
    this.tagName = tag; this.children = []; this.nodes = new Map(); this.handlers = new Map(); this.attributes = {};
    this.classList = {add(){}, remove(){}};
  }
  replaceChildren(...nodes) { this.children = nodes; }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(key, value) { this.attributes[key] = value; }
  removeAttribute(key) { delete this.attributes[key]; if (key === 'title') delete this.title; }
  addEventListener(type, handler) { this.handlers.set(type, [...(this.handlers.get(type) || []), handler]); }
  removeEventListener(type, handler) { this.handlers.set(type, (this.handlers.get(type) || []).filter(x => x !== handler)); }
  dispatch(type, event = {}) { for (const fn of this.handlers.get(type) || []) fn(event); }
  querySelector(selector) {
    if (selector === 'img') return this.children.find(child => child.tagName === 'img') || null;
    if (!this.nodes.has(selector)) this.nodes.set(selector, new Element(selector));
    return this.nodes.get(selector);
  }
  querySelectorAll() { return []; }
  remove() {}
}

function harness({start=1, end=625, initialPage=1, segmented=true} = {}) {
  const timers = new Map(); let timerId = 0;
  class FakeImage extends Element {
    constructor() { super('img'); this.naturalWidth = 1200; }
    set src(value) { this.url = value; queueMicrotask(() => this.onload?.()); }
    get src() { return this.url; }
    decode() { return Promise.resolve(); }
  }
  const context = {window:{}, document:{createElement:tag => new Element(tag), hidden:true}, navigator:{},
    Image:FakeImage, setTimeout:(fn, ms) => {timers.set(++timerId, {fn, ms}); return timerId;},
    clearTimeout:id => timers.delete(id)};
  vm.runInNewContext(readerCode, context);
  const mount = new Element('mount'), changes = [], zooms = [];
  const api = context.window.mountSlideReader({mount,
    lesson:{refs:[{source:'chapter8-4', start, end}]},
    catalog:{sources:[{id:'chapter8-4',title:'11月4日授课', ...(segmented ? {segments} : {})}]},
    getSource:id => {assert.equal(id, 'chapter8-4'); return source;},
    initial:{source:'chapter8-4',page:initialPage}, onPageChange:info => changes.push(info), onZoom:info => zooms.push(info)});
  const root = mount.children[0], get = selector => root.querySelector(selector);
  const flushPosition = () => {
    for (const [id, timer] of [...timers]) if (timer.ms === 250) {timers.delete(id); timer.fn();}
  };
  return {api, get, changes, zooms, flushPosition};
}

test('625帧保持全局身份，两份PPT可连续翻页且回调仍为合并页码', async () => {
  assert.equal(source.pages.length, 625);
  const h = harness(); await tick();
  const select = h.get('select'), input = h.get('.slide-reader-page input');
  assert.equal(select.children.length, 2);
  assert.equal(select.children[0].textContent, '11月4日 · 第八章-4-原版');
  assert.equal(select.children[1].textContent, '11月4日 · 第八章-5-原版');
  assert.equal(input.value, '1'); assert.equal(input.max, '320');
  assert.match(h.get('.slide-reader-count').textContent, /1 \/ 625/);
  assert.equal(await h.api.show('chapter8-4', 320), true);
  assert.equal(input.value, '320');
  h.get('[data-slide="next"]').dispatch('click'); await tick();
  assert.equal(select.value, select.children[1].value);
  assert.equal(input.value, '1'); assert.equal(input.max, '305');
  assert.match(h.get('.slide-reader-caption-text').textContent, /第八章-5-原版.*实际第 1 页 \/ 305 页.*合并第 321 页/);
  const image = h.get('.slide-reader-picture').querySelector('img');
  assert.match(image.alt, /第八章-5-原版.*实际第 1 页.*合并第 321 页/);
  assert.equal(image.title, image.alt);
  h.flushPosition();
  assert.equal(h.changes.at(-1).source, 'chapter8-4');
  assert.equal(h.changes.at(-1).page, 321);
  assert.equal(h.changes.at(-1).localPage, 1);
  assert.equal(h.changes.at(-1).index, 320);
  assert.equal(h.changes.at(-1).total, 625);
  h.get('[data-slide="previous"]').dispatch('click'); await tick();
  assert.equal(input.value, '320'); assert.equal(select.value, select.children[0].value);
  assert.equal(await h.api.show('chapter8-4', 625), true);
  assert.equal(input.value, '305'); assert.equal(h.get('[data-slide="next"]').disabled, true);
  h.api.destroy();
  assert.equal(h.changes.at(-1).page, 625);
});

test('选择第五份后手动局部页码和Enter正确跳转，越界不会跳进其他PPT', async () => {
  const h = harness(); await tick();
  const select = h.get('select'), input = h.get('.slide-reader-page input');
  select.value = select.children[1].value; select.dispatch('change'); await tick();
  input.value = '11'; input.dispatch('change'); await tick(); h.flushPosition();
  assert.equal(h.changes.at(-1).page, 331);
  input.value = '1'; let prevented = false;
  input.dispatch('keydown', {key:'Enter', preventDefault(){prevented=true;}}); await tick(); h.flushPosition();
  assert.equal(prevented, true); assert.equal(h.changes.at(-1).page, 321);
  input.value = '306'; input.dispatch('change'); await tick();
  assert.equal(input.value, '1'); assert.match(h.get('.slide-reader-status').textContent, /不在当前知识点范围/);
  select.value = select.children[0].value; select.dispatch('change'); await tick();
  input.value = '321'; input.dispatch('change'); await tick();
  assert.equal(input.value, '1'); assert.equal(select.value, select.children[0].value);
  h.api.destroy();
});

test('cosets的321—483仅出现第五份，旧全局331深链映射局部11', async () => {
  const h = harness({start:321, end:483, initialPage:331}); await tick();
  const select = h.get('select'), input = h.get('.slide-reader-page input');
  assert.equal(select.children.length, 1);
  assert.equal(select.children[0].textContent, '11月4日 · 第八章-5-原版');
  assert.equal(input.min, '1'); assert.equal(input.max, '163'); assert.equal(input.value, '11');
  assert.match(h.get('.slide-reader-page-limit').textContent, /305.*本知识点 1–163 页.*合并第 331 页/);
  assert.match(h.get('.slide-reader-count').textContent, /11 \/ 163/);
  h.get('.slide-reader-zoom').dispatch('click');
  assert.equal(h.zooms.at(-1).page, 331); assert.equal(h.zooms.at(-1).localPage, 11);
  input.value='163'; input.dispatch('change'); await tick(); h.flushPosition();
  assert.equal(h.changes.at(-1).page, 483); assert.equal(h.get('[data-slide="next"]').disabled, true);
  assert.equal(await h.api.show('chapter8-4', 320), false);
  assert.equal(input.value, '163');
  h.api.destroy();
});

test('没有segments的来源保留原名称、原页码及回调结构', async () => {
  const h = harness({start:321, end:483, initialPage:331, segmented:false}); await tick();
  const select = h.get('select'), input = h.get('.slide-reader-page input');
  assert.equal(select.children.length, 1); assert.equal(select.value, 'chapter8-4');
  assert.equal(select.children[0].textContent, '11月4日授课');
  assert.equal(input.min, '321'); assert.equal(input.max, '483'); assert.equal(input.value, '331');
  assert.equal(h.get('.slide-reader-page-limit').textContent, '/ 483');
  assert.equal(h.get('.slide-reader-caption-text').textContent, `${source.title} · 实际第 331 页`);
  input.value='340'; input.dispatch('change'); await tick(); h.flushPosition();
  assert.equal(h.changes.at(-1).page, 340); assert.equal('localPage' in h.changes.at(-1), false);
  h.api.destroy();
});
