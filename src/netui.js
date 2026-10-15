'use strict';
// Caixa HTML por cima do jogo para o modo online: link da sala (copiar/partilhar) e campo do código.
// O canvas não permite selecionar texto nem abrir o teclado do telemóvel, por isso isto é DOM.

SM.NetUI = (() => {
  const css = `
    #netui { position: fixed; left: 50%; top: 58%; transform: translate(-50%, -50%); z-index: 10;
      font-family: "Russo One", sans-serif; display: none; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: center;
      width: max-content; max-width: 92vw; }
    #netui input { font: inherit; font-size: clamp(14px, 2.6vw, 22px); padding: 8px 10px; border-radius: 6px;
      border: 2px solid #ffd040; background: #0a1020; color: #fff; text-align: center; }
    #netui .link { width: min(70vw, 520px); font-size: clamp(11px, 1.6vw, 15px); }
    #netui .code { width: 8ch; text-transform: uppercase; letter-spacing: 4px; }
    #netui button { font: inherit; font-size: clamp(13px, 2.2vw, 18px); min-height: 44px; padding: 8px 14px; border-radius: 6px; border: 0;
      background: #ffd040; color: #201000; cursor: pointer; }
    #netui button:active { transform: scale(0.96); }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const box = document.createElement('div');
  box.id = 'netui';
  document.body.appendChild(box);

  const el = (tag, props) => Object.assign(document.createElement(tag), props);

  // painel do anfitrião
  const link = el('input', { className: 'link', readOnly: true, ariaLabel: 'Link da sala' });
  const copy = el('button', { textContent: 'COPIAR LINK' });
  const share = el('button', { textContent: 'PARTILHAR' });
  copy.onclick = () => {
    const done = () => { copy.textContent = 'COPIADO!'; setTimeout(() => { copy.textContent = 'COPIAR LINK'; }, 1500); };
    const fallback = () => { link.select(); if (document.execCommand('copy')) done(); else copy.textContent = 'SELECIONA E COPIA O LINK'; };
    if (navigator.clipboard) navigator.clipboard.writeText(link.value).then(done, fallback);
    else fallback();
  };
  share.onclick = () => navigator.share({ title: 'Super Manos', text: 'Anda lutar comigo no Super Manos! Sala ' + SM.Net.code, url: link.value }).catch(() => {});
  link.onfocus = () => link.select();

  // painel do convidado
  const code = el('input', { className: 'code', ariaLabel: 'Código da sala', maxLength: 5, placeholder: 'CÓDIGO', autocapitalize: 'characters', autocomplete: 'off', spellcheck: false });
  const go = el('button', { textContent: 'ENTRAR' });
  const submit = () => { if (code.value.trim()) { SM.Net.join(code.value); code.blur(); } };
  go.onclick = submit;
  code.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') code.blur();
  });

  let mode = null;
  function show(m) {
    if (m === mode) return;
    mode = m;
    box.replaceChildren();
    if (m === 'host') {
      box.append(link, copy);
      if (navigator.share) box.append(share);
    } else if (m === 'join') {
      box.append(code, go);
      if (!matchMedia('(pointer: coarse)').matches) setTimeout(() => code.focus(), 50);
    }
    box.style.display = m ? 'flex' : 'none';
  }

  return {
    update(screen) {
      const canvas = document.querySelector('canvas').getBoundingClientRect();
      box.style.top = (canvas.top + canvas.height * (screen === 'host' ? 0.61 : 0.53)) + 'px';
      if (screen === 'host' && SM.Net.ready && SM.Net.code && SM.Net.role === 'host' && !SM.Net.connected) {
        const l = SM.Net.link();
        if (link.value !== l) link.value = l;
        show('host');
      } else if (screen === 'join' && !SM.Net.connected) show('join');
      else show(null);
    },
    setCode(c) { code.value = String(c).toUpperCase(); },
  };
})();
