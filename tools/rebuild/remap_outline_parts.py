"""Remap ppt-outline.js parts from/until markers into rebuilt lesson text.

Multi-topic lessons are split into consecutive segments by the `###` topic
headings agents wrote per SPEC (heading contains the topic number, or the
topic title when the outline number is absent). For a lesson with parts
p1..pN in outline order: pi (i>1) gets from=heading_i; pi (i<N) gets
until=heading_{i+1}. Original empty from/until semantics (lesson start /
lesson end) are preserved by construction.

Only the from/until JSON values inside each part object are edited in place;
the rest of ppt-outline.js is untouched. Verifies each new marker is unique
in its lesson and sits on a paragraph boundary.

Usage: python tools/rebuild/remap_outline_parts.py [--check]
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REBUILD = ROOT / '.work' / 'rebuild'
OUTLINE = ROOT / 'public' / 'ppt-outline.js'

def load_outline_json():
    src = OUTLINE.read_text(encoding='utf-8')
    start = src.index('window.PPT_OUTLINE') + len('window.PPT_OUTLINE')
    brace = src.index('{', start)
    end = src.rindex('}')
    return src, json.loads(src[brace:end + 1])

def walk_topics(node, out):
    if isinstance(node, dict):
        if 'key' in node and isinstance(node.get('parts'), list):
            out.append(node)
        for v in node.values():
            walk_topics(v, out)
    elif isinstance(node, list):
        for v in node:
            walk_topics(v, out)

def heading_candidates(md):
    return [(m[1], m.start()) for m in re.finditer(r'^### (.+)$', md, re.M)]

def find_topic_heading(md, topic):
    """Heading marker ('### …' full line) for this topic's segment, or None."""
    number = (topic.get('number') or '').strip()
    title = (topic.get('title') or '').strip()
    probe = title[:10] if title else ''
    for mode in ('number', 'startswith', 'contain'):
        for text, _ in heading_candidates(md):
            if mode == 'number' and number and (text.startswith(number) or f' {number} ' in f' {text} '):
                return '### ' + text
            if mode == 'startswith' and probe and text.startswith(probe):
                return '### ' + text
            if mode == 'contain' and probe and probe in text:
                return '### ' + text
    return None

# Lessons whose part boundaries do not coincide with topic headings: manual
# markers per part index (1-based, part 1 implicitly starts the lesson).
OVERRIDES = {
    'reciprocity': {
        1: '### 回填引入题：$\\left(\\frac{6}{131}\\right)=-1$',
        2: '### 例1：判断 $x^2\\equiv77\\pmod{103}$ 是否有解',
    },
    'qr-def': {
        1: '### 例 5：用平方剩余表枚举 $y^2\\equiv x^3+x+1\\pmod 7$ 的点',
    },
    'qr-euler': {
        3: '**◆ p.146-147**｜定理 4.2.2 与第一部分证明',
    },
    'prime': {
        1: '### Eratosthenes 筛法：例 17',
        2: '### 只试到平方根的素数判别法',
        3: '### 思考题与素数无穷性',
    },
    'lcm': {
        1: '### 课前的两个练习',
        2: '### 定理 1.4.4：互素正整数的整除性质',
        3: '### 缩放规则的正式版',
        4: '### 多个整数的最小公倍数（定理 1.4.6 与例 7）',
    },
    'factor': {
        1: '### 例 1：用平方同余分解 $37909$',
    },
    'fast-power': {
        1: '### 二进制算法及运算次数',
        2: '**◆ p.210-218**｜过程列成表格',
    },
    'reduced': {
        3: '### 定理 2.3.4：乘一个互素的数不改变简化剩余系',
    },
    'reciprocity-app': {
        3: '### 4.4 符号计算的收尾练习',
    },
}

def main(check=False):
    src, outline = load_outline_json()
    topics = []
    for ch in outline.values():
        walk_topics(ch, topics)

    marker_file = REBUILD / 'assembled.json'
    assembled = set(json.loads(marker_file.read_text(encoding='utf-8'))) if marker_file.exists() else set()

    # lesson -> ordered parts (outline document order)
    by_lesson = {}
    for t in topics:
        for part in t.get('parts', []):
            lesson = part.get('lesson')
            if lesson:
                by_lesson.setdefault(lesson, []).append({'topic': t, 'part': part})

    changed = 0
    problems = []
    for lesson, entries in by_lesson.items():
        if lesson not in assembled:
            continue  # from/until must match the live guides text
        md_file = REBUILD / 'out' / f'{lesson}.md'
        if not md_file.exists():
            continue
        md = md_file.read_text(encoding='utf-8')
        if len(entries) < 2:
            continue  # single-part lessons: from/until stay whole-lesson
        markers = [None]  # part 1 starts at lesson start
        for i, e in enumerate(entries[1:], start=1):
            override = OVERRIDES.get(lesson, {}).get(i)
            marker = override or find_topic_heading(md, e['topic'])
            # pin every marker to its full first line, matching the old
            # multi-line marker convention the tests assert against
            if marker and not marker.endswith('\n'):
                marker += '\n'
            markers.append(marker)
        # Outline topic order may differ from deck order (e.g. prime): chain
        # the until markers by each marker's POSITION in the lesson text.
        seq = sorted((i for i in range(1, len(markers)) if markers[i]),
                     key=lambda i: md.index(markers[i]))
        until_of = {}
        for pos, i in enumerate(seq):
            until_of[i] = markers[seq[pos + 1]] if pos + 1 < len(seq) else ''
        for i, e in enumerate(entries):
            # rebuilt lessons: part 1 always spans from the lesson start
            new_from = markers[i] if i > 0 else ''
            # the rebuilt lesson's last part in text order runs to the end
            new_until = until_of.get(i, markers[seq[0]] if seq else '')
            if new_from is None or new_until is None:
                problems.append(f"{lesson}: 第{i + 1}段缺少主题起始标题（topic={e['topic'].get('number') or e['topic'].get('key')}）")
                continue
            for label, marker in (('from', new_from), ('until', new_until)):
                if not marker:
                    continue
                if md.count(marker) != 1:
                    problems.append(f'{lesson}: 标记不唯一（{label}）: {marker[:30]}…')
                else:
                    pos = md.index(marker)
                    if pos >= 2 and md[pos - 2:pos] != '\n\n':
                        problems.append(f'{lesson}: 标记不在段首（{label}）: {marker[:30]}…')
            if e['part'].get('from') != new_from or e['part'].get('until') != new_until:
                e['part']['from'] = new_from
                e['part']['until'] = new_until
                changed += 1

    if problems:
        print('需人工/代理修复的分段：')
        for p in problems:
            print(' -', p)
        if check:
            sys.exit(1)

    if check:
        print(f'check 模式：{changed} 个 part 需重映射，{len(problems)} 个问题')
        return

    src = OUTLINE.read_text(encoding='utf-8')
    mark = 'window.PPT_OUTLINE = '
    pos = src.index(mark) + len(mark)
    brace = src.index('{', pos)
    end = src.rindex('}')  # json.dumps already closes the object; keep ';…'
    OUTLINE.write_text(src[:brace] + json.dumps(outline, ensure_ascii=False, indent=2) + src[end + 1:], encoding='utf-8')
    print(f'重映射 {changed} 个 part 的 from/until')

if __name__ == '__main__':
    main('--check' in sys.argv)
