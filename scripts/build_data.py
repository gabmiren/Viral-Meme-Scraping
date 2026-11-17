"""Turn the scan CSVs in data/ into data.js for the site.
Run after each scan:  python3 scripts/build_data.py
"""
import csv, json, os, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'data')
NUM = {'rank','views','followers','x_followers','x_median','share_rate','length_s','sound_shared_by'}

def load(name):
    p = os.path.join(D, name)
    if not os.path.exists(p): return []
    rows = []
    for r in csv.DictReader(open(p, encoding='utf-8')):
        for k in list(r):
            v = r[k]
            if k in NUM:
                try: r[k] = float(v) if v not in ('', None) else None
                except ValueError: r[k] = None
        rows.append(r)
    return rows

meta = {}
mp = os.path.join(D, 'meta.json')
if os.path.exists(mp): meta = json.load(open(mp))
meta['built'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ')

out = {
    'meta': meta,
    'tiktok': load('top50.csv'),
    'instagram': load('top50_ig.csv'),
    'tiktok_rest': load('remainder.csv'),
    'instagram_rest': load('remainder_ig.csv'),
    'daily': load('daily.csv'),
    'ai': load('ai_recreate.csv'),
}
with open(os.path.join(ROOT, 'data.js'), 'w', encoding='utf-8') as f:
    f.write('window.DATA = ' + json.dumps(out, ensure_ascii=False) + ';\n')
print({k: len(v) for k, v in out.items() if isinstance(v, list)})
