// Anime look, all in code: painted poster-colour multiplane backgrounds + the "photography pass" (bloom, grain, fringing, light leak).
import { ctx, setCtx, W, H, clamp, lerp, TAU } from './core/lib.js';

export const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export function RNG(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export const OUT = '#3a2218';   // thin dark-brown outline used on every drawn prop

// ── palettes ────────────────────────────────────────────────────────────────────────────────────────────
export const PAL = {
  day: { skyTop: '#2f7cf0', skyMid: '#6dbcff', skyLow: '#cdeeff', cS: '#9db2ee', cB: '#f5f9ff', cH: '#fff2d2', far: '#7b8ed6', farLit: '#a4b6f0', haze: 'rgba(214,236,255,0.55)',
    walls: ['#f4c9a0', '#9fd6c4', '#f2e2a0', '#e0a8b8', '#b4c8f0'], wallSh: '#6a62b8', roofs: ['#d9503f', '#2f6fc9', '#e9a31f'], side: '#d8d0e6', sideSh: '#7a72b6', road: '#6c6f96', roadSh: '#4d4c86', leaf: ['#2f9a59', '#52c06a', '#a6e07a'], sun: '#fff0b8', leak: 'rgba(255,190,110,0.5)' },
  sunset: { skyTop: '#3a2f93', skyMid: '#d65f8f', skyLow: '#ffc47c', cS: '#8c4aa0', cB: '#ffb3a1', cH: '#ffe6b4', far: '#6a3f9c', farLit: '#b0589c', haze: 'rgba(255,190,130,0.5)',
    walls: ['#f0b48c', '#a5c2b4', '#eecf94', '#d398ae', '#a9a8e0'], wallSh: '#4f3a92', roofs: ['#c83f4a', '#3f58b8', '#e08a22'], side: '#e0b8b8', sideSh: '#6a4a9c', road: '#5d4f88', roadSh: '#40336e', leaf: ['#2d7e57', '#4fa062', '#d0c060'], sun: '#fff1c8', leak: 'rgba(255,140,80,0.55)' },
};

PAL.dusk = { dark: true, skyTop: '#140b3a', skyMid: '#4b2494', skyLow: '#ff7aa6', cS: '#3a2380', cB: '#a05ac4', cH: '#ffc07a', far: '#2a1d6e', farLit: '#4a3a9c', haze: 'rgba(255,140,170,0.45)',
  walls: ['#3d2b78', '#2c3d86', '#4c2a6c', '#2b3366', '#3b3578'], wallSh: '#171048', roofs: ['#d9503f', '#2f6fc9', '#e9a31f'], side: '#5a4a9a', sideSh: '#171048', road: '#2d2468', roadSh: '#150f40', leaf: ['#1f6a5a', '#2f9a6a', '#8fd07a'], sun: '#fff0b8', leak: 'rgba(255,170,110,0.5)' };
const circ = (g, x, y, r, f) => { g.fillStyle = f; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };

/** short dry-brush strokes over a canvas: the "visible brush texture" */
export function brushTex(c, seed, n, alpha, ang = -0.35, cols = ['rgba(255,255,255,1)', 'rgba(40,30,90,1)']) {
  const g = c.getContext('2d'), r = RNG(seed); g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = r() * c.width, y = r() * c.height, len = 40 + r() * 140, a = ang + (r() - 0.5) * 0.45;
    g.strokeStyle = cols[r() < 0.55 ? 0 : 1]; g.globalAlpha = alpha * (0.3 + r() * 0.7); g.lineWidth = 3 + r() * 11;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5 + (r() - 0.5) * 8, x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
  }
  g.restore();
}

/** one flat three-tone cumulus with a flat base and soft brushed edge */
function cumulus(g, x, y, s, P, seed) {
  const r = RNG(seed), n = 7 + ((r() * 4) | 0), T = mk(Math.ceil(s * 2.4), Math.ceil(s * 1.5)), t = T.getContext('2d'), ox = T.width / 2, oy = T.height * 0.72;
  const puffs = [];
  for (let i = 0; i < n; i++) { const u = i / (n - 1), k = Math.sin(u * Math.PI); puffs.push({ x: (u - 0.5) * s * 1.7 + (r() - 0.5) * s * 0.18, y: -k * s * 0.34 + (r() - 0.5) * s * 0.1, r: s * (0.2 + k * 0.26 + r() * 0.06) }); }
  for (const p of puffs) circ(t, ox + p.x, oy + p.y + p.r * 0.22, p.r, P.cS);
  for (const p of puffs) circ(t, ox + p.x - p.r * 0.05, oy + p.y - p.r * 0.08, p.r * 0.9, P.cB);
  for (const p of puffs) if (p.y < -s * 0.1) circ(t, ox + p.x - p.r * 0.22, oy + p.y - p.r * 0.32, p.r * 0.5, P.cH);
  t.globalCompositeOperation = 'destination-out'; t.fillStyle = '#000'; t.fillRect(0, oy + s * 0.06, T.width, T.height);   // flat base
  t.globalCompositeOperation = 'source-over';
  g.save(); g.filter = 'blur(1.6px)'; g.drawImage(T, x - ox, y - oy); g.filter = 'none'; g.restore();
}

function skyLayer(w, h, P, seed, clouds) {
  const c = mk(w, h), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, h * 0.62);
  gr.addColorStop(0, P.skyTop); gr.addColorStop(0.55, P.skyMid); gr.addColorStop(1, P.skyLow); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = RNG(seed);
  for (const [fx, fy, s] of clouds) cumulus(g, fx * w, fy * h, s, P, Math.floor(r() * 9999) + 3);
  if (P.dark) { const sg = g.createRadialGradient(w * 0.55, h * 0.58, 20, w * 0.55, h * 0.58, 700); sg.addColorStop(0, 'rgba(255,210,140,0.95)'); sg.addColorStop(0.25, 'rgba(255,140,150,0.5)'); sg.addColorStop(1, 'rgba(255,120,160,0)'); g.fillStyle = sg; g.fillRect(0, 0, w, h); g.fillStyle = '#ffe3a0'; g.beginPath(); g.arc(w * 0.55, h * 0.58, 120, 0, TAU); g.fill(); }
  brushTex(c, seed + 7, 650, 0.07, -0.25, ['rgba(255,255,255,1)', 'rgba(30,60,160,1)']);
  return c;
}

function farCity(w, h, P, seed, base) {
  const c = mk(w, h), g = c.getContext('2d'), r = RNG(seed); let x = -20;
  while (x < w) {
    const bw = 70 + r() * 110, bh = 190 + r() * 430; g.fillStyle = P.far; g.fillRect(x, base - bh, bw, bh);
    g.fillStyle = P.farLit; g.fillRect(x, base - bh, bw * 0.3, bh);
    g.fillStyle = 'rgba(255,255,255,0.18)'; for (let yy = base - bh + 22; yy < base - 24; yy += 34) for (let xx = x + bw * 0.4; xx < x + bw - 10; xx += 24) if (r() < 0.45) g.fillRect(xx, yy, 10, 14);
    x += bw + 6 + r() * 16;
  }
  const hz = g.createLinearGradient(0, base - 300, 0, base); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, P.haze); g.fillStyle = hz; g.fillRect(0, base - 300, w, 300);
  brushTex(c, seed + 3, 260, 0.06, -0.4);
  return c;
}

const outline = (g, w = 4) => { g.strokeStyle = OUT; g.lineWidth = w; g.lineJoin = 'round'; g.stroke(); };
function window_(g, x, y, w, h, P, lit) {
  g.beginPath(); g.rect(x, y, w, h); const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, lit ? '#ffe9a8' : (P.dark ? '#4a5ac8' : '#8fd0ff')); gr.addColorStop(1, lit ? '#ffc766' : (P.dark ? '#2a2f8a' : '#5a8fe6')); g.fillStyle = gr; g.fill(); outline(g, 4);
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(x + w * 0.1, y + h * 0.9); g.lineTo(x + w * 0.5, y + h * 0.1); g.lineTo(x + w * 0.66, y + h * 0.1); g.lineTo(x + w * 0.26, y + h * 0.9); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); outline(g, 3);
}

/** the row of shops. phoneShop: x of the phone shop (sign + window of phones) */
function midRow(w, h, P, seed, base, phoneShopX) {
  const c = mk(w, h), g = c.getContext('2d'), r = RNG(seed); let x = -30, i = 0;
  while (x < w) {
    const isP = phoneShopX != null && x < phoneShopX && x + 420 > phoneShopX, bw = isP ? 460 : 300 + r() * 80, bh = isP ? 620 : 520 + r() * 170, col = isP ? '#f6d9a8' : P.walls[i % P.walls.length], top = base - bh;
    g.beginPath(); g.rect(x, top, bw, bh); g.fillStyle = col; g.fill(); outline(g, 5);
    g.fillStyle = P.wallSh; g.globalAlpha = 0.34; g.fillRect(x + bw * 0.72, top, bw * 0.28, bh); g.globalAlpha = 1;   // the single hard shadow tone
    g.beginPath(); g.rect(x - 8, top - 24, bw + 16, 30); g.fillStyle = '#fff6e8'; g.fill(); outline(g, 4);
    if (isP) {
      // glass shop front with phones on stands
      g.beginPath(); g.rect(x + 40, base - 300, bw - 80, 250); g.fillStyle = '#ffeab8'; g.fill(); outline(g, 5);
      for (let k = 0; k < 4; k++) { const px = x + 80 + k * 90; g.beginPath(); g.roundRect(px, base - 235, 44, 80, 7); g.fillStyle = ['#2f8cff', '#ff6a8a', '#38c38a', '#ffb02f'][k]; g.fill(); outline(g, 3); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(px + 6, base - 228, 7, 60); g.fillStyle = '#c9a373'; g.fillRect(px + 16, base - 154, 12, 34); }
      g.beginPath(); g.rect(x + bw / 2 + 10, base - 280, 150, 230); g.fillStyle = '#ffd9d0'; g.fill(); outline(g, 4);
      // striped awning + sign
      for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(x + 20 + k * (bw - 40) / 9, base - 330); g.lineTo(x + 20 + (k + 1) * (bw - 40) / 9, base - 330); g.lineTo(x + 8 + (k + 1) * (bw - 16) / 9, base - 286); g.lineTo(x + 8 + k * (bw - 16) / 9, base - 286); g.closePath(); g.fillStyle = k % 2 ? '#fff6ec' : '#e8453c'; g.fill(); outline(g, 3); }
      g.beginPath(); g.roundRect(x + bw / 2 - 150, top + 70, 300, 108, 18); g.fillStyle = '#1d4fb3'; g.fill(); outline(g, 6);
      g.font = '900 78px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd94a'; g.strokeStyle = OUT; g.lineWidth = 7; g.lineJoin = 'round'; g.strokeText('PHONES', x + bw / 2, top + 126); g.fillText('PHONES', x + bw / 2, top + 126);
      for (let k = 0; k < 3; k++) window_(g, x + 50 + k * 135, top + 220, 100, 110, P, k === 1);
    } else {
      const cols = bw > 330 ? 3 : 2, ww = 62, gap = (bw - cols * ww) / (cols + 1);
      for (let row = 0; row < 3; row++) for (let k = 0; k < cols; k++) if (!(row === 2 && k === 0)) window_(g, x + gap + k * (ww + gap), top + 70 + row * 130, ww, 92, P, r() < (P.dark ? 0.55 : 0.25));
      // shop door + small awning
      const dx = x + gap, aw = ww + 46; g.beginPath(); g.rect(dx, base - 150, ww, 150); g.fillStyle = P.roofs[i % 3]; g.fill(); outline(g, 4);
      g.beginPath(); g.moveTo(dx - 24, base - 168); g.lineTo(dx + aw - 24, base - 168); g.lineTo(dx + aw - 10, base - 132); g.lineTo(dx - 38, base - 132); g.closePath(); g.fillStyle = P.roofs[(i + 1) % 3]; g.fill(); outline(g, 4);
    }
    x += bw + 14; i++;
  }
  brushTex(c, seed + 5, 520, 0.07, -0.3);
  return c;
}

function groundLayer(w, h, P, seed, y0) {
  const c = mk(w, h), g = c.getContext('2d');
  const side = g.createLinearGradient(0, y0, 0, y0 + 250); side.addColorStop(0, P.side); side.addColorStop(1, '#fff1e2'); g.fillStyle = side; g.fillRect(0, y0, w, 250);
  g.fillStyle = P.sideSh; g.globalAlpha = 0.42; for (let x = -100; x < w; x += 480) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x + 330, y0); g.lineTo(x + 130, y0 + 250); g.lineTo(x - 200, y0 + 250); g.closePath(); g.fill(); } g.globalAlpha = 1;
  g.strokeStyle = 'rgba(90,70,140,0.35)'; g.lineWidth = 3; for (let x = 0; x < w; x += 160) { g.beginPath(); g.moveTo(x, y0 + 4); g.lineTo(x - 70, y0 + 250); g.stroke(); }
  g.fillStyle = '#f4efe4'; g.fillRect(0, y0 + 250, w, 36); g.fillStyle = '#c9c0d4'; g.fillRect(0, y0 + 286, w, 20); g.strokeStyle = OUT; g.lineWidth = 4; g.beginPath(); g.moveTo(0, y0 + 250); g.lineTo(w, y0 + 250); g.moveTo(0, y0 + 306); g.lineTo(w, y0 + 306); g.stroke();
  const road = g.createLinearGradient(0, y0 + 306, 0, h); road.addColorStop(0, P.road); road.addColorStop(1, P.roadSh); g.fillStyle = road; g.fillRect(0, y0 + 306, w, h - y0 - 306);
  g.fillStyle = '#fff4c8'; for (let x = 40; x < w; x += 330) { g.beginPath(); g.moveTo(x, y0 + 520); g.lineTo(x + 230, y0 + 520); g.lineTo(x + 262, y0 + 548); g.lineTo(x + 6, y0 + 548); g.closePath(); g.fill(); }
  brushTex(c, seed + 9, 380, 0.08, -0.05);
  return c;
}

function leafy(g, x, y, s, P, seed) {
  const r = RNG(seed);
  for (let t = 0; t < 3; t++) for (let i = 0; i < 16; i++) circ(g, x + (r() - 0.5) * s * 1.6, y + (r() - 0.5) * s * 0.8 + t * 4, s * (0.2 + r() * 0.2) * (1 - t * 0.12), P.leaf[t]);
  g.strokeStyle = OUT; g.globalAlpha = 0;
}

function fgFrame(w, h, P, seed) {
  const c = mk(w, h), g = c.getContext('2d'), r = RNG(seed);
  // hanging leaves in the top-left + a lamp post on the right: out-of-focus foreground
  g.fillStyle = '#5a3a28'; g.beginPath(); g.moveTo(-30, 0); g.lineTo(60, 0); g.lineTo(30, 330); g.lineTo(-40, 330); g.fill();
  for (let i = 0; i < 30; i++) { const x = r() * 520 - 40, y = r() * 260, s = 70 + r() * 90; circ(g, x, y, s, P.leaf[0]); circ(g, x + s * 0.12, y + s * 0.1, s * 0.8, P.leaf[1]); circ(g, x - s * 0.2, y - s * 0.2, s * 0.42, P.leaf[2]); }
  g.fillStyle = '#2a2234'; g.fillRect(w - 150, 380, 26, h); g.beginPath(); g.roundRect(w - 215, 300, 160, 110, 20); g.fill();
  g.fillStyle = '#ffe9a8'; g.beginPath(); g.roundRect(w - 200, 318, 130, 74, 14); g.fill();
  return c;
}

// ── scenes: arrays of depth layers {c, k (parallax), fg (drawn in front of characters)} ─────────────────────
const LW = (k) => Math.ceil(W + 440 * k);
export function buildStreet(kind = 'day', phoneShop = true) {
  const P = PAL[kind], clouds = [[0.2, 0.14, 380], [0.62, 0.2, 470], [0.9, 0.08, 330], [0.4, 0.33, 300], [0.78, 0.32, 260]];
  return { P, layers: [
    { c: skyLayer(LW(0.12), H, P, kind === 'day' ? 11 : 21, clouds), k: 0.12 },
    { c: farCity(LW(0.3), H, P, 31, 1180), k: 0.3 },
    { c: midRow(LW(0.62), H, P, 41, 1150, phoneShop ? 520 : null), k: 0.62 },
    { c: groundLayer(LW(1), H, P, 51, 1150), k: 1 },
    { c: fgFrame(LW(1.7), H, P, 61), k: 1.7, fg: true },
  ] };
}

function shopInterior(w, h, P, seed) {
  const c = mk(w, h), g = c.getContext('2d'), r = RNG(seed);
  const wall = g.createLinearGradient(0, 0, 0, 1100); wall.addColorStop(0, '#ffe9c4'); wall.addColorStop(1, '#ffc99a'); g.fillStyle = wall; g.fillRect(0, 0, w, 1100);
  g.fillStyle = 'rgba(120,80,170,0.18)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(260, 0); g.lineTo(100, 1100); g.lineTo(0, 1100); g.fill();
  brushTex(c, seed + 1, 500, 0.08, -0.2, ['rgba(255,255,255,1)', 'rgba(150,80,50,1)']);
  // big window with sky
  g.save(); g.beginPath(); g.rect(110, 170, 420, 520); g.clip(); const sk = g.createLinearGradient(0, 170, 0, 690); sk.addColorStop(0, '#3a86f2'); sk.addColorStop(1, '#cfeeff'); g.fillStyle = sk; g.fillRect(110, 170, 420, 520);
  cumulus(g, 330, 470, 230, PAL.day, 77); g.restore(); g.beginPath(); g.rect(110, 170, 420, 520); outline(g, 8); g.beginPath(); g.moveTo(320, 170); g.lineTo(320, 690); g.moveTo(110, 430); g.lineTo(530, 430); outline(g, 6);
  // shelves with phone boxes
  for (let s = 0; s < 3; s++) { const sy = 330 + s * 220; g.fillStyle = '#a96a3e'; g.fillRect(640, sy + 110, 520, 26); g.strokeStyle = OUT; g.lineWidth = 4; g.strokeRect(640, sy + 110, 520, 26);
    for (let k = 0; k < 6; k++) { const bx = 662 + k * 82, bh = 70 + r() * 30; g.beginPath(); g.roundRect(bx, sy + 110 - bh, 56, bh, 6); g.fillStyle = ['#2f8cff', '#ff6a8a', '#38c38a', '#ffb02f', '#9a6cff', '#fff'][k]; g.fill(); outline(g, 3); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(bx + 6, sy + 110 - bh + 8, 8, bh - 16); } }
  // sign + warm lamp
  g.beginPath(); g.roundRect(160, 80, 320, 70, 16); g.fillStyle = '#1d4fb3'; g.fill(); outline(g, 5); g.font = '900 46px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd94a'; g.strokeStyle = OUT; g.lineWidth = 5; g.strokeText('NEW PHONES', 320, 116); g.fillText('NEW PHONES', 320, 116);
  const gl = g.createRadialGradient(w / 2, 0, 10, w / 2, 0, 700); gl.addColorStop(0, 'rgba(255,240,170,0.55)'); gl.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gl; g.fillRect(0, 0, w, 900);
  return c;
}
function shopFloor(w, h, P, seed) {
  const c = mk(w, h), g = c.getContext('2d'), y0 = 1000;
  // counter
  const top = g.createLinearGradient(0, y0, 0, y0 + 60); top.addColorStop(0, '#f3c690'); top.addColorStop(1, '#d99a62'); g.fillStyle = top; g.fillRect(-20, y0, w + 40, 60); g.strokeStyle = OUT; g.lineWidth = 5; g.strokeRect(-20, y0, w + 40, 60);
  g.fillStyle = '#b8683a'; g.fillRect(-20, y0 + 60, w + 40, 300); g.strokeRect(-20, y0 + 60, w + 40, 300); g.fillStyle = 'rgba(80,50,140,0.32)'; g.fillRect(w * 0.7, y0 + 60, w * 0.3, 300);
  g.strokeStyle = 'rgba(70,30,10,0.35)'; g.lineWidth = 3; for (let x = 60; x < w; x += 150) { g.strokeRect(x, y0 + 90, 120, 240); }
  const fl = g.createLinearGradient(0, y0 + 360, 0, h); fl.addColorStop(0, '#d7a070'); fl.addColorStop(1, '#a8714a'); g.fillStyle = fl; g.fillRect(0, y0 + 360, w, h - y0 - 360);
  g.strokeStyle = 'rgba(70,30,10,0.3)'; g.lineWidth = 3; for (let x = -200; x < w + 200; x += 130) { g.beginPath(); g.moveTo(x, y0 + 360); g.lineTo(x - (x - w / 2) * 0.35, h); g.stroke(); }
  brushTex(c, seed, 300, 0.07, -0.05, ['rgba(255,235,200,1)', 'rgba(80,40,20,1)']);
  return c;
}
function fgPlant(w, h) {
  const c = mk(w, h), g = c.getContext('2d'), P = PAL.day;
  g.fillStyle = '#c8734a'; g.beginPath(); g.moveTo(w - 330, h - 260); g.lineTo(w - 70, h - 260); g.lineTo(w - 110, h - 20); g.lineTo(w - 290, h - 20); g.fill();
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.34, L = 520 + (i % 3) * 120; g.save(); g.translate(w - 200, h - 250); g.rotate(a + Math.PI / 2); g.beginPath(); g.ellipse(0, -L / 2, 70, L / 2, 0, 0, TAU); g.fillStyle = P.leaf[i % 3]; g.fill(); g.restore(); }
  return c;
}
export function buildShop() {
  const P = PAL.day;
  return { P, layers: [
    { c: shopInterior(LW(0.4), H, P, 91), k: 0.4 },
    { c: shopFloor(LW(1), H, P, 92), k: 1 },
    { c: fgPlant(LW(1.7), H), k: 1.7, fg: true },
  ] };
}

/** draw a scene's layers. cam: { pan 0..1, zoom, fy (focus y) }; fg=true draws only the front layers */
export function drawScene(sc, cam, fg = false, blurFg = 5) {
  const { pan = 0.5, zoom = 1, fy = 900 } = cam;
  for (const l of sc.layers) {
    if (!!l.fg !== fg) continue;
    const s = 1 + (zoom - 1) * (0.5 + 0.35 * Math.min(l.k, 1.7)), ox = -(l.c.width - W) * pan;
    ctx.save(); ctx.translate(540, fy); ctx.scale(s, s); ctx.translate(-540, -fy);
    if (l.fg && blurFg) ctx.filter = `blur(${blurFg}px)`;
    ctx.drawImage(l.c, ox, 0); ctx.filter = 'none'; ctx.restore();
  }
}

// ── photography pass ────────────────────────────────────────────────────────────────────────────────────────
let _vig, _grain = [], _bloom, _red, _blu, _part, _tmp;
export function initFX() {
  _vig = mk(W, H); const g = _vig.getContext('2d'), gr = g.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.5, H * 0.78); gr.addColorStop(0, 'rgba(20,10,50,0)'); gr.addColorStop(1, 'rgba(20,10,50,0.5)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 4; k++) { const c = mk(360, 360), t = c.getContext('2d'), im = t.createImageData(360, 360), r = RNG(900 + k); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } t.putImageData(im, 0, 0); _grain.push(c); }
  _bloom = mk(270, 480); _red = mk(W, H); _blu = mk(W, H); _part = mk(W, H); _tmp = mk(W, H);
}

/** drifting, out-of-focus foreground particles (petals / dust), blurred once */
export function particles(t, kind = 'dust', alpha = 0.8) {
  const g = _part.getContext('2d'); g.clearRect(0, 0, W, H); const r = RNG(5);
  for (let i = 0; i < 22; i++) {
    const sp = 18 + r() * 40, x = ((r() * 1400 + t * sp * 0.9) % 1300) - 110, y = ((r() * 2100 + t * (kind === 'petal' ? sp * 1.2 : -sp * 0.6)) % 2100) - 80, s = 6 + r() * 20;
    g.fillStyle = kind === 'petal' ? (i % 2 ? 'rgba(255,170,200,0.9)' : 'rgba(255,215,230,0.9)') : 'rgba(255,248,210,0.85)';
    g.beginPath(); g.ellipse(x, y, s, kind === 'petal' ? s * 0.55 : s, t * 0.6 + i, 0, TAU); g.fill();
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.filter = 'blur(5px)'; ctx.drawImage(_part, 0, 0); ctx.filter = 'none'; ctx.restore();
}

/** whole-frame finish: bloom, warm light leak, chromatic fringe, vignette, film grain */
export function post(cv, t, o = {}) {
  const g = ctx, bg = _bloom.getContext('2d');
  bg.clearRect(0, 0, 270, 480); bg.filter = 'brightness(0.62) contrast(2.6) saturate(1.3)'; bg.drawImage(cv, 0, 0, 270, 480); bg.filter = 'none';
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = o.bloom ?? 0.25; g.filter = 'blur(14px)'; g.drawImage(_bloom, 0, 0, W, H); g.filter = 'none'; g.restore();
  // warm light leak drifting in from the right edge
  const la = (o.leak ?? 0.3) * (0.6 + 0.4 * Math.sin(t * 0.9)), lg = g.createRadialGradient(W + 60, 420 + 120 * Math.sin(t * 0.5), 20, W + 60, 560, 760);
  lg.addColorStop(0, o.leakCol || 'rgba(255,170,90,0.55)'); lg.addColorStop(1, 'rgba(255,170,90,0)'); g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = la; g.fillStyle = lg; g.fillRect(0, 0, W, H); g.restore();
  // slight colour fringing: red copy nudged right, blue copy nudged left
  const rc = _red.getContext('2d'), bc = _blu.getContext('2d');
  for (const [c2, col] of [[rc, '#f00'], [bc, '#00f']]) { c2.globalCompositeOperation = 'source-over'; c2.drawImage(cv, 0, 0); c2.globalCompositeOperation = 'multiply'; c2.fillStyle = col; c2.fillRect(0, 0, W, H); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16; g.drawImage(_red, 2.2, 0); g.drawImage(_blu, -2.2, 0); g.restore();
  g.drawImage(_vig, 0, 0);
  const k = Math.floor(t * 12) % 4, gc = _grain[k]; g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.34; const off = (Math.floor(t * 24) * 97) % 360; for (let x = -off; x < W; x += 360) for (let y = -((off * 1.7) | 0) % 360; y < H; y += 360) g.drawImage(gc, x, y); g.restore();
}
