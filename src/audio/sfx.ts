/**
 * Synthetische Soundeffekte über die Web Audio API – keine Dateien nötig, komplett offline.
 * Schulgong, Pausen-Rauschen (übertönt auch Geraschel beim Tippen) und tickende Uhr.
 */
class Sfx {
  private ctx: AudioContext | null = null;
  private ambience: { src: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode } | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private tickOn = false;
  enabled = { gong: true, ambience: true, tick: true };

  private get audio(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }

  /** In einer Nutzergeste aufrufen (iOS). */
  unlock() {
    const ctx = this.audio;
    if (!ctx) return;
    ctx.resume().catch(() => {});
    // stiller Puffer schaltet iOS frei
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(ctx.destination);
    s.start(0);
  }

  suspend() {
    this.ctx?.suspend().catch(() => {});
  }

  resume() {
    this.ctx?.resume().catch(() => {});
  }

  private bell(ctx: AudioContext, freq: number, at: number, dur = 2.2, vol = 0.35) {
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, at);
    out.gain.exponentialRampToValueAtTime(vol, at + 0.01);
    out.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    out.connect(ctx.destination);
    // Glockenartige Obertöne
    for (const [mult, v] of [
      [1, 1],
      [2, 0.45],
      [2.76, 0.25],
      [5.4, 0.08],
    ] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq * mult;
      g.gain.value = v;
      o.connect(g).connect(out);
      o.start(at);
      o.stop(at + dur + 0.05);
    }
  }

  /** Klassischer Schulgong (vier Töne). Resolved, wenn er verklungen ist. */
  async gong(): Promise<void> {
    if (!this.enabled.gong) return;
    const ctx = this.audio;
    if (!ctx) return;
    await ctx.resume().catch(() => {});
    const t = ctx.currentTime + 0.05;
    const notes = [659.25, 523.25, 587.33, 392.0]; // E5 C5 D5 G4
    notes.forEach((f, i) => this.bell(ctx, f, t + i * 0.55));
    await new Promise((r) => setTimeout(r, 0.55 * notes.length * 1000 + 900));
  }

  startAmbience() {
    if (!this.enabled.ambience || this.ambience) return;
    const ctx = this.audio;
    if (!ctx) return;
    // Rosa-ähnliches Rauschen → klingt wie entferntes Stimmengewirr auf dem Pausenhof
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 700;
    band.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2);
    // langsames An- und Abschwellen
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.13;
    lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain).connect(gain.gain);
    src.connect(band).connect(gain).connect(ctx.destination);
    src.start();
    lfo.start();
    this.ambience = { src, gain, lfo };
  }

  stopAmbience() {
    const a = this.ambience;
    if (!a || !this.ctx) return;
    this.ambience = null;
    const now = this.ctx.currentTime;
    a.gain.gain.cancelScheduledValues(now);
    a.gain.gain.setValueAtTime(a.gain.gain.value, now);
    a.gain.gain.linearRampToValueAtTime(0, now + 1);
    a.src.stop(now + 1.1);
    a.lfo.stop(now + 1.1);
  }

  private click(high: boolean) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = high ? 2400 : 1800;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.04);
  }

  startTick() {
    if (!this.enabled.tick || this.tickTimer) return;
    if (!this.audio) return;
    this.tickTimer = setInterval(() => {
      this.tickOn = !this.tickOn;
      this.click(this.tickOn);
    }, 1000);
  }

  stopTick() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = null;
  }

  stopAll() {
    this.stopAmbience();
    this.stopTick();
  }
}

export const sfx = new Sfx();
