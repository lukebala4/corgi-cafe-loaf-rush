// Procedural WebAudio: sound effects + a looping café tune.
// The AudioContext is only created after the first user gesture (see unlock()).

export type Sfx =
  | "click"
  | "pick"
  | "place"
  | "brew"
  | "ding"
  | "coin"
  | "combo"
  | "wrong"
  | "huff"
  | "dash"
  | "event"
  | "bark"
  | "camera"
  | "snore"
  | "bump"
  | "pop"
  | "burn"
  | "win"
  | "boop"
  | "trash"
  | "catch"
  | "art";

type MusicMode = "title" | "day" | "brunch" | "victory";

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  musicBus!: GainNode;
  sfxBus!: GainNode;
  noiseBuf!: AudioBuffer;
  musicOn = true;
  sfxOn = true;
  muted = false;
  private mode: MusicMode | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private lastSfx: Record<string, number> = {};

  get ready() {
    return !!this.ctx;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.musicBus.connect(this.master);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.connect(this.master);
    const len = this.ctx.sampleRate * 1;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applyLevels();
    if (this.mode) {
      const m = this.mode;
      this.mode = null;
      this.music(m);
    }
  }

  configure(o: { music: boolean; sfx: boolean; muted: boolean }) {
    this.musicOn = o.music;
    this.sfxOn = o.sfx;
    this.muted = o.muted;
    this.applyLevels();
  }

  private applyLevels() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, t, 0.03);
    this.musicBus.gain.setTargetAtTime(this.musicOn ? 0.32 : 0, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.sfxOn ? 0.75 : 0, t, 0.02);
  }

  // ---------------------------------------------------------------- primitives
  private tone(f: number, dur: number, type: OscillatorType, vol: number, slide?: number, when = 0, bus?: AudioNode, attack = 0.005) {
    if (!this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus ?? this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol: number, freq: number, type: BiquadFilterType = "lowpass", sweep?: number, when = 0, bus?: AudioNode) {
    if (!this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime + when;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.setValueAtTime(freq, t);
    if (sweep) fl.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl);
    fl.connect(g);
    g.connect(bus ?? this.sfxBus);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }

  // ---------------------------------------------------------------- sfx
  play(name: Sfx, arg = 0) {
    if (!this.ctx || !this.sfxOn || this.muted) return;
    const now = performance.now();
    if (now - (this.lastSfx[name] ?? 0) < 40) return; // de-dupe bursts
    this.lastSfx[name] = now;
    switch (name) {
      case "click":
        this.tone(740, 0.06, "square", 0.05);
        break;
      case "pick":
        this.tone(520, 0.1, "triangle", 0.18, 860);
        break;
      case "place":
        this.tone(320, 0.09, "square", 0.06, 200);
        this.noise(0.05, 0.08, 1800);
        break;
      case "brew":
        this.noise(0.55, 0.12, 900, "bandpass", 400);
        this.tone(140, 0.4, "sine", 0.05, 110);
        break;
      case "ding":
        this.tone(1320, 0.35, "sine", 0.16);
        this.tone(1980, 0.25, "sine", 0.06, undefined, 0.01);
        break;
      case "coin":
        this.tone(988, 0.08, "square", 0.07);
        this.tone(1319, 0.16, "square", 0.07, undefined, 0.07);
        break;
      case "combo": {
        const base = 72 + Math.min(arg, 8);
        [0, 4, 7, 12].forEach((s, i) => this.tone(NOTE(base + s), 0.12, "triangle", 0.12, undefined, i * 0.05));
        break;
      }
      case "wrong":
        this.tone(330, 0.32, "sawtooth", 0.06, 140);
        this.tone(335, 0.32, "sawtooth", 0.04, 150);
        break;
      case "huff":
        this.noise(0.4, 0.2, 1600, "lowpass", 180);
        this.tone(220, 0.3, "triangle", 0.1, 110);
        break;
      case "dash":
        this.noise(0.2, 0.14, 500, "bandpass", 2600);
        break;
      case "event":
        [67, 69, 71, 74].forEach((n, i) => {
          this.tone(NOTE(n), 0.16, "sawtooth", 0.05, undefined, i * 0.11);
          this.tone(NOTE(n) * 1.01, 0.16, "square", 0.03, undefined, i * 0.11);
        });
        break;
      case "bark":
        this.tone(760, 0.08, "square", 0.08, 420);
        this.tone(700, 0.09, "square", 0.07, 380, 0.13);
        break;
      case "camera":
        this.noise(0.06, 0.2, 3000, "highpass");
        this.tone(2400, 0.04, "square", 0.04, undefined, 0.05);
        break;
      case "snore":
        this.noise(0.7, 0.1, 320, "lowpass", 160);
        break;
      case "bump":
        this.tone(190, 0.14, "sine", 0.22, 80);
        this.noise(0.08, 0.1, 900);
        break;
      case "pop":
        this.tone(420, 0.1, "triangle", 0.16, 960);
        break;
      case "burn":
        this.noise(0.35, 0.12, 2400, "highpass", 600);
        this.tone(200, 0.3, "sawtooth", 0.04, 90);
        break;
      case "win":
        [60, 64, 67, 72, 76].forEach((n, i) => this.tone(NOTE(n), 0.3, "triangle", 0.12, undefined, i * 0.09));
        break;
      case "boop":
        this.tone(600, 0.08, "sine", 0.2, 900);
        break;
      case "trash":
        this.noise(0.18, 0.14, 700, "lowpass", 200);
        this.tone(160, 0.12, "square", 0.04, 90);
        break;
      case "catch":
        [72, 76, 79].forEach((n, i) => this.tone(NOTE(n), 0.12, "square", 0.06, undefined, i * 0.06));
        break;
      case "art":
        this.tone(900, 0.06, "sine", 0.08, 1300);
        this.tone(1200, 0.06, "sine", 0.06, 1600, 0.08);
        break;
    }
  }

  // ---------------------------------------------------------------- music
  music(mode: MusicMode | null) {
    if (mode === this.mode) return;
    this.mode = mode;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (!mode || !this.ctx) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  private schedule() {
    if (!this.ctx || !this.mode) return;
    const bpm = { title: 88, day: 108, brunch: 132, victory: 116 }[this.mode];
    const eighth = 60 / bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime - this.ctx.currentTime, eighth);
      this.nextTime += eighth;
      this.step++;
    }
  }

  private playStep(step: number, when: number, eighth: number) {
    // C - Am - F - G progression, 8 eighths per chord
    const chords = [
      [48, 60, 64, 67],
      [45, 57, 60, 64],
      [41, 57, 60, 65],
      [43, 59, 62, 67],
    ];
    const bar = Math.floor(step / 8) % 4;
    const pos = step % 8;
    const ch = chords[bar];
    const bus = this.musicBus;
    const mode = this.mode;
    // bass: root on 1 & 5, fifth on 7 (walking pluck)
    if (pos === 0 || pos === 4) this.tone(NOTE(ch[0]), eighth * 1.6, "triangle", 0.35, undefined, when, bus);
    if (pos === 6) this.tone(NOTE(ch[0] + 7), eighth * 0.9, "triangle", 0.22, undefined, when, bus);
    // marimba-ish chord stabs on the off-beats
    if (pos % 2 === 1) {
      for (const n of ch.slice(1)) this.tone(NOTE(n + 12), eighth * 0.9, "sine", 0.05, undefined, when, bus, 0.002);
    }
    // melody (pentatonic, deterministic per bar so it feels like a tune)
    const scale = [72, 74, 76, 79, 81, 84];
    const phrase = [0, 2, 3, 2, 4, 3, 1, 0, 2, 3, 5, 4, 3, 2, 1, -1];
    const idx = (Math.floor(step / 2) + bar * 3) % phrase.length;
    if (pos % 2 === 0 && mode !== "title") {
      const n = phrase[idx];
      if (n >= 0 && (step * 7) % 5 !== 0) this.tone(NOTE(scale[n]), eighth * 1.4, "square", 0.035, undefined, when, bus, 0.004);
    } else if (mode === "title" && pos === 0) {
      this.tone(NOTE(scale[(bar * 2) % scale.length]), eighth * 3, "sine", 0.08, undefined, when, bus, 0.01);
    }
    // shaker
    if (mode !== "title") this.noise(0.04, pos % 2 ? 0.05 : 0.08, 6000, "highpass", undefined, when, bus);
    if (mode === "brunch" && pos % 4 === 2) this.noise(0.08, 0.12, 1500, "bandpass", undefined, when, bus);
  }
}

export const audio = new AudioEngine();
