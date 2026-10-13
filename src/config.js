'use strict';
// Super Manos — jogo de luta 1 contra 1. Constantes partilhadas.
// Os ficheiros de src/ são carregados por ordem (ver index.html) e partilham o objeto global SM.
// Coordenadas lógicas: 400×225 (16:9). O canvas real é SM.SCALE vezes maior para traço suave.

const SM = {
  W: 400,
  H: 225,
  SCALE: 2,
  FLOOR: 205, // y do chão no ecrã
  STAGE_W: 720, // largura do cenário (a câmara segue os lutadores)
  MAX_GAP: 330, // distância máxima entre lutadores (não saem do ecrã)

  GRAVITY: 0.5,
  JUMP_V: 9.2,
  JUMP_X: 2.6,
  WALK_F: 2.0,
  WALK_B: 1.6,

  HP: 1000,
  METER_MAX: 100,
  ROUND_TIME: 99,
  ROUNDS_TO_WIN: 2,

  // botões lógicos (bits)
  BTN: { up: 1, down: 2, left: 4, right: 8, lp: 16, hp: 32, lk: 64, hk: 128, start: 256 },

  FONT: '"Russo One", "Arial Black", sans-serif',
  FONT_BIG: '"Bangers", "Impact", sans-serif',
};

SM.shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
};

SM.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
SM.lerp = (a, b, k) => a + (b - a) * k;
