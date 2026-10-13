'use strict';
// Utilitários de interface: texto com contorno, painéis e barras.

SM.UI = {
  text(ctx, str, x, y, { size = 10, color = '#fff', align = 'left', font = SM.FONT, outline = '#000', lw = null, baseline = 'middle', italic = false } = {}) {
    ctx.font = `${italic ? 'italic ' : ''}${size}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (outline) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = lw || Math.max(2, size / 5);
      ctx.strokeStyle = outline;
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  },

  // texto grande com gradiente (anúncios: ROUND 1, K.O., ...)
  big(ctx, str, x, y, size, c1 = '#fff6a0', c2 = '#ff8a00', scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.font = `${size}px ${SM.FONT_BIG}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size / 5;
    ctx.strokeStyle = '#000';
    ctx.strokeText(str, 0, 0);
    const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillText(str, 0, 0);
    ctx.restore();
  },

  panel(ctx, x, y, w, h, color = 'rgba(10,10,30,0.8)', border = '#f8d860') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  },

  // barra inclinada (vida / super). dir: 1 enche da esquerda, -1 da direita
  bar(ctx, x, y, w, h, k, color, dir = 1, back = '#300', red = null) {
    // paralelogramo inclinado para "fora" (espelhado no lado direito)
    const s = h * 0.6;
    const top = dir > 0 ? s : 0, bot = dir > 0 ? 0 : s;
    const shape = (x0, w0, c) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x0 + top, y);
      ctx.lineTo(x0 + w0 + top, y);
      ctx.lineTo(x0 + w0 + bot, y + h);
      ctx.lineTo(x0 + bot, y + h);
      ctx.closePath();
      ctx.fill();
    };
    shape(x, w, '#000');
    shape(x + 1, w - 2, back);
    const fill = (kk, c) => {
      const fw = Math.max(0, (w - 2) * kk);
      shape(dir > 0 ? x + 1 + (w - 2 - fw) : x + 1, fw, c);
    };
    if (red !== null) fill(red, '#e02020');
    fill(k, color);
  },
};
