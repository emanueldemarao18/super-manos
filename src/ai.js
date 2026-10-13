'use strict';
// Adversário controlado pelo computador. Lê o estado do jogo com um atraso de reação (consoante a
// dificuldade), decide o que fazer e "carrega nos botões" como um jogador, incluindo as
// sequências de especiais. Nunca lê os comandos do jogador diretamente.

SM.AI = (() => {
  const B = SM.BTN;
  const LEVELS = [
    { name: 'FÁCIL', react: 22, block: 0.2, anti: 0.15, combo: 0.15, aggro: 0.35, special: 0.25 },
    { name: 'NORMAL', react: 14, block: 0.45, anti: 0.4, combo: 0.45, aggro: 0.5, special: 0.45 },
    { name: 'DIFÍCIL', react: 9, block: 0.7, anti: 0.7, combo: 0.75, aggro: 0.6, special: 0.6 },
    { name: 'MESTRE', react: 5, block: 0.88, anti: 0.88, combo: 0.92, aggro: 0.7, special: 0.7 },
  ];

  // converte notação numérica (relativa à frente) em bits
  const dirBits = (n, face) => {
    let b = 0;
    if (n >= 7) b |= B.up;
    if (n <= 3) b |= B.down;
    const fx = n % 3 === 0 ? 1 : n % 3 === 1 ? -1 : 0;
    const x = fx * face;
    if (x > 0) b |= B.right;
    if (x < 0) b |= B.left;
    return b;
  };

  class CPU {
    constructor(level = 1) {
      this.L = LEVELS[SM.clamp(level, 0, 3)];
      this.queue = []; // [{dir, btn}] um por frame
      this.prev = 0;
      this.hist = [];
      this.wait = 0;
      this.holdDir = 5;
      this.holdT = 0;
    }

    // fotografia do adversário com atraso (reação humana)
    snap(f) {
      const o = f.opp;
      this.hist.push({
        x: o.x, y: o.y, vy: o.vy, state: o.state, attacking: o.state === 'attack', recovering: o.state === 'attack' && o.move && o.move.kind === 'normal' && o.move.t > o.move.def.startup + o.move.def.active,
        low: o.state === 'attack' && o.move && o.move.def && o.move.def.level === 'low',
        air: o.airborne, down: o.state === 'down' || o.state === 'getup',
      });
      if (this.hist.length > 40) this.hist.shift();
      return this.hist[Math.max(0, this.hist.length - 1 - this.L.react)];
    }

    seq(dirs, btn, face) { dirs.split('').forEach((d, i) => this.queue.push({ dir: +d, btn: i === dirs.length - 1 ? btn : 0 })); }
    press(btn, dir = 5, n = 1) { for (let i = 0; i < n; i++) this.queue.push({ dir, btn: i === 0 ? btn : 0 }); }
    idle(n, dir = 5) { for (let i = 0; i < n; i++) this.queue.push({ dir, btn: 0 }); }

    special(f, cmd) {
      const sp = f.ch.specials.find((s) => s.cmd === cmd);
      if (!sp) return false;
      if (sp.type === 'projectile' && f.battle.projectiles.some((p) => p.owner === f)) return false;
      const btn = sp.btn === 'p' ? (Math.random() < 0.5 ? B.lp : B.hp) : (Math.random() < 0.5 ? B.lk : B.hk);
      this.seq(cmd, btn);
      return true;
    }
    hasSpecial(f, type) { const s = f.ch.specials.find((x) => x.type === type); return s ? s.cmd : null; }

    decide(f, s) {
      const L = this.L, o = f.opp;
      const dist = Math.abs(o.x - f.x);
      const r = Math.random;
      const bt = f.battle;

      // projéteis a chegar
      const proj = bt.projectiles.find((p) => p.owner !== f && Math.sign(f.x - p.x) === Math.sign(p.vx || p.dir) && Math.abs(p.x - f.x) < 110);
      if (proj && !proj.beam && !proj.column) {
        if (r() < L.block * 0.5) { this.idle(16, proj.info.level === 'low' ? 7 : 4); return; } // salta / defende
        if (r() < L.block) { this.idle(18, proj.info.level === 'low' ? 1 : 4); return; }
      }
      if (proj && (proj.beam || proj.column) && r() < L.block) { this.idle(20, 4); return; }

      // saltou para cima de nós: anti-aéreo
      if (s.air && s.vy > -2 && dist < 90 && r() < L.anti) {
        const rise = this.hasSpecial(f, 'rising');
        if (rise && r() < 0.6) this.special(f, rise);
        else this.press(B.hp, 2, 6);
        return;
      }
      // ataque a chegar: defender
      if (s.attacking && !s.recovering && dist < 110 && r() < L.block) {
        const counter = this.hasSpecial(f, 'counter');
        if (counter && r() < 0.3) { this.special(f, counter); return; }
        this.idle(14 + (r() * 8 | 0), s.low ? 1 : 4);
        return;
      }

      // adversário a recuperar de um golpe falhado: castigar
      if (s.recovering && dist < 70 && r() < L.combo) { this.combo(f); return; }

      // super com a barra cheia
      if (f.meter >= SM.METER_MAX && r() < 0.3) {
        const t = f.ch.super.type;
        if ((t === 'beam' || t === 'sky') || dist < 90) { this.seq('236236', B.hp); return; }
      }

      if (dist > 170) {
        const proj2 = this.hasSpecial(f, 'projectile');
        if (proj2 && r() < L.special) { this.special(f, proj2); this.idle(10); return; }
        if (r() < 0.15) { this.idle(1, 9); this.idle(6); this.airAttack = true; return; }
        this.idle(18 + (r() * 14 | 0), 6);
        return;
      }
      if (dist > 70) {
        const x = r();
        if (x < L.aggro * 0.35) { this.idle(1, 9); this.airAttack = true; this.idle(10); return; } // salto para a frente
        if (x < L.aggro * 0.6) {
          // qualquer especial que faça sentido a meia distância
          const pool = f.ch.specials.filter((x) => !['counter', 'cmdGrab', 'rising'].includes(x.type));
          const sp = pool[r() * pool.length | 0];
          if (sp && r() < L.special) { this.special(f, sp.cmd); this.idle(12); return; }
        }
        if (x < L.aggro) { this.press(r() < 0.5 ? B.lk : B.hk, r() < 0.4 ? 2 : 5, 3); this.idle(8); return; }
        if (x < L.aggro + 0.15) { this.idle(16, 4); return; }
        this.idle(14 + (r() * 10 | 0), 6);
        return;
      }
      // perto
      const x = r();
      if (x < 0.12) { this.press(B.lp | B.lk); this.idle(10); return; } // agarrão
      if (x < 0.12 + L.combo * 0.6) { this.combo(f); return; }
      if (x < 0.75) {
        const opts = [[B.lp, 5], [B.lk, 2], [B.hp, 5], [B.hk, 2], [B.lk, 5]];
        const [b, d] = opts[r() * opts.length | 0];
        this.press(b, d, 3);
        this.idle(10);
        return;
      }
      const g = this.hasSpecial(f, 'cmdGrab');
      if (g && r() < 0.5) { this.special(f, g); return; }
      this.idle(12, r() < 0.5 ? 4 : 1);
    }

    // golpe leve → leve → especial (cancelamento), com tempo certo para encadear
    combo(f) {
      const L = this.L;
      const low = Math.random() < 0.5;
      this.press(low ? B.lk : B.lp, low ? 2 : 5, 6);
      if (Math.random() < L.combo) this.press(B.lp, low ? 2 : 5, 6);
      const cmd = this.hasSpecial(f, 'rush') || this.hasSpecial(f, 'rising') || this.hasSpecial(f, 'spin') || this.hasSpecial(f, 'projectile');
      if (cmd && Math.random() < L.combo) this.special(f, cmd);
      else this.press(B.hk, 2, 4);
      this.idle(12);
    }

    read(battle, f) {
      const s = this.snap(f);
      // no ar: ataca a descer
      if (f.state === 'air') {
        if (this.airAttack && f.vy > 0 && Math.abs(f.opp.x - f.x) < 80) { this.airAttack = false; this.queue = [{ dir: 5, btn: Math.random() < 0.5 ? B.hk : B.hp }]; }
      }
      const busy = !['stand', 'walk', 'crouch', 'land', 'air'].includes(f.state);
      if (!this.queue.length && !busy) this.decide(f, s);
      // se fomos atingidos, esquece o plano
      if (['hit', 'juggle', 'down', 'thrown', 'block'].includes(f.state) && this.queue.length && !this.queue.some((q) => q.btn)) this.queue = [];
      const step = this.queue.shift() || { dir: busy && f.state === 'block' ? 4 : 5, btn: 0 };
      const held = dirBits(step.dir, f.face) | step.btn;
      const pressed = held & ~this.prev;
      this.prev = held & ~(B.lp | B.hp | B.lk | B.hk); // botões são toques, direções ficam presas
      return { held, pressed: pressed | step.btn };
    }
  }

  return { CPU, LEVELS };
})();

// controlador humano: lê o jogador `index` do SM.Input
SM.Human = class {
  constructor(index) { this.i = index; }
  read() { return { held: SM.Input.held(this.i), pressed: SM.Input.pressed(this.i) }; }
};
