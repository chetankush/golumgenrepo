"""make_srt.py <project>: captions (.srt) from the project's own word timings. Local only, no key."""
import json, re, sys, pathlib
P = pathlib.Path(sys.argv[1]); words = json.loads((P / 'data/words.json').read_text())
def ts(sec):
    ms = int(round(sec * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000); return f"{h:02}:{m:02}:{s:02},{ms:03}"
cues, cur = [], []
for i, w in enumerate(words):
    cur.append(w); gap = (words[i + 1]['s'] - w['e']) if i + 1 < len(words) else 9
    if re.search(r'[.?!]$', w['w']) or (re.search(r'[,;:]$', w['w']) and len(cur) >= 4) or len(cur) >= 8 or gap > 0.5: cues.append(cur); cur = []
if cur: cues.append(cur)
merged = []
for c in cues:
    if merged and len(c) <= 2 and len(merged[-1]) + len(c) <= 10 and not re.search(r'[.?!]$', merged[-1][-1]['w']): merged[-1] += c
    else: merged.append(c)
keep = ('I', "I'm", 'US', 'IRS', 'HR', 'Jess', 'Sam', 'Federal', 'Reserve', 'The', 'Clearing', 'House', 'Banks', 'Maya')
out, prev_end = [], True
for n, c in enumerate(merged):
    start = c[0]['s']; end = c[-1]['e'] + 0.15
    if n + 1 < len(merged): end = min(end, merged[n + 1][0]['s'] - 0.02)
    end = max(end, start + 0.6); text = ' '.join(w['w'] for w in c); first = text.split(' ')[0]
    text = text[0].upper() + text[1:] if (prev_end or first in keep) else text[0].lower() + text[1:]
    prev_end = bool(re.search(r'[.?!]$', c[-1]['w'])); out.append([start, end, text])
for i in range(len(out) - 1):
    if out[i][1] > out[i + 1][0] - 0.01: out[i][1] = out[i + 1][0] - 0.01
ok = all(s < e for s, e, _ in out) and all(out[i][1] <= out[i + 1][0] for i in range(len(out) - 1))
(P / 'data/captions-en.srt').write_text('\n'.join(f"{n}\n{ts(s)} --> {ts(e)}\n{t}\n" for n, (s, e, t) in enumerate(out, 1)))
print(P.name, len(out), 'captions; timing valid:', ok, '; last ends', round(out[-1][1], 2))
