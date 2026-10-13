'use strict';
// Golpes normais (frame data em ticks de 1/60 s).
// box = [x à frente dos pés, y (negativo = para cima), largura, altura]
// level: high | mid | low | overhead   (baixo só se defende agachado; overhead só em pé)
// cancel: pode ser cancelado num especial/super quando acerta ou é defendido
// chain: golpes para onde pode encadear logo a seguir

SM.MOVES = {
  lp: { wind: 'lpWind', pose: 'lp', startup: 4, active: 3, recovery: 7, dmg: 30, hitstun: 14, blockstun: 10, push: 2.2, box: [12, -80, 30, 12], level: 'high', cancel: true, chain: ['lp', 'lk', 'clp', 'clk'], light: true },
  hp: { wind: 'hpWind', pose: 'hp', startup: 7, active: 4, recovery: 16, dmg: 75, hitstun: 20, blockstun: 15, push: 3.6, box: [14, -82, 38, 14], level: 'high', cancel: true },
  lk: { wind: 'lkWind', pose: 'lk', startup: 6, active: 4, recovery: 11, dmg: 45, hitstun: 16, blockstun: 11, push: 2.6, box: [18, -56, 34, 14], level: 'mid', cancel: true, chain: ['lp', 'clp'], light: true },
  hk: { wind: 'hkWind', pose: 'hk', startup: 10, active: 5, recovery: 20, dmg: 90, hitstun: 22, blockstun: 16, push: 4.5, box: [18, -106, 38, 30], level: 'high' },
  clp: { wind: 'crouch', pose: 'clp', startup: 4, active: 3, recovery: 7, dmg: 25, hitstun: 13, blockstun: 9, push: 2, box: [12, -50, 28, 10], level: 'mid', cancel: true, chain: ['clp', 'clk', 'lp'], light: true, crouch: true },
  chp: { wind: 'chpWind', pose: 'chp', startup: 6, active: 5, recovery: 18, dmg: 80, hitstun: 22, blockstun: 14, push: 2.5, box: [2, -122, 28, 64], level: 'mid', cancel: true, launch: true, crouch: true, antiAir: true },
  clk: { wind: 'crouch', pose: 'clk', startup: 5, active: 3, recovery: 9, dmg: 30, hitstun: 14, blockstun: 10, push: 2.2, box: [20, -16, 34, 14], level: 'low', cancel: true, chain: ['clp', 'clk'], light: true, crouch: true },
  chk: { wind: 'chkWind', pose: 'chk', startup: 9, active: 4, recovery: 22, dmg: 80, hitstun: 20, blockstun: 14, push: 3, box: [20, -14, 46, 14], level: 'low', kd: true, crouch: true },
  jlp: { wind: 'jumpFall', pose: 'jlp', startup: 4, active: 8, recovery: 6, dmg: 40, hitstun: 16, blockstun: 11, push: 2, box: [10, -72, 28, 18], level: 'overhead', air: true, light: true },
  jhp: { wind: 'jumpFall', pose: 'jhp', startup: 7, active: 6, recovery: 8, dmg: 80, hitstun: 20, blockstun: 14, push: 3, box: [10, -66, 36, 28], level: 'overhead', air: true },
  jlk: { wind: 'jumpFall', pose: 'jlk', startup: 5, active: 10, recovery: 6, dmg: 45, hitstun: 16, blockstun: 11, push: 2, box: [14, -46, 32, 20], level: 'overhead', air: true, light: true },
  jhk: { wind: 'jumpFall', pose: 'jhk', startup: 7, active: 7, recovery: 8, dmg: 85, hitstun: 20, blockstun: 14, push: 3.2, box: [14, -40, 42, 26], level: 'overhead', air: true },
};

SM.THROW = { range: 50, startup: 3, dmg: 120 };

// escala de dano em combos: 1.º e 2.º golpe a 100 %, depois desce até 40 %
SM.comboScale = (n) => Math.max(0.4, n < 2 ? 1 : 1 - (n - 1) * 0.12);
