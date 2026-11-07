// Stitch & Style — procedural music & sound effects (Web Audio, no files needed).
'use strict';

const Sound = (() => {
  let ctx = null, master, musicBus, sfxBus, noiseBuf;
  let musicOn = true, sfxOn = true;
  let song = null, timer = null, nextTime = 0, step = 0;

  function init() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
        musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.5 : 0; musicBus.connect(master);
        sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.8 : 0; sfxBus.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
  }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function tone(dest, { f, t, dur = 0.3, type = 'sine', vol = 0.2, a = 0.005, cutoff = 0, detune = 0, glide = 0 }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (cutoff) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cutoff; o.connect(fl); node = fl; }
    node.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dest, { t, dur = 0.1, vol = 0.2, type = 'highpass', f = 2000, q = 1, a = 0.002 }) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  // ---------- SFX ----------
  const SFX = {
    click: t => tone(sfxBus, { f: 900, t, dur: 0.06, type: 'triangle', vol: 0.12 }),
    select: t => { tone(sfxBus, { f: 660, t, dur: 0.08, type: 'triangle', vol: 0.12 }); tone(sfxBus, { f: 990, t: t + 0.05, dur: 0.1, type: 'triangle', vol: 0.1 }); },
    bell: t => [1568, 2093, 3136].forEach((f, i) => { tone(sfxBus, { f, t, dur: 1.2 - i * 0.3, vol: 0.12 / (i + 1) }); tone(sfxBus, { f: f * 1.003, t: t + 0.18, dur: 1 - i * 0.25, vol: 0.08 / (i + 1) }); }),
    door: t => { tone(sfxBus, { f: 110, t, dur: 0.2, type: 'sine', vol: 0.25, glide: 60 }); noise(sfxBus, { t, dur: 0.15, vol: 0.08, type: 'lowpass', f: 500 }); },
    coins: t => [0, 0.07, 0.13, 0.22].forEach((d, i) => { tone(sfxBus, { f: 2200 + i * 300, t: t + d, dur: 0.18, type: 'square', vol: 0.04, cutoff: 5000 }); tone(sfxBus, { f: 3300 + i * 200, t: t + d + 0.02, dur: 0.15, vol: 0.05 }); }),
    snip: t => { noise(sfxBus, { t, dur: 0.05, vol: 0.25, f: 4000 }); noise(sfxBus, { t: t + 0.06, dur: 0.04, vol: 0.18, f: 6000 }); },
    stitch: t => { noise(sfxBus, { t, dur: 0.04, vol: 0.2, type: 'bandpass', f: 1800, q: 3 }); tone(sfxBus, { f: 180, t, dur: 0.05, type: 'square', vol: 0.05, cutoff: 900 }); },
    good: t => { tone(sfxBus, { f: 784, t, dur: 0.12, type: 'triangle', vol: 0.15 }); tone(sfxBus, { f: 1175, t: t + 0.07, dur: 0.18, type: 'triangle', vol: 0.12 }); },
    perfect: t => [784, 988, 1175, 1568].forEach((f, i) => tone(sfxBus, { f, t: t + i * 0.05, dur: 0.2, type: 'triangle', vol: 0.11 })),
    miss: t => tone(sfxBus, { f: 220, t, dur: 0.22, type: 'sawtooth', vol: 0.08, cutoff: 900, glide: 140 }),
    steam: t => { noise(sfxBus, { t, dur: 0.9, vol: 0.18, type: 'bandpass', f: 2500, q: 0.6, a: 0.05 }); noise(sfxBus, { t: t + 0.1, dur: 0.6, vol: 0.1, type: 'highpass', f: 5000, a: 0.05 }); },
    sizzle: t => noise(sfxBus, { t, dur: 0.5, vol: 0.2, type: 'highpass', f: 7000 }),
    page: t => { noise(sfxBus, { t, dur: 0.18, vol: 0.12, type: 'bandpass', f: 1200, q: 0.8, a: 0.04 }); },
    success: t => [523, 659, 784, 1047].forEach((f, i) => { tone(sfxBus, { f, t: t + i * 0.09, dur: 0.35, type: 'triangle', vol: 0.13 }); }),
    fanfare: t => [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.52], [1047, 0.64]].forEach(([f, d]) => { tone(sfxBus, { f, t: t + d, dur: 0.4, type: 'square', vol: 0.05, cutoff: 3000 }); tone(sfxBus, { f: f / 2, t: t + d, dur: 0.4, type: 'triangle', vol: 0.08 }); }),
    sad: t => [392, 349, 311].forEach((f, i) => tone(sfxBus, { f, t: t + i * 0.16, dur: 0.3, type: 'triangle', vol: 0.12 })),
    sparkle: t => Array.from({ length: 6 }, (_, i) => tone(sfxBus, { f: 2000 + Math.random() * 2000, t: t + i * 0.05, dur: 0.15, vol: 0.05 })),
    buy: t => { tone(sfxBus, { f: 988, t, dur: 0.1, type: 'square', vol: 0.05, cutoff: 4000 }); tone(sfxBus, { f: 1319, t: t + 0.08, dur: 0.25, type: 'square', vol: 0.05, cutoff: 4000 }); },
    heat: t => tone(sfxBus, { f: 140, t, dur: 0.12, type: 'sawtooth', vol: 0.03, cutoff: 400 }),
  };

  function sfx(name) {
    if (!ctx || !sfxOn || !SFX[name]) return;
    try { SFX[name](ctx.currentTime + 0.01); } catch (e) { /* ignore */ }
  }

  // ---------- Music ----------
  // Chords are MIDI note arrays. Each song: tempo, beats per bar, steps per beat, swing,
  // instruments and patterns. A short melody is generated once (seeded) and looped.
  const N = { C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59 };
  const ch = (root, kind) => { const iv = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], d7: [0, 4, 7, 10] }[kind]; return iv.map(i => root + i); };

  const SONGS = {
    victorian: { bpm: 104, beats: 3, sub: 2, swing: 0, prog: [ch(N.C3, 'M'), ch(N.A3 - 12, 'm'), ch(N.F3, 'M'), ch(N.G3, 'd7'), ch(N.C3, 'M'), ch(N.F3, 'M'), ch(N.G3, 'd7'), ch(N.C3, 'M')],
      bass: 'waltz', lead: { type: 'sine', oct: 24, dur: 0.7, vol: 0.12, bell: true }, density: 0.55, drums: null },
    twenties: { bpm: 132, beats: 4, sub: 2, swing: 0.22, prog: [ch(N.F3, 'M'), ch(N.D3, 'd7'), ch(N.G3, 'd7'), ch(N.C3, 'd7'), ch(N.F3, 'M'), ch(N.D3, 'd7'), ch(N.G3, 'm7'), ch(N.C3, 'd7')],
      bass: 'stride', lead: { type: 'square', oct: 24, dur: 0.18, vol: 0.05, cutoff: 2600 }, density: 0.7, drums: 'brush' },
    fifties: { bpm: 76, beats: 4, sub: 3, swing: 0, prog: [ch(N.C3, 'M'), ch(N.A3 - 12, 'm'), ch(N.F3, 'M'), ch(N.G3, 'M')],
      bass: 'root', arp: true, lead: { type: 'triangle', oct: 24, dur: 0.5, vol: 0.09 }, density: 0.25, drums: 'backbeat' },
    seventies: { bpm: 114, beats: 4, sub: 2, swing: 0, prog: [ch(N.A3 - 12, 'm7'), ch(N.D3, 'm7'), ch(N.A3 - 12, 'm7'), ch(N.E3, 'd7')],
      bass: 'octave', pad: { type: 'sawtooth', cutoff: 1200, vol: 0.025 }, lead: { type: 'sawtooth', oct: 24, dur: 0.25, vol: 0.035, cutoff: 2200 }, density: 0.45, drums: 'disco' },
    nineties: { bpm: 90, beats: 4, sub: 2, swing: 0, prog: [ch(N.A3 - 12, 'm'), ch(N.F3, 'M'), ch(N.C3, 'M'), ch(N.G3, 'M')],
      bass: 'root8', pad: { type: 'sawtooth', cutoff: 700, vol: 0.03 }, lead: { type: 'square', oct: 12, dur: 0.35, vol: 0.035, cutoff: 1500 }, density: 0.35, drums: 'rock' },
    modern: { bpm: 80, beats: 4, sub: 2, swing: 0.18, prog: [ch(N.F3, 'M7'), ch(N.E3, 'm7'), ch(N.D3, 'm7'), ch(N.C3, 'M7')],
      bass: 'root', pad: { type: 'sine', cutoff: 0, vol: 0.045, keys: true }, lead: { type: 'sine', oct: 24, dur: 0.5, vol: 0.07 }, density: 0.3, drums: 'lofi' },
    title: { bpm: 96, beats: 3, sub: 2, swing: 0, prog: [ch(N.C3, 'M7'), ch(N.A3 - 12, 'm7'), ch(N.D3, 'm7'), ch(N.G3, 'd7')],
      bass: 'waltz', lead: { type: 'sine', oct: 24, dur: 0.9, vol: 0.1, bell: true }, density: 0.4, drums: null },
  };

  function seeded(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function buildMelody(s, seed) {
    const rnd = seeded(seed);
    const stepsPerBar = s.beats * s.sub;
    const mel = [];
    let last = 2;
    for (let bar = 0; bar < s.prog.length; bar++) {
      const chord = s.prog[bar];
      const pool = [chord[0], chord[1], chord[2], chord[0] + 12, chord[1] + 12, (chord[3] || chord[2] + 5)];
      for (let st = 0; st < stepsPerBar; st++) {
        const onBeat = st % s.sub === 0;
        if (rnd() < (onBeat ? s.density + 0.2 : s.density * 0.5)) {
          last = Math.max(0, Math.min(pool.length - 1, last + Math.round((rnd() - 0.5) * 3)));
          mel.push(pool[last]);
        } else mel.push(null);
      }
    }
    // repeat the first half at the end for a sense of phrase
    return mel;
  }

  function playStep(t, stepDur) {
    const s = song;
    const stepsPerBar = s.beats * s.sub;
    const bar = Math.floor(step / stepsPerBar) % s.prog.length;
    const st = step % stepsPerBar;
    const beat = Math.floor(st / s.sub);
    const onBeat = st % s.sub === 0;
    const chord = s.prog[bar];
    const B = musicBus;

    // bass
    if (s.bass === 'waltz' && onBeat) {
      if (beat === 0) tone(B, { f: mtof(chord[0] - 12), t, dur: 0.6, type: 'triangle', vol: 0.22 });
      else chord.slice(0, 3).forEach(n => tone(B, { f: mtof(n + 12), t, dur: 0.25, type: 'sine', vol: 0.05 }));
    }
    if (s.bass === 'stride' && onBeat) {
      if (beat % 2 === 0) tone(B, { f: mtof(chord[beat === 0 ? 0 : 2] - 12), t, dur: 0.3, type: 'triangle', vol: 0.22 });
      else chord.forEach(n => tone(B, { f: mtof(n + 12), t, dur: 0.15, type: 'square', vol: 0.025, cutoff: 1800 }));
    }
    if (s.bass === 'root' && onBeat) tone(B, { f: mtof(chord[0] - 12), t, dur: stepDur * s.sub * 0.9, type: 'triangle', vol: 0.2 });
    if (s.bass === 'root8') tone(B, { f: mtof(chord[0] - 12), t, dur: stepDur * 0.9, type: 'sawtooth', vol: 0.07, cutoff: 500 });
    if (s.bass === 'octave') tone(B, { f: mtof(chord[0] - (st % 2 ? 0 : 12)), t, dur: stepDur * 0.8, type: 'sawtooth', vol: 0.09, cutoff: 900 });

    // arpeggio (doo-wop triplets)
    if (s.arp) { const n = chord[[0, 1, 2, 1][st % 4] % chord.length] + 12; tone(B, { f: mtof(n), t, dur: stepDur * 1.5, type: 'sine', vol: 0.06 }); }

    // pad / keys at bar start
    if (s.pad && st === 0) {
      const barDur = stepDur * stepsPerBar;
      chord.forEach(n => {
        tone(B, { f: mtof(n + 12), t, dur: barDur * (s.pad.keys ? 0.7 : 1.0), type: s.pad.type, vol: s.pad.vol, a: s.pad.keys ? 0.01 : 0.3, cutoff: s.pad.cutoff });
        if (s.pad.keys) tone(B, { f: mtof(n + 24), t, dur: barDur * 0.4, type: 'sine', vol: s.pad.vol * 0.3 });
      });
    }
    if (s.pad && s.pad.keys && st === s.sub * 2) chord.forEach(n => tone(B, { f: mtof(n + 12), t, dur: stepDur * 3, type: 'sine', vol: s.pad.vol * 0.6 }));

    // melody
    const m = s.melody[step % s.melody.length];
    if (m != null) {
      const L = s.lead;
      tone(B, { f: mtof(m + L.oct), t, dur: L.dur, type: L.type, vol: L.vol, cutoff: L.cutoff || 0 });
      if (L.bell) tone(B, { f: mtof(m + L.oct + 12), t, dur: L.dur * 0.5, type: 'sine', vol: L.vol * 0.3 });
    }

    // drums
    const d = s.drums;
    if (d === 'brush') { if (onBeat) noise(B, { t, dur: 0.08, vol: beat % 2 ? 0.05 : 0.03, f: 3000 }); else noise(B, { t, dur: 0.04, vol: 0.02, f: 5000 }); }
    if (d === 'backbeat' && onBeat && beat % 2 === 1) noise(B, { t, dur: 0.15, vol: 0.08, type: 'bandpass', f: 1800, q: 0.7 });
    if (d === 'disco') {
      if (onBeat) tone(B, { f: 120, t, dur: 0.15, vol: 0.3, glide: 45 });
      if (!onBeat) noise(B, { t, dur: 0.06, vol: 0.06, f: 7000 });
      if (onBeat && beat % 2 === 1) noise(B, { t, dur: 0.14, vol: 0.08, type: 'bandpass', f: 2000, q: 0.8 });
    }
    if (d === 'rock') {
      if (onBeat && beat % 2 === 0) tone(B, { f: 110, t, dur: 0.18, vol: 0.32, glide: 45 });
      if (onBeat && beat % 2 === 1) noise(B, { t, dur: 0.18, vol: 0.12, type: 'bandpass', f: 1500, q: 0.6 });
      noise(B, { t, dur: 0.03, vol: 0.03, f: 8000 });
    }
    if (d === 'lofi') {
      if (st === 0 || st === 5) tone(B, { f: 90, t, dur: 0.22, vol: 0.28, glide: 40 });
      if (onBeat && beat % 2 === 1) noise(B, { t, dur: 0.12, vol: 0.06, type: 'bandpass', f: 1400, q: 0.5 });
      if (!onBeat) noise(B, { t, dur: 0.03, vol: 0.025, f: 7000 });
    }
  }

  function scheduler() {
    if (!ctx || !song) return;
    const beatDur = 60 / song.bpm;
    const stepDur = beatDur / song.sub;
    while (nextTime < ctx.currentTime + 0.15) {
      let t = nextTime;
      if (song.swing && song.sub === 2 && step % 2 === 1) t += stepDur * song.swing;
      try { playStep(t, stepDur); } catch (e) { /* ignore */ }
      nextTime += stepDur; step++;
    }
  }

  function music(name) {
    if (!ctx) return;
    if (song && song.name === name) return;
    const def = SONGS[name]; if (!def) return;
    song = { ...def, name, melody: buildMelody(def, name.length * 9973 + 17) };
    step = 0; nextTime = ctx.currentTime + 0.1;
    // quick fade-in
    if (musicOn) { musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setValueAtTime(0.0001, ctx.currentTime); musicBus.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5); }
    if (!timer) timer = setInterval(scheduler, 40);
  }

  function setMusic(on) { musicOn = on; if (ctx) musicBus.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.1); }
  function setSfx(on) { sfxOn = on; if (ctx) sfxBus.gain.setTargetAtTime(on ? 0.8 : 0, ctx.currentTime, 0.05); }

  // Pause music when the app is backgrounded.
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  return { init, sfx, music, setMusic, setSfx, get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; } };
})();
