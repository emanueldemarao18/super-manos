'use strict';

SM.PWA = (() => {
  let registration, installPrompt, saving = false, applying = false, offlineReady = false;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const safe = () => SM.App && ['title', 'menu'].includes(SM.App.S.screen) && !SM.Net.connected;
  const style = document.createElement('style');
  style.textContent = `
    #pwa-open { position:fixed; top:max(10px,env(safe-area-inset-top)); right:max(10px,env(safe-area-inset-right)); z-index:12; }
    #pwa-open, #pwa-panel button { min-height:44px; padding:10px 16px; border:1px solid #61758b; border-radius:8px; background:#142437; color:#fff; font:14px "Russo One",sans-serif; touch-action:manipulation; cursor:pointer; }
    #pwa-panel { box-sizing:border-box; width:min(440px,94vw); max-height:90dvh; overflow:auto; padding:24px; border:1px solid #61758b; border-radius:14px; background:#0c1422; color:#fff; font:16px/1.5 sans-serif; }
    #pwa-panel::backdrop { background:rgba(0,0,0,.8); }
    #pwa-panel h2 { margin:0 0 12px; font:24px "Russo One",sans-serif; }
    #pwa-panel p { margin:12px 0; }
    #pwa-panel .actions { display:flex; gap:10px; flex-wrap:wrap; }
    #pwa-panel .primary { background:#ffd33d; color:#171717; border-color:#ffd33d; }
    #pwa-panel button:disabled { opacity:.6; cursor:wait; }
    #pwa-panel progress { width:100%; accent-color:#67e8ff; }
    #pwa-panel [hidden], #pwa-open[hidden] { display:none; }
  `;
  document.head.appendChild(style);
  const opener = document.createElement('button');
  opener.id = 'pwa-open'; opener.type = 'button'; opener.textContent = 'APP / OFFLINE'; opener.hidden = true;
  const panel = document.createElement('dialog');
  panel.id = 'pwa-panel'; panel.setAttribute('aria-labelledby', 'pwa-title');
  panel.innerHTML = `<h2 id="pwa-title">SUPER MANOS NO TELEMÓVEL</h2>
    <p id="pwa-install-help"></p><div class="actions"><button type="button" class="primary" id="pwa-install">INSTALAR</button></div>
    <p>Guarda os lutadores e o cenário para jogar sozinho sem Internet. O modo online precisa sempre de ligação.</p>
    <p id="pwa-pack-help">Download de cerca de 22 MB. Podes usar Wi-Fi.</p>
    <progress id="pwa-progress" hidden aria-label="Ficheiros guardados"></progress>
    <div class="actions"><button type="button" id="pwa-save">GUARDAR PARA JOGAR OFFLINE</button><button type="button" id="pwa-update" hidden>ATUALIZAR AGORA</button><button type="button" id="pwa-close">VOLTAR</button></div>
    <p id="pwa-status" role="status" aria-live="polite"></p>`;
  document.body.append(opener, panel);
  const get = id => panel.querySelector('#pwa-' + id);
  const status = text => { get('status').textContent = text; };
  function refresh() {
    get('install').hidden = !installPrompt || standalone();
    get('install-help').textContent = standalone() ? 'O jogo já está aberto como aplicação.'
      : installPrompt ? 'Instala o jogo para o abrires pelo ícone do telemóvel.'
        : /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) ? 'No Safari: Partilhar → Adicionar ao ecrã principal → Adicionar. Ativa «Abrir como aplicação web» se essa opção aparecer.'
          : 'No menu do browser, escolhe «Instalar aplicação» ou «Adicionar ao ecrã principal».';
    get('save').disabled = saving || offlineReady || !registration || !navigator.serviceWorker.controller;
    get('save').textContent = offlineReady ? 'PRONTO PARA JOGAR OFFLINE' : saving ? 'A GUARDAR…' : 'GUARDAR PARA JOGAR OFFLINE';
    get('update').hidden = !registration || !registration.waiting;
    get('update').disabled = saving || applying;
  }
  function request(worker, type, onProgress) {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      let timer;
      const finish = (error, data) => { clearTimeout(timer); channel.port1.close(); error ? reject(new Error(error)) : resolve(data); };
      const reset = () => { clearTimeout(timer); timer = setTimeout(() => finish('A operação demorou demasiado. Verifica a ligação e tenta novamente.'), 60000); };
      channel.port1.onmessage = ({ data }) => {
        reset();
        if (data.error) finish(data.error);
        else if (data.done) finish(null, data);
        else if (onProgress) onProgress(data);
      };
      reset();
      worker.postMessage({ type, safe: safe() }, [channel.port2]);
    });
  }
  async function checkOffline() {
    const worker = navigator.serviceWorker.controller;
    if (!worker) return;
    try { offlineReady = (await request(worker, 'STATUS')).offlineReady; refresh(); } catch (error) { status(error.message); }
  }
  opener.onclick = async () => {
    if (!safe()) return;
    status(''); refresh(); panel.showModal(); await checkOffline();
  };
  get('close').onclick = () => { if (!applying) panel.close(); };
  panel.addEventListener('cancel', event => { if (applying) event.preventDefault(); });
  panel.addEventListener('keydown', event => event.stopPropagation());
  get('install').onclick = async () => {
    if (!installPrompt) return;
    const prompt = installPrompt; installPrompt = null; refresh();
    try { await prompt.prompt(); await prompt.userChoice; } catch { status('Usa o menu do browser para instalar o jogo.'); }
  };
  get('save').onclick = async () => {
    if (saving || !safe() || !navigator.serviceWorker.controller) return;
    saving = true; refresh(); status('A guardar os ficheiros. Mantém o jogo aberto.');
    const progress = get('progress'); progress.hidden = false; progress.removeAttribute('value');
    try {
      const result = await request(navigator.serviceWorker.controller, 'SAVE_OFFLINE', data => {
        progress.max = data.total; progress.value = data.completed;
        status('A guardar: ' + data.completed + ' de ' + data.total + ' ficheiros.');
      });
      offlineReady = result.offlineReady; status('Pronto! Já podes jogar sozinho sem Internet.');
    } catch (error) { status(error.message); }
    saving = false; progress.hidden = true; refresh();
  };
  get('update').onclick = async () => {
    if (!safe() || saving || !registration.waiting) return;
    applying = true; refresh(); get('close').disabled = true; status('A atualizar o jogo…');
    try { await request(registration.waiting, 'ACTIVATE_UPDATE'); }
    catch (error) { applying = false; get('close').disabled = false; refresh(); status(error.message); }
  };
  addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; refresh(); });
  addEventListener('appinstalled', () => { installPrompt = null; refresh(); });
  if ('serviceWorker' in navigator && isSecureContext) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (applying) location.reload(); else checkOffline();
    });
    navigator.serviceWorker.register(new URL('../sw.js', document.currentScript.src), { updateViaCache: 'none' }).then(reg => {
      registration = reg; refresh(); checkOffline();
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker.addEventListener('statechange', () => { if (worker.state === 'installed') refresh(); });
      });
    }).catch(() => status('A instalação offline está indisponível. Podes continuar a jogar no browser.'));
  } else {
    get('pack-help').textContent = 'Para guardar o jogo offline, abre o endereço público HTTPS do Super Manos.';
  }
  return {
    get blocked() { return panel.open || applying; },
    update(screen) {
      opener.hidden = !['title', 'menu'].includes(screen) || SM.Net.connected;
      if (panel.open && !safe() && !applying) panel.close();
    },
  };
})();
