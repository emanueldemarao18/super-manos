'use strict';
// Uma partida: dois lutadores, câmara, projéteis, colisões, dano, rounds e interface (HUD).

SM.Battle = (() => {
  const W = SM.W;

  class Battle {
    // opts: { chars: [ch, ch], stage, controllers: [ctrl, ctrl], training, onEnd(winnerSide) }
    constructor(opts) {
      this.opts = opts;
      this.stage = opts.stage;
      this.training = !!opts.training;
      this.fighters = opts.chars.map((ch, i) => new SM.Fighter(ch, i, this));
      this.controllers = opts.controllers;
      this.round = 0;
      this.t = 0;
      this.startRound();
      SM.Audio.music(this.stage.music);
    }

    startRound() {
      this.round++;
      const mid = SM.STAGE_W / 2;
      this.fighters[0].reset(mid - 70, 1);
      this.fighters[1].reset(mid + 70, -1);
      this.fighters.forEach((f) => { if (this.training) f.meter = SM.METER_MAX; });
      this.camX = mid;
      this.projectiles = [];
      this.timer = SM.ROUND_TIME;
      this.timerT = 0;
      this.hitstop = 0;
      this.freeze = null;
      this.shakeT = 0;
      this.slow = 0;
      this.combo = [0, 0];
      this.comboShow = [0, 0];
      this.comboT = [0, 0];
      this.callouts = [];
      this.lastAttacker = 0;
      this.phase = 'intro';
      this.phaseT = 0;
      this.result = null;
      SM.FX.clear();
    }

    // ---------- utilidades ----------
    bounds() {
      const half = W / 2 - 16;
      return { left: Math.max(16, this.camX - half), right: Math.min(SM.STAGE_W - 16, this.camX + half) };
    }
    shake(n) { this.shakeT = Math.max(this.shakeT, n); }
    hitFx(x, y, kind, color) { SM.FX.spark(x, y, kind, color); }
    callout(f, str) { this.callouts.push({ side: f.side, str, t: 70 }); }
    spawn(p) {
      const d = { life: 300, hits: 0, cd: 0, w: 20, h: 20 };
      const pr = Object.assign(d, p);
      this.projectiles.push(pr);
      return pr;
    }

    superFreeze(f, sp) {
      this.freeze = { f, sp, t: 42 };
      this.callout(f, sp.name);
      f.flash = 0;
    }

    // ---------- dano ----------
    canBlockNow(def) {
      return ['stand', 'walk', 'crouch', 'block', 'land'].includes(def.state) && !def.airborne;
    }

    wouldBlock(def, att, level) {
      if (!this.canBlockNow(def)) return false;
      const awayFromAtt = att.x > def.x ? (def.held & SM.BTN.left) : (def.held & SM.BTN.right);
      if (!awayFromAtt) return false;
      const crouch = !!(def.held & SM.BTN.down);
      if (level === 'low' && !crouch) return false;
      if (level === 'overhead' && crouch) return false;
      return true;
    }

    // aplica dano direto (agarrões, supers cinemáticos); trata KO e escala de combo
    damage(att, def, dmg, opts = {}) {
      const side = att.side;
      const inCombo = ['hit', 'juggle', 'thrown'].includes(def.state) || opts.super;
      this.combo[side] = inCombo ? this.combo[side] + 1 : 1;
      const scaled = Math.round(dmg * (opts.throw || opts.super ? 1 : SM.comboScale(this.combo[side] - 1)));
      def.hp = Math.max(this.training ? 1 : 0, def.hp - scaled);
      att.meter = Math.min(SM.METER_MAX, att.meter + scaled * 0.06 + 1);
      def.meter = Math.min(SM.METER_MAX, def.meter + scaled * 0.04);
      if (this.combo[side] >= 2) { this.comboShow[side] = this.combo[side]; this.comboT[side] = 80; }
      this.lastAttacker = side;
      if (def.hp <= 0 && !def.ko) this.koHit(att, def);
      return scaled;
    }

    // golpe com caixa de ataque: devolve 'hit' | 'block' | null
    hitFighter(att, def, info, proj = null) {
      if (def.invuln > 0 || ['down', 'getup', 'thrown'].includes(def.state) || def.ko) return null;
      if (def.state === 'juggle' && def.jugglePts >= 4 && info.kind !== 'super') return null;
      const dir = proj ? proj.dir : (def.x > att.x ? 1 : -1);

      // postura de contra-ataque
      if (def.countering && !proj && !info.unblockable && def.move) {
        SM.Fighter.SPECIALS.counter.trigger(def, def.move, att);
        this.hitstop = 10;
        return 'block';
      }

      if (!info.unblockable && this.wouldBlock(def, att, info.level)) {
        def.crouching = !!(def.held & SM.BTN.down);
        def.setState('block');
        def.stun = info.blockstun;
        def.vx = dir * info.push * 1.2;
        if (info.chip) def.hp = Math.max(1, def.hp - Math.round(info.dmg * 0.18));
        att.meter = Math.min(SM.METER_MAX, att.meter + 2);
        this.pushFromWall(att, def, info.push);
        this.hitstop = Math.max(this.hitstop, 6);
        SM.FX.spark(this.contactX(att, def, proj), this.contactY(att, def, info, proj), 'block');
        SM.Audio.sfx('block');
        return 'block';
      }

      const wasAir = def.airborne;
      const crouching = def.state === 'crouch' || (def.state === 'block' && def.crouching) || (def.state === 'attack' && def.move && def.move.def && def.move.def.crouch);
      // golpe durante o ataque do adversário = counter hit (mais dano)
      const counterHit = def.state === 'attack' && def.move && def.move.kind === 'normal' && def.move.t <= def.move.def.startup + def.move.def.active;
      def.move = null;
      def.countering = false;
      def.hidden = false;
      def.drawFlip = 1;
      this.damage(att, def, info.dmg * (counterHit ? 1.2 : 1), {});
      if (counterHit) this.callouts.push({ side: att.side, str: 'COUNTER', t: 40, small: true });

      if (def.hp <= 0 || wasAir || info.kd || (info.launch && wasAir)) {
        def.setState('juggle');
        def.vy = info.launch ? -7.5 : info.kd ? -4.8 : -4;
        def.vx = dir * (info.push * 0.7 + 1);
        def.y = Math.min(def.y, -1);
        def.jugglePts += wasAir ? 1 : 0;
      } else {
        def.crouching = crouching;
        def.setState('hit');
        def.hitPose = info.level === 'low' || info.level === 'mid' ? 'mid' : 'high';
        def.stun = info.hitstun + (counterHit ? 4 : 0);
        def.vx = dir * info.push;
        this.pushFromWall(att, def, info.push);
      }
      def.flash = 4;
      const heavy = info.kind === 'heavy' || info.kind === 'special' || info.kind === 'super';
      this.hitstop = Math.max(this.hitstop, info.kind === 'super' ? 12 : heavy ? 10 : 7);
      if (heavy) this.shake(info.kind === 'super' ? 8 : 4);
      SM.FX.spark(this.contactX(att, def, proj), this.contactY(att, def, info, proj), heavy ? 'heavy' : 'light', info.color || '#fff6c0');
      SM.Audio.sfx(heavy ? 'hitH' : 'hitL');
      return 'hit';
    }

    contactX(att, def, proj) { return proj ? proj.x : (att.x + def.x) / 2 + (def.x > att.x ? 6 : -6); }
    contactY(att, def, info, proj) {
      if (proj) return proj.y;
      const top = def.y - 90 * def.s;
      return SM.clamp(info.y + info.h / 2, top, def.y - 10);
    }

    // encostado à parede/borda: quem recua é o atacante
    pushFromWall(att, def, push) {
      const b = this.bounds();
      if (def.x <= b.left + 2 || def.x >= b.right - 2) att.vx = -Math.sign(def.x - att.x) * push * 0.8;
      if (att.state === 'attack' && att.move && att.move.kind === 'normal') att.x += att.vx * 2;
    }

    koHit(att, def) {
      def.ko = true;
      this.phase = 'ko';
      this.phaseT = 0;
      this.slow = 70;
      this.koSide = att.side;
      SM.Audio.sfx('ko');
    }

    // ---------- ciclo ----------
    update() {
      this.t++;
      this.phaseT++;
      const fs = this.fighters;
      const active = this.phase === 'fight' || this.phase === 'ko';

      // entrada
      fs.forEach((f, i) => {
        const c = this.controllers[i];
        let h = 0, p = 0;
        if (this.phase === 'fight' && !f.ko) ({ held: h, pressed: p } = c.read(this, f));
        f.input(h, p);
      });

      if (this.freeze) {
        this.freeze.t--;
        if (this.freeze.t % 3 === 0) SM.FX.trail(this.freeze.f.x, -40 - Math.random() * 40, this.freeze.sp.color, 14);
        SM.FX.update();
        if (this.freeze.t <= 0) this.freeze = null;
        return;
      }
      if (this.shakeT > 0) this.shakeT--;
      for (let i = 0; i < 2; i++) if (this.comboT[i] > 0) this.comboT[i]--;
      this.callouts.forEach((c) => c.t--);
      this.callouts = this.callouts.filter((c) => c.t > 0);

      if (this.hitstop > 0) { this.hitstop--; SM.FX.update(); return; }
      if (this.slow > 0) { this.slow--; if (this.slow % 3) { SM.FX.update(); return; } }

      if (active || this.phase === 'roundEnd') {
        fs.forEach((f) => f.update());
        this.separate();
        this.updateProjectiles();
        if (this.phase === 'fight') this.checkHits();
        // combos acabam quando o adversário recupera
        fs.forEach((f, i) => { if (!['hit', 'juggle', 'thrown', 'down'].includes(fs[1 - i].state)) this.combo[i] = 0; });
      }
      this.updateCamera();
      this.updatePhase();
      SM.FX.update();
    }

    separate() {
      const [a, b] = this.fighters;
      const bd = this.bounds();
      for (const f of this.fighters) f.x = SM.clamp(f.x, bd.left, bd.right);
      if (a.hidden || b.hidden || a.state === 'thrown' || b.state === 'thrown') return;
      const minD = 24 * (a.s + b.s) / 2;
      const dx = b.x - a.x;
      // só empurra se estiverem à mesma altura (permite saltar por cima)
      if (Math.abs(dx) < minD && Math.abs(a.y - b.y) < 60) {
        const push = (minD - Math.abs(dx)) / 2;
        const s = dx === 0 ? (a.face > 0 ? 1 : -1) : Math.sign(dx);
        a.x -= s * push; b.x += s * push;
        for (const f of this.fighters) {
          if (f.x < bd.left) { const o = bd.left - f.x; f.x = bd.left; (f === a ? b : a).x += o; }
          if (f.x > bd.right) { const o = f.x - bd.right; f.x = bd.right; (f === a ? b : a).x -= o; }
        }
      }
    }

    updateProjectiles() {
      const bd = this.bounds();
      for (const p of this.projectiles) {
        if (p.cd > 0) p.cd--;
        if (p.beam) {
          const o = p.owner;
          p.x = o.x + p.dir * 30;
          p.x0 = p.x;
          if (--p.life <= 0) p.dead = true;
          continue;
        }
        if (p.column) {
          if (p.t === undefined) p.t = 0;
          p.t++;
          if (p.t % 4 === 0) SM.FX.bolt(p.x + (Math.random() - 0.5) * 20, p.color, 8);
          if (--p.life <= 0) p.dead = true;
          continue;
        }
        p.x += p.vx;
        if (p.fx === 'quake' && this.t % 4 === 0) SM.FX.dust(p.x, 1);
        if (--p.life <= 0 || p.x < bd.left - 60 || p.x > bd.right + 60) p.dead = true;
      }
      // choque entre projéteis
      const ps = this.projectiles.filter((p) => !p.beam && !p.column);
      for (let i = 0; i < ps.length; i++)
        for (let j = i + 1; j < ps.length; j++)
          if (ps[i].owner !== ps[j].owner && Math.abs(ps[i].x - ps[j].x) < 18 && Math.abs(ps[i].y - ps[j].y) < 30) {
            ps[i].dead = ps[j].dead = true;
            SM.FX.spark((ps[i].x + ps[j].x) / 2, ps[i].y, 'heavy', '#fff');
            SM.Audio.sfx('hitL');
          }
      // super-feixe anula projéteis normais
      for (const b of this.projectiles.filter((p) => p.beam))
        for (const p of ps) if (p.owner !== b.owner && Math.sign(p.x - b.x) === b.dir) p.dead = true;
      this.projectiles = this.projectiles.filter((p) => !p.dead);
    }

    projBox(p) {
      if (p.beam) {
        const bd = this.bounds();
        const x1 = p.dir > 0 ? bd.right + 40 : bd.left - 40;
        return { x: Math.min(p.x, x1), y: p.y - p.h / 2, w: Math.abs(x1 - p.x), h: p.h };
      }
      if (p.column) return { x: p.x - p.w / 2, y: -200, w: p.w, h: 200 };
      return { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
    }

    checkHits() {
      const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      const fs = this.fighters;
      // projéteis
      for (const p of this.projectiles) {
        const def = fs[1 - p.owner.side];
        if (p.cd > 0) continue;
        if (p.maxHits && p.hits >= p.maxHits) continue;
        const pb = this.projBox(p);
        if (!def.hurtBoxes().some((h) => overlap(pb, h))) continue;
        const last = p.maxHits ? p.hits + 1 >= p.maxHits : true;
        const info = Object.assign({}, p.info, { kd: p.info.kd || (p.maxHits && last) });
        const r = this.hitFighter(p.owner, def, info, p.beam || p.column ? Object.assign({}, p, { x: def.x, y: def.y - 50 }) : p);
        if (r) {
          p.hits++;
          if (p.maxHits) p.cd = p.hitEvery || 6;
          else p.dead = true;
          if (r === 'hit') p.owner.meter = Math.min(SM.METER_MAX, p.owner.meter + 3);
        }
      }
      this.projectiles = this.projectiles.filter((p) => !p.dead);

      // golpes corpo a corpo (ambos em simultâneo = trocam)
      const boxes = fs.map((f) => f.attackBox());
      const results = [null, null];
      fs.forEach((f, i) => {
        const ab = boxes[i];
        if (!ab) return;
        const def = fs[1 - i];
        if (!def.hurtBoxes().some((h) => overlap(ab, h))) return;
        results[i] = this.hitFighter(f, def, ab);
        if (results[i]) {
          if (f.move) {
            f.move.hits = (f.move.hits || 0) + 1;
            f.move.connected = true;
          }
          if (ab.onHit) ab.onHit(results[i]);
        }
      });
    }

    updateCamera() {
      const [a, b] = this.fighters;
      const target = SM.clamp((a.x + b.x) / 2, W / 2, SM.STAGE_W - W / 2);
      this.camX += (target - this.camX) * 0.15;
    }

    updatePhase() {
      const fs = this.fighters;
      switch (this.phase) {
        case 'intro':
          if (this.phaseT === 1) SM.Audio.sfx('round');
          if (this.phaseT === 70) SM.Audio.sfx('fight');
          if (this.phaseT >= 100) { this.phase = 'fight'; this.phaseT = 0; }
          break;
        case 'fight':
          if (this.training) {
            fs.forEach((f) => {
              f.meter = SM.METER_MAX;
              if (!['hit', 'juggle', 'down', 'getup', 'thrown', 'block'].includes(f.state)) { f.idleT = (f.idleT || 0) + 1; if (f.idleT > 50) { f.hp = f.maxHp; f.redHp = f.hp; } }
              else f.idleT = 0;
            });
            break;
          }
          if (++this.timerT >= 60) {
            this.timerT = 0;
            this.timer--;
            if (this.timer <= 10 && this.timer > 0) SM.Audio.sfx('tick');
            if (this.timer <= 0) {
              this.timer = 0;
              this.phase = 'timeup';
              this.phaseT = 0;
            }
          }
          break;
        case 'ko':
          // espera que o derrotado caia
          if (this.phaseT > 90 && fs.every((f) => !['attack', 'juggle', 'hit', 'thrown'].includes(f.state) || f.ko)) this.endRound();
          break;
        case 'timeup':
          if (this.phaseT === 1) fs.forEach((f) => { f.move = null; if (f.y < 0) { f.setState('juggle'); } else f.setState('stand'); });
          if (this.phaseT > 60) this.endRound();
          break;
        case 'roundEnd':
          if (this.phaseT === 1) SM.Audio.sfx(this.result.winner >= 0 ? 'win' : 'round');
          if (this.phaseT > 150) {
            const w = this.fighters.findIndex((f) => f.wins >= SM.ROUNDS_TO_WIN);
            if (w >= 0) { this.phase = 'over'; this.phaseT = 0; if (this.opts.onEnd) this.opts.onEnd(w); }
            else if (this.round >= 5) { this.phase = 'over'; this.opts.onEnd && this.opts.onEnd(fs[0].wins >= fs[1].wins ? 0 : 1); }
            else this.startRound();
          }
          break;
      }
    }

    endRound() {
      const [a, b] = this.fighters;
      let winner = -1;
      if (a.hp > b.hp) winner = 0;
      else if (b.hp > a.hp) winner = 1;
      if (winner >= 0) this.fighters[winner].wins++;
      else { a.wins++; b.wins++; }
      const wf = this.fighters[winner];
      this.result = { winner, perfect: wf && wf.hp === wf.maxHp, timeUp: this.phase === 'timeup' };
      this.fighters.forEach((f, i) => {
        if (f.ko) return;
        f.move = null;
        f.y = 0;
        f.faceOpp();
        f.setState(i === winner ? 'win' : winner < 0 ? 'stand' : 'lose');
      });
      this.projectiles = [];
      this.phase = 'roundEnd';
      this.phaseT = 0;
    }

    // ---------- desenho ----------
    sx(x) { return x - this.camX + W / 2; }

    draw(ctx) {
      const shake = this.shakeT > 0 ? (Math.random() - 0.5) * this.shakeT : 0;
      ctx.save();
      ctx.translate(shake, shake * 0.5);
      SM.Stages.draw(ctx, this.stage, this.camX, this.t);
      const sx = (x) => this.sx(x);
      if (this.freeze) {
        ctx.fillStyle = 'rgba(0,0,20,0.6)';
        ctx.fillRect(-10, -10, W + 20, SM.H + 20);
        const f = this.freeze.f;
        // raios atrás do lutador
        ctx.save();
        ctx.translate(sx(f.x), SM.FLOOR - 50);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = this.freeze.sp.color;
        for (let i = 0; i < 12; i++) {
          ctx.rotate(Math.PI / 6 + this.t * 0.002);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(240, -12); ctx.lineTo(240, 12); ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      // quem ataca por último fica à frente
      const order = this.lastAttacker === 0 ? [1, 0] : [0, 1];
      for (const p of this.projectiles) if (p.column) this.drawColumn(ctx, p, sx);
      order.forEach((i) => this.fighters[i].draw(ctx, sx));
      for (const p of this.projectiles) if (!p.column) SM.FX.drawProjectile(ctx, p, sx, this.t);
      SM.FX.draw(ctx, sx);
      ctx.restore();
      this.drawHUD(ctx);
    }

    drawColumn(ctx, p, sx) {
      const X = sx(p.x);
      const k = Math.min(1, p.t / 6);
      if (p.meteor) {
        const y = Math.min(SM.FLOOR - 20, -40 + p.t * 18);
        ctx.globalAlpha = 0.9;
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i < 2 ? '#fff4a0' : i < 4 ? p.color : '#801010';
          ctx.beginPath(); ctx.arc(X + i * 2, y - i * 12, 22 - i * 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }
      ctx.globalAlpha = 0.25 * k;
      ctx.fillStyle = p.color;
      ctx.fillRect(X - p.w / 2, 0, p.w, SM.FLOOR);
      ctx.globalAlpha = 0.6 * k;
      ctx.fillRect(X - p.w / 4, 0, p.w / 2, SM.FLOOR);
      ctx.globalAlpha = 1;
    }

    drawHUD(ctx) {
      const U = SM.UI, fs = this.fighters;
      // barras de vida
      const bw = 158, by = 12;
      fs.forEach((f, i) => {
        const x = i === 0 ? 10 : W - 10 - bw;
        U.bar(ctx, x, by, bw, 11, f.hp / f.maxHp, f.hp / f.maxHp < 0.25 ? '#ff9a20' : '#f8e030', i === 0 ? 1 : -1, '#400', f.redHp / f.maxHp);
        U.text(ctx, f.ch.name.toUpperCase(), i === 0 ? x + 4 : x + bw - 4, by + 18, { size: 8, align: i === 0 ? 'left' : 'right', color: '#fff' });
        // vitórias
        for (let k = 0; k < SM.ROUNDS_TO_WIN; k++) {
          const cx = i === 0 ? x + bw - 8 - k * 10 : x + 8 + k * 10;
          ctx.beginPath(); ctx.arc(cx, by + 19, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = k < f.wins ? '#f8d030' : '#222'; ctx.fill();
          ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
        }
        // barra de super
        const mw = 90, mx = i === 0 ? 10 : W - 10 - mw, my = SM.H - 14;
        const full = f.meter >= SM.METER_MAX;
        U.bar(ctx, mx, my, mw, 7, f.meter / SM.METER_MAX, full ? (this.t % 20 < 10 ? '#60f0ff' : '#ffffff') : '#2a8aff', i === 0 ? -1 : 1, '#001030');
        U.text(ctx, full ? 'SUPER!' : 'SUPER', i === 0 ? mx + mw + 4 : mx - 4, my + 4, { size: 6, align: i === 0 ? 'left' : 'right', color: full ? '#80f8ff' : '#9ab' });
        // combos
        if (this.comboT[i] > 0) {
          const cx = i === 0 ? 50 : W - 50;
          U.text(ctx, this.comboShow[i] + ' GOLPES', cx, 64, { size: 13, align: 'center', color: '#ffe040', font: SM.FONT_BIG });
          U.text(ctx, 'COMBO', cx, 76, { size: 8, align: 'center', color: '#fff' });
        }
      });
      // relógio
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(W / 2 - 15, 6, 30, 22);
      U.text(ctx, this.training ? '∞' : String(this.timer).padStart(2, '0'), W / 2, 18, { size: 16, align: 'center', color: this.timer <= 10 ? '#ff5050' : '#fff', font: SM.FONT_BIG });

      // anúncios de golpes especiais / supers
      this.callouts.forEach((c) => {
        const a = Math.min(1, c.t / 10);
        ctx.globalAlpha = a;
        const x = c.side === 0 ? 14 : W - 14;
        U.text(ctx, c.str, x, c.small ? 92 : 100, { size: c.small ? 9 : 12, align: c.side === 0 ? 'left' : 'right', color: c.small ? '#ff6060' : '#80f0ff', font: SM.FONT_BIG, italic: true });
        ctx.globalAlpha = 1;
      });
      if (this.freeze) {
        const sp = this.freeze.sp, k = Math.min(1, (42 - this.freeze.t) / 8);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, SM.H / 2 - 16, W * k, 32);
        U.big(ctx, sp.name, W / 2, SM.H / 2, 22, '#ffffff', sp.color, 1);
      }

      // anúncios de round
      const cx = W / 2, cy = SM.H / 2 - 20;
      if (this.phase === 'intro') {
        if (this.phaseT < 70) {
          const s = Math.min(1, this.phaseT / 10);
          U.big(ctx, this.round >= 3 && fs[0].wins === fs[1].wins ? 'ROUND FINAL' : 'ROUND ' + this.round, cx, cy, 34, '#ffffff', '#c0c8ff', 0.5 + s * 0.5);
        } else {
          U.big(ctx, 'LUTA!', cx, cy, 46, '#fff6a0', '#ff5a00', 1 + Math.max(0, (80 - this.phaseT) / 20));
        }
      }
      if (this.phase === 'ko') {
        const s = Math.min(1, this.phaseT / 8);
        U.big(ctx, 'K.O.', cx, cy, 60, '#ffffff', '#ff2020', 2 - s);
      }
      if (this.phase === 'timeup') U.big(ctx, 'TEMPO!', cx, cy, 42, '#ffffff', '#ffa020');
      if (this.phase === 'roundEnd' && this.result) {
        const r = this.result;
        if (r.winner < 0) U.big(ctx, 'EMPATE', cx, cy, 36);
        else {
          U.big(ctx, fs[r.winner].ch.name.toUpperCase() + ' GANHA', cx, cy, 30);
          if (r.perfect) U.big(ctx, 'PERFEITO!', cx, cy + 30, 24, '#ffffff', '#40e0ff');
        }
      }
    }
  }

  return Battle;
})();
