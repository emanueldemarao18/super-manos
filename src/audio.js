'use strict';
// Som chiptune gerado com WebAudio: efeitos e músicas originais em loop. Nada de ficheiros.

SM.Audio = (() => {
  let ac = null, master = null, musicBus = null, muted = false, seq = null, current = null;
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);

  function init() {
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = 0.25;
      master.connect(ac.destination);
      musicBus = ac.createGain();
      musicBus.gain.value = 0.45;
      musicBus.connect(master);
    } catch {
      ac = null;
    }
  }

  function tone(freq, dur, { type = 'square', vol = 0.3, slide = 0, delay = 0, bus = null } = {}) {
    if (!ac || muted) return;
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

  function noise(dur, vol = 0.3, delay = 0) {
    if (!ac || muted) return;
    const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(), g = ac.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(g);
    g.connect(master);
    src.start(ac.currentTime + delay);
  }

  const arp = (notes, step, opt) => notes.forEach((f, i) => tone(f, step * 1.6, { ...opt, delay: i * step }));

  const SFX = {
    swing: () => noise(0.05, 0.08),
    whoosh: () => noise(0.14, 0.12),
    hit: () => { tone(180, 0.1, { slide: 60, vol: 0.3 }); noise(0.08, 0.25); },
    hitBig: () => { tone(120, 0.22, { slide: 40, vol: 0.35 }); noise(0.16, 0.35); },
    block: () => { tone(1200, 0.05, { type: 'triangle', vol: 0.2 }); tone(900, 0.08, { type: 'triangle', vol: 0.15, delay: 0.03 }); },
    grab: () => tone(220, 0.08, { type: 'triangle', vol: 0.3 }),
    jump: () => tone(300, 0.12, { slide: 520, vol: 0.12 }),
    land: () => noise(0.05, 0.1),
    jutsu: () => tone(200, 0.35, { type: 'sawtooth', slide: 800, vol: 0.12 }),
    ult: () => { arp([262, 330, 392, 523, 659, 784], 0.06, { type: 'sawtooth', vol: 0.12 }); noise(0.5, 0.15, 0.3); },
    ko: () => { arp([392, 330, 262, 196], 0.09, { vol: 0.2 }); noise(0.4, 0.3); },
    smoke: () => noise(0.25, 0.22),
    charge: () => tone(120, 0.18, { type: 'triangle', slide: 240, vol: 0.12 }),
    beep: () => tone(660, 0.12, { vol: 0.2 }),
    fight: () => [523, 659, 784].forEach(f => tone(f, 0.45, { vol: 0.15 })),
    select: () => tone(880, 0.05, { vol: 0.15 }),
    secret: () => arp([523, 784, 659, 1047, 988, 1319], 0.08, { vol: 0.16 }),
    win: () => arp([523, 523, 523, 659, 784, 1047], 0.1, { vol: 0.16 }),
  };

  // músicas: 32 passos de colcheia; 0 = pausa; números = notas MIDI
  const TRACKS = {
    menu: { bpm: 120, lead: [69, 0, 72, 0, 76, 0, 74, 72, 69, 0, 67, 0, 69, 0, 0, 0, 65, 0, 69, 0, 72, 0, 71, 69, 67, 0, 64, 0, 67, 0, 0, 0], bass: [45, 0, 45, 0, 52, 0, 52, 0, 43, 0, 43, 0, 50, 0, 50, 0, 41, 0, 41, 0, 48, 0, 48, 0, 40, 0, 40, 0, 47, 0, 47, 0] },
    day: { bpm: 160, lead: [64, 67, 69, 0, 67, 64, 62, 0, 64, 67, 71, 0, 69, 67, 64, 0, 60, 64, 67, 0, 69, 67, 64, 62, 64, 0, 62, 0, 59, 0, 0, 0], bass: [40, 0, 52, 0, 40, 0, 52, 0, 43, 0, 55, 0, 43, 0, 55, 0, 36, 0, 48, 0, 36, 0, 48, 0, 38, 0, 50, 0, 35, 0, 47, 0] },
    night: { bpm: 150, lead: [69, 0, 72, 74, 76, 0, 74, 72, 74, 0, 72, 69, 67, 0, 69, 0, 65, 0, 69, 72, 74, 0, 72, 69, 68, 0, 71, 0, 76, 0, 0, 0], bass: [45, 45, 0, 45, 45, 0, 45, 0, 43, 43, 0, 43, 43, 0, 43, 0, 41, 41, 0, 41, 41, 0, 41, 0, 40, 40, 0, 40, 44, 0, 47, 0] },
    valley: { bpm: 132, lead: [62, 0, 65, 0, 69, 0, 72, 0, 70, 0, 69, 0, 65, 0, 62, 0, 60, 0, 64, 0, 67, 0, 70, 0, 69, 0, 0, 0, 57, 0, 0, 0], bass: [38, 0, 0, 0, 45, 0, 0, 0, 46, 0, 0, 0, 41, 0, 0, 0, 36, 0, 0, 0, 43, 0, 0, 0, 45, 0, 0, 0, 33, 0, 0, 0] },
  };

  function music(name) {
    if (!ac || current === name || !TRACKS[name]) return;
    stopMusic();
    current = name;
    const tr = TRACKS[name], step = 60 / tr.bpm / 2;
    let i = 0, next = ac.currentTime + 0.05;
    seq = setInterval(() => {
      while (next < ac.currentTime + 0.2) {
        const n = tr.lead[i % tr.lead.length], b = tr.bass[i % tr.bass.length];
        const delay = next - ac.currentTime;
        if (n) tone(NOTE(n), step * 0.9, { vol: 0.1, delay, bus: musicBus });
        if (b) tone(NOTE(b), step * 0.9, { type: 'triangle', vol: 0.25, delay, bus: musicBus });
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
    sfx: name => SFX[name] && SFX[name](),
    music,
    stopMusic,
    addTrack: (name, tr) => { TRACKS[name] = tr; },
    toggleMute: () => { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.25; return muted; },
  };
})();
