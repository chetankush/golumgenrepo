// Boot: fonts → script + timing → 3D engine + sets → captions → shots. draw(t) renders film time t (pure function of t):
// the shot renders its 3D frame into the hidden WebGL canvas, which is copied onto the 2D canvas, then the 2D layer
// (labels, counters) and the captions go on top. window.OP is the API tools/capture.mjs drives.
import { W, H, setCtx, ctx, clamp, eob } from './core/lib.js';
import { T, loadTiming } from './core/timing.js';
import { eio } from './core/lib.js';
import { makeEngine, RES, AA } from './core/engine.js';
import { buildShots, loadAssets } from './shots.js';

const cv = document.getElementById('cv'), GL = document.getElementById('gl');
setCtx(cv.getContext('2d'));
const OP = (window.OP = { ready: false });
const NOCAP = new URLSearchParams(location.search).has('nocap'); window.NOOVER = NOCAP;


// ── captions: 2-4 words, the spoken word in yellow ──
let GROUPS = [];
function buildCaps() {
  GROUPS = []; let cur = []; const flush = () => { if (cur.length) GROUPS.push({ words: cur, s: cur[0].s - 0.05 }); cur = []; };
  T.words.forEach((w, i) => { const gap = i ? w.s - T.words[i - 1].e : 0; if (cur.length && (cur.length >= 4 || gap > 0.45 || cur.map((q) => q.w).join('').length > 17)) flush(); cur.push(w); if (/[.?!]$/.test(w.w) || (/,$/.test(w.w) && cur.length >= 2)) flush(); });
  flush(); GROUPS.forEach((g, i) => { g.e = i < GROUPS.length - 1 ? GROUPS[i + 1].s : g.words[g.words.length - 1].e + 0.4; if (i < GROUPS.length - 1 && g.e - g.words[g.words.length - 1].e > 0.8) g.e = g.words[g.words.length - 1].e + 0.45; });
}
const captionList = () => GROUPS.map((g) => ({ s: g.s, e: g.e, words: g.words.map((w) => ({ hi: false, txt: w.w })) }));
function drawCaption(t) {
  const g = GROUPS.find((q) => t >= q.s && t < q.e); if (!g) return;
  const size = 104, lt = t - g.s, sc = lt < 0.15 ? 0.85 + 0.15 * eob(clamp(lt / 0.15)) : 1;
  ctx.save(); ctx.font = `900 ${size}px Inter`; ctx.letterSpacing = '-1px'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  const ws = g.words.map((w) => w.w.replace(/[.,]$/, '').toUpperCase()), widths = ws.map((x) => ctx.measureText(x).width), sp = size * 0.28, total = widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1), fit = Math.min(1, 940 / total);
  ctx.translate(540, 1500); ctx.scale(sc * fit, sc * fit); let x = -total / 2; let cur = 0; g.words.forEach((w, i) => { if (t >= w.s - 0.02) cur = i; });
  ws.forEach((wd, i) => { ctx.lineWidth = 26; ctx.strokeStyle = '#000'; ctx.strokeText(wd, x, 0); ctx.fillStyle = i === cur ? '#FFD43B' : '#fff'; ctx.fillText(wd, x, 0); x += widths[i] + sp; });
  ctx.restore(); ctx.letterSpacing = '0px';
}

// ── Coin Lessons branding: small tag top-left for the first ~5 s (fades out), logo end card after the last line ──
const LOGO = new Image();
const brandLine = (txt, x, y, size, fill, align = 'left') => { ctx.font = `900 ${size}px Inter`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.24; ctx.strokeStyle = '#1B1403'; ctx.strokeText(txt, x, y); ctx.fillStyle = fill; ctx.fillText(txt, x, y); };
function drawBrand(t) {
  const a = Math.min(clamp(t / 0.35), clamp((5.0 - t) / 0.6));
  if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 10; ctx.drawImage(LOGO, 44, 98, 66, 66); ctx.shadowBlur = 0; ctx.font = '900 36px Inter'; const w1 = ctx.measureText('COIN ').width; brandLine('COIN ', 124, 132, 36, '#FFFFFF'); brandLine('LESSONS', 124 + w1, 132, 36, '#FFC61A'); ctx.restore(); }
  const endT = T.lines[T.lines.length - 1].end + 0.15, p = clamp((t - endT) / 0.35);
  if (p > 0) { ctx.save(); ctx.globalAlpha = 0.66 * p; ctx.fillStyle = '#140c2e'; ctx.fillRect(0, 0, W, H); ctx.restore(); { const q = clamp((t - endT - 0.5) / 0.4); if (q > 0) { ctx.save(); ctx.globalAlpha = q; ctx.translate(540, 1240); ctx.scale(0.7 + 0.3 * eob(q), 0.7 + 0.3 * eob(q)); brandLine('HIT LIKE & SUBSCRIBE', 0, 0, 74, '#FFFFFF', 'center'); brandLine('for more business content', 0, 86, 44, '#FFC61A', 'center'); ctx.restore(); } } const s = 0.55 + 0.45 * eob(p); ctx.save(); ctx.globalAlpha = Math.min(1, p * 2.2); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.translate(540, 1500); ctx.scale(s, s);
    ctx.drawImage(LOGO, -130, -130, 260, 260); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    brandLine('COIN', 0, 175, 104, '#FFFFFF', 'center'); brandLine('LESSONS', 0, 272, 104, '#FFC61A', 'center'); brandLine('MONEY LESSONS, MADE SIMPLE', 0, 350, 30, '#B8E6CB', 'center'); ctx.restore(); }
}

function draw(t) {
  t = clamp(t, 0, T.dur - 1e-4);
  ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.globalAlpha = 1; ctx.letterSpacing = '0px';   // 4K canvas, drawing stays in 1080x1920 units
  const S = OP._shots; let i = S.length - 1; while (i > 0 && S[i].at > t) i--;
  const sh = S[i], end = i < S.length - 1 ? S[i + 1].at : T.dur, d = end - sh.at, lt = t - sh.at;
  const blit = () => ctx.drawImage(GL, 0, 0, W, H);
  ctx.save(); sh.draw(lt, d, t, blit); ctx.restore();
  ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
  const fade = Math.min(clamp(t / 0.25), clamp((T.dur - t) / 0.4));
  if (fade < 1) { ctx.fillStyle = '#000'; ctx.globalAlpha = 1 - fade; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (!NOCAP) { drawCaption(t); drawBrand(t); }
}

(async () => {
  try {
    await document.fonts.load('900 100px Inter'); await document.fonts.load('800 100px Inter');
    const script = await (await fetch('script.json', { cache: 'no-store' })).json();
    await loadTiming();
    LOGO.src = 'src/brand/coin.png'; await LOGO.decode();
    buildCaps(); await loadAssets();
    GL.width = Math.round(1080 * RES); GL.height = Math.round(1920 * RES);
    const E = makeEngine(GL, { w: GL.width, h: GL.height, samples: AA });
    const { shots, cues } = buildShots(E);
    shots.sort((a, b) => a.at - b.at);
    OP._shots = shots; OP.script = script;
    OP.duration = () => T.dur;
    OP.draw = draw;
    OP.frame = (t, q = 0.92) => { draw(t); return cv.toDataURL('image/jpeg', q); };
    OP.shots = () => shots.map((s, i) => ({ id: s.id, at: +s.at.toFixed(3), end: +(i < shots.length - 1 ? shots[i + 1].at : T.dur).toFixed(3), note: s.note || '' }));
    OP.captions = () => captionList().map((c) => ({ s: +c.s.toFixed(3), e: +c.e.toFixed(3), text: c.words.map((w) => (w.hi ? '*' : '') + w.txt).join(' ') }));
    OP.cues = () => cues.slice().sort((a, b) => a.t - b.t);
    OP.ready = true;
    const q = new URLSearchParams(location.search);
    if (!q.has('capture')) {
      if (q.has('t')) draw(+q.get('t'));
      else {
        const audio = new Audio('data/mix.wav'); let t0 = null; const btn = document.getElementById('play'); btn.hidden = false;
        btn.onclick = () => { btn.hidden = true; t0 = performance.now(); audio.currentTime = 0; audio.play().catch(() => {}); };
        const loop = (now) => { const t = t0 == null ? 0 : (now - t0) / 1000; draw(t); if (t0 != null && t > T.dur) { t0 = null; btn.hidden = false; } requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
    }
  } catch (e) { OP.bootError = String(e && e.stack || e); console.error(e); }
})();
