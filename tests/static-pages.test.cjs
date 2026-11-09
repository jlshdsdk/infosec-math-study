'use strict';
// MPA guards: every outline node and lesson has a pre-rendered static page,
// pages carry no runtime math placeholders, and legacy SPA routes redirect.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'public');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const outlineSrc = read('ppt-outline.js');
const outline = JSON.parse(outlineSrc.slice(outlineSrc.indexOf('{', outlineSrc.indexOf('window.PPT_OUTLINE')), outlineSrc.lastIndexOf('}') + 1));

const nodes = Object.values(outline).flatMap(c => c.sections.flatMap(s => [s, ...s.topics]));
const lessons = fs.readdirSync(path.join(root, 'data', 'lessons')).map(f => JSON.parse(fs.readFileSync(path.join(root, 'data', 'lessons', f), 'utf8')));

test('每个课件目录项都有预渲染静态页且含完成状态钩子', () => {
  for (const node of nodes) {
    const html = read(`topic/${node.key}.html`);
    assert.match(html, /data-version="ppt-/);
    assert.ok(html.includes('notes-reader-title'), node.key);
    assert.ok(!html.includes('math-todo'), `${node.key} 残留未渲染公式`);
  }
});

test('每篇讲解都有阅读页，正文构建期渲染 KaTeX 且带进度/笔记钩子', () => {
  for (const lesson of lessons) {
    const html = read(`read/${lesson.id}.html`);
    assert.ok(html.includes('id="guide-content"'), lesson.id);
    assert.ok(!html.includes('math-todo'), `${lesson.id} 残留未渲染公式`);
    assert.match(html, /data-action="complete" data-lesson=/);
    assert.ok(html.includes('id="lesson-note"'), lesson.id);
    if ((lesson.guide.match(/\$/g) || []).length >= 2) {
      assert.ok(html.includes('class="katex"'), `${lesson.id} 无渲染公式`);
    }
  }
});

test('首页与章节页存在，首页不再加载应用脚本', () => {
  const home = read('index.html');
  assert.ok(!home.includes('src="app.js'));
  assert.match(home, /page\.js\?v=/);
  for (const id of Object.keys(outline)) assert.ok(fs.existsSync(path.join(root, `chapter/${id}.html`)), id);
});

test('旧 SPA 路由会跳转到静态页，工具页保留读写器路由', () => {
  const app = read('app.js');
  assert.match(app, /staticRedirect/);
  assert.match(app, /read\/\$\{encodeURIComponent\(parts\[1\]\|\|''\)\}\.html/);
  assert.match(app, /tab==='pages'\|\|tab==='items'/);
  assert.ok(fs.existsSync(path.join(root, 'tools.html')));
});

test('静态页链接不指向已废弃的讲读 SPA 路由', () => {
  const sample = read(`read/${lessons[0].id}.html`);
  assert.ok(!/#\/lesson\//.test(sample.replace(/tools\.html#\/lesson\//g, '')), '正文链接应指向静态 read 页');
  const topicSample = read(`topic/${nodes[nodes.length - 1].key}.html`);
  assert.match(topicSample, /read\//);
});
