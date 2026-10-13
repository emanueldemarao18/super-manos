'use strict';
// Super Manos — constantes partilhadas por todos os módulos.
// Os ficheiros de src/ são carregados por ordem (ver index.html) e partilham o objeto SM.

const SM = {
  W: 256, // resolução interna, igual à da NES
  H: 240,
  T: 16, // tamanho de um tile em píxeis
  ROWS: 15, // altura de um nível em tiles

  PHYS: {
    gravity: 0.7, // gravidade normal
    gravityHold: 0.3, // gravidade a subir com o salto premido (salto variável)
    maxFall: 6,
    walkMax: 1.6,
    runMax: 2.6,
    accel: 0.1,
    runAccel: 0.14,
    decel: 0.12,
    skid: 0.25,
    jump: 6.8,
    bounce: 4.2,
  },

  // tiles onde se pode pisar ou bater com a cabeça
  SOLID: new Set(['#', 'B', '?', 'M', 'X', '=', '[', ']', '(', ')', 'K']),

  // ground = [base, claro, escuro]
  THEMES: {
    day: { bg: '#5c94fc', ground: ['#c84c0c', '#fca044', '#7c2800'] },
    cave: { bg: '#04040c', ground: ['#2050a0', '#5c94fc', '#0c2860'] },
    night: { bg: '#140c28', ground: ['#6a2a3a', '#a85060', '#2a1020'] },
    sky: { bg: '#ffb070', ground: ['#e8a020', '#ffe080', '#a06000'] },
  },
};
