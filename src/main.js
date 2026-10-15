'use strict';
// Arranque: canvas em alta resolução ajustado à janela e ciclo fixo de 60 passos lógicos por segundo.

(() => {
  const canvas = document.getElementById('game');
  let renderScale = SM.SCALE;
  const ctx = canvas.getContext('2d');
  SM.ctx = ctx;

  const fit = () => {
    const k = Math.min(innerWidth / SM.W, innerHeight / SM.H);
    renderScale = Math.min(4, Math.max(SM.SCALE, k * (devicePixelRatio || 1)));
    canvas.width = Math.round(SM.W * renderScale);
    canvas.height = Math.round(SM.H * renderScale);
    canvas.style.width = Math.floor(SM.W * k) + 'px';
    canvas.style.height = Math.floor(SM.H * k) + 'px';
  };
  addEventListener('resize', fit);
  fit();

  const STEP = 1000 / 60;
  let last = performance.now();
  let acc = 0;
  const frame = (now) => {
    acc += Math.min(now - last, 250);
    last = now;
    while (acc >= STEP) {
      if (SM.App) SM.App.update();
      acc -= STEP;
    }
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    if (SM.App) SM.App.draw(ctx);
    else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SM.W, SM.H); }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
