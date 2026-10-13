'use strict';
// Arranque: canvas em escala inteira e ciclo de jogo a 60 passos lógicos por segundo.

(() => {
  const canvas = document.getElementById('game');
  canvas.width = SM.W;
  canvas.height = SM.H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  SM.R.init(ctx);

  const fit = () => {
    const k = Math.max(1, Math.floor(Math.min(innerWidth / SM.W, innerHeight / SM.H)));
    canvas.style.width = SM.W * k + 'px';
    canvas.style.height = SM.H * k + 'px';
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
      SM.Game.update();
      acc -= STEP;
    }
    SM.Game.draw();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
