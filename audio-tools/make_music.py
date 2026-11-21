"""Background music made locally with numpy (no key, no samples, no copyright).
  make_music.py <style> <seconds> <out.wav>      style: lofi (laid-back groove) | bounce (bright, bouncy pop)
Real band layout: kick, clap/snare, hats or shaker, bass line, electric-piano style chords, a simple melody on top."""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 44100
rng = np.random.default_rng(7)


def env(n, a=0.005, decay=6.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-decay * t)


def tone(f, n, harm=(1, 0.3, 0.1), decay=4.0, a=0.004, vib=0.0):
    t = np.arange(n) / SR
    ph = 2 * np.pi * f * t + (vib * np.sin(2 * np.pi * 5 * t) if vib else 0)
    return sum(h * np.sin(ph * (k + 1)) for k, h in enumerate(harm)) * env(n, a, decay)


def lp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2)); return signal.lfilter(b, a, x)


def hp(x, fc):
    b, a = signal.butter(2, fc / (SR / 2), 'high'); return signal.lfilter(b, a, x)


def kick(n=int(0.28 * SR)):
    t = np.arange(n) / SR; f = 45 + 95 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 11) * 1.0


def clap(n=int(0.22 * SR)):
    x = rng.standard_normal(n); x = hp(lp(x, 4200), 900); t = np.arange(n) / SR
    burst = np.exp(-t * 28) + 0.6 * np.exp(-((t - 0.012) ** 2) / 2e-5) + 0.5 * np.exp(-((t - 0.024) ** 2) / 2e-5)
    return x * burst * 0.9


def hat(n=int(0.06 * SR), open_=False):
    n = int(0.18 * SR) if open_ else n; x = hp(rng.standard_normal(n), 7000); return x * np.exp(-np.arange(n) / SR * (22 if open_ else 70)) * 0.5


def shaker(n=int(0.07 * SR)):
    x = hp(rng.standard_normal(n), 5500); t = np.arange(n) / SR; return x * np.minimum(1, t / 0.012) * np.exp(-t * 45) * 0.5


def place(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i < 0 or i >= len(buf): return
    n = min(len(x), len(buf) - i); buf[i:i + n] += x[:n] * gain


NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def hz(name, octave): return 440.0 * 2 ** ((NOTE[name[0]] + (1 if '#' in name else 0) + 12 * (octave - 4) - 9) / 12)


def reverb(x, wet=0.18):
    out = x.copy()
    for d, g in [(0.029, 0.42), (0.043, 0.33), (0.067, 0.26), (0.097, 0.18)]:
        k = int(d * SR); out[k:] += x[:-k] * g
    return x * (1 - wet) + out * wet


def song(style, secs):
    N = int((secs + 0.5) * SR); drums = np.zeros(N); bass = np.zeros(N); keys = np.zeros(N); lead = np.zeros(N)
    if style == 'lofi':
        bpm, swing = 92, 0.14
        prog = [('F', ['A', 'C', 'E', 'G'], 3), ('G', ['B', 'D', 'F', 'A'], 3), ('E', ['G', 'B', 'D', 'F#'], 3), ('A', ['C', 'E', 'G', 'B'], 3)]
        pent = ['C', 'D', 'E', 'G', 'A']
    else:
        bpm, swing = 112, 0.0
        prog = [('C', ['E', 'G', 'B', 'D'], 3), ('A', ['C', 'E', 'G', 'B'], 2), ('F', ['A', 'C', 'E', 'G'], 3), ('G', ['B', 'D', 'F', 'A'], 3)]
        pent = ['C', 'D', 'E', 'G', 'A']
    beat = 60 / bpm; bar = beat * 4; nbar = int(np.ceil((secs + 0.5) / bar)) + 1
    for b in range(nbar):
        t0 = b * bar; root, notes, ro = prog[b % 4]
        # drums
        if style == 'lofi':
            for k, at in enumerate([0, 2.5]): place(drums, kick(), t0 + at * beat, 0.9 if k == 0 else 0.7)
            for at in (1, 3): place(drums, clap(), t0 + at * beat, 0.55)
            for k in range(8): place(drums, hat(open_=(k == 7)), t0 + (k * 0.5 + (swing if k % 2 else 0)) * beat, 0.35 if k % 2 else 0.5)
        else:
            for at in (0, 1, 2, 3): place(drums, kick(), t0 + at * beat, 0.8)
            for at in (1, 3): place(drums, clap(), t0 + at * beat, 0.6)
            for k in range(16): place(drums, shaker(), t0 + k * 0.25 * beat, 0.4 if k % 4 else 0.55)
            for k in range(4): place(drums, hat(open_=True), t0 + (k + 0.5) * beat, 0.3)
        # bass
        rf = hz(root, ro - 1) if root != 'A' else hz('A', 2)
        pat = [(0, 1.0, 1), (1.5, 0.5, 1), (2, 1.0, 1), (3, 0.5, 2), (3.5, 0.5, 1)] if style == 'lofi' else [(0, 0.5, 1), (0.75, 0.25, 1), (1, 0.5, 2), (1.75, 0.25, 1), (2, 0.5, 1), (2.75, 0.25, 1), (3, 0.5, 2), (3.5, 0.5, 1)]
        for at, ln, mult in pat:
            n = int(ln * beat * SR); x = tone(rf * mult, n, (1, 0.5, 0.15), decay=3.5 if style == 'lofi' else 5, a=0.006)
            place(bass, x, t0 + at * beat, 0.9)
        # chords (electric piano feel)
        fr = [hz(nm, 4 if nm in 'ABCDEFG' else 4) for nm in notes]
        hits = [(0, 1.5), (2.5, 1.3)] if style == 'lofi' else [(0.5, 0.45), (1.5, 0.45), (2.5, 0.45), (3.5, 0.45)]
        for at, ln in hits:
            n = int(ln * beat * SR)
            for f in fr: place(keys, tone(f, n, (1, 0.35, 0.12) if style == 'lofi' else (1, 0.5, 0.25), decay=2.6 if style == 'lofi' else 7, a=0.008, vib=0.3 if style == 'lofi' else 0), t0 + at * beat, 0.16)
        # lead melody: a 2-bar motif that varies slightly, plucked
        motif_len = 8
        for k in range(motif_len):
            if rng.random() < (0.55 if style == 'lofi' else 0.7):
                nm = pent[(b * 3 + k * 2 + int(rng.integers(0, 3))) % 5]; oc = 5 if (k % 4 != 3) else 5
                n = int(0.5 * beat * SR * (1.6 if style == 'lofi' else 0.8)); place(lead, tone(hz(nm, oc), n, (1, 0.25, 0.08), decay=5 if style == 'lofi' else 9, a=0.004), t0 + k * 0.5 * beat * (1 if k % 2 == 0 else 1) + (swing * beat if (k % 2 and style == 'lofi') else 0), 0.16)
    keys = lp(keys, 2600 if style == 'lofi' else 4200); bass = lp(bass, 420); lead = reverb(lp(lead, 3800), 0.22)
    if style == 'lofi':
        drums = lp(drums, 5200)
        # gentle vinyl-ish warmth
        drums += lp(rng.standard_normal(N), 3000) * 0.004
    mix = drums * 0.9 + bass * 0.85 + reverb(keys, 0.2) + lead
    # sidechain-ish pump from the kick for punch
    pump = 1 - 0.28 * np.clip(lp(np.abs(drums), 9) * 6, 0, 1)
    mix = mix * pump
    mix = mix[: int(secs * SR)]
    fi, fo = int(0.5 * SR), int(2.0 * SR); mix[:fi] *= np.linspace(0, 1, fi); mix[-fo:] *= np.linspace(1, 0, fo)
    mix = np.tanh(mix * 1.1) / 1.1
    return mix / (np.abs(mix).max() + 1e-9) * 0.9


if __name__ == '__main__':
    style, secs, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
    y = song(style, secs); wavfile.write(out, SR, (y * 32767).astype(np.int16))
    rms = np.sqrt(np.mean(y ** 2)); print(f'{out}: {secs:.1f} s, {style}, rms {20 * np.log10(rms):.1f} dBFS, peak {20 * np.log10(np.abs(y).max()):.1f} dBFS')
