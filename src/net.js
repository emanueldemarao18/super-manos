'use strict';
// Jogo online por WebRTC (PeerJS). Quem cria a sala é o anfitrião: corre o jogo inteiro e recebe
// os comandos do convidado como jogador 2. O convidado envia os seus botões a cada frame e
// desenha o estado que o anfitrião lhe manda (com os efeitos e sons gerados nesse frame).

SM.Net = (() => {
  const PREFIX = 'supermanos-';
  const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const N = {
    role: null, // 'host' | 'guest' | null
    code: '',
    connected: false,
    status: '',
    error: '',
    rtt: 0,
    delay: 0, // frames de atraso local do anfitrião
    remoteQ: [],
    lastRemote: 0,
    snap: null,
    events: [],
    recording: false,
    pending: [],
    closedT: 0,
  };
  let peer = null, conn = null, pingT = 0;

  const genCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.random() * CODE_CHARS.length | 0]).join('');
  const available = () => typeof window.Peer === 'function';

  function reset() {
    Object.assign(N, { role: null, code: '', connected: false, status: '', rtt: 0, delay: 0, remoteQ: [], lastRemote: 0, snap: null, events: [], pending: [] });
  }

  function leave() {
    try { if (conn) conn.close(); } catch { /* já fechada */ }
    try { if (peer) peer.destroy(); } catch { /* já destruído */ }
    conn = null;
    peer = null;
    reset();
    N.error = '';
  }

  function fail(msg) {
    const role = N.role;
    leave();
    N.error = msg;
    N.lostRole = role;
  }

  function setup(c) {
    conn = c;
    c.on('open', () => {
      N.connected = true;
      N.status = 'LIGADO!';
      if (SM.Audio) SM.Audio.sfx('confirm');
    });
    c.on('data', onData);
    c.on('close', () => { if (N.connected) fail('O OUTRO JOGADOR SAIU DA SALA'); });
    c.on('error', () => fail('ERRO NA LIGAÇÃO'));
  }

  function host() {
    if (!available()) { N.error = 'SEM INTERNET (NÃO CONSEGUI CARREGAR O MODO ONLINE)'; return; }
    leave();
    N.role = 'host';
    N.code = genCode();
    N.status = 'A CRIAR SALA...';
    peer = new window.Peer(PREFIX + N.code, { debug: 0 });
    peer.on('open', () => { N.status = 'À ESPERA DO OUTRO JOGADOR...'; });
    peer.on('connection', (c) => {
      if (conn) { c.on('open', () => c.close()); return; } // sala cheia
      setup(c);
    });
    peer.on('error', (e) => {
      if (e.type === 'unavailable-id') { host(); return; } // código já usado: gera outro
      if (!N.connected) fail('NÃO FOI POSSÍVEL CRIAR A SALA (' + e.type + ')');
    });
    peer.on('disconnected', () => { if (!N.connected && peer && !peer.destroyed) peer.reconnect(); });
  }

  function join(code) {
    if (!available()) { N.error = 'SEM INTERNET (NÃO CONSEGUI CARREGAR O MODO ONLINE)'; return; }
    leave();
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) { N.error = 'CÓDIGO INVÁLIDO'; return; }
    N.role = 'guest';
    N.code = code;
    N.status = 'A LIGAR À SALA ' + code + '...';
    peer = new window.Peer({ debug: 0 });
    peer.on('open', () => setup(peer.connect(PREFIX + code, { reliable: true, serialization: 'json' })));
    peer.on('error', (e) => {
      if (e.type === 'peer-unavailable') fail('SALA ' + code + ' NÃO ENCONTRADA');
      else if (!N.connected) fail('NÃO FOI POSSÍVEL LIGAR (' + e.type + ')');
    });
  }

  function send(msg) {
    if (!conn || !N.connected) return;
    // não acumula frames se a rede estiver lenta
    const dc = conn.dataChannel;
    if (msg.t === 's' && dc && dc.bufferedAmount > 128 * 1024) return;
    try { conn.send(msg); } catch { /* ligação a fechar */ }
  }

  function onData(m) {
    if (!m || typeof m !== 'object') return;
    switch (m.t) {
      case 'i': // anfitrião: comandos do convidado
        N.remoteQ.push(m);
        break;
      case 's': // convidado: estado do jogo
        N.snap = m;
        if (m.ev && m.ev.length) N.pending.push(...m.ev);
        N.rtt = m.rtt || N.rtt;
        break;
      case 'ping':
        send({ t: 'pong', ts: m.ts });
        break;
      case 'pong':
        N.rtt = Math.round(performance.now() - m.ts);
        N.delay = SM.clamp(Math.round(N.rtt / 2 / 16.7), 0, 6);
        break;
    }
  }

  // anfitrião: próximo frame de comandos do convidado (junta toques se houver atraso acumulado)
  function nextRemote() {
    const q = N.remoteQ;
    if (!q.length) return { held: N.lastRemote, pressed: 0 };
    let m = q.shift();
    let pressed = m.p;
    while (q.length > 3) { m = q.shift(); pressed |= m.p; }
    N.lastRemote = m.h;
    return { held: m.h, pressed };
  }

  // ---------- eventos visuais/sonoros reproduzidos no convidado ----------
  const TRACK = { FX: ['spark', 'dust', 'trail', 'text', 'bolt', 'clear'], Audio: ['sfx', 'music'] };
  for (const [obj, names] of Object.entries(TRACK)) {
    for (const name of names) {
      const orig = SM[obj][name];
      SM[obj][name] = function (...args) {
        if (N.recording) N.events.push([obj, name, args]);
        return orig.apply(this, args);
      };
    }
  }

  function replay() {
    for (const [obj, name, args] of N.pending) if (SM[obj] && SM[obj][name]) SM[obj][name](...args);
    N.pending.length = 0;
  }

  // chamado a cada frame pela App
  function tick() {
    if (N.role === 'host' && N.connected && ++pingT % 60 === 0) send({ t: 'ping', ts: performance.now() });
  }

  const link = () => location.origin + location.pathname + '?sala=' + N.code;

  return Object.assign(N, { host, join, leave, send, nextRemote, replay, tick, link, available });
})();

// ---------- fotografias do estado (anfitrião → convidado) ----------
(() => {
  const r1 = (v) => Math.round(v * 10) / 10;

  SM.Fighter.prototype.snap = function () {
    const m = this.move;
    let mv = null;
    if (m) {
      mv = { k: m.kind, t: m.t, h: m.heavy ? 1 : 0 };
      if (m.kind === 'normal') { mv.n = m.name; mv.a = m.air ? 1 : 0; }
      if (m.kind === 'special') mv.si = this.ch.specials.indexOf(m.sp);
      if (m.kind === 'throw') mv.st = m.style;
      for (const key of ['landed', 'diving', 'lock', 'done', 'stop']) if (m[key]) mv[key] = m[key];
      if (m.grab) mv.g = { t: m.grab.t, st: m.grab.style };
    }
    return {
      x: r1(this.x), y: r1(this.y), vy: r1(this.vy), f: this.face, hp: this.hp, rh: Math.round(this.redHp), me: Math.round(this.meter), w: this.wins,
      s: this.state, t: this.t, c: this.crouching ? 1 : 0, hi: this.hidden ? 1 : 0, ko: this.ko ? 1 : 0, fl: this.flash, df: this.drawFlip,
      gu: this.guard ? 1 : 0, hp2: this.hitPose, m: mv,
    };
  };

  SM.Fighter.prototype.applySnap = function (s) {
    Object.assign(this, {
      x: s.x, y: s.y, vy: s.vy, face: s.f, hp: s.hp, redHp: s.rh, meter: s.me, wins: s.w, state: s.s, t: s.t,
      crouching: !!s.c, hidden: !!s.hi, ko: !!s.ko, flash: s.fl, drawFlip: s.df, guard: !!s.gu, hitPose: s.hp2,
    });
    const mv = s.m;
    if (!mv) { this.move = null; return; }
    const m = { kind: mv.k, t: mv.t, heavy: !!mv.h };
    if (mv.k === 'normal') { m.name = mv.n; m.def = SM.MOVES[mv.n]; m.air = !!mv.a; }
    if (mv.k === 'special') m.sp = this.ch.specials[mv.si];
    if (mv.k === 'super') m.sp = this.ch.super;
    if (mv.k === 'throw') m.style = mv.st;
    for (const key of ['landed', 'diving', 'lock', 'done', 'stop']) if (mv[key]) m[key] = mv[key];
    if (mv.g) m.grab = { kind: 'throw', t: mv.g.t, style: mv.g.st };
    this.move = m;
  };

  SM.Battle.prototype.snap = function () {
    const fz = this.freeze;
    return {
      c: this.fighters.map((f) => f.ch.id), st: this.stage.id, tr: this.training ? 1 : 0,
      t: this.t, ph: this.phase, pt: this.phaseT, rd: this.round, tm: this.timer, cam: r1(this.camX), sh: this.shakeT,
      fz: fz ? { s: fz.f.side, t: fz.t } : null,
      cb: this.combo, cs: this.comboShow, ct: this.comboT, co: this.callouts, la: this.lastAttacker, res: this.result,
      p: this.projectiles.map((p) => ({
        x: r1(p.x), y: r1(p.y), fx: p.fx, c: p.color, d: p.dir, sz: p.size, b: p.beam ? 1 : 0, col: p.column ? 1 : 0,
        x0: p.x0 !== undefined ? r1(p.x0) : undefined, h: p.h, w: p.w, pt: p.t, me: p.meteor ? 1 : 0,
      })),
      f: this.fighters.map((f) => f.snap()),
    };
  };

  SM.Battle.prototype.applySnap = function (s) {
    Object.assign(this, {
      t: s.t, phase: s.ph, phaseT: s.pt, round: s.rd, timer: s.tm, camX: s.cam, shakeT: s.sh,
      combo: s.cb, comboShow: s.cs, comboT: s.ct, callouts: s.co, lastAttacker: s.la, result: s.res,
    });
    s.f.forEach((fs, i) => this.fighters[i].applySnap(fs));
    this.freeze = s.fz ? { f: this.fighters[s.fz.s], sp: this.fighters[s.fz.s].ch.super, t: s.fz.t } : null;
    this.projectiles = s.p.map((p) => ({
      x: p.x, y: p.y, fx: p.fx, color: p.c, dir: p.d, size: p.sz, beam: !!p.b, column: !!p.col, x0: p.x0, h: p.h, w: p.w, t: p.pt, meteor: !!p.me,
    }));
  };
})();
