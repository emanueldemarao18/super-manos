'use strict';
// Lutadores desenhados por esqueleto: cada pose define a anca, a inclinação do tronco e os alvos
// das mãos e dos pés; cotovelos e joelhos saem por cinemática inversa. Desenha-se virado para a
// direita (coordenadas locais com origem nos pés, y para baixo) e espelha-se com `face`.
//
// Pose:
//   hip [x,y]  posição da anca (em pé ≈ [0,-44])
//   lean       inclinação do tronco em graus (positivo = para a frente)
//   head       inclinação da cabeça
//   rot        rotação do corpo inteiro à volta da anca (quedas, piruetas)
//   hF hB      mão da frente / de trás, relativas ao respetivo ombro
//   fF fB      pé da frente / de trás, relativos ao chão
//   mouth      0 fechada, 1 aberta (grito)   open  1 = mãos abertas (especiais)

SM.Rig = (() => {
  const D = Math.PI / 180;
  const OUT = '#100806';

  const BASE = { hip: [0, -44], lean: 6, head: 0, rot: 0, hF: [13, -1], hB: [9, 3], fF: [13, 0], fB: [-12, 0], mouth: 0, open: 0 };

  const P = {
    idle: {},
    idle2: { hip: [0, -43], hF: [13, 1], hB: [9, 5] },
    walk1: { hip: [1, -44], fF: [19, 0], fB: [-6, -4] },
    walk2: { hip: [1, -45], fF: [7, -4], fB: [-16, 0] },
    crouch: { hip: [2, -27], lean: 22, fF: [17, 0], fB: [-13, 0], hF: [14, -2], hB: [10, 2] },
    squat: { hip: [0, -36], lean: 12, fF: [14, 0], fB: [-12, 0] },
    jumpUp: { hip: [0, -44], lean: 2, fF: [12, -20], fB: [-4, -15], hF: [10, -6], hB: [5, -2] },
    jumpFall: { hip: [0, -44], lean: 4, fF: [12, -8], fB: [-8, -5], hF: [14, -4], hB: [6, 0] },
    blockHi: { hip: [-2, -44], lean: -2, hF: [8, -13], hB: [7, -8], fF: [11, 0], fB: [-14, 0] },
    blockLo: { hip: [0, -27], lean: 14, fF: [15, 0], fB: [-14, 0], hF: [11, -10], hB: [9, -5] },
    hitHi: { hip: [-4, -44], lean: -18, head: -22, hF: [-2, 14], hB: [-9, 12], mouth: 1, fF: [12, 0], fB: [-15, 0] },
    hitMid: { hip: [-3, -40], lean: 28, head: 12, hF: [6, 16], hB: [2, 18], mouth: 1, fF: [10, 0], fB: [-14, 0] },
    hitLow: { hip: [-2, -26], lean: 0, head: -18, hF: [2, 12], hB: [-4, 12], mouth: 1, fF: [14, 0], fB: [-14, 0] },
    launched: { hip: [0, -44], rot: -40, lean: -10, head: -20, fF: [16, -10], fB: [4, -4], hF: [-12, -6], hB: [-16, 2], mouth: 1 },
    down: { hip: [0, -9], rot: -90, lean: 0, head: 10, fF: [-2, 34], fB: [-8, 36], hF: [10, 14], hB: [4, 18] },
    getup: { hip: [0, -24], lean: 30, fF: [14, 0], fB: [-12, 0], hF: [16, 14], hB: [8, 18] },
    dizzy: { hip: [0, -42], lean: -6, head: 14, hF: [4, 18], hB: [-2, 18], mouth: 1 },

    lpWind: { hF: [6, 3] },
    lp: { hip: [3, -44], lean: 12, hF: [31, -4], hB: [8, 5], fF: [16, 0] },
    hpWind: { hip: [-2, -44], lean: 0, hF: [10, 5], hB: [-5, 4] },
    hp: { hip: [7, -42], lean: 24, hF: [5, 9], hB: [34, -5], fF: [20, 0], fB: [-12, 0], mouth: 1 },
    lkWind: { hip: [-1, -45], lean: -4, fF: [12, -18] },
    lk: { hip: [-2, -45], lean: -10, fF: [35, -30], fB: [-6, 0], hF: [10, -2], hB: [2, 6] },
    hkWind: { hip: [-2, -45], lean: -10, fF: [8, -30], fB: [-4, 0], hF: [4, 0], hB: [-4, 6] },
    hk: { hip: [-4, -46], lean: -28, fF: [37, -62], fB: [-4, 0], hF: [0, 2], hB: [-12, 10], mouth: 1 },
    clp: { hip: [3, -27], lean: 22, fF: [17, 0], fB: [-13, 0], hF: [28, -1], hB: [10, 2] },
    chpWind: { hip: [0, -26], lean: 22, fF: [16, 0], fB: [-13, 0], hF: [6, 12], hB: [8, 4] },
    chp: { hip: [5, -42], lean: -4, hF: [9, -30], hB: [6, 6], fF: [17, 0], fB: [-12, 0], mouth: 1 },
    clk: { hip: [0, -26], lean: 14, fF: [37, -3], fB: [-12, 0], hF: [14, -2], hB: [10, 2] },
    chkWind: { hip: [-2, -24], lean: 28, fF: [16, 0], fB: [-6, 0], hF: [14, 18], hB: [8, 20] },
    chk: { hip: [-4, -22], lean: 36, fF: [45, -2], fB: [-2, 0], hF: [14, 22], hB: [6, 24] },
    jlp: { hip: [0, -44], lean: 10, fF: [10, -16], fB: [-4, -12], hF: [25, 8], hB: [6, 4] },
    jhp: { hip: [0, -44], lean: 22, fF: [8, -14], fB: [-6, -10], hF: [26, 16], hB: [4, 6], mouth: 1 },
    jlk: { hip: [0, -44], lean: -4, fF: [27, -12], fB: [-6, -16], hF: [12, -4], hB: [4, 0] },
    jhk: { hip: [0, -44], lean: -16, fF: [33, -2], fB: [-8, -20], hF: [6, -8], hB: [-6, 0], mouth: 1 },

    grab: { hip: [4, -44], lean: 12, hF: [22, -2], hB: [19, 2], fF: [17, 0] },
    toss: { hip: [-2, -44], lean: -22, hF: [-6, -26], hB: [-10, -22], fF: [12, 0], fB: [-16, 0], mouth: 1 },

    projWind: { hip: [-3, -40], lean: -6, hF: [-4, 9], hB: [-7, 10], fF: [14, 0], fB: [-14, 0], open: 1 },
    proj: { hip: [7, -40], lean: 18, hF: [31, 0], hB: [29, 4], fF: [21, 0], fB: [-14, 0], mouth: 1, open: 1 },
    rise: { hip: [2, -52], lean: -6, hF: [8, -34], hB: [4, 4], fF: [6, -10], fB: [-6, 2], mouth: 1 },
    spin: { hip: [0, -52], lean: 0, fF: [36, -46], fB: [-24, -30], hF: [12, -4], hB: [-12, 2] },
    rush: { hip: [9, -40], lean: 30, hF: [35, -3], hB: [-4, 9], fF: [22, 0], fB: [-18, 0], mouth: 1 },
    rush2: { hip: [9, -40], lean: 30, hF: [4, 9], hB: [35, -3], fF: [22, 0], fB: [-18, 0], mouth: 1 },
    dive: { hip: [0, -44], lean: -10, rot: 25, fF: [28, 4], fB: [-6, -18], hF: [4, -10], hB: [-8, -6], mouth: 1 },
    slam: { hip: [2, -30], lean: 30, fF: [18, 0], fB: [-14, 0], hF: [26, 26], hB: [20, 28], mouth: 1 },
    cmdGrab: { hip: [5, -42], lean: 16, hF: [24, -8], hB: [23, -1], fF: [19, 0], open: 1 },
    counter: { hip: [-2, -44], lean: -4, hF: [16, -12], hB: [14, -3], open: 1 },
    shoot: { hip: [-2, -45], lean: -18, fF: [31, -14], fB: [-6, 0], hF: [-10, 0], hB: [14, -6], mouth: 1 },
    bicycle: { hip: [0, -46], rot: -140, lean: 0, fF: [30, -30], fB: [-6, -14], hF: [-14, 6], hB: [12, 8], mouth: 1 },
    charge: { hip: [0, -38], lean: 10, hF: [8, 14], hB: [4, 14], fF: [16, 0], fB: [-16, 0], mouth: 1, open: 1 },

    win: { hip: [0, -45], lean: -4, head: -10, hF: [6, -30], hB: [-2, -28], fF: [10, 0], fB: [-10, 0], mouth: 1 },
    winCool: { hip: [0, -45], lean: -2, hF: [6, 6], hB: [10, 4], fF: [9, 0], fB: [-11, 0] },
    winPoint: { hip: [0, -45], lean: 0, hF: [26, -14], hB: [4, 10], fF: [12, 0], fB: [-10, 0], mouth: 1 },
    siu: { hip: [0, -50], lean: -10, head: -14, hF: [-4, 14], hB: [-14, 12], fF: [10, -2], fB: [-8, -2], mouth: 1, open: 1 },
    lose: { hip: [0, -26], lean: 40, head: 20, fF: [14, 0], fB: [-12, 0], hF: [8, 22], hB: [4, 24] },
  };
  for (const k in P) P[k] = Object.assign({}, BASE, P[k]);

  const mixArr = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  function mix(a, b, k) {
    if (k <= 0) return a;
    if (k >= 1) return b;
    const o = {};
    for (const key in BASE) {
      const va = a[key], vb = b[key];
      o[key] = Array.isArray(va) ? mixArr(va, vb, k) : va + (vb - va) * k;
    }
    o.open = k < 0.5 ? a.open : b.open;
    o.mouth = k < 0.5 ? a.mouth : b.mouth;
    return o;
  }

  // ---------- geometria ----------
  const add = (p, ang, len) => [p[0] + Math.sin(ang * D) * len, p[1] - Math.cos(ang * D) * len];

  function ik(root, target, a, b, bend) {
    let dx = target[0] - root[0], dy = target[1] - root[1];
    let d = Math.hypot(dx, dy) || 0.001;
    const max = a + b - 0.01, min = Math.abs(a - b) + 0.5;
    if (d > max) { dx *= max / d; dy *= max / d; d = max; }
    if (d < min) { dx *= min / d; dy *= min / d; d = min; }
    const base = Math.atan2(dy, dx);
    const A = Math.acos(SM.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
    const j = [root[0] + Math.cos(base + bend * A) * a, root[1] + Math.sin(base + bend * A) * a];
    return [j, [root[0] + dx, root[1] + dy]];
  }

  // Calcula as articulações (em coordenadas locais, virado para a direita).
  function solve(ch, pose) {
    const s = ch.body.size;
    const L = { thigh: 24 * s, shin: 24 * s, spine: 30 * s, neck: 5 * s, upper: 17 * s, fore: 16 * s };
    const hip = [pose.hip[0] * s, pose.hip[1] * s];
    const neck = add(hip, pose.lean, L.spine);
    const u = [Math.sin(pose.lean * D), -Math.cos(pose.lean * D)]; // eixo do tronco (para cima)
    const shF = [neck[0] - u[0] * 3 + 3, neck[1] - u[1] * 3];
    const shB = [neck[0] - u[0] * 3 - 4, neck[1] - u[1] * 3 + 1];
    const hipF = [hip[0] + 2.5, hip[1]], hipB = [hip[0] - 3, hip[1] + 1];
    const headBase = add(neck, pose.lean * 0.6 + pose.head * 0.3, L.neck);
    const headC = add(headBase, pose.lean * 0.4 + pose.head, 9 * s);
    const [elbF, handF] = ik(shF, [shF[0] + pose.hF[0] * s, shF[1] + pose.hF[1] * s], L.upper, L.fore, 1);
    const [elbB, handB] = ik(shB, [shB[0] + pose.hB[0] * s, shB[1] + pose.hB[1] * s], L.upper, L.fore, 1);
    const [kneeF, footF] = ik(hipF, [pose.fF[0] * s, pose.fF[1] * s], L.thigh, L.shin, -1);
    const [kneeB, footB] = ik(hipB, [pose.fB[0] * s, pose.fB[1] * s], L.thigh, L.shin, -1);
    const J = { hip, neck, shF, shB, hipF, hipB, headBase, headC, elbF, handF, elbB, handB, kneeF, footF, kneeB, footB, u };
    if (pose.rot) {
      const c = Math.cos(pose.rot * D), sn = Math.sin(pose.rot * D);
      for (const k in J) {
        if (k === 'u') continue;
        const p = J[k], x = p[0] - hip[0], y = p[1] - hip[1];
        J[k] = [hip[0] + x * c - y * sn, hip[1] + x * sn + y * c];
      }
      J.u = [u[0] * c - u[1] * sn, u[0] * sn + u[1] * c];
    }
    return J;
  }

  // ---------- primitivas ----------
  let ctx = null;
  let flat = null; // cor única (flash de dano / sombra)

  const col = (c) => flat || c;

  // membro cónico com contorno e sombreado em gradiente
  function limb(A, B, wA, wB, color, shade = true) {
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const len = Math.hypot(dx, dy) || 0.001;
    const nx = -dy / len, ny = dx / len;
    const ang = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.arc(A[0], A[1], wA / 2, ang + Math.PI / 2, ang - Math.PI / 2);
    ctx.lineTo(B[0] + nx * wB / 2 * -1, B[1] + ny * wB / 2 * -1);
    ctx.arc(B[0], B[1], wB / 2, ang - Math.PI / 2, ang + Math.PI / 2);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = flat ? flat : OUT;
    ctx.stroke();
    if (shade && !flat) {
      const g = ctx.createLinearGradient(A[0] + nx * wA / 2, A[1] + ny * wA / 2, A[0] - nx * wA / 2, A[1] - ny * wA / 2);
      g.addColorStop(0, SM.shade(color, 0.72));
      g.addColorStop(0.55, color);
      g.addColorStop(1, SM.shade(color, 1.18));
      ctx.fillStyle = g;
    } else ctx.fillStyle = col(color);
    ctx.fill();
  }

  function blob(p, r, color, outline = true) {
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    if (outline) { ctx.lineWidth = 2; ctx.strokeStyle = flat || OUT; ctx.stroke(); }
    ctx.fillStyle = col(color);
    ctx.fill();
  }

  function poly(pts, color, outline = true) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (outline) { ctx.lineWidth = 2; ctx.strokeStyle = flat || OUT; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.fillStyle = col(color);
    ctx.fill();
  }

  const lerpP = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

  // ---------- partes ----------
  function arm(J, ch, front) {
    const o = ch.outfit, b = ch.body.bulk;
    const sh = front ? J.shF : J.shB, el = front ? J.elbF : J.elbB, ha = front ? J.handF : J.handB;
    const skin = front ? ch.skin : SM.shade(ch.skin, 0.85);
    const dim = (c) => (front ? c : SM.shade(c, 0.85));
    const sleeve = o.sleeves; // 0 nada, 0.5 meia manga, 1 manga comprida
    limb(sh, el, 9 * b, 7.5 * b, sleeve > 0 && sleeve < 1 ? dim(o.top) : sleeve >= 1 ? dim(o.top) : skin);
    if (sleeve > 0 && sleeve < 1) {
      // meia manga: o resto do braço é pele
      const mid = lerpP(sh, el, 0.55);
      limb(mid, el, 7.8 * b, 7.5 * b, skin);
    }
    limb(el, ha, 7.5 * b, 6 * b, sleeve >= 1 ? dim(o.top) : skin);
    if (o.cuffs) limb(lerpP(el, ha, 0.75), ha, 6.5 * b, 6.5 * b, dim(o.cuffs), false);
    const fist = o.gloves ? dim(o.gloves) : skin;
    blob(ha, (J.open ? 3.6 : 4.4) * b, fist);
    if (o.wraps && !o.gloves) {
      ctx.fillStyle = col(dim(o.wraps));
      ctx.fillRect(ha[0] - 3 * b, ha[1] - 1, 6 * b, 2);
    }
  }

  function leg(J, ch, front) {
    const o = ch.outfit, b = ch.body.bulk;
    const hp = front ? J.hipF : J.hipB, kn = front ? J.kneeF : J.kneeB, ft = front ? J.footF : J.footB;
    const dim = (c) => (front ? c : SM.shade(c, 0.82));
    const skin = dim(ch.skin);
    const wide = o.pantsCut === 'gi' ? 1.25 : 1;
    limb(hp, kn, 12 * b * wide, 9.5 * b * wide, dim(o.pants));
    if (o.pantsCut === 'shorts') {
      const mid = lerpP(hp, kn, 0.8);
      limb(mid, kn, 9 * b, 8.5 * b, skin);
      limb(kn, ft, 8.5 * b, 6 * b, skin);
    } else {
      limb(kn, ft, 9.5 * b * wide, 7 * b * wide, dim(o.pants));
    }
    if (o.socks) limb(lerpP(kn, ft, 0.6), ft, 6.5 * b, 6.5 * b, dim(o.socks), false);
    // pé: perpendicular à canela, para a frente
    const sx = ft[0] - kn[0], sy = ft[1] - kn[1], sl = Math.hypot(sx, sy) || 1;
    const fx = sy / sl, fy = -sx / sl;
    const toe = [ft[0] + fx * 8 * ch.body.size, ft[1] + fy * 8 * ch.body.size];
    const heel = [ft[0] - fx * 2.5, ft[1] - fy * 2.5];
    if (o.shoes === 'bare') limb(heel, toe, 5.5, 4.5, skin);
    else {
      limb(heel, toe, 7, 6, dim(o.shoes));
      if (o.sole) limb([heel[0] + sx / sl * 2.5, heel[1] + sy / sl * 2.5], [toe[0] + sx / sl * 2.5, toe[1] + sy / sl * 2.5], 2.2, 2, dim(o.sole), false);
    }
  }

  function torso(J, ch) {
    const o = ch.outfit, b = ch.body.bulk, u = J.u;
    const n = [-u[1], u[0]]; // normal (para a frente quando de pé)
    const w = (p, k) => [p[0] + n[0] * k, p[1] + n[1] * k];
    const chest = lerpP(J.hip, J.neck, 0.72);
    const cw = 12 * b, ww = 8.5 * b, nw = 6 * b;
    const pts = [w(J.neck, nw), w(chest, cw + 0.5), w(J.hip, ww), w(J.hip, -ww - 1), w(chest, -cw), w(J.neck, -nw)];
    const topColor = o.top === null ? ch.skin : o.top;
    // pélvis / calções
    const pel = [w(J.hip, ww + 1), w([J.hip[0] - u[0] * 6, J.hip[1] - u[1] * 6], ww + 2), w([J.hip[0] - u[0] * 6, J.hip[1] - u[1] * 6], -ww - 2), w(J.hip, -ww - 1)];
    poly(pel, o.pants);
    // tronco com sombreado
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
    ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.quadraticCurveTo(pts[4][0], pts[4][1], pts[5][0], pts[5][1]);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = flat || OUT;
    ctx.stroke();
    if (!flat) {
      const g = ctx.createLinearGradient(...w(chest, cw), ...w(chest, -cw));
      g.addColorStop(0, SM.shade(topColor, 1.15));
      g.addColorStop(0.5, topColor);
      g.addColorStop(1, SM.shade(topColor, 0.7));
      ctx.fillStyle = g;
    } else ctx.fillStyle = flat;
    ctx.fill();
    if (flat) return;

    const line = (a, bb, c, lw = 1.2) => {
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(bb[0], bb[1]);
      ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.stroke();
    };
    const at = (k, side) => w(lerpP(J.hip, J.neck, k), side);
    if (o.top === null) {
      // tronco nu: peitorais e abdominais
      const d = SM.shade(ch.skin, 0.72);
      line(at(0.78, 1), at(0.62, 9 * b), d);
      line(at(0.62, 1), at(0.62, -6), d);
      for (const k of [0.45, 0.32, 0.2]) line(at(k, 5), at(k, -3), d, 0.9);
      line(at(0.6, 1), at(0.1, 1), d, 0.9);
    }
    if (o.style === 'gi') {
      // gola em V e cinto
      poly([at(1, 3), at(0.6, 4), at(1, -2)], SM.shade(ch.skin, 0.95), false);
      line(at(1, 4), at(0.55, 4), SM.shade(o.top, 0.6), 1.4);
      const bl = [at(0.1, ww + 1), at(0.18, ww + 1), at(0.18, -ww - 1), at(0.1, -ww - 1)];
      poly(bl, o.belt || '#111');
      limb(at(0.14, ww), [at(0.14, ww)[0] + 2, at(0.14, ww)[1] + 8], 2.4, 2, o.belt || '#111', false);
    }
    if (o.style === 'tank') {
      line(at(1, 5), at(0.82, 3), SM.shade(o.top, 0.6), 1.2);
    }
    if (o.style === 'jersey') {
      // camisola de futebol com risca e número
      poly([at(0.95, 3), at(0.15, 4), at(0.15, 1), at(0.95, 0)], o.stripe, false);
      ctx.fillStyle = o.stripe;
      ctx.font = `bold ${8 * b}px ${SM.FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const c = at(0.55, -3.5);
      ctx.fillText(o.number || '7', c[0], c[1]);
    }
    if (o.style === 'hoodie') {
      // capuz atrás do pescoço e cordões
      limb(at(1.02, -6), at(0.88, -9), 7, 6, SM.shade(o.top, 0.85));
      line(at(0.95, 4), at(0.75, 5), '#eee', 1);
      line(at(0.95, 2), at(0.73, 2.5), '#eee', 1);
      line(at(0.2, ww), at(0.2, -ww), SM.shade(o.top, 0.6), 1.5);
    }
    if (o.style === 'jacket') {
      line(at(1, 3), at(0.1, 4.5), SM.shade(o.top, 0.55), 1.4);
      poly([at(1, 3), at(0.7, 5), at(1, 0)], o.inner || '#eee', false);
    }
    if (o.chain) {
      ctx.beginPath();
      const a = at(0.96, 5), m = at(0.78, 4), c2 = at(0.96, -3);
      ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(m[0], m[1], c2[0], c2[1]);
      ctx.strokeStyle = o.chain; ctx.lineWidth = 1.2; ctx.stroke();
    }
    if (o.belt && o.style !== 'gi') line(at(0.08, ww + 1), at(0.08, -ww - 1), o.belt, 2);
  }

  function head(J, ch, pose, t) {
    const s = ch.body.size;
    const c = J.headC;
    const tilt = (pose.lean * 0.4 + pose.head + (pose.rot || 0)) * D;
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.rotate(tilt);
    ctx.scale(s, s);
    const skin = col(ch.skin), dark = col(SM.shade(ch.skin, 0.7)), hairC = col(ch.hairColor);
    const R = (x, y, w, h, color) => { ctx.fillStyle = col(color); ctx.fillRect(x, y, w, h); };
    const stroke = () => { ctx.lineWidth = 2 / s; ctx.strokeStyle = flat || OUT; ctx.stroke(); };
    const fill = (color) => { ctx.fillStyle = col(color); ctx.fill(); };

    // cabelo atrás da cabeça
    if (ch.hair === 'afro') { ctx.beginPath(); ctx.arc(-2, -4, 13.5, 0, Math.PI * 2); stroke(); fill(ch.hairColor); }
    if (ch.hair === 'dreads') {
      for (let i = 0; i < 5; i++) {
        const sw = Math.sin(t * 0.12 + i) * 1.5;
        ctx.beginPath();
        ctx.moveTo(-6 + i * 1.2, -4);
        ctx.quadraticCurveTo(-10 - i + sw, 6, -9 - i * 1.6 + sw, 15 + i);
        ctx.lineWidth = 3.2; ctx.strokeStyle = flat || OUT; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 2.2; ctx.strokeStyle = hairC; ctx.stroke();
        if (i % 2 === 0) R(-10 - i * 1.6 + sw, 10 + i, 2.2, 1.6, ch.outfit.accent || '#f0c020');
      }
    }
    if (ch.band) {
      // fita da testa a esvoaçar
      const w1 = Math.sin(t * 0.2) * 2, w2 = Math.sin(t * 0.2 + 1) * 3;
      ctx.beginPath();
      ctx.moveTo(-7, -5);
      ctx.quadraticCurveTo(-14, -6 + w1, -20, -3 + w2);
      ctx.quadraticCurveTo(-14, -2 + w1, -7, -2);
      ctx.closePath();
      stroke(); fill(ch.band);
    }

    // cabeça: crânio + maxilar
    ctx.beginPath();
    ctx.ellipse(0, -1, 8, 9.5, 0, 0, Math.PI * 2);
    ctx.moveTo(8, 1);
    stroke(); fill(ch.skin);
    ctx.beginPath();
    ctx.moveTo(-3, 4); ctx.lineTo(4, 9); ctx.lineTo(8.5, 7); ctx.lineTo(9, 2); ctx.lineTo(7, -1);
    ctx.lineTo(-3, -1); ctx.closePath();
    stroke(); fill(ch.skin);
    ctx.beginPath(); ctx.ellipse(0, -1, 7, 8.6, 0, 0, Math.PI * 2); fill(ch.skin);
    // sombra sob o queixo e orelha
    ctx.beginPath(); ctx.ellipse(-2.5, 0.5, 2.2, 3, 0, 0, Math.PI * 2); stroke(); fill(SM.shade(ch.skin, 0.88));
    R(-3.2, -0.5, 1.2, 2.2, dark);
    // nariz
    ctx.beginPath(); ctx.moveTo(8, -1.5); ctx.lineTo(10.6, 2.6); ctx.lineTo(8, 3.4); ctx.closePath();
    ctx.lineWidth = 1.2; ctx.strokeStyle = flat || OUT; ctx.stroke(); fill(ch.skin);
    // olho e sobrancelha
    if (!flat) {
      const hurt = pose.head < -10 || pose.mouth && pose.lean < -10;
      if (hurt) {
        ctx.beginPath(); ctx.moveTo(3.5, -3.5); ctx.lineTo(6.5, -1.5); ctx.moveTo(3.5, -1.5); ctx.lineTo(6.5, -3.5);
        ctx.strokeStyle = OUT; ctx.lineWidth = 1.1; ctx.stroke();
      } else {
        R(3.6, -3.4, 3.4, 2.3, '#fff');
        R(5.4, -3.3, 1.6, 2.2, ch.eyes || '#2a1a10');
        R(6.0, -3.3, 0.6, 0.6, '#fff');
      }
      ctx.beginPath(); ctx.moveTo(2.8, -6.2); ctx.lineTo(7.8, -4.4);
      ctx.strokeStyle = hairC; ctx.lineWidth = 1.6; ctx.stroke();
      // boca
      if (pose.mouth) { ctx.beginPath(); ctx.ellipse(6.6, 5, 1.6, 1.8, 0, 0, Math.PI * 2); fill('#3a0a0a'); R(5.6, 3.6, 2.2, 0.8, '#fff'); }
      else { ctx.beginPath(); ctx.moveTo(5, 5.2); ctx.lineTo(8, 4.6); ctx.strokeStyle = SM.shade(ch.skin, 0.5); ctx.lineWidth = 1; ctx.stroke(); }
    }
    // barba
    if (ch.beard) {
      ctx.beginPath();
      ctx.moveTo(-2.5, 1); ctx.lineTo(-1, 6); ctx.lineTo(4, 9.6); ctx.lineTo(8.8, 7.6); ctx.lineTo(9, 5.6);
      ctx.lineTo(7.4, 6.2); ctx.lineTo(5, 3.8); ctx.lineTo(1, 3.4); ctx.closePath();
      fill(ch.beard === true ? ch.hairColor : ch.beard);
      if (ch.mustache !== false) { ctx.beginPath(); ctx.moveTo(4.6, 3.6); ctx.lineTo(9, 3.2); ctx.lineTo(8.6, 4.6); ctx.lineTo(5, 4.8); ctx.closePath(); fill(ch.hairColor); }
    }

    // cabelo por cima
    const cap = (color) => {
      ctx.beginPath();
      ctx.moveTo(-8, 1);
      ctx.bezierCurveTo(-9.5, -12, 6, -15, 8.6, -4);
      ctx.lineTo(6, -6);
      ctx.lineTo(2, -6.4);
      ctx.lineTo(-3.6, -4.5);
      ctx.lineTo(-4.5, 0.5);
      ctx.closePath();
      stroke(); fill(color);
    };
    switch (ch.hair) {
      case 'short': cap(ch.hairColor); break;
      case 'buzz':
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.bezierCurveTo(-9, -12, 5, -13.5, 7.8, -5.5); ctx.lineTo(5, -7.2); ctx.lineTo(-3.4, -5); ctx.lineTo(-4.4, 0); ctx.closePath();
        fill(ch.hairColor);
        break;
      case 'flattop':
        ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(-8.6, -17); ctx.lineTo(6.4, -17); ctx.lineTo(7.4, -6); ctx.lineTo(4, -6.5); ctx.lineTo(-3.6, -4.5); ctx.lineTo(-4.4, 1); ctx.closePath();
        stroke(); fill(ch.hairColor);
        break;
      case 'afro':
        ctx.beginPath(); ctx.arc(-1, -6, 11, Math.PI * 0.95, Math.PI * 2.08); ctx.lineTo(4, -5.5); ctx.lineTo(-3.6, -4.5); ctx.lineTo(-5, 2); ctx.closePath();
        fill(ch.hairColor);
        break;
      case 'dreads': cap(ch.hairColor); break;
      case 'cap': {
        const cc = ch.outfit.capColor || '#e83030';
        ctx.beginPath(); ctx.moveTo(-8.4, -2); ctx.bezierCurveTo(-9, -15, 7, -15, 8, -4.6); ctx.closePath();
        stroke(); fill(cc);
        ctx.beginPath(); ctx.moveTo(6, -6.4); ctx.lineTo(15, -4.6); ctx.lineTo(14.4, -3.2); ctx.lineTo(6.4, -3.6); ctx.closePath();
        stroke(); fill(SM.shade(cc, 0.75));
        R(-1, -12.6, 2.4, 1.6, '#fff');
        R(-8.6, -2.6, 3, 4, ch.hairColor);
        break;
      }
      case 'bald':
        if (!flat) { ctx.beginPath(); ctx.ellipse(1, -7, 3.5, 1.6, -0.3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill(); }
        break;
    }
    if (ch.band) {
      ctx.beginPath(); ctx.moveTo(-7.8, -5.8); ctx.lineTo(7.6, -6.6); ctx.lineTo(7.8, -3.8); ctx.lineTo(-7.8, -2.4); ctx.closePath();
      stroke(); fill(ch.band);
    }
    if (ch.glasses && !flat) {
      R(3, -4, 6, 2.6, '#101018');
      R(-3, -3.4, 6.5, 0.9, '#101018');
      R(4, -3.6, 2, 0.8, 'rgba(255,255,255,0.5)');
    }
    ctx.restore();
  }

  // ---------- desenho completo ----------
  // opts: { flash: cor única, alpha, t (frames, para animar fitas/cabelo) }
  function draw(c, ch, pose, x, y, face, opts = {}) {
    ctx = c;
    flat = opts.flash || null;
    const J = solve(ch, pose);
    J.open = pose.open;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face, 1);
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    arm(J, ch, false);
    leg(J, ch, false);
    leg(J, ch, true);
    torso(J, ch);
    // pescoço
    limb(J.neck, J.headBase, 7 * ch.body.bulk, 6.5 * ch.body.bulk, ch.skin);
    head(J, ch, pose, opts.t || 0);
    arm(J, ch, true);
    ctx.restore();
    flat = null;
    return J;
  }

  // posição (em coordenadas do mundo) de uma articulação para efeitos/projéteis
  function point(ch, pose, x, y, face, joint) {
    const J = solve(ch, pose);
    const p = J[joint];
    return [x + p[0] * face, y + p[1]];
  }

  // retrato em busto, desenhado uma vez numa canvas própria (alta resolução)
  const portraits = new Map();
  function portrait(ch, pose = 'winCool') {
    const key = ch.id + pose;
    if (!portraits.has(key)) {
      const cv = document.createElement('canvas');
      cv.width = 120; cv.height = 120;
      const g = cv.getContext('2d');
      g.scale(2.6, 2.6);
      draw(g, ch, P[pose], 20, 118 / 2.6 + 52, 1, { t: 0 });
      portraits.set(key, cv);
    }
    return portraits.get(key);
  }

  return { POSES: P, mix, draw, solve, point, portrait };
})();
