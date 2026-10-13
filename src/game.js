'use strict';
// Lógica do jogo: estados, física, colisões, inimigos e ecrãs.

SM.Game = (() => {
  const { T, W, H, PHYS } = SM;
  const I = SM.Input;
  const A = SM.Audio;
  const R = SM.R;

  const HISCORE_KEY = 'superManos.hiscore';
  const loadHi = () => { try { return +localStorage.getItem(HISCORE_KEY) || 0; } catch { return 0; } };
  const saveHi = (v) => { try { localStorage.setItem(HISCORE_KEY, String(v)); } catch { /* sem storage */ } };

  // ---------- estado global ----------
  const G = {
    state: 'title',
    timer: 0, // frames no estado atual
    t: 0, // frames totais
    sel: 0,
    char: null,
    levelIdx: 0,
    lives: 3,
    score: 0,
    coins: 0,
    hiscore: loadHi(),
    paused: false,
    lvl: null,
    camX: 0,
    time: 0,
    p: null,
    ents: [],
    bumps: [],
    flagY: 0,
  };

  const setState = (s) => { G.state = s; G.timer = 0; };

  const addScore = (n, x, y) => {
    G.score += n;
    if (x !== undefined) G.ents.push({ kind: 'score', x, y, text: String(n), life: 40 });
  };

  const addCoin = () => {
    G.coins++;
    G.score += 200;
    A.play('coin');
    if (G.coins >= 100) { G.coins -= 100; G.lives++; A.play('oneup'); }
  };

  // ---------- tiles ----------
  const tileAt = (tx, ty) => {
    if (tx < 0) return '#';
    if (tx >= G.lvl.w || ty < 0 || ty >= SM.ROWS) return '.';
    return G.lvl.grid[ty][tx];
  };
  const setTile = (tx, ty, c) => { G.lvl.grid[ty][tx] = c; };
  const solid = (c) => SM.SOLID.has(c) && c !== '=';

  // Move um corpo com colisão por eixos. Devolve os tiles batidos com a cabeça.
  const moveBody = (e) => {
    e.hitWall = false;
    // horizontal
    e.x += e.vx;
    const y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 1) / T);
    if (e.vx > 0) {
      const tx = Math.floor((e.x + e.w - 1) / T);
      for (let ty = y0; ty <= y1; ty++) if (solid(tileAt(tx, ty))) { e.x = tx * T - e.w; e.vx = 0; e.hitWall = true; break; }
    } else if (e.vx < 0) {
      const tx = Math.floor(e.x / T);
      for (let ty = y0; ty <= y1; ty++) if (solid(tileAt(tx, ty))) { e.x = (tx + 1) * T; e.vx = 0; e.hitWall = true; break; }
    }
    // vertical
    const prevBottom = e.y + e.h;
    e.y += e.vy;
    e.onGround = false;
    const heads = [];
    const x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 1) / T);
    if (e.vy > 0) {
      const ty = Math.floor((e.y + e.h - 1) / T);
      for (let tx = x0; tx <= x1; tx++) {
        const c = tileAt(tx, ty);
        if (solid(c) || (c === '=' && prevBottom <= ty * T + 1)) {
          e.y = ty * T - e.h; e.vy = 0; e.onGround = true; break;
        }
      }
    } else if (e.vy < 0) {
      const ty = Math.floor(e.y / T);
      for (let tx = x0; tx <= x1; tx++) if (solid(tileAt(tx, ty))) heads.push(tx);
      if (heads.length) { e.y = (ty + 1) * T; e.vy = 0; return { ty, heads }; }
    }
    return null;
  };

  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ---------- nível ----------
  const loadLevel = () => {
    G.lvl = SM.LEVELS[G.levelIdx]();
    G.lvl.grid[12][G.lvl.flagX] = 'K'; // base do mastro
    G.camX = 0;
    G.time = G.lvl.time;
    G.ents = G.lvl.enemies.map((e) => e.type === 'g'
      ? { kind: 'bicho', x: e.x * T, y: (e.y + 1) * T - 16, w: 16, h: 16, vx: -0.5, vy: 0, active: false }
      : { kind: 'tartaruga', x: e.x * T, y: (e.y + 1) * T - 24, w: 16, h: 24, vx: -0.5, vy: 0, active: false });
    G.bumps = [];
    G.flagY = 13 * T - 16 - 128;
    const ch = G.char;
    const big = ch.perk === 'tough';
    G.p = {
      x: 3 * T, y: 13 * T - (big ? 24 : 16), w: 12, h: big ? 24 : 16,
      vx: 0, vy: 0, big, facing: 1, onGround: true, inv: 0, airJumps: 0, anim: 0, skid: false,
    };
  };

  // ---------- jogador ----------
  const grow = () => {
    const p = G.p;
    if (!p.big) { p.big = true; p.y -= 8; p.h = 24; }
  };

  const hurt = () => {
    const p = G.p;
    if (p.inv > 0 || G.state !== 'play') return;
    if (p.big) {
      p.big = false; p.y += 8; p.h = 16; p.inv = 120;
      A.play('hurt');
    } else {
      die();
    }
  };

  const die = () => {
    G.p.vy = -6; G.p.vx = 0;
    A.play('die');
    setState('dying');
  };

  const bumpTile = (tx, ty) => {
    const c = tileAt(tx, ty);
    const p = G.p;
    if (c === '?') {
      setTile(tx, ty, 'X');
      G.bumps.push({ tx, ty, t: 0 });
      G.ents.push({ kind: 'coinfx', x: tx * T, y: ty * T - 16, vy: -5, life: 30 });
      addCoin();
    } else if (c === 'M') {
      setTile(tx, ty, 'X');
      G.bumps.push({ tx, ty, t: 0 });
      G.ents.push({ kind: 'pastel', x: tx * T, y: ty * T, w: 16, h: 16, vx: 0, vy: 0, rise: 16 });
      A.play('appear');
    } else if (c === 'B') {
      if (p.big) {
        setTile(tx, ty, '.');
        A.play('brick');
        addScore(50);
        for (let i = 0; i < 4; i++)
          G.ents.push({ kind: 'debris', x: tx * T + (i % 2) * 8, y: ty * T + (i >> 1) * 8, vx: (i % 2 ? 1.5 : -1.5), vy: -5 + (i >> 1) * 2, life: 90 });
      } else {
        G.bumps.push({ tx, ty, t: 0 });
        A.play('bump');
      }
    } else {
      A.play('bump');
      return;
    }
    // inimigos em cima do bloco morrem
    for (const e of G.ents) {
      if ((e.kind === 'bicho' || e.kind === 'tartaruga' || e.kind === 'shell') && !e.dead &&
          e.x + e.w > tx * T && e.x < (tx + 1) * T && Math.abs(e.y + e.h - ty * T) < 4) {
        flipEnemy(e, 100);
      }
    }
  };

  const flipEnemy = (e, pts) => {
    e.dead = 'flip';
    e.vy = -4;
    e.vx = e.vx >= 0 ? 1 : -1;
    A.play('stomp');
    addScore(pts, e.x, e.y);
  };

  const updatePlayer = () => {
    const p = G.p;
    const ch = G.char;
    const run = I.held('run');
    const max = (run ? PHYS.runMax : PHYS.walkMax) * ch.speed;
    const acc = run ? PHYS.runAccel : PHYS.accel;
    const dir = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0);

    p.skid = false;
    if (dir) {
      const speed = Math.abs(p.vx);
      if (Math.sign(p.vx) === -dir && p.onGround) { p.vx += dir * PHYS.skid; p.skid = true; }
      else p.vx += dir * acc;
      // acima do máximo (ex.: largou o botão de correr) abranda aos poucos
      if (Math.abs(p.vx) > max) p.vx = Math.sign(p.vx) * (speed > max ? Math.max(max, speed - PHYS.decel) : max);
      if (p.onGround) p.facing = dir;
    } else if (p.onGround) {
      p.vx = Math.abs(p.vx) <= PHYS.decel ? 0 : p.vx - Math.sign(p.vx) * PHYS.decel;
    }

    // salto
    if (I.hit('jump')) {
      if (p.onGround) {
        p.vy = -(PHYS.jump * ch.jump + Math.abs(p.vx) * 0.25);
        p.airJumps = ch.perk === 'doubleJump' ? 1 : 0;
        A.play('jump');
      } else if (p.airJumps > 0) {
        p.airJumps--;
        p.vy = -PHYS.jump * ch.jump * 0.85;
        A.play('jump');
        for (let i = 0; i < 6; i++)
          G.ents.push({ kind: 'spark', x: p.x + 6, y: p.y + p.h, vx: (i - 2.5) * 0.6, vy: 0.5, life: 16 });
      }
    }
    const grav = p.vy < 0 && I.held('jump') ? PHYS.gravityHold : PHYS.gravity;
    p.vy += grav;
    const floating = ch.perk === 'floaty' && p.vy > 0 && I.held('jump');
    p.vy = Math.min(p.vy, floating ? 1.1 : PHYS.maxFall);

    const head = moveBody(p);
    if (head) {
      // bate no tile mais perto do centro
      const cx = Math.floor((p.x + p.w / 2) / T);
      const tx = head.heads.includes(cx) ? cx : head.heads[0];
      bumpTile(tx, head.ty);
    }

    // não recua para trás da câmara
    if (p.x < G.camX) { p.x = G.camX; p.vx = Math.max(0, p.vx); }

    if (p.onGround && !dir && Math.abs(p.vx) < 0.05) p.anim = 0;
    else p.anim += Math.abs(p.vx) * 0.12;
    if (p.inv > 0) p.inv--;

    // moedas e espinhos
    const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 1) / T);
    const y0 = Math.floor(p.y / T), y1 = Math.floor((p.y + p.h - 1) / T);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        const c = tileAt(tx, ty);
        if (c === 'o') { setTile(tx, ty, '.'); addCoin(); }
        else if (c === '^' && p.y + p.h > ty * T + 6) hurt();
      }

    // íman: puxa as moedas próximas
    if (ch.perk === 'magnet') {
      const cx = Math.floor((p.x + 6) / T), cy = Math.floor((p.y + p.h / 2) / T);
      for (let ty = cy - 3; ty <= cy + 3; ty++)
        for (let tx = cx - 3; tx <= cx + 3; tx++)
          if (tileAt(tx, ty) === 'o') {
            setTile(tx, ty, '.');
            G.ents.push({ kind: 'magcoin', x: tx * T, y: ty * T, w: 16, h: 16 });
          }
    }

    if (p.y > H + 16) die();

    // chegou ao mastro
    if (p.x + p.w >= G.lvl.flagX * T + 7 && G.state === 'play') {
      p.x = G.lvl.flagX * T + 7 - p.w;
      p.vx = 0; p.vy = 0;
      const h = 13 * T - 16 - (p.y + p.h);
      addScore(h > 120 ? 5000 : h > 80 ? 2000 : h > 40 ? 800 : h > 16 ? 400 : 100, p.x + 12, p.y);
      A.play('flag');
      setState('flag');
    }
  };

  // ---------- entidades ----------
  const updateEnemy = (e) => {
    const p = G.p;
    if (!e.active) {
      if (e.x < G.camX + W + 32) e.active = true;
      else return;
    }
    if (e.dead === 'squash') { if (--e.squash <= 0) e.remove = true; return; }
    if (e.dead === 'flip') {
      e.vy += PHYS.gravity; e.x += e.vx; e.y += e.vy;
      if (e.y > H + 32) e.remove = true;
      return;
    }

    e.vy = Math.min(e.vy + PHYS.gravity, PHYS.maxFall);
    const vx = e.vx;
    moveBody(e);
    if (e.hitWall) e.vx = -vx;
    // as tartarugas viram-se nos bordos
    if (e.kind === 'tartaruga' && e.onGround) {
      const ahead = Math.floor((e.vx > 0 ? e.x + e.w + 1 : e.x - 1) / T);
      const below = Math.floor((e.y + e.h + 1) / T);
      const c = tileAt(ahead, below);
      if (!SM.SOLID.has(c)) e.vx = -e.vx;
    }
    if (e.y > H + 32 || e.x < G.camX - 64) { e.remove = true; return; }

    // carapaça em movimento atropela outros inimigos
    if (e.kind === 'shell' && e.vx !== 0) {
      for (const o of G.ents)
        if (o !== e && !o.dead && o.active && (o.kind === 'bicho' || o.kind === 'tartaruga' || o.kind === 'shell') && overlap(e, o))
          flipEnemy(o, 200);
    }

    if (G.state !== 'play' || !overlap(p, e)) return;

    const stomp = p.vy > 0 && p.y + p.h - e.y < 10;
    if (e.kind === 'shell') {
      if (e.vx === 0) {
        // chuta a carapaça
        e.vx = p.x + p.w / 2 < e.x + 8 ? 4 : -4;
        e.kickGrace = 12;
        A.play('stomp');
        addScore(400, e.x, e.y);
        if (stomp) p.vy = -PHYS.bounce;
        else p.x = e.vx > 0 ? e.x - p.w - 1 : e.x + e.w + 1;
      } else if (stomp) {
        e.vx = 0;
        p.vy = -PHYS.bounce;
        A.play('stomp');
      } else if (!(e.kickGrace > 0)) {
        hurt();
      }
      return;
    }
    if (stomp) {
      p.vy = I.held('jump') ? -PHYS.bounce * 1.5 : -PHYS.bounce;
      p.airJumps = G.char.perk === 'doubleJump' ? 1 : 0;
      A.play('stomp');
      addScore(100, e.x, e.y);
      if (e.kind === 'bicho') { e.dead = 'squash'; e.squash = 30; }
      else { e.kind = 'shell'; e.y += 10; e.h = 14; e.vx = 0; }
    } else {
      hurt();
    }
  };

  const updateEnts = () => {
    const p = G.p;
    for (const e of G.ents) {
      switch (e.kind) {
        case 'bicho': case 'tartaruga': case 'shell':
          if (e.kickGrace > 0) e.kickGrace--;
          updateEnemy(e);
          break;
        case 'pastel':
          if (e.rise > 0) { e.y -= 1; if (--e.rise === 0) e.vx = 1; break; }
          e.vy = Math.min(e.vy + PHYS.gravity, PHYS.maxFall);
          { const vx = e.vx; moveBody(e); if (e.hitWall) e.vx = -vx; }
          if (e.y > H) e.remove = true;
          if (G.state === 'play' && overlap(p, e)) {
            e.remove = true;
            if (p.big) addScore(1000, e.x, e.y); else { grow(); addScore(1000, e.x, e.y); }
            A.play('power');
          }
          break;
        case 'magcoin': {
          const dx = p.x + 6 - (e.x + 8), dy = p.y + p.h / 2 - (e.y + 8);
          const d = Math.hypot(dx, dy) || 1;
          e.x += (dx / d) * 4; e.y += (dy / d) * 4;
          if (d < 10) { e.remove = true; addCoin(); }
          break;
        }
        case 'coinfx':
          e.y += e.vy; e.vy += 0.35;
          if (--e.life <= 0) { e.remove = true; G.ents.push({ kind: 'score', x: e.x, y: e.y, text: '200', life: 30 }); }
          break;
        case 'debris': case 'spark':
          e.x += e.vx; e.y += e.vy; e.vy += e.kind === 'debris' ? 0.4 : 0;
          if (--e.life <= 0) e.remove = true;
          break;
        case 'score':
          e.y -= 0.7;
          if (--e.life <= 0) e.remove = true;
          break;
      }
    }
    G.ents = G.ents.filter((e) => !e.remove);
    for (const b of G.bumps) b.t++;
    G.bumps = G.bumps.filter((b) => b.t < 10);
  };

  const updateCamera = () => {
    const target = G.p.x - 100;
    G.camX = Math.max(G.camX, Math.min(target, G.lvl.w * T - W));
  };

  // ---------- estados ----------
  const ROSTER_COLS = 6;

  const update = () => {
    G.t++; G.timer++;
    if (I.hit('mute')) A.toggleMute();

    switch (G.state) {
      case 'title':
        if (I.hit('start') || I.hit('jump')) { A.play('select'); setState('select'); }
        break;

      case 'select': {
        const n = SM.CHARACTERS.length;
        if (I.hit('right')) { G.sel = (G.sel + 1) % n; A.play('select'); }
        if (I.hit('left')) { G.sel = (G.sel - 1 + n) % n; A.play('select'); }
        if (I.hit('down')) { G.sel = Math.min(n - 1, G.sel + ROSTER_COLS); A.play('select'); }
        if (I.hit('up')) { G.sel = Math.max(0, G.sel - ROSTER_COLS); A.play('select'); }
        if (I.hit('start') || I.hit('jump')) {
          G.char = SM.CHARACTERS[G.sel];
          G.levelIdx = 0; G.lives = 3; G.score = 0; G.coins = 0;
          A.play('power');
          setState('intro');
        }
        if (I.hit('pause')) setState('title');
        break;
      }

      case 'intro':
        if (G.timer === 1) loadLevel();
        if (G.timer > 150) setState('play');
        break;

      case 'play':
        if (I.hit('pause') || I.hit('start')) G.paused = !G.paused;
        if (G.paused) break;
        updatePlayer();
        if (G.state !== 'play') break;
        updateEnts();
        updateCamera();
        if (G.t % 24 === 0 && --G.time <= 0) { G.time = 0; G.p.big = false; die(); }
        break;

      case 'dying': {
        const p = G.p;
        if (G.timer > 30) { p.vy += 0.35; p.y += p.vy; }
        if (G.timer > 180) {
          G.lives--;
          setState(G.lives > 0 ? 'intro' : 'gameover');
        }
        break;
      }

      case 'flag': {
        const p = G.p;
        const base = 13 * T - 16;
        if (p.y + p.h < base) p.y = Math.min(base - p.h, p.y + 2.5);
        if (G.flagY < base - 16) G.flagY += 2.5;
        if (G.timer > 60) {
          // caminha até ao castelo
          p.facing = 1;
          p.vx = 1.2; p.vy += PHYS.gravity;
          moveBody(p);
          p.anim += 0.15;
          updateCamera();
          if (p.x > (G.lvl.flagX + 6) * T + 8) setState('tally');
        }
        updateEnts();
        break;
      }

      case 'tally':
        if (G.time > 0) {
          const k = Math.min(G.time, 3);
          G.time -= k; G.score += k * 50;
          if (G.t % 4 === 0) A.play('select');
        } else if (G.timer > 60 + 0) {
          if (G.score > G.hiscore) { G.hiscore = G.score; saveHi(G.score); }
          G.levelIdx++;
          setState(G.levelIdx >= SM.LEVELS.length ? 'win' : 'intro');
        }
        break;

      case 'gameover':
      case 'win':
        if (G.timer === 1 && G.score > G.hiscore) { G.hiscore = G.score; saveHi(G.score); }
        if (G.timer > 90 && (I.hit('start') || I.hit('jump'))) setState('title');
        break;
    }
    I.endFrame();
  };

  // ---------- desenho ----------
  const drawHUD = () => {
    const name = (G.char ? G.char.name : 'MANO').toUpperCase();
    R.text(name, 16, 8);
    R.text(String(G.score).padStart(6, '0'), 16, 18);
    R.coin(76, 14, G.t);
    R.text('x' + String(G.coins).padStart(2, '0'), 92, 18);
    R.text('MUNDO', 136, 8);
    R.text(G.lvl ? G.lvl.name : '1-1', 144, 18);
    R.text('TEMPO', 200, 8);
    if (G.state !== 'title' && G.state !== 'select') R.text(String(Math.max(0, G.time)).padStart(3, '0'), 208, 18);
  };

  const playerPose = (p) => {
    if (G.state === 'dying') return 'dead';
    if (!p.onGround && G.state !== 'flag') return 'jump';
    if (p.skid) return 'skid';
    if (Math.abs(p.vx) < 0.05) return 'stand';
    return Math.floor(p.anim) % 2 ? 'walk1' : 'walk0';
  };

  const drawLevel = () => {
    const L = G.lvl;
    R.background(L.theme, G.camX, G.t);
    const cx = Math.floor(G.camX);
    R.castle((L.flagX + 4) * T - cx, 13 * T);
    R.flagpole(L.flagX * T - cx, 12 * T, G.flagY);
    const tx0 = Math.floor(cx / T), tx1 = tx0 + Math.ceil(W / T) + 1;
    for (let ty = 0; ty < SM.ROWS; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        const c = tileAt(tx, ty);
        if (c === '.') continue;
        const b = G.bumps.find((q) => q.tx === tx && q.ty === ty);
        const off = b ? -Math.sin((b.t / 10) * Math.PI) * 6 : 0;
        if (c === 'o') R.coin(tx * T - cx, ty * T, G.t);
        else R.tile(c, tx * T - cx, ty * T + off, L.theme, G.t);
      }

    for (const e of G.ents) {
      const x = e.x - cx;
      if (x < -32 || x > W + 32) continue;
      switch (e.kind) {
        case 'bicho':
          if (e.dead === 'flip') { R.ctx.save(); R.ctx.translate(0, e.y * 2 + 16); R.ctx.scale(1, -1); R.bicho(x, e.y, 0, false, L.theme); R.ctx.restore(); }
          else R.bicho(x, e.y, Math.floor(G.t / 10) % 2, e.dead === 'squash', L.theme);
          break;
        case 'tartaruga':
          if (e.dead === 'flip') { R.ctx.save(); R.ctx.translate(0, e.y * 2 + 24); R.ctx.scale(1, -1); R.tartaruga(x, e.y, 1, 0, false); R.ctx.restore(); }
          else R.tartaruga(x, e.y, e.vx > 0 ? 1 : -1, Math.floor(G.t / 10) % 2, false);
          break;
        case 'shell':
          if (e.dead === 'flip') { R.ctx.save(); R.ctx.translate(0, e.y * 2 + 14); R.ctx.scale(1, -1); R.tartaruga(x, e.y, 1, 0, true); R.ctx.restore(); }
          else R.tartaruga(x, e.y, 1, 0, true);
          break;
        case 'pastel': R.pastel(x, e.y); break;
        case 'magcoin': case 'coinfx': R.coin(x, e.y, G.t * 3); break;
        case 'debris': R.px(x, e.y, 6, 6, SM.THEMES[L.theme].ground[0]); R.px(x, e.y, 6, 1, '#000'); break;
        case 'spark': R.px(x, e.y, 2, 2, '#fff'); break;
        case 'score': R.text(e.text, x, e.y, '#fff', 'left', 6); break;
      }
    }

    const p = G.p;
    if (G.state === 'tally' || (G.state === 'flag' && p.x > (L.flagX + 5) * T + 8)) {
      // já entrou no castelo
    } else if (!(p.inv > 0 && Math.floor(G.t / 3) % 2)) {
      R.mano(G.char, p.x - cx, p.y + (p.big ? 0 : 0), p.big, G.state === 'flag' && G.timer <= 60 ? 1 : p.facing, playerPose(p));
    }
  };

  const drawTitle = () => {
    R.px(0, 0, W, H, '#5c94fc');
    R.background('day', G.t * 0.6, G.t);
    for (let x = 0; x < W; x += T) { R.tile('#', x, 13 * T, 'day', 0); R.tile('#', x, 14 * T, 'day', 0); }
    // painel do título
    R.px(28, 36, 200, 76, '#c84c0c');
    R.px(30, 38, 196, 72, '#fca044');
    R.px(32, 40, 192, 68, '#c84c0c');
    R.text('SUPER', W / 2, 50, '#fff', 'center', 16);
    R.text('MANOS', W / 2, 74, '#f8d860', 'center', 16);
    // os manos a correr
    SM.CHARACTERS.forEach((ch, i) => {
      const x = ((i * 26 + G.t * 0.8) % (W + 40)) - 20;
      R.mano(ch, x, 13 * T - 16, false, 1, Math.floor(G.t / 8 + i) % 2 ? 'walk0' : 'walk1');
    });
    if (Math.floor(G.t / 30) % 2) R.text('PRIME ENTER', W / 2, 136, '#fff', 'center');
    R.text('RECORDE ' + String(G.hiscore).padStart(6, '0'), W / 2, 156, '#fff', 'center');
    R.text('SETAS:MOVER Z:SALTAR X:CORRER', W / 2, 176, '#fff', 'center', 6);
  };

  const drawSelect = () => {
    R.px(0, 0, W, H, '#101030');
    R.text('ESCOLHE O TEU MANO', W / 2, 10, '#f8d860', 'center');
    SM.CHARACTERS.forEach((ch, i) => {
      const col = i % ROSTER_COLS, row = Math.floor(i / ROSTER_COLS);
      const rowCount = row === 0 ? ROSTER_COLS : SM.CHARACTERS.length - ROSTER_COLS;
      const startX = (W - rowCount * 40) / 2;
      const x = startX + col * 40, y = 28 + row * 50;
      const on = i === G.sel;
      R.px(x + 2, y, 36, 44, on ? '#f8d860' : '#303060');
      R.px(x + 4, y + 2, 32, 40, on ? '#4060c0' : '#202048');
      const bob = on ? Math.floor(G.t / 8) % 2 : 0;
      R.mano(ch, x + 14, y + 12 - bob, true, 1, on ? (Math.floor(G.t / 8) % 2 ? 'walk0' : 'walk1') : 'stand');
    });
    // ficha do mano selecionado
    const ch = SM.CHARACTERS[G.sel];
    const y = 134;
    R.px(16, y, W - 32, 96, '#202048');
    R.px(16, y, W - 32, 1, '#f8d860');
    R.mano(ch, 30, y + 30, true, 1, Math.floor(G.t / 10) % 2 ? 'walk0' : 'walk1');
    R.text(ch.name.toUpperCase(), 60, y + 8, '#f8d860');
    const bar = (label, v, yy) => {
      R.text(label, 60, yy, '#fff', 'left', 6);
      const n = Math.round((v - 0.8) / 0.05);
      for (let k = 0; k < 8; k++) R.px(120 + k * 8, yy, 6, 6, k < n ? '#40d040' : '#404060');
    };
    bar('VELOC.', ch.speed, y + 24);
    bar('SALTO', ch.jump, y + 36);
    R.text('PODER: ' + (ch.perk ? SM.PERKS[ch.perk] : '---'), 60, y + 50, ch.perk ? '#80e0ff' : '#808090', 'left', 6);
    R.text('"' + ch.quote + '"', W / 2, y + 68, '#fff', 'center', 6);
    if (Math.floor(G.t / 30) % 2) R.text('ENTER PARA JOGAR', W / 2, y + 82, '#f8d860', 'center', 6);
  };

  const draw = () => {
    switch (G.state) {
      case 'title': drawTitle(); break;
      case 'select': drawSelect(); break;
      case 'intro':
        R.px(0, 0, W, H, '#000');
        drawHUD();
        if (G.lvl) {
          R.text('MUNDO ' + G.lvl.name, W / 2, 80, '#fff', 'center');
          R.mano(G.char, 100, 108, false, 1, 'stand');
          R.text('x  ' + G.lives, 124, 112);
          R.text(G.char.quote, W / 2, 150, '#f8d860', 'center', 6);
        }
        break;
      case 'gameover':
        R.px(0, 0, W, H, '#000');
        drawHUD();
        R.text('FIM DE JOGO', W / 2, 100, '#fff', 'center');
        R.text('NÃO DESISTAS, ' + G.char.name.toUpperCase() + '!', W / 2, 124, '#f8d860', 'center', 6);
        break;
      case 'win':
        R.px(0, 0, W, H, '#140c28');
        drawHUD();
        R.text('PARABÉNS,', W / 2, 60, '#f8d860', 'center');
        R.text(G.char.name.toUpperCase() + '!', W / 2, 76, '#f8d860', 'center');
        SM.CHARACTERS.forEach((ch, i) => {
          const jump = Math.abs(Math.sin((G.t + i * 9) / 12)) * 12;
          R.mano(ch, 14 + i * 21, 150 - jump, false, 1, jump > 2 ? 'jump' : 'stand');
        });
        R.text('OS MANOS SALVARAM O BAIRRO!', W / 2, 110, '#fff', 'center', 6);
        R.text('PONTOS ' + G.score, W / 2, 190, '#fff', 'center');
        break;
      default:
        drawLevel();
        drawHUD();
        if (G.paused) {
          R.px(80, 100, 96, 28, '#000');
          R.text('PAUSA', W / 2, 110, '#fff', 'center');
        }
    }
    if (A.muted) R.text('MUDO', W - 4, H - 10, '#f88', 'right', 6);
  };

  return { update, draw, G };
})();
