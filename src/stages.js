'use strict';
// Cenários desenhados à mão em código, com parallax. Cada camada mexe-se a uma fração da câmara.

SM.Stages = (() => {
  const W = SM.W, H = SM.H, F = SM.FLOOR;
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // desloca uma camada: k = 0 parada, 1 acompanha o chão
  const off = (camX, k) => -(camX - W / 2) * k;

  function sky(ctx, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, F);
    stops.forEach(([p, c]) => g.addColorStop(p, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // público: silhuetas que saltam com a luta
  function crowd(ctx, ox, y, n, spacing, colors, t, excite = 1) {
    for (let i = 0; i < n; i++) {
      const x = ox + i * spacing + rnd(i) * 8;
      if (x < -20 || x > W + 20) continue;
      const bob = Math.abs(Math.sin(t * 0.08 * excite + i * 1.7)) * 3 * excite;
      const c = colors[i % colors.length];
      const h = 22 + rnd(i + 9) * 8;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, y - h - bob, 5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.quadraticCurveTo(x - 8, y - h + 6 - bob, x, y - h + 4 - bob);
      ctx.quadraticCurveTo(x + 8, y - h + 6 - bob, x + 8, y);
      ctx.fill();
      if (rnd(i + 3) > 0.7) { // braço no ar
        ctx.fillRect(x + 5, y - h - 10 - bob * 2, 2.5, 12);
      }
    }
  }

  // chão em perspetiva com padrão
  function floor(ctx, camX, base, line, pattern) {
    ctx.fillStyle = base;
    ctx.fillRect(0, F - 8, W, H - F + 8);
    const o = off(camX, 1);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    // linhas de fuga
    for (let i = -20; i < 40; i++) {
      const x = o + i * 40;
      ctx.beginPath();
      ctx.moveTo(x, F - 8);
      ctx.lineTo(W / 2 + (x - W / 2) * 1.8, H);
      ctx.stroke();
    }
    for (const y of [F - 2, F + 6, F + 16]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (pattern) pattern(o);
  }

  const STAGES = {
    bairro: {
      name: 'Bairro ao Pôr do Sol', music: 'bairro',
      draw(ctx, camX, t) {
        sky(ctx, [[0, '#2a1850'], [0.45, '#c8406a'], [0.8, '#ffa040'], [1, '#ffd080']]);
        // sol
        ctx.fillStyle = '#fff0a0';
        ctx.beginPath(); ctx.arc(W * 0.7 + off(camX, 0.05), 110, 26, 0, Math.PI * 2); ctx.fill();
        // cidade distante
        let o = off(camX, 0.2);
        ctx.fillStyle = '#5a2a5a';
        for (let i = 0; i < 30; i++) {
          const x = o + i * 26 - 40, h = 40 + rnd(i) * 60;
          ctx.fillRect(x, F - 40 - h, 24, h + 40);
        }
        // prédios lisboetas (fachadas coloridas com janelas e varandas)
        o = off(camX, 0.55);
        const facades = ['#e8c06a', '#d86a5a', '#6aa8c8', '#f0e0c0', '#c87aa8', '#88b878'];
        for (let i = 0; i < 16; i++) {
          const x = o + i * 64 - 60, h = 90 + rnd(i + 2) * 40, c = facades[i % facades.length];
          ctx.fillStyle = c;
          ctx.fillRect(x, F - 30 - h, 62, h + 30);
          ctx.fillStyle = SM.shade(c, 0.75);
          ctx.fillRect(x, F - 30 - h, 62, 5);
          ctx.fillStyle = '#7a3020';
          ctx.beginPath(); ctx.moveTo(x - 3, F - 30 - h); ctx.lineTo(x + 31, F - 46 - h); ctx.lineTo(x + 65, F - 30 - h); ctx.fill();
          for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) {
            const wx = x + 8 + k * 18, wy = F - 20 - h + 14 + r * 24;
            if (wy > F - 50) continue;
            const lit = rnd(i * 13 + r * 3 + k) > 0.55;
            ctx.fillStyle = lit ? '#ffe8a0' : '#3a3050';
            ctx.fillRect(wx, wy, 9, 13);
            ctx.fillStyle = '#2a2020';
            ctx.fillRect(wx - 2, wy + 13, 13, 2);
          }
        }
        // muro com grafíti
        o = off(camX, 0.85);
        ctx.fillStyle = '#8a8a90';
        ctx.fillRect(o - 40, F - 52, SM.STAGE_W * 0.85 + W, 46);
        ctx.fillStyle = '#6a6a70';
        for (let i = 0; i < 60; i++) ctx.fillRect(o - 40 + i * 24, F - 52, 1, 46);
        SM.UI.text(ctx, 'SUPER MANOS', o + 260, F - 30, { size: 22, color: '#ff4a8a', align: 'center', font: SM.FONT_BIG, outline: '#ffe040', lw: 3, italic: true });
        SM.UI.text(ctx, 'BAIRRO', o + 520, F - 30, { size: 16, color: '#40c0ff', align: 'center', font: SM.FONT_BIG, outline: '#111', italic: true });
        crowd(ctx, o - 20, F - 8, 44, 22, ['#2a1a2a', '#3a2238', '#1e1428'], t);
        // candeeiros
        for (let i = 0; i < 4; i++) {
          const x = o + 120 + i * 200;
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(x, F - 120, 3, 112);
          ctx.fillRect(x - 8, F - 122, 14, 4);
          ctx.fillStyle = 'rgba(255,230,150,0.9)';
          ctx.beginPath(); ctx.arc(x - 6, F - 116, 4, 0, Math.PI * 2); ctx.fill();
        }
        // calçada portuguesa
        floor(ctx, camX, '#d8d0c0', 'rgba(80,70,60,0.25)', (o2) => {
          // ondas de calçada (pedra escura) por baixo da linha dos pés
          ctx.strokeStyle = 'rgba(50,50,60,0.55)';
          ctx.lineWidth = 2;
          for (const y of [F + 9, F + 17]) {
            for (let i = -4; i < 30; i++) {
              const x = o2 * (y > F + 10 ? 1.15 : 1) + i * 48;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.quadraticCurveTo(x + 12, y + 4, x + 24, y);
              ctx.quadraticCurveTo(x + 36, y - 4, x + 48, y);
              ctx.stroke();
            }
          }
        });
      },
    },

    praia: {
      name: 'Praia da Caparica', music: 'praia',
      draw(ctx, camX, t) {
        sky(ctx, [[0, '#3a8ae8'], [0.6, '#8ac8f8'], [1, '#e0f4ff']]);
        ctx.fillStyle = '#fff8c0';
        ctx.beginPath(); ctx.arc(70 + off(camX, 0.03), 40, 16, 0, Math.PI * 2); ctx.fill();
        // nuvens
        let o = off(camX, 0.1);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (let i = 0; i < 6; i++) {
          const x = o + i * 140 + ((t * 0.05) % 140), y = 30 + rnd(i) * 40;
          ctx.beginPath(); ctx.ellipse(x, y, 26, 8, 0, 0, Math.PI * 2); ctx.ellipse(x + 16, y - 5, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
        }
        // mar com ondas
        ctx.fillStyle = '#1a70b8';
        ctx.fillRect(0, F - 90, W, 60);
        o = off(camX, 0.3);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.5;
        for (let r = 0; r < 4; r++) {
          ctx.beginPath();
          for (let x = 0; x <= W; x += 6) ctx.lineTo(x, F - 84 + r * 14 + Math.sin((x - o) * 0.08 + t * 0.06 + r) * 1.6);
          ctx.stroke();
        }
        // barco ao longe
        ctx.fillStyle = '#fff';
        ctx.fillRect(o + 300, F - 96, 30, 5);
        ctx.beginPath(); ctx.moveTo(o + 312, F - 96); ctx.lineTo(o + 312, F - 120); ctx.lineTo(o + 326, F - 98); ctx.fill();
        // espuma na areia
        ctx.fillStyle = '#e8f8ff';
        ctx.fillRect(0, F - 32 + Math.sin(t * 0.04) * 2, W, 5);
        // areia
        ctx.fillStyle = '#f0d8a0';
        ctx.fillRect(0, F - 30, W, 30);
        o = off(camX, 0.8);
        // chapéus de sol e posto do nadador-salvador
        const um = ['#e83040', '#30a0e8', '#f0c020', '#40c060'];
        for (let i = 0; i < 6; i++) {
          const x = o + 40 + i * 130;
          ctx.fillStyle = '#ddd'; ctx.fillRect(x, F - 66, 2, 50);
          ctx.fillStyle = um[i % 4];
          ctx.beginPath(); ctx.moveTo(x - 24, F - 60); ctx.quadraticCurveTo(x + 1, F - 84, x + 26, F - 60); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.moveTo(x - 8, F - 66); ctx.quadraticCurveTo(x + 1, F - 82, x + 10, F - 66); ctx.fill();
        }
        ctx.fillStyle = '#d84030';
        ctx.fillRect(o + 420, F - 100, 34, 22);
        ctx.fillStyle = '#7a5030';
        ctx.fillRect(o + 422, F - 78, 3, 60); ctx.fillRect(o + 449, F - 78, 3, 60);
        crowd(ctx, o - 30, F - 10, 40, 24, ['#a0603a', '#7a4a2a', '#5a3420', '#c08060'], t, 1.2);
        floor(ctx, camX, '#f2dca8', 'rgba(160,120,60,0.18)');
      },
    },

    telhados: {
      name: 'Telhados de Lisboa', music: 'telhados',
      draw(ctx, camX, t) {
        sky(ctx, [[0, '#060818'], [0.6, '#1a1a48'], [1, '#3a2a5a']]);
        for (let i = 0; i < 70; i++) {
          const x = rnd(i) * W, y = rnd(i + 99) * 120;
          ctx.fillStyle = (i + Math.floor(t / 30)) % 9 === 0 ? '#556' : '#fff';
          ctx.fillRect(x, y, 1, 1);
        }
        ctx.fillStyle = '#fff8d8';
        ctx.beginPath(); ctx.arc(320 + off(camX, 0.03), 36, 14, 0, Math.PI * 2); ctx.fill();
        // rio e ponte 25 de Abril
        let o = off(camX, 0.15);
        ctx.fillStyle = '#10183a';
        ctx.fillRect(0, F - 74, W, 24);
        ctx.strokeStyle = '#c8402a';
        ctx.fillStyle = '#c8402a';
        ctx.lineWidth = 2;
        const bx = o + 120;
        ctx.fillRect(bx, F - 150, 6, 80); ctx.fillRect(bx + 200, F - 150, 6, 80);
        ctx.fillRect(bx - 100, F - 92, 420, 4);
        ctx.beginPath(); ctx.moveTo(bx - 100, F - 92); ctx.quadraticCurveTo(bx - 40, F - 100, bx + 3, F - 150);
        ctx.quadraticCurveTo(bx + 103, F - 80, bx + 203, F - 150); ctx.quadraticCurveTo(bx + 260, F - 100, bx + 320, F - 92); ctx.stroke();
        for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(255,220,120,0.8)'; ctx.fillRect(bx - 90 + i * 34, F - 94, 2, 2); }
        // casario
        o = off(camX, 0.5);
        for (let i = 0; i < 22; i++) {
          const x = o + i * 44 - 60, h = 40 + rnd(i + 4) * 30;
          ctx.fillStyle = ['#2a2a4a', '#30284a', '#26304a'][i % 3];
          ctx.fillRect(x, F - 40 - h, 42, h + 40);
          ctx.fillStyle = '#5a2418';
          ctx.beginPath(); ctx.moveTo(x - 3, F - 40 - h); ctx.lineTo(x + 21, F - 54 - h); ctx.lineTo(x + 45, F - 40 - h); ctx.fill();
          for (let k = 0; k < 2; k++) if (rnd(i * 7 + k) > 0.4) { ctx.fillStyle = '#ffd870'; ctx.fillRect(x + 8 + k * 18, F - 30 - h + 14, 7, 9); }
        }
        // telhado onde se luta: telhas e chaminés
        o = off(camX, 0.9);
        for (let i = 0; i < 8; i++) {
          const x = o + i * 110;
          ctx.fillStyle = '#3a2a2a'; ctx.fillRect(x, F - 50, 14, 36);
          ctx.fillStyle = '#5a3a3a'; ctx.fillRect(x - 2, F - 54, 18, 5);
          ctx.fillStyle = 'rgba(200,200,220,0.25)';
          ctx.beginPath(); ctx.arc(x + 7 + Math.sin(t * 0.03 + i) * 3, F - 64 - (t * 0.3 + i * 20) % 30, 5, 0, Math.PI * 2); ctx.fill();
        }
        floor(ctx, camX, '#8a3a24', 'rgba(40,10,0,0.35)', (o2) => {
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          for (let i = -4; i < 50; i++) ctx.fillRect(o2 + i * 16, F - 8, 8, H - F + 8);
        });
      },
    },

    metro: {
      name: 'Estação de Metro', music: 'metro',
      draw(ctx, camX, t) {
        ctx.fillStyle = '#1a1e28';
        ctx.fillRect(0, 0, W, H);
        // parede de azulejos
        let o = off(camX, 0.6);
        for (let r = 0; r < 12; r++) for (let i = -2; i < 50; i++) {
          const x = o + i * 14, y = 20 + r * 14;
          if (x < -14 || x > W) continue;
          const blue = (i + r) % 4 === 0 || (i * 3 + r) % 7 === 0;
          ctx.fillStyle = blue ? '#34507e' : '#aab4c4';
          ctx.fillRect(x, y, 13, 13);
          if (blue) { ctx.fillStyle = '#aab4c4'; ctx.fillRect(x + 5, y + 5, 3, 3); }
        }
        // placa da estação
        SM.UI.panel(ctx, o + 180, 44, 120, 22, '#1a3a8a', '#fff');
        SM.UI.text(ctx, 'MANOS', o + 240, 55, { size: 13, align: 'center', color: '#fff', outline: null });
        SM.UI.panel(ctx, o + 560, 44, 120, 22, '#1a3a8a', '#fff');
        SM.UI.text(ctx, 'MANOS', o + 620, 55, { size: 13, align: 'center', color: '#fff', outline: null });
        // comboio que passa de vez em quando
        const cycle = t % 900;
        if (cycle < 160) {
          const tx = W + 40 - cycle * 9;
          for (let c = 0; c < 4; c++) {
            const x = tx + c * 150;
            ctx.fillStyle = '#c8ccd4';
            ctx.fillRect(x, 90, 146, 70);
            ctx.fillStyle = '#e8b020';
            ctx.fillRect(x, 140, 146, 8);
            for (let k = 0; k < 5; k++) { ctx.fillStyle = '#2a3a50'; ctx.fillRect(x + 8 + k * 28, 100, 20, 26); }
          }
        }
        // linha e cais
        ctx.fillStyle = '#0a0a10';
        ctx.fillRect(0, 160, W, 8);
        // colunas
        o = off(camX, 0.95);
        for (let i = 0; i < 6; i++) {
          const x = o + 40 + i * 140;
          ctx.fillStyle = '#d8d8e0'; ctx.fillRect(x, 0, 18, F - 6);
          ctx.fillStyle = '#a8a8b8'; ctx.fillRect(x + 12, 0, 6, F - 6);
        }
        // luzes
        ctx.fillStyle = 'rgba(255,250,220,0.08)';
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(60 + i * 100, 0); ctx.lineTo(30 + i * 100, F); ctx.lineTo(110 + i * 100, F); ctx.closePath(); ctx.fill(); }
        crowd(ctx, off(camX, 0.9) - 20, F - 10, 36, 26, ['#30344a', '#3a3044', '#283440'], t);
        floor(ctx, camX, '#585c68', 'rgba(0,0,0,0.25)', () => {
          ctx.fillStyle = '#f0c020';
          ctx.fillRect(0, F - 8, W, 3);
        });
      },
    },
  };

  const list = Object.keys(STAGES).map((id) => Object.assign({ id }, STAGES[id]));

  return {
    list,
    byId: (id) => list.find((s) => s.id === id) || list[0],
    draw(ctx, stage, camX, t) { stage.draw(ctx, camX, t); },
  };
})();
