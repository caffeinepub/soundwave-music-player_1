export type AudioMode = "atmos" | "bassBoost" | "surround" | "night" | "off";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private leftGain: GainNode | null = null;
  private rightGain: GainNode | null = null;
  private mode: AudioMode = "off";
  private ytVolumeInterval: ReturnType<typeof setInterval> | null = null;
  private audioElementRef: HTMLAudioElement | null = null;
  private contextFailed = false;

  private ensureContext(): AudioContext | null {
    if (this.contextFailed) return null;
    if (!this.ctx) {
      try {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          console.warn(
            "[AudioEngine] AudioContext not supported in this browser",
          );
          this.contextFailed = true;
          return null;
        }
        this.ctx = new AudioCtx();
      } catch (err) {
        console.warn(
          "[AudioEngine] AudioContext creation failed — audio enhancements disabled:",
          err,
        );
        this.contextFailed = true;
        return null;
      }
    }
    return this.ctx;
  }

  resumeContext(): void {
    try {
      this.ctx?.resume().catch(() => {});
    } catch (err) {
      console.warn("[AudioEngine] resumeContext failed:", err);
    }
  }

  generateImpulseResponse(duration: number, decay: number): AudioBuffer | null {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    try {
      const sampleRate = 44100;
      const length = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(2, length, sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
        }
      }
      return buffer;
    } catch (err) {
      console.warn("[AudioEngine] Failed to generate impulse response:", err);
      return null;
    }
  }

  connectLocalSource(audioElement: HTMLAudioElement): void {
    try {
      if (this.audioElementRef === audioElement && this.sourceNode) return;
      this.audioElementRef = audioElement;

      const ctx = this.ensureContext();
      if (!ctx) return; // graceful degradation — audio still works, just no effects

      try {
        // Disconnect previous source
        if (this.sourceNode) {
          try {
            this.sourceNode.disconnect();
          } catch (_) {}
          this.sourceNode = null;
        }

        // Build nodes
        this.gainNode = ctx.createGain();
        this.bassFilter = ctx.createBiquadFilter();
        this.bassFilter.type = "lowshelf";
        this.bassFilter.frequency.value = 120;

        this.trebleFilter = ctx.createBiquadFilter();
        this.trebleFilter.type = "highshelf";
        this.trebleFilter.frequency.value = 8000;

        this.convolverNode = ctx.createConvolver();
        const impulse = this.generateImpulseResponse(2.5, 3.0);
        if (impulse) this.convolverNode.buffer = impulse;

        this.dryGain = ctx.createGain();
        this.dryGain.gain.value = 1;
        this.wetGain = ctx.createGain();
        this.wetGain.gain.value = 0;

        this.splitter = ctx.createChannelSplitter(2);
        this.merger = ctx.createChannelMerger(2);
        this.leftGain = ctx.createGain();
        this.leftGain.gain.value = 1;
        this.rightGain = ctx.createGain();
        this.rightGain.gain.value = 1;

        try {
          this.sourceNode = ctx.createMediaElementSource(audioElement);
        } catch (_) {
          // Already created for this element — skip silently
          return;
        }

        // Main chain: source → splitter → left/right gain → merger → bass → treble → dryGain → destination
        this.sourceNode.connect(this.splitter);
        this.splitter.connect(this.leftGain, 0);
        this.splitter.connect(this.rightGain, 1);
        this.leftGain.connect(this.merger, 0, 0);
        this.rightGain.connect(this.merger, 0, 1);
        this.merger.connect(this.bassFilter);
        this.bassFilter.connect(this.trebleFilter);
        this.trebleFilter.connect(this.dryGain);
        this.dryGain.connect(this.gainNode);
        this.gainNode.connect(ctx.destination);

        // Wet (reverb) parallel path
        this.merger.connect(this.convolverNode);
        this.convolverNode.connect(this.wetGain);
        this.wetGain.connect(ctx.destination);

        this.applyPreset(this.mode);
      } catch (err) {
        console.warn(
          "[AudioEngine] Failed to connect audio source — audio still plays without effects:",
          err,
        );
      }
    } catch (err) {
      console.warn(
        "[AudioEngine] connectLocalSource failed — playing without effects:",
        err,
      );
      // Do not rethrow — audio element still plays normally
    }
  }

  disconnectLocalSource(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (_) {}
      this.sourceNode = null;
    }
  }

  setMode(mode: AudioMode): void {
    try {
      this.mode = mode;
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const smooth = 0.05;

        if (mode === "off") {
          this.bassFilter?.gain.setTargetAtTime(0, t, smooth);
          this.trebleFilter?.gain.setTargetAtTime(0, t, smooth);
          this.wetGain?.gain.setTargetAtTime(0, t, smooth);
          this.dryGain?.gain.setTargetAtTime(1, t, smooth);
          this.gainNode?.gain.setTargetAtTime(1, t, smooth);
          this.leftGain?.gain.setTargetAtTime(1, t, smooth);
          this.rightGain?.gain.setTargetAtTime(1, t, smooth);
        } else {
          this.applyPreset(mode);
        }
      } catch (err) {
        console.warn("[AudioEngine] setMode failed:", err);
      }
    } catch (err) {
      console.warn("[AudioEngine] setMode outer failed:", err);
    }
  }

  applyPreset(mode: AudioMode): void {
    try {
      if (!this.ctx || mode === "off") return;
      try {
        const t = this.ctx.currentTime;
        const smooth = 0.05;

        const presets: Record<
          Exclude<AudioMode, "off">,
          {
            bassGain: number;
            bassFreq: number;
            trebleGain: number;
            wet: number;
            width: number;
            gain: number;
          }
        > = {
          atmos: {
            bassGain: 4,
            bassFreq: 100,
            trebleGain: 2,
            wet: 0.15,
            width: 0.6,
            gain: 1.05,
          },
          bassBoost: {
            bassGain: 8,
            bassFreq: 80,
            trebleGain: 0,
            wet: 0.05,
            width: 0.3,
            gain: 1.1,
          },
          surround: {
            bassGain: 2,
            bassFreq: 120,
            trebleGain: 0,
            wet: 0.35,
            width: 0.8,
            gain: 1.0,
          },
          night: {
            bassGain: 1,
            bassFreq: 120,
            trebleGain: -3,
            wet: 0.1,
            width: 0.2,
            gain: 0.85,
          },
        };

        const p = presets[mode as Exclude<AudioMode, "off">];
        if (!p) return;

        this.bassFilter?.frequency.setTargetAtTime(p.bassFreq, t, smooth);
        this.bassFilter?.gain.setTargetAtTime(p.bassGain, t, smooth);
        this.trebleFilter?.gain.setTargetAtTime(p.trebleGain, t, smooth);
        this.wetGain?.gain.setTargetAtTime(p.wet, t, smooth);
        this.dryGain?.gain.setTargetAtTime(1, t, smooth);
        this.gainNode?.gain.setTargetAtTime(p.gain, t, smooth);

        const base = 1;
        const w = p.width;
        this.leftGain?.gain.setTargetAtTime(base + w * 0.3, t, smooth);
        this.rightGain?.gain.setTargetAtTime(base + w * 0.3, t, smooth);
      } catch (err) {
        console.warn("[AudioEngine] applyPreset failed:", err);
      }
    } catch (err) {
      console.warn("[AudioEngine] applyPreset outer failed:", err);
    }
  }

  startYouTubeSimulation(ytPlayer: {
    setVolume: (v: number) => void;
    getVolume: () => number;
  }): void {
    if (this.mode === "off") return;
    this.stopYouTubeSimulation();
    try {
      const baseVol = ytPlayer.getVolume();
      this.ytVolumeInterval = setInterval(() => {
        if (this.mode === "off") {
          this.stopYouTubeSimulation();
          return;
        }
        try {
          const pulse = Math.round(baseVol + Math.sin(Date.now() / 4000) * 2.5);
          const clamped = Math.max(0, Math.min(100, pulse));
          ytPlayer.setVolume(clamped);
        } catch (_) {}
      }, 200);
    } catch (err) {
      console.warn("[AudioEngine] startYouTubeSimulation failed:", err);
    }
  }

  stopYouTubeSimulation(): void {
    if (this.ytVolumeInterval !== null) {
      clearInterval(this.ytVolumeInterval);
      this.ytVolumeInterval = null;
    }
  }

  safeDisable(): void {
    try {
      this.mode = "off";
      this.stopYouTubeSimulation();
    } catch (_) {}
  }

  getMode(): AudioMode {
    return this.mode;
  }
}

export const audioEngine = new AudioEngine();
