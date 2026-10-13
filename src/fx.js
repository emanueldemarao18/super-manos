'use strict';
// Efeitos visuais: faíscas de impacto, pó, rastos, textos e desenho dos projéteis/supers.
// Coordenadas do mundo: x no cenário, y relativo ao chão (negativo = para cima).

SM.FX = (() => {
  let list = [];

  const add = (o) => { list.push(o); return o; };

  const api = {
    clear: () => { list = []; },

    // impacto: estrela de raios + anel + partículas
    spark(x, y, kind = 'light', color = '#fff6c0') {
      const big = kind === 'heavy' || kind === 'super';
      const block = kind === 'block';
      add({ type: 'burst', x, y, life: big ? 14 : 10, max: big ? 14 : 10, r: big ? 26 : 16, color: block ? '#80d0ff' : color, rot: Math.random() * Math.PI });
      add({ type: 'ring', x, y, life: 10, max: 10, r: big ? 30 : 18, color: block ? '#c0e8ff' : '#ffffff' });
      const n = block ? 5 : big ? 12 : 7;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * (big ? 4 : 2.5);
        add({ type: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 12 + Math.random() * 8, max: 20, color: block ? '#c0e8ff' : color });
      }
    },

    dust(x, n = 6, big = false) {
      for (let i = 0; i < n; i++) {
        add({ type: 'dust', x: x + (Math.random() - 0.5) * 20, y: -2, vx: (Math.random() - 0.5) * (big ? 3 : 1.6), vy: -Math.random() * (big ? 1.6 : 0.8), r: 3 + Math.random() * (big ? 6 : 3), life: 24, max: 24 });
      }
    },

    // aura/rasto de cor durante especiais
    trail(x, y, color, r = 8) {
      add({ type: 'glow', x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, r, color, life: 12, max: 12, vy: -0.4 });
    },

    text(x, y, str, color = '#fff', size = 12) {
      add({ type: 'text', x, y, str, color, size, life: 50, max: 50 });
    },

    bolt(x, color, life = 10) {
      add({ type: 'bolt', x, color, life, max: life, seed: Math.random() * 1000 });
    },

    update() {
      for (const p of list) {
        p.life--;
        if (p.vx) p.x += p.vx;
        if (p.vy) p.y += p.vy;
        if (p.type === 'dot') { p.vx *= 0.9; p.vy = p.vy * 0.9 + 0.15; }
        if (p.type === 'dust') { p.vx *= 0.94; p.r += 0.15; }
        if (p.type === 'text') p.y -= 0.4;
      }
      list = list.filter((p) => p.life > 0);
    },

    draw(ctx, sx) {
      const F = SM.FLOOR;
      for (const p of list) {
        const k = p.life / p.max;
        const X = sx(p.x), Y = F + p.y;
        ctx.globalAlpha = 1;
        switch (p.type) {
          case 'burst': {
            const r = p.r * (1.2 - k * 0.5);
            ctx.save();
            ctx.translate(X, Y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = Math.min(1, k * 1.6);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            for (let i = 0; i < 16; i++) {
              const rr = i % 2 ? r * 0.35 : r * (0.8 + (i % 4 === 0 ? 0.4 : 0));
              const a = (i / 16) * Math.PI * 2;
              ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            break;
          }
          case 'ring':
            ctx.globalAlpha = k;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2 * k + 0.5;
            ctx.beginPath(); ctx.arc(X, Y, p.r * (1.3 - k), 0, Math.PI * 2); ctx.stroke();
            break;
          case 'dot':
            ctx.globalAlpha = k;
            ctx.fillStyle = p.color;
            ctx.fillRect(X - 1, Y - 1, 2.4, 2.4);
            break;
          case 'dust':
            ctx.globalAlpha = k * 0.55;
            ctx.fillStyle = '#d8ccb8';
            ctx.beginPath(); ctx.arc(X, Y, p.r, 0, Math.PI * 2); ctx.fill();
            break;
          case 'glow':
            ctx.globalAlpha = k * 0.6;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(X, Y, p.r * k + 1, 0, Math.PI * 2); ctx.fill();
            break;
          case 'text':
            ctx.globalAlpha = Math.min(1, k * 2);
            SM.UI.text(ctx, p.str, X, Y, { size: p.size, color: p.color, align: 'center', font: SM.FONT_BIG });
            break;
          case 'bolt': {
            ctx.globalAlpha = k;
            let x = X, y = 0;
            let s = p.seed;
            const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
            ctx.strokeStyle = p.color; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(x, y);
            while (y < F) { y += 14; x = X + (rnd() - 0.5) * 22; ctx.lineTo(x, y); }
            ctx.stroke();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            break;
          }
        }
      }
      ctx.globalAlpha = 1;
    },

    // ---------- projéteis ----------
    drawProjectile(ctx, pr, sx, t) {
      const X = sx(pr.x), Y = SM.FLOOR + pr.y, c = pr.color, d = pr.dir;
      const glow = (r, color, a = 0.35) => { ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X, Y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; };
      const s = pr.size || 1;
      switch (pr.fx) {
        case 'orb': {
          glow(16 * s + Math.sin(t * 0.5) * 2, c, 0.25);
          glow(11 * s, c, 0.6);
          glow(6 * s, '#fff', 1);
          for (let i = 1; i < 5; i++) { ctx.globalAlpha = 0.3 - i * 0.05; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X - d * i * 7, Y, (9 - i) * s, 0, Math.PI * 2); ctx.fill(); }
          ctx.globalAlpha = 1;
          break;
        }
        case 'fire': {
          for (let i = 0; i < 6; i++) {
            const k = i / 6;
            ctx.globalAlpha = 0.8 - k * 0.6;
            ctx.fillStyle = i < 2 ? '#fff4a0' : i < 4 ? c : '#c02010';
            ctx.beginPath();
            ctx.arc(X - d * i * 5 + Math.sin(t + i) * 1.5, Y + Math.cos(t * 0.7 + i) * 2, (11 - i * 1.2) * s, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          break;
        }
        case 'wave': {
          ctx.save();
          ctx.translate(X, Y);
          ctx.scale(d, 1);
          const h = 26 * s;
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(-18, h * 0.6);
          ctx.quadraticCurveTo(8, h * 0.6, 12, -h * 0.2);
          ctx.quadraticCurveTo(14, -h * 0.9, 2, -h);
          ctx.quadraticCurveTo(10, -h * 0.3, -6, h * 0.1);
          ctx.quadraticCurveTo(-14, h * 0.3, -18, h * 0.6);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(10, -h * 0.3); ctx.quadraticCurveTo(12, -h * 0.85, 2, -h); ctx.stroke();
          for (let i = 0; i < 3; i++) { ctx.fillStyle = '#fff'; ctx.fillRect(-14 + i * 8 + Math.sin(t * 0.4 + i) * 2, h * 0.5 - 3, 2, 2); }
          ctx.restore();
          break;
        }
        case 'blade': {
          ctx.save();
          ctx.translate(X, Y);
          ctx.scale(d, 1);
          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = c; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(-8, 0, 16, -1.1, 1.1); ctx.stroke();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(-8, 0, 16, -0.9, 0.9); ctx.stroke();
          ctx.globalAlpha = 0.35; ctx.strokeStyle = c; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(-18, 0, 14, -1, 1); ctx.stroke();
          ctx.restore();
          break;
        }
        case 'ball': {
          glow(12, c, 0.35);
          ctx.save();
          ctx.translate(X, Y);
          ctx.rotate(t * 0.4 * d);
          ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#111';
          ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; ctx.lineTo(Math.cos(a) * 3, Math.sin(a) * 3); } ctx.closePath(); ctx.fill();
          ctx.restore();
          for (let i = 1; i < 4; i++) { ctx.globalAlpha = 0.35 - i * 0.08; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X - d * i * 8, Y, 7 - i, 0, Math.PI * 2); ctx.fill(); }
          ctx.globalAlpha = 1;
          break;
        }
        case 'quake': {
          for (let i = 0; i < 4; i++) {
            const h = 10 + ((t * 3 + i * 7) % 12);
            ctx.fillStyle = i % 2 ? SM.shade(c, 0.7) : c;
            ctx.beginPath();
            ctx.moveTo(X - 14 + i * 7, SM.FLOOR);
            ctx.lineTo(X - 10 + i * 7, SM.FLOOR - h);
            ctx.lineTo(X - 6 + i * 7, SM.FLOOR);
            ctx.fill();
          }
          break;
        }
        case 'beam': {
          // feixe do super: do lançador até ao fim do ecrã
          const x0 = sx(pr.x0), x1 = d > 0 ? SM.W + 20 : -20;
          const h = (pr.h || 30) * (0.8 + Math.sin(t * 0.8) * 0.15);
          const g = (w, color, a) => { ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(Math.min(x0, x1), Y - w / 2, Math.abs(x1 - x0), w); };
          g(h * 1.5, c, 0.25);
          g(h, c, 0.7);
          g(h * 0.45, '#ffffff', 1);
          ctx.globalAlpha = 0.8; ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(x0, Y, h * 0.7, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
      }
    },
  };
  return api;
})();
