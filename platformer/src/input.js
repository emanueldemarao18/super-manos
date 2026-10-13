'use strict';
// Teclado: setas/WASD para mover, Z/Espaço/↑ para saltar, X/Shift para correr, Enter para confirmar.

SM.Input = (() => {
  const down = new Set();
  const pressed = new Set();

  const MAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    KeyZ: 'jump', Space: 'jump', KeyK: 'jump',
    KeyX: 'run', ShiftLeft: 'run', ShiftRight: 'run', KeyJ: 'run',
    Enter: 'start', KeyP: 'pause', Escape: 'pause',
    KeyM: 'mute',
  };

  addEventListener('keydown', (e) => {
    const a = MAP[e.code];
    if (!a) return;
    e.preventDefault();
    if (!down.has(a)) pressed.add(a);
    down.add(a);
  });
  addEventListener('keyup', (e) => {
    const a = MAP[e.code];
    if (a) down.delete(a);
  });
  addEventListener('blur', () => down.clear());

  return {
    held: (a) => down.has(a),
    hit: (a) => pressed.has(a),
    // chamado no fim de cada frame lógico
    endFrame: () => pressed.clear(),
  };
})();
