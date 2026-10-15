'use strict';
// Host-authoritative WebRTC: guests send controls and receive game snapshots.
SM.Net = (() => {
  const VERSION = 3, PREFIX = 'supermanos-v3-', QUEUE = PREFIX + 'waiting';
  const N = { role: null, code: '', connected: false, ready: false, searching: false, status: '', error: '', rtt: 0, delay: 0, remoteQ: [], lastRemote: 0, snap: null, events: [], pending: [], recording: false };
  let peer, conn, queuePeer, probe, generation = 0, lastPacket = 0, lastInput = 0, lastPing = 0;
  const timers = new Set();
  const later = (fn, ms) => { const g = generation; const id = setTimeout(() => { timers.delete(id); if (g === generation) fn(); }, ms); timers.add(id); return id; };
  const cancel = id => { clearTimeout(id); timers.delete(id); };
  const close = obj => { try { if (obj) obj.destroy ? obj.destroy() : obj.close(); } catch {} };
  const available = () => typeof window.Peer === 'function';
  const genCode = () => Array.from({length: 5}, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.random() * 31 | 0]).join('');
  function leave() {
    generation++;
    for (const id of timers) clearTimeout(id);
    timers.clear();
    const old = [conn, probe, queuePeer, peer];
    conn = probe = queuePeer = peer = null;
    Object.assign(N, {role: null, code: '', connected: false, ready: false, searching: false, status: '', error: '', rtt: 0, delay: 0, remoteQ: [], lastRemote: 0, snap: null, events: [], pending: [], recording: false});
    old.forEach(close);
  }
  function fail(msg) { const role = N.role; leave(); N.error = msg; N.lostRole = role; }
  function raw(c, data) { try { if (c && c.open) c.send(data); } catch {} }
  function setup(c) {
    conn = c;
    const g = generation;
    const current = () => g === generation && conn === c;
    const deadline = later(() => { if (current() && !N.connected) fail('A LIGAÇÃO EXPIROU. TENTA OUTRA REDE OU SALA.'); }, 15000);
    c.on('open', () => { if (current()) raw(c, {t: 'hello', v: VERSION}); });
    c.on('data', m => {
      if (!current() || !m || typeof m !== 'object') return;
      if (m.t === 'reject') { fail(m.reason === 'version' ? 'ATUALIZA O JOGO NOS DOIS DISPOSITIVOS.' : 'SALA CHEIA. CRIA OUTRA SALA.'); return; }
      if (m.t === 'hello') {
        if (m.v !== VERSION) { raw(c, {t: 'reject', reason: 'version'}); fail('ATUALIZA O JOGO NOS DOIS DISPOSITIVOS.'); return; }
        cancel(deadline);
        N.connected = true; N.searching = false; N.status = 'LIGADO!';
        lastPacket = lastInput = performance.now();
        close(queuePeer); queuePeer = null; close(probe); probe = null;
        if (SM.Audio) SM.Audio.sfx('confirm');
        return;
      }
      if (N.connected) { lastPacket = performance.now(); onData(m); }
    });
    c.on('close', () => { if (current()) fail('O OUTRO JOGADOR SAIU DA SALA.'); });
    c.on('error', () => { if (current()) fail('ERRO NA LIGAÇÃO. TENTA NOVAMENTE.'); });
  }
  function start(role, code, random) {
    leave();
    if (!available()) { N.error = 'O MODO ONLINE NÃO CARREGOU. ATUALIZA A PÁGINA.'; return; }
    Object.assign(N, {role, code, searching: random, status: 'A LIGAR AO SERVIDOR...'});
    const g = generation;
    const p = peer = new window.Peer(PREFIX + (role === 'host' ? code : genCode()), {debug: 0});
    const alive = () => generation === g && peer === p;
    const deadline = later(() => fail('SERVIDOR INDISPONÍVEL. TENTA NOVAMENTE.'), 15000);
    p.on('open', () => {
      if (!alive()) return;
      cancel(deadline); N.ready = true;
      if (random) seek();
      else if (role === 'guest') { N.status = 'A LIGAR À SALA ' + code + '...'; setup(p.connect(PREFIX + code, {reliable: true, serialization: 'json'})); }
      else N.status = 'À ESPERA DO OUTRO JOGADOR...';
    });
    p.on('connection', c => {
      if (!alive()) { close(c); return; }
      if (conn || N.role !== 'host') { c.on('open', () => { raw(c, {t: 'reject', reason: 'full'}); later(() => close(c), 300); }); return; }
      setup(c);
    });
    p.on('error', e => {
      if (!alive()) return;
      if (random && e.type === 'peer-unavailable' && !conn) { retrySearch(); return; }
      if (e.type === 'unavailable-id') { start(role, role === 'host' ? genCode() : code, random); return; }
      if (!N.connected) fail(e.type === 'peer-unavailable' ? 'SALA NÃO ENCONTRADA. CONFIRMA O CÓDIGO.' : 'SEM LIGAÇÃO AO SERVIDOR. TENTA NOVAMENTE.');
    });
    p.on('disconnected', () => { if (alive() && !p.destroyed) { try { p.reconnect(); } catch {} } });
  }
  function host() { start('host', genCode(), false); }
  function join(code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 5) { leave(); N.error = 'O CÓDIGO TEM 5 CARACTERES.'; return; }
    start('guest', code, false);
  }
  function random() { start('host', genCode(), true); }
  let searchTimer;
  function retrySearch() {
    if (!N.searching || conn) return;
    const old = [probe, queuePeer]; probe = queuePeer = null; old.forEach(close);
    cancel(searchTimer);
    searchTimer = later(seek, 400 + Math.random() * 600);
  }
  function seek() {
    if (!N.searching || conn || !peer) return;
    N.status = 'À PROCURA DE ADVERSÁRIO...';
    const q = queuePeer = new window.Peer(QUEUE, {debug: 0});
    const current = () => queuePeer === q && N.searching;
    const timeout = later(() => { if (current() && !q.open) retrySearch(); }, 10000);
    q.on('open', () => { if (current()) { cancel(timeout); N.status = 'À ESPERA DE OUTRO JOGADOR ONLINE...'; } });
    let reserved = false;
    q.on('connection', c => {
      c.on('data', m => {
        if (!current() || !m || m.t !== 'find' || m.v !== VERSION) { close(c); return; }
        if (reserved) { raw(c, {t: 'busy'}); return; }
        reserved = true;
        raw(c, {t: 'match', code: N.code, v: VERSION});
        later(() => { if (current() && !conn) { reserved = false; close(c); } }, 12000);
      });
    });
    q.on('error', e => {
      if (!current()) return;
      cancel(timeout);
      if (e.type !== 'unavailable-id') { fail('PESQUISA INDISPONÍVEL. TENTA CRIAR UMA SALA.'); return; }
      queuePeer = null; close(q);
      const c = probe = peer.connect(QUEUE, {reliable: true, serialization: 'json'});
      const retry = later(() => { if (probe === c && !conn) retrySearch(); }, 5000);
      c.on('open', () => raw(c, {t: 'find', v: VERSION}));
      c.on('data', m => {
        if (probe !== c || !N.searching || !m) return;
        if (m.t === 'match' && m.v === VERSION && /^[A-Z0-9]{5}$/.test(m.code)) {
          cancel(retry); N.role = 'guest'; N.code = m.code; N.status = 'ADVERSÁRIO ENCONTRADO. A LIGAR...';
          setup(peer.connect(PREFIX + m.code, {reliable: true, serialization: 'json'}));
        } else if (m.t === 'busy') { cancel(retry); retrySearch(); }
      });
      c.on('error', () => { if (probe === c && !conn) retrySearch(); });
    });
    q.on('disconnected', () => { if (current() && !conn) retrySearch(); });
  }
  function send(m) {
    if (!N.connected || !conn) return;
    if (m.t === 's' && conn.dataChannel && conn.dataChannel.bufferedAmount > 128 * 1024) return;
    raw(conn, m);
  }
  function validSnapshot(m) {
    if (!['select','stage','vs','fight','result'].includes(m.sc) || !Array.isArray(m.cu) || m.cu.length !== 2 || !Array.isArray(m.pk) || m.pk.length !== 2) return false;
    const validIndex = i => Number.isInteger(i) && i >= 0 && i < SM.CHARACTERS.length;
    if (!m.cu.every(validIndex) || !m.pk.every(i => i === null || validIndex(i))) return false;
    if (!m.b) return m.sc !== 'fight' && m.sc !== 'result';
    const b = m.b;
    return Array.isArray(b.c) && b.c.length === 2 && b.c.every(id => SM.CHARACTERS.some(ch => ch.id === id)) &&
      SM.Stages.list.some(s => s.id === b.st) && Array.isArray(b.f) && b.f.length === 2 &&
      b.f.every(f => f && ['x','y','hp','f'].every(k => Number.isFinite(f[k]))) && Array.isArray(b.p) &&
      (!b.fz || b.fz.s === 0 || b.fz.s === 1);
  }
  function onData(m) {
    if (m.t === 'i' && N.role === 'host') {
      lastInput = performance.now();
      N.remoteQ.push({h: (m.h | 0) & 1023, p: (m.p | 0) & 1023});
      if (N.remoteQ.length > 12) N.remoteQ.shift();
    } else if (m.t === 's' && N.role === 'guest' && validSnapshot(m)) {
      N.snap = m;
      if (Array.isArray(m.ev)) N.pending.push(...m.ev.slice(0, 100));
      N.rtt = m.rtt || N.rtt;
    } else if (m.t === 'ping') send({t: 'pong', ts: m.ts});
    else if (m.t === 'pong' && Number.isFinite(m.ts)) {
      N.rtt = Math.max(0, Math.round(performance.now() - m.ts));
      N.delay = SM.clamp(Math.round(N.rtt / 2 / 16.7), 0, 6);
    }
  }
  function nextRemote() {
    const q = N.remoteQ;
    if (!q.length) return {held: performance.now() - lastInput > 300 ? 0 : N.lastRemote, pressed: 0};
    let m = q.shift(), pressed = m.p;
    while (q.length > 3) { m = q.shift(); pressed |= m.p; }
    N.lastRemote = m.h;
    return {held: m.h, pressed};
  }
  const TRACK = {FX: ['spark', 'dust', 'trail', 'text', 'bolt', 'clear'], Audio: ['sfx', 'music']};
  for (const [obj, names] of Object.entries(TRACK)) for (const name of names) {
    const orig = SM[obj][name];
    SM[obj][name] = function (...args) { if (N.recording) N.events.push([obj, name, args]); return orig.apply(this, args); };
  }
  function replay() {
    for (const e of N.pending) if (Array.isArray(e) && TRACK[e[0]] && TRACK[e[0]].includes(e[1]) && Array.isArray(e[2])) SM[e[0]][e[1]](...e[2]);
    N.pending.length = 0;
  }
  function tick() {
    if (!N.connected) return;
    const now = performance.now();
    if (now - lastPacket > 12000) { fail('SEM RESPOSTA DO ADVERSÁRIO. LIGAÇÃO TERMINADA.'); return; }
    if (now - lastPing > 1000) { lastPing = now; send({t: 'ping', ts: now}); }
  }
  const link = () => location.origin + location.pathname + '?sala=' + N.code;
  return Object.assign(N, {host, join, random, leave, send, nextRemote, replay, tick, link, available});
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
