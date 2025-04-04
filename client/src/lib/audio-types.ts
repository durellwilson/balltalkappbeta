/**
 * Type definitions for the audio processing system
 */

/**
 * Represents an audio track in the system
 */
export interface Track {
  id: number;
  name: string;
  type: 'audio' | 'instrument' | 'vocal' | 'drum' | 'mix';
  volume: number;
  pan: number;
  isMuted: boolean;
  isSoloed: boolean;
  isArmed?: boolean;
  color?: string;
  createdBy?: string;
  collaborator?: {
    id: string;
    name: string;
    color: string;
  } | null;
  creationMethod?: 'recorded' | 'uploaded' | 'ai-generated';
}

/**
 * Represents an audio processor track
 */
export interface TrackProcessor {
  id: number;
  setVolume: (volume: number) => void;
  setPan: (pan: number) => void;
  setMuted: (muted: boolean, storeState?: boolean) => void;
  setSolo: (soloed: boolean) => void;
  isMuted?: boolean;
  isSoloed?: boolean;
  play: (startTime?: number, offset?: number, duration?: number) => void;
  stop: () => void;
  pause: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  loadAudio: (source: string | File | AudioBuffer) => Promise<void>;
  exportAudio: () => Promise<Blob | null>;
  getWaveform: () => number[];
  connectOutput: (node: any) => void;
  disconnectFromMaster: () => void;
  dispose: () => void;
  getRecordingBuffer?: () => AudioBuffer | null;
  resetMuteState?: () => void;
}

/**
 * Represents an audio region in the timeline
 */
export interface AudioRegion {
  id: string;
  trackId: number;
  startTime: number;  // in seconds
  duration: number;   // in seconds
  offset?: number;    // offset into original audio file, in seconds
  color?: string;
  name: string;
  waveformData?: number[];
  muted?: boolean;
  loop?: boolean;
  gain?: number;
  selected?: boolean;
}

/**
 * Effect parameter types
 */
export type EffectType = 
  | 'compressor' 
  | 'equalizer' 
  | 'reverb' 
  | 'delay' 
  | 'distortion'
  | 'chorus'
  | 'tremolo'
  | 'phaser'
  | 'limiter'
  | 'noisegate';

/**
 * Effect parameter interface
 */
export interface EffectParameter {
  name: string;
  value: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

/**
 * Audio effect interface
 */
export interface Effect {
  id: string;
  type: EffectType;
  name: string;
  enabled: boolean;
  parameters: EffectParameter[];
}

/**
 * Project metadata
 */
export interface Project {
  id: string;
  name: string;
  bpm: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Collaborator/User representation
 */
export interface User {
  id: string;
  name: string;
  color?: string;
}

/**
 * Options for file upload
 */
export interface FileUploadOptions {
  targetTrackId?: number | null;
  createNewTrack: boolean;
  trackType: 'audio' | 'instrument' | 'vocal' | 'drum' | 'mix';
  position: 'start' | 'playhead' | 'end';
  aligned: boolean;
  allowOverlap: boolean;
  normalize: boolean;
  normalizationLevel: number;
  enhanceAudio?: boolean;
  enhanceOptions?: {
    clarity?: number;
    noiseSuppression?: boolean;
    bassBoost?: number;
    stereoWidening?: number;
  };
}