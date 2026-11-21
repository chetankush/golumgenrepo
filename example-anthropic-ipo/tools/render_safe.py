# Safe 4K render: renders the film in 8 s pieces and checks every piece against small reference frames (rendered at 1080p,
# light on the GPU). A piece whose frames differ from the reference (3D dropped out, e.g. because another 4K render was
# sharing the GPU) is rendered again. The good pieces are joined with the full data/mix.wav into one compressed file.
#   python3 tools/render_safe.py renders/out-small.mp4             (run from anywhere; works in the project folder)
#   python3 tools/render_safe.py --check renders/some.mp4          (only report broken times in an existing video)
# Calibrated on video K: good frames differ by <= 1.5 (mean abs diff, 54x96 grey), broken frames by >= 25.
import json, os, subprocess, sys, time, tempfile, shutil
from PIL import Image, ImageChops, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
PIECE, STEP, LIMIT, REF = 8.0, 0.5, 8.0, 'review/ref-safe'
dur = json.load(open('data/lines.json'))['duration']
grid = [round(k * STEP, 3) for k in range(int((dur - 0.05) / STEP) + 1)]

def others_rendering():
    r = subprocess.run(['pgrep', '-f', 'capture.mjs'], capture_output=True, text=True)
    return [p for p in r.stdout.split() if p.strip()]

def wait_gpu(max_wait=1800):
    t0 = time.time()
    while others_rendering() and time.time() - t0 < max_wait:
        print('  waiting: another render is using the GPU ...', flush=True); time.sleep(20)

def make_refs():
    if os.path.isdir(REF) and len(os.listdir(REF)) >= len(grid): return
    shutil.rmtree(REF, ignore_errors=True); wait_gpu()
    subprocess.run(['node', 'tools/capture.mjs', 'frames', REF, ','.join(str(t) for t in grid)], env=dict(os.environ, QS=''), stdout=subprocess.DEVNULL, check=True)

def ref(t): return Image.open(os.path.join(REF, f't{t:.2f}.jpg')).convert('L').resize((54, 96))

def broken_times(path, a=0.0, b=None):
    """compare the video's frames (which start at film time a) with the reference frames; return film times that differ"""
    b = dur if b is None else b
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vf', f'fps={1 / STEP}:round=near,scale=54:96', os.path.join(d, 'f%05d.png')], check=True)
        bad = []
        for i, f in enumerate(sorted(os.listdir(d))):
            t = round(a + i * STEP, 3)
            if t not in grid or t >= b: continue
            diff = ImageStat.Stat(ImageChops.difference(Image.open(os.path.join(d, f)).convert('L'), ref(t))).mean[0]
            if diff > LIMIT: bad.append(t)
        return bad

def decode_errors(path):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'null', '-'], capture_output=True, text=True)
    return len(r.stderr.strip().splitlines())

make_refs()
if sys.argv[1] == '--check':
    p = sys.argv[2]; bad = broken_times(p); print(f'{p}: decode errors {decode_errors(p)}, broken frames {len(bad)}', bad[:12]); sys.exit(1 if bad else 0)

out = sys.argv[1]
cuts = [round(k * PIECE, 3) for k in range(int(dur // PIECE) + 1)] + [dur]
cuts = sorted(set(c for c in cuts if c <= dur))
os.makedirs('renders/pieces', exist_ok=True)
pieces = []
for i, (a, b) in enumerate(zip(cuts, cuts[1:])):
    p = f'renders/pieces/p{i:02d}.mp4'
    for attempt in range(1, 6):
        wait_gpu()
        subprocess.run(['node', 'tools/capture.mjs', 'video', p, str(a), str(b)], env=dict(os.environ, QS='&res=2'), stdout=subprocess.DEVNULL, check=True)
        bad, err = broken_times(p, a, b), decode_errors(p)
        print(f'piece {i} ({a:.1f}-{b:.1f} s) try {attempt}: broken frames {len(bad)}, decode errors {err}', flush=True)
        if not bad and not err: break
    else:
        sys.exit(f'piece {i} still broken after 5 tries')
    pieces.append(p)

lst = 'renders/pieces/list.txt'
open(lst, 'w').write(''.join(f"file '{os.path.abspath(p)}'\n" for p in pieces))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-i', 'data/mix.wav', '-map', '0:v', '-map', '1:a',
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '160k',
                '-shortest', '-movflags', '+faststart', out], check=True)
bad = broken_times(out)
print(f'FINAL {out}: decode errors {decode_errors(out)}, broken frames {len(bad)}', bad[:12])
sys.exit(1 if bad else 0)
