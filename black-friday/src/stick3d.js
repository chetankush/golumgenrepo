// The owner's stick figure (character sheet: white head, black body, white gloves + sneakers) as a flat 2D cut-out standing in the 3D world.
// Drawn with the same code as the 2D stickman, onto a canvas texture, turned to face the camera (like the Toon cut-outs).
import * as THREE from 'three';
import { stickman, POSES } from './stick2d.js';
export { POSES };
const lerp = (a, b, t) => a + (b - a) * t;
export function lerpPose(a, b, k) {
  const A = typeof a === 'string' ? POSES[a] : a, B = typeof b === 'string' ? POSES[b] : b, v = (p, q) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
  const arm = (s) => ({ e: v(A[s].e, B[s].e), h: v(A[s].h, B[s].h), g: k < 0.5 ? A[s].g : B[s].g }), leg = (s) => ({ k: v(A[s].k, B[s].k), f: v(A[s].f, B[s].f) });
  return { dy: lerp(A.dy || 0, B.dy || 0, k), lean: lerp(A.lean || 0, B.lean || 0, k), a: arm('a'), b: arm('b'), la: leg('la'), lb: leg('lb') };
}
export const mirror = (P) => ({ dy: P.dy || 0, lean: P.lean || 0, a: P.b, b: P.a, la: P.lb, lb: P.la });
export function walkPose(ph, amp = 1) { const s = Math.sin(ph) * amp, c = Math.cos(ph); return { dy: -Math.abs(c) * 0.07, lean: 0.05, a: { e: [-0.55 - s * 0.2, 2.1], h: [-0.7 - s * 0.6, 2.95 - Math.abs(s) * 0.1], g: 'open' }, b: { e: [0.55 + s * 0.2, 2.1], h: [0.7 + s * 0.6, 2.95], g: 'open' }, la: { k: [-0.2 + s * 0.5, 3.7], f: [-0.45 + s * 0.95, 4.75 - Math.max(0, -c) * 0.4] }, lb: { k: [0.2 - s * 0.5, 3.7], f: [0.45 - s * 0.95, 4.75 - Math.max(0, c) * 0.4] } }; }

const CW = 768, CH = 1024, R0 = 135, HX = 384, HY = 172;
let blob = null;
function blobTex() { if (blob) return blob; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(20,10,40,0.7)'); gr.addColorStop(0.6, 'rgba(20,10,40,0.25)'); gr.addColorStop(1, 'rgba(20,10,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); blob = new THREE.CanvasTexture(c); return blob; }

/** drawn decorations on top of the figure (st.extra = ['glasses', 'headset', 'cap', 'tie', 'lanyard', 'mic', 'phone', 'book', 'pointer']) */
function deco(g, info, st) {
  const R = R0, hx = info.head[0], hy = info.head[1];
  for (const x of st.extra || []) {
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    if (x === 'glasses') { g.strokeStyle = '#111'; g.lineWidth = R * 0.07; for (const s of [-1, 1]) { g.beginPath(); g.arc(hx + s * R * 0.38, hy - R * 0.05, R * 0.27, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(hx - R * 0.11, hy - R * 0.08); g.lineTo(hx + R * 0.11, hy - R * 0.08); g.stroke(); }
    if (x === 'headset') { g.strokeStyle = '#2f78e8'; g.lineWidth = R * 0.12; g.beginPath(); g.arc(hx, hy, R * 1.12, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); g.fillStyle = '#2f78e8'; for (const s of [-1, 1]) { g.beginPath(); g.roundRect(hx + s * R * 1.1 - R * 0.14, hy - R * 0.28, R * 0.28, R * 0.56, R * 0.1); g.fill(); } g.strokeStyle = '#2f78e8'; g.lineWidth = R * 0.06; g.beginPath(); g.moveTo(hx - R * 1.05, hy + R * 0.2); g.quadraticCurveTo(hx - R * 0.9, hy + R * 0.9, hx - R * 0.4, hy + R * 0.78); g.stroke(); g.fillStyle = '#111'; g.beginPath(); g.arc(hx - R * 0.4, hy + R * 0.78, R * 0.09, 0, 7); g.fill(); }
    if (x === 'cap') { g.fillStyle = '#111'; g.beginPath(); g.moveTo(hx - R * 1.1, hy - R * 0.95); g.lineTo(hx, hy - R * 1.3); g.lineTo(hx + R * 1.1, hy - R * 0.95); g.lineTo(hx, hy - R * 0.62); g.closePath(); g.fill(); g.fillRect(hx - R * 0.55, hy - R * 0.95, R * 1.1, R * 0.28); g.strokeStyle = '#ffd43b'; g.lineWidth = R * 0.05; g.beginPath(); g.moveTo(hx + R * 0.9, hy - R * 1.0); g.lineTo(hx + R * 1.05, hy - R * 0.45); g.stroke(); }
    if (x === 'tie') { const ty = hy + R * 1.35; g.fillStyle = '#e8453c'; g.beginPath(); g.moveTo(hx, ty); g.lineTo(hx - R * 0.2, ty + R * 0.25); g.lineTo(hx - R * 0.14, ty + R * 1.0); g.lineTo(hx, ty + R * 1.2); g.lineTo(hx + R * 0.14, ty + R * 1.0); g.lineTo(hx + R * 0.2, ty + R * 0.25); g.closePath(); g.fill(); }
    if (x === 'lanyard') { g.strokeStyle = '#2f78e8'; g.lineWidth = R * 0.07; g.beginPath(); g.moveTo(hx - R * 0.25, hy + R * 1.0); g.lineTo(hx, hy + R * 1.9); g.lineTo(hx + R * 0.25, hy + R * 1.0); g.stroke(); g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = R * 0.05; g.beginPath(); g.roundRect(hx - R * 0.22, hy + R * 1.8, R * 0.44, R * 0.55, R * 0.05); g.fill(); g.stroke(); }
    if (x === 'phone') { const [px, py] = info.b; g.save(); g.translate(px, py - R * 0.4); g.fillStyle = '#222'; g.strokeStyle = '#111'; g.lineWidth = R * 0.04; g.beginPath(); g.roundRect(-R * 0.22, -R * 0.4, R * 0.44, R * 0.8, R * 0.07); g.fill(); g.stroke(); g.fillStyle = '#6dd5ff'; g.fillRect(-R * 0.17, -R * 0.33, R * 0.34, R * 0.62); g.restore(); }
    if (x === 'book') { const [px, py] = info.b; g.save(); g.translate(px, py - R * 0.3); g.fillStyle = '#8a2e2e'; g.strokeStyle = '#111'; g.lineWidth = R * 0.05; g.beginPath(); g.roundRect(-R * 0.4, -R * 0.35, R * 0.8, R * 0.7, R * 0.05); g.fill(); g.stroke(); g.fillStyle = '#ffd43b'; g.fillRect(-R * 0.22, -R * 0.12, R * 0.44, R * 0.08); g.restore(); }
    if (x === 'shades') { g.fillStyle = '#111'; for (const s of [-1, 1]) { g.beginPath(); g.roundRect(hx + s * R * 0.38 - R * 0.3, hy - R * 0.25, R * 0.6, R * 0.34, R * 0.1); g.fill(); } g.fillRect(hx - R * 0.1, hy - R * 0.2, R * 0.2, R * 0.06); }
    if (x === 'cup') { const [px, py] = info.b; g.save(); g.translate(px, py - R * 0.25); g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = R * 0.05; g.beginPath(); g.roundRect(-R * 0.22, -R * 0.28, R * 0.44, R * 0.5, R * 0.06); g.fill(); g.stroke(); g.beginPath(); g.arc(R * 0.28, -R * 0.04, R * 0.12, -1.3, 1.3); g.stroke(); g.fillStyle = '#c96a2c'; g.fillRect(-R * 0.17, -R * 0.22, R * 0.34, R * 0.08); g.restore(); }
    if (x === 'letter') { const [px, py] = info.b; g.save(); g.translate(px, py - R * 0.35); g.rotate(-0.15); g.fillStyle = '#fffdf2'; g.strokeStyle = '#111'; g.lineWidth = R * 0.04; g.beginPath(); g.rect(-R * 0.36, -R * 0.46, R * 0.72, R * 0.92); g.fill(); g.stroke(); g.fillStyle = '#c33'; g.fillRect(-R * 0.26, -R * 0.36, R * 0.52, R * 0.1); g.fillStyle = '#999'; for (let i = 0; i < 4; i++) g.fillRect(-R * 0.26, -R * 0.16 + i * R * 0.13, R * (i % 2 ? 0.36 : 0.52), R * 0.05); g.restore(); }
    if (x === 'box') { const [ax, ay] = info.a, [bx2, by2] = info.b; const cx = (ax + bx2) / 2, cyy = (ay + by2) / 2; g.save(); g.fillStyle = '#c8935a'; g.strokeStyle = '#111'; g.lineWidth = R * 0.05; g.beginPath(); g.rect(cx - R * 0.75, cyy - R * 0.9, R * 1.5, R * 1.1); g.fill(); g.stroke(); g.strokeStyle = '#8a6030'; g.beginPath(); g.moveTo(cx, cyy - R * 0.9); g.lineTo(cx, cyy + R * 0.2); g.stroke(); g.restore(); }
    if (x === 'trench') { g.save(); g.fillStyle = '#6b5a3e'; g.strokeStyle = '#111'; g.lineWidth = R * 0.05; g.beginPath(); g.moveTo(hx - R * 0.55, hy + R * 1.25); g.lineTo(hx + R * 0.55, hy + R * 1.25); g.lineTo(hx + R * 0.75, hy + R * 3.3); g.lineTo(hx - R * 0.75, hy + R * 3.3); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    if (x === 'bag') { const [px, py] = info.b; g.save(); g.translate(px, py + R * 0.55); g.fillStyle = '#d9b56a'; g.strokeStyle = '#111'; g.lineWidth = R * 0.06; g.beginPath(); g.moveTo(-R * 0.2, -R * 0.55); g.bezierCurveTo(-R * 0.95, -R * 0.2, -R * 0.85, R * 0.62, 0, R * 0.62); g.bezierCurveTo(R * 0.85, R * 0.62, R * 0.95, -R * 0.2, R * 0.2, -R * 0.55); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#b8923f'; g.beginPath(); g.ellipse(0, -R * 0.58, R * 0.3, R * 0.1, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#1f7a3e'; g.font = `900 ${R * 0.62}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 0, R * 0.12); g.restore(); }
    if (x === 'ticket') { const [px, py] = info.b; g.save(); g.translate(px + R * 0.2, py - R * 0.25); g.rotate(-0.18); g.fillStyle = '#ffd43b'; g.strokeStyle = '#111'; g.lineWidth = R * 0.05; g.beginPath(); g.roundRect(-R * 0.62, -R * 0.3, R * 1.24, R * 0.6, R * 0.08); g.fill(); g.stroke(); g.setLineDash([R * 0.06, R * 0.05]); g.beginPath(); g.roundRect(-R * 0.52, -R * 0.2, R * 1.04, R * 0.4, R * 0.05); g.stroke(); g.setLineDash([]); g.fillStyle = '#111'; g.font = `900 ${R * 0.2}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('OPTION', 0, R * 0.01); g.restore(); }
    if (x === 'clip') { const [px, py] = info.b; g.save(); g.translate(px + R * 0.1, py - R * 0.35); g.rotate(-0.1); g.fillStyle = '#9a6a3a'; g.strokeStyle = '#111'; g.lineWidth = R * 0.05; g.beginPath(); g.roundRect(-R * 0.42, -R * 0.55, R * 0.84, R * 1.1, R * 0.06); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(-R * 0.34, -R * 0.42, R * 0.68, R * 0.9); g.fillStyle = '#888'; g.fillRect(-R * 0.18, -R * 0.62, R * 0.36, R * 0.14); for (let i = 0; i < 2; i++) { g.strokeStyle = '#2fb86a'; g.lineWidth = R * 0.06; g.beginPath(); g.moveTo(-R * 0.26, -R * 0.2 + i * R * 0.36); g.lineTo(-R * 0.18, -R * 0.12 + i * R * 0.36); g.lineTo(-R * 0.04, -R * 0.3 + i * R * 0.36); g.stroke(); g.fillStyle = '#999'; g.fillRect(R * 0.02, -R * 0.24 + i * R * 0.36, R * 0.26, R * 0.06); } g.restore(); }
    if (x === 'cash') { const [px, py] = info.b; g.save(); g.translate(px, py - R * 0.2); for (let i = -1; i <= 1; i++) { g.save(); g.rotate(i * 0.28); g.fillStyle = '#7cc47f'; g.strokeStyle = '#111'; g.lineWidth = R * 0.04; g.beginPath(); g.rect(-R * 0.18, -R * 0.7, R * 0.36, R * 0.62); g.fill(); g.stroke(); g.fillStyle = '#2f7a3e'; g.font = `900 ${R * 0.24}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 0, -R * 0.39); g.restore(); } g.restore(); }
    if (x === 'bar') { const [px, py] = info.b; g.save(); g.translate(px, py - R * 0.15); g.fillStyle = '#f2c14e'; g.strokeStyle = '#111'; g.lineWidth = R * 0.05; g.beginPath(); g.moveTo(-R * 0.5, R * 0.2); g.lineTo(R * 0.5, R * 0.2); g.lineTo(R * 0.36, -R * 0.2); g.lineTo(-R * 0.36, -R * 0.2); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff2b8'; g.fillRect(-R * 0.26, -R * 0.12, R * 0.3, R * 0.06); g.restore(); }
    if (x === 'pointer') { const [px, py] = info.b; g.strokeStyle = '#c9a13b'; g.lineWidth = R * 0.07; g.beginPath(); g.moveTo(px, py); g.lineTo(px + R * 1.8, py - R * 0.9); g.stroke(); }
    g.restore();
  }
}

export class StickToon {
  /** look: { hoodie, hair:'bob', bow } · height = metres from feet to top of head */
  constructor(look = {}, { height = 1.7, res = 2, castShadow = true } = {}) {
    this.look = look; this.res = res; this.canvas = document.createElement('canvas'); this.canvas.width = CW * res; this.canvas.height = CH * res; this.g = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4; this.tex.generateMipmaps = false; this.tex.minFilter = THREE.LinearFilter;
    const feetPx = HY + 4.9 * R0 + 40, topPx = HY - R0, k = height / (feetPx - topPx), Hh = CH * k, Ww = CW * k;
    const geo = new THREE.PlaneGeometry(Ww, Hh); geo.translate(0, Hh / 2 - (CH - feetPx) * k, 0);
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, toneMapped: false });
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.castShadow = castShadow;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.tex, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(Ww * 0.8, Ww * 0.28), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.6 }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.position.y = 0.01;
    this.group = new THREE.Group(); this.pivot = new THREE.Group(); this.pivot.add(this.mesh); this.group.add(this.pivot, this.blob); this.key = ''; this.k = k;
  }
  /** st: { pose (name|object), expr, look:[x,y], flip, tilt, extra:[...] }  (redraws only when the state changes) */
  set(st = {}) {
    const key = JSON.stringify(st, (kk, v) => (typeof v === 'number' ? Math.round(v * 120) / 120 : v)); if (key === this.key) return this; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.canvas.width, this.canvas.height); g.scale(this.res, this.res);
    const info = stickman(g, { ...this.look, x: HX, y: HY, R: R0, pose: st.pose || 'standing', expr: st.expr || 'happy', look: st.look, flip: st.flip, tilt: st.tilt });
    deco(g, info, st); this.hands = info; this.tex.needsUpdate = true; return this;
  }
  face(cam) { const p = new THREE.Vector3(); this.group.getWorldPosition(p); this.pivot.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z) - this.group.rotation.y; return this; }
  at(x, y, z) { this.group.position.set(x, y, z); return this; }
}
