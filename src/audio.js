'use strict';
// Som chiptune gerado com WebAudio: efeitos de luta e músicas originais em loop. Sem ficheiros.

SM.Audio = (() => {
  let ac = null, master = null, musicBus = null, muted = false, seq = null, current = null;
  const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.3;
      master.connect(ac.destination);
      musicBus = ac.createGain();
      musicBus.gain.value = 0.35;
      musicBus.connect(master);
      if (pending) { const p = pending; pending = null; music(p); }
    } catch {
      ac = null;
    }
  }
  let pending = null;

  function tone(freq, dur, { type = 'square', vol = 0.3, slide = 0, delay = 0, bus = null } = {}) {
    if (!ac) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(bus || master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, vol = 0.3, delay = 0, hp = 0) {
    if (!ac) return;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ac.createBufferSource(), g = ac.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    let node = src;
    if (hp) {
      const f = ac.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp;
      src.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(master);
    src.start(ac.currentTime + delay);
  }

  const arp = (notes, step, opt) => notes.forEach((f, i) => tone(f, step * 1.6, { ...opt, delay: i * step }));

  const SFX = {
    whiffL: () => noise(0.06, 0.12, 0, 2500),
    whiffH: () => noise(0.12, 0.18, 0, 1200),
    hitL: () => { tone(220, 0.08, { slide: 90, vol: 0.25 }); noise(0.06, 0.3); },
    hitH: () => { tone(140, 0.18, { slide: 45, vol: 0.4 }); noise(0.14, 0.45); },
    block: () => { tone(900, 0.04, { type: 'triangle', vol: 0.2 }); noise(0.04, 0.2, 0, 3000); },
    jump: () => tone(200, 0.1, { slide: 320, vol: 0.08, type: 'triangle' }),
    land: () => noise(0.05, 0.12),
    fall: () => { tone(90, 0.25, { slide: 40, vol: 0.35, type: 'triangle' }); noise(0.2, 0.35); },
    special: () => tone(180, 0.3, { type: 'sawtooth', slide: 700, vol: 0.12 }),
    fireball: () => { tone(300, 0.35, { type: 'sawtooth', slide: 90, vol: 0.12 }); noise(0.3, 0.15, 0, 600); },
    zap: () => { for (let i = 0; i < 5; i++) tone(800 + Math.random() * 1200, 0.05, { type: 'square', vol: 0.08, delay: i * 0.03 }); },
    super: () => { arp([262, 330, 392, 523, 659, 784, 1047], 0.05, { type: 'sawtooth', vol: 0.12 }); noise(0.6, 0.2, 0.3); },
    throw: () => { tone(160, 0.12, { slide: 80, vol: 0.3 }); noise(0.1, 0.3, 0.1); },
    ko: () => { arp([523, 392, 330, 262, 196, 131], 0.09, { vol: 0.22 }); noise(0.6, 0.35); },
    select: () => tone(880, 0.05, { vol: 0.15 }),
    confirm: () => arp([660, 990], 0.06, { vol: 0.18 }),
    back: () => tone(330, 0.08, { vol: 0.15, slide: 220 }),
    round: () => arp([392, 523], 0.12, { vol: 0.2 }),
    fight: () => [523, 659, 784, 1047].forEach((f) => tone(f, 0.5, { vol: 0.12 })),
    win: () => arp([523, 523, 523, 659, 784, 1047], 0.1, { vol: 0.18 }),
    tick: () => tone(1200, 0.03, { vol: 0.08 }),
  };

  // músicas: 32 colcheias por ciclo; 0 = pausa; números = notas MIDI
  const TRACKS = {
    menu: { bpm: 112, lead: [69, 0, 72, 0, 76, 0, 74, 72, 69, 0, 67, 0, 69, 0, 0, 0, 65, 0, 69, 0, 72, 0, 71, 69, 67, 0, 64, 0, 67, 0, 0, 0], bass: [45, 0, 45, 0, 52, 0, 52, 0, 43, 0, 43, 0, 50, 0, 50, 0, 41, 0, 41, 0, 48, 0, 48, 0, 40, 0, 40, 0, 47, 0, 47, 0] },
    select: { bpm: 140, lead: [76, 0, 76, 74, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 71, 0, 72, 0, 72, 71, 72, 0, 76, 0, 74, 0, 72, 0, 71, 0, 67, 0], bass: [40, 40, 0, 40, 47, 0, 40, 0, 45, 45, 0, 45, 52, 0, 45, 0, 41, 41, 0, 41, 48, 0, 41, 0, 43, 43, 0, 43, 50, 0, 43, 0] },
    bairro: { bpm: 156, lead: [64, 67, 69, 0, 67, 64, 62, 0, 64, 67, 71, 0, 69, 67, 64, 0, 60, 64, 67, 0, 69, 67, 64, 62, 64, 0, 62, 0, 59, 0, 0, 0], bass: [40, 0, 52, 0, 40, 0, 52, 0, 43, 0, 55, 0, 43, 0, 55, 0, 36, 0, 48, 0, 36, 0, 48, 0, 38, 0, 50, 0, 35, 0, 47, 0] },
    praia: { bpm: 128, lead: [72, 0, 74, 76, 0, 79, 0, 76, 74, 0, 72, 0, 69, 0, 72, 0, 74, 0, 76, 77, 0, 76, 0, 74, 72, 0, 0, 74, 72, 0, 0, 0], bass: [48, 0, 55, 0, 48, 0, 55, 0, 45, 0, 52, 0, 45, 0, 52, 0, 41, 0, 48, 0, 41, 0, 48, 0, 43, 0, 50, 0, 43, 0, 47, 0] },
    telhados: { bpm: 150, lead: [69, 0, 72, 74, 76, 0, 74, 72, 74, 0, 72, 69, 67, 0, 69, 0, 65, 0, 69, 72, 74, 0, 72, 69, 68, 0, 71, 0, 76, 0, 0, 0], bass: [45, 45, 0, 45, 45, 0, 45, 0, 43, 43, 0, 43, 43, 0, 43, 0, 41, 41, 0, 41, 41, 0, 41, 0, 40, 40, 0, 40, 44, 0, 47, 0] },
    metro: { bpm: 164, lead: [62, 0, 65, 0, 69, 0, 72, 0, 70, 0, 69, 0, 65, 0, 62, 0, 60, 0, 64, 0, 67, 0, 70, 0, 69, 0, 0, 0, 57, 0, 0, 0], bass: [38, 38, 50, 38, 38, 50, 38, 50, 34, 34, 46, 34, 34, 46, 34, 46, 36, 36, 48, 36, 36, 48, 36, 48, 33, 33, 45, 33, 37, 49, 40, 52] },
    victory: { bpm: 120, lead: [72, 76, 79, 84, 0, 79, 84, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: [48, 0, 0, 0, 55, 0, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], once: true },
  };

  function music(name) {
    if (current === name) return;
    if (!ac) { pending = name; return; }
    stopMusic();
    const tr = TRACKS[name];
    if (!tr) return;
    current = name;
    const step = 60 / tr.bpm / 2;
    let i = 0, next = ac.currentTime + 0.05;
    seq = setInterval(() => {
      while (next < ac.currentTime + 0.2) {
        if (tr.once && i >= tr.lead.length) { clearInterval(seq); return; }
        const n = tr.lead[i % tr.lead.length], b = tr.bass[i % tr.bass.length];
        const delay = Math.max(0, next - ac.currentTime);
        if (n) tone(NOTE(n), step * 0.9, { vol: 0.1, delay, bus: musicBus });
        if (b) tone(NOTE(b), step * 0.9, { type: 'triangle', vol: 0.28, delay, bus: musicBus });
        // bateria simples nos tempos
        if (!tr.once && i % 4 === 0) noise(0.04, 0.08, delay);
        next += step;
        i++;
      }
    }, 50);
  }

  function stopMusic() {
    clearInterval(seq);
    seq = null;
    current = null;
  }

  return {
    init,
    sfx: (name) => SFX[name] && SFX[name](),
    music,
    stopMusic,
    toggleMute: () => { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.3; return muted; },
    get muted() { return muted; },
  };
})();
