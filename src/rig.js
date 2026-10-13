'use strict';
// Boneco articulado desenhado em pixel art. Cada pose é um conjunto de ângulos (graus) medidos
// a partir da vertical para baixo; positivo = para a frente. Desenha-se virado para a direita
// e espelha-se com `face`.

SM.Rig = (() => {
  const D = Math.PI / 180;
  const BASE = { lean: 0, hF: 0, kF: 0, hB: 0, kB: 0, sF: 0, eF: 0, sB: 0, eB: 0, dy: 0, rot: 0 };

  const POSES = {
    idle: { lean: 4, hF: 12, kF: -14, hB: -12, kB: 6, sF: 35, eF: 85, sB: 20, eB: 95 },
    walkA: { lean: 8, hF: 28, kF: -8, hB: -22, kB: 18, sF: 30, eF: 80, sB: 10, eB: 90 },
    walkB: { lean: 8, hF: -18, kF: 22, hB: 26, kB: -6, sF: 30, eF: 80, sB: 10, eB: 90, dy: -1 },
    air: { lean: 0, hF: 45, kF: -80, hB: 5, kB: -50, sF: 130, eF: 30, sB: 150, eB: 20 },
    fall: { lean: -4, hF: 20, kF: -20, hB: -10, kB: -10, sF: 100, eF: 20, sB: 120, eB: 20 },
    jabWind: { lean: 6, hF: 25, kF: -12, hB: -25, kB: 10, sF: 40, eF: 110, sB: 30, eB: 100 },
    jab: { lean: 16, hF: 28, kF: -10, hB: -28, kB: 8, sF: 92, eF: 0, sB: 25, eB: 100 },
    jab2: { lean: 18, hF: 28, kF: -10, hB: -28, kB: 8, sF: 30, eF: 100, sB: 92, eB: 0 },
    upper: { lean: -8, hF: 10, kF: 0, hB: -20, kB: 5, sF: 165, eF: 10, sB: 10, eB: 60, dy: -2 },
    kickWind: { lean: -5, hF: 60, kF: -90, hB: -8, kB: 4, sF: 40, eF: 60, sB: -20, eB: 40 },
    kick: { lean: -22, hF: 96, kF: 0, hB: -12, kB: 4, sF: 50, eF: 50, sB: -30, eB: 30 },
    airPunch: { lean: 15, hF: 40, kF: -70, hB: 0, kB: -50, sF: 80, eF: 0, sB: 120, eB: 30 },
    airKick: { lean: -10, hF: 70, kF: 0, hB: -20, kB: -70, sF: 120, eF: 20, sB: 140, eB: 20 },
    grab: { lean: 18, hF: 25, kF: -10, hB: -25, kB: 10, sF: 85, eF: 10, sB: 75, eB: 15 },
    throw: { lean: -18, hF: 20, kF: -5, hB: -20, kB: 5, sF: 170, eF: 10, sB: 150, eB: 20 },
    block: { lean: 12, hF: 30, kF: -45, hB: -30, kB: -15, sF: 105, eF: 125, sB: 95, eB: 130, dy: 3 },
    hurt: { lean: -24, hF: 14, kF: -12, hB: -18, kB: 10, sF: -30, eF: 30, sB: -55, eB: 30 },
    cast: { lean: 12, hF: 30, kF: -15, hB: -30, kB: 10, sF: 88, eF: 0, sB: 82, eB: 6 },
    castUp: { lean: -6, hF: 15, kF: -10, hB: -15, kB: 10, sF: 175, eF: 0, sB: 170, eB: 5 },
    charge: { lean: 6, hF: 35, kF: -50, hB: -35, kB: -15, sF: 25, eF: 70, sB: 20, eB: 75, dy: 4 },
    dash: { lean: 38, hF: 40, kF: -60, hB: -40, kB: 30, sF: -70, eF: 10, sB: -80, eB: 10 },
    taunt: { lean: -6, hF: 15, kF: -5, hB: -15, kB: 5, sF: 175, eF: 0, sB: 40, eB: 90 },
    win: { lean: -4, hF: 12, kF: -5, hB: -12, kB: 5, sF: 165, eF: 15, sB: 160, eB: 15 },
    down: { lean: 0, hF: 10, kF: -10, hB: -5, kB: 5, sF: 160, eF: 10, sB: 150, eB: 10, rot: -90 },
  };
  for (const k in POSES) POSES[k] = Object.assign({}, BASE, POSES[k]);

  function lerp(a, b, k) {
    const o = {};
    for (const key in BASE) o[key] = a[key] + (b[key] - a[key]) * k;
    return o;
  }

  const pals = new Map();
  function palette(ch) {
    if (!pals.has(ch.id)) {
      pals.set(ch.id, {
        S: ch.skin, s: SM.shade(ch.skin, 0.78), H: ch.hairColor, C: ch.shirt, c: SM.shade(ch.shirt, 0.72),
        P: ch.pants, p: SM.shade(ch.pants, 0.72), B: '#1e140c', K: ch.accent || '#ffffff', N: ch.band || '#1c2c5c',
        M: '#c8c8d4', E: '#140a08', W: '#ffffff',
      });
    }
    return pals.get(ch.id);
  }
  const flat = col => ({ S: col, s: col, H: col, C: col, c: col, P: col, p: col, B: col, K: col, N: col, M: col, E: col, W: col });

  function circle(ctx, cx, cy, r, col) {
    ctx.fillStyle = col;
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.round(Math.sqrt(r * r - dy * dy));
      ctx.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2, 1);
    }
  }

  function head(ctx, ch, c, hx, hy, face, t) {
    hx = Math.round(hx);
    hy = Math.round(hy);
    const r = (lx, ly, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(face > 0 ? hx + lx : hx - lx - w, hy + ly, w, h);
    };
    const hair = ch.hair;
    const band = hair !== 'cap' && hair !== 'antenna';
    // atrás da cabeça
    if (hair === 'afro') circle(ctx, hx - face, hy - 4, 8, c.H);
    if (hair === 'dreads') { r(-7, -3, 2, 11, c.H); r(-4, 0, 2, 10, c.H); }
    if (band) {
      const w = Math.round(Math.sin(t * 0.25) * 1.5);
      r(-9, -3 + w, 4, 2, c.N);
      r(-12, -2 + w * 2, 3, 2, c.N);
    }
    // cara
    r(-5, -5, 10, 10, c.S);
    r(-5, 4, 10, 1, c.s);
    r(2, -1, 2, 2, c.W);
    r(3, -1, 1, 2, c.E);
    r(3, 2, 2, 1, c.s);
    if (ch.beard) r(0, 2, 5, 3, c.H);
    switch (hair) {
      case 'short': r(-5, -6, 10, 3, c.H); r(-5, -3, 3, 4, c.H); break;
      case 'flattop': r(-5, -11, 10, 7, c.H); r(-5, -4, 2, 3, c.H); break;
      case 'afro': r(-5, -7, 10, 3, c.H); r(-5, -4, 2, 4, c.H); break;
      case 'buzz': r(-5, -6, 10, 2, c.H); r(-5, -4, 2, 2, c.H); break;
      case 'cap': r(-5, -8, 10, 4, c.K); r(4, -5, 5, 2, c.K); r(-5, -4, 2, 2, c.H); break;
      case 'dreads': r(-5, -7, 10, 3, c.H); r(-6, -4, 3, 3, c.H); break;
      case 'antenna': r(0, -9, 1, 4, c.H); r(-1, -11, 3, 2, c.K); r(1, -1, 4, 2, c.K); break;
    }
    if (band) { r(-5, -4, 10, 2, c.N); r(1, -4, 4, 2, c.M); }
  }

  // Desenha o lutador com os pés em (x, y).
  function draw(ctx, ch, pose, x, y, face, opt = {}) {
    const c = opt.flat ? flat(opt.flat) : palette(ch);
    const rot = pose.rot * D, cr = Math.cos(rot), sr = Math.sin(rot);
    const pivot = -5;
    const P = (px, py) => {
      py += pose.dy;
      if (rot) {
        const ry = py - pivot;
        const nx = px * cr - ry * sr;
        py = px * sr + ry * cr + pivot;
        px = nx;
      }
      return [x + px * face, y + py];
    };
    const seg = (a, b, th, col) => {
      const [ax, ay] = P(a[0], a[1]), [bx, by] = P(b[0], b[1]);
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
      const o = Math.floor(th / 2);
      ctx.fillStyle = col;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        ctx.fillRect(Math.round(ax + (bx - ax) * t) - o, Math.round(ay + (by - ay) * t) - o, th, th);
      }
    };
    const add = (p, a, l) => [p[0] + Math.sin(a * D) * l, p[1] + Math.cos(a * D) * l];

    const up = 180 - pose.lean;
    const hip = [0, -17];
    const neck = add(hip, up, 13);
    const sh = add(neck, up, -2);
    const hc = add(neck, up, 6);
    const kneeF = add(hip, pose.hF, 9), footF = add(kneeF, pose.hF + pose.kF, 8);
    const kneeB = add(hip, pose.hB, 9), footB = add(kneeB, pose.hB + pose.kB, 8);
    const elbF = add(sh, pose.sF, 7), handF = add(elbF, pose.sF + pose.eF, 7);
    const elbB = add(sh, pose.sB, 7), handB = add(elbB, pose.sB + pose.eB, 7);
    const shoe = (foot, col) => seg([foot[0], foot[1] - 1], [foot[0] + 3, foot[1] - 1], 3, col);

    seg(hip, kneeB, 4, c.p); seg(kneeB, footB, 4, c.p); shoe(footB, c.B);
    seg(sh, elbB, 3, c.c); seg(elbB, handB, 3, c.s); seg(handB, handB, 4, c.s);
    seg(hip, neck, 8, c.C); seg(hip, add(hip, up, 2), 8, c.P);
    seg(hip, kneeF, 4, c.P); seg(kneeF, footF, 4, c.P); shoe(footF, c.B);
    const [hx, hy] = P(hc[0], hc[1]);
    head(ctx, ch, c, hx, hy, face, opt.t || 0);
    seg(sh, elbF, 3, c.C); seg(elbF, handF, 3, c.S); seg(handF, handF, 4, c.S);
  }

  const portraits = new Map();
  function portrait(ch) {
    if (!portraits.has(ch.id)) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 16;
      head(cv.getContext('2d'), ch, palette(ch), 8, 9, 1, 0);
      portraits.set(ch.id, cv);
    }
    return portraits.get(ch.id);
  }

  return { POSES, lerp, draw, portrait, circle };
})();
