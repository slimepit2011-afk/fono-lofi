// Tactile Micro-Interaction & Acoustic Feedback Engine
// Generates lightweight, warm acoustic mechanical clicks via Web Audio API
// Perfectly mimics modern high-end tactile physical buttons and haptics

class TactileFeedbackService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Lazy initialize on first user interaction
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lullo:tactile_sound');
      this.enabled = stored !== null ? stored === 'true' : true;
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enable: boolean) {
    this.enabled = enable;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lullo:tactile_sound', enable ? 'true' : 'false');
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Synthesize a subtle, satisfying click
   * @param type 'click' | 'tap' | 'tab' | 'switch' | 'snap'
   */
  public click(type: 'click' | 'tap' | 'tab' | 'switch' | 'snap' = 'click') {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';

      switch (type) {
        case 'tab': {
          // Warm woodblock/marimba tap
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);
          filter.frequency.setValueAtTime(800, now);

          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'tap': {
          // Subtle soft membrane press
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.025);
          filter.frequency.setValueAtTime(600, now);

          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.03);
          break;
        }

        case 'switch': {
          // Crisp toggle switch
          osc.type = 'sine';
          osc.frequency.setValueAtTime(680, now);
          osc.frequency.exponentialRampToValueAtTime(280, now + 0.02);
          filter.frequency.setValueAtTime(1200, now);

          gain.gain.setValueAtTime(0.035, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.025);
          break;
        }

        case 'snap': {
          // Playback play/pause pop
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
          filter.frequency.setValueAtTime(900, now);

          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.055);
          break;
        }

        case 'click':
        default: {
          // Default subtle tactile mouse/trackpad click
          osc.type = 'sine';
          osc.frequency.setValueAtTime(480, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.02);
          filter.frequency.setValueAtTime(1000, now);

          gain.gain.setValueAtTime(0.035, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.025);
          break;
        }
      }
    } catch {
      // AudioContext could be blocked by browser policy prior to gesture
    }
  }
}

export const tactile = new TactileFeedbackService();
