'use strict';
// Um lutador: máquina de estados, física, golpes normais, especiais, supers e agarrões.
// x no cenário, y relativo ao chão (0 = no chão, negativo = no ar). face: 1 direita, -1 esquerda.

SM.Fighter = (() => {
  const B = SM.BTN;
  const R = SM.Rig.POSES;
  const mix = SM.Rig.mix;
  const FREE = new Set(['stand', 'walk', 'crouch', 'land']);

  class Fighter {
    constructor(ch, side, battle) {
      this.ch = ch;
      this.side = side;
      this.battle = battle;
      this.s = ch.body.size;
      this.maxHp = ch.stats.hp;
      this.meter = 0;
      this.wins = 0;
      this.reset(0, 1);
    }

    reset(x, face) {
      Object.assign(this, {
        x, y: 0, vx: 0, vy: 0, face, hp: this.maxHp, redHp: this.maxHp,
        state: 'stand', t: 0, move: null, stun: 0, crouching: false, airAttacked: false,
        invuln: 0, hidden: false, countering: false, jugglePts: 0, ko: false, flash: 0,
        held: 0, pressed: 0, pend: 0, pendT: 0, buf: [], drawFlip: 1, guard: false,
      });
    }

    get opp() { return this.battle.fighters[1 - this.side]; }
    get airborne() { return this.y < 0 || this.state === 'air' || this.state === 'juggle'; }

    // ---------- entrada ----------
    input(held, pressed) {
      this.held = held;
      this.pressed = pressed;
      if (pressed & (B.lp | B.hp | B.lk | B.hk)) { this.pend |= pressed; this.pendT = 6; }
      else if (--this.pendT <= 0) this.pend = 0;
      this.dir = SM.Motion.numpad(held, this.face);
      this.buf.push(this.dir);
      if (this.buf.length > 40) this.buf.shift();
    }
    consume() { this.pend = 0; this.pendT = 0; }
    get down() { return this.dir <= 3; }
    get up() { return this.dir >= 7; }
    get fwd() { return this.dir % 3 === 0; }
    get back() { return this.dir % 3 === 1; }

    // ---------- ciclo ----------
    update() {
      const o = this.opp;
      this.t++;
      if (this.invuln > 0) this.invuln--;
      if (this.flash > 0) this.flash--;
      this.guard = false;

      switch (this.state) {
        case 'stand': case 'walk': case 'crouch':
          this.faceOpp();
          if (this.tryActions()) break;
          this.groundMove();
          break;
        case 'land':
          this.vx = 0;
          if (this.tryActions()) break;
          if (this.t >= 3) this.toNeutral();
          break;
        case 'prejump':
          if (this.t >= 4) {
            const jump = this.ch.stats.jump || 1;
            this.vy = -SM.JUMP_V * jump;
            this.vx = this.jdir * SM.JUMP_X * (this.ch.stats.walk > 1 ? 1.1 : 1);
            this.y = -1;
            this.setState('air');
            SM.Audio.sfx('jump');
          }
          break;
        case 'air':
          this.tryActions();
          this.airPhysics();
          break;
        case 'attack':
          this.updateMove();
          break;
        case 'block': case 'hit':
          this.x += this.vx; this.vx *= 0.82;
          if (--this.stun <= 0) this.toNeutral();
          break;
        case 'juggle':
          this.airPhysics(true);
          break;
        case 'down':
          this.vx *= 0.8; this.x += this.vx;
          if (this.ko) break;
          if (this.t >= 36) { this.setState('getup'); this.invuln = 20; }
          break;
        case 'getup':
          if (this.t >= 16) this.toNeutral();
          break;
        case 'thrown': case 'intro': case 'win': case 'lose':
          break;
      }
      if (this.redHp > this.hp && !['hit', 'juggle', 'thrown'].includes(this.state)) this.redHp = Math.max(this.hp, this.redHp - 6);
    }

    setState(s) { this.state = s; this.t = 0; }
    faceOpp() { const d = this.opp.x - this.x; if (Math.abs(d) > 2) this.face = Math.sign(d); }

    toNeutral() {
      this.move = null;
      this.countering = false;
      this.hidden = false;
      this.drawFlip = 1;
      if (this.y < 0) { this.setState('air'); this.airAttacked = true; return; }
      this.y = 0; this.vy = 0;
      this.setState(this.down ? 'crouch' : 'stand');
    }

    groundMove() {
      const st = this.ch.stats;
      if (this.up) {
        this.jdir = this.fwd ? this.face : this.back ? -this.face : 0;
        this.airAttacked = false;
        this.setState('prejump');
        return;
      }
      if (this.down) {
        if (this.state !== 'crouch') this.setState('crouch');
        this.vx = 0;
        this.guard = this.back && this.threat();
        return;
      }
      if (this.fwd) { this.vx = SM.WALK_F * st.walk * this.face; if (this.state !== 'walk') this.setState('walk'); }
      else if (this.back) {
        this.guard = this.threat();
        this.vx = this.guard ? 0 : -SM.WALK_B * st.walk * this.face;
        if (this.state !== 'walk' && !this.guard) this.setState('walk');
        if (this.guard && this.state !== 'stand') this.setState('stand');
      } else { this.vx = 0; if (this.state !== 'stand') this.setState('stand'); }
      this.x += this.vx;
    }

    // há um ataque a chegar? (para mostrar a pose de defesa)
    threat() {
      const o = this.opp;
      if (o.state === 'attack' && Math.abs(o.x - this.x) < 140) return true;
      return this.battle.projectiles.some((p) => p.owner !== this && Math.abs(p.x - this.x) < 120);
    }

    airPhysics(juggle = false) {
      this.vy += SM.GRAVITY;
      this.x += this.vx;
      this.y += this.vy;
      if (this.y >= 0) {
        this.y = 0;
        this.vy = 0;
        if (juggle) {
          SM.Audio.sfx('fall');
          SM.FX.dust(this.x, 10, true);
          this.battle.shake(4);
          this.vx *= 0.3;
          this.setState('down');
          this.jugglePts = 0;
        } else {
          SM.FX.dust(this.x, 4);
          SM.Audio.sfx('land');
          this.vx = 0;
          this.setState('land');
          this.move = null;
        }
      }
    }

    // ---------- decisões ----------
    tryActions(cancel = null) {
      const p = this.pend;
      if (!p) return false;
      const air = this.state === 'air';
      if (air && this.airAttacked) return false;
      const P = B.lp | B.hp, K = B.lk | B.hk;
      const buf = this.buf;

      if (!air && (!cancel || cancel.special)) {
        // super: 236236 + soco/pontapé, ou Forte+Pontapé Forte juntos
        if (this.meter >= SM.METER_MAX && (((p & (P | K)) && SM.Motion.match(buf, '236236', 30)) || ((p & B.hp) && (p & B.hk)))) {
          this.consume(); this.startSuper(); return true;
        }
        for (const cmd of ['623', '214', '236']) {
          const sp = this.ch.specials.find((s) => s.cmd === cmd);
          if (!sp) continue;
          const btn = sp.btn === 'p' ? P : K;
          if ((p & btn) && SM.Motion.match(buf, cmd, 16)) {
            if (sp.type === 'projectile' && this.battle.projectiles.some((q) => q.owner === this && !q.column)) continue;
            this.consume();
            this.startSpecial(sp, !!(p & (B.hp | B.hk)));
            return true;
          }
        }
      }
      if (cancel && !cancel.normal) return false;

      if (!air && !cancel && (p & B.lp) && (p & B.lk)) {
        const o = this.opp;
        if (Math.abs(o.x - this.x) < SM.THROW.range && !o.airborne && ['stand', 'walk', 'crouch', 'attack', 'land'].includes(o.state) && !o.invuln) {
          this.consume(); this.startThrow(); return true;
        }
      }
      let name = null;
      const pre = air ? 'j' : this.down ? 'c' : '';
      if (p & B.hk) name = pre + 'hk';
      else if (p & B.hp) name = pre + 'hp';
      else if (p & B.lk) name = pre + 'lk';
      else if (p & B.lp) name = pre + 'lp';
      if (!name) return false;
      if (cancel && !(cancel.chain || []).includes(name)) return false;
      this.consume();
      this.startNormal(name);
      return true;
    }

    startNormal(name) {
      const def = SM.MOVES[name];
      const keepAir = this.state === 'air';
      this.move = { kind: 'normal', name, def, t: 0, connected: false, hits: 0 };
      if (keepAir) this.airAttacked = true;
      else this.vx = 0;
      this.setState('attack');
      this.move.air = keepAir;
    }

    // ---------- linha temporal dos golpes ----------
    updateMove() {
      const m = this.move;
      m.t++;
      if (m.kind === 'normal') return this.updateNormal(m);
      if (m.kind === 'throw') return this.updateThrow(m);
      const fn = m.kind === 'super' ? SUPERS[m.sp.type] : SPECIALS[m.sp.type];
      fn.update(this, m);
    }

    updateNormal(m) {
      const d = m.def;
      if (m.air) {
        this.vy += SM.GRAVITY; this.x += this.vx; this.y += this.vy;
        if (this.y >= 0) { this.y = 0; this.vy = 0; this.vx = 0; this.move = null; this.setState('land'); SM.FX.dust(this.x, 4); return; }
      } else {
        this.vx *= 0.7; this.x += this.vx;
      }
      if (m.t === d.startup + 1) SM.Audio.sfx(d.light ? 'whiffL' : 'whiffH');
      // cancelamentos depois de acertar/defender
      if (m.connected && m.t > d.startup && !m.air) {
        if (this.tryActions({ special: d.cancel, normal: !!d.chain, chain: d.chain })) return;
      }
      if (m.t >= d.startup + d.active + d.recovery) {
        if (m.air) { this.move = null; this.state = 'air'; }
        else this.toNeutral();
      }
    }

    // caixa de ataque ativa neste frame (em coordenadas do mundo) ou null
    attackBox() {
      const m = this.move;
      if (this.state !== 'attack' || !m) return null;
      if (m.kind === 'normal') {
        const d = m.def;
        if (m.t <= d.startup || m.t > d.startup + d.active || m.hits > 0) return null;
        const p = this.ch.stats.power;
        return this.box(d.box, { dmg: d.dmg * p, hitstun: d.hitstun, blockstun: d.blockstun, push: d.push, level: d.level, kd: d.kd, launch: d.launch, kind: d.light ? 'light' : 'heavy' });
      }
      if (m.kind === 'throw') return null;
      const fn = m.kind === 'super' ? SUPERS[m.sp.type] : SPECIALS[m.sp.type];
      return fn.box ? fn.box(this, m) : null;
    }

    // converte [x, y, w, h] local para o mundo
    box(b, info) {
      const s = this.s;
      const bx = b[0] * s, w = b[2] * s;
      const x = this.face > 0 ? this.x + bx : this.x - bx - w;
      return Object.assign({ x, y: this.y + b[1] * s, w, h: b[3] * s }, info);
    }

    hurtBoxes() {
      if (this.hidden || this.invuln > 0 || ['down', 'getup', 'thrown', 'intro'].includes(this.state)) return [];
      const s = this.s, w = 26;
      const low = this.state === 'crouch' || (this.state === 'block' && this.crouching) || (this.state === 'hit' && this.crouching) ||
        (this.state === 'attack' && this.move.kind === 'normal' && this.move.def.crouch && this.move.name !== 'chp');
      const h = (low ? 60 : this.airborne ? 74 : 96) * s;
      const top = this.airborne ? this.y - 86 * s : this.y - h;
      const boxes = [{ x: this.x - w / 2, y: top, w, h }];
      // braço/perna estendidos também levam
      if (this.state === 'attack' && this.move.kind === 'normal') {
        const d = this.move.def;
        if (this.move.t > d.startup) boxes.push(this.box([d.box[0], d.box[1] + 2, d.box[2] * 0.8, d.box[3] - 2], {}));
      }
      return boxes;
    }

    // ---------- agarrão ----------
    startThrow() {
      this.move = { kind: 'throw', t: 0, dmg: SM.THROW.dmg * this.ch.stats.power, style: 'toss' };
      this.setState('attack');
      const o = this.opp;
      o.setState('thrown');
      o.move = null;
      o.vx = o.vy = 0;
      SM.Audio.sfx('throw');
    }

    // também usado pelos agarrões de comando e super (style: toss | slam | mega)
    updateThrow(m) {
      const o = this.opp, f = this.face;
      const T = m.style === 'mega' ? 80 : m.style === 'slam' ? 46 : 28;
      if (m.style === 'toss') {
        o.x = this.x + f * (24 - Math.min(1, m.t / 18) * 52);
        o.y = -Math.sin(Math.min(1, m.t / 18) * Math.PI) * 36;
        if (m.t === 18) this.release(o, m.dmg, -f * 2.5, -4);
      } else {
        // levanta e esmaga (com saltinho no mega)
        const k = Math.min(1, m.t / (T - 12));
        const lift = m.style === 'mega' ? Math.sin(k * Math.PI) * 70 : Math.sin(k * Math.PI) * 30;
        if (m.style === 'mega') this.y = -lift * 0.8;
        o.x = this.x + f * 22;
        o.y = this.y - 40 - lift * 0.3;
        if (m.style === 'mega' && m.t % 14 === 0 && m.t < T - 12) { this.battle.hitFx(o.x, o.y - 20, 'heavy', this.ch.super.color); SM.Audio.sfx('hitH'); }
        if (m.t === T - 12) {
          this.y = 0;
          o.y = 0;
          SM.FX.dust(o.x, 14, true);
          this.battle.shake(8);
          this.release(o, m.dmg, f * 1.5, -3);
        }
      }
      if (m.t >= T) this.toNeutral();
    }

    release(o, dmg, vx, vy) {
      this.battle.damage(this, o, dmg, { throw: true });
      o.setState('juggle');
      o.vx = vx; o.vy = vy; o.y = Math.min(o.y, -1);
      this.battle.hitFx(o.x, o.y - 40, 'heavy');
      SM.Audio.sfx('hitH');
    }

    // ---------- especiais ----------
    startSpecial(sp, heavy) {
      this.move = { kind: 'special', sp, heavy, t: 0, hits: 0, cd: 0, connected: false };
      this.setState('attack');
      this.vx = 0;
      SM.Audio.sfx('special');
      SPECIALS[sp.type].start && SPECIALS[sp.type].start(this, this.move);
    }

    startSuper() {
      const sp = this.ch.super;
      this.meter = 0;
      this.move = { kind: 'super', sp, t: 0, hits: 0, cd: 0, connected: false };
      this.setState('attack');
      this.vx = 0;
      this.invuln = 50;
      this.battle.superFreeze(this, sp);
      SM.Audio.sfx('super');
    }

    // ---------- pose para desenhar ----------
    pose() {
      const st = this.state, t = this.t, m = this.move;
      const breathe = () => mix(R.idle, R.idle2, (Math.sin(this.battle.t * 0.08) + 1) / 2);
      switch (st) {
        case 'stand':
          return this.guard ? R.blockHi : breathe();
        case 'walk': {
          const ph = (this.battle.t * 0.11 * this.ch.stats.walk) % (Math.PI * 2);
          return mix(R.walk1, R.walk2, (Math.sin(ph) + 1) / 2);
        }
        case 'crouch': return this.guard ? R.blockLo : mix(R.squat, R.crouch, Math.min(1, t / 3));
        case 'land': case 'prejump': return R.squat;
        case 'air': return this.vy < 0 ? R.jumpUp : mix(R.jumpUp, R.jumpFall, Math.min(1, this.vy / 4));
        case 'block': return this.crouching ? R.blockLo : R.blockHi;
        case 'hit': return this.crouching ? R.hitLow : this.hitPose === 'mid' ? R.hitMid : R.hitHi;
        case 'juggle': case 'thrown': return R.launched;
        case 'down': return R.down;
        case 'getup': return mix(R.down, R.getup, Math.min(1, t / 10));
        case 'win': return R[this.ch.win] || R.win;
        case 'lose': return R.lose;
        case 'intro': return breathe();
        case 'attack': {
          if (m.kind === 'normal') {
            const d = m.def, a = R[d.pose], w = R[d.wind] || R.idle;
            const base = d.crouch ? R.crouch : d.air ? R.jumpFall : R.idle;
            if (m.t <= d.startup) return mix(base, w, m.t / d.startup);
            if (m.t <= d.startup + d.active) return a;
            return mix(a, base, (m.t - d.startup - d.active) / d.recovery);
          }
          if (m.kind === 'throw') return m.t < 8 ? R.grab : m.style === 'toss' ? R.toss : R.slam;
          const fn = m.kind === 'super' ? SUPERS[m.sp.type] : SPECIALS[m.sp.type];
          return fn.pose(this, m);
        }
      }
      return R.idle;
    }

    draw(ctx, sx) {
      if (this.hidden) return;
      const X = sx(this.x), Y = SM.FLOOR + this.y;
      // sombra
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#000';
      const k = Math.max(0.4, 1 + this.y / 160);
      ctx.beginPath(); ctx.ellipse(X, SM.FLOOR, 18 * k * this.s, 4 * k, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      const flash = this.flash > 0 && this.flash % 2 ? '#ffffff' : null;
      SM.Rig.draw(ctx, this.ch, this.pose(), X, Y, this.face * this.drawFlip, { t: this.battle.t, flash });
    }
  }

  // ---------- arquétipos de especiais ----------
  // cada um: start?(f, m), update(f, m), box?(f, m) -> caixa de ataque, pose(f, m)
  const hitInfo = (f, m, dmg, extra = {}) => Object.assign({
    dmg: dmg * f.ch.stats.power * (m.heavy ? 1.15 : 1), hitstun: 24, blockstun: 18, push: 3, level: 'mid',
    chip: true, kind: 'special', color: m.sp.color,
  }, extra);

  const recover = (f, m, from, total) => { if (m.t >= total) f.toNeutral(); };
  const trail = (f, color) => {
    const p = SM.Rig.point(f.ch, f.pose(), f.x, f.y, f.face, 'handF');
    SM.FX.trail(p[0], p[1] - SM.FLOOR, color, 7);
  };

  const SPECIALS = {
    projectile: {
      update(f, m) {
        if (m.t === 10) {
          const sp = m.sp;
          const hand = SM.Rig.point(f.ch, R.proj, f.x, f.y, f.face, 'handF');
          f.battle.spawn({
            owner: f, x: hand[0] + f.face * 6, y: Math.min(-50, hand[1] - SM.FLOOR), vx: f.face * sp.speed * (m.heavy ? 1.25 : 1), dir: f.face,
            fx: sp.fx, color: sp.color, size: sp.size || 1, w: 22 * (sp.size || 1), h: 20 * (sp.size || 1),
            info: hitInfo(f, m, sp.dmg, { level: 'mid', push: 3.5 }),
          });
          SM.Audio.sfx('fireball');
        }
        recover(f, m, 0, m.heavy ? 44 : 40);
      },
      pose(f, m) {
        const kick = m.sp.kick;
        if (kick) return m.t < 8 ? R.hkWind : m.t < 24 ? (m.sp.fx === 'ball' ? R.shoot : R.hk) : mix(R.hk, R.idle, (m.t - 24) / 16);
        return m.t < 9 ? mix(R.idle, R.projWind, m.t / 9) : m.t < 30 ? R.proj : mix(R.proj, R.idle, (m.t - 30) / 12);
      },
    },

    rising: {
      start(f, m) { f.invuln = 8; },
      update(f, m) {
        if (m.t === 4) { f.vy = -m.sp.height * (m.heavy ? 1.08 : 1); f.vx = f.face * 1.6; f.y = -1; }
        if (m.t >= 4 && !m.landed) {
          f.vy += SM.GRAVITY; f.x += f.vx; f.y += f.vy;
          if (f.vy < 0) trail(f, m.sp.color);
          if (f.y >= 0) { f.y = 0; f.vy = 0; f.vx = 0; m.landed = m.t; SM.FX.dust(f.x, 5); }
        }
        if (m.cd > 0) m.cd--;
        if (m.landed && m.t - m.landed > 14) f.toNeutral();
      },
      box(f, m) {
        const max = m.heavy ? 2 : 1;
        if (m.t < 3 || f.vy > 1 || m.hits >= max || m.cd > 0 || m.landed) return null;
        const last = m.hits + 1 >= max;
        return f.box([-2, -128, 34, 80], hitInfo(f, m, m.sp.dmg / max, { kd: last, launch: true, push: 1.5, level: 'mid', kind: 'heavy', multi: true }));
      },
      pose(f, m) {
        const p = R[m.sp.pose] || R.rise;
        if (m.t < 4) return mix(R.squat, p, m.t / 4);
        if (m.landed) return R.squat;
        return f.vy < 1 ? p : R.jumpFall;
      },
    },

    rush: {
      update(f, m) {
        const sp = m.sp, dur = sp.dur || 16;
        if (m.t > 6 && m.t <= 6 + dur && !m.stop) {
          f.vx = f.face * sp.speed * (m.heavy ? 1.1 : 1);
          if (m.t % 2 === 0) trail(f, sp.color);
        } else f.vx *= 0.75;
        f.x += f.vx;
        if (m.cd > 0) m.cd--;
        recover(f, m, 0, 6 + dur + 16);
      },
      box(f, m) {
        const sp = m.sp, max = sp.hits || 1;
        if (m.t <= 6 || m.t > 6 + (sp.dur || 16) || m.hits >= max || m.cd > 0) return null;
        const last = m.hits + 1 >= max;
        const b = sp.low ? [8, -22, 40, 22] : [8, -92, 36, 56];
        return f.box(b, hitInfo(f, m, sp.dmg / max, { kd: last, level: sp.low ? 'low' : 'mid', push: last ? 4 : 1, multi: max > 1, onHit: () => { if (last) m.stop = true; m.cd = 5; } }));
      },
      pose(f, m) {
        const p = R[m.sp.pose] || R.rush;
        if (m.t <= 6) return mix(R.idle, R.squat, m.t / 6);
        if (m.t <= 6 + (m.sp.dur || 16)) {
          if ((m.sp.hits || 1) > 1 && m.sp.pose === 'rush') return Math.floor(m.t / 4) % 2 ? R.rush : R.rush2;
          return p;
        }
        return mix(p, R.idle, (m.t - 6 - (m.sp.dur || 16)) / 16);
      },
    },

    spin: {
      update(f, m) {
        const sp = m.sp;
        if (m.t > 6 && m.t <= 36) {
          f.y = Math.max(-22, f.y - 4);
          f.vx = f.face * sp.speed;
          f.x += f.vx;
          f.drawFlip = Math.floor(m.t / 4) % 2 ? -1 : 1;
          if (m.t % 3 === 0) SM.FX.trail(f.x, f.y - 50, sp.color, 10);
        } else if (m.t > 36) {
          f.drawFlip = 1;
          f.vy += SM.GRAVITY; f.y += f.vy; f.vx *= 0.8; f.x += f.vx;
          if (f.y >= 0) { f.y = 0; f.vy = 0; m.landed = m.landed || m.t; }
        }
        if (m.cd > 0) m.cd--;
        if (m.landed && m.t - m.landed > 10) f.toNeutral();
      },
      box(f, m) {
        const max = m.sp.hits || 3;
        if (m.t <= 6 || m.t > 36 || m.hits >= max || m.cd > 0) return null;
        const last = m.hits + 1 >= max;
        return f.box([-34, -104, 74, 40], hitInfo(f, m, m.sp.dmg / max, { kd: last, multi: true, push: last ? 4 : 1.2, level: 'high', onHit: () => { m.cd = 7; } }));
      },
      pose(f, m) { return m.t <= 6 ? mix(R.idle, R.hkWind, m.t / 6) : m.t <= 36 ? R.spin : f.y < 0 ? R.jumpFall : R.squat; },
    },

    dive: {
      update(f, m) {
        if (m.t === 8) { f.vy = -7.5; f.vx = f.face * 3.2; f.y = -1; }
        if (m.t > 8 && !m.landed) {
          if (f.vy >= 0 && !m.diving) { m.diving = true; f.vy = 6.5; f.vx = f.face * 4.6; }
          if (!m.diving) f.vy += SM.GRAVITY;
          f.x += f.vx; f.y += f.vy;
          if (m.diving) SM.FX.trail(f.x + f.face * 14, f.y - 20, m.sp.color, 9);
          if (f.y >= 0) { f.y = 0; f.vy = 0; f.vx = 0; m.landed = m.t; SM.FX.dust(f.x, 8, true); f.battle.shake(3); }
        }
        if (m.landed && m.t - m.landed > 14) f.toNeutral();
      },
      box(f, m) {
        if (!m.diving || m.hits || m.landed) return null;
        return f.box([6, -44, 32, 36], hitInfo(f, m, m.sp.dmg, { kd: true, level: 'overhead', onHit: () => { f.vy = -4; f.vx = -f.face * 2; m.diving = false; } }));
      },
      pose(f, m) { return m.t < 8 ? R.squat : m.landed ? R.squat : m.diving ? R.dive : R.jumpUp; },
    },

    cmdGrab: {
      update(f, m) {
        if (m.grab) { f.updateThrow(m.grab); return; }
        const o = f.opp;
        if (m.t >= 5 && m.t <= 8 && Math.abs(o.x - f.x) < m.sp.range * f.s && !o.airborne && !o.invuln &&
            !['down', 'getup', 'thrown', 'juggle'].includes(o.state)) {
          m.grab = { kind: 'throw', t: 0, dmg: m.sp.dmg * f.ch.stats.power * (m.heavy ? 1.1 : 1), style: 'slam' };
          o.setState('thrown'); o.move = null;
          SM.Audio.sfx('throw');
          f.battle.callout(f, m.sp.name);
          return;
        }
        recover(f, m, 0, 34);
      },
      pose(f, m) {
        if (m.grab) return m.grab.t < 8 ? R.cmdGrab : R.slam;
        return m.t < 5 ? mix(R.idle, R.cmdGrab, m.t / 5) : m.t < 12 ? R.cmdGrab : mix(R.cmdGrab, R.idle, (m.t - 12) / 22);
      },
    },

    counter: {
      update(f, m) {
        f.countering = m.t >= 3 && m.t <= 26 && !m.done;
        if (m.done) {
          f.x += f.vx; f.vx *= 0.8;
          if (m.t - m.done > 26) f.toNeutral();
          return;
        }
        recover(f, m, 0, 40);
      },
      // chamado pela batalha quando um golpe acerta durante a postura
      trigger(f, m, attacker) {
        m.done = m.t;
        f.countering = false;
        f.invuln = 30;
        // aparece atrás e contra-ataca
        f.x = attacker.x - attacker.face * 30;
        f.face = attacker.x > f.x ? 1 : -1;
        f.battle.callout(f, m.sp.name + '!');
        f.battle.damage(f, attacker, m.sp.dmg * f.ch.stats.power, {});
        attacker.move = null;
        attacker.setState('juggle');
        attacker.vy = -5; attacker.vx = f.face * 3; attacker.y = Math.min(attacker.y, -1);
        f.battle.hitFx(attacker.x, attacker.y - 50, 'heavy', m.sp.color);
        SM.Audio.sfx('hitH');
      },
      pose(f, m) { return m.done ? (m.t - m.done < 14 ? R.hp : R.idle) : m.t < 3 ? mix(R.idle, R.counter, m.t / 3) : m.t < 30 ? R.counter : mix(R.counter, R.idle, (m.t - 30) / 10); },
    },

    teleport: {
      update(f, m) {
        const o = f.opp;
        if (m.t === 2) { f.hidden = true; f.invuln = 14; for (let i = 0; i < 8; i++) SM.FX.trail(f.x, -20 - i * 10, m.sp.color, 10); }
        if (m.t === 12) {
          const cam = f.battle.bounds();
          // forte: aparece atrás do adversário; fraco: mesmo à frente dele
          let nx = o.x + (f.x < o.x ? 44 : -44) * (m.heavy ? 1 : -1);
          if (nx < cam.left || nx > cam.right) nx = o.x + (f.x < o.x ? -70 : 70);
          f.x = SM.clamp(nx, cam.left, cam.right);
          f.hidden = false;
          f.faceOpp();
          for (let i = 0; i < 8; i++) SM.FX.trail(f.x, -20 - i * 10, m.sp.color, 10);
        }
        recover(f, m, 0, 24);
      },
      pose(f, m) { return m.t < 12 ? R.squat : mix(R.squat, R.idle, (m.t - 12) / 12); },
    },

    zap: {
      update(f, m) {
        if (m.t >= 6 && m.t <= 30 && m.t % 3 === 0) {
          const x = f.x + f.face * (14 + Math.random() * m.sp.range);
          SM.FX.trail(x, -40 - Math.random() * 50, m.sp.color, 5);
          if (m.t % 6 === 0) SM.Audio.sfx('zap');
        }
        if (m.cd > 0) m.cd--;
        recover(f, m, 0, 44);
      },
      box(f, m) {
        const max = m.sp.hits || 4;
        if (m.t < 6 || m.t > 30 || m.hits >= max || m.cd > 0) return null;
        return f.box([10, -100, m.sp.range, 92], hitInfo(f, m, m.sp.dmg / max, { multi: true, kd: m.hits + 1 >= max, push: 1.4, onHit: () => { m.cd = 6; } }));
      },
      pose(f, m) { return m.t < 6 ? mix(R.idle, R.charge, m.t / 6) : m.t <= 30 ? (m.t % 4 < 2 ? R.proj : R.charge) : mix(R.proj, R.idle, (m.t - 30) / 14); },
    },

    quake: {
      update(f, m) {
        if (m.t === 12) {
          f.battle.spawn({
            owner: f, x: f.x + f.face * 26, y: -8, vx: f.face * m.sp.speed * (m.heavy ? 1.2 : 1), dir: f.face, fx: 'quake', color: m.sp.color,
            w: 24, h: 16, info: hitInfo(f, m, m.sp.dmg, { level: 'low', push: 3 }),
          });
          SM.FX.dust(f.x + f.face * 20, 12, true);
          f.battle.shake(5);
          SM.Audio.sfx('fall');
        }
        recover(f, m, 0, 38);
      },
      pose(f, m) { return m.t < 8 ? mix(R.idle, R.jumpUp, m.t / 8) : m.t < 24 ? R.slam : mix(R.slam, R.idle, (m.t - 24) / 14); },
    },
  };

  // ---------- supers ----------
  const superInfo = (f, m, dmg, extra = {}) => Object.assign({
    dmg: dmg * f.ch.stats.power, hitstun: 30, blockstun: 20, push: 1.2, level: 'mid', chip: true, kind: 'super', color: m.sp.color,
  }, extra);

  const SUPERS = {
    beam: {
      update(f, m) {
        if (m.t === 12) {
          const hand = SM.Rig.point(f.ch, R.proj, f.x, f.y, f.face, 'handF');
          m.beam = f.battle.spawn({
            owner: f, beam: true, x0: hand[0], x: hand[0], y: hand[1] - SM.FLOOR, dir: f.face, fx: 'beam', color: m.sp.color, h: 30,
            life: 54, hitEvery: 5, maxHits: 10,
            info: superInfo(f, m, m.sp.dmg / 10, { multi: true, push: 0.6 }),
          });
          f.battle.shake(6);
        }
        recover(f, m, 0, 84);
      },
      pose(f, m) { return m.t < 12 ? mix(R.projWind, R.proj, m.t / 12) : m.t < 66 ? R.proj : mix(R.proj, R.idle, (m.t - 66) / 18); },
    },

    barrage: {
      update(f, m) {
        const o = f.opp;
        if (m.lock) {
          const k = m.t - m.lock;
          o.x = f.x + f.face * 34;
          o.stun = 99;
          if (k % 6 === 0 && k <= 54) {
            const last = k === 54;
            const info = superInfo(f, m, m.sp.dmg / 10, { push: 0, kind: last ? 'super' : 'heavy', unblockable: true });
            f.battle.damage(f, o, info.dmg, { super: true });
            f.battle.hitFx(o.x - f.face * 6, -50 - Math.random() * 30, last ? 'super' : 'heavy', m.sp.color);
            SM.Audio.sfx('hitH');
            if (last) {
              o.setState('juggle'); o.vy = -8; o.vx = f.face * 3.5; o.y = -1;
              f.battle.shake(10);
            }
          }
          if (k > 80) f.toNeutral();
          return;
        }
        if (m.t > 4 && m.t <= 26) { f.vx = f.face * 9; f.x += f.vx; if (m.t % 2 === 0) SM.FX.trail(f.x, -60, m.sp.color, 12); }
        else f.vx *= 0.7;
        if (m.t > 4 && m.t <= 26 && Math.abs(o.x - f.x) < 44 && !o.invuln && !['down', 'getup'].includes(o.state)) {
          const blocked = f.battle.wouldBlock(o, f, 'mid');
          if (blocked) { f.battle.hitFighter(f, o, superInfo(f, m, 30, { push: 4 })); m.t = 27; return; }
          m.lock = m.t;
          o.setState('hit'); o.stun = 99; o.y = 0; o.move = null;
          f.battle.callout(f, m.sp.name + '!');
          return;
        }
        recover(f, m, 0, 56);
      },
      pose(f, m) {
        const kicks = m.sp.kicks || f.ch.id === 'dave';
        if (m.lock) {
          const k = m.t - m.lock;
          if (k >= 50) return kicks ? R.hk : R.chp;
          const seq = kicks ? [R.lk, R.hk, R.spin, R.lk] : [R.rush, R.rush2, R.lp, R.hp];
          return seq[Math.floor(k / 6) % seq.length];
        }
        return m.t <= 26 ? R.rush : mix(R.rush, R.idle, (m.t - 26) / 30);
      },
    },

    sky: {
      update(f, m) {
        if (m.t === 18) {
          const o = f.opp;
          f.battle.spawn({
            owner: f, column: true, x: o.x, y: -60, w: 46, h: 140, fx: 'none', color: m.sp.color, life: 40, hitEvery: 7, maxHits: 5, dir: f.face,
            meteor: m.sp.meteor,
            info: superInfo(f, m, m.sp.dmg / 5, { multi: true, push: 0.4 }),
          });
        }
        recover(f, m, 0, 40);
      },
      pose(f, m) { return m.t < 40 ? R.win : R.idle; },
    },

    megaGrab: {
      update(f, m) {
        const o = f.opp;
        if (m.grab) { f.updateThrow(m.grab); return; }
        if (m.t > 2 && m.t <= 32) { f.vx = f.face * 6; f.x += f.vx; if (m.t % 3 === 0) SM.FX.dust(f.x, 2); }
        if (m.t > 2 && m.t <= 32 && Math.abs(o.x - f.x) < 46 && !o.airborne && !o.invuln && !['down', 'getup', 'thrown'].includes(o.state)) {
          m.grab = { kind: 'throw', t: 0, dmg: m.sp.dmg * f.ch.stats.power, style: 'mega' };
          o.setState('thrown'); o.move = null;
          f.battle.callout(f, m.sp.name + '!');
          return;
        }
        recover(f, m, 0, 60);
      },
      pose(f, m) { if (m.grab) return m.grab.t < 10 ? R.cmdGrab : R.slam; return m.t <= 32 ? R.cmdGrab : mix(R.cmdGrab, R.idle, (m.t - 32) / 28); },
    },
  };

  Fighter.SPECIALS = SPECIALS;
  Fighter.SUPERS = SUPERS;
  return Fighter;
})();
