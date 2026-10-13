'use strict';
// Teclado e comando → bits de SM.BTN. `held` = botões em baixo agora; `take()` devolve os
// botões carregados desde a última leitura (para não perder toques rápidos entre ticks).

SM.Input = (() => {
  const B = SM.BTN;
  const KEYS = {
    KeyA: B.left, ArrowLeft: B.left, KeyD: B.right, ArrowRight: B.right,
    KeyW: B.jump, ArrowUp: B.jump, Space: B.jump, KeyS: B.block, ArrowDown: B.block,
    KeyJ: B.punch, KeyK: B.kick, KeyL: B.grab, KeyI: B.jutsu, KeyO: B.ult, KeyU: B.charge,
    ShiftLeft: B.dash, ShiftRight: B.dash, KeyT: B.taunt,
  };
  // mapeamento "standard" do Gamepad API: [índice do botão, bit]
  const PAD = [[0, B.jump], [2, B.punch], [3, B.kick], [1, B.grab], [4, B.charge], [5, B.jutsu], [6, B.block], [7, B.dash], [11, B.ult], [10, B.ult], [9, B.taunt]];

  const raw = new Set();
  const listeners = [];
  let pressed = 0, padNow = 0, padPrev = 0;
  const typing = e => /^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName || '');

  addEventListener('keydown', e => {
    SM.Audio.init();
    if (!e.repeat) listeners.forEach(f => f(e.code, e));
    if (typing(e)) return;
    const b = KEYS[e.code];
    if (b) {
      e.preventDefault();
      if (!raw.has(e.code)) pressed |= b;
    }
    raw.add(e.code);
  });
  addEventListener('keyup', e => raw.delete(e.code));
  addEventListener('blur', () => raw.clear());
  addEventListener('pointerdown', () => SM.Audio.init());

  function readPad() {
    const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
    if (!gp) return 0;
    const on = i => gp.buttons[i]?.pressed;
    let b = 0;
    for (const [i, bit] of PAD) if (on(i)) b |= bit;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (ax < -0.4 || on(14)) b |= B.left;
    if (ax > 0.4 || on(15)) b |= B.right;
    if (ay < -0.7 || on(12)) b |= B.jump;
    if (ay > 0.7 || on(13)) b |= B.block;
    return b;
  }

  return {
    poll() {
      padNow = readPad();
      pressed |= padNow & ~padPrev;
      padPrev = padNow;
    },
    held() {
      let h = padNow;
      for (const c of raw) h |= KEYS[c] || 0;
      return h;
    },
    take() {
      const p = pressed;
      pressed = 0;
      return p;
    },
    raw: code => raw.has(code),
    onKey: f => listeners.push(f),
  };
})();
