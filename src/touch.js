'use strict';
// Controlos de toque para telemóvel/tablet: joystick fixo à esquerda, botões de ataque à
// direita. Aparecem ao primeiro toque e alimentam o jogador 1 como se fosse um comando.

SM.Touch = (() => {
  const B = SM.BTN;
  let latch = 0, active = false;

  const css = `
    body.fighting { touch-action: none; overscroll-behavior: none; }
    #touch { position: fixed; inset: 0; z-index: 5; pointer-events: none; display: none;
      user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: none; font-family: "Russo One", sans-serif; }
    #touch.on { display: block; }
    #touch .stick { position: absolute; left: 0; bottom: 0; width: 46%; height: 76%; pointer-events: auto; touch-action: none; }
    #touch .origin { position: absolute; left: max(100px, calc(env(safe-area-inset-left) + 80px)); bottom: max(96px, calc(env(safe-area-inset-bottom) + 80px)); width: 0; height: 0; pointer-events: none; }
    #touch .base, #touch .knob { position: absolute; left: 0; top: 0; border-radius: 50%; pointer-events: none; transform: translate(-50%, -50%); }
    #touch .base { width: 136px; height: 136px; background: rgba(8,18,30,0.5); border: 2px solid rgba(190,225,245,0.65); box-shadow: inset 0 0 0 14px rgba(255,255,255,0.04); }
    #touch .base::before, #touch .base::after { content: ''; position: absolute; background: rgba(190,225,245,0.2); }
    #touch .base::before { left: 50%; top: 8px; bottom: 8px; width: 1px; }
    #touch .base::after { top: 50%; left: 8px; right: 8px; height: 1px; }
    #touch .knob { width: 58px; height: 58px; background: rgba(155,200,225,0.65); border: 2px solid rgba(225,245,255,0.9); box-shadow: 0 3px 12px rgba(0,0,0,0.35); }
    #touch .origin.engaged .base { border-color: #67e8ff; }
    #touch .origin.engaged .knob { background: rgba(65,205,235,0.9); }
    #touch .hint { position: absolute; left: 0; top: 77px; transform: translateX(-50%); color: rgba(235,245,255,0.8); font-size: 11px; white-space: nowrap; pointer-events: none; }
    #touch .pad { position: absolute; right: 2.5%; bottom: max(4%, env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(2, 64px); gap: 10px; pointer-events: auto; }
    #touch .btn { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center;
      font-family: inherit; padding: 0; font-size: 11px; line-height: 1.05; color: #fff; text-shadow: 0 1px 2px #000; border: 2px solid rgba(255,255,255,0.7); touch-action: none; }
    #touch .p { background: rgba(240,170,30,0.55); }
    #touch .k { background: rgba(40,130,255,0.55); }
    #touch .btn.down { filter: brightness(1.6); transform: scale(0.93); }
    #touch .super { position: absolute; right: calc(2.5% + 148px); bottom: calc(4% + 37px); width: 58px; height: 58px; font-size: 10px;
      background: rgba(255,60,120,0.55); pointer-events: auto; }
    #touch .menu { position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); width: 48px; height: 44px; border-radius: 8px;
      font-size: 16px; background: rgba(0,0,0,0.45); pointer-events: auto; }
    #touch .back { position: absolute; top: max(8px, env(safe-area-inset-top)); left: max(8px, env(safe-area-inset-left)); width: 70px; height: 44px; border-radius: 8px; font-size: 10px;
      background: rgba(0,0,0,0.45); pointer-events: auto; }
    #touch.lobby .stick, #touch.lobby .origin, #touch.lobby .pad, #touch.lobby .menu { display: none; }
    #rotate { position: fixed; inset: 0; z-index: 20; display: none; align-items: center; justify-content: center; flex-direction: column;
      background: rgba(0,0,0,0.88); color: #fff; font: 18px "Russo One", sans-serif; text-align: center; gap: 12px; }
    #rotate .icon { font-size: 54px; animation: spin 1.6s ease-in-out infinite; }
    @keyframes spin { 0%, 30% { transform: rotate(0); } 70%, 100% { transform: rotate(-90deg); } }
    @media (orientation: portrait) { body.touching.fighting #rotate { display: flex; pointer-events: none; background: rgba(0,0,0,0.7); } }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'touch';
  root.innerHTML = `
    <div class="stick" role="group" aria-label="Movimento: arrasta para andar, saltar ou agachar"></div>
    <div class="origin" aria-hidden="true"><div class="base"></div><div class="knob"></div><div class="hint">MOVER</div></div>
    <div class="pad">
      <button type="button" class="btn p" data-b="lp">SOCO</button><button type="button" class="btn p" data-b="hp">SOCO<br>FORTE</button>
      <button type="button" class="btn k" data-b="lk">PONTA-<br>PÉ</button><button type="button" class="btn k" data-b="hk">PONTAPÉ<br>FORTE</button>
    </div>
    <button type="button" class="btn super" data-b="super">SUPER</button>
    <button type="button" class="btn menu" data-b="start">☰</button>
    <button type="button" class="btn back" data-b="back">◀ VOLTAR</button>`;
  document.body.appendChild(root);
  const rot = document.createElement('div');
  rot.id = 'rotate';
  rot.innerHTML = '<div class="icon">📱</div><div>Roda o telemóvel<br>para jogar deitado</div>';
  document.body.appendChild(rot);

  const stick = root.querySelector('.stick'), origin = root.querySelector('.origin'), knob = root.querySelector('.knob');

  // captura o dedo no elemento (se o browser deixar) para não o perder ao deslizar
  const capture = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch { /* toque simulado */ } };

  // ---------- joystick ----------
  let stickId = null, cx = 0, cy = 0, dirBits = 0;
  const R = 42, DEAD = 12;
  const setDir = (dx, dy) => {
    let b = 0;
    const d = Math.hypot(dx, dy);
    if (d > DEAD) {
      const a = Math.atan2(dy, dx); // 0 = direita, positivo = para baixo
      const oct = Math.round(a / (Math.PI / 4)); // -4..4
      const map = { 0: B.right, 1: B.right | B.down, 2: B.down, 3: B.left | B.down, 4: B.left, '-4': B.left, '-3': B.left | B.up, '-2': B.up, '-1': B.right | B.up };
      b = map[oct];
    }
    latch |= b & ~dirBits; // direções curtas também contam
    dirBits = b;
  };
  stick.addEventListener('pointerdown', (e) => {
    if (stickId !== null) return;
    stickId = e.pointerId;
    capture(stick, e);
    const center = origin.getBoundingClientRect();
    cx = center.left; cy = center.top;
    origin.classList.add('engaged');
    moveStick(e);
    e.preventDefault();
  });
  function moveStick(e) {
    if (e.pointerId !== stickId) return;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.left = dx + 'px';
    knob.style.top = dy + 'px';
    setDir(dx, dy);
  }
  stick.addEventListener('pointermove', moveStick);
  function centerStick() {
    knob.style.left = knob.style.top = '0px';
    origin.classList.remove('engaged');
  }
  const stickEnd = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    dirBits = 0;
    centerStick();
  };
  stick.addEventListener('pointerup', stickEnd);
  stick.addEventListener('pointercancel', stickEnd);
  stick.addEventListener('lostpointercapture', stickEnd);

  // ---------- botões ----------
  const held = new Map(); // pointerId -> bits
  const btnBits = (name) => (name === 'super' ? B.hp | B.hk : B[name]);
  for (const el of root.querySelectorAll('.btn')) {
    const b = btnBits(el.dataset.b);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      capture(el, e);
      held.set(e.pointerId, b);
      latch |= b;
      el.classList.add('down');
      if (navigator.vibrate) navigator.vibrate(8);
    });
    const up = (e) => { held.delete(e.pointerId); el.classList.remove('down'); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  function clear() {
    held.clear(); latch = dirBits = 0; stickId = null;
    centerStick();
    for (const el of root.querySelectorAll('.down')) el.classList.remove('down');
  }
  addEventListener('blur', clear);
  addEventListener('resize', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });

  // Safari can still zoom absolutely positioned controls despite touch-action: none.
  const preventFightZoom = (e) => {
    if (SM.App && SM.App.S.screen === 'fight' && e.cancelable) e.preventDefault();
  };
  for (const type of ['touchmove', 'touchend', 'gesturestart', 'gesturechange']) {
    document.addEventListener(type, preventFightZoom, { passive: false });
  }

  // ---------- ativação ----------
  function activate() {
    if (active) return;
    active = true;
    root.classList.add('on');
    document.body.classList.add('touching');
    if (SM.Audio) SM.Audio.init();
  }
  addEventListener('touchstart', (e) => {
    activate();
    // no ecrã de título, tocar em qualquer lado começa
    if (SM.App && SM.App.S.screen === 'title') latch |= B.start;
    // ecrã inteiro e horizontal (Android); no iPhone fica só o aviso para rodar
    const de = document.documentElement;
    if (SM.App && SM.App.S.screen === 'fight' && !document.fullscreenElement && de.requestFullscreen && !e.target.closest('#netui')) {
      de.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
    }
  }, { passive: true });

  return {
    get active() { return active; },
    // bits deste frame para o jogador 1 (os toques curtos ficam no latch até serem lidos)
    read() {
      let h = dirBits;
      for (const b of held.values()) h |= b;
      const out = h | latch;
      latch = 0;
      return out;
    },
    // em ecrãs com menus mostra o botão VOLTAR; na luta mostra o SUPER
    setScreen(screen) {
      const fight = screen === 'fight';
      document.body.classList.toggle('fighting', fight);
      root.classList.toggle('lobby', ['host', 'join', 'search'].includes(screen));
      const back = root.querySelector('.back');
      back.style.display = fight && !SM.Net.connected ? 'none' : '';
      back.textContent = fight ? 'SAIR' : '◀ VOLTAR';
      root.querySelector('.super').style.display = fight ? '' : 'none';
    },
  };
})();
