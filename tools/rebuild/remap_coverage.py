"""Remap audit guideHeading values to rebuilt lesson headings.

After assemble.py splices rebuilt lessons into guides, every audit row whose
topic/guideTopic lesson was rebuilt gets its guideHeading pointed at the new
### section whose ◆ page blocks cover the row's primary-source page.

Usage: python tools/rebuild/remap_coverage.py
Writes updated content/coverage-*.json (indent=2, original format) and prints
a report; rows that could not be mapped confidently fall back to 正文开头 and
are listed for manual review.
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REBUILD = ROOT / '.work' / 'rebuild'
INTRO_FALLBACK = '正文开头'

def heading_page_segments(md):
    """[(heading_title, set(pages))] for each ### section, in document order."""
    blocks = [(int(m[1]), int(m[2] or m[1]), m.start())
              for m in re.finditer(r'\*\*◆\s*p\.(\d+)(?:-(\d+))?\*\*', md)]
    heads = [(m[1], m.start()) for m in re.finditer(r'^### (.+)$', md, re.M)]
    segs = []
    for i, (title, hpos) in enumerate(heads):
        hend = heads[i + 1][1] if i + 1 < len(heads) else len(md)
        pages = set()
        for a, b, pos in blocks:
            if hpos <= pos < hend:
                pages.update(range(a, b + 1))
        segs.append((title, pages))
    return segs

def main():
    import sys
    chapters = {a for a in sys.argv[1:]}
    manifests = {}
    for mdir in sorted((REBUILD / 'manifests').glob('ch*')):
        if chapters and mdir.name[2:] not in chapters:
            continue  # only remap lessons of assembled chapters
        for f in mdir.glob('*.json'):
            if f.name != 'INDEX.json':
                manifests[f.stem] = json.loads(f.read_text(encoding='utf-8'))

    marker = REBUILD / 'assembled.json'
    assembled = set(json.loads(marker.read_text(encoding='utf-8'))) if marker.exists() else set()
    rebuilt = {}
    for lesson in manifests:
        out = REBUILD / 'out' / f'{lesson}.md'
        if out.exists() and lesson in assembled:
            rebuilt[lesson] = heading_page_segments(out.read_text(encoding='utf-8'))
    if not rebuilt:
        print('没有已重构讲解，无事可做')
        return

    report = {'remapped': 0, 'fallback_intro': [], 'fallback_label': 0, 'kept': 0}
    for suffix in ('12', '34', '8'):
        path = ROOT / 'content' / f'coverage-{suffix}.json'
        rows = json.loads(path.read_text(encoding='utf-8'))
        for row in rows:
            target = row.get('guideTopic') or row['topic']
            if target not in rebuilt:
                continue
            segs = rebuilt[target]
            primary_sources = {s['source'] for s in manifests[target]['primary_spans']}
            page = None
            for ref in row['sources']:
                if ref['source'] in primary_sources:
                    page = ref['start']
                    break
            title = None
            if page is not None:
                for t, pages in segs:
                    if page in pages:
                        title = t
                        break
            if title is None:
                # fall back: heading whose text mentions the row label (例 11 / 定理 …)
                label = row['label'].strip()
                for t, _ in segs:
                    if label and label in t:
                        title = t
                        report['fallback_label'] += 1
                        break
            if title is None:
                title = INTRO_FALLBACK
                report['fallback_intro'].append(
                    f"{suffix}:{row['topic']}/{row['label']}@{row['sources'][0]['source']}p{row['sources'][0]['start']}")
            if row.get('guideHeading') != title:
                row['guideHeading'] = title
                report['remapped'] += 1
            else:
                report['kept'] += 1
        path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: (v if not isinstance(v, list) else v[:30]) for k, v in report.items()},
                     ensure_ascii=False, indent=1))

if __name__ == '__main__':
    main()
