// THE DARK TRUTH BEHIND BLACK FRIDAY — Milo + Daisy, @OnlyFreeFacts. Loop ending: hard cut, no fade.
import * as THREE from 'three';
import { ctx, clamp, lerp, eo, eio, eob, rnd } from './core/lib.js';
import { L, Le, Wd } from './core/timing.js';
import { camera } from './core/engine.js';
import { V3, INK, WHITE, bx, cy, sp, canvasPlane, lights, person, act, pill, outText, stamp, director, MILO, DAISY } from './kit.js';

const W_ = (w, l, fb = 0.3) => { try { return Wd(w, l); } catch (e) { return L(l) + fb; } };
export async function loadAssets() { /* no painted backdrops needed: every set is built flat/dark */ }

// ── section accent colors (exact hexes from the brief) ──
const NEON_RED = '#FF2E4D', POLICE_BLUE = '#2E7BFF', GOLD = '#FFC23D', DARK = '#0B0B0F';
let _c6 = null, _c11 = null;
export function accentColorAt(t) {
  if (_c6 == null) { try { _c6 = L(6); } catch (e) { _c6 = 15; } try { _c11 = L(11); } catch (e) { _c11 = 33; } }
  return t < _c6 ? NEON_RED : t < _c11 ? POLICE_BLUE : GOLD;
}

const COP = { cel: false }, OWNER = { cel: false };

const emo = (txt, x, y, size, rot = 0, sc = 1) => { if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.font = `${size}px "Segoe UI Emoji", Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 0); ctx.restore(); };
/** a full-frame translucent colour wash, for section mood without re-lighting the 3D set */
const colorWash = (hex, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = hex; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); };
/** big slammed-in title, holds then fades */
function titleSlam(txt, p, y = 420, size = 76, col = '#fff') { if (p <= 0) return; const k = eob(clamp(p * 3)); ctx.save(); ctx.globalAlpha = clamp(p * 6); ctx.translate(540, y - (1 - k) * 220); ctx.font = `900 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.22; ctx.strokeStyle = '#000'; const words = txt.split(' '); let y2 = 0; ctx.strokeText(txt, 0, 0); ctx.fillStyle = col; ctx.fillText(txt, 0, 0); ctx.restore(); }

export function buildShots(E) {
  const D = director(E, camera), add = D.add, CUES = [], cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const Ls = (i) => L(i) - 0.03;

  // ── SCENE_STAGE: dark void stage (hook, cover-up, payoff, CTA) ──
  const ST = new THREE.Scene(); ST.background = new THREE.Color(DARK); ST.environment = E.envMap; ST.environmentIntensity = 0.15;
  const spot = new THREE.SpotLight('#fff3dd', 18, 14, 0.55, 0.5, 1.4); spot.position.set(0, 5, 2.4); spot.target.position.set(0, 1, -2); ST.add(spot, spot.target);
  lights(ST, { key: '#9aa0b8', keyI: 0.5, keyPos: [2, 5, 3], hemi: 0.25, sky: '#2a2a3a', ground: '#050507', box: 8 });
  const BAGSPOTS = Array.from({ length: 8 }, (_, i) => ({ x: (rnd(i) - 0.5) * 7, y: 1.5 + rnd(i + 9) * 2.5, z: -5 - rnd(i + 3) * 3, s: 0.4 + rnd(i + 5) * 0.3, ph: rnd(i + 7) * 6.28 }));
  const bagIcons = BAGSPOTS.map((b) => { const pl = canvasPlane(0.9, 0.9, 120, { transparent: true }); pl.position.set(b.x, b.y, b.z); pl.material.opacity = 0.28; pl.visible = false; ST.add(pl);
    pl.draw((g, W, H) => { g.font = `${H * 0.8}px "Segoe UI Emoji", Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(rnd(b.x) > 0.5 ? '🛍️' : '🏷️', W / 2, H / 2); }); return { pl, b }; });
  const miloS = person(MILO); ST.add(miloS.group);
  const daisyS = person(DAISY, 1.6); ST.add(daisyS.group);
  const owner = person(OWNER, 1.75); owner.group.visible = false; ST.add(owner.group);
  const banner = canvasPlane(1.6, 0.8, 500); banner.position.set(0.55, 2.0, -2.0); banner.visible = false; ST.add(banner);
  const drawBanner = (droop) => banner.draw((g, W, H) => {
    g.fillStyle = '#f2efe6'; g.fillRect(0, 0, W, H); g.strokeStyle = INK; g.lineWidth = 14; g.strokeRect(10, 10, W - 20, H - 20);
    g.fillStyle = GOLD; g.font = `900 ${H * (droop > 0.5 ? 0.16 : 0.22)}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(droop > 0.5 ? 'BIG FRIDA' : 'BIG FRIDAY!', W / 2, H / 2);
    if (droop <= 0.5) { g.fillStyle = '#ffe9a0'; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.beginPath(); g.arc(W * 0.12 + Math.cos(a) * 18, H * 0.2 + Math.sin(a) * 18, 4, 0, 7); g.fill(); } }
  });
  drawBanner(0);
  // subscribe button (Scene 6)
  const subBtn = canvasPlane(1.4, 0.5, 500); subBtn.position.set(0, 0.9, -1.6); subBtn.visible = false; ST.add(subBtn);
  subBtn.draw((g, W, H) => { g.fillStyle = NEON_RED; g.beginPath(); g.roundRect(8, 8, W - 16, H - 16, H * 0.22); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#fff'; g.font = `900 ${H * 0.34}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SUBSCRIBE', W / 2, H / 2); });

  // ── SCENE_LIE: neon store window + ledger ──
  const LS = new THREE.Scene(); LS.background = new THREE.Color('#130a0d'); LS.environment = E.envMap; LS.environmentIntensity = 0.2;
  lights(LS, { key: '#ff6a7e', keyI: 1.2, keyPos: [1.5, 5, 4], hemi: 0.5, sky: '#2a0f16', ground: '#0a0508', pink: 6 });
  bx(6, 4.6, 0.1, '#1c0f13', 0, 2.3, -3.4, LS);
  const saleL = canvasPlane(1.1, 0.7, 400), saleR = canvasPlane(1.1, 0.7, 400); saleL.position.set(-1.7, 3.1, -3.3); saleR.position.set(1.7, 3.1, -3.3); LS.add(saleL, saleR);
  saleL.draw((g, W, H) => { g.fillStyle = NEON_RED; g.font = `900 ${H * 0.4}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SALE', W / 2, H / 2); });
  saleR.draw((g, W, H) => { g.fillStyle = NEON_RED; g.font = `900 ${H * 0.28}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('50% OFF', W / 2, H / 2); });
  const ledger = canvasPlane(2.2, 1.6, 400); ledger.position.set(0, 1.8, -2.2); LS.add(ledger);
  const drawLedger = (wipe, cracked) => ledger.draw((g, W, H) => {
    g.fillStyle = '#f2ecd8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a7a5a'; g.lineWidth = 6; for (let y = H * 0.18; y < H; y += H * 0.14) { g.beginPath(); g.moveTo(W * 0.08, y); g.lineTo(W * 0.92, y); g.stroke(); }
    g.fillStyle = INK; g.font = `900 ${H * 0.12}px Inter`; g.textAlign = 'center'; g.fillText('LEDGER', W / 2, H * 0.1);
    for (let r = 0; r < 4; r++) { const y = H * 0.3 + r * H * 0.14, black = (y / H) < wipe; g.fillStyle = black ? '#1a1a1a' : NEON_RED; g.font = `800 ${H * 0.09}px Inter`; g.textAlign = 'left'; g.fillText((black ? '+$' : '-$') + (120 + r * 40), W * 0.12, y); }
    if (cracked > 0) { g.strokeStyle = '#000'; g.lineWidth = 10 * cracked; g.beginPath(); g.moveTo(W * 0.5, 0); g.lineTo(W * 0.42, H * 0.4); g.lineTo(W * 0.58, H * 0.6); g.lineTo(W * 0.46, H); g.stroke(); }
  });
  drawLedger(0, 0);

  // ── SCENE_TRUTH: vintage Philadelphia street, cop directing traffic ──
  const TS = new THREE.Scene(); TS.background = new THREE.Color('#1a2038'); TS.environment = E.envMap; TS.environmentIntensity = 0.3;
  lights(TS, { key: '#9fb6ff', keyI: 1.5, keyPos: [2, 6, 4], hemi: 0.7, sky: '#4a5a8a', ground: '#101428', blue: 5 });
  bx(40, 8, 0.3, '#232c4a', 0, 4, -8, TS); bx(40, 0.1, 20, '#2a2a30', 0, 0, -3, TS);
  for (let i = 0; i < 6; i++) { const x = -7 + i * 2.8; bx(2.2, 3.2 + rnd(i) * 1.6, 2, '#2e3858', x, 1.6 + rnd(i) * 0.8, -6.5, TS); const w = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshBasicMaterial({ color: '#ffdf9a' })); w.position.set(x, 2.0, -5.48); TS.add(w); }
  const redL = new THREE.PointLight(NEON_RED, 4, 10, 1.6), bluL = new THREE.PointLight(POLICE_BLUE, 4, 10, 1.6); redL.position.set(-1.2, 1.2, -1.5); bluL.position.set(1.2, 1.2, -1.5); TS.add(redL, bluL);
  function crowd(scene, look, spots, h = 1.5) { const tk = person(look, h, 1); tk.set({ pose: 'standing', expr: 'worried' }); const gs = spots.map(([x, y, z]) => { const g = new THREE.Group(); g.position.set(x, y, z); const m = new THREE.Mesh(tk.mesh.geometry, tk.mat); g.add(m); scene.add(g); return g; }); return { tk, gs, face(cam) { gs.forEach((g) => { g.rotation.y = Math.atan2(cam.position.x - g.position.x, cam.position.z - g.position.z); }); } }; }
  const crowdSpots = Array.from({ length: 10 }, (_, i) => [-5 + (i % 5) * 2.3 + (rnd(i) - 0.5) * 0.6, 0, -3.5 - Math.floor(i / 5) * 1.4]);
  const peopleCrowd = crowd(TS, { hoodie: true, cel: false }, crowdSpots);
  const cop = person(COP, 1.7); cop.group.position.set(0.4, 0, -2.1); TS.add(cop.group);
  const clock = canvasPlane(0.9, 0.9, 400); clock.position.set(-1.8, 2.6, -2.6); TS.add(clock);
  const drawClock = (t) => clock.draw((g, W, H) => { const cx = W / 2, cy_ = H / 2, r = W * 0.44; g.fillStyle = '#f2ecd8'; g.beginPath(); g.arc(cx, cy_, r, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.85, cy_ + Math.sin(a) * r * 0.85); g.lineTo(cx + Math.cos(a) * r * 0.95, cy_ + Math.sin(a) * r * 0.95); g.lineWidth = 6; g.stroke(); }
    g.strokeStyle = NEON_RED; g.lineWidth = 10; g.lineCap = 'round'; const ha = t * 8; g.beginPath(); g.moveTo(cx, cy_); g.lineTo(cx + Math.cos(ha) * r * 0.75, cy_ + Math.sin(ha) * r * 0.75); g.stroke(); });

  // ════════════ shots (one per narration line) ════════════

  // 0 · hook: flickering spotlight, Daisy leans in
  add({ id: 'hook', at: 0, scene: ST, people: [daisyS], tr: 'cut', cam: { from: [0, 1.5, 2.6], to: [0, 1.5, 2.0], look: [0, 1.4, -2.0], fov: 36 }, dof: 0.0012, grade: { bloom: 0.3, sat: 0.8 },
    update: (t) => { miloS.group.visible = false; daisyS.at(0, 0, -2.0); act(daisyS, t, [{ t: 0, pose: 'thinking', expr: 'smirk', tilt: 0.05 }], 0.3);
      bagIcons.forEach(({ pl, b }) => { pl.visible = true; pl.position.y = b.y + Math.sin(t * 0.6 + b.ph) * 0.15; });
      spot.intensity = 16 + Math.sin(t * 23) * 2.5 + (rnd(Math.floor(t * 9)) - 0.5) * 3; },
    over: (lt, d, t) => { colorWash(NEON_RED, 0.06); titleSlam("BLACK FRIDAY'S DARK TRUTH 🤫", clamp((lt - 0.05) / 0.25), 360, 64); } });
  cue(0.05, 'slam', { gain: 0.8 });

  // 1 · "Dark truth? It's just a shopping day... right?"
  add({ id: 'milo-shrug', at: Ls(1), scene: ST, people: [miloS], tr: 'cut', cam: { from: [0.1, 1.5, 2.3], to: [0.1, 1.5, 1.9], look: [0, 1.4, -2.0], fov: 36 }, dof: 0.0013, grade: { sat: 0.85 },
    update: (t) => { bagIcons.forEach(({ pl }) => { pl.visible = false; }); daisyS.group.visible = false; miloS.group.visible = true; miloS.at(0, 0, -2.0); act(miloS, t, [{ t: 0, pose: 'shrug', expr: 'thinking' }], 0.2); },
    over: () => { colorWash(NEON_RED, 0.06); } });
  cue(Ls(1), 'whoosh', { gain: 0.5 });

  // 2 · "That's what they... WANT you to think." — punch-in on Daisy, spotlight dims
  const tWant = W_('WANT', 2);
  add({ id: 'daisy-want', at: Ls(2), scene: ST, people: [daisyS], tr: 'flash', cam: { from: [0, 1.55, 1.9], to: [0, 1.5, 1.3], look: [0, 1.45, -2.0], fov: 36, fov2: 28 }, dof: 0.0011, grade: { sat: 0.75 },
    update: (t) => { miloS.group.visible = false; daisyS.group.visible = true; daisyS.at(0, 0, -2.0); act(daisyS, t, [{ t: 0, pose: 'thinking', expr: 'smirk' }], 0.3); spot.intensity = t > tWant ? 10 : 16; },
    over: (lt, d, t) => { colorWash(NEON_RED, 0.1); stamp('WANT', 540, 420, 100, NEON_RED, -0.03, clamp((t - tWant) / 0.25)); } });
  cue(tWant, 'pop', { gain: 0.6 });

  // 3 · the lie: ledger, red to black ink
  add({ id: 'ledger', at: Ls(3), scene: LS, people: [], tr: 'whip', cam: { from: [0, 1.9, 2.6], to: [0, 1.85, 1.8], look: [0, 1.8, -2.2], fov: 38, fov2: 36 }, dof: 0.0012, grade: { bloom: 0.3 },
    update: (t) => { const k = clamp((t - Ls(3)) / 2.2); drawLedger(k, 0); const f = 0.5 + 0.5 * Math.sin(t * 9); saleL.material.opacity = 0.7 + f * 0.3; saleR.material.opacity = 0.7 + (1 - f) * 0.3; },
    over: (lt, d, t) => { colorWash(NEON_RED, 0.08); pill('IN THE RED', 330, 300, '#fff', INK, 44, eob(clamp((lt - 0.15) / 0.3)), -0.03); pill('IN THE BLACK', 770, 300, '#111', '#fff', 44, eob(clamp((lt - 0.15) / 0.3)), 0.03); } });
  cue(Ls(3), 'whoosh', { gain: 0.5 }); cue(Ls(3) + 1.0, 'pop', { gain: 0.5 });

  // 4 · "That sounds nice." — Milo buys it
  add({ id: 'milo-nice', at: Ls(4), scene: LS, people: [], tr: 'cut', cam: { from: [0, 1.9, 2.2], to: [0, 1.85, 1.7], look: [0, 1.8, -2.2], fov: 36 }, dof: 0.0013,
    update: (t) => { drawLedger(1, 0); },
    over: (lt, d, t) => { colorWash(NEON_RED, 0.08); emo('✨', 540, 820, 110, 0, eob(clamp((lt - 0.1) / 0.25))); } });

  // 5 · "Yeah... too nice. That's NOT where the name came from." — record-scratch, ledger cracks
  const tNot = W_('not', 5);
  add({ id: 'ledger-crack', at: Ls(5), scene: LS, people: [], tr: 'flash', cam: { from: [0, 1.9, 2.3], to: [0, 1.85, 1.7], look: [0, 1.8, -2.2], fov: 36 }, dof: 0.0012, grade: { bloom: 0.26 },
    update: (t) => { const c = clamp((t - tNot) / 0.3); drawLedger(1, c); const sh = c > 0 && c < 1 ? (1 - c) * 0.03 : 0; ledger.position.x = (rnd(Math.floor(t * 40)) - 0.5) * sh; },
    over: (lt, d, t) => { colorWash(NEON_RED, 0.08); stamp('FAKE ❌', 540, 1500, 88, NEON_RED, 0.03, clamp((t - tNot) / 0.3)); } });
  cue(tNot, 'zip', { gain: 0.7 }); cue(tNot + 0.05, 'thud', { gain: 0.6 });

  // 6 · Philadelphia, 1950s-60s — vintage street
  add({ id: 'philly', at: Ls(6), scene: TS, people: [peopleCrowd, cop], tr: 'whip', cam: { from: [0, 1.8, 3.2], to: [0, 2.2, 1.6], look: [0, 1.6, -4.0], fov: 42, fov2: 38 }, dof: 0.0012, grade: { sat: 0.55, warm: -0.05 },
    update: (t) => { cop.at(0.4, 0, -2.1); act(cop, t, [{ t: 0, pose: 'pointing', expr: 'worried', extra: ['cap'] }], 0.3); peopleCrowd.gs.forEach((g, i) => { g.position.y = Math.abs(Math.sin(t * 2 + i)) * 0.03; }); redL.intensity = 2 + 2 * Math.max(0, Math.sin(t * 4)); bluL.intensity = 2 + 2 * Math.max(0, Math.sin(t * 4 + 3.14)); drawClock(t); },
    over: (lt, d, t) => { colorWash(POLICE_BLUE, 0.1); pill('PHILADELPHIA 🚓', 540, 300, '#fff', INK, 48, eob(clamp((lt - 0.15) / 0.3)), -0.02); pill('1950s-60s', 540, 420, POLICE_BLUE, '#fff', 44, eob(clamp((lt - 0.3) / 0.3)), 0.02); } });
  cue(Ls(6), 'whoosh', { gain: 0.5 });

  // 7 · "Cops?!" — punch-in shock
  add({ id: 'cops', at: Ls(7), scene: TS, people: [], tr: 'flash', cam: { from: [0.3, 1.6, 1.4], to: [0.3, 1.55, 0.6], look: [0.3, 1.5, -2.1], fov: 40, fov2: 30 }, dof: 0.0012, grade: { sat: 0.6 },
    update: (t) => { cop.at(0.3, 0, -2.1); act(cop, t, [{ t: 0, pose: 'standing', expr: 'surprised', extra: ['cap'] }], 0.3); drawClock(t); },
    over: () => { colorWash(POLICE_BLUE, 0.1); } });
  cue(Ls(7), 'slam', { gain: 0.8 });

  // 8 · chaos: crowds, traffic, honking
  add({ id: 'chaos', at: Ls(8), scene: TS, people: [peopleCrowd, cop], tr: 'whip', whipDir: -1, cam: { from: [-0.5, 1.4, 2.6], to: [0, 1.7, 1.2], look: [0, 1.4, -3.5], fov: 44, fov2: 40 }, dof: 0.0012, grade: { sat: 0.6 },
    update: (t) => { cop.at(0.3, 0, -2.1); act(cop, t, [{ t: 0, pose: 'pointing', expr: 'worried', extra: ['cap'] }], 0.3, { hop: true }); peopleCrowd.gs.forEach((g, i) => { g.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.05; }); redL.intensity = 2 + 2 * Math.max(0, Math.sin(t * 6)); bluL.intensity = 2 + 2 * Math.max(0, Math.sin(t * 6 + 3.14)); drawClock(t); },
    over: (lt, d, t) => { colorWash(POLICE_BLUE, 0.12); const k = Math.floor(t * 2) % 3; [[220, 500], [860, 700], [540, 1150]].forEach(([x, y], i) => emo('📢', x, y, 70, 0, i === k ? 1 : 0)); } });
  cue(Ls(8), 'whoosh', { gain: 0.5 });

  // 9 · "Sounds terrible." — Milo winces
  add({ id: 'milo-wince', at: Ls(9), scene: TS, people: [cop], tr: 'cut', cam: { from: [0.1, 1.6, 1.6], to: [0.1, 1.55, 1.1], look: [0.1, 1.5, -2.1], fov: 40 }, dof: 0.0012, grade: { sat: 0.6 },
    update: (t) => { cop.at(0.3, 0, -2.1); act(cop, t, [{ t: 0, pose: 'thinking', expr: 'worried', extra: ['cap'] }], 0.3); drawClock(t); peopleCrowd.gs.forEach((g) => { g.visible = false; }); },
    over: () => { colorWash(POLICE_BLUE, 0.12); } });

  // 10 · "It was! ... their WORST day of the year." — tired cop, spinning clock, no day off
  const tWorst = W_('worst', 10);
  add({ id: 'worst-day', at: Ls(10), scene: TS, people: [cop], tr: 'flash', cam: { from: [-0.3, 1.5, 1.6], to: [0.1, 1.5, 0.9], look: [0.2, 1.3, -2.1], fov: 40, fov2: 32 }, dof: 0.0012, grade: { sat: 0.6 },
    update: (t) => { cop.at(0.3, 0, -2.1); act(cop, t, [{ t: 0, pose: 'shrug', expr: 'worried', extra: ['cap'] }, { t: tWorst, pose: 'thinking', expr: 'bored', extra: ['cap'] }], 0.3); drawClock(t * 2.2); },
    over: (lt, d, t) => { colorWash(POLICE_BLUE, 0.12); pill('NO DAY OFF 😩', 540, 300, '#fff', INK, 48, eob(clamp((lt - 0.4) / 0.3)), -0.02); stamp('WORST DAY OF THE YEAR', 540, 1560, 54, POLICE_BLUE, -0.02, clamp((t - tWorst) / 0.3)); } });
  cue(Ls(10), 'whoosh', { gain: 0.5 }); cue(tWorst, 'slam', { gain: 0.7 });

  // 11 · "So how did it become a shopping holiday?" — Milo curious
  add({ id: 'milo-curious', at: Ls(11), scene: ST, people: [], tr: 'cut', cam: { from: [0, 1.55, 2.2], to: [0, 1.5, 1.7], look: [0, 1.4, -2.0], fov: 36 }, dof: 0.0013, grade: { warm: 0.05 },
    update: (t) => { daisyS.group.visible = false; miloS.group.visible = true; miloS.at(0, 0, -2.0); act(miloS, t, [{ t: 0, pose: 'thinking', expr: 'thinking' }], 0.2); },
    over: (lt, d, t) => { colorWash(GOLD, 0.06); emo('❓', 740, 500, 100, 0, eob(clamp((lt - 0.2) / 0.3))); } });
  cue(Ls(11), 'whoosh', { gain: 0.5 });

  // 12 · the cover-up: store owner holds up "BIG FRIDAY!" banner
  add({ id: 'big-friday', at: Ls(12), scene: ST, people: [], tr: 'whip', cam: { from: [0.2, 1.8, 2.3], to: [0.2, 1.75, 1.6], look: [0.3, 1.6, -2.0], fov: 38 }, dof: 0.0012, grade: { warm: 0.08 },
    update: (t) => { miloS.group.visible = false; owner.group.visible = true; owner.at(0.3, 0, -2.0); act(owner, t, [{ t: 0, pose: 'thumbsUp', expr: 'smug', extra: ['tie'] }], 0.3); banner.visible = true; drawBanner(0); },
    over: () => { colorWash(GOLD, 0.08); } });
  cue(Ls(12), 'whoosh', { gain: 0.5 });

  // 13 · "Big Friday? Really?" — Milo laughs
  add({ id: 'milo-laughs', at: Ls(13), scene: ST, people: [], tr: 'cut', cam: { from: [-0.6, 1.6, 2.0], to: [-0.6, 1.55, 1.5], look: [-0.5, 1.4, -2.0], fov: 38 }, dof: 0.0013,
    update: (t) => { owner.group.visible = false; banner.visible = false; miloS.group.visible = true; miloS.at(-0.5, 0, -2.0); act(miloS, t, [{ t: 0, pose: 'jumping', expr: 'grin', tilt: -0.1 }], 0.2, { hop: true }); },
    over: () => { colorWash(GOLD, 0.08); } });
  cue(Ls(13), 'pop', { gain: 0.5 });

  // 14 · "Nobody used it..." — banner droops, FAILED stamp, old name gets polished
  add({ id: 'failed', at: Ls(14), scene: ST, people: [], tr: 'flash', cam: { from: [0.2, 1.75, 1.9], to: [0.1, 1.7, 1.4], look: [0.2, 1.5, -2.0], fov: 38 }, dof: 0.0012, grade: { bloom: 0.26 },
    update: (t) => { miloS.group.visible = false; owner.group.visible = true; owner.at(0.3, 0, -2.0); act(owner, t, [{ t: 0, pose: 'shrug', expr: 'sad', extra: ['tie'] }], 0.3); banner.visible = true;
      const d = clamp((t - Ls(14)) / 1.0); drawBanner(d); banner.scale.y = 1 - d * 0.35; banner.rotation.z = -d * 0.12; },
    over: (lt, d, t) => { colorWash(GOLD, 0.1); stamp('FAILED ❌', 760, 700, 72, NEON_RED, 0.04, clamp((t - Ls(14) - 0.5) / 0.3)); emo('✨', 300, 500, 90, 0, eob(clamp((t - Ls(14) - 1.0) / 0.3))); } });
  cue(Ls(14), 'whoosh', { gain: 0.5 }); cue(Ls(14) + 0.5, 'thud', { gain: 0.6 });

  // 15 · "So the profit story is..." — Milo realizes, music drops
  add({ id: 'realize', at: Ls(15), scene: ST, people: [], tr: 'cut', cam: { from: [0, 1.55, 2.4], to: [0, 1.5, 1.2], look: [0, 1.4, -2.0], fov: 36, fov2: 30 }, dof: 0.0013, grade: { sat: 0.9 },
    update: (t) => { owner.group.visible = false; banner.visible = false; miloS.group.visible = true; miloS.at(0, 0, -2.0); act(miloS, t, [{ t: 0, pose: 'thinking', expr: 'thinking' }], 0.2); },
    over: () => { colorWash(GOLD, 0.06); } });

  // 16 · "Marketing! ... nightmare for the police." — confetti, payoff
  const tMark = W_('marketing', 16);
  const confN = 220, confM = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.08, 0.05), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false, vertexColors: true }), confN);
  { const cols = [GOLD, '#fff', NEON_RED, POLICE_BLUE]; const colArr = new Float32Array(confN * 3); for (let i = 0; i < confN; i++) { const c = new THREE.Color(cols[i % cols.length]); colArr[i * 3] = c.r; colArr[i * 3 + 1] = c.g; colArr[i * 3 + 2] = c.b; } confM.instanceColor = new THREE.InstancedBufferAttribute(colArr, 3); }
  confM.frustumCulled = false; confM.visible = false; ST.add(confM); const confD0 = new THREE.Object3D();
  function drawConfetti(t0, t) { const lt = t - t0; confM.visible = lt > 0; if (lt <= 0) return; for (let i = 0; i < confN; i++) { const sp2 = 0.8 + rnd(i) * 1.0, y = 3.5 + rnd(i + 3) * 1.5 - lt * sp2 * 1.4; confD0.position.set((rnd(i + 7) - 0.5) * 3.2, ((y % 4) + 4) % 4, -2 + (rnd(i + 11) - 0.5) * 1.5); confD0.rotation.set(lt * 4 * rnd(i + 1), lt * 3 * rnd(i + 2), lt * 2); confD0.updateMatrix(); confM.setMatrixAt(i, confD0.matrix); } confM.instanceMatrix.needsUpdate = true; }
  add({ id: 'marketing', at: Ls(16), scene: ST, people: [], tr: 'whip', cam: { from: [0, 1.6, 2.2], to: [0, 1.6, 1.3], look: [0, 1.4, -2.0], fov: 38 }, dof: 0.0011, grade: { bloom: 0.3 },
    update: (t) => { miloS.group.visible = false; daisyS.group.visible = true; daisyS.at(0, 0, -2.0); act(daisyS, t, [{ t: 0, pose: 'thumbsUp', expr: 'grin' }], 0.3, { hop: true }); drawConfetti(tMark, t); },
    over: (lt, d, t) => { colorWash(GOLD, 0.1); stamp('MARKETING 💰', 540, 420, 90, GOLD, -0.03, clamp((t - tMark) / 0.3)); } });
  cue(Ls(16), 'whoosh', { gain: 0.5 }); cue(tMark, 'sparkle', { gain: 0.6, dur: 1.2 });
  add({ id: 'cop-wave', at: tMark + 0.9, scene: TS, people: [cop], tr: 'cut', cam: { from: [0.3, 1.6, 1.3], to: [0.3, 1.55, 1.0], look: [0.3, 1.4, -2.1], fov: 38 }, dof: 0.0013, grade: { sat: 0.6 },
    update: (t) => { cop.at(0.3, 0, -2.1); act(cop, t, [{ t: 0, pose: 'wave', expr: 'sad', extra: ['cap'] }], 0.3); peopleCrowd.gs.forEach((g) => { g.visible = false; }); } });

  // 17 · CTA: both characters, subscribe button, wink
  add({ id: 'cta', at: Ls(17), scene: ST, people: [miloS, daisyS], tr: 'cut', cam: { from: [0, 1.6, 2.6], to: [0, 1.6, 2.2], look: [0, 1.4, -2.0], fov: 36 }, dof: 0.0012, grade: { bloom: 0.2 },
    update: (t) => { confM.visible = false; miloS.group.visible = true; daisyS.group.visible = true; daisyS.at(-0.55, 0, -2.0); miloS.at(0.55, 0, -2.0); act(daisyS, t, [{ t: 0, pose: 'wave', expr: 'wink' }], 0.3); act(miloS, t, [{ t: 0, pose: 'thumbsUp', expr: 'grin' }], 0.2, { hop: true });
      subBtn.visible = true; subBtn.position.y = 0.9 + Math.abs(Math.sin(t * 5)) * 0.08; },
    over: (lt, d, t) => { colorWash(GOLD, 0.08); pill('@ONLYFREEFACTS', 540, 300, '#fff', INK, 52, eob(clamp((lt - 0.1) / 0.3)), -0.02); emo('👆', 760, 1120, 90, 0.3, eob(clamp((lt - 0.3) / 0.3))); } });
  cue(Ls(17), 'whoosh', { gain: 0.5 }); cue(Le(17) - 0.3, 'pop', { gain: 0.5 });

  D.S.sort((a, b) => a.at - b.at); return { shots: D.S, cues: CUES };
}
