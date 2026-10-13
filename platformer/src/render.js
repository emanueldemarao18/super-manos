'use strict';
// Desenho procedural em pixel art: manos, inimigos, tiles, cenário e texto.

SM.R = (() => {
  const T = SM.T;
  let ctx = null;

  const px = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };

  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };

  // ---------- texto ----------
  const text = (s, x, y, color = '#fff', align = 'left', size = 8) => {
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000';
    ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1);
    ctx.fillStyle = color;
    ctx.fillText(s, Math.round(x), Math.round(y));
  };

  // ---------- manos ----------
  // Desenha um mano com 12 px de largura e 16 (pequeno) ou 24 (grande) de altura.
  // facing: 1 direita, -1 esquerda. pose: 'stand' | 'walk0' | 'walk1' | 'jump' | 'skid' | 'dead'
  const mano = (ch, x, y, big, facing, pose) => {
    ctx.save();
    ctx.translate(Math.round(x) + 6, Math.round(y));
    if (facing < 0) ctx.scale(-1, 1);
    const P = (dx, dy, w, h, c) => px(dx - 6, dy, w, h, c);
    const skin = ch.skin;
    const skinD = shade(skin, 0.75);
    const hairC = ch.hairColor;

    const headH = 8;
    const bodyH = big ? 8 : 4;
    const legH = big ? 8 : 4;
    const bodyY = headH;
    const legY = headH + bodyH;

    // --- pernas ---
    const shoe = '#2a1a10';
    if (pose === 'jump') {
      P(2, legY, 4, legH - 2, ch.pants);
      P(7, legY, 4, legH - 3, ch.pants);
      P(1, legY + legH - 2, 5, 2, shoe);
      P(8, legY + legH - 3, 4, 2, shoe);
    } else if (pose === 'walk0') {
      P(1, legY, 4, legH - 1, ch.pants);
      P(7, legY, 4, legH - 2, ch.pants);
      P(0, legY + legH - 1, 5, 1, shoe);
      P(8, legY + legH - 2, 4, 2, shoe);
    } else if (pose === 'walk1') {
      P(3, legY, 6, legH - 1, ch.pants);
      P(3, legY + legH - 1, 7, 1, shoe);
    } else {
      P(2, legY, 4, legH - 1, ch.pants);
      P(6, legY, 4, legH - 1, ch.pants);
      P(1, legY + legH - 1, 5, 1, shoe);
      P(6, legY + legH - 1, 5, 1, shoe);
    }

    // --- tronco ---
    P(2, bodyY, 8, bodyH, ch.shirt);
    P(2, bodyY + bodyH - 1, 8, 1, shade(ch.shirt, 0.7));
    if (big) P(5, bodyY + 2, 2, 2, ch.accent); // estampa da camisola
    // braços
    if (pose === 'jump') {
      P(9, bodyY - 3, 2, 4, ch.shirt);
      P(9, bodyY - 5, 2, 2, skin);
      P(0, bodyY, 2, 3, ch.shirt);
    } else if (pose === 'skid') {
      P(10, bodyY, 2, 2, ch.shirt);
      P(11, bodyY - 1, 1, 2, skin);
      P(0, bodyY + 1, 2, 2, ch.shirt);
    } else {
      const swing = pose === 'walk0' ? 1 : pose === 'walk1' ? -1 : 0;
      P(0, bodyY + 1 + swing, 2, bodyH - 1, ch.shirt);
      P(0, bodyY + bodyH + swing, 2, 2, skin);
      P(10, bodyY + 1 - swing, 2, bodyH - 1, ch.shirt);
      P(10, bodyY + bodyH - swing, 2, 2, skin);
    }

    // --- cabeça ---
    P(2, 1, 8, 7, skin);
    P(10, 4, 1, 2, skin); // nariz
    P(1, 3, 1, 3, skinD); // orelha
    // olhos e boca
    if (pose === 'dead') {
      P(6, 3, 1, 1, '#000'); P(8, 3, 1, 1, '#000');
      P(7, 4, 1, 1, '#000'); P(6, 5, 1, 1, '#000'); P(8, 5, 1, 1, '#000');
    } else {
      P(7, 3, 2, 2, '#fff');
      P(8, 3, 1, 2, '#000');
    }
    if (ch.beard) {
      P(3, 5, 7, 3, hairC);
      P(7, 6, 3, 1, '#c84040');
    } else {
      P(7, 6, 3, 1, shade(skin, 0.55));
    }

    // --- cabelo ---
    switch (ch.hair) {
      case 'short':
        P(2, 0, 8, 2, hairC); P(2, 2, 2, 2, hairC);
        break;
      case 'buzz':
        P(2, 1, 8, 1, hairC); P(2, 2, 1, 2, hairC);
        break;
      case 'flattop':
        P(2, -3, 8, 4, hairC); P(2, 1, 2, 2, hairC);
        break;
      case 'afro':
        P(0, -4, 12, 5, hairC); P(0, 1, 3, 4, hairC); P(1, -5, 10, 1, hairC);
        break;
      case 'dreads':
        P(2, -1, 8, 2, hairC);
        P(1, 1, 2, 7, hairC); P(0, 2, 1, 6, hairC);
        P(3, 1, 1, 2, hairC);
        P(0, 5, 1, 1, ch.accent); // contas nas tranças
        break;
      case 'cap':
        P(2, -1, 8, 3, ch.accent);
        P(8, 1, 4, 1, shade(ch.accent, 0.7)); // pala
        P(2, 2, 1, 2, hairC);
        P(4, 0, 2, 1, '#fff');
        break;
    }
    ctx.restore();
  };

  // ---------- inimigos e itens ----------
  // "Bicho": cogumelo zangado
  const bicho = (x, y, frame, squashed, theme) => {
    const body = theme === 'cave' ? '#3c78c8' : theme === 'night' ? '#7a3aa0' : '#a0521c';
    const dark = shade(body, 0.6);
    if (squashed) {
      px(x, y + 10, 16, 6, body);
      px(x + 3, y + 11, 3, 2, '#fff'); px(x + 10, y + 11, 3, 2, '#fff');
      return;
    }
    px(x + 2, y, 12, 4, body);
    px(x, y + 4, 16, 6, body);
    px(x + 1, y + 2, 2, 2, body); px(x + 13, y + 2, 2, 2, body);
    // sobrancelhas zangadas e olhos
    px(x + 3, y + 4, 4, 1, '#000'); px(x + 9, y + 4, 4, 1, '#000');
    px(x + 4, y + 5, 3, 3, '#fff'); px(x + 9, y + 5, 3, 3, '#fff');
    px(x + 5, y + 6, 2, 2, '#000'); px(x + 9, y + 6, 2, 2, '#000');
    px(x + 4, y + 10, 8, 3, '#f0d0a0');
    px(x + 2, y + 9, 12, 1, dark);
    if (frame) {
      px(x, y + 13, 6, 3, '#000'); px(x + 11, y + 14, 5, 2, '#000');
    } else {
      px(x + 1, y + 14, 5, 2, '#000'); px(x + 10, y + 13, 6, 3, '#000');
    }
  };

  // Tartaruga: 16x24, ou carapaça 16x14
  const tartaruga = (x, y, facing, frame, shell) => {
    const green = '#20a040', light = '#80e070', skin = '#f0c060';
    if (shell) {
      px(x + 1, y + 2, 14, 10, green);
      px(x + 3, y, 10, 2, green);
      px(x + 4, y + 3, 8, 6, light);
      px(x + 7, y + 3, 2, 6, green);
      px(x, y + 10, 16, 3, '#fff');
      return;
    }
    ctx.save();
    ctx.translate(Math.round(x) + 8, Math.round(y));
    if (facing > 0) ctx.scale(-1, 1);
    const P = (dx, dy, w, h, c) => px(dx - 8, dy, w, h, c);
    P(0, 2, 5, 8, skin); P(0, 4, 2, 2, '#fff'); P(1, 4, 1, 2, '#000');
    P(3, 8, 3, 6, skin);
    P(4, 10, 11, 10, green); P(6, 8, 7, 2, green);
    P(6, 11, 7, 6, light); P(9, 11, 1, 6, green);
    P(4, 19, 12, 2, '#fff');
    if (frame) { P(4, 21, 4, 3, skin); P(11, 21, 4, 3, skin); }
    else { P(6, 21, 4, 3, skin); P(12, 21, 3, 3, skin); }
    ctx.restore();
  };

  const coin = (x, y, t) => {
    const ph = Math.floor(t / 8) % 4;
    const w = [8, 6, 2, 6][ph];
    px(x + 8 - w / 2, y + 2, w, 12, '#f8c800');
    if (w > 2) px(x + 8 - w / 2 + 1, y + 3, Math.max(1, w / 2 - 1), 10, '#fff4a0');
    px(x + 8 - w / 2, y + 13, w, 1, '#a07000');
  };

  // Pastel de nata — o power-up
  const pastel = (x, y) => {
    px(x + 1, y + 6, 14, 10, '#c88030');
    px(x, y + 8, 16, 6, '#c88030');
    px(x + 3, y + 5, 10, 8, '#f8d860');
    px(x + 5, y + 6, 3, 2, '#7a3a10'); px(x + 9, y + 9, 3, 2, '#7a3a10');
    px(x + 6, y + 10, 2, 1, '#7a3a10');
    px(x + 2, y + 15, 12, 1, '#7a4010');
  };

  // ---------- tiles ----------
  const tile = (ch, x, y, theme, t) => {
    const g = SM.THEMES[theme].ground;
    switch (ch) {
      case '#': // chão
        px(x, y, T, T, g[0]);
        px(x, y, T, 1, g[1]); px(x, y, 1, T, g[1]);
        px(x + T - 1, y, 1, T, g[2]); px(x, y + T - 1, T, 1, g[2]);
        px(x + 3, y + 4, 2, 2, g[2]); px(x + 10, y + 9, 2, 2, g[2]);
        break;
      case 'B': // tijolo
        px(x, y, T, T, g[0]);
        px(x, y, T, 1, g[1]);
        px(x, y + 7, T, 1, '#000'); px(x, y + 15, T, 1, '#000');
        px(x + 7, y, 1, 7, '#000'); px(x + 3, y + 8, 1, 7, '#000'); px(x + 11, y + 8, 1, 7, '#000');
        break;
      case '?':
      case 'M': { // bloco de pergunta (M esconde um pastel)
        const glow = ['#f8b800', '#f8d040', '#fff080', '#f8d040'][Math.floor(t / 10) % 4];
        px(x, y, T, T, '#c06000');
        px(x + 1, y + 1, T - 2, T - 2, glow);
        px(x + 1, y + 1, 1, 1, '#c06000'); px(x + 14, y + 1, 1, 1, '#c06000');
        px(x + 1, y + 14, 1, 1, '#c06000'); px(x + 14, y + 14, 1, 1, '#c06000');
        px(x + 5, y + 3, 6, 2, '#c06000'); px(x + 10, y + 5, 2, 3, '#c06000');
        px(x + 7, y + 8, 3, 2, '#c06000'); px(x + 7, y + 12, 2, 2, '#c06000');
        break;
      }
      case 'X': // bloco usado
        px(x, y, T, T, '#7c3c10');
        px(x + 1, y + 1, T - 2, T - 2, '#a05828');
        px(x + 2, y + 2, 1, 1, '#000'); px(x + 13, y + 2, 1, 1, '#000');
        px(x + 2, y + 13, 1, 1, '#000'); px(x + 13, y + 13, 1, 1, '#000');
        break;
      case 'K': // pedra dura (escadas)
        px(x, y, T, T, g[2]);
        px(x + 1, y + 1, T - 3, T - 3, g[0]);
        px(x + 2, y + 2, T - 6, T - 6, g[1]);
        px(x + 4, y + 4, T - 8, T - 8, g[0]);
        break;
      case '=': // plataforma / ponte
        px(x, y, T, 6, '#e0a060');
        px(x, y, T, 1, '#fff0c0');
        px(x, y + 5, T, 1, '#704010');
        px(x + 7, y + 1, 2, 4, '#704010');
        break;
      case '[': case ']': { // topo do cano
        const left = ch === '[';
        px(x, y, T, T, '#109010');
        px(x + (left ? 0 : 0), y, T, 2, '#000');
        if (left) { px(x, y, 1, T, '#000'); px(x + 3, y + 2, 3, 13, '#80f080'); }
        else { px(x + T - 1, y, 1, T, '#000'); px(x + 10, y + 2, 4, 13, '#0a600a'); }
        px(x, y + T - 1, T, 1, '#000');
        break;
      }
      case '(': case ')': { // corpo do cano
        const left = ch === '(';
        if (left) {
          px(x + 2, y, 14, T, '#109010');
          px(x + 2, y, 1, T, '#000'); px(x + 5, y, 3, T, '#80f080');
        } else {
          px(x, y, 14, T, '#109010');
          px(x + 13, y, 1, T, '#000'); px(x + 8, y, 4, T, '#0a600a');
        }
        break;
      }
      case '^': // espinhos
        for (let i = 0; i < 4; i++) {
          px(x + i * 4 + 1, y + 8, 2, 8, '#c8c8d8');
          px(x + i * 4 + 1, y + 4, 2, 4, '#e8e8f8');
          px(x + i * 4 + 1, y + 14, 3, 2, '#606070');
        }
        break;
    }
  };

  // ---------- cenário ----------
  const hill = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x + w / 2, y - h, x + w, y + h);
    ctx.fill();
  };

  const cloud = (x, y, c) => {
    px(x + 6, y, 12, 4, c);
    px(x, y + 4, 28, 8, c);
    px(x + 16, y + 2, 10, 4, c);
  };

  const background = (theme, camX, t) => {
    const th = SM.THEMES[theme];
    px(0, 0, SM.W, SM.H, th.bg);
    if (theme === 'night' || theme === 'cave') {
      // estrelas / cristais
      for (let i = 0; i < 40; i++) {
        const h = Math.sin(i * 12.9898) * 43758.5453; // pseudo-aleatório fixo por estrela
        const r1 = h - Math.floor(h), r2 = (h * 7.13) - Math.floor(h * 7.13);
        const sx = ((r1 * (SM.W + 20) - camX * 0.1) % (SM.W + 20) + SM.W + 20) % (SM.W + 20) - 10;
        const sy = 30 + r2 * 120;
        const blink = (i + Math.floor(t / 20)) % 7 === 0;
        px(sx, sy, 1, 1, blink ? th.bg : theme === 'cave' ? '#3060b0' : '#fff');
      }
      if (theme === 'night') {
        ctx.fillStyle = '#fff8d0';
        ctx.beginPath(); ctx.arc(212, 52, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = th.bg;
        ctx.beginPath(); ctx.arc(217, 48, 9, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (theme !== 'cave') {
      const far = theme === 'night' ? '#2a1a4a' : theme === 'sky' ? '#f8c890' : '#00a800';
      const near = theme === 'night' ? '#3a2060' : theme === 'sky' ? '#ffe0b0' : '#80d010';
      for (let i = -1; i < 4; i++) {
        const base = Math.floor(camX * 0.3 / 192) * 192;
        const hx = base + i * 192 - camX * 0.3;
        hill(hx, 150, 160, 50, far);
      }
      for (let i = -1; i < 5; i++) {
        const base = Math.floor(camX * 0.5 / 140) * 140;
        const hx = base + i * 140 - camX * 0.5 + 40;
        hill(hx, 175, 90, 30, near);
      }
      const cc = theme === 'night' ? '#3a2a5a' : '#fff';
      for (let i = -1; i < 5; i++) {
        const base = Math.floor(camX * 0.2 / 110) * 110;
        cloud(base + i * 110 - camX * 0.2, 30 + ((i + Math.floor(camX * 0.2 / 110)) % 3) * 18, cc);
      }
    } else {
      // estalactites
      for (let i = -1; i < 12; i++) {
        const base = Math.floor(camX * 0.4 / 32) * 32;
        const sx = base + i * 32 - camX * 0.4;
        const h = 10 + ((i + Math.floor(camX * 0.4 / 32)) * 37 % 5) * 6;
        px(sx + 10, 0, 12, h, '#0c1838');
        px(sx + 13, h, 6, 6, '#0c1838');
      }
    }
  };

  // mastro e bandeira no fim do nível (groundY = topo do bloco da base)
  const flagpole = (x, groundY, flagY) => {
    px(x + 7, groundY - 136, 2, 136, '#40d040');
    px(x + 5, groundY - 142, 6, 6, '#106010');
    px(x - 9, flagY, 16, 12, '#fff');
    px(x - 4, flagY + 3, 6, 6, '#20a040');
  };

  const castle = (x, groundY) => {
    const c = '#b04820', d = '#000';
    px(x, groundY - 64, 80, 64, c);
    for (let i = 0; i < 5; i++) px(x + i * 16 + 2, groundY - 72, 12, 8, c);
    px(x + 16, groundY - 104, 48, 40, c);
    for (let i = 0; i < 3; i++) px(x + 16 + i * 16 + 2, groundY - 112, 12, 8, c);
    px(x + 32, groundY - 28, 16, 28, d);
    px(x + 28, groundY - 92, 6, 12, d); px(x + 46, groundY - 92, 6, 12, d);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 5; i++) px(x + i * 16 + (r % 2) * 8, groundY - 60 + r * 16, 8, 1, '#7c2800');
  };

  return {
    init: (c) => (ctx = c),
    get ctx() { return ctx; },
    px, text, shade, mano, bicho, tartaruga, coin, pastel, tile, background, flagpole, castle,
  };
})();
