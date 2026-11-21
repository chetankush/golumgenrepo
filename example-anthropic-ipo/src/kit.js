// Shared kit for the stick-figure 3D explainers: sets (streets, rooms, props), acting, 2D overlays and a cinematic "director"
// (per-shot camera moves with fov, depth of field, handheld drift, whip / flash / cut transitions).
import * as THREE from 'three';
import { ctx, setCtx as libSetCtx, clamp, lerp, eo, eio, eob, rnd } from './core/lib.js';
import { lightRig } from './core/engine.js';
import * as WD from './core/world.js';
import { StickToon, lerpPose } from './stick3d.js';
import { buildStreet } from './anime.js';

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const INK = '#111111', YEL = '#FFD43B', GRN = '#2fb86a', RED = '#e8453c', BLU = '#2f78e8', WHITE = '#ffffff';

// ── painted backdrops (sky + city layers from the anime painter) ──
export const VIEWS = {};
export function loadViews(kinds = ['day', 'dusk']) {
  const prev = ctx;
  for (const k of kinds) {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const g = c.getContext('2d'); libSetCtx(g);
    const st = buildStreet(k, false); for (const l of st.layers) { if (l.fg || l.k === 1) continue; g.drawImage(l.c, -(l.c.width - 1080) / 2, 0); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; VIEWS[k] = t;
  }
  libSetCtx(prev);
}
export function backdrop(scene, kind, { w = 44, h = 24, z = -18, y = 8, tint = 1, crop = [1, 0.62, 0, 0.3] } = {}) {
  const t = VIEWS[kind].clone(); t.repeat.set(crop[0], crop[1]); t.offset.set(crop[2], crop[3]); t.needsUpdate = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: new THREE.Color(tint, tint, tint * 1.02) })); m.position.set(0, y, z); scene.add(m); return m;
}

// ── primitives ──
export const mat = (o) => WD.mat(o);
export const bx = (w, h, d, col, x, y, z, parent, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.mat || WD.mat({ color: col, ...o })); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (parent) parent.add(m); return m; };
export const cy = (r1, r2, h, col, x, y, z, parent, seg = 18, o = {}) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), o.mat || WD.mat({ color: col, ...o })); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (parent) parent.add(m); return m; };
export const sp = (r, col, x, y, z, parent, o = {}) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), WD.mat({ color: col, ...o })); m.position.set(x, y, z); m.castShadow = true; if (parent) parent.add(m); return m; };
export function canvasPlane(w, h, px = 700, o = {}) {
  const c = document.createElement('canvas'); c.width = Math.round(w * px); c.height = Math.round(h * px); const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: !!o.transparent, side: THREE.DoubleSide }));
  m.draw = (fn) => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); fn(g, c.width, c.height); t.needsUpdate = true; }; return m;
}
export function sign(text, { w = 2, h = 0.5, bg = '#1F3B5C', fg = '#FFE08A', font = 900 } = {}) {
  const cv = document.createElement('canvas'); cv.width = Math.round(w * 700); cv.height = Math.round(h * 700); const g = cv.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height); g.lineWidth = 14; g.strokeStyle = fg; g.strokeRect(16, 16, cv.width - 32, cv.height - 32);
  const ls = text.split('\n'); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = cv.height * (ls.length > 1 ? 0.36 : 0.56); g.font = `${font} ${fs}px Inter`;
  while (Math.max(...ls.map((l) => g.measureText(l).width)) > cv.width * 0.86) { fs -= 3; g.font = `${font} ${fs}px Inter`; }
  ls.forEach((l, i) => g.fillText(l, cv.width / 2, cv.height / 2 + (i - (ls.length - 1) / 2) * fs * 1.12 + 4));
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; const edge = WD.mat({ color: '#10243B' });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), [edge, edge, edge, edge, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), edge]); m.castShadow = true; return m;
}
export function lights(scene, { key = '#FFE6C8', keyI = 2.8, keyPos = [4, 7, 5], pink = 0, blue = 0, hemi = 1.2, sky = '#fff1e6', ground = '#6a5a70', box = 9, at = [0, 1, -1] } = {}) {
  const r = lightRig(scene, { key, keyI, keyPos, rimCol: '#BFD8FF', rimI: 1.2, sky, ground, hemiI: hemi, shadowBox: box, target: at });
  if (pink) { const p = new THREE.PointLight('#ff6fb0', pink, 14, 1.6); p.position.set(-4, 2.8, 1.5); scene.add(p); }
  if (blue) { const b = new THREE.PointLight('#5f9dff', blue, 14, 1.6); b.position.set(4, 2.8, 1.5); scene.add(b); }
  return r;
}

// ── props ──
export function tree(s = 1, col = '#3f9a52') { const g = new THREE.Group(); cy(0.12 * s, 0.17 * s, 1.6 * s, '#7a5236', 0, 0.8 * s, 0, g, 10); [[0, 2.2, 0, 1.0], [0.55, 1.9, 0.2, 0.7], [-0.5, 1.95, -0.1, 0.72], [0.1, 2.75, 0, 0.68]].forEach(([x, y, z, r], i) => sp(r * s, i % 2 ? col : '#52b061', x * s, y * s, z * s, g)); return g; }
export function lamp(h = 3.4) { const g = new THREE.Group(); cy(0.05, 0.07, h, '#2a2a33', 0, h / 2, 0, g, 10); bx(0.5, 0.08, 0.08, '#2a2a33', 0.22, h, 0, g); const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshStandardMaterial({ color: '#fff3c8', emissive: '#ffe7a0', emissiveIntensity: 2.2 })); b.position.set(0.44, h - 0.1, 0); g.add(b); return g; }
/** an American suburban house facing +z (w 5, d 4) */
export function usHouse({ wall = '#f4e6cf', roof = '#9a4a3a', door = '#2f6fc9', trim = '#ffffff' } = {}) {
  const g = new THREE.Group(), W = 5, D = 4, H = 2.9; bx(W, H, D, wall, 0, H / 2, 0, g);
  const sh = new THREE.Shape(); sh.moveTo(-W / 2 - 0.35, 0); sh.lineTo(0, 1.7); sh.lineTo(W / 2 + 0.35, 0); sh.closePath();
  const rf = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: D + 0.5, bevelEnabled: false }), WD.mat({ color: roof })); rf.position.set(0, H, -D / 2 - 0.25); rf.castShadow = true; g.add(rf);
  bx(0.95, 1.9, 0.1, door, 0, 0.95, D / 2 + 0.03, g); bx(1.15, 0.1, 0.15, trim, 0, 1.95, D / 2 + 0.05, g);
  const win = new THREE.MeshStandardMaterial({ color: '#ffe3a0', emissive: '#ffcf7a', emissiveIntensity: 0.55 });
  [-1.6, 1.6].forEach((x) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.9), win); w.position.set(x, 1.55, D / 2 + 0.02); g.add(w); bx(1.2, 0.1, 0.12, trim, x, 1.05, D / 2 + 0.05, g); bx(0.1, 0.95, 0.1, trim, x, 1.55, D / 2 + 0.05, g); });
  bx(W + 0.6, 0.18, 1.4, '#c9b79a', 0, 0.09, D / 2 + 0.7, g); return g;
}
/** a row of British terraced houses (brick, white sash windows, coloured doors) facing +z */
export function terrace(n = 4, { brick = '#a24a35', roof = '#3d3a44' } = {}) {
  const g = new THREE.Group(), U = 3.0, H = 5.4, D = 4; const doors = ['#1f4e8c', '#c22b2b', '#2f7a4f', '#1a1a1a', '#e0b23c', '#6a3a8a'];
  const bm = WD.mat({ map: WD.T.brick ? WD.T.brick(brick, [3, 3]) : null, color: WD.T.brick ? '#ffffff' : brick });
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * U; bx(U - 0.04, H, D, null, x, H / 2, 0, g, { mat: bm });
    bx(U + 0.02, 0.22, D + 0.3, '#e9e4da', x, H, 0, g); const rf = bx(U + 0.02, 1.3, D * 0.62, roof, x, H + 0.55, -0.2, g); rf.rotation.x = -0.35;
    cy(0.2, 0.2, 0.9, '#8b4a3a', x + 0.9, H + 1.1, -0.6, g, 8);
    bx(0.9, 2.0, 0.08, doors[i % doors.length], x - 0.8, 1.0, D / 2 + 0.03, g); bx(1.1, 0.12, 0.2, '#f2efe8', x - 0.8, 2.08, D / 2 + 0.06, g);
    const win = new THREE.MeshStandardMaterial({ color: '#cfe3f2', emissive: '#ffd99a', emissiveIntensity: 0.35 });
    [[0.55, 1.5], [-0.6, 3.9], [0.65, 3.9]].forEach(([wx, wy]) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.15), win); w.position.set(x + wx, wy, D / 2 + 0.02); g.add(w); bx(1.04, 0.1, 0.12, '#f2efe8', x + wx, wy - 0.62, D / 2 + 0.06, g); bx(1.04, 0.06, 0.06, '#f2efe8', x + wx, wy, D / 2 + 0.05, g); bx(0.06, 1.2, 0.06, '#f2efe8', x + wx, wy, D / 2 + 0.05, g); });
    bx(0.1, 0.9, 0.06, '#222', x + U / 2 - 0.02, 0.45, D / 2 + 0.6, g); bx(U - 0.1, 0.06, 0.06, '#222', x, 0.88, D / 2 + 0.6, g);
  }
  return g;
}
/** US curbside mailbox. g.flag (raise with rotation.z) */
export function mailbox() { const g = new THREE.Group(); bx(0.12, 1.05, 0.12, '#6b4a2e', 0, 0.52, 0, g); const body = new THREE.Group(); body.position.set(0, 1.18, 0); g.add(body);
  bx(0.32, 0.2, 0.55, '#3a4a5c', 0, 0, 0, body, { metalness: 0.3, roughness: 0.5 }); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 18, 1, false, 0, Math.PI), WD.mat({ color: '#3a4a5c', metalness: 0.3, roughness: 0.5 })); top.rotation.set(Math.PI / 2, 0, Math.PI / 2); top.position.y = 0.1; top.castShadow = true; body.add(top);
  const flag = new THREE.Group(); flag.position.set(0.18, 0.0, -0.1); body.add(flag); bx(0.02, 0.32, 0.04, '#d8343f', 0, 0.16, 0, flag); bx(0.02, 0.1, 0.14, '#d8343f', 0, 0.28, 0.07, flag); g.flag = flag; return g; }
/** UK red pillar postbox */
export function postbox() { const g = new THREE.Group(); const red = { color: '#c8102e', roughness: 0.45, metalness: 0.1 }; cy(0.26, 0.28, 1.25, null, 0, 0.62, 0, g, 24, { mat: WD.mat(red) }); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), WD.mat(red)); cap.position.y = 1.25; cap.castShadow = true; g.add(cap); bx(0.28, 0.04, 0.05, '#111', 0, 1.0, 0.26, g); cy(0.31, 0.31, 0.06, '#111', 0, 0.03, 0, g, 24); return g; }
export function sofa(col = '#3f6fb8') { const g = new THREE.Group(); bx(2.2, 0.45, 0.9, col, 0, 0.32, 0, g); bx(2.2, 0.7, 0.22, col, 0, 0.75, -0.36, g); [-1, 1].forEach((s) => bx(0.22, 0.6, 0.9, col, s * 1.0, 0.55, 0, g)); [-0.5, 0.5].forEach((x) => bx(0.95, 0.14, 0.75, '#5c8fd8', x, 0.62, 0.05, g)); return g; }
export function desk(w = 1.6, col = '#c99a66') { const g = new THREE.Group(); bx(w, 0.06, 0.8, col, 0, 0.76, 0, g); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bx(0.05, 0.76, 0.05, '#5a4030', a * (w / 2 - 0.06), 0.38, b * 0.34, g)); return g; }
/** laptop facing +z; .screen is a canvasPlane (call screen.draw(fn)) */
export function laptop(s = 1.6) { const g = new THREE.Group(); bx(0.62, 0.025, 0.42, '#c9cdd6', 0, 0.012, 0, g, { metalness: 0.4, roughness: 0.35 }); const lid = new THREE.Group(); lid.position.set(0, 0.02, -0.2); lid.rotation.x = -0.25; g.add(lid);
  bx(0.62, 0.42, 0.02, '#c9cdd6', 0, 0.21, 0, lid, { metalness: 0.4, roughness: 0.35 }); const scr = canvasPlane(0.56, 0.35, 1800); scr.position.set(0, 0.215, 0.012); lid.add(scr); g.screen = scr; g.scale.setScalar(s); return g; }
export function corkBoard(w = 2.6, h = 1.5) { const g = new THREE.Group(); bx(w + 0.12, h + 0.12, 0.06, '#7a5236', 0, 0, -0.02, g); bx(w, h, 0.04, '#c99d6b', 0, 0, 0.01, g); return g; }
export function note(text, col = '#fff38a', w = 0.62, h = 0.42) { const p = canvasPlane(w, h, 600); p.draw((g, W, H) => { g.fillStyle = col; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, H - 14, W, 14); g.fillStyle = '#1a1a1a'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = H * 0.34; g.font = `900 ${fs}px Inter`; while (g.measureText(text).width > W * 0.86) { fs -= 2; g.font = `900 ${fs}px Inter`; } g.fillText(text, W / 2, H / 2 + 4); g.fillStyle = '#d8343f'; g.beginPath(); g.arc(W / 2, 16, 10, 0, 7); g.fill(); }); return p; }
export function box(s = 0.6, col = '#c8935a', label = '') { const g = new THREE.Group(); bx(s, s * 0.8, s, col, 0, s * 0.4, 0, g); bx(s * 0.08, s * 0.81, s * 1.01, '#a8763e', 0, s * 0.4, 0, g); if (label) { const n = note(label, '#ffffff', s * 0.6, s * 0.22); n.position.set(0, s * 0.45, s * 0.505); g.add(n); } return g; }
export function plant() { const g = new THREE.Group(); cy(0.22, 0.17, 0.36, '#c8734a', 0, 0.18, 0, g, 14); for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), WD.mat({ color: i % 2 ? '#3f9a52' : '#5bb065' })); l.scale.set(0.6, 1.8, 0.6); const a = i / 7 * 6.28; l.position.set(Math.cos(a) * 0.12, 0.62, Math.sin(a) * 0.12); l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); l.castShadow = true; g.add(l); } return g; }
/** a room: floor, back + side walls, a window showing the painted city; returns { scene } */
export function room({ wall = '#e8dcc8', floor = '#b98a58', w = 10, depth = 5, h = 3.6, view = 'day', winX = 2.2 } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1a1426');
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, depth + 8), WD.mat({ map: WD.T.planks(floor, [w / 2.2, (depth + 8) / 2.2]) })); fl.material.map.rotation = Math.PI / 2; fl.rotation.x = -Math.PI / 2; fl.position.z = -depth / 2 + 4; fl.receiveShadow = true; scene.add(fl);
  bx(w, h, 0.2, wall, 0, h / 2, -depth, scene); bx(0.2, h, depth + 8, wall, -w / 2, h / 2, -depth / 2 + 4, scene); bx(0.2, h, depth + 8, wall, w / 2, h / 2, -depth / 2 + 4, scene); bx(w, 0.14, 0.24, '#f4efe6', 0, 0.07, -depth + 0.12, scene);
  if (view) { const t = VIEWS[view].clone(); t.repeat.set(0.5, 0.36); t.offset.set(0.25, 0.42); t.needsUpdate = true; const wv = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.7), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); wv.position.set(winX, 1.95, -depth + 0.12); scene.add(wv);
    const fm = { mat: WD.mat({ color: '#f6f1e6' }) }; bx(2.6, 0.1, 0.16, null, winX, 2.85, -depth + 0.14, scene, fm); bx(2.6, 0.12, 0.22, null, winX, 1.05, -depth + 0.16, scene, fm); bx(0.1, 1.85, 0.16, null, winX - 1.25, 1.95, -depth + 0.14, scene, fm); bx(0.1, 1.85, 0.16, null, winX + 1.25, 1.95, -depth + 0.14, scene, fm); bx(0.06, 1.75, 0.12, null, winX, 1.95, -depth + 0.15, scene, fm); }
  return { scene, w, depth, h };
}

// ── cast + acting ──
export const LEO = { hoodie: true, cel: false }, MIA = { hair: 'braids', lashes: true, bow: '#F2619C', cel: false };   // flat white faces (no shading crescent)
export const person = (look, h = 1.7, res = 1.5) => new StickToon({ ...look }, { height: h, res });
/** plan = [{ t, pose, expr, extra, flip, tilt }]: eases to each key pose; idle bob + blink. o.hop = bounce, o.walk = [phase speed] */
export function act(tk, t, plan, ph = 0, o = {}) {
  let i = plan.length - 1; while (i > 0 && plan[i].t > t) i--; const c = plan[i], p = i ? plan[i - 1] : c, k = eio(clamp((t - c.t) / 0.36)), tq = Math.floor(t * 15) / 15;
  const P = lerpPose(p.pose || 'standing', c.pose || 'standing', k); P.dy += Math.sin(tq * 3 + ph) * 0.03 + (o.hop ? -Math.abs(Math.sin(tq * 6.5 + ph)) * 0.28 : 0);
  const ex = c.expr || 'happy', bl = ((tq + ph) % 3.3) < 0.13 && ['happy', 'smug', 'smirk', 'grin'].includes(ex);
  tk.set({ pose: P, expr: bl ? 'blink' : ex, flip: c.flip ?? o.flip, extra: c.extra || o.extra, tilt: c.tilt });
}

// ── 2D overlays ──
export const pill = (text, x, y, fill = YEL, fg = INK, size = 66, sc = 1, rot = 0) => { if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.font = `900 ${size}px Inter`; const w = ctx.measureText(text).width + size * 0.9, h = size * 1.55; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * 0.04); ctx.restore(); };
export const outText = (txt, x, y, size, fill, rot = 0, sc = 1, ol = 0.2) => { if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.font = `900 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * ol; ctx.strokeStyle = INK; ctx.strokeText(txt, 0, 0); ctx.fillStyle = fill; ctx.fillText(txt, 0, 0); ctx.restore(); };
export const stamp = (txt, x, y, size, col, rot, p) => { if (p <= 0) return; const s = p < 1 ? 1 + (1 - eo(clamp(p))) * 1.5 : 1; ctx.save(); ctx.globalAlpha = clamp(p * 4); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.font = `900 ${size}px Inter`; const w = ctx.measureText(txt).width + 60, h = size * 1.4; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 18); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(-w / 2 - 9, -h / 2 - 9, w + 18, h + 18, 22); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 4); ctx.restore(); };
/** "STEP n" badge: big numbered circle + label */
export const step = (n, label, x, y, p, col = BLU) => { if (p <= 0) return; const s = eob(clamp(p)); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.arc(0, 0, 70, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke(); ctx.font = '900 92px Inter'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 0, 6); ctx.restore(); if (label) pill(label, x + 70 + 20 + label.length * 19, y, '#fff', INK, 54, s); };
export const bigX = (x, y, r, p) => { if (p <= 0) return; ctx.save(); ctx.translate(x, y); const a = clamp(p * 2), b = clamp(p * 2 - 1); ctx.lineCap = 'round'; for (const [w, c] of [[56, INK], [34, RED]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-r, -r); ctx.lineTo(lerp(-r, r, a), lerp(-r, r, a)); if (b > 0) { ctx.moveTo(r, -r); ctx.lineTo(lerp(r, -r, b), lerp(-r, r, b)); } ctx.stroke(); } ctx.restore(); };
export const check = (x, y, s, p, col = GRN) => { if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const a = clamp(p * 2), b = clamp(p * 2 - 1); for (const [w, c] of [[44, INK], [26, col]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-46, 2); ctx.lineTo(lerp(-46, -14, a), lerp(2, 36, a)); if (b > 0) ctx.lineTo(lerp(-14, 50, b), lerp(36, -38, b)); ctx.stroke(); } ctx.restore(); };

// ── the director: cinematic shots ──
const GLC = () => document.getElementById('gl');
/** shot spec: { id, at, scene, people, cam: { from, to, look, look2, fov, fov2 }, dof (aperture), tr: 'cut'|'flash'|'whip', shake, update(t, lt), over(lt, d, t), grade } */
export function director(E, camera) {
  const S = [], cam = camera(36);
  const add = (s) => S.push({ id: s.id, at: s.at, note: s.id, draw(lt, d, t, blit) {
    s.update && s.update(t, lt, d); const k = eio(clamp(lt / d)), c = s.cam;
    const tg = V3(...c.look).lerp(V3(...(c.look2 || c.look)), k), pos = V3(...c.from).lerp(V3(...(c.to || c.from)), k);
    if (s.tr === 'whip' && lt < 0.28) { const w = (1 - eo(lt / 0.28)); tg.x += w * 2.2 * (s.whipDir || 1); }
    const sh = s.shake ?? 0.012; pos.x += Math.sin(t * 1.7) * sh; pos.y += Math.sin(t * 2.3 + 1) * sh * 0.7;
    const fov = lerp(c.fov || 36, c.fov2 || c.fov || 36, k); if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.position.copy(pos); cam.lookAt(tg); (s.people || []).forEach((p) => p.face(cam));
    E.render(s.scene, cam, { bloom: 0.3, bloomThreshold: 1.0, aperture: (s.dof ?? 0.0012) * 0.45, maxblur: 0.008, vignette: 0.22, sat: 1.14, warm: 0.03, ...(s.grade || {}), focus: pos.distanceTo(s.focus ? V3(...s.focus) : tg) });
    if (s.tr === 'whip' && lt < 0.22) { const w = 1 - lt / 0.22, G = GLC(); for (let i = -3; i <= 3; i++) { ctx.globalAlpha = 0.2; ctx.drawImage(G, i * w * 70 * (s.whipDir || 1), 0, 1080, 1920); } ctx.globalAlpha = 1; } else blit();
    if (s.over && !window.NOOVER) s.over(lt, d, t);
    if (s.tr === 'flash' && lt < 0.14) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.65 * (1 - lt / 0.14); ctx.fillRect(0, 0, 1080, 1920); ctx.globalAlpha = 1; }
  } });
  return { S, add, cam };
}
