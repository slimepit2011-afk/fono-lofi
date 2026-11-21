// VIP Multi-Track Procedural Ambient Soundscape Engine
// Real-time Web Audio noise & impulse synthesis for Rain, Vinyl Crackle, and Cozy Cafe
// Layered seamlessly alongside music with independent volume controls

class AmbientAudioService {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;

  // Rain nodes
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  // Crackle nodes
  private crackleGain: GainNode | null = null;
  private crackleSource: AudioBufferSourceNode | null = null;

  // Cafe murmur nodes
  private cafeGain: GainNode | null = null;
  private cafeSource: AudioBufferSourceNode | null = null;

  private rainVol: number = 0;
  private crackleVol: number = 0;
  private cafeVol: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lullo:ambient_levels');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.rainVol = parsed.rain || 0;
          this.crackleVol = parsed.crackle || 0;
          this.cafeVol = parsed.cafe || 0;
        }
      } catch {}
    }
  }

  private initAudio() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
  }

  private createRainBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const sampleRate = this.ctx.sampleRate;
    const duration = 5; // 5 seconds looping buffer
    const buffer = this.ctx.createBuffer(2, sampleRate * duration, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let lastOut = 0.0;
      // Pink noise filter algorithm (Paul Kellet's method)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        // Lowpass gentle rumble
        lastOut = lastOut * 0.8 + pink * 0.05;
        data[i] = lastOut;
      }
    }
    return buffer;
  }

  private createCrackleBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const sampleRate = this.ctx.sampleRate;
    const duration = 4;
    const buffer = this.ctx.createBuffer(2, sampleRate * duration, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        // Stochastic vinyl pop chance
        if (Math.random() < 0.00035) {
          data[i] = (Math.random() * 2 - 1) * 0.45;
        } else if (Math.random() < 0.002) {
          data[i] = (Math.random() * 2 - 1) * 0.12;
        } else {
          // Low background groove hiss
          data[i] = (Math.random() * 2 - 1) * 0.012;
        }
      }
    }
    return buffer;
  }

  private createCafeBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const sampleRate = this.ctx.sampleRate;
    const duration = 6;
    const buffer = this.ctx.createBuffer(2, sampleRate * duration, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let val = 0;
      for (let i = 0; i < data.length; i++) {
        // Brown noise filtered room rumble
        const white = Math.random() * 2 - 1;
        val = (val + (0.02 * white)) / 1.02;
        // occasional gentle clink
        let clink = 0;
        if (Math.random() < 0.00008) {
          clink = Math.sin(i * 0.15) * 0.15 * Math.exp(-((i % 4000) / 600));
        }
        data[i] = val * 0.4 + clink;
      }
    }
    return buffer;
  }

  private startLoop() {
    if (!this.ctx) this.initAudio();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.isRunning) return;
    this.isRunning = true;

    // Rain setup
    const rainBuf = this.createRainBuffer();
    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = rainBuf;
    this.rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 1600;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(this.rainVol * 0.6, this.ctx.currentTime);

    this.rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);
    this.rainSource.start();

    // Crackle setup
    const crackleBuf = this.createCrackleBuffer();
    this.crackleSource = this.ctx.createBufferSource();
    this.crackleSource.buffer = crackleBuf;
    this.crackleSource.loop = true;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.value = 2400;
    crackleFilter.Q.value = 0.8;

    this.crackleGain = this.ctx.createGain();
    this.crackleGain.gain.setValueAtTime(this.crackleVol * 0.5, this.ctx.currentTime);

    this.crackleSource.connect(crackleFilter);
    crackleFilter.connect(this.crackleGain);
    this.crackleGain.connect(this.ctx.destination);
    this.crackleSource.start();

    // Cafe setup
    const cafeBuf = this.createCafeBuffer();
    this.cafeSource = this.ctx.createBufferSource();
    this.cafeSource.buffer = cafeBuf;
    this.cafeSource.loop = true;

    const cafeFilter = this.ctx.createBiquadFilter();
    cafeFilter.type = 'lowpass';
    cafeFilter.frequency.value = 900;

    this.cafeGain = this.ctx.createGain();
    this.cafeGain.gain.setValueAtTime(this.cafeVol * 0.5, this.ctx.currentTime);

    this.cafeSource.connect(cafeFilter);
    cafeFilter.connect(this.cafeGain);
    this.cafeGain.connect(this.ctx.destination);
    this.cafeSource.start();
  }

  private saveLevels() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lullo:ambient_levels', JSON.stringify({
        rain: this.rainVol,
        crackle: this.crackleVol,
        cafe: this.cafeVol
      }));
    }
  }

  public setRain(vol: number) {
    this.rainVol = Math.max(0, Math.min(1, vol));
    this.saveLevels();
    if (!this.isRunning && (this.rainVol > 0 || this.crackleVol > 0 || this.cafeVol > 0)) {
      this.startLoop();
    }
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(this.rainVol * 0.6, this.ctx.currentTime, 0.05);
    }
  }

  public setCrackle(vol: number) {
    this.crackleVol = Math.max(0, Math.min(1, vol));
    this.saveLevels();
    if (!this.isRunning && (this.rainVol > 0 || this.crackleVol > 0 || this.cafeVol > 0)) {
      this.startLoop();
    }
    if (this.crackleGain && this.ctx) {
      this.crackleGain.gain.setTargetAtTime(this.crackleVol * 0.5, this.ctx.currentTime, 0.05);
    }
  }

  public setCafe(vol: number) {
    this.cafeVol = Math.max(0, Math.min(1, vol));
    this.saveLevels();
    if (!this.isRunning && (this.rainVol > 0 || this.crackleVol > 0 || this.cafeVol > 0)) {
      this.startLoop();
    }
    if (this.cafeGain && this.ctx) {
      this.cafeGain.gain.setTargetAtTime(this.cafeVol * 0.5, this.ctx.currentTime, 0.05);
    }
  }

  public getLevels() {
    return {
      rain: this.rainVol,
      crackle: this.crackleVol,
      cafe: this.cafeVol
    };
  }

  public stopAll() {
    this.setRain(0);
    this.setCrackle(0);
    this.setCafe(0);
  }
}

export const ambientAudio = new AmbientAudioService();
