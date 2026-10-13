'use strict';
// Os manos lutadores. speed, power e jump multiplicam a base; jutsu.type escolhe o golpe especial
// (ver updateCast em sim.js). hair: short | flattop | afro | buzz | cap | dreads

SM.CHARACTERS = [
  { id: 'emanuel', name: 'Emanuel', skin: '#5c3a21', hair: 'short', beard: true, hairColor: '#140d0a', shirt: '#d83a3a', pants: '#2b2b44', band: '#1c2c5c', speed: 1.0, power: 1.0, jump: 1.0,
    jutsu: { type: 'orb', name: 'ESFERA ESPIRAL', ult: 'MEGA ESFERA', color: '#40b0ff' }, quote: 'BORA, MALTA!' },
  { id: 'leonardo', name: 'Leonardo', skin: '#b5815a', hair: 'flattop', beard: false, hairColor: '#1c120c', shirt: '#2fa84a', pants: '#24346c', band: '#1c2c5c', speed: 1.0, power: 1.0, jump: 1.05,
    jutsu: { type: 'fireball', name: 'BOLA DE FOGO', ult: 'DRAGÃO DE FOGO', color: '#ff7a20' }, quote: 'FÁCIL DEMAIS.' },
  { id: 'walgidio', name: 'Walgídio', skin: '#a87449', hair: 'cap', beard: false, hairColor: '#1c120c', shirt: '#f0c020', pants: '#3a3a3a', accent: '#e83030', speed: 1.05, power: 0.95, jump: 1.0,
    jutsu: { type: 'lightning', name: 'RAIO', ult: 'TROVÃO DO CÉU', color: '#fff060' }, quote: 'ISSO É QUE É!' },
  { id: 'dave', name: 'Dave', skin: '#4a2c1a', hair: 'afro', beard: false, hairColor: '#120a06', shirt: '#8a3ad8', pants: '#1e1e2e', band: '#3a1a5a', speed: 1.0, power: 0.95, jump: 1.0,
    jutsu: { type: 'clones', name: 'CLONES DAS SOMBRAS', ult: 'EXÉRCITO DE SOMBRAS', color: '#b070ff' }, quote: 'YEAH BOY!' },
  { id: 'diego', name: 'Diego', skin: '#c08a5e', hair: 'short', beard: false, hairColor: '#2a1a10', shirt: '#f07818', pants: '#2b2b44', band: '#1c2c5c', speed: 1.15, power: 0.9, jump: 1.0,
    jutsu: { type: 'teleport', name: 'PASSO RELÂMPAGO', ult: 'TEMPESTADE RELÂMPAGO', color: '#ffffff' }, quote: 'RÁPIDO E FURIOSO!' },
  { id: 'naftali', name: 'Naftali', skin: '#3d2416', hair: 'dreads', beard: false, hairColor: '#0e0806', shirt: '#18a8a0', pants: '#3a2a1a', band: '#0a4a5a', speed: 1.0, power: 1.0, jump: 1.0,
    jutsu: { type: 'wave', name: 'ONDA DE ÁGUA', ult: 'TSUNAMI', color: '#40d8ff' }, quote: 'VOEI, MANO!' },
  { id: 'atircio', name: 'Atircio', skin: '#553420', hair: 'buzz', beard: true, hairColor: '#0e0806', shirt: '#e8e8e8', pants: '#3a3a5a', band: '#5a3a1a', speed: 0.9, power: 1.15, jump: 0.95,
    jutsu: { type: 'eruption', name: 'PUNHO DE PEDRA', ult: 'MONTANHA VIVA', color: '#b08850' }, quote: 'NINGUÉM ME PARA.' },
  { id: 'daniel', name: 'Daniel', skin: '#6b4428', hair: 'flattop', beard: false, hairColor: '#120a06', shirt: '#2878e8', pants: '#d8d8d8', band: '#1c2c5c', speed: 1.05, power: 1.0, jump: 1.05,
    jutsu: { type: 'wind', name: 'LÂMINA DE VENTO', ult: 'FURACÃO', color: '#a0ffb0' }, quote: 'MISSÃO CUMPRIDA.' },
  { id: 'alvaro', name: 'Álvaro', skin: '#4f301c', hair: 'cap', beard: false, hairColor: '#120a06', shirt: '#303030', pants: '#7a5a3a', accent: '#2878e8', speed: 1.05, power: 1.0, jump: 1.0,
    jutsu: { type: 'pull', name: 'CORRENTE SOMBRIA', ult: 'PRISÃO DE SOMBRAS', color: '#8060c0' }, quote: 'TRANQUILO.' },
  { id: 'cleusio', name: 'Cleusio', skin: '#45291a', hair: 'buzz', beard: false, hairColor: '#0e0806', shirt: '#e85a9a', pants: '#2a2a4a', band: '#5a1a3a', speed: 0.9, power: 1.1, jump: 1.15,
    jutsu: { type: 'slam', name: 'SALTO METEORO', ult: 'METEORO FINAL', color: '#ff5050' }, quote: 'SALTO DE CAMPEÃO!' },
  { id: 'cristiano', name: 'Cristiano', skin: '#5e3b22', hair: 'short', beard: false, hairColor: '#120a06', shirt: '#c8102e', pants: '#0a6a2a', band: '#0a6a2a', speed: 1.1, power: 1.0, jump: 1.1,
    jutsu: { type: 'kickball', name: 'REMATE DE FOGO', ult: 'REMATE SUPREMO', color: '#ffb020' }, quote: 'SIUUU!' },
];
