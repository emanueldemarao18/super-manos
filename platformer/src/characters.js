'use strict';
// Os manos jogáveis. speed e jump multiplicam a física base; perk é uma habilidade especial.
// hair: short | flattop | afro | buzz | cap | dreads

SM.PERKS = {
  doubleJump: 'SALTO DUPLO',
  floaty: 'PLANA NO AR',
  magnet: 'ÍMAN DE MOEDAS',
  tough: 'AGUENTA 1 TOQUE',
};

SM.CHARACTERS = [
  { id: 'emanuel', name: 'Emanuel', skin: '#5c3a21', hair: 'short', beard: true, hairColor: '#140d0a', shirt: '#d83a3a', pants: '#2b4cc4', accent: '#ffffff', speed: 1.0, jump: 1.0, perk: null, quote: 'BORA, MALTA!' },
  { id: 'leonardo', name: 'Leonardo', skin: '#b5815a', hair: 'flattop', beard: false, hairColor: '#1c120c', shirt: '#2fa84a', pants: '#24346c', accent: '#ffffff', speed: 1.0, jump: 1.1, perk: null, quote: 'FÁCIL DEMAIS.' },
  { id: 'walgidio', name: 'Walgídio', skin: '#a87449', hair: 'cap', beard: false, hairColor: '#1c120c', shirt: '#f0c020', pants: '#3a3a3a', accent: '#e83030', speed: 1.0, jump: 1.0, perk: 'magnet', quote: 'ISSO É QUE É!' },
  { id: 'dave', name: 'Dave', skin: '#4a2c1a', hair: 'afro', beard: false, hairColor: '#120a06', shirt: '#8a3ad8', pants: '#1e1e2e', accent: '#ffffff', speed: 0.95, jump: 1.0, perk: 'floaty', quote: 'YEAH BOY!' },
  { id: 'diego', name: 'Diego', skin: '#c08a5e', hair: 'short', beard: false, hairColor: '#2a1a10', shirt: '#f07818', pants: '#2b4cc4', accent: '#ffffff', speed: 1.15, jump: 0.95, perk: null, quote: 'RÁPIDO E FURIOSO!' },
  { id: 'naftali', name: 'Naftali', skin: '#3d2416', hair: 'dreads', beard: false, hairColor: '#0e0806', shirt: '#18a8a0', pants: '#3a2a1a', accent: '#f0c020', speed: 1.0, jump: 0.95, perk: 'doubleJump', quote: 'VOEI, MANO!' },
  { id: 'atircio', name: 'Atircio', skin: '#553420', hair: 'buzz', beard: true, hairColor: '#0e0806', shirt: '#e8e8e8', pants: '#3a3a5a', accent: '#ffffff', speed: 0.95, jump: 0.95, perk: 'tough', quote: 'NINGUÉM ME PARA.' },
  { id: 'daniel', name: 'Daniel', skin: '#6b4428', hair: 'flattop', beard: false, hairColor: '#120a06', shirt: '#2878e8', pants: '#d8d8d8', accent: '#ffffff', speed: 1.05, jump: 1.05, perk: null, quote: 'MISSÃO CUMPRIDA.' },
  { id: 'alvaro', name: 'Álvaro', skin: '#4f301c', hair: 'cap', beard: false, hairColor: '#120a06', shirt: '#303030', pants: '#7a5a3a', accent: '#2878e8', speed: 1.1, jump: 0.95, perk: null, quote: 'TRANQUILO.' },
  { id: 'cleusio', name: 'Cleusio', skin: '#45291a', hair: 'buzz', beard: false, hairColor: '#0e0806', shirt: '#e85a9a', pants: '#2a2a4a', accent: '#ffffff', speed: 0.9, jump: 1.15, perk: null, quote: 'SALTO DE CAMPEÃO!' },
  { id: 'cristiano', name: 'Cristiano', skin: '#5e3b22', hair: 'short', beard: false, hairColor: '#120a06', shirt: '#c8102e', pants: '#0a6a2a', accent: '#ffffff', speed: 1.12, jump: 1.08, perk: null, quote: 'SIUUU!' },
];
