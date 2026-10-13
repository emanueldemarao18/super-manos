'use strict';
// Níveis construídos com um pequeno construtor em vez de mapas ASCII escritos à mão.
// Tiles: ver SM.SOLID em config.js. Não sólidos: 'o' moeda, '^' espinhos.
// Entidades marcadas na grelha: 'g' bicho, 'k' tartaruga (são retiradas da grelha ao carregar).

class LevelBuilder {
  constructor(width, theme, name) {
    this.w = width;
    this.theme = theme;
    this.name = name;
    this.grid = Array.from({ length: SM.ROWS }, () => Array(width).fill('.'));
    this.flagX = width - 20;
    this.time = 300;
  }
  set(x, y, c) {
    if (x >= 0 && x < this.w && y >= 0 && y < SM.ROWS) this.grid[y][x] = c;
    return this;
  }
  ground(x0, x1, top = 13) {
    for (let x = x0; x <= x1; x++) for (let y = top; y < SM.ROWS; y++) this.set(x, y, '#');
    return this;
  }
  row(x, y, s) {
    [...s].forEach((c, i) => c !== ' ' && this.set(x + i, y, c));
    return this;
  }
  pipe(x, h, base = 13) {
    this.set(x, base - h, '[').set(x + 1, base - h, ']');
    for (let y = base - h + 1; y < base; y++) this.set(x, y, '(').set(x + 1, y, ')');
    return this;
  }
  // escada de n degraus; dir 1 sobe para a direita, -1 desce
  stairs(x, n, dir = 1, base = 13) {
    for (let i = 0; i < n; i++) {
      const h = dir > 0 ? i + 1 : n - i;
      for (let k = 1; k <= h; k++) this.set(x + i, base - k, 'K');
    }
    return this;
  }
  coins(x, y, n) {
    for (let i = 0; i < n; i++) this.set(x + i, y, 'o');
    return this;
  }
  build() {
    const enemies = [];
    for (let y = 0; y < SM.ROWS; y++)
      for (let x = 0; x < this.w; x++) {
        const c = this.grid[y][x];
        if (c === 'g' || c === 'k') {
          enemies.push({ type: c, x, y });
          this.grid[y][x] = '.';
        }
      }
    return {
      name: this.name,
      theme: this.theme,
      w: this.w,
      grid: this.grid,
      enemies,
      flagX: this.flagX,
      time: this.time,
    };
  }
}

SM.LEVELS = [
  // 1-1 — Bairro ensolarado
  () => {
    const L = new LevelBuilder(212, 'day', '1-1');
    L.ground(0, 68).ground(71, 85).ground(89, 152).ground(155, 211);
    L.row(16, 9, '?').row(20, 9, 'B?BMB').row(22, 5, '?');
    L.row(22, 12, 'g');
    L.pipe(28, 2).pipe(38, 3).pipe(46, 4).pipe(57, 4);
    L.row(40, 12, 'g').row(51, 12, 'g').row(53, 12, 'g');
    L.row(64, 8, 'M');
    L.row(77, 9, 'B?B').row(80, 5, 'BBBBBBBB').row(91, 5, 'BBB?').row(94, 9, 'B');
    L.row(81, 4, 'g g');
    L.row(97, 12, 'g g').row(100, 9, 'BM');
    L.row(106, 9, '?  ?  ?').row(109, 5, 'M');
    L.row(107, 12, 'k').row(114, 12, 'g g');
    L.row(118, 9, 'B').row(121, 5, 'BBB').row(128, 5, 'B??B').row(129, 9, 'BB');
    L.row(124, 12, 'g g').row(130, 12, 'g g');
    L.stairs(134, 4).stairs(140, 4, -1);
    L.stairs(148, 4).set(152, 9, 'K').set(152, 10, 'K').set(152, 11, 'K').set(152, 12, 'K');
    L.stairs(155, 4, -1);
    L.pipe(163, 2).row(168, 9, 'BB?B').row(170, 12, 'g g').pipe(179, 2);
    L.stairs(181, 8);
    for (let y = 5; y < 13; y++) L.set(189, y, 'K');
    L.coins(30, 6, 3).coins(84, 3, 3).coins(122, 3, 3);
    L.flagX = 198;
    return L.build();
  },

  // 1-2 — Caverna
  () => {
    const L = new LevelBuilder(200, 'cave', '1-2');
    L.time = 400;
    L.ground(0, 79).ground(83, 120).ground(126, 199);
    for (let x = 6; x < 180; x++) L.set(x, 2, 'B');
    L.row(10, 9, 'M?????');
    L.row(16, 12, 'g g');
    L.stairs(20, 4);
    L.row(28, 8, 'B').row(29, 6, 'B').row(30, 4, 'BBB').row(33, 6, 'B').row(34, 8, 'B');
    L.coins(30, 3, 3);
    L.row(36, 12, 'k').row(42, 12, 'g g');
    L.row(44, 8, 'BBBBBB').row(44, 5, 'BMBBBB').row(48, 4, 'oooo');
    L.coins(45, 7, 5);
    L.pipe(56, 3).pipe(62, 4).pipe(68, 2);
    L.row(59, 12, 'g').row(65, 12, 'g');
    L.row(74, 9, 'KK').row(78, 7, '==').row(81, 9, '===');
    L.set(86, 12, '^').set(87, 12, '^').row(90, 9, 'B?B?B').row(92, 12, 'k');
    L.row(98, 12, 'g g g');
    L.row(102, 6, 'BBBBBBBB').coins(102, 5, 8).row(106, 9, 'M');
    L.row(114, 12, '^^').row(117, 9, '==').row(121, 9, '===');
    L.row(130, 12, 'k').stairs(135, 5).row(140, 8, '===');
    L.row(143, 6, 'B?BB').row(146, 12, 'g g').pipe(152, 3);
    L.row(158, 12, 'g').row(160, 9, 'MB').stairs(166, 6);
    for (let y = 7; y < 13; y++) L.set(172, y, 'K');
    L.flagX = 186;
    return L.build();
  },

  // 1-3 — Céu ao pôr do sol (plataformas sobre o vazio)
  () => {
    const L = new LevelBuilder(190, 'sky', '1-3');
    L.ground(0, 15);
    L.row(18, 11, '=====').row(25, 9, '====').coins(25, 7, 4);
    L.row(32, 11, '======').row(34, 10, 'g');
    L.row(40, 8, '===').row(40, 4, 'M');
    L.row(46, 10, '=======').row(48, 9, 'k');
    L.row(56, 12, '====').row(62, 9, '======').coins(63, 7, 4);
    L.row(70, 7, '=====').row(72, 6, 'g');
    L.row(78, 10, '========').row(80, 6, '?B?').row(84, 9, 'g');
    L.row(89, 12, '====').row(95, 10, '====').row(100, 8, '====').coins(100, 6, 4);
    L.ground(106, 120).row(110, 9, 'BMB').row(113, 12, 'g g').pipe(117, 2);
    L.row(124, 10, '====').row(130, 7, '===').row(136, 10, '=====').row(138, 9, 'k');
    L.row(144, 12, '===').row(148, 10, '===').row(152, 8, '===').coins(152, 6, 3);
    L.row(157, 11, '===');
    L.ground(162, 189).stairs(164, 5);
    for (let y = 8; y < 13; y++) L.set(169, y, 'K');
    L.flagX = 176;
    return L.build();
  },

  // 1-4 — Noite final
  () => {
    const L = new LevelBuilder(220, 'night', '1-4');
    L.ground(0, 40).ground(44, 90).ground(95, 140).ground(146, 219);
    L.row(12, 9, 'BMB').row(18, 12, 'g g g');
    L.row(24, 12, '^^^').coins(24, 9, 3);
    L.pipe(32, 3).row(36, 12, 'k');
    L.row(42, 9, '==').coins(42, 8, 2);
    L.row(50, 9, '?B?B?').row(52, 5, 'M').row(54, 12, 'g g').row(60, 12, 'k');
    L.stairs(64, 3).row(67, 12, '^^^^').row(67, 9, '====').stairs(71, 3, -1);
    L.row(78, 12, 'g g g').row(80, 8, 'BBBBBB').coins(80, 7, 6);
    L.row(91, 10, '===').row(92, 9, 'g');
    L.pipe(100, 2).pipe(106, 3).pipe(112, 4).row(103, 12, 'k').row(109, 12, 'g');
    L.row(118, 9, '?M?').row(122, 12, 'g g').row(126, 12, '^^').row(128, 12, 'k');
    L.row(132, 8, 'BBB').row(133, 4, '?');
    L.row(141, 10, '=====');
    L.row(150, 12, 'g g g g').row(152, 8, 'B?B?B').row(158, 12, 'k');
    L.row(164, 12, '^^^').coins(164, 9, 3);
    L.row(170, 9, 'M').row(175, 12, 'g g');
    L.stairs(180, 8);
    for (let y = 5; y < 13; y++) L.set(188, y, 'K');
    L.flagX = 198;
    L.time = 400;
    return L.build();
  },
];
