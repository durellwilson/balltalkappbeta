/**
 * Collection of type definitions for audio processing functionality
 */

// Audio engine types
export interface AudioTrigger {
  id: string;
  label: string;
  icon: string;
  action: string;
}

export interface AudioTrackOptions {
  volume?: number;
  pan?: number;
  muted?: boolean;
  soloed?: boolean;
  effects?: AudioEffect[];
}

export interface AudioEffect {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: {
    [key: string]: number | boolean | string;
  };
}

export interface RecordingOptions {
  countIn?: boolean;
  countInBeats?: number;
  monitoring?: boolean;
  overdub?: boolean;
  loop?: boolean;
  metronome?: boolean;
  autoStop?: boolean;
  autoStopAfter?: number;
}

export interface AudioRegion {
  id: string;
  trackId: number;
  start: number;
  end: number;
  offset: number;
  name: string;
  waveform: number[];
  buffer?: AudioBuffer;
  file?: string | Blob;
}

export interface AudioProcessorOptions {
  sampleRate?: number;
  channels?: number;
  bufferSize?: number;
  latencyHint?: AudioContextLatencyCategory;
}

export interface TrackProcessorOptions {
  volume?: number;
  pan?: number;
  muted?: boolean;
  soloed?: boolean;
}

export interface AudioEnhancementOptions {
  clarity?: number; // 0-1
  noiseSuppression?: boolean;
  bassBoost?: number; // 0-1
  stereoWidening?: number; // 0-1
  denoise?: boolean;
  eq?: boolean;
  compression?: boolean;
}

export interface MixerSettings {
  masterVolume: number;
  masterPan: number;
  masterCompression: number;
  masterLimiter: boolean;
  masterEq: {
    low: number;
    mid: number;
    high: number;
  };
  masterReverb: number;
}

export enum RecordingState {
  INACTIVE = 'inactive',
  PREPARING = 'preparing',
  COUNT_IN = 'countIn',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  PROCESSING = 'processing'
}

export enum PlaybackState {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused'
}

export interface AudioAnalyzerResult {
  waveform: Float32Array;
  spectrum: Float32Array;
  rms: number;
  peak: number;
  db: number;
  timeDomainData: Float32Array;
  frequencyData: Uint8Array;
}