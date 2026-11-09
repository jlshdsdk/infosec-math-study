"""Validate rebuilt lessons and splice them into content/guides-<N>.md.

Usage: python tools/rebuild/assemble.py <chapter> [--only lesson1,lesson2]
Fails (exit 1) on any format/coverage problem; backup written to .work/rebuild/backup/.
"""
import datetime, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REBUILD = ROOT / '.work' / 'rebuild'

BLOCK_RE = r'^## ([a-z0-9-]+)[ \t]*\n'

def page_blocks(md):
    """All **◆ p.N** / **◆ p.N-M** markers in document order: (start, end, pos)."""
    out = []
    for m in re.finditer(r'\*\*◆\s*p\.(\d+)(?:-(\d+))?\*\*', md):
        out.append((int(m[1]), int(m[2] or m[1]), m.start()))
    return out

def validate(lesson, md, manifest, problems):
    if not re.match(r'^## ' + re.escape(lesson) + r'[ \t]*\n', md):
        problems.append(f'{lesson}: 首行不是 ## {lesson}')
    ids = re.findall(r'^## ([a-z0-9-]+)', md, re.M)
    if ids != [lesson]:
        problems.append(f'{lesson}: ## 行异常 {ids}')
    covered = set()
    for a, b, _ in page_blocks(md):
        if b < a:
            problems.append(f'{lesson}: 页块区间倒置 p.{a}-{b}')
        covered.update(range(a, b + 1))
    # Duplicate recordings of the same deck share primary_spans with different
    # page numbers; the agent numbers blocks by whichever spine it chose. Pass
    # when ANY span is fully covered.
    need = set()
    for s in manifest['primary_spans']:
        need.update(range(s['start'], s['end'] + 1))
    if not any(set(range(s['start'], s['end'] + 1)) <= covered for s in manifest['primary_spans']):
        gaps = {s['start']: sorted(set(range(s['start'], s['end'] + 1)) - covered)[:15]
                for s in manifest['primary_spans']}
        problems.append(f'{lesson}: 任一主来源区间都未全覆盖，缺口 {gaps}')
    extra = sorted(covered - need)
    if extra:
        # agents sometimes also teach pages owned by neighbouring lessons
        # (audit rows cross lesson bounds); that is redundant but not wrong.
        print(f'  提示 {lesson}: 讲解覆盖了邻课页码 {extra[:12]}（不阻塞组装）')
    for i, line in enumerate(md.split('\n')):
        s = line.replace('$$', '')
        if s.count('$') % 2:
            problems.append(f'{lesson}: 第{i + 1}行 $ 不成对: {line[:70]}')
    if not page_blocks(md):
        problems.append(f'{lesson}: 没有任何页块标记')
    body = re.sub(r'^## .*\n', '', md, count=1)
    first = body.strip().split('\n\n')[0]
    if '$' in first or '#' in first or first.startswith(('- ', '* ', '|')):
        problems.append(f'{lesson}: 导语段不纯净: {first[:50]}')
    # strip math spans first: `$a<b$` is a less-than, not an HTML tag
    if re.search(r'<[a-zA-Z/]', re.sub(r'\$\$[\s\S]*?\$\$|\$[^\n$]+\$', '', md)):
        problems.append(f'{lesson}: 含 HTML 标签')
    # headings must have at least one page block under them
    heads = [m for m in re.finditer(r'^### (.+)$', md, re.M)]
    blocks = page_blocks(md)
    if not heads:
        problems.append(f'{lesson}: 缺少 ### 小节')
    for i, h in enumerate(heads):
        hend = heads[i + 1].start() if i + 1 < len(heads) else len(md)
        if not any(h.start() <= pos < hend for _, _, pos in blocks):
            problems.append(f'{lesson}: 小节「{h[1][:30]}」下没有页块')

def main():
    chapter = sys.argv[1]
    only = None
    if len(sys.argv) > 3 and sys.argv[2] == '--only':
        only = set(sys.argv[3].split(','))
    mdir = REBUILD / 'manifests' / f'ch{chapter}'
    index = json.loads((mdir / 'INDEX.json').read_text(encoding='utf-8'))
    problems, done = [], []
    for item in index:
        lesson = item['lesson']
        if only is not None and lesson not in only:
            continue
        out = REBUILD / 'out' / f'{lesson}.md'
        if not out.exists():
            problems.append(f'{lesson}: 缺少输出文件')
            continue
        md = out.read_text(encoding='utf-8')
        manifest = json.loads((mdir / f'{lesson}.json').read_text(encoding='utf-8'))
        validate(lesson, md, manifest, problems)
        done.append(lesson)
    if problems:
        print(f'{len(problems)} 个问题，未组装：')
        for p in problems:
            print(' -', p)
        sys.exit(1)
    guide_files = {item['guide_file'] for item in index if item['lesson'] in done}
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    for name in guide_files:
        guide_file = ROOT / 'content' / name
        text = guide_file.read_text(encoding='utf-8')
        backup = REBUILD / 'backup' / f'{name}.{stamp}'
        backup.parent.mkdir(parents=True, exist_ok=True)
        backup.write_text(text, encoding='utf-8')
        count = 0
        for lesson in done:
            lesson_file = REBUILD / 'out' / f'{lesson}.md'
            if f'## {lesson}' not in text:
                continue
            new = lesson_file.read_text(encoding='utf-8').rstrip() + '\n\n'
            pattern = re.compile(r'^## ' + re.escape(lesson) + r'[ \t]*\n.*?(?=^## |\Z)', re.M | re.S)
            assert pattern.search(text), lesson
            text = pattern.sub(lambda m: new, text, count=1)
            count += 1
        guide_file.write_text(text, encoding='utf-8')
        print(f'{name}: 组装 {count} 课，备份 {backup.name}')
    # ledger of lessons actually spliced into guides; remap_coverage reads it
    marker = REBUILD / 'assembled.json'
    done_all = set()
    if marker.exists():
        done_all = set(json.loads(marker.read_text(encoding='utf-8')))
    done_all.update(done)
    marker.write_text(json.dumps(sorted(done_all)), encoding='utf-8')

if __name__ == '__main__':
    main()
