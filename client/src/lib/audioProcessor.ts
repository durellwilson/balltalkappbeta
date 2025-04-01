import * as Tone from 'tone';

/**
 * AudioProcessor provides a high-level interface for audio manipulation
 * using the Tone.js library, with support for real-time effects processing, 
 * recording, and waveform generation
 */
class AudioProcessor {
  private context: AudioContext;
  private masterCompressor: Tone.Compressor;
  private masterLimiter: Tone.Limiter;
  private masterGain: Tone.Gain;
  private eqBands: Tone.EQ3;
  private analyzer: Tone.Analyser;
  private recorder: Tone.Recorder | null = null;
  private tracks: Map<number, TrackProcessor> = new Map();
  private isInitialized: boolean = false;
  private lufsTarget: number = -14; // Industry standard for streaming

  constructor() {
    // Create Tone context
    this.context = Tone.context;
    
    // Set up master chain
    this.masterGain = new Tone.Gain(0.8).toDestination();
    this.masterCompressor = new Tone.Compressor({
      ratio: 4,
      threshold: -24,
      release: 0.25,
      attack: 0.003,
      knee: 30
    }).connect(this.masterGain);
    
    this.masterLimiter = new Tone.Limiter(-0.1).connect(this.masterCompressor);
    
    // 3-band EQ (low, mid, high)
    this.eqBands = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0,
      lowFrequency: 300,
      highFrequency: 3000
    }).connect(this.masterLimiter);
    
    // Analyzer for visualization
    this.analyzer = new Tone.Analyser('waveform', 1024);
    this.eqBands.connect(this.analyzer);
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await Tone.start();
    this.isInitialized = true;
    console.log('Audio context initialized');
    
    // Set default BPM
    Tone.Transport.bpm.value = 120;
  }

  /**
   * Create a new track with the given ID and settings
   */
  createTrack(trackId: number, options: TrackOptions = {}): TrackProcessor {
    if (this.tracks.has(trackId)) {
      return this.tracks.get(trackId)!;
    }
    
    const track = new TrackProcessor(this.context, {
      ...options,
      output: this.eqBands
    });
    
    this.tracks.set(trackId, track);
    return track;
  }

  /**
   * Remove a track with the given ID
   */
  removeTrack(trackId: number): boolean {
    const track = this.tracks.get(trackId);
    if (track) {
      track.dispose();
      return this.tracks.delete(trackId);
    }
    return false;
  }

  /**
   * Get a track by ID
   */
  getTrack(trackId: number): TrackProcessor | undefined {
    return this.tracks.get(trackId);
  }

  /**
   * Get all track IDs
   */
  getTrackIds(): number[] {
    return Array.from(this.tracks.keys());
  }

  /**
   * Start transport/playback
   */
  play(): void {
    Tone.Transport.start();
  }

  /**
   * Stop transport/playback
   */
  stop(): void {
    Tone.Transport.stop();
  }

  /**
   * Pause transport/playback
   */
  pause(): void {
    Tone.Transport.pause();
  }

  /**
   * Set the BPM (beats per minute)
   */
  setBpm(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }

  /**
   * Get the current BPM
   */
  getBpm(): number {
    return Tone.Transport.bpm.value;
  }

  /**
   * Set the master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set EQ settings
   */
  setEQ(low: number, mid: number, high: number): void {
    this.eqBands.low.value = low;
    this.eqBands.mid.value = mid;
    this.eqBands.high.value = high;
  }

  /**
   * Set compressor settings
   */
  setCompressor(settings: Partial<CompressorSettings>): void {
    if (settings.threshold !== undefined) this.masterCompressor.threshold.value = settings.threshold;
    if (settings.ratio !== undefined) this.masterCompressor.ratio.value = settings.ratio;
    if (settings.attack !== undefined) this.masterCompressor.attack.value = settings.attack;
    if (settings.release !== undefined) this.masterCompressor.release.value = settings.release;
    if (settings.knee !== undefined) this.masterCompressor.knee.value = settings.knee;
  }

  /**
   * Set limiter threshold
   */
  setLimiterThreshold(threshold: number): void {
    this.masterLimiter.threshold.value = threshold;
  }

  /**
   * Set LUFS target
   */
  setLufsTarget(lufs: number): void {
    this.lufsTarget = lufs;
    // Adjust gain to match LUFS target (simplified)
    // In a real implementation, this would analyze the signal and make dynamic adjustments
    const estimatedGain = Math.pow(10, (this.lufsTarget + 23) / 20);
    this.masterGain.gain.value = Math.max(0, Math.min(1, estimatedGain));
  }

  /**
   * Start recording the master output
   */
  startRecording(): void {
    this.recorder = new Tone.Recorder();
    this.masterGain.connect(this.recorder);
    this.recorder.start();
  }

  /**
   * Stop recording and return the audio blob
   */
  async stopRecording(): Promise<Blob | null> {
    if (!this.recorder) return null;
    
    const recording = await this.recorder.stop();
    this.masterGain.disconnect(this.recorder);
    this.recorder = null;
    return recording;
  }

  /**
   * Get the current waveform data for visualization
   */
  getWaveform(): Float32Array {
    return this.analyzer.getValue() as Float32Array;
  }

  /**
   * Apply an AI mastering preset based on the genre
   */
  applyAIMasteringPreset(genre: string): void {
    // These settings would ideally come from a trained ML model
    // Here we're simulating different genre-specific mastering presets
    switch (genre.toLowerCase()) {
      case 'hip-hop':
        this.setEQ(2, 0, -1);
        this.setCompressor({ 
          threshold: -18, 
          ratio: 4,
          attack: 0.01,
          release: 0.25
        });
        this.setLimiterThreshold(-1);
        this.setLufsTarget(-8);
        break;
        
      case 'pop':
        this.setEQ(1, 1, 2);
        this.setCompressor({ 
          threshold: -20, 
          ratio: 3,
          attack: 0.003,
          release: 0.15
        });
        this.setLimiterThreshold(-0.5);
        this.setLufsTarget(-10);
        break;
        
      case 'r&b':
        this.setEQ(3, -1, 1);
        this.setCompressor({ 
          threshold: -24, 
          ratio: 2.5,
          attack: 0.02,
          release: 0.4
        });
        this.setLimiterThreshold(-0.8);
        this.setLufsTarget(-12);
        break;
        
      case 'rock':
        this.setEQ(1, 2, 3);
        this.setCompressor({ 
          threshold: -16, 
          ratio: 6,
          attack: 0.005,
          release: 0.2
        });
        this.setLimiterThreshold(-0.2);
        this.setLufsTarget(-9);
        break;
        
      default:
        // Balanced preset
        this.setEQ(0, 0, 0);
        this.setCompressor({ 
          threshold: -24, 
          ratio: 4,
          attack: 0.003,
          release: 0.25
        });
        this.setLimiterThreshold(-0.1);
        this.setLufsTarget(-14);
    }
  }

  /**
   * Dispose of all audio nodes to free up resources
   */
  dispose(): void {
    this.tracks.forEach(track => track.dispose());
    this.tracks.clear();
    
    this.analyzer.dispose();
    this.eqBands.dispose();
    this.masterLimiter.dispose();
    this.masterCompressor.dispose();
    this.masterGain.dispose();
    
    if (this.recorder) {
      this.recorder.dispose();
      this.recorder = null;
    }
  }
}

/**
 * TrackProcessor handles individual audio tracks with effects
 */
class TrackProcessor {
  private player: Tone.Player | null = null;
  private recorder: Tone.UserMedia | null = null;
  private panner: Tone.Panner;
  private volume: Tone.Volume;
  private eq: Tone.EQ3;
  private compressor: Tone.Compressor;
  private analyzer: Tone.Analyser;
  private output: Tone.ToneAudioNode;
  private muted: boolean = false;
  private soloed: boolean = false;
  private audioBuffer: AudioBuffer | null = null;
  private context: AudioContext;

  constructor(context: AudioContext, options: TrackProcessorOptions = {}) {
    this.context = context;
    this.output = options.output || Tone.getDestination();
    
    // Effect chain
    this.volume = new Tone.Volume(options.volume || 0);
    this.panner = new Tone.Panner(options.pan || 0).connect(this.volume);
    this.eq = new Tone.EQ3().connect(this.panner);
    this.compressor = new Tone.Compressor().connect(this.eq);
    this.analyzer = new Tone.Analyser('waveform', 128);
    this.compressor.connect(this.analyzer);
    
    // Connect to output
    this.volume.connect(this.output);
    
    // Configure initial settings
    this.setMuted(options.muted || false);
    this.setSolo(options.soloed || false);
  }

  /**
   * Load audio from a URL
   */
  async loadAudio(url: string): Promise<void> {
    try {
      this.disposePlayer();
      this.player = new Tone.Player({
        url,
        onload: () => {
          this.audioBuffer = this.player?.buffer.get();
          this.player?.connect(this.compressor);
          console.log(`Loaded audio: ${url}`);
        }
      }).connect(this.compressor);
      await this.player.load(url);
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }

  /**
   * Load audio from a file object
   */
  async loadAudioFile(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      this.disposePlayer();
      this.audioBuffer = audioBuffer;
      this.player = new Tone.Player(audioBuffer).connect(this.compressor);
      console.log(`Loaded audio file: ${file.name}`);
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw error;
    }
  }

  /**
   * Start recording from microphone
   */
  async startRecording(): Promise<void> {
    try {
      this.disposePlayer();
      this.recorder = new Tone.UserMedia().connect(this.compressor);
      await this.recorder.open();
      console.log('Started recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and create a player with the recorded audio
   */
  async stopRecording(): Promise<void> {
    if (!this.recorder) return;
    
    try {
      const recorder = new Tone.Recorder();
      this.recorder.connect(recorder);
      recorder.start();
      
      // Record for a small duration to get the buffer
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const blob = await recorder.stop();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      this.disposeRecorder();
      recorder.dispose();
      
      this.audioBuffer = audioBuffer;
      this.player = new Tone.Player(audioBuffer).connect(this.compressor);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * Play the track
   */
  play(startTime?: number): void {
    if (!this.player) return;
    
    if (startTime !== undefined) {
      this.player.start(Tone.now(), startTime);
    } else {
      this.player.start();
    }
  }

  /**
   * Stop the track
   */
  stop(): void {
    if (this.player && this.player.state === 'started') {
      this.player.stop();
    }
  }

  /**
   * Set track volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume.volume.value = Math.max(-60, Math.min(0, 20 * Math.log10(volume)));
  }

  /**
   * Get track volume (0-1)
   */
  getVolume(): number {
    return Math.pow(10, this.volume.volume.value / 20);
  }

  /**
   * Set track panning (-1 to 1)
   */
  setPan(pan: number): void {
    this.panner.pan.value = Math.max(-1, Math.min(1, pan));
  }

  /**
   * Get track panning (-1 to 1)
   */
  getPan(): number {
    return this.panner.pan.value;
  }

  /**
   * Set track EQ settings
   */
  setEQ(low: number, mid: number, high: number): void {
    this.eq.low.value = low;
    this.eq.mid.value = mid;
    this.eq.high.value = high;
  }

  /**
   * Mute/unmute the track
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    this.volume.mute = muted;
  }

  /**
   * Get mute state
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Solo/unsolo the track
   */
  setSolo(soloed: boolean): void {
    this.soloed = soloed;
    // Solo implementation would typically mute all other tracks
  }

  /**
   * Get solo state
   */
  isSoloed(): boolean {
    return this.soloed;
  }

  /**
   * Get the waveform data for visualization
   */
  getWaveform(): Float32Array {
    return this.analyzer.getValue() as Float32Array;
  }

  /**
   * Get a time-domain waveform of the entire audio file
   * (used for drawing the track waveform)
   */
  getFullWaveform(): number[] {
    if (!this.audioBuffer) return [];
    
    // Get the first channel data
    const rawData = this.audioBuffer.getChannelData(0);
    const points = 100;  // Number of points to return
    const blockSize = Math.floor(rawData.length / points);
    const waveform = [];
    
    for (let i = 0; i < points; i++) {
      const start = blockSize * i;
      let sum = 0;
      
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[start + j] || 0);
      }
      
      waveform.push(sum / blockSize);
    }
    
    return waveform;
  }

  /**
   * Export track audio as blob
   */
  async exportAudio(): Promise<Blob | null> {
    if (!this.audioBuffer) return null;
    
    // Create a temporary offline context for rendering
    const offlineContext = new OfflineAudioContext(
      this.audioBuffer.numberOfChannels,
      this.audioBuffer.length,
      this.audioBuffer.sampleRate
    );
    
    // Set up effect chain in offline context
    const source = offlineContext.createBufferSource();
    source.buffer = this.audioBuffer;
    
    // Apply effects (simplified version of the live chain)
    const compressor = offlineContext.createDynamicsCompressor();
    const gainNode = offlineContext.createGain();
    
    source.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(offlineContext.destination);
    
    // Set effect parameters based on the live setup
    gainNode.gain.value = Math.pow(10, this.volume.volume.value / 20);
    
    // Render audio
    source.start();
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to WAV
    const wavData = this.audioBufferToWav(renderedBuffer);
    return new Blob([wavData], { type: 'audio/wav' });
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    // Simple WAV encoder (real implementation would be more robust)
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2;
    const dataView = new DataView(new ArrayBuffer(44 + length));
    
    // Write WAV header
    this.writeString(dataView, 0, 'RIFF');
    dataView.setUint32(4, 36 + length, true);
    this.writeString(dataView, 8, 'WAVE');
    this.writeString(dataView, 12, 'fmt ');
    dataView.setUint32(16, 16, true);
    dataView.setUint16(20, 1, true);
    dataView.setUint16(22, numOfChan, true);
    dataView.setUint32(24, buffer.sampleRate, true);
    dataView.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
    dataView.setUint16(32, numOfChan * 2, true);
    dataView.setUint16(34, 16, true);
    this.writeString(dataView, 36, 'data');
    dataView.setUint32(40, length, true);
    
    // Write audio data
    const channelData = [];
    for (let i = 0; i < numOfChan; i++) {
      channelData.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        const sample = channelData[channel][i];
        // Convert float to int16
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        dataView.setInt16(offset, int16, true);
        offset += 2;
      }
    }
    
    return dataView.buffer;
  }

  /**
   * Helper to write strings to DataView
   */
  private writeString(dataView: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      dataView.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * Clean up player resources
   */
  private disposePlayer(): void {
    if (this.player) {
      this.player.stop();
      this.player.disconnect();
      this.player.dispose();
      this.player = null;
    }
  }

  /**
   * Clean up recorder resources
   */
  private disposeRecorder(): void {
    if (this.recorder) {
      this.recorder.close();
      this.recorder.disconnect();
      this.recorder.dispose();
      this.recorder = null;
    }
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.disposePlayer();
    this.disposeRecorder();
    
    this.analyzer.dispose();
    this.compressor.dispose();
    this.eq.dispose();
    this.panner.dispose();
    this.volume.dispose();
  }
}

/**
 * Interface for track options
 */
interface TrackOptions {
  volume?: number;
  pan?: number;
  muted?: boolean;
  soloed?: boolean;
}

/**
 * Interface for track processor options
 */
interface TrackProcessorOptions extends TrackOptions {
  output?: Tone.ToneAudioNode;
}

/**
 * Interface for compressor settings
 */
interface CompressorSettings {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  knee: number;
}

// Create and export a singleton instance
const audioProcessor = new AudioProcessor();
export default audioProcessor;