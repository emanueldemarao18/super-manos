'use strict';
// Os 11 manos. Cada um tem corpo (size/bulk), roupa, estatísticas e golpes especiais.
// Especiais (ver fighter.js): projectile, rising, rush, spin, dive, cmdGrab, counter, teleport, quake.
// Super (↓↘→↓↘→ + soco, ou Forte+Pontapé Forte com a barra cheia): beam, barrage, sky, megaGrab.
// Comandos: 236 = ↓↘→, 623 = →↓↘, 214 = ↓↙←.

SM.CHARACTERS = [
  {
    id: 'emanuel', name: 'Emanuel', style: 'Karaté de Rua', quote: 'BORA, MALTA!',
    skin: '#5e3b25', hair: 'curly', hairColor: '#120c08', beard: true, band: '#d82828',
    body: { size: 1.02, bulk: 1.12, muscle: 1.15 },
    outfit: { top: null, style: 'vest', vest: '#d02626', trim: '#f2f2f2', sleeves: 0, belt: '#141414', pants: '#2440b8', pantsCut: 'gi', shoes: 'bare', gloves: '#d42a2a', strap: '#1a1a1a' },
    stats: { hp: 1000, walk: 1.0, power: 1.0 },
    specials: [
      { cmd: '236', btn: 'p', type: 'projectile', name: 'ONDA DE ENERGIA', fx: 'orb', color: '#40b0ff', speed: 4.2, dmg: 70 },
      { cmd: '623', btn: 'p', type: 'rising', name: 'UPPER RELÂMPAGO', color: '#9fe0ff', dmg: 110, height: 9.5 },
      { cmd: '214', btn: 'k', type: 'spin', name: 'TORNADO', color: '#ffffff', dmg: 90, speed: 3.2, hits: 3 },
    ],
    super: { type: 'beam', name: 'MEGA ONDA', color: '#40b0ff', dmg: 330 },
    win: 'winPoint',
  },
  {
    id: 'leonardo', name: 'Leonardo', style: 'Kickboxing de Fogo', quote: 'FÁCIL DEMAIS.',
    skin: '#8a5a3a', hair: 'flattop', hairColor: '#120c08', band: '#2a9a3a',
    body: { size: 1.02, bulk: 1.1, muscle: 1.15 },
    outfit: { top: null, style: 'vest', vest: '#24983a', trim: '#f2f2f2', sleeves: 0, belt: '#141414', pants: '#2440b8', pantsCut: 'gi', shoes: 'bare', gloves: '#26a03c', strap: '#1a1a1a' },
    stats: { hp: 980, walk: 1.05, power: 1.0 },
    specials: [
      { cmd: '236', btn: 'p', type: 'projectile', name: 'BOLA DE FOGO', fx: 'fire', color: '#ff7a20', speed: 5, dmg: 75 },
      { cmd: '623', btn: 'k', type: 'rising', name: 'PONTAPÉ DO DRAGÃO', pose: 'hk', color: '#ff9a30', dmg: 120, height: 10 },
      { cmd: '214', btn: 'k', type: 'rush', name: 'JOELHADA', pose: 'lk', color: '#ff7a20', dmg: 90, speed: 6, dur: 16 },
    ],
    super: { type: 'barrage', name: 'DRAGÃO DE FOGO', color: '#ff6a10', dmg: 340 },
    win: 'win',
  },
  {
    id: 'walgidio', name: 'Walgídio', style: 'Choque Elétrico', quote: 'ISSO É QUE É!',
    skin: '#5a3824', hair: 'cap', hairColor: '#120c08', beard: 'goatee',
    body: { size: 1.0, bulk: 1.12, muscle: 1.15 },
    outfit: { top: '#e8c020', sleeves: 0, style: 'tank', pants: '#3a3a3e', pantsCut: 'baggy', cuff: '#2a2a2e', shoes: '#d42a2a', sole: '#f0f0f0', capColor: '#d42a2a', gloves: '#d42a2a', strap: '#1a1a1a' },
    stats: { hp: 1000, walk: 1.05, power: 0.95 },
    specials: [
      { cmd: '236', btn: 'p', type: 'zap', name: 'DESCARGA', color: '#fff060', dmg: 95, range: 46, hits: 4 },
      { cmd: '214', btn: 'p', type: 'rush', name: 'CARGA ELÉTRICA', pose: 'rush', color: '#fff060', dmg: 100, speed: 7, dur: 18 },
      { cmd: '623', btn: 'p', type: 'rising', name: 'RAIO ASCENDENTE', color: '#fff060', dmg: 100, height: 9 },
    ],
    super: { type: 'sky', name: 'TROVÃO DO CÉU', color: '#fff060', dmg: 320 },
    win: 'winPoint',
  },
  {
    id: 'dave', name: 'Dave', style: 'Capoeira', quote: 'YEAH BOY!',
    skin: '#4a2e1c', hair: 'afro', hairColor: '#120a06', beard: 'goatee',
    body: { size: 1.03, bulk: 1.08, muscle: 1.12 },
    outfit: { top: null, style: 'vest', vest: '#7a2ad0', trim: '#f2f2f2', sleeves: 0, belt: '#141414', pants: '#1c1c22', pantsCut: 'gi', shoes: 'bare', gloves: '#8a3ae0', strap: '#1a1a1a' },
    stats: { hp: 960, walk: 1.1, power: 0.95 },
    specials: [
      { cmd: '236', btn: 'k', type: 'spin', name: 'MEIA-LUA', color: '#c890ff', dmg: 95, speed: 3.6, hits: 3 },
      { cmd: '623', btn: 'k', type: 'rising', name: 'MORTAL', pose: 'bicycle', color: '#c890ff', dmg: 110, height: 10.5 },
      { cmd: '214', btn: 'p', type: 'teleport', name: 'GINGA', color: '#c890ff' },
    ],
    super: { type: 'barrage', name: 'RODA DE CAPOEIRA', color: '#b070ff', dmg: 330 },
    win: 'win',
  },
  {
    id: 'diego', name: 'Diego', style: 'Velocidade Pura', quote: 'RÁPIDO E FURIOSO!',
    skin: '#8a5c3c', hair: 'curly', hairColor: '#1a100a', beard: 'stubble', band: '#f07020',
    body: { size: 0.98, bulk: 1.05, muscle: 1.1 },
    outfit: { top: null, style: 'vest', vest: '#ec6a1c', trim: '#c85410', sleeves: 0, belt: '#141414', pants: '#2440b8', pantsCut: 'gi', shoes: 'bare', gloves: '#f07020', strap: '#1a1a1a' },
    stats: { hp: 920, walk: 1.25, power: 0.9 },
    specials: [
      { cmd: '236', btn: 'p', type: 'rush', name: 'SOCOS RELÂMPAGO', pose: 'rush', color: '#ffffff', dmg: 90, speed: 8, dur: 14, hits: 3 },
      { cmd: '214', btn: 'k', type: 'teleport', name: 'PASSO FANTASMA', color: '#ffffff' },
      { cmd: '623', btn: 'k', type: 'rising', name: 'PONTAPÉ VOADOR', pose: 'hk', color: '#ffffff', dmg: 95, height: 9.5 },
    ],
    super: { type: 'barrage', name: 'TEMPESTADE RELÂMPAGO', color: '#ffffff', dmg: 320 },
    win: 'winCool',
  },
  {
    id: 'naftali', name: 'Naftali', style: 'Fluxo da Água', quote: 'VOEI, MANO!',
    skin: '#3e2618', hair: 'dreads', hairColor: '#120a06', beard: true, band: '#e8c020',
    body: { size: 1.03, bulk: 1.1, muscle: 1.15 },
    outfit: { top: null, style: 'vest', vest: '#14988e', trim: '#e8c020', sleeves: 0, belt: '#141414', pants: '#7a4422', pantsCut: 'gi', shoes: 'bare', gloves: '#e8c020', strap: '#1a1a1a', accent: '#e8c020' },
    stats: { hp: 1000, walk: 1.0, power: 1.0 },
    specials: [
      { cmd: '236', btn: 'p', type: 'projectile', name: 'ONDA DE ÁGUA', fx: 'wave', color: '#40d8ff', speed: 3, dmg: 80, size: 1.4 },
      { cmd: '214', btn: 'p', type: 'counter', name: 'REFLEXO', color: '#40d8ff', dmg: 120 },
      { cmd: '623', btn: 'p', type: 'rising', name: 'GÉISER', color: '#40d8ff', dmg: 105, height: 9.5 },
    ],
    super: { type: 'beam', name: 'TSUNAMI', color: '#40d8ff', dmg: 320, wave: true },
    win: 'winCool',
  },
  {
    id: 'atircio', name: 'Atircio', style: 'Luta Livre', quote: 'NINGUÉM ME PARA.',
    skin: '#4a2e1e', hair: 'bald', hairColor: '#0e0806', beard: true, beardColor: '#6a6662', band: '#2a48b0',
    body: { size: 1.1, bulk: 1.3, muscle: 1.2 },
    outfit: { top: null, style: 'vest', vest: '#e8e6e0', trim: '#d0cec8', sleeves: 0, belt: '#141414', pants: '#24409a', pantsCut: 'gi', shoes: 'bare', gloves: '#2a48b0', strap: '#1a1a1a' },
    stats: { hp: 1150, walk: 0.8, power: 1.25 },
    specials: [
      { cmd: '214', btn: 'p', type: 'cmdGrab', name: 'ABRAÇO DE URSO', color: '#b08850', dmg: 170, range: 44 },
      { cmd: '236', btn: 'k', type: 'quake', name: 'TERRAMOTO', color: '#b08850', dmg: 80, speed: 3.4 },
      { cmd: '623', btn: 'p', type: 'rising', name: 'MARRADA', pose: 'chp', color: '#b08850', dmg: 120, height: 7 },
    ],
    super: { type: 'megaGrab', name: 'MONTANHA VIVA', color: '#c89050', dmg: 380 },
    win: 'winCool',
  },
  {
    id: 'daniel', name: 'Daniel', style: 'Taekwondo do Vento', quote: 'MISSÃO CUMPRIDA.',
    skin: '#4e3220', hair: 'flattop', hairColor: '#0e0806',
    body: { size: 1.04, bulk: 1.12, muscle: 1.15 },
    outfit: { top: '#2448b8', sleeves: 0, style: 'tank', pants: '#b8b8bc', pantsCut: 'baggy', shoes: '#f4f4f4', sole: '#dcdcdc', gloves: '#2448b8', strap: '#1a1a1a' },
    stats: { hp: 980, walk: 1.05, power: 1.0 },
    specials: [
      { cmd: '236', btn: 'k', type: 'projectile', name: 'LÂMINA DE VENTO', fx: 'blade', color: '#a0ffb0', speed: 5.5, dmg: 65, kick: true },
      { cmd: '214', btn: 'k', type: 'spin', name: 'FURACÃO', color: '#a0ffb0', dmg: 100, speed: 3.6, hits: 4 },
      { cmd: '623', btn: 'k', type: 'rising', name: 'PONTAPÉ CRESCENTE', pose: 'hk', color: '#a0ffb0', dmg: 110, height: 10 },
    ],
    super: { type: 'barrage', name: 'FURACÃO SUPREMO', color: '#a0ffb0', dmg: 330, kicks: true },
    win: 'winPoint',
  },
  {
    id: 'alvaro', name: 'Álvaro', style: 'Boxe', quote: 'TRANQUILO.',
    skin: '#4e3220', hair: 'capBack', hairColor: '#0e0806', beard: true,
    body: { size: 1.02, bulk: 1.15, muscle: 1.18 },
    outfit: { top: '#1a1a1c', sleeves: 0, style: 'tank', pants: '#cbb894', pantsCut: 'baggy', shoes: '#2448b8', sole: '#f0f0f0', capColor: '#2448b8', gloves: '#2448b8', strap: '#1a1a1a' },
    stats: { hp: 1020, walk: 1.05, power: 1.1 },
    specials: [
      { cmd: '236', btn: 'p', type: 'rush', name: 'DIRETO DE CORRIDA', pose: 'rush2', color: '#80b0ff', dmg: 110, speed: 7.5, dur: 16 },
      { cmd: '623', btn: 'p', type: 'rising', name: 'GANCHO', color: '#80b0ff', dmg: 125, height: 8 },
      { cmd: '214', btn: 'p', type: 'counter', name: 'ESQUIVA', color: '#80b0ff', dmg: 110 },
    ],
    super: { type: 'barrage', name: 'CHUVA DE SOCOS', color: '#80b0ff', dmg: 350 },
    win: 'winCool',
  },
  {
    id: 'cleusio', name: 'Cleusio', style: 'Saltos de Campeão', quote: 'SALTO DE CAMPEÃO!',
    skin: '#4a2e1e', hair: 'bald', hairColor: '#0e0806', beard: 'goatee',
    body: { size: 1.0, bulk: 1.15, muscle: 1.18 },
    outfit: { top: '#e888b0', sleeves: 0, style: 'tank', pants: '#1e2a70', pantsCut: 'baggy', shoes: '#f4f4f4', sole: '#dcdcdc', gloves: '#e888b0', strap: '#1a1a1a' },
    stats: { hp: 960, walk: 1.0, power: 1.0, jump: 1.15 },
    specials: [
      { cmd: '236', btn: 'k', type: 'dive', name: 'SALTO METEORO', color: '#ff5050', dmg: 100 },
      { cmd: '623', btn: 'p', type: 'rising', name: 'MOLA', color: '#ff5050', dmg: 105, height: 11 },
      { cmd: '214', btn: 'k', type: 'quake', name: 'ONDA DE CHOQUE', color: '#ff5050', dmg: 75, speed: 3 },
    ],
    super: { type: 'sky', name: 'METEORO FINAL', color: '#ff5050', dmg: 330, meteor: true },
    win: 'win',
  },
  {
    id: 'cristiano', name: 'Cristiano', style: 'Futebol de Rua', quote: 'SIUUU!',
    skin: '#6a4428', hair: 'curly', hairColor: '#0e0806', beard: 'goatee',
    body: { size: 1.04, bulk: 1.12, muscle: 1.15 },
    outfit: { top: '#c81e24', sleeves: 0.5, style: 'jersey', trim: '#1a8a3a', pants: '#1a8a3a', pantsCut: 'shorts', shoes: '#141414', sole: '#141414', socks: '#f2f2f2', socksHigh: true, sockBand: '#d42a2a', gloves: '#c81e24', strap: '#1a1a1a' },
    stats: { hp: 1000, walk: 1.1, power: 1.0 },
    specials: [
      { cmd: '236', btn: 'k', type: 'projectile', name: 'REMATE', fx: 'ball', color: '#ffb020', speed: 6, dmg: 75, kick: true },
      { cmd: '623', btn: 'k', type: 'rising', name: 'BICICLETA', pose: 'bicycle', color: '#ffb020', dmg: 115, height: 10 },
      { cmd: '214', btn: 'k', type: 'rush', name: 'CARRINHO', pose: 'chk', color: '#ffb020', dmg: 95, speed: 6.5, dur: 18, low: true },
    ],
    super: { type: 'beam', name: 'REMATE SUPREMO', color: '#ffb020', dmg: 340, ball: true },
    win: 'siu',
  },
];

SM.charById = (id) => SM.CHARACTERS.find((c) => c.id === id) || SM.CHARACTERS[0];
