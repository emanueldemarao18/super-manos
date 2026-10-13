'use strict';
// Super Manos — constantes partilhadas. Os ficheiros de src/ são carregados por ordem
// (ver index.html) e partilham o objeto global SM.

const SM = {
  W: 384, // resolução interna 16:9, ampliada em píxeis
  H: 216,
  FLOOR: 196, // y do chão
  WALL: 10, // margem lateral da arena

  GRAVITY: 0.45,
  MAX_FALL: 7,
  WALK: 1.9,
  AIR_ACCEL: 0.3,
  FRICTION: 0.7,
  JUMP: 7.4,
  DOUBLE_JUMP: 6.4,
  DASH_SPEED: 6.5,
  DASH_TIME: 10,
  DASH_CD: 36,

  HP: 100,
  CHAKRA_MAX: 300, // 3 barras
  CHAKRA_BAR: 100,
  ROUND_TIME: 99, // segundos
  TICK: 60, // simulação a 60 Hz
  SNAP_EVERY: 2, // o anfitrião envia o estado a cada 2 ticks (30 Hz)
  MAX_PLAYERS: 4,

  // botões como bits, para viajarem pela rede num só número
  BTN: { left: 1, right: 2, jump: 4, block: 8, punch: 16, kick: 32, grab: 64, jutsu: 128, ult: 256, charge: 512, dash: 1024, taunt: 2048 },

  PLAYER_COLORS: ['#ff4a4a', '#4aa0ff', '#4ae070', '#ffd040'],
  SPAWN_X: [80, 304, 150, 234],

  STAGES: {
    vila: { name: 'Vila da Folha', theme: 'day', music: 'day', platforms: [{ x: 50, y: 140, w: 90 }, { x: 244, y: 140, w: 90 }, { x: 147, y: 96, w: 90 }] },
    telhados: { name: 'Telhados à Noite', theme: 'night', music: 'night', platforms: [{ x: 24, y: 150, w: 76 }, { x: 154, y: 120, w: 76 }, { x: 284, y: 150, w: 76 }] },
    vale: { name: 'Vale do Fim', theme: 'valley', music: 'valley', platforms: [{ x: 70, y: 128, w: 70 }, { x: 244, y: 128, w: 70 }] },
  },
};

SM.SECRET_CHARS = [];
SM.roster = () => SM.CHARACTERS.concat(SM.SECRET_CHARS.filter(c => c.unlocked));
SM.charById = id => SM.CHARACTERS.concat(SM.SECRET_CHARS).find(c => c.id === id) || SM.CHARACTERS[0];

SM.shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
};
