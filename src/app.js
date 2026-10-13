'use strict';
// Ecrãs do jogo: título, menu, dificuldade, escolha de lutadores e cenário, VS, luta, pausa,
// resultados, modo arcade e lista de comandos.

SM.App = (() => {
  const W = SM.W, H = SM.H, U = SM.UI, B = SM.BTN, I = SM.Input, A = SM.Audio;
  const CH = SM.CHARACTERS;
  const COLS = 6;

  const S = {
    screen: 'title', t: 0,
    menu: 0, mode: null, diff: 1, diffSel: 1,
    cur: [0, 1], picked: [null, null], stageSel: 0,
    battle: null, paused: false, pauseSel: 0, showMoves: false,
    ladder: null, stageOrder: null, result: null, continueT: 0,
  };

  const go = (screen) => { S.screen = screen; S.t = 0; };
  const confirmBit = B.lp | B.lk | B.start;
  const backBit = B.hp | B.hk | B.back;

  const MENU = [
    { id: 'arcade', label: 'ARCADE', hint: 'Derrota os manos todos, um a um' },
    { id: 'versus', label: 'VERSUS', hint: '2 jogadores no mesmo teclado ou com comandos' },
    { id: 'cpu', label: 'CONTRA CPU', hint: 'Escolhe o adversário e a dificuldade' },
    { id: 'training', label: 'TREINO', hint: 'Treina combos contra um boneco' },
    { id: 'controls', label: 'COMANDOS', hint: 'Teclas e golpes especiais' },
  ];

  // ---------- arranque de uma luta ----------
  function startFight() {
    const c1 = CH[S.picked[0]], c2 = CH[S.picked[1]];
    let stage;
    if (S.mode === 'arcade') stage = SM.Stages.list[S.ladder.idx % SM.Stages.list.length];
    else stage = S.stageSel >= SM.Stages.list.length ? SM.Stages.list[Math.random() * SM.Stages.list.length | 0] : SM.Stages.list[S.stageSel];
    const p2 = S.mode === 'versus' ? new SM.Human(1)
      : S.mode === 'training' ? { read: () => ({ held: 0, pressed: 0 }) }
      : new SM.AI.CPU(S.mode === 'arcade' ? Math.min(3, S.diff + (S.ladder.idx >= 4 ? 1 : 0)) : S.diff);
    S.battle = new SM.Battle({
      chars: [c1, c2], stage, training: S.mode === 'training',
      controllers: [new SM.Human(0), p2],
      onEnd: (w) => { S.result = { winner: w }; setTimeout(() => {}, 0); go('result'); A.music('victory'); },
    });
    S.paused = false;
    go('fight');
  }

  function startArcade() {
    const others = CH.map((_, i) => i).filter((i) => i !== S.picked[0]);
    for (let i = others.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [others[i], others[j]] = [others[j], others[i]]; }
    S.ladder = { order: others.slice(0, 7), idx: 0 };
    S.picked[1] = S.ladder.order[0];
    go('vs');
  }

  // ---------- update ----------
  function update() {
    S.t++;
    I.poll();
    const any = I.any();
    const p1 = I.pressed(0), p2 = I.pressed(1);

    switch (S.screen) {
      case 'title':
        A.music('menu');
        if (any & (confirmBit | B.hp | B.hk)) { A.sfx('confirm'); go('menu'); }
        break;

      case 'menu':
        A.music('menu');
        I.setShared(true);
        if (any & B.down) { S.menu = (S.menu + 1) % MENU.length; A.sfx('select'); }
        if (any & B.up) { S.menu = (S.menu + MENU.length - 1) % MENU.length; A.sfx('select'); }
        if (any & backBit) { A.sfx('back'); go('title'); }
        if (any & confirmBit) {
          A.sfx('confirm');
          S.mode = MENU[S.menu].id;
          if (S.mode === 'controls') { go('controls'); break; }
          I.setShared(S.mode !== 'versus');
          S.picked = [null, null];
          if (S.mode === 'arcade' || S.mode === 'cpu') go('difficulty');
          else go('select');
        }
        break;

      case 'difficulty':
        if (any & B.down) { S.diffSel = (S.diffSel + 1) % 4; A.sfx('select'); }
        if (any & B.up) { S.diffSel = (S.diffSel + 3) % 4; A.sfx('select'); }
        if (any & backBit) { A.sfx('back'); go('menu'); }
        if (any & confirmBit && S.t > 2) { S.diff = S.diffSel; A.sfx('confirm'); go('select'); }
        break;

      case 'controls':
        if (any & (backBit | confirmBit)) { A.sfx('back'); go('menu'); }
        break;

      case 'select': {
        A.music('select');
        // em versus cada jogador escolhe ao mesmo tempo; senão o J1 escolhe os dois (CPU/treino)
        const versus = S.mode === 'versus';
        const who = versus ? [0, 1] : [S.picked[0] === null ? 0 : 1];
        for (const p of who) {
          const pr = versus ? (p === 0 ? p1 : p2) : p1;
          if (S.picked[p] !== null) {
            if (pr & backBit) { S.picked[p] = null; A.sfx('back'); }
            continue;
          }
          const c = S.cur[p];
          if (pr & B.right) S.cur[p] = (c + 1) % CH.length;
          if (pr & B.left) S.cur[p] = (c + CH.length - 1) % CH.length;
          if (pr & B.down) S.cur[p] = Math.min(CH.length - 1, c + COLS);
          if (pr & B.up) S.cur[p] = c >= COLS ? c - COLS : c;
          if (pr & (B.left | B.right | B.up | B.down)) A.sfx('select');
          if (pr & confirmBit) { S.picked[p] = S.cur[p]; A.sfx('confirm'); }
          if (pr & backBit) {
            A.sfx('back');
            if (!versus && p === 1) S.picked[0] = null;
            else go('menu');
          }
        }
        if (S.mode === 'arcade' && S.picked[0] !== null) { startArcade(); break; }
        if (S.picked[0] !== null && S.picked[1] !== null) go(S.mode === 'training' ? 'stage' : 'stage');
        break;
      }

      case 'stage': {
        const n = SM.Stages.list.length + 1;
        if (any & B.right) { S.stageSel = (S.stageSel + 1) % n; A.sfx('select'); }
        if (any & B.left) { S.stageSel = (S.stageSel + n - 1) % n; A.sfx('select'); }
        if (any & backBit) { S.picked[S.mode === 'versus' ? 1 : 1] = null; A.sfx('back'); go('select'); }
        if (any & confirmBit && S.t > 2) { A.sfx('confirm'); go(S.mode === 'training' ? 'fightNow' : 'vs'); }
        break;
      }

      case 'fightNow':
        startFight();
        break;

      case 'vs':
        A.music('select');
        if (S.t === 1) A.sfx('fight');
        if (S.t > 150 || (S.t > 40 && any & confirmBit)) startFight();
        break;

      case 'fight': {
        const bt = S.battle;
        if ((p1 | p2) & (B.start | B.back) && bt.phase !== 'over') {
          S.paused = !S.paused; S.pauseSel = 0; S.showMoves = false; A.sfx('select');
          break;
        }
        if (S.paused) {
          if (S.showMoves) { if (any & (backBit | confirmBit)) S.showMoves = false; break; }
          const opts = 3;
          if (any & B.down) { S.pauseSel = (S.pauseSel + 1) % opts; A.sfx('select'); }
          if (any & B.up) { S.pauseSel = (S.pauseSel + opts - 1) % opts; A.sfx('select'); }
          if (any & backBit) S.paused = false;
          if (any & (B.lp | B.lk)) {
            if (S.pauseSel === 0) S.paused = false;
            else if (S.pauseSel === 1) S.showMoves = true;
            else { A.sfx('back'); go('menu'); }
          }
          break;
        }
        bt.update();
        break;
      }

      case 'result': {
        const won = S.result.winner === 0;
        if (S.t < 60) break;
        if (S.mode === 'arcade') {
          if (won) {
            if (any & confirmBit) {
              S.ladder.idx++;
              if (S.ladder.idx >= S.ladder.order.length) { go('ending'); A.music('victory'); break; }
              S.picked[1] = S.ladder.order[S.ladder.idx];
              go('vs');
            }
          } else go('continue');
        } else if (any & confirmBit) {
          S.picked = S.mode === 'versus' ? [null, null] : [S.picked[0], null];
          if (S.mode !== 'versus') S.picked = [null, null];
          go('select');
        } else if (any & backBit) go('menu');
        break;
      }

      case 'continue':
        if (S.t % 60 === 0) A.sfx('tick');
        if (any & confirmBit && S.t > 20) { A.sfx('confirm'); go('vs'); }
        if (S.t > 600 || any & backBit) { go('title'); }
        break;

      case 'ending':
        if (S.t > 120 && any & confirmBit) go('title');
        break;
    }
  }

  // ---------- desenho ----------
  const bg = (ctx, c1 = '#140c2a', c2 = '#3a1040') => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // raios a rodar
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(S.t * 0.002);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(400, -40); ctx.lineTo(400, 40); ctx.fill(); }
    ctx.restore();
  };

  const fighterAt = (ctx, ch, pose, x, y, face, scale = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    SM.Rig.draw(ctx, ch, pose, 0, 0, face, { t: S.t });
    ctx.restore();
  };

  const logo = (ctx, y, s = 1) => {
    U.big(ctx, 'SUPER MANOS', W / 2, y, 44 * s, '#fff6a0', '#ff6a00');
    U.text(ctx, 'TORNEIO DE RUA', W / 2, y + 28 * s, { size: 11 * s, align: 'center', color: '#fff', font: SM.FONT, outline: '#c01010', lw: 3 });
  };

  function drawTitle(ctx) {
    SM.Stages.draw(ctx, SM.Stages.list[0], SM.STAGE_W / 2 + Math.sin(S.t * 0.005) * 100, S.t);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
    // dois lutadores a trocar golpes
    const a = CH[Math.floor(S.t / 300) % CH.length], b = CH[(Math.floor(S.t / 300) + 5) % CH.length];
    const ph = S.t % 60;
    const pa = ph < 20 ? SM.Rig.POSES.idle : ph < 30 ? SM.Rig.POSES.hp : SM.Rig.POSES.idle;
    const pb = ph < 25 ? SM.Rig.POSES.idle : ph < 40 ? SM.Rig.POSES.hitHi : SM.Rig.POSES.idle2;
    fighterAt(ctx, a, pa, W / 2 - 60, SM.FLOOR, 1, 1.1);
    fighterAt(ctx, b, pb, W / 2 + 60, SM.FLOOR, -1, 1.1);
    logo(ctx, 52, 1.1);
    if (Math.floor(S.t / 30) % 2) U.text(ctx, 'CARREGA EM ENTER', W / 2, H - 10, { size: 10, align: 'center', color: '#fff' });
  }

  function drawMenu(ctx) {
    bg(ctx);
    logo(ctx, 34, 0.75);
    MENU.forEach((m, i) => {
      const on = i === S.menu, y = 82 + i * 22;
      if (on) { ctx.fillStyle = 'rgba(255,200,40,0.18)'; ctx.fillRect(W / 2 - 90, y - 9, 180, 18); }
      U.text(ctx, (on ? '▶ ' : '') + m.label, W / 2, y, { size: on ? 14 : 11, align: 'center', color: on ? '#ffe040' : '#ccc', font: SM.FONT });
    });
    U.text(ctx, MENU[S.menu].hint, W / 2, H - 22, { size: 8, align: 'center', color: '#9ab' });
    U.text(ctx, '↑↓ ESCOLHER   F / ENTER CONFIRMAR   G VOLTAR   M SOM', W / 2, H - 9, { size: 6, align: 'center', color: '#789' });
  }

  function drawDifficulty(ctx) {
    bg(ctx);
    U.big(ctx, 'DIFICULDADE', W / 2, 40, 28);
    SM.AI.LEVELS.forEach((l, i) => {
      const on = i === S.diffSel, y = 84 + i * 26;
      if (on) { ctx.fillStyle = 'rgba(255,200,40,0.18)'; ctx.fillRect(W / 2 - 80, y - 10, 160, 20); }
      U.text(ctx, l.name, W / 2, y, { size: on ? 15 : 12, align: 'center', color: on ? ['#80ff80', '#ffe040', '#ff9040', '#ff4040'][i] : '#aaa' });
    });
  }

  function charCard(ctx, i, x, y, w, h) {
    const ch = CH[i];
    const sel0 = S.cur[0] === i && S.picked[0] === null, sel1 = S.cur[1] === i && S.picked[1] === null && (S.mode === 'versus' || S.picked[0] !== null);
    const picked = S.picked[0] === i || S.picked[1] === i;
    ctx.fillStyle = picked ? '#3a3a20' : '#1c1c38';
    ctx.fillRect(x, y, w, h);
    const img = SM.Rig.portrait(ch);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, 0, 0, 120, 120, x - 4, y - 2, w + 8, w + 8);
    ctx.restore();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const blink = S.t % 16 < 10;
    if (sel0 && blink) { ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); U.text(ctx, 'J1', x + 3, y + 6, { size: 6, color: '#ff6060' }); }
    if (sel1 && blink) { ctx.strokeStyle = '#40a0ff'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4); U.text(ctx, S.mode === 'versus' ? 'J2' : 'CPU', x + w - 3, y + 6, { size: 6, color: '#60b0ff', align: 'right' }); }
  }

  function sideInfo(ctx, p) {
    const idx = S.picked[p] !== null ? S.picked[p] : S.cur[p];
    if (p === 1 && S.mode !== 'versus' && S.picked[0] === null) return;
    const ch = CH[idx];
    const x = p === 0 ? 50 : W - 50;
    const pose = S.picked[p] !== null ? SM.Rig.POSES[ch.win] || SM.Rig.POSES.win : SM.Rig.mix(SM.Rig.POSES.idle, SM.Rig.POSES.idle2, (Math.sin(S.t * 0.08) + 1) / 2);
    fighterAt(ctx, ch, pose, x, 196, p === 0 ? 1 : -1, 1.25);
    U.text(ctx, ch.name.toUpperCase(), x, 210, { size: 12, align: 'center', color: p === 0 ? '#ff7070' : '#70b0ff', font: SM.FONT_BIG });
    U.text(ctx, ch.style, x, 220, { size: 6, align: 'center', color: '#ddd' });
  }

  function drawSelect(ctx) {
    bg(ctx, '#0c1430', '#301030');
    U.big(ctx, 'ESCOLHE O TEU MANO', W / 2, 16, 18);
    const cw = 34, chh = 40, gap = 3;
    CH.forEach((_, i) => {
      const row = Math.floor(i / COLS), col = i % COLS;
      const n = row === 0 ? COLS : CH.length - COLS;
      const x0 = W / 2 - (n * (cw + gap) - gap) / 2;
      charCard(ctx, i, x0 + col * (cw + gap), 30 + row * (chh + gap), cw, chh);
    });
    sideInfo(ctx, 0);
    sideInfo(ctx, 1);
    // lista de especiais do lutador em foco
    const p = S.picked[0] === null || S.mode === 'versus' ? 0 : 1;
    const ch = CH[S.picked[p] !== null && p === 0 && S.mode === 'versus' ? S.cur[1] : S.cur[p]];
    const y0 = 124;
    U.panel(ctx, W / 2 - 96, y0, 192, 86);
    U.text(ctx, ch.name.toUpperCase() + ' — ' + ch.style.toUpperCase(), W / 2, y0 + 9, { size: 7, align: 'center', color: '#ffe040' });
    const arrows = { '236': '↓↘→', '623': '→↓↘', '214': '↓↙←' };
    ch.specials.forEach((sp, i) => {
      U.text(ctx, sp.name, W / 2 - 88, y0 + 24 + i * 13, { size: 7, color: '#fff' });
      U.text(ctx, arrows[sp.cmd] + (sp.btn === 'p' ? ' + SOCO' : ' + PONTAPÉ'), W / 2 + 88, y0 + 24 + i * 13, { size: 7, align: 'right', color: '#9cf' });
    });
    U.text(ctx, 'SUPER: ' + ch.super.name, W / 2 - 88, y0 + 66, { size: 7, color: '#ff9a40' });
    U.text(ctx, '↓↘→↓↘→ + SOCO', W / 2 + 88, y0 + 66, { size: 7, align: 'right', color: '#9cf' });
    U.text(ctx, 'ou SOCO FORTE + PONTAPÉ FORTE', W / 2 + 88, y0 + 77, { size: 6, align: 'right', color: '#789' });
    const stats = `VIDA ${ch.stats.hp}  ·  VELOCIDADE ${Math.round(ch.stats.walk * 100)}%  ·  FORÇA ${Math.round(ch.stats.power * 100)}%`;
    U.text(ctx, stats, W / 2, H - 6, { size: 6, align: 'center', color: '#aab' });
  }

  function drawStage(ctx) {
    const n = SM.Stages.list.length;
    const st = S.stageSel < n ? SM.Stages.list[S.stageSel] : SM.Stages.list[Math.floor(S.t / 20) % n];
    SM.Stages.draw(ctx, st, SM.STAGE_W / 2, S.t);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
    U.big(ctx, 'CENÁRIO', W / 2, 30, 26);
    U.text(ctx, '◀  ' + (S.stageSel < n ? st.name.toUpperCase() : 'ALEATÓRIO') + '  ▶', W / 2, H / 2, { size: 16, align: 'center', color: '#fff', font: SM.FONT_BIG });
    U.text(ctx, 'F / ENTER PARA LUTAR', W / 2, H - 20, { size: 8, align: 'center', color: '#ffe040' });
  }

  function drawVS(ctx) {
    const a = CH[S.picked[0]], b = CH[S.picked[1]];
    ctx.fillStyle = '#b01818'; ctx.fillRect(0, 0, W / 2, H);
    ctx.fillStyle = '#1838b0'; ctx.fillRect(W / 2, 0, W / 2, H);
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.moveTo(W / 2 - 20, 0); ctx.lineTo(W / 2 + 20, 0); ctx.lineTo(W / 2 - 10, H); ctx.lineTo(W / 2 - 50, H); ctx.fill();
    const k = Math.min(1, S.t / 20);
    fighterAt(ctx, a, SM.Rig.POSES.winCool, -60 + 160 * k, 240, 1, 2);
    fighterAt(ctx, b, SM.Rig.POSES.winCool, W + 60 - 160 * k, 240, -1, 2);
    U.big(ctx, 'VS', W / 2 - 15, H / 2, 60, '#ffffff', '#ffd040', 1 + Math.max(0, (30 - S.t) / 30));
    U.text(ctx, a.name.toUpperCase(), 20, H - 20, { size: 22, color: '#fff', font: SM.FONT_BIG });
    U.text(ctx, b.name.toUpperCase(), W - 20, H - 20, { size: 22, color: '#fff', align: 'right', font: SM.FONT_BIG });
    if (S.mode === 'arcade') U.text(ctx, `LUTA ${S.ladder.idx + 1} DE ${S.ladder.order.length}`, W / 2, 16, { size: 9, align: 'center', color: '#fff' });
    U.text(ctx, '"' + a.quote + '"', 20, 20, { size: 8, color: '#ffe0e0' });
    U.text(ctx, '"' + b.quote + '"', W - 20, 20, { size: 8, color: '#e0e8ff', align: 'right' });
  }

  function drawPause(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    if (S.showMoves) { drawMoveList(ctx, S.battle.fighters[0].ch, 30); return; }
    U.big(ctx, 'PAUSA', W / 2, 60, 30);
    ['CONTINUAR', 'LISTA DE GOLPES', 'SAIR PARA O MENU'].forEach((o, i) => {
      const on = i === S.pauseSel;
      U.text(ctx, (on ? '▶ ' : '') + o, W / 2, 100 + i * 20, { size: on ? 12 : 10, align: 'center', color: on ? '#ffe040' : '#ccc' });
    });
  }

  function drawMoveList(ctx, ch, y) {
    U.panel(ctx, 30, y - 16, W - 60, 172);
    U.text(ctx, 'GOLPES — ' + ch.name.toUpperCase(), W / 2, y - 4, { size: 10, align: 'center', color: '#ffe040' });
    const rows = [
      ['Soco fraco / forte', 'F / G   (J2: K / L)'],
      ['Pontapé fraco / forte', 'V / B   (J2: , / .)'],
      ['Agarrar (perto)', 'SOCO FRACO + PONTAPÉ FRACO'],
      ['Defender', 'segurar para trás (agachado defende baixos)'],
    ];
    const arrows = { '236': '↓↘→', '623': '→↓↘', '214': '↓↙←' };
    ch.specials.forEach((sp) => rows.push([sp.name, arrows[sp.cmd] + (sp.btn === 'p' ? ' + SOCO' : ' + PONTAPÉ')]));
    rows.push(['SUPER: ' + ch.super.name, '↓↘→↓↘→ + SOCO  ou  G+B (barra cheia)']);
    rows.forEach(([a, b], i) => {
      U.text(ctx, a, 40, y + 14 + i * 16, { size: 8, color: i >= 4 ? '#fff' : '#bbb' });
      U.text(ctx, b, W - 40, y + 14 + i * 16, { size: 8, align: 'right', color: '#9cf' });
    });
  }

  function drawControls(ctx) {
    bg(ctx);
    U.big(ctx, 'COMANDOS', W / 2, 22, 24);
    const rows = [
      ['', 'JOGADOR 1', 'JOGADOR 2'],
      ['Mover / saltar / agachar', 'W A S D', 'SETAS'],
      ['Soco fraco · forte', 'F · G', 'K · L  (ou 4 · 5)'],
      ['Pontapé fraco · forte', 'V · B', ', · .  (ou 1 · 2)'],
      ['Pausa', 'ENTER / ESC', 'ENTER (numpad)'],
      ['Comando de consola', 'X Y = socos · A B = pontapés · RB = super', ''],
    ];
    rows.forEach((r, i) => {
      const y = 50 + i * 16, c = i === 0 ? '#ffe040' : '#fff';
      U.text(ctx, r[0], 20, y, { size: 7, color: c });
      U.text(ctx, r[1], 230, y, { size: 7, color: i === 0 ? c : '#ff9090', align: 'center' });
      U.text(ctx, r[2], 330, y, { size: 7, color: i === 0 ? c : '#90b0ff', align: 'center' });
    });
    const tips = [
      'Defende segurando para trás. Agachado defendes golpes baixos; em pé defendes ataques no ar.',
      'Especiais: ↓↘→ (meia-lua para a frente), →↓↘ (dragão), ↓↙← (meia-lua para trás) + soco ou pontapé.',
      'Combos: golpes fracos encadeiam-se; cancela um golpe que acerta num especial.',
      'Barra SUPER cheia: ↓↘→↓↘→ + soco, ou soco forte + pontapé forte ao mesmo tempo.',
      'A sós no teclado? O jogador 1 também pode usar as setas e K L , .',
    ];
    tips.forEach((t, i) => U.text(ctx, '• ' + t, 20, 158 + i * 12, { size: 6, color: '#cde' }));
  }

  function drawResult(ctx) {
    const bt = S.battle;
    bt.draw(ctx);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
    const w = bt.fighters[S.result.winner];
    fighterAt(ctx, w.ch, SM.Rig.POSES[w.ch.win] || SM.Rig.POSES.win, W / 2 - 80, 205, 1, 1.4);
    U.big(ctx, w.ch.name.toUpperCase() + ' VENCE!', W / 2 + 50, 70, 30);
    U.text(ctx, '"' + w.ch.quote + '"', W / 2 + 50, 100, { size: 11, align: 'center', color: '#fff', italic: true });
    if (S.t > 60) {
      const msg = S.mode === 'arcade' ? (S.result.winner === 0 ? 'ENTER: PRÓXIMA LUTA' : '') : 'ENTER: NOVA LUTA   ·   G: MENU';
      U.text(ctx, msg, W / 2 + 50, 150, { size: 8, align: 'center', color: '#ffe040' });
    }
  }

  function drawContinue(ctx) {
    bg(ctx, '#200', '#000');
    const n = Math.max(0, 9 - Math.floor(S.t / 60));
    U.big(ctx, 'CONTINUAR?', W / 2, 60, 32, '#fff', '#f44');
    U.big(ctx, String(n), W / 2, 120, 60, '#fff', '#fa0');
    fighterAt(ctx, CH[S.picked[0]], SM.Rig.POSES.lose, W / 2, 210, 1, 1);
    U.text(ctx, 'ENTER PARA CONTINUAR', W / 2, 160, { size: 8, align: 'center', color: '#fff' });
    if (n === 0) go('title');
  }

  function drawEnding(ctx) {
    bg(ctx, '#301a00', '#a04000');
    const ch = CH[S.picked[0]];
    fighterAt(ctx, ch, SM.Rig.POSES[ch.win] || SM.Rig.POSES.win, W / 2, 200, 1, 1.5);
    U.big(ctx, 'CAMPEÃO DO BAIRRO!', W / 2, 36, 28, '#fff6a0', '#ffb000');
    U.text(ctx, ch.name.toUpperCase() + ' derrotou todos os manos.', W / 2, 62, { size: 9, align: 'center', color: '#fff' });
    const names = CH.filter((c) => c !== ch).map((c) => c.name).join(' · ');
    U.text(ctx, names, W / 2, H - 10, { size: 6, align: 'center', color: '#fed' });
  }

  function draw(ctx) {
    switch (S.screen) {
      case 'title': drawTitle(ctx); break;
      case 'menu': drawMenu(ctx); break;
      case 'difficulty': drawDifficulty(ctx); break;
      case 'controls': drawControls(ctx); break;
      case 'select': drawSelect(ctx); break;
      case 'stage': drawStage(ctx); break;
      case 'vs': case 'fightNow': drawVS(ctx); break;
      case 'fight': S.battle.draw(ctx); if (S.paused) drawPause(ctx); break;
      case 'result': drawResult(ctx); break;
      case 'continue': drawContinue(ctx); break;
      case 'ending': drawEnding(ctx); break;
    }
    if (A.muted) U.text(ctx, 'SEM SOM', W - 4, H - 6, { size: 6, align: 'right', color: '#f88' });
  }

  return { update, draw, S };
})();
