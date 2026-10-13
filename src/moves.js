'use strict';
// Frame data dos golpes normais (em ticks de 1/60 s).
// box = [x à frente do centro, y relativo aos pés, largura, altura]; kb = [empurrão x, y].

SM.MOVES = {
  jab1: { pose: 'jab', startup: 3, active: 3, recovery: 8, dmg: 4, kb: [1.4, 0], hitstun: 16, box: [6, -30, 16, 8], next: 'jab2' },
  jab2: { pose: 'jab2', startup: 3, active: 3, recovery: 9, dmg: 5, kb: [1.6, 0], hitstun: 17, box: [6, -28, 16, 8], next: 'upper' },
  upper: { pose: 'upper', startup: 5, active: 4, recovery: 16, dmg: 8, kb: [2, -6.5], hitstun: 30, box: [4, -44, 16, 20], lunge: 1.5 },
  kick: { pose: 'kick', startup: 7, active: 4, recovery: 16, dmg: 9, kb: [4.5, -2.5], hitstun: 24, box: [6, -22, 22, 9], lunge: 1, big: true },
  airPunch: { pose: 'airPunch', startup: 3, active: 5, recovery: 8, dmg: 5, kb: [2, -1.5], hitstun: 18, box: [6, -32, 16, 10], air: true },
  airKick: { pose: 'airKick', startup: 4, active: 10, recovery: 8, dmg: 7, kb: [3, 2], hitstun: 20, box: [2, -16, 20, 12], air: true },
  grab: { pose: 'grab', startup: 4, active: 3, recovery: 22, grab: true, box: [4, -32, 14, 18] },
};
