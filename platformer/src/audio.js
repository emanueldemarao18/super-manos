'use strict';
// Efeitos sonoros sintetizados com WebAudio — sem ficheiros externos.

SM.Audio = (() => {
  let ctx = null;
  let muted = false;

  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  addEventListener('keydown', ensure, { once: true });

  // notas: [freqInicial, freqFinal, duração, tipo, atraso]
  const tone = (f0, f1, dur, type = 'square', delay = 0, vol = 0.08) => {
    const c = ensure();
    if (!c || muted) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  };

  const SFX = {
    jump: () => tone(300, 700, 0.15),
    coin: () => { tone(988, 988, 0.06); tone(1319, 1319, 0.25, 'square', 0.06); },
    stomp: () => tone(400, 80, 0.12, 'triangle', 0, 0.15),
    bump: () => tone(120, 80, 0.08, 'triangle', 0, 0.15),
    brick: () => tone(200, 40, 0.2, 'sawtooth', 0, 0.06),
    power: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.08, 'square', i * 0.07)),
    appear: () => tone(200, 600, 0.3, 'triangle', 0, 0.12),
    hurt: () => tone(600, 100, 0.35, 'square'),
    die: () => [494, 466, 440, 392, 330].forEach((f, i) => tone(f, f * 0.98, 0.15, 'square', i * 0.14)),
    flag: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.12, 'square', i * 0.09)),
    select: () => tone(660, 660, 0.05),
    oneup: () => [659, 784, 1319, 1047, 1175, 1568].forEach((f, i) => tone(f, f, 0.08, 'square', i * 0.08)),
  };

  return {
    play: (name) => SFX[name] && SFX[name](),
    toggleMute: () => (muted = !muted),
    get muted() { return muted; },
  };
})();
