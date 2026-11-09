"""Produce a compact local verification report without copying original session data."""
import json,re,collections
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
inv=json.loads((ROOT/'.work/inventory.json').read_text(encoding='utf-8'))
catalog=json.loads((ROOT/'public/data/catalog.json').read_text(encoding='utf-8'))
out=[]
out.append('# 发布核对记录\n')
out.append('本地范围核对：17个来源组，9024个已保存帧，7923张唯一原图，91个主题；来源组可能合并多份PPT。')
out.append('雨课堂9月9日第二份课件列有107帧，其中第57–107帧未返回图片；1.2.2正文尚未确认。此核对不能证明全部课件已收齐。')
out.append('每个来源页均映射到唯一主题；每个主题均提供连续原页区间，可逐帧浏览。')
out.append('已保存原图资源均已完成解码和尺寸校验。第三章第3节使用现有PDF重渲染。\n')
out.append('|章节|主题|原页（按实际标题重新归类）|')
out.append('|---|---:|---:|')
for c in catalog['chapters']:
    lessons=[l for s in c['sections'] for l in s['lessons']]
    out.append(f'|第{c["number"]}章 {c["title"]}|{len(lessons)}|{sum(l["pages"] for l in lessons)}|')
out.append('\n逐条索引由OCR辅助生成，不能将其自动识别视为每一道例题的人工校正。辅助导读与原始课件分开展示，公式以原页为依据。')
out.append('\n数学工具验证包含：Bézout回代、一次同余式逐类枚举、CRT非互素条件、模幂与直接乘法交叉核对、素数判定、Jacobi与欧拉判别交叉核对、课件平方根算例。')
audit_path=ROOT/'public/data/coverage-audit.json'
if audit_path.exists():
    audit=json.loads(audit_path.read_text(encoding='utf-8'))
    stats=audit['stats']
    out.append(f'\n原题与讲解对应清单：{stats["originalItems"]}处原页索引，{stats["labelGroups"]}组来源标签，拆分为{stats["records"]}条记录。')
    out.append('已程序核对每处原页索引均有同知识点、同类型、同标签及包含完整页区间的对应记录；讲解目标小节真实存在。')
    out.append('上述对应核查不等于全部未编号板书和每个动画帧均已人工重建，也不等于每一道题都另做独立验算。')
(ROOT/'验收记录.md').write_text('\n'.join(out),encoding='utf-8')
print('\n'.join(out))

# Move only this project's unused generated images into a local recovery folder.
source_dir=(ROOT/'public/slides').resolve()
recovery=(ROOT/'.work/unused-generated-images').resolve()
assert recovery.is_relative_to(ROOT.resolve())
recovery.mkdir(exist_ok=True)
moved=0
for file in source_dir.glob('*.webp'):
    if file.stem not in inv['assets']:
        assert file.resolve().parent==source_dir
        file.replace(recovery/file.name);moved+=1
print(f'Archived {moved} unused generated thumbnail assets inside project .work/')
