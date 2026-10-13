'use strict';
// Comandos de 2 jogadores (teclado + comando). Cada jogador tem um número de bits SM.BTN por frame.
// Em modos de 1 jogador, o J1 aceita também as teclas do J2 (setas ou WASD, como preferir).

SM.Input = (() => {
  const B = SM.BTN;
  const KEYS = [
    { KeyW: B.up, KeyS: B.down, KeyA: B.left, KeyD: B.right, KeyF: B.lp, KeyG: B.hp, KeyV: B.lk, KeyB: B.hk, Enter: B.start, Escape: B.back, Backspace: B.back },
    {
      ArrowUp: B.up, ArrowDown: B.down, ArrowLeft: B.left, ArrowRight: B.right,
      KeyK: B.lp, KeyL: B.hp, Comma: B.lk, Period: B.hk,
      Numpad4: B.lp, Numpad5: B.hp, Numpad1: B.lk, Numpad2: B.hk, NumpadEnter: B.start,
    },
  ];
  // Gamepad "standard": X=LP, Y=HP, A=LK, B=HK; LB=LP+HP... mantemos simples; RB=HP+HK (super fácil)
  const PAD = [[2, B.lp], [3, B.hp], [0, B.lk], [1, B.hk], [9, B.start], [5, B.hp | B.hk], [4, B.lp | B.lk]];

  const down = new Set();
  let shared = true; // 1 jogador: J1 usa os dois mapas
  const held = [0, 0], prev = [0, 0], pressed = [0, 0];
  let latch = [0, 0]; // toques entre ticks não se perdem
  const delayQ = [];

  const typing = (e) => /^(INPUT|TEXTAREA)$/.test((e.target && e.target.tagName) || '');

  addEventListener('keydown', (e) => {
    if (SM.Audio) SM.Audio.init();
    if (typing(e)) return;
    if (e.code === 'KeyM' && !e.repeat && SM.Audio) SM.Audio.toggleMute();
    for (let p = 0; p < 2; p++) {
      const b = KEYS[p][e.code];
      if (b !== undefined) {
        e.preventDefault();
        if (!down.has(e.code)) latch[shared ? 0 : p] |= b;
      }
    }
    down.add(e.code);
  });
  addEventListener('keyup', (e) => down.delete(e.code));
  addEventListener('blur', () => down.clear());

  const readPad = (gp) => {
    if (!gp) return 0;
    const on = (i) => gp.buttons[i] && gp.buttons[i].pressed;
    let b = 0;
    for (const [i, bit] of PAD) if (on(i)) b |= bit;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (ax < -0.45 || on(14)) b |= B.left;
    if (ax > 0.45 || on(15)) b |= B.right;
    if (ay < -0.55 || on(12)) b |= B.up;
    if (ay > 0.55 || on(13)) b |= B.down;
    return b;
  };

  const keyBits = (p) => {
    let b = 0;
    for (const c of down) b |= KEYS[p][c] || 0;
    return b;
  };

  return {
    // chamado uma vez por tick lógico
    poll() {
      const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
      const touch = SM.Touch ? SM.Touch.read() : 0; // telemóvel: joga como J1
      for (let p = 0; p < 2; p++) {
        let h = keyBits(p);
        if (shared) h = p === 0 ? keyBits(0) | keyBits(1) : 0;
        h |= readPad(pads[p]);
        if (shared && p === 0) h |= readPad(pads[1]);
        if (p === 0) h |= touch;
        held[p] = h | latch[p];
        pressed[p] = held[p] & ~prev[p];
        prev[p] = h;
      }
      latch = [0, 0];
      // online: o anfitrião recebe o J2 pela rede e atrasa o próprio J1 para igualar a latência
      const net = SM.Net;
      if (net && net.role === 'host' && net.connected) {
        const r = net.nextRemote();
        held[1] = r.held;
        pressed[1] = r.pressed;
        delayQ.push([held[0], pressed[0]]);
        while (delayQ.length > net.delay + 1) delayQ.shift();
        if (delayQ.length > net.delay) {
          [held[0]] = delayQ[0];
          // os toques nunca se perdem: junta os que ficaram na fila descartada
          pressed[0] = delayQ[0][1];
        } else { held[0] = 0; pressed[0] = 0; }
      } else delayQ.length = 0;
    },
    held: (p) => held[p],
    pressed: (p) => pressed[p],
    // menus: qualquer jogador
    any: () => pressed[0] | pressed[1],
    setShared: (v) => { shared = v; },
    get shared() { return shared; },
    // para a IA / testes: injeta bits como se fossem do jogador p
    KEYS,
  };
})();

// Buffer de direções em notação numérica (1-9, 5 = neutro) relativo à frente do lutador,
// para detetar golpes especiais (↓↘→ = 236, →↓↘ = 623, ↓↙← = 214, 236236 = super).
SM.Motion = (() => {
  const B = SM.BTN;
  const numpad = (bits, facing) => {
    let x = (bits & B.right ? 1 : 0) - (bits & B.left ? 1 : 0);
    x *= facing;
    const y = bits & B.up ? 1 : bits & B.down ? -1 : 0;
    return 5 + x + y * 3;
  };

  // procura a sequência `seq` (string de dígitos) nos últimos `win` frames do buffer,
  // aceitando diagonais vizinhas (ex.: 3 serve como 2 ou 6 em 236 desde que a ordem bata)
  const match = (buf, seq, win) => {
    const start = Math.max(0, buf.length - win);
    let i = seq.length - 1;
    for (let k = buf.length - 1; k >= start && i >= 0; k--) {
      if (buf[k] === +seq[i]) i--;
      // a última direção tem de ser recente, senão andar para a frente dispara especiais
      else if (i === seq.length - 1 && k < buf.length - 10) return false;
    }
    return i < 0;
  };

  return { numpad, match };
})();
