// CASH OR STOCK? (Anthropic IPO): Leo + Mia in 3D sets — job-offer room (cash vs stock pedestals), stock-market hall with a
// price board + confetti, office floor with a growing coin mountain, option price signs, seven co-founder coin towers at dusk,
// a vault with 10 gold bars (1 free, 9 caged), a sloped San Francisco street, back to the offer room.
import * as THREE from 'three';
import { ctx, clamp, lerp, eo, eio, eob, rnd } from './core/lib.js';
import { L, Le, Wd } from './core/timing.js';
import { camera } from './core/engine.js';
import * as WD from './core/world.js';
import { V3, INK, YEL, GRN, RED, BLU, loadViews, backdrop, bx, cy, sp, canvasPlane, sign, lights, tree, lamp, desk, laptop, plant, room, LEO, MIA, person, act, pill, outText, stamp, step, check, director } from './kit.js';

const W_ = (w, l, fb = 0.3) => { try { return Wd(w, l); } catch (e) { return L(l) + fb; } };
export async function loadAssets() { loadViews(['day', 'dusk']); }

const GOLD = () => new THREE.MeshStandardMaterial({ color: '#f3c044', metalness: 0.8, roughness: 0.3 });
const note = (txt, x, y, size = 30) => { ctx.save(); ctx.font = `800 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(txt, x, y); ctx.fillStyle = '#fff'; ctx.fillText(txt, x, y); ctx.restore(); };

/** a crowd of cut-out figures sharing ONE texture (cheap): returns { face(cam), bob(t, amp) } for the director's people list */
function crowd(scene, look, spots, { h = 1.6, pose = 'standing', expr = 'happy', extra, tint = '#e4e6f0' } = {}) {
  const tk = person(look, h, 1); tk.set({ pose, expr, extra }); tk.mat.color.set(tint);
  const gs = spots.map(([x, y, z], i) => { const g = new THREE.Group(); g.position.set(x, y, z); const m = new THREE.Mesh(tk.mesh.geometry, tk.mat); g.add(m); g.userData.y0 = y; g.userData.i = i; scene.add(g); return g; });
  return { tk, gs, face(cam) { gs.forEach((g) => { g.rotation.y = Math.atan2(cam.position.x - g.position.x, cam.position.z - g.position.z); }); }, bob(t, amp = 0) { gs.forEach((g) => { g.position.y = g.userData.y0 + Math.abs(Math.sin(t * 7 + g.userData.i * 1.7)) * amp; }); } };
}
/** confetti that bursts at t0 (pure function of t) */
function confetti(scene, n = 240, { x = [-3.5, 3.5], z = [-5, 1], top = 7 } = {}) {
  const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.07, 0.045), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), n); const cols = ['#FFD43B', '#2fb86a', '#2f78e8', '#e8453c', '#ffffff', '#F2619C'];
  for (let i = 0; i < n; i++) m.setColorAt(i, new THREE.Color(cols[i % cols.length])); m.frustumCulled = false; scene.add(m); const d = new THREE.Object3D();
  return (t, t0) => { const lt = t - t0; m.visible = lt > 0; if (lt <= 0) return; for (let i = 0; i < n; i++) { const sp = 0.7 + rnd(i) * 0.9, y = top + rnd(i + 3) * 2.5 - lt * sp * 1.6; d.position.set(lerp(x[0], x[1], rnd(i + 7)) + Math.sin(lt * 2 + i) * 0.25, ((y % 9) + 9) % 9 - 0.5, lerp(z[0], z[1], rnd(i + 11))); d.rotation.set(lt * 5 * rnd(i + 1), lt * 4 * rnd(i + 2), lt * 3); d.updateMatrix(); m.setMatrixAt(i, d.matrix); } m.instanceMatrix.needsUpdate = true; };
}
/** a coin (gold cylinder) InstancedMesh; place(fn(i, dummy) -> visible) */
function coins(scene, n, r = 0.09, h = 0.026) { const m = new THREE.InstancedMesh(new THREE.CylinderGeometry(r, r, h, 20), GOLD(), n); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return m; }
const D0 = new THREE.Object3D();

export function buildShots(E) {
  const D = director(E, camera), add = D.add, CUES = [], cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const Ls = (i) => L(i) - 0.03;

  // ── A. job-offer room: cash pedestal vs stock pedestal ──
  const AR = room({ wall: '#e9dfcf', floor: '#a7825c', w: 9, depth: 5, h: 3.6, view: 'day', winX: 2.7 }); const AS = AR.scene; AS.environment = E.envMap; AS.environmentIntensity = 0.35;
  lights(AS, { keyI: 2.3, keyPos: [2.5, 6, 4], hemi: 1.35, pink: 3, blue: 3 });
  const art = canvasPlane(1.3, 0.85, 500); art.position.set(-1.6, 2.2, -4.88); AS.add(art); bx(1.42, 0.97, 0.05, '#5a4030', -1.6, 2.2, -4.92, AS); art.draw((g, W, H) => { g.fillStyle = '#bfe0f2'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(W * 0.75, H * 0.3, H * 0.13, 0, 7); g.fill(); g.fillStyle = '#5fa36a'; g.beginPath(); g.moveTo(0, H); g.lineTo(W * 0.35, H * 0.35); g.lineTo(W * 0.6, H * 0.7); g.lineTo(W * 0.8, H * 0.5); g.lineTo(W, H * 0.8); g.lineTo(W, H); g.fill(); });
  const pl1 = plant(); pl1.position.set(-2.6, 0, -4.3); AS.add(pl1);
  [-0.95, 0.95].forEach((x) => { cy(0.4, 0.44, 1.0, '#f4efe6', x, 0.5, -2.6, AS, 28); cy(0.46, 0.46, 0.05, '#d8cdb8', x, 1.02, -2.6, AS, 28); });
  for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) for (let l = 0; l < 4; l++) { const x = -0.95 + (c - 1) * 0.2, z = -2.6 + (r - 0.5) * 0.32, y = 1.08 + l * 0.075; bx(0.18, 0.07, 0.3, '#79c27c', x, y, z, AS); bx(0.185, 0.072, 0.06, '#f4f1e6', x, y, z, AS); }
  const barsS = [0.18, 0.3, 0.44, 0.62].map((h, i) => bx(0.13, h, 0.13, ['#2f78e8', '#3d93e0', '#2fb86a', '#22a35a'][i], 0.95 - 0.27 + i * 0.18, 1.05 + h / 2, -2.55, AS));
  const arrow = new THREE.Group(); bx(0.05, 0.62, 0.05, '#e8453c', 0, 0.31, 0, arrow); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 14), WD.mat({ color: '#e8453c' })); cone.position.y = 0.68; arrow.add(cone); arrow.rotation.z = -0.65; arrow.position.set(0.72, 1.25, -2.4); AS.add(arrow);
  const cert = canvasPlane(0.62, 0.44, 900); cert.position.set(0.95, 1.5, -2.85); AS.add(cert);
  cert.draw((g, W, H) => { g.fillStyle = '#fbf6e6'; g.fillRect(0, 0, W, H); g.strokeStyle = '#2f5a8c'; g.lineWidth = 16; g.strokeRect(14, 14, W - 28, H - 28); g.lineWidth = 4; g.strokeRect(36, 36, W - 72, H - 72); g.fillStyle = '#2f5a8c'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${H * 0.2}px Inter`; g.fillText('STOCK', W / 2, H * 0.42); g.font = `800 ${H * 0.08}px Inter`; g.fillText('COMPANY SHARES', W / 2, H * 0.64); g.fillStyle = '#c99a2e'; g.beginPath(); g.arc(W * 0.82, H * 0.76, H * 0.09, 0, 7); g.fill(); });
  const ps1 = new THREE.PointLight('#fff0cf', 3, 4, 1.5); ps1.position.set(-0.95, 2.4, -2.2); const ps2 = ps1.clone(); ps2.position.x = 0.95; AS.add(ps1, ps2);
  const leoA = person(LEO); AS.add(leoA.group);

  // ── B. stock-market hall: tall price board, crowd, confetti ──
  const MS = new THREE.Scene(); MS.background = new THREE.Color('#0c1330');
  bx(40, 0.05, 30, '#1a2140', 0, 0, -4, MS); bx(24, 12, 0.2, '#111a38', 0, 6, -7.2, MS);
  [-3.4, 3.4].forEach((x) => { bx(0.5, 9, 0.5, '#1c2650', x, 4.5, -6.6, MS); const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 8.6, 0.08), new THREE.MeshBasicMaterial({ color: '#4f8dff', toneMapped: false })); strip.position.set(x + (x < 0 ? 0.3 : -0.3), 4.5, -6.3); MS.add(strip); });
  const board = canvasPlane(4.2, 4.8, 330); board.position.set(0, 3.9, -6.95); MS.add(board); bx(4.45, 5.05, 0.12, '#0a0f22', 0, 3.9, -7.05, MS);
  lights(MS, { keyI: 1.5, keyPos: [2, 8, 6], hemi: 0.8, sky: '#8fb0ff', ground: '#20263a', pink: 9, blue: 9, box: 10 });
  const spotsB = []; for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) spotsB.push([-2.7 + i * 0.9 + (r % 2) * 0.45 + (rnd(i + r * 9) - 0.5) * 0.2, 0, -4.4 + r * 0.95]);
  const crowdB1 = crowd(MS, LEO, spotsB.filter((_, i) => i % 2 === 0), { pose: 'jumping', expr: 'happy', tint: '#cfd6ff' }), crowdB2 = crowd(MS, MIA, spotsB.filter((_, i) => i % 2 === 1), { h: 1.5, pose: 'wave', expr: 'happy', tint: '#ffd6ea' });
  const conf = confetti(MS, 260, { x: [-3.4, 3.4], z: [-5.2, 1.5], top: 7.5 }); const leoB = person(LEO); MS.add(leoB.group);
  let boardKey = '';
  const drawBoard = (t, tPrice) => { const k = clamp((t - tPrice) / 0.6), key = Math.floor(t * 12) + ':' + (k > 0); if (key === boardKey) return; boardKey = key;
    board.draw((g, W, H) => { g.fillStyle = '#071029'; g.fillRect(0, 0, W, H); g.fillStyle = '#0f1d45'; g.fillRect(0, 0, W, H * 0.12); g.fillStyle = '#8fb0ff'; g.font = `900 ${H * 0.05}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NEW ON THE STOCK MARKET', W / 2, H * 0.06);
      g.fillStyle = '#ffffff'; g.font = `900 ${H * 0.1}px Inter`; g.fillText('ANTHROPIC', W / 2, H * 0.22); g.fillStyle = '#9aa6c8'; g.font = `800 ${H * 0.045}px Inter`; g.fillText('TICKER: ANT', W / 2, H * 0.3);
      g.fillStyle = k > 0 ? '#3ee08a' : '#3a4670'; g.font = `900 ${H * 0.17}px Inter`; g.fillText(k > 0 ? '$83' : '$ --', W / 2, H * 0.45); g.fillStyle = '#9aa6c8'; g.font = `800 ${H * 0.04}px Inter`; g.fillText('PUBLIC PRICE PER SHARE', W / 2, H * 0.55);
      // a simple rising line (illustration)
      g.strokeStyle = '#3ee08a'; g.lineWidth = 10; g.lineJoin = 'round'; g.beginPath(); const n = 40, prog = clamp((t - tPrice + 0.8) / 2.2); for (let i = 0; i <= n * prog; i++) { const x = W * 0.1 + (W * 0.8) * i / n, y = H * 0.86 - (i / n) * H * 0.16 - Math.sin(i * 1.3) * H * 0.02; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.fillStyle = '#0f1d45'; g.fillRect(0, H * 0.93, W, H * 0.07); g.fillStyle = '#FFD43B'; g.font = `900 ${H * 0.035}px Inter`; const tick = 'ANTHROPIC  ·  $83 A SHARE  ·  NOV 19, 2026  ·  '; const tw = g.measureText(tick).width, off = -((t * 220) % tw); g.textAlign = 'left'; for (let x = off; x < W; x += tw) g.fillText(tick, x, H * 0.965); }); };

  // ── C. office floor with a coin mountain ──
  const OR = room({ wall: '#dfe4ec', floor: '#9b8a76', w: 12, depth: 7, h: 3.8, view: 'day', winX: 3.6 }); const OS = OR.scene; OS.environment = E.envMap; OS.environmentIntensity = 0.5;
  lights(OS, { keyI: 2.4, keyPos: [3, 7, 5], hemi: 1.3, box: 10, pink: 3, blue: 4 });
  const spotsC = []; [-5.9, -4.7].forEach((z, r) => { for (let i = 0; i < 6; i++) { const x = -4.2 + i * 1.65 + r * 0.5; const dk = desk(1.2, '#c99a66'); dk.position.set(x, 0, z); OS.add(dk); const lp = laptop(1.0); lp.position.set(x, 0.79, z - 0.05); lp.rotation.y = Math.PI; OS.add(lp); spotsC.push([x + 0.05, 0, z - 0.62]); } });
  const crowdC1 = crowd(OS, LEO, spotsC.filter((_, i) => i % 2 === 0), { pose: 'wave', tint: '#e8ecf6' }), crowdC2 = crowd(OS, MIA, spotsC.filter((_, i) => i % 2 === 1), { h: 1.5, pose: 'standing', tint: '#ffe3ef' });
  const NC = 900, pile = coins(OS, NC); const pileP = []; for (let i = 0; i < NC; i++) { const r = Math.sqrt(rnd(i)) * 1.35, a = rnd(i + 5) * 6.283, y = Math.max(0, 1.15 * (1 - r / 1.35)) * (0.75 + 0.25 * rnd(i + 9)); pileP.push({ x: Math.cos(a) * r, z: -2.6 + Math.sin(a) * r * 0.85, y, rx: (rnd(i + 2) - 0.5) * 1.2, rz: (rnd(i + 4) - 0.5) * 1.2 }); } 
  const growPile = (k) => { const n = Math.max(1, Math.floor(NC * clamp(k * 1.3))), rs = 0.35 + 0.65 * eo(k), hs = eo(k); for (let i = 0; i < n; i++) { const p = pileP[i]; D0.position.set(p.x * rs, p.y * hs + 0.013, -2.6 + (p.z + 2.6) * rs); D0.rotation.set(p.rx, 0, p.rz); D0.updateMatrix(); pile.setMatrixAt(i, D0.matrix); } pile.count = n; pile.instanceMatrix.needsUpdate = true; };
  const leoC = person(LEO), miaC = person(MIA, 1.6); OS.add(leoC.group, miaC.group);

  // ── D. option price signs (studio) ──
  const PS = new THREE.Scene(); PS.background = new THREE.Color('#1b2142'); PS.environment = E.envMap; PS.environmentIntensity = 0.3;
  bx(30, 0.05, 30, '#262d55', 0, 0, -3, PS); bx(20, 8, 0.2, '#20264a', 0, 4, -5.2, PS);
  lights(PS, { keyI: 2.1, keyPos: [1.5, 6, 5], hemi: 1.0, sky: '#c9d4ff', ground: '#2a2f50', pink: 7, blue: 7 });
  const signL = canvasPlane(1.08, 1.0, 800), signR = canvasPlane(1.08, 1.0, 800); [[signL, -0.64], [signR, 0.64]].forEach(([s, x]) => { s.position.set(x, 1.75, -2.6); PS.add(s); bx(1.16, 1.08, 0.06, '#0d1230', x, 1.75, -2.65, PS); cy(0.04, 0.04, 1.25, '#9aa3ad', x, 0.62, -2.66, PS, 10); cy(0.22, 0.25, 0.05, '#9aa3ad', x, 0.03, -2.66, PS, 18); });
  const drawSign = (s, top, price, col, on, sub) => s.draw((g, W, H) => { g.fillStyle = on ? col : '#3a4166'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, W, H * 0.24); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${H * 0.11}px Inter`; g.fillText(top, W / 2, H * 0.12); g.font = `900 ${H * 0.34}px Inter`; g.fillText(on ? price : '?', W / 2, H * 0.56); g.font = `800 ${H * 0.07}px Inter`; g.fillText(sub, W / 2, H * 0.86); });
  const leoP = person(LEO); PS.add(leoP.group);
  const sp1 = new THREE.SpotLight('#fff3d6', 30, 9, 0.5, 0.6, 1.5); sp1.position.set(0, 4.5, 0.5); sp1.target.position.set(0, 1.6, -2.6); PS.add(sp1, sp1.target);

  // ── E. seven co-founder coin towers at dusk ──
  const TS = new THREE.Scene(); TS.background = new THREE.Color('#2a2440'); backdrop(TS, 'dusk', { z: -24, w: 56, h: 30, y: 10, tint: 0.9 }); TS.environment = E.envMap; TS.environmentIntensity = 0.45;
  bx(80, 0.05, 50, '#5c5270', 0, 0, -10, TS); bx(14, 0.06, 9, '#8a7f9a', 0, 0.03, -3, TS);
  lights(TS, { key: '#ffd2a8', keyI: 2.6, keyPos: [-5, 7, 6], hemi: 1.0, sky: '#ffc9a0', ground: '#4a3f60', box: 10, pink: 6 });
  const TX = [-2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7], TZ = TX.map((x) => -4.6 + Math.abs(x) * 0.28), PER = 110, towers = coins(TS, PER * 7, 0.3, 0.05);
  const growTowers = (k) => { let n = 0; TX.forEach((x, j) => { const kk = clamp(k * 1.4 - j * 0.06), m = Math.max(1, Math.floor(PER * eo(kk))); for (let i = 0; i < m; i++) { D0.position.set(x + Math.sin(i * 2.1 + j) * 0.012, 0.025 + i * 0.05, TZ[j] + Math.cos(i * 1.7) * 0.012); D0.rotation.set(0, i, 0); D0.updateMatrix(); towers.setMatrixAt(n++, D0.matrix); } }); towers.count = n; towers.instanceMatrix.needsUpdate = true; };
  const topG = crowd(TS, LEO, TX.map((x, j) => [x, 0, TZ[j]]), { h: 0.9, pose: 'wave', expr: 'smug', tint: '#ffffff' });
  const small = coins(TS, 220, 0.12, 0.035); { let n = 0; for (let s = 0; s < 34; s++) { const x = (rnd(s) - 0.5) * 7, z = -2.2 + rnd(s + 4) * 1.6, h = 2 + Math.floor(rnd(s + 8) * 5); for (let i = 0; i < h && n < 220; i++) { D0.position.set(x, 0.02 + i * 0.035, z); D0.rotation.set(0, i, 0); D0.updateMatrix(); small.setMatrixAt(n++, D0.matrix); } } small.count = n; }
  const leoT = person(LEO), miaT = person(MIA, 1.6); TS.add(leoT.group, miaT.group);

  // ── F. vault: 10 gold bars, 9 behind a cage ──
  const VR = room({ wall: '#4d5366', floor: '#6f6a66', w: 9, depth: 5, h: 3.6, view: null }); const VS = VR.scene; VS.environment = E.envMap; VS.environmentIntensity = 0.6;
  lights(VS, { keyI: 2.2, keyPos: [2, 6, 4], hemi: 1.1, sky: '#dfe6ff', ground: '#3a3a44', blue: 5 });
  const door = cy(1.3, 1.3, 0.3, null, 0.6, 1.75, -4.78, VS, 48, { mat: new THREE.MeshStandardMaterial({ color: '#a9b2bd', metalness: 0.85, roughness: 0.35 }) }); door.rotation.x = Math.PI / 2;
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 12, 40), new THREE.MeshStandardMaterial({ color: '#d0d6de', metalness: 0.9, roughness: 0.25 })); wheel.position.set(0.6, 1.75, -4.58); VS.add(wheel); for (let i = 0; i < 3; i++) { const s = bx(0.86, 0.05, 0.05, null, 0.6, 1.75, -4.58, VS, { mat: wheel.material }); s.rotation.z = i * Math.PI / 3; }
  bx(2.1, 0.8, 1.1, '#3a3f4f', 0, 0.4, -2.6, VS); const barM = GOLD(), bars = [bx(0.22, 0.12, 0.42, null, -0.72, 0.86, -2.45, VS, { mat: GOLD() })];
  [[4, 0.86], [3, 0.98], [2, 1.1]].forEach(([n, y]) => { for (let i = 0; i < n; i++) bars.push(bx(0.22, 0.12, 0.42, null, 0.18 + (i - (n - 1) / 2) * 0.25, y, -2.62, VS, { mat: barM })); });
  const cageM = new THREE.MeshStandardMaterial({ color: '#2a2d36', metalness: 0.7, roughness: 0.4 }); for (let x = -0.42; x <= 0.79; x += 0.075) cy(0.011, 0.011, 0.6, null, x, 1.1, -2.34, VS, 6, { mat: cageM }); [0.81, 1.4].forEach((y) => bx(1.24, 0.035, 0.035, null, 0.185, y, -2.34, VS, { mat: cageM })); [-0.42, 0.79].forEach((x) => bx(0.035, 0.6, 0.6, null, x, 1.1, -2.62, VS, { mat: cageM })); bx(1.24, 0.03, 0.6, null, 0.185, 1.4, -2.62, VS, { mat: cageM });
  const lock = new THREE.Group(); bx(0.3, 0.26, 0.1, null, 0, 0, 0, lock, { mat: new THREE.MeshStandardMaterial({ color: '#d9a520', metalness: 0.8, roughness: 0.3 }) }); const shk = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 10, 24, Math.PI), cageM); shk.position.y = 0.13; lock.add(shk); lock.position.set(0.185, 1.05, -2.27); VS.add(lock);
  const miaV = person(MIA, 1.6), leoV = person(LEO); VS.add(miaV.group, leoV.group);

  // ── G. sloped San Francisco street with painted houses ──
  const SS = new THREE.Scene(); SS.background = new THREE.Color('#bcd3ea'); backdrop(SS, 'day', { z: -24, w: 56, h: 30, y: 10, tint: 0.95 });
  const SL = 0.16, gy = (x) => x * SL; const slopeG = new THREE.Group(); slopeG.rotation.z = Math.atan(SL); SS.add(slopeG);
  bx(60, 0.05, 40, '#7d8a6a', 0, -0.05, -24, slopeG); bx(60, 0.06, 2.6, '#c9c2b8', 0, 0.03, -2.6, slopeG); bx(60, 0.06, 6, '#454852', 0, 0.02, 1.6, slopeG); for (let x = -30; x < 30; x += 2.4) bx(1.2, 0.065, 0.12, '#f4f4f4', x, 0.03, 1.6, slopeG);
  const PAINT = [['#f2b5c8', '#7a4a8a'], ['#a9d8e8', '#2f5a8c'], ['#f6e3a1', '#2f7a4f'], ['#c7e3b8', '#c22b2b'], ['#f0c7a0', '#1f4e8c'], ['#d8c4ee', '#d9a520'], ['#f7d2d2', '#2f5a8c']];
  PAINT.forEach(([wall, trim], i) => { const x = -6.6 + i * 2.2, g = new THREE.Group(); g.position.set(x, gy(x) - 0.6, -5.2); SS.add(g); bx(2.15, 4.4, 3.2, wall, 0, 2.2, 0, g);
    const sh = new THREE.Shape(); sh.moveTo(-1.15, 0); sh.lineTo(0, 1.0); sh.lineTo(1.15, 0); sh.closePath(); const gb = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false }), WD.mat({ color: trim })); gb.position.set(0, 4.4, 1.3); gb.castShadow = true; g.add(gb); bx(2.25, 0.16, 3.3, '#ffffff', 0, 4.42, 0, g);
    bx(1.0, 2.0, 0.5, wall, 0.45, 2.9, 1.75, g); const win = new THREE.MeshStandardMaterial({ color: '#cfe3f2', emissive: '#ffd99a', emissiveIntensity: 0.3 }); [[0.45, 2.9, 2.01], [-0.55, 3.2, 1.61]].forEach(([wx, wy, wz]) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.95), win); w.position.set(wx, wy, wz); g.add(w); bx(0.74, 0.08, 0.1, '#ffffff', wx, wy - 0.52, wz + 0.02, g); bx(0.74, 0.08, 0.1, '#ffffff', wx, wy + 0.52, wz + 0.02, g); });
    bx(0.7, 1.5, 0.08, trim, -0.55, 1.35, 1.62, g); [0, 1, 2].forEach((s) => bx(1.0, 0.2, 0.35, '#e9e2d6', -0.55, 0.1 + s * 0.2, 2.2 - s * 0.3, g)); bx(2.3, 0.12, 0.12, '#ffffff', 0, 1.95, 1.62, g); });
  [[-4.5, -2.3], [4.2, -2.4]].forEach(([x, z]) => { const t = tree(0.85, '#4f8a4a'); t.position.set(x, gy(x), z); SS.add(t); }); const lpS = lamp(3.4); lpS.position.set(1.8, gy(1.8), -1.6); SS.add(lpS);
  const fs = new THREE.Group(); bx(0.06, 1.3, 0.06, '#ffffff', 0, 0.65, 0, fs); bx(0.7, 0.06, 0.06, '#ffffff', 0.32, 1.26, 0, fs); const fsS = sign('FOR SALE', { w: 0.62, h: 0.4, bg: '#c22b2b', fg: '#ffffff' }); fsS.position.set(0.36, 0.98, 0.0); fs.add(fsS); fs.position.set(-1.4, gy(-1.4), -3.2); SS.add(fs);
  lights(SS, { key: '#fff3e2', keyI: 2.5, keyPos: [-6, 9, 7], hemi: 1.45, sky: '#e3edf7', ground: '#6d6a60', box: 12 });
  const leoS = person(LEO), miaS = person(MIA, 1.6); SS.add(leoS.group, miaS.group);

  // ════════════ shots ════════════
  const tPrice = W_('eighty', 2);
  // 0 · hook: open ON the Anthropic board, crane down to the cheering crowd
  const tAI = W_('AI', 0), tThou = W_('thousands', 0), tMill = W_('millionaires', 0);
  add({ id: 'hook-board', at: 0, scene: MS, people: [crowdB1, crowdB2], tr: 'cut', cam: { from: [0.1, 5.1, 2.8], to: [-0.3, 3.2, 4.4], look: [0, 5.15, -6.95], look2: [0, 3.6, -6], fov: 40, fov2: 42 }, dof: 0.0004, grade: { bloom: 0.26 },
    update: (t) => { drawBoard(t, tPrice); conf(t, 0.25); crowdB1.bob(t, 0.2); crowdB2.bob(t, 0.16); },
    over: (lt, d, t) => { pill('AI COMPANY', 540, 1200, BLU, '#fff', 62, eob(clamp((t - tAI) / 0.3)), -0.03); } });
  add({ id: 'market-low', at: tThou - 0.08, scene: MS, people: [leoB, crowdB1, crowdB2], tr: 'whip', cam: { from: [-2.0, 0.45, 7.0], to: [-1.1, 0.65, 5.8], look: [0, 2.8, -5], look2: [0, 3.2, -6], fov: 44, fov2: 41 }, dof: 0.0008, grade: { bloom: 0.26 },
    update: (t) => { leoB.at(-0.5, 0, 1.6); act(leoB, t, [{ t: 0, pose: 'jumping', expr: 'surprised' }, { t: tMill, pose: 'thumbsUp', expr: 'grin' }], 0.2, { hop: true }); drawBoard(t, tPrice); conf(t, 0.25); crowdB1.bob(t, 0.22); crowdB2.bob(t, 0.18); },
    over: (lt, d, t) => { pill('THOUSANDS OF WORKERS', 540, 300, '#fff', INK, 56, eob(clamp((t - tThou) / 0.3)), -0.03); stamp('MILLIONAIRES', 540, 470, 112, GRN, 0.04, (t - tMill) / 0.4); } });
  cue(0.15, 'sparkle', { gain: 0.5, dur: 1.4 }); cue(tAI, 'pop', { gain: 0.5 }); cue(tThou, 'whoosh', { gain: 0.5 }); cue(tMill, 'slam', { gain: 0.8 });

  // 1 · options: part of their pay, the right to buy at ~$3
  const tHow = W_('how', 1), tPay = W_('pay', 1), tRight = W_('right', 1), tThree = W_('three', 1);
  const sL = (t) => drawSign(signL, "WORKERS' PRICE", '$2.91', '#1f9a58', t > tThree, 'average option price'), sR = (t) => drawSign(signR, 'PUBLIC PRICE', '$83', '#c99a2e', t > tPrice + 0.1, 'per share');
  add({ id: 'options-dolly', at: Ls(1), scene: PS, people: [leoP], tr: 'flash', cam: { from: [-2.2, 1.6, 3.6], to: [-1.7, 1.55, 2.7], look: [-0.95, 1.45, -2.6], fov: 36 }, dof: 0.0015,
    update: (t) => { leoP.group.visible = true; leoP.at(-1.45, 0, -2.1); act(leoP, t, [{ t: 0, pose: 'shrug', expr: 'thinking' }, { t: tPay, pose: 'thumbsUp', expr: 'smug', extra: ['ticket'] }], 0.3); sL(t); sR(t); },
    over: (lt, d, t) => { outText("HERE'S HOW", 540, 300, 96, '#fff', -0.03, eob(clamp((t - tHow) / 0.3))); pill('PART OF THEIR PAY', 540, 440, YEL, INK, 60, eob(clamp((t - tPay) / 0.3)), 0.02); } });
  add({ id: 'sign-close', at: tRight - 0.1, scene: PS, people: [leoP], tr: 'cut', cam: { from: [-1.2, 1.7, 2.5], to: [-0.9, 1.72, 1.7], look: [-0.64, 1.62, -2.6], fov: 34 }, dof: 0.0012,
    update: (t) => { leoP.group.visible = true; leoP.at(-1.45, 0, -2.1); act(leoP, t, [{ t: 0, pose: 'pointing', expr: 'happy', extra: ['ticket'] }, { t: tThree, pose: 'thumbsUp', expr: 'grin', extra: ['ticket'] }], 0.3); sL(t); sR(t); },
    over: (lt, d, t) => { if (t < tThree) pill('THE RIGHT TO BUY SHARES', 540, 300, '#fff', INK, 52, eob(clamp((t - tRight) / 0.3)), -0.02); stamp('ABOUT $3 EACH', 540, 320, 96, GRN, 0.04, (t - tThree) / 0.4); note('Average option price $2.91 · SEC filing via CNBC', 540, 1760, 30); } });
  cue(Ls(1), 'whoosh', { gain: 0.5 }); cue(tPay, 'pop', { gain: 0.6 }); cue(tRight, 'pop', { gain: 0.5 }); cue(tThree, 'slam', { gain: 0.7 });

  // 2 · the public price: $83
  const tWeek = W_('week', 2), tPub = W_('public', 2);
  add({ id: 'board-push', at: Ls(2), scene: MS, people: [crowdB1, crowdB2], tr: 'whip', cam: { from: [0.5, 2.4, 3.6], to: [0.15, 3.2, 1.6], look: [0, 3.7, -6.95], fov: 40, fov2: 36 }, dof: 0.0005, grade: { bloom: 0.26 },
    update: (t) => { drawBoard(t, tPrice); conf(t, tPrice); crowdB1.bob(t, t > tPrice ? 0.22 : 0.03); crowdB2.bob(t, t > tPrice ? 0.18 : 0.03); },
    over: (lt, d, t) => { pill('THIS WEEK', 540, 1180, '#fff', INK, 56, eob(clamp((t - tWeek) / 0.3)), -0.03); if (t < tPrice) pill('OPEN TO THE PUBLIC', 540, 1300, YEL, INK, 50, eob(clamp((t - tPub) / 0.3)), 0.02); stamp('$83 A SHARE', 540, 1240, 116, GRN, -0.05, (t - tPrice) / 0.4); } });
  cue(Ls(2), 'whoosh', { gain: 0.5 }); cue(tWeek, 'pop', { gain: 0.5 }); cue(tPub, 'pop', { gain: 0.5 }); cue(tPrice, 'slam', { gain: 0.8 }); cue(tPrice + 0.05, 'sparkle', { gain: 0.6, dur: 1.3 });

  // 3 · about 28x more
  const t28 = W_('twenty', 3);
  add({ id: 'options-reveal', at: Ls(3), scene: PS, people: [leoP], tr: 'flash', cam: { from: [0.0, 1.7, 3.9], to: [0.0, 1.68, 3.35], look: [0, 1.6, -2.6], fov: 40 }, dof: 0.0008,
    update: (t) => { leoP.group.visible = false; sL(t); sR(t); },
    over: (lt, d, t) => { stamp('≈ 28x MORE', 540, 360, 130, RED, -0.06, (t - t28) / 0.4); note('Average option price $2.91 · SEC filing via CNBC', 540, 1760, 30); } });
  cue(Ls(3), 'whoosh', { gain: 0.5 }); cue(t28, 'slam', { gain: 0.8 });

  // 4 · on average ~$44M each
  const tAvg = W_('average', 4), tForty = W_('forty', 4), tStock4 = W_('stock', 4);
  add({ id: 'office-crane', at: Ls(4), scene: OS, people: [crowdC1, crowdC2, leoC, miaC], tr: 'whip', cam: { from: [0.2, 6.2, 6.4], to: [0, 2.7, 4.2], look: [0, 0.5, -2.8], look2: [0, 0.9, -2.7], fov: 44, fov2: 39 }, dof: 0.0006, grade: { bloom: 0.2 },
    update: (t) => { growPile(clamp((t - Ls(4)) / (tForty - Ls(4) + 0.2))); crowdC1.bob(t, 0.06); crowdC2.bob(t, 0.05); leoC.group.visible = miaC.group.visible = false; },
    over: (lt, d, t) => { pill('EACH WORKER', 540, 300, '#fff', INK, 60, eob(clamp((lt - 0.15) / 0.3)), -0.03); pill('ON AVERAGE', 540, 440, YEL, INK, 60, eob(clamp((t - tAvg) / 0.3)), 0.03); } });
  add({ id: 'leo-bag', at: tForty - 0.08, scene: OS, people: [leoC, miaC], tr: 'cut', cam: { from: [0.6, 1.55, 2.6], to: [0.53, 1.45, 1.8], look: [0.5, 1.2, -1.3], fov: 38 }, dof: 0.0016, grade: { bloom: 0.2 },
    update: (t) => { growPile(1); leoC.group.visible = miaC.group.visible = true; leoC.at(0.8, 0, -0.95); miaC.at(0.2, 0, -1.6); act(leoC, t, [{ t: 0, pose: 'thumbsUp', expr: 'grin', extra: ['bag'] }], 0.3, { hop: true }); act(miaC, t, [{ t: 0, pose: 'standing', expr: 'surprised', extra: ['cash'] }], 1.3, { flip: true }); },
    over: (lt, d, t) => { stamp('$44 MILLION', 540, 340, 116, GRN, -0.05, (t - tForty) / 0.4); if (t > tStock4 - 0.1) note('average, in stock, at the $83 price', 540, 460, 40); } });
  cue(Ls(4), 'whoosh', { gain: 0.5 }); cue(tAvg, 'pop', { gain: 0.5 }); cue(tForty, 'slam', { gain: 0.8 }); cue(tForty + 0.1, 'sparkle', { gain: 0.5, dur: 1.0 });

  // 5 · the seven founders: ~$20B each
  const tSeven = W_('seven', 5), tTw = W_('twenty', 5);
  const towerUpd = (t) => { const k = clamp((t - tSeven + 0.1) / 1.0); growTowers(k); topG.gs.forEach((g, j) => { const kk = clamp(k * 1.4 - j * 0.06), m = Math.max(1, Math.floor(PER * eo(kk))); g.position.y = m * 0.05 + 0.03; g.visible = kk > 0.05; }); };
  add({ id: 'towers-low', at: Ls(5), scene: TS, people: [leoT, miaT, topG], tr: 'whip', whipDir: -1, cam: { from: [-2.6, 0.4, 6.0], to: [-1.1, 0.5, 5.2], look: [0, 1.6, -4], look2: [0, 3.6, -4.2], fov: 46, fov2: 42 }, dof: 0.0006, grade: { bloom: 0.22 },
    update: (t) => { towerUpd(t); leoT.at(-0.35, 0, -0.9); miaT.at(0.55, 0, -1.1); act(leoT, t, [{ t: 0, pose: 'thinking', expr: 'thinking' }, { t: tSeven, pose: 'shrug', expr: 'surprised' }], 0.4); act(miaT, t, [{ t: 0, pose: 'standing', expr: 'happy' }, { t: tSeven + 0.2, pose: 'jumping', expr: 'surprised' }], 1.4, { flip: true }); },
    over: (lt, d, t) => { stamp('THE 7 FOUNDERS', 540, 330, 96, BLU, 0.04, (t - tSeven) / 0.4); } });
  add({ id: 'towers-top', at: tTw - 0.1, scene: TS, people: [topG], tr: 'cut', cam: { from: [1.6, 3.0, 1.4], to: [1.0, 5.4, 0.4], look: [0.2, 4.4, -4.3], look2: [0, 5.6, -4.4], fov: 40 }, dof: 0.0006, grade: { bloom: 0.22 },
    update: (t) => towerUpd(t),
    over: (lt, d, t) => { stamp('≈ $20 BILLION EACH', 540, 340, 92, GRN, -0.04, (t - tTw) / 0.4); note('at the $83 price · SEC filings via CNBC', 540, 1760, 30); } });
  cue(Ls(5), 'whoosh', { gain: 0.5 }); cue(tSeven, 'slam', { gain: 0.8 }); cue(tSeven + 0.1, 'slide', { gain: 0.4, dur: 0.9 }); cue(tTw, 'slam', { gain: 0.8 });

  // 6 · the catch: only 10% can be sold for now
  const tCatch = W_('catch', 6), tTen = W_('ten', 6), tSh = W_('shares', 6);
  add({ id: 'vault-push', at: Ls(6), scene: VS, people: [miaV, leoV], tr: 'flash', cam: { from: [-0.75, 1.75, 3.5], to: [-0.5, 1.5, 2.5], look: [-0.35, 1.0, -2.6], fov: 40 }, dof: 0.0012, grade: { bloom: 0.2 },
    update: (t) => { miaV.at(-1.22, 0, -1.95); leoV.group.visible = false; act(miaV, t, [{ t: 0, pose: 'shrug', expr: 'worried' }, { t: tTen, pose: 'thumbsUp', expr: 'smirk', extra: ['bar'] }], 1.2); const k = eob(clamp((t - tTen) / 0.45)); bars[0].position.y = 0.86 + k * 0.26; bars[0].rotation.y = k * 0.5; bars[0].material.emissive.set('#5a3c00'); bars[0].material.emissiveIntensity = k * 0.8; },
    over: (lt, d, t) => { pill('THE CATCH', 540, 300, RED, '#fff', 64, eob(clamp((t - tCatch) / 0.3)), -0.03); stamp('CAN SELL: 10%', 540, 460, 100, GRN, 0.04, (t - tTen) / 0.4); pill('THE REST: LOCKED FOR NOW', 540, 620, '#fff', INK, 48, eob(clamp((t - tSh - 0.2) / 0.3)), -0.02); } });
  cue(Ls(6), 'whoosh', { gain: 0.5 }); cue(tCatch, 'thud', { gain: 0.7 }); cue(tTen, 'slam', { gain: 0.8 }); cue(tSh + 0.2, 'pop', { gain: 0.5 });

  // 7 · if a job offers you stock: ask two things
  const tStk = W_('stock', 7), tCsh = W_('cash', 7), tAsk = W_('ask', 7), tHowM = W_('How', 7), tWhen = W_('when', 7);
  add({ id: 'offer-crane', at: Ls(7), scene: AS, people: [leoA], tr: 'whip', cam: { from: [0.25, 2.9, 5.6], to: [0.05, 1.75, 4.4], look: [0, 1.0, -2.5], look2: [0, 1.2, -2.4], fov: 38, fov2: 37 }, dof: 0.0006,
    update: (t) => { leoA.at(0, 0, -1.75); act(leoA, t, [{ t: 0, pose: 'standing', expr: 'happy' }, { t: tStk, pose: 'pointing', expr: 'happy' }, { t: tCsh, pose: 'pointing', expr: 'smirk', flip: true }], 0.4); },
    over: (lt, d, t) => { pill('NEW JOB OFFER', 540, 300, '#fff', INK, 64, eob(clamp((lt - 0.15) / 0.3)), -0.03); pill('STOCK', 770, 470, BLU, '#fff', 66, eob(clamp((t - tStk) / 0.3)), 0.05); pill('CASH', 300, 470, GRN, '#fff', 66, eob(clamp((t - tCsh) / 0.3)), -0.05); } });
  add({ id: 'offer-ask', at: tAsk - 0.08, scene: AS, people: [leoA], tr: 'flash', cam: { from: [1.3, 1.6, 2.7], to: [0.7, 1.55, 1.7], look: [0, 1.25, -1.8], fov: 34 }, dof: 0.0016,
    update: (t) => { leoA.at(0, 0, -1.75); act(leoA, t, [{ t: 0, pose: 'thinking', expr: 'thinking', extra: ['clip'] }, { t: tHowM, pose: 'pointing', expr: 'happy', extra: ['clip'] }, { t: tWhen, pose: 'thumbsUp', expr: 'smug', extra: ['clip'] }], 0.4); },
    over: (lt, d, t) => { pill('ASK 2 THINGS', 540, 300, '#fff', INK, 60, eob(clamp((t - tAsk) / 0.3)), -0.03); step(1, 'HOW MUCH DO I PAY?', 150, 460, (t - tHowM) / 0.35, GRN); step(2, 'WHEN CAN I SELL?', 150, 630, (t - tWhen) / 0.35, BLU); } });
  cue(Ls(7), 'whoosh', { gain: 0.5 }); cue(tStk, 'pop', { gain: 0.6 }); cue(tCsh, 'pop', { gain: 0.6 }); cue(tAsk, 'whoosh', { gain: 0.4 }); cue(tHowM, 'pop', { gain: 0.7 }); cue(tWhen, 'pop', { gain: 0.7 });

  // 8 · cash or stock? comment
  const tCash = W_('Cash', 8), tWhich = W_('Which', 8);
  add({ id: 'end-crane', at: Ls(8), scene: AS, people: [leoA], tr: 'whip', cam: { from: [0, 1.5, 1.5], to: [0, 3.6, 6.4], look: [0, 1.25, -2.2], look2: [0, 1.3, -2.5], fov: 36, fov2: 40 }, dof: 0.0006,
    update: (t) => { leoA.at(0, 0, -1.75); act(leoA, t, [{ t: 0, pose: 'shrug', expr: 'smirk' }, { t: tWhich, pose: 'wave', expr: 'happy' }], 0.4); },
    over: (lt, d, t) => { ctx.save(); ctx.globalAlpha = 1 - clamp((t - Le(8) - 0.1) / 0.3); pill('CASH', 290, 320, GRN, '#fff', 80, eob(clamp((t - tCash) / 0.3)), -0.05); outText('or', 540, 320, 70, '#fff', 0, eob(clamp((t - tCash - 0.1) / 0.3))); pill('STOCK', 790, 320, BLU, '#fff', 80, eob(clamp((t - tCash - 0.2) / 0.3)), 0.05); pill('COMMENT BELOW', 540, 500, YEL, INK, 64, eob(clamp((t - tWhich) / 0.3)), -0.02); ctx.restore(); } });
  cue(Ls(8), 'whoosh', { gain: 0.5 }); cue(tCash, 'pop', { gain: 0.6 }); cue(tCash + 0.2, 'pop', { gain: 0.6 }); cue(tWhich, 'pop', { gain: 0.7 });

  D.S.sort((a, b) => a.at - b.at); return { shots: D.S, cues: CUES };
}
