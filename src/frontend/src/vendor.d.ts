// Type shims for packages that ship without bundled TypeScript declarations.

declare module "gsap" {
  const gsap: { [key: string]: unknown };
  export default gsap;
  export { gsap };
}

declare module "wavesurfer.js" {
  interface WaveSurferOptions {
    container: HTMLElement | string;
    waveColor?: string;
    progressColor?: string;
    height?: number;
    barWidth?: number;
    barRadius?: number;
    barGap?: number;
    cursorWidth?: number;
    cursorColor?: string;
    interact?: boolean;
    backend?: string;
    normalize?: boolean;
    hideScrollbar?: boolean;
    url?: string;
    [key: string]: unknown;
  }

  export interface WaveSurfer {
    load(url: string): void;
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    seekTo(progress: number): void;
    getCurrentTime(): number;
    getDuration(): number;
    getVolume(): number;
    setVolume(volume: number): void;
    isPlaying(): boolean;
    destroy(): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    [key: string]: unknown;
  }

  const WaveSurfer: {
    create(options: WaveSurferOptions): WaveSurfer;
  };

  export default WaveSurfer;
}
