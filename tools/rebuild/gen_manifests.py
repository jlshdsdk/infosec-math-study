"""Generate per-lesson rebuild manifests (pages, images, OCR, old text, audit refs).

Usage: python tools/rebuild/gen_manifests.py <chapter>
Writes .work/rebuild/manifests/ch<chapter>/<lesson>.json and an index file.
"""
import collections, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.work'
REBUILD = WORK / 'rebuild'

def load_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))

def load_guides():
    guides = {}
    for file in sorted((ROOT / 'content').glob('guides-*.md')):
        text = file.read_text(encoding='utf-8')
        for m in re.finditer(r'^## ([a-z0-9-]+)\s*\n(.*?)(?=^## |\Z)', text, re.M | re.S):
            guides[m[1]] = {'file': file.name, 'text': m[2].strip()}
    return guides

def load_outline():
    src = (ROOT / 'public' / 'ppt-outline.js').read_text(encoding='utf-8')
    start = src.index('window.PPT_OUTLINE') + len('window.PPT_OUTLINE')
    brace = src.index('{', start)
    end = src.rindex('}')
    return json.loads(src[brace:end + 1])

def walk_topics(node, out):
    if isinstance(node, dict):
        if 'key' in node and isinstance(node.get('parts'), list):
            out.append(node)
        for v in node.values():
            walk_topics(v, out)
    elif isinstance(node, list):
        for v in node:
            walk_topics(v, out)

def main(chapter):
    inv = load_json(WORK / 'inventory.json')
    sources = {s['id']: s for s in inv['sources']}
    coverage = load_json(ROOT / 'public' / 'data' / 'coverage.json')
    ranges = [r for r in coverage['ranges'] if r['chapter'] == chapter]

    ocr = {}
    for row in load_json(ROOT / 'public' / 'data' / 'search.json'):
        if row['type'] == '原页':
            ocr[(row['source'], row['page'])] = row['text']

    guides = load_guides()
    outline = load_outline()
    topics = []
    walk_topics(outline.get(chapter, {}), topics)

    audit = []
    for suffix in ('12', '34', '8'):
        audit.extend(load_json(ROOT / 'content' / f'coverage-{suffix}.json'))

    by_lesson = {}
    for r in ranges:
        by_lesson.setdefault(r['lesson'], []).append(r)

    outdir = REBUILD / 'manifests' / f'ch{chapter}'
    outdir.mkdir(parents=True, exist_ok=True)
    (REBUILD / 'out').mkdir(parents=True, exist_ok=True)

    index = []
    for lesson, spans in sorted(by_lesson.items()):
        primary = [s for s in spans if not s['source'].startswith('lesson-')] or spans
        secondary = [s for s in spans if s not in primary]

        pages = []
        for span in primary:
            src = sources[span['source']]
            pmap = {p['page']: p for p in src['pages']}
            for p in range(span['start'], span['end'] + 1):
                asset = pmap[p]['asset']
                img = ROOT / 'public' / 'slides' / (asset + '.webp')
                assert img.exists(), f'missing image {img}'
                pages.append({
                    'source': span['source'],
                    'page': p,
                    'asset': asset,
                    'image': str(img),
                    'ocr': ocr.get((span['source'], p), ''),
                })

        # Group animation frames into slides. Consecutive frames of one slide
        # progressively reveal content, but OCR output order is unstable, so
        # compare character multisets: merge when the next frame's text mostly
        # contains the current group's text (superset growth). Advisory only:
        # agents correct mis-groups by citing the page of the frame they read.
        slides = []
        for page in pages:
            text = re.sub(r'\s+', '', page['ocr'])
            if slides:
                last = slides[-1]
                last_text = re.sub(r'\s+', '', last['ocr'])
                same_source = page['source'] == last['pages'][-1]['source']
                same_asset = page['asset'] == last['pages'][-1]['asset']
                grows = False
                if text and last_text and len(text) > len(last_text):
                    common = collections.Counter(last_text) & collections.Counter(text)
                    grows = sum(common.values()) / len(last_text) >= 0.65
                if same_source and (same_asset or grows or (not text and not last_text)):
                    last['pages'].append(page)
                    if not same_asset:
                        last['asset'] = page['asset']
                        last['image'] = page['image']
                        last['ocr'] = page['ocr']
                    continue
            slides.append({'pages': [page], 'asset': page['asset'],
                           'image': page['image'], 'ocr': page['ocr']})
        for s in slides:
            s['start'] = s['pages'][0]['page']
            s['end'] = s['pages'][-1]['page']
            s['frames'] = len(s['pages'])
            s.pop('pages')
            s.pop('ocr', None)

        lesson_topics = []
        for t in topics:
            for part in t.get('parts', []):
                if part.get('lesson') == lesson:
                    lesson_topics.append({
                        'key': t['key'], 'number': t.get('number', ''),
                        'title': t.get('title', ''),
                        'anchor': part.get('anchor', ''),
                        'label': part.get('label', ''),
                        'from': part.get('from', ''),
                        'until': part.get('until', ''),
                    })
                    break

        rows = [r for r in audit if r['topic'] == lesson or r.get('guideTopic') == lesson]
        g = guides.get(lesson, {'file': '', 'text': ''})

        manifest = {
            'lesson': lesson,
            'title': spans[0]['topic'],
            'chapter': chapter,
            'section': spans[0]['section'],
            'guide_file': g['file'],
            'outline_topics': lesson_topics,
            'primary_spans': [{'source': s['source'], 'file': s['file'], 'start': s['start'], 'end': s['end']} for s in primary],
            'secondary_spans': [{'source': s['source'], 'file': s['file'], 'start': s['start'], 'end': s['end']} for s in secondary],
            'pages': pages,
            'slides': slides,
            'old_guide': g['text'],
            'audit_rows': [{'label': r['label'], 'type': r['type'], 'status': r['status'],
                            'guideHeading': r.get('guideHeading', ''),
                            'sources': r['sources']} for r in rows],
        }
        (outdir / f'{lesson}.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')
        index.append({'lesson': lesson, 'title': manifest['title'], 'pages': len(pages),
                      'slides': len(slides), 'guide_file': g['file'], 'topics': len(lesson_topics)})
    (outdir / 'INDEX.json').write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding='utf-8')
    print(json.dumps(index, ensure_ascii=False, indent=1))
    print(f'chapter {chapter}: {len(index)} lessons, {sum(i["pages"] for i in index)} pages -> {sum(i["slides"] for i in index)} slides')

if __name__ == '__main__':
    main(sys.argv[1])
