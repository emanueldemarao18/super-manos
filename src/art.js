'use strict';
// Artes dos lutadores (assets/fighters/<id>.webp, recortadas com tools/make-art.sh).
// Carregam em segundo plano; enquanto não chegam, os ecrãs usam o boneco animado.
// As artes olham para a esquerda; `face` 1 espelha-as para olharem para a direita.

SM.Art = (() => {
  const imgs = new Map();
  for (const ch of SM.CHARACTERS) {
    const img = new Image();
    img.src = 'assets/fighters/' + ch.id + '.webp';
    imgs.set(ch.id, img);
  }
  const ready = (id) => { const i = imgs.get(id); return i && i.complete && i.naturalWidth > 0 ? i : null; };

  return {
    ready,
    // corpo inteiro com os pés em (x, y) e a altura pedida
    full(ctx, id, x, y, height, face = -1, alpha = 1) {
      const img = ready(id);
      if (!img) return false;
      const w = (img.naturalWidth / img.naturalHeight) * height;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.scale(face < 0 ? 1 : -1, 1);
      ctx.drawImage(img, -w / 2, -height, w, height);
      ctx.restore();
      return true;
    },
    // cabeça e ombros num retângulo (para os cartões da escolha de lutador)
    face(ctx, id, x, y, w, h) {
      const img = ready(id);
      if (!img) return false;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const sw = iw * 0.44, sh = sw * (h / w);
      ctx.drawImage(img, iw * 0.27, ih * 0.005, sw, sh, x, y, w, h);
      return true;
    },
  };
})();
