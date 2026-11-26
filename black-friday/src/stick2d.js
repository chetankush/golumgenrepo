// Code-drawn stickman, built from the owner's Character Sheet. All coordinates are in head-radius units (R=1),
// origin = head centre, y down. Colours from the sheet: head white, body black, shoes/details gray, mouth red.
export const INK = '#111111', WHITE = '#FFFFFF', GRAY = '#8E8E8E', RED = '#E23B3B', DARKRED = '#8A1620', PINK = '#F27C8A';

const SH = 1.3, HIP = 2.7;           // shoulder and hip height under the head
export const POSES = {
  standing: { a: { e: [-0.55, 2.1], h: [-0.7, 2.95] }, b: { e: [0.55, 2.1], h: [0.7, 2.95] }, la: { k: [-0.2, 3.7], f: [-0.45, 4.75] }, lb: { k: [0.2, 3.7], f: [0.45, 4.75] } },
  thumbsUp: { a: { e: [-1.0, 2.0], h: [-0.4, 2.55], g: 'hip' }, b: { e: [1.0, 1.95], h: [1.3, 0.95], g: 'thumb' }, la: { k: [-0.2, 3.7], f: [-0.5, 4.75] }, lb: { k: [0.2, 3.7], f: [0.5, 4.75] } },
  pointing: { a: { e: [-1.0, 2.0], h: [-0.4, 2.55], g: 'hip' }, b: { e: [1.1, 1.4], h: [2.25, 1.15], g: 'point' }, la: { k: [-0.25, 3.7], f: [-0.6, 4.75] }, lb: { k: [0.25, 3.7], f: [0.6, 4.75] } },
  thinking: { a: { e: [-0.55, 2.1], h: [-0.7, 2.95] }, b: { e: [0.75, 2.0], h: [0.2, 1.05], g: 'chin' }, la: { k: [-0.2, 3.7], f: [-0.45, 4.75] }, lb: { k: [0.2, 3.7], f: [0.45, 4.75] } },
  jumping: { dy: -0.6, a: { e: [-1.1, 0.8], h: [-1.7, -0.1], g: 'open' }, b: { e: [1.1, 0.8], h: [1.7, -0.1], g: 'open' }, la: { k: [-1.0, 3.5], f: [-0.7, 4.3] }, lb: { k: [1.0, 3.3], f: [0.8, 4.05] } },
  running: { lean: 0.22, a: { e: [-0.95, 1.9], h: [-1.2, 1.1], g: 'fist' }, b: { e: [0.85, 2.0], h: [1.45, 2.55], g: 'fist' }, la: { k: [0.85, 3.5], f: [0.55, 4.55] }, lb: { k: [-0.7, 3.65], f: [-1.45, 4.5] } },
  shrug: { a: { e: [-1.0, 1.7], h: [-1.5, 1.1], g: 'open' }, b: { e: [1.0, 1.7], h: [1.5, 1.1], g: 'open' }, la: { k: [-0.2, 3.7], f: [-0.45, 4.75] }, lb: { k: [0.2, 3.7], f: [0.45, 4.75] } },
  wave: { a: { e: [-0.55, 2.1], h: [-0.7, 2.95] }, b: { e: [1.2, 1.5], h: [1.5, 0.3], g: 'open' }, la: { k: [-0.2, 3.7], f: [-0.45, 4.75] }, lb: { k: [0.2, 3.7], f: [0.45, 4.75] } },
};
export const EXPR = ['happy', 'sad', 'angry', 'surprised', 'wink', 'thinking', 'worried', 'smirk', 'bored', 'smug', 'cry'];

/** draw a stickman. o: { x, y (head centre px), R (head radius px), pose (name or object), expr, look:[-1..1,-1..1], flip, shoes:true, hoodie:false } */
export function stickman(ctx, o) {
  const R = o.R || 100, P = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose || POSES.standing), expr = o.expr || 'happy';
  const lw = R * 0.17, ow = R * 0.075;
  ctx.save(); ctx.translate(o.x, o.y); if (o.flip) ctx.scale(-1, 1); ctx.scale(R, R);
  const lean = P.lean || 0; ctx.translate(0, P.dy || 0);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const L = (pts, w) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.strokeStyle = INK; ctx.lineWidth = w / R; ctx.stroke(); };
  const lx = (y) => lean * (y - 1) ;       // body leans: x shifts with depth below the head
  if (o.headOnly) { head(ctx, expr, o.look || [0, 0], R, P, true); ctx.restore(); return; }
  // legs + shoes
  for (const s of ['la', 'lb']) {
    const g = P[s], sx = s === 'la' ? -0.09 : 0.09, hip = [sx + lx(HIP), HIP];
    const k = [g.k[0] + lx(g.k[1]), g.k[1]], f = [g.f[0] + lx(g.f[1]) * 0.6, g.f[1]];
    L([hip, k, f], lw);
    if (o.shoes !== false) shoe(ctx, f[0], f[1], R, s === 'la' ? -1 : 1, g.f[0] - g.k[0]);
  }
  // torso (slightly tapered, thin)
  L([[lx(SH), SH], [lx(HIP), HIP]], lw * 1.05);
  // hoodie (optional)
  if (o.hoodie) { ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.ellipse(lx(1.95), 1.95, 0.62, 0.78, 0, 0, 7); ctx.fill(); ctx.strokeStyle = RED; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(-0.3, 1.2); ctx.quadraticCurveTo(0, 1.55, 0.3, 1.2); ctx.stroke(); }
  // arms + gloves
  for (const s of ['a', 'b']) {
    const g = P[s], sx = s === 'a' ? -0.1 : 0.1, sh = [sx + lx(SH), SH], e = [g.e[0] + lx(g.e[1]) * 0.5, g.e[1]], h = [g.h[0] + lx(g.h[1]) * 0.5, g.h[1]];
    L([sh, e, h], lw * 0.95);
    glove(ctx, h, Math.atan2(h[1] - e[1], h[0] - e[0]), g.g || 'open', s === 'a' ? -1 : 1, R);
  }
  // head (drawn last, on top)
  head(ctx, expr, o.look || [0, 0], R, P, false, o);
  ctx.restore();
  const fx = o.flip ? -1 : 1, dy = P.dy || 0, px = (hx, hy) => [o.x + fx * hx * R, o.y + (hy + dy) * R];
  const hp = (h) => [h[0] + lx(h[1]) * 0.5, h[1]];
  return { a: px(...hp(P.a.h)), b: px(...hp(P.b.h)), head: [o.x, o.y + dy * R], feet: px(0, 4.9) };
}

function shoe(ctx, x, y, R, side, spread) {
  ctx.save(); ctx.translate(x, y + 0.02); ctx.scale(side * 1, 1); // toe points outward
  ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 0.075;
  ctx.beginPath(); ctx.moveTo(-0.28, -0.2); ctx.quadraticCurveTo(-0.3, 0.2, -0.22, 0.26); ctx.lineTo(0.62, 0.26);
  ctx.quadraticCurveTo(0.74, 0.22, 0.66, 0.08); ctx.quadraticCurveTo(0.45, -0.02, 0.28, -0.14); ctx.quadraticCurveTo(0.05, -0.26, -0.28, -0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = GRAY; ctx.beginPath(); ctx.roundRect(-0.24, 0.17, 0.9, 0.1, 0.05); ctx.fill();
  ctx.strokeStyle = GRAY; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.moveTo(0.1, -0.12); ctx.lineTo(0.2, -0.04); ctx.moveTo(0.22, -0.1); ctx.lineTo(0.32, -0.02); ctx.stroke();
  ctx.restore();
}

function glove(ctx, h, ang, kind, side, R) {
  ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(ang - Math.PI / 2);   // local: hand extends toward +y... we draw pointing "down" (+y)
  ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 0.07; ctx.lineJoin = 'round';
  const palm = () => { ctx.beginPath(); ctx.ellipse(0, 0.2, 0.27, 0.32, 0, 0, 7); ctx.fill(); ctx.stroke(); };
  if (kind === 'thumb') { // fist with a thumb pointing up (away from the forearm)
    ctx.rotate(Math.PI); ctx.beginPath(); ctx.ellipse(0, 0.1, 0.3, 0.27, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-0.04, -0.28, 0.1, 0.2, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 0.05; for (const yy of [0.02, 0.14]) { ctx.beginPath(); ctx.moveTo(0.08, yy); ctx.lineTo(0.27, yy + 0.02); ctx.stroke(); }
  } else if (kind === 'point') {
    ctx.rotate(Math.PI); ctx.beginPath(); ctx.ellipse(0, 0.12, 0.27, 0.25, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-0.09, -0.5, 0.18, 0.5, 0.09); ctx.fill(); ctx.stroke();
  } else if (kind === 'fist') {
    ctx.beginPath(); ctx.ellipse(0, 0.2, 0.26, 0.26, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 0.045; for (const xx of [-0.08, 0.08]) { ctx.beginPath(); ctx.moveTo(xx, 0.28); ctx.lineTo(xx, 0.42); ctx.stroke(); }
  } else if (kind === 'chin') {
    ctx.rotate(Math.PI); ctx.beginPath(); ctx.ellipse(0, 0.05, 0.25, 0.22, 0, 0, 7); ctx.fill(); ctx.stroke();
  } else { // open mitten with a thumb (hip / open)
    palm(); ctx.beginPath(); ctx.ellipse(side * 0.27, 0.12, 0.1, 0.16, side * 0.5, 0, 7); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 0.045; ctx.beginPath(); ctx.moveTo(-0.06, 0.34); ctx.lineTo(-0.06, 0.5); ctx.moveTo(0.1, 0.34); ctx.lineTo(0.1, 0.5); ctx.stroke();
  }
  ctx.restore();
}

function head(ctx, expr, look, R, P, noNeck, o = {}) {
  ctx.save(); if (o.tilt) ctx.rotate(o.tilt);
  if (o.hair === 'bob') { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, 0.18, 1.2, 1.18, 0, 0, 7); ctx.fill(); }
  const HAIR = o.hairCol || '#4a2f27';
  if (o.hair === 'braids') { // two plaits hanging to the shoulders, drawn BEHIND the head
    ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) { const y = 0.02 + i * 0.27, x = s * (0.97 + i * 0.035), w = 0.21 - i * 0.012;
        ctx.fillStyle = HAIR; ctx.beginPath(); ctx.ellipse(x, y, w, 0.17, s * 0.12, 0, 7); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 0.035; ctx.beginPath(); ctx.moveTo(x - w * 0.6, y - 0.03); ctx.quadraticCurveTo(x, y + 0.09, x + w * 0.6, y - 0.03); ctx.stroke(); ctx.lineWidth = 0.05; }
      const by = 0.02 + 6 * 0.27 - 0.13, bx0 = s * (0.97 + 6 * 0.035);
      ctx.fillStyle = HAIR; ctx.beginPath(); ctx.moveTo(bx0 - 0.09, by); ctx.lineTo(bx0 - 0.17, by + 0.34); ctx.lineTo(bx0 - 0.06, by + 0.25); ctx.lineTo(bx0, by + 0.4); ctx.lineTo(bx0 + 0.06, by + 0.25); ctx.lineTo(bx0 + 0.17, by + 0.34); ctx.lineTo(bx0 + 0.09, by); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = o.bow || '#F2619C'; ctx.beginPath(); ctx.roundRect(bx0 - 0.12, by - 0.06, 0.24, 0.11, 0.04); ctx.fill(); ctx.stroke();
    }
  }
  // neck tick
  ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-0.11, 0.9, 0.22, noNeck ? 0.14 : 0.25, 0.05); ctx.fill();
  ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 0.085;
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.stroke();
  if (o.cel !== false) { // anime cel: ONE hard-edged shadow tone on the head
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 0.97, 0, 7); ctx.clip(); ctx.fillStyle = 'rgba(112,128,214,0.30)'; ctx.beginPath(); ctx.arc(0, 0, 1.2, 0, 7); ctx.arc(-0.2, -0.24, 1.0, 0, 7, true); ctx.fill('evenodd'); ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 0.085; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.stroke();
  }
  const lx = look[0] * 0.07, ly = look[1] * 0.07;
  const eye = (x, y, rx = 0.13, ry = 0.225) => { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x + lx, y + ly, rx, ry, 0, 0, 7); ctx.fill(); ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(x + lx + rx * 0.35, y + ly - ry * 0.35, rx * 0.3, 0, 7); ctx.fill(); };
  const brow = (x1, y1, x2, y2, w = 0.07) => { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const arc = (x, y, rx, ry, a0, a1, w = 0.07) => { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, a0, a1); ctx.stroke(); };
  const smileOpen = (cx, cy, w, h) => { // red open smile with tongue
    ctx.fillStyle = RED; ctx.strokeStyle = INK; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(cx - w, cy - h * 0.15); ctx.quadraticCurveTo(cx, cy + h * 0.3, cx + w, cy - h * 0.15); ctx.quadraticCurveTo(cx + w * 0.8, cy + h * 1.2, cx, cy + h * 1.15); ctx.quadraticCurveTo(cx - w * 0.8, cy + h * 1.2, cx - w, cy - h * 0.15); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PINK; ctx.beginPath(); ctx.ellipse(cx, cy + h * 0.85, w * 0.45, h * 0.28, 0, 0, 7); ctx.fill();
  };
  if (o.hair === 'bob') { // bangs over the forehead, drawn on top of the white head
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 1.0, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(0.7, -0.38, 0.1, -0.5); ctx.quadraticCurveTo(-0.5, -0.45, -0.98, -0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.bow || '#F2619C'; ctx.strokeStyle = INK; ctx.lineWidth = 0.05;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0.72 * 0.55, -0.93); ctx.lineTo(0.72 * 0.55 + s * 0.4, -1.12); ctx.lineTo(0.72 * 0.55 + s * 0.4, -0.76); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  if (o.hair === 'braids') { // fringe + hair framing the face (face stays white and open), strands from a side parting, bow
    ctx.fillStyle = HAIR; ctx.strokeStyle = INK; ctx.lineWidth = 0.06; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-1.02, 0.08); ctx.arc(0, 0, 1.035, Math.PI - 0.08, Math.PI * 2 + 0.08);
    ctx.lineTo(0.9, 0.06); ctx.quadraticCurveTo(0.88, -0.3, 0.72, -0.42); ctx.quadraticCurveTo(0.45, -0.52, 0.2, -0.64);
    ctx.quadraticCurveTo(-0.2, -0.46, -0.7, -0.42); ctx.quadraticCurveTo(-0.88, -0.32, -0.9, 0.06); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 0.032; ctx.lineCap = 'round';
    for (const [ex, ey, cx, cy] of [[0.48, -0.5, 0.42, -0.86], [0.8, -0.22, 0.72, -0.72], [-0.2, -0.5, -0.08, -0.86], [-0.55, -0.44, -0.42, -0.84], [-0.84, -0.12, -0.72, -0.66]]) { ctx.beginPath(); ctx.moveTo(0.2, -0.97); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke(); }
    ctx.fillStyle = o.bow || '#F2619C'; ctx.strokeStyle = INK; ctx.lineWidth = 0.05; const kx = 0.42, ky = -0.98;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(kx, ky); ctx.quadraticCurveTo(kx + s * 0.22, ky - 0.32, kx + s * 0.42, ky - 0.18); ctx.quadraticCurveTo(kx + s * 0.46, ky + 0.06, kx + s * 0.4, ky + 0.2); ctx.quadraticCurveTo(kx + s * 0.2, ky + 0.16, kx, ky); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(kx, ky, 0.09, 0.08, 0, 0, 7); ctx.fill(); ctx.stroke();
  }
  if (o.lashes) { ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.lineCap = 'round'; for (const s of [-1, 1]) for (const k of [0, 1, 2]) { ctx.beginPath(); ctx.moveTo(s * 0.36 + s * 0.12, -0.08 - 0.12); ctx.lineTo(s * 0.36 + s * (0.25 + k * 0.03), -0.2 - k * 0.1 - 0.05); ctx.stroke(); } }
  switch (expr) {
    case 'blink': arc(-0.36, -0.04, 0.15, 0.1, Math.PI * 0.1, Math.PI * 0.9, 0.08); arc(0.36, -0.04, 0.15, 0.1, Math.PI * 0.1, Math.PI * 0.9, 0.08); arc(0, 0.34, 0.3, 0.2, 0.15, Math.PI - 0.15, 0.07); break;
    case 'grin': eye(-0.36, -0.08); eye(0.36, -0.08); arc(0, 0.3, 0.34, 0.22, 0.1, Math.PI - 0.1, 0.075); break;
    case 'love': for (const sx of [-1, 1]) { ctx.fillStyle = '#E8365D'; ctx.beginPath(); const x = sx * 0.36 + lx, y = -0.08 + ly; ctx.moveTo(x, y + 0.2); ctx.bezierCurveTo(x - 0.3, y - 0.02, x - 0.16, y - 0.3, x, y - 0.1); ctx.bezierCurveTo(x + 0.16, y - 0.3, x + 0.3, y - 0.02, x, y + 0.2); ctx.fill(); } smileOpen(0, 0.36, 0.3, 0.2); break;
    case 'bored': { eye(-0.36, -0.02, 0.13, 0.12); eye(0.36, -0.02, 0.13, 0.12); ctx.fillStyle = WHITE; ctx.fillRect(-0.55, -0.3, 1.1, 0.16); ctx.strokeStyle = INK; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(-0.5, -0.16); ctx.lineTo(-0.2, -0.16); ctx.moveTo(0.2, -0.16); ctx.lineTo(0.5, -0.16); ctx.stroke(); arc(0, 0.55, 0.15, 0.04, 0, Math.PI, 0.06); break; }
    case 'smug': eye(-0.36, -0.02, 0.13, 0.15); eye(0.36, -0.02, 0.13, 0.15); brow(-0.6, -0.34, -0.14, -0.3); brow(0.14, -0.3, 0.6, -0.34); arc(0.05, 0.42, 0.32, 0.18, 0.1, Math.PI - 0.1, 0.07); break;
    case 'cry': eye(-0.36, -0.06); eye(0.36, -0.06); brow(-0.58, -0.4, -0.18, -0.3); brow(0.58, -0.4, 0.18, -0.3); arc(0, 0.64, 0.3, 0.2, Math.PI * 1.15, Math.PI * 1.85); ctx.fillStyle = '#6EC6FF'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 0.5, 0.25, 0.08, 0.14, 0, 0, 7); ctx.fill(); } break;

    case 'sad': eye(-0.36, -0.08); eye(0.36, -0.08); brow(-0.58, -0.4, -0.18, -0.3); brow(0.58, -0.4, 0.18, -0.3); arc(0, 0.62, 0.3, 0.2, Math.PI * 1.15, Math.PI * 1.85); break;
    case 'angry': eye(-0.36, -0.02, 0.1, 0.17); eye(0.36, -0.02, 0.1, 0.17); brow(-0.62, -0.38, -0.12, -0.2, 0.09); brow(0.62, -0.38, 0.12, -0.2, 0.09); arc(0, 0.7, 0.3, 0.2, Math.PI * 1.15, Math.PI * 1.85, 0.09); break;
    case 'surprised': eye(-0.36, -0.1, 0.13, 0.23); eye(0.36, -0.1, 0.13, 0.23); brow(-0.58, -0.5, -0.16, -0.5); brow(0.58, -0.5, 0.16, -0.5); ctx.fillStyle = RED; ctx.strokeStyle = INK; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.ellipse(0, 0.5, 0.15, 0.22, 0, 0, 7); ctx.fill(); ctx.stroke(); break;
    case 'wink': eye(-0.36, -0.08); arc(0.36, -0.08, 0.15, 0.1, Math.PI * 1.1, Math.PI * 1.9, 0.08); smileOpen(0, 0.38, 0.3, 0.2); break;
    case 'thinking': eye(-0.34, -0.12, 0.1, 0.17); eye(0.38, -0.12, 0.1, 0.17); brow(-0.58, -0.4, -0.16, -0.46); brow(0.62, -0.5, 0.16, -0.36); arc(0.05, 0.55, 0.2, 0.1, 0.15, Math.PI - 0.15, 0.07); break;
    case 'worried': eye(-0.36, -0.08); eye(0.36, -0.08); brow(-0.6, -0.34, -0.16, -0.46); brow(0.6, -0.34, 0.16, -0.46); arc(0, 0.62, 0.25, 0.12, Math.PI * 1.1, Math.PI * 1.9); break;
    case 'smirk': eye(-0.36, -0.08); eye(0.36, -0.08); brow(0.2, -0.46, 0.6, -0.4); arc(0.1, 0.42, 0.3, 0.16, 0.1, Math.PI - 0.5, 0.07); break;
    default: eye(-0.36, -0.08); eye(0.36, -0.08); smileOpen(0, 0.36, 0.3, 0.2);
  }
  ctx.restore();
}
