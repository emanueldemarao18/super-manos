'use strict';
// Os 11 manos. Cada um tem corpo (size/bulk), roupa, estatísticas e golpes especiais.
// Especiais (ver fighter.js): projectile, rising, rush, spin, dive, cmdGrab, counter, teleport, quake.
// Super (↓↘→↓↘→ + soco, ou Forte+Pontapé Forte com a barra cheia): beam, barrage, sky, megaGrab.
// Comandos: 236 = ↓↘→, 623 = →↓↘, 214 = ↓↙←.

SM.CHARACTERS = [
  {
    id: 'emanuel', name: 'Emanuel', style: 'Karaté de Rua', quote: 'BORA, MALTA!',
    skin: '#6a4127', hair: 'short', hairColor: '#140d0a', beard: true, band: '#d83030',
    body: { size: 1.0, bulk: 1.0 },
    outfit: { top: '#f2efe8', sleeves: 0.5, style: 'gi', belt: '#151515', pants: '#f2efe8', pantsCut: 'gi', shoes: 'bare', wraps: '#d83030' },
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
    skin: '#c08a60', hair: 'flattop', hairColor: '#1c120c',
    body: { size: 1.0, bulk: 0.98 },
    outfit: { top: null, sleeves: 0, pants: '#c83a20', pantsCut: 'shorts', shoes: '#f0f0f0', sole: '#c83a20', socks: '#f0f0f0', gloves: '#d82020', belt: '#f0c020' },
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
    skin: '#a87449', hair: 'cap', hairColor: '#1c120c',
    body: { size: 0.98, bulk: 1.0 },
    outfit: { top: '#f0c020', sleeves: 0.5, style: 'tshirt', pants: '#2a2a32', pantsCut: 'long', shoes: '#e83030', sole: '#fff', capColor: '#e83030', chain: '#f8e080' },
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
    skin: '#4a2c1a', hair: 'afro', hairColor: '#120a06',
    body: { size: 1.02, bulk: 0.92 },
    outfit: { top: '#8a3ad8', sleeves: 0, style: 'tank', pants: '#f2f2f2', pantsCut: 'gi', shoes: 'bare', belt: '#8a3ad8' },
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
    skin: '#c89468', hair: 'short', hairColor: '#2a1a10',
    body: { size: 0.96, bulk: 0.9 },
    outfit: { top: '#f07818', sleeves: 1, style: 'jacket', inner: '#202020', pants: '#20263a', pantsCut: 'long', shoes: '#f0f0f0', sole: '#f07818' },
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
    skin: '#3d2416', hair: 'dreads', hairColor: '#0e0806',
    body: { size: 1.0, bulk: 0.96 },
    outfit: { top: '#18a8a0', sleeves: 1, style: 'hoodie', pants: '#3a2a1a', pantsCut: 'long', shoes: '#f0c020', sole: '#222', accent: '#f0c020' },
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
    skin: '#553420', hair: 'bald', hairColor: '#0e0806', beard: true,
    body: { size: 1.1, bulk: 1.3 },
    outfit: { top: '#e8e8e8', sleeves: 0, style: 'tank', pants: '#3a3a5a', pantsCut: 'long', shoes: '#1a1a1a', sole: '#888', belt: '#c8a020', wraps: '#e8e8e8' },
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
    skin: '#6b4428', hair: 'flattop', hairColor: '#120a06',
    body: { size: 1.02, bulk: 0.95 },
    outfit: { top: '#ffffff', sleeves: 1, style: 'gi', belt: '#2878e8', pants: '#ffffff', pantsCut: 'gi', shoes: 'bare', cuffs: '#2878e8' },
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
    skin: '#4f301c', hair: 'buzz', hairColor: '#120a06', glasses: true,
    body: { size: 1.0, bulk: 1.08 },
    outfit: { top: null, sleeves: 0, pants: '#2878e8', pantsCut: 'shorts', shoes: '#f0f0f0', sole: '#2878e8', socks: '#f0f0f0', gloves: '#2050c0', belt: '#f0f0f0' },
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
    skin: '#45291a', hair: 'buzz', hairColor: '#0e0806', band: '#e85a9a',
    body: { size: 0.98, bulk: 0.95 },
    outfit: { top: '#e85a9a', sleeves: 0.5, style: 'tshirt', pants: '#2a2a4a', pantsCut: 'shorts', shoes: '#f0f0f0', sole: '#e85a9a', socks: '#e85a9a' },
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
    skin: '#5e3b22', hair: 'short', hairColor: '#120a06',
    body: { size: 1.03, bulk: 1.0 },
    outfit: { top: '#c8102e', sleeves: 0.5, style: 'jersey', stripe: '#0a7a2a', number: '7', pants: '#ffffff', pantsCut: 'shorts', shoes: '#f0d020', sole: '#111', socks: '#c8102e' },
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
