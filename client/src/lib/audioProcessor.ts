import * as Tone from 'tone';
import { TrackProcessor as TrackProcessorType } from './audio-types';

// Interface for track processor options
export interface TrackOptions {
  volume?: number;
  pan?: number;
  muted?: boolean;
  soloed?: boolean;
  effects?: any[];
}

// Interface for compressor settings
export interface CompressorSettings {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
}

/**
 * TrackProcessor handles individual audio tracks with effects
 */
class TrackProcessor implements TrackProcessorType {
  id: number;
  isMuted: boolean = false;
  isSoloed: boolean = false;
  private player: Tone.Player | null = null;
  private recorder: Tone.UserMedia | null = null;
  private panner: Tone.Panner;
  private volume: Tone.Volume;
  private eq: Tone.EQ3;
  private compressor: Tone.Compressor;
  private analyzer: Tone.Analyser;
  private output: Tone.ToneAudioNode;
  private audioBuffer: AudioBuffer | null = null;
  private recordingBuffer: AudioBuffer | null = null;
  private context: BaseAudioContext;
  private isPlaying: boolean = false;
  private storedMuteState: boolean = false;
  private _masterNode: Tone.ToneAudioNode | null = null;

  constructor(context: BaseAudioContext, id: number, options: TrackOptions = {}) {
    this.id = id;
    this.context = context;
    this.panner = new Tone.Panner(options.pan || 0);
    this.volume = new Tone.Volume({
      volume: options.muted ? -Infinity : (options.volume !== undefined ? 20 * Math.log10(options.volume) : 0)
    });
    
    this.eq = new Tone.EQ3();
    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 3,
      attack: 0.003,
      release: 0.25
    });
    
    this.analyzer = new Tone.Analyser('waveform', 1024);
    
    // Connect the processing chain
    this.eq.connect(this.compressor);
    this.compressor.connect(this.panner);
    this.panner.connect(this.volume);
    this.volume.connect(this.analyzer);
    
    // Output node is the last in our chain
    this.output = this.volume;
    
    // Set initial states
    this.isMuted = options.muted || false;
    this.storedMuteState = this.isMuted;
    this.isSoloed = options.soloed || false;
  }

  setVolume(volume: number): void {
    // Convert from linear scale to dB
    const dbVolume = volume === 0 ? -Infinity : 20 * Math.log10(volume);
    this.volume.volume.value = dbVolume;
  }

  setPan(pan: number): void {
    this.panner.pan.value = Math.max(-1, Math.min(1, pan));
  }

  setMuted(muted: boolean, storeState: boolean = true): void {
    this.isMuted = muted;
    if (storeState) {
      this.storedMuteState = muted;
    }
    
    // Update the volume node
    this.volume.volume.value = muted ? -Infinity : (this.isSoloed ? 0 : this.volume.volume.value);
  }
  
  /**
   * Reset mute state to its stored value
   */
  resetMuteState(): void {
    this.setMuted(this.storedMuteState, false);
  }

  setSolo(soloed: boolean): void {
    this.isSoloed = soloed;
    // When soloed, bring volume to 0dB (unless muted)
    if (soloed && !this.isMuted) {
      this.volume.volume.value = 0;
    }
  }

  play(startTime: number = 0, offset: number = 0, duration?: number): void {
    console.log(`TrackProcessor.play called for track ${this.id} - Has player: ${!!this.player}, Loaded: ${this.player?.loaded}`);
    
    if (!this.player || !this.player.loaded) {
      console.warn(`Cannot play track ${this.id}: no player available or not loaded yet`);
      
      // Critical issue: Check if we can recover by attempting to reload audio
      if (this.audioBuffer) {
        console.log(`Track ${this.id} has audioBuffer but no player, attempting to create player`);
        try {
          // Create player from existing buffer
          this.player = new Tone.Player(this.audioBuffer).connect(this.eq);
          console.log(`Created new player for track ${this.id} from buffer`);
          
          // Ensure player is fully loaded before continuing
          if (!this.player.loaded) {
            console.log(`Waiting for player to load for track ${this.id}`);
            // We'll try to continue anyway since Tone.js should handle this internally
          }
        } catch (e) {
          console.error(`Failed to create player from buffer for track ${this.id}:`, e);
          return;
        }
      } else {
        console.error(`Track ${this.id} has no audio buffer, cannot play`);
        return;
      }
    }
    
    try {
      // Stop playback if already playing
      if (this.isPlaying) {
        console.log(`Track ${this.id} is already playing, stopping first`);
        this.player.stop();
      }
      
      // Calculate actual start time including any offset
      const actualStartTime = startTime + offset;
      console.log(`Playing track ${this.id} at time ${Tone.now()}, offset ${actualStartTime}${duration ? `, duration ${duration}` : ''}`);
      
      // Start playback with the specified parameters
      if (duration) {
        this.player.start(Tone.now(), actualStartTime, duration);
      } else {
        this.player.start(Tone.now(), actualStartTime);
      }
      
      this.isPlaying = true;
      console.log(`Track ${this.id} playback started successfully`);
    } catch (error) {
      console.error(`Error playing track ${this.id}:`, error);
    }
  }

  stop(): void {
    if (this.player) {
      this.player.stop();
      this.isPlaying = false;
    }
  }

  pause(): void {
    if (this.player) {
      this.player.stop();
      this.isPlaying = false;
    }
  }

  async loadAudio(source: string | File | AudioBuffer): Promise<void> {
    try {
      console.log(`TrackProcessor ${this.id}: Loading audio from`, typeof source === 'string' ? 'URL' : (source instanceof File ? 'File' : 'AudioBuffer'));
      
      if (this.player) {
        console.log(`TrackProcessor ${this.id}: Disposing existing player`);
        this.player.stop();
        this.player.disconnect();
        this.player.dispose();
        this.player = null;
      }
      
      // Handle different source types
      if (typeof source === 'string') {
        // URL string
        console.log(`TrackProcessor ${this.id}: Loading from URL: ${source.substring(0, 50)}...`);
        
        // First, try to fetch the audio data and create a buffer before creating the player
        // This can help avoid timing issues with streaming audio
        try {
          // Create a temporary audio element to load the audio
          const tempAudio = new Audio(source);
          
          console.log(`TrackProcessor ${this.id}: Created temporary audio element to preload audio`);
          
          // Preload the audio
          tempAudio.preload = 'auto';
          
          // Create a new player with the URL
          this.player = new Tone.Player(source, () => {
            if (this.player && this.player.buffer) {
              this.audioBuffer = this.player.buffer.get() as AudioBuffer;
              console.log(`TrackProcessor ${this.id}: Player loaded from URL callback, buffer duration: ${this.audioBuffer?.duration.toFixed(2)}s`);
            }
          }).connect(this.eq);
        } catch (preloadError) {
          console.warn(`TrackProcessor ${this.id}: Error preloading audio:`, preloadError);
          
          // Fall back to standard loading
          this.player = new Tone.Player(source, () => {
            if (this.player && this.player.buffer) {
              this.audioBuffer = this.player.buffer.get() as AudioBuffer;
              console.log(`TrackProcessor ${this.id}: Player loaded from URL callback, buffer duration: ${this.audioBuffer?.duration.toFixed(2)}s`);
            }
          }).connect(this.eq);
        }
        
        // Wait for the player to load
        await new Promise<void>((resolve, reject) => {
          if (!this.player) {
            reject(new Error('Player not created'));
            return;
          }
          
          const timeout = setTimeout(() => {
            reject(new Error('Audio load timed out'));
          }, 30000);
          
          // Check if it's already loaded
          if (this.player.loaded) {
            clearTimeout(timeout);
            if (this.player.buffer) {
              this.audioBuffer = this.player.buffer.get() as AudioBuffer;
              console.log(`TrackProcessor ${this.id}: Player already loaded, buffer duration: ${this.audioBuffer?.duration.toFixed(2)}s`);
            }
            resolve();
          } else {
            console.log(`TrackProcessor ${this.id}: Waiting for player to load...`);
            
            // Handle loading manually
            const checkLoaded = () => {
              if (this.player && this.player.loaded) {
                clearTimeout(timeout);
                if (this.player.buffer) {
                  this.audioBuffer = this.player.buffer.get() as AudioBuffer;
                  console.log(`TrackProcessor ${this.id}: Player loaded after waiting, buffer duration: ${this.audioBuffer?.duration.toFixed(2)}s`);
                }
                resolve();
              } else {
                // Check again in 100ms
                setTimeout(checkLoaded, 100);
              }
            };
            
            checkLoaded();
          }
        });
      } else if (source instanceof File) {
        // File object
        console.log(`TrackProcessor ${this.id}: Loading from File: ${source.name}, size: ${source.size} bytes`);
        const arrayBuffer = await source.arrayBuffer();
        console.log(`TrackProcessor ${this.id}: File converted to ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);
        
        const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        console.log(`TrackProcessor ${this.id}: File decoded to AudioBuffer, duration: ${audioBuffer.duration.toFixed(2)}s`);
        
        this.audioBuffer = audioBuffer;
        this.player = new Tone.Player(audioBuffer).connect(this.eq);
        console.log(`TrackProcessor ${this.id}: Player created from file`);
      } else if (source instanceof AudioBuffer) {
        // AudioBuffer object
        console.log(`TrackProcessor ${this.id}: Loading from AudioBuffer, duration: ${source.duration.toFixed(2)}s`);
        this.audioBuffer = source;
        this.player = new Tone.Player(source).connect(this.eq);
        console.log(`TrackProcessor ${this.id}: Player created from audio buffer`);
      } else {
        throw new Error('Unsupported audio source type');
      }
    } catch (error) {
      console.error(`TrackProcessor ${this.id}: Error loading audio:`, error);
      throw error;
    }
  }

  async startRecording(): Promise<void> {
    try {
      if (this.recorder) {
        this.recorder.close();
        this.recorder.dispose();
        this.recorder = null;
      }
      
      // Create and configure user media for input
      this.recorder = new Tone.UserMedia();
      
      // Open user media (microphone)
      await this.recorder.open();
      
      // Connect to track processing chain to monitor input
      this.recorder.connect(this.eq);
      
      // Set flag to indicate we're recording
      (this.recorder as any)._isRecording = true;
    } catch (error) {
      console.error('Failed to start track recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.recorder) {
      return null;
    }
    
    try {
      // Create an instance of Tone.Recorder to capture the output
      const toneRecorder = new Tone.Recorder();
      
      // Connect the user media directly to the recorder
      this.recorder.connect(toneRecorder);
      
      // Start the recorder (this captures the output)
      toneRecorder.start();
      
      // Keep recording for a short moment to capture any lingering audio
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Stop the Tone.Recorder to get the blob
      const audioBlob = await toneRecorder.stop();
      
      // Clean up the recorder resources
      try {
        this.recorder.close();
        this.recorder.dispose();
      } catch (e) {
        console.warn('Error closing user media:', e);
      }
      
      // Clear the recorder
      this.recorder = null;
      
      return audioBlob;
    } catch (error) {
      console.error('Error stopping track recording:', error);
      
      // Clean up resources on error
      if (this.recorder) {
        try {
          this.recorder.close();
          this.recorder.dispose();
          this.recorder = null;
        } catch (cleanupError) {
          console.warn('Error during recorder cleanup:', cleanupError);
        }
      }
      
      return null;
    }
  }

  connectOutput(node: any): void {
    this.output.connect(node);
    this._masterNode = node;
  }

  disconnectFromMaster(): void {
    this.output.disconnect();
  }

  getWaveform(): number[] {
    if (!this.analyzer) {
      return new Array(128).fill(0);
    }
    
    try {
      const data = this.analyzer.getValue() as Float32Array;
      // Convert Float32Array to regular number[]
      return Array.from(data);
    } catch (e) {
      console.error('Error getting waveform data:', e);
      return new Array(128).fill(0);
    }
  }

  dispose(): void {
    try {
      if (this.player) {
        this.player.stop();
        this.player.disconnect();
        this.player.dispose();
        this.player = null;
      }
      
      if (this.recorder) {
        this.recorder.close();
        this.recorder.dispose();
        this.recorder = null;
      }
      
      this.panner.disconnect();
      this.volume.disconnect();
      this.eq.disconnect();
      this.compressor.disconnect();
      this.analyzer.disconnect();
      
      this.panner.dispose();
      this.volume.dispose();
      this.eq.dispose();
      this.compressor.dispose();
      this.analyzer.dispose();
    } catch (e) {
      console.error('Error disposing track:', e);
    }
  }

  /**
   * Get the recording buffer if available
   */
  getRecordingBuffer(): AudioBuffer | null {
    return this.recordingBuffer;
  }

  /**
   * Export audio as a blob
   */
  async exportAudio(): Promise<Blob | null> {
    if (!this.audioBuffer) {
      return Promise.resolve(null);
    }
    
    try {
      // Create a recorder
      const recorder = new Tone.Recorder();
      const player = new Tone.Player(this.audioBuffer).connect(recorder);
      
      // Start recorder and play the buffer
      recorder.start();
      player.start();
      
      // When the buffer is done playing, stop the recorder and get the blob
      return new Promise<Blob | null>((resolve) => {
        const duration = this.audioBuffer ? this.audioBuffer.duration : 0;
        
        // Wait slightly longer than the duration to ensure everything is captured
        setTimeout(async () => {
          player.stop();
          const blob = await recorder.stop();
          
          // Clean up
          player.dispose();
          recorder.dispose();
          
          resolve(blob);
        }, (duration * 1000) + 100);
      });
    } catch (e) {
      console.error('Error exporting audio:', e);
      return Promise.resolve(null);
    }
  }
}

/**
 * Main audio processor for the digital audio workstation
 * Handles the master audio processing chain and track management
 */
export class AudioProcessor {
  private context: BaseAudioContext;
  private masterCompressor: Tone.Compressor;
  private masterLimiter: Tone.Limiter;
  private masterGain: Tone.Gain;
  private eqBands: Tone.EQ3;
  private analyzer: Tone.Analyser;
  private spectralAnalyzer: Tone.FFT;
  private loudnessAnalyzer: Tone.Meter;
  private recorder: Tone.Recorder | null = null;
  private reverbProcessor: Tone.Reverb | null = null;
  private tracks: Map<number, TrackProcessor> = new Map();
  private isInitialized: boolean = false;
  private userMedia: Tone.UserMedia | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private player: Tone.Player | null = null;
  
  constructor() {
    this.context = Tone.getContext().rawContext;
    this.masterCompressor = new Tone.Compressor({
      threshold: -24,
      ratio: 3,
      attack: 0.003,
      release: 0.25
    });
    
    this.masterLimiter = new Tone.Limiter(-0.1);
    this.masterGain = new Tone.Gain(0.9);
    this.eqBands = new Tone.EQ3();
    
    // Set up audio analysis tools
    this.analyzer = new Tone.Analyser('waveform', 1024);
    this.spectralAnalyzer = new Tone.FFT(2048);
    this.loudnessAnalyzer = new Tone.Meter();
    
    // Connect the master processing chain
    this.eqBands.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterGain);
    this.masterGain.connect(this.analyzer);
    this.masterGain.connect(this.spectralAnalyzer);
    this.masterGain.connect(this.loudnessAnalyzer);
    this.masterGain.toDestination();
    
    // Initialize advanced effects
    this.initializeAdvancedEffects();
  }
  
  /**
   * Initialize premium audio effect processors
   */
  private async initializeAdvancedEffects(): Promise<void> {
    try {
      // Initialize a higher quality reverb processor
      this.reverbProcessor = new Tone.Reverb({
        decay: 1.5,
        preDelay: 0.01,
        wet: 0
      });
      
      // Generate the reverb impulse response
      await this.reverbProcessor.generate();
    } catch (error) {
      console.error('Failed to initialize advanced effects:', error);
    }
  }
  
  /**
   * Check if the audio processor has been initialized
   */
  isReady(): boolean {
    return this.isInitialized && Tone.getContext().state === 'running';
  }
  
  /**
   * Initialize the audio processor and start the audio context
   * This must be called from a user interaction (click, tap) to comply with browser autoplay policies
   */
  async init(): Promise<void> {
    await this.initialize();
  }
  
  /**
   * Initialize the audio processor and start the audio context
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Audio processor already initialized');
      return;
    }
    
    try {
      await Tone.start();
      Tone.Transport.start();
      this.isInitialized = true;
      console.log('Audio processor and Tone.js initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      throw error;
    }
  }

  /**
   * Ensure audio context is running (call from UI event handlers)
   */
  async ensureAudioContextRunning(): Promise<void> {
    if (Tone.getContext().state !== 'running') {
      try {
        await Tone.start();
        console.log('Audio context started successfully');
      } catch (error) {
        console.error('Failed to start audio context:', error);
        throw error;
      }
    }
  }
  
  /**
   * Create a new track with the given ID and settings
   */
  createTrack(trackId: number, options: TrackOptions = {}): TrackProcessorType {
    if (this.tracks.has(trackId)) {
      console.warn(`Track ${trackId} already exists, returning existing track`);
      return this.tracks.get(trackId)!;
    }
    
    const track = new TrackProcessor(this.context, trackId, options);
    
    // Connect the track to the master chain
    track.connectOutput(this.eqBands);
    this.tracks.set(trackId, track);
    
    console.log(`Created new track with ID: ${trackId}`);
    return track;
  }
  
  /**
   * Remove a track with the given ID
   */
  removeTrack(trackId: number): boolean {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.warn(`Track ${trackId} not found`);
      return false;
    }
    
    // Disconnect and clean up
    track.disconnectFromMaster();
    track.dispose();
    this.tracks.delete(trackId);
    
    console.log(`Removed track with ID: ${trackId}`);
    return true;
  }
  
  /**
   * Get a track by ID
   */
  getTrack(trackId: number): TrackProcessorType | undefined {
    const track = this.tracks.get(trackId);
    
    // Add logging to help debug track issues
    if (track) {
      console.log(`Retrieved track ${trackId} - Has player: ${!!track['player']}, Has audio buffer: ${!!track['audioBuffer']}`);
    } else {
      console.warn(`No track found with ID ${trackId}`);
    }
    
    return track;
  }
  
  /**
   * Get all track IDs
   */
  getTrackIds(): number[] {
    return Array.from(this.tracks.keys());
  }
  
  /**
   * Set the master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Set the BPM (beats per minute)
   */
  setBpm(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }
  
  /**
   * Get the current playback position in seconds
   */
  getPlaybackPosition(): number {
    return Tone.Transport.seconds;
  }
  
  /**
   * Set the playback position
   */
  setPosition(time: number): void {
    Tone.Transport.seconds = time;
  }
  
  /**
   * Start playing all tracks
   */
  play(): void {
    console.log(`AudioProcessor.play called - number of tracks: ${this.tracks.size}`);
    
    if (this.tracks.size === 0) {
      console.warn('No tracks available to play');
      return;
    }
    
    const trackIds = Array.from(this.tracks.keys()).join(', ');
    console.log(`Playing tracks with IDs: ${trackIds}`);
    
    // Ensure audio context is running
    const context = Tone.getContext();
    if (context.state !== 'running') {
      console.warn('Audio context is not running, attempting to start...');
      Tone.start().then(() => {
        console.log('Audio context started successfully, now playing tracks');
        this.playAllTracks();
      }).catch(err => {
        console.error('Failed to start audio context:', err);
      });
    } else {
      // Context is already running, proceed with playback
      this.playAllTracks();
    }
  }
  
  /**
   * Helper method to play all tracks once context is confirmed running
   * This separates the context start from the actual playback logic
   */
  private playAllTracks(): void {
    // Get current transport position
    const currentPosition = Tone.Transport.seconds;
    console.log(`Current transport position for playback: ${currentPosition}s`);
    
    let tracksWithAudio = 0;
    
    // Start playback from the current transport position
    this.tracks.forEach((track, id) => {
      // Access private properties for debug logging only
      const hasPlayer = !!(track as any).player;
      const playerLoaded = hasPlayer && !!(track as any).player.loaded;
      const hasBuffer = !!(track as any).audioBuffer;
      
      console.log(`Track ${id} state - Has player: ${hasPlayer}, Player loaded: ${playerLoaded}, Has buffer: ${hasBuffer}`);
      
      if (hasPlayer && playerLoaded) {
        tracksWithAudio++;
        
        // Calculate playback parameters based on transport position
        // If there was specific region data available, we'd use that here
        const offset = currentPosition;
        console.log(`Playing track ${id} from position ${currentPosition}`);
        track.play(0, offset);
      } else if (hasBuffer) {
        // Track has buffer but player isn't ready, attempt to reinitialize the player
        console.log(`Track ${id} has buffer but player not ready, attempting to initialize`);
        try {
          // Recreate the player from the buffer
          (track as any).player = new Tone.Player((track as any).audioBuffer).connect((track as any).eq);
          console.log(`Recreated player for track ${id}, attempting playback again`);
          
          // Attempt playback again with recreated player
          setTimeout(() => {
            track.play(0, currentPosition);
          }, 100); // Small delay to ensure player is set up
          
          tracksWithAudio++;
        } catch (error) {
          console.error(`Failed to reinitialize player for track ${id}:`, error);
        }
      } else {
        console.log(`Track ${id} has no audio data loaded, skipping playback`);
      }
    });
    
    console.log(`Playback initiated for ${tracksWithAudio} tracks with audio data`);
    
    if (tracksWithAudio === 0) {
      console.warn('No tracks have audio data loaded, playback may not produce sound');
    }
    
    console.log('All tracks playback initiated');
  }
  
  /**
   * Pause all tracks
   */
  pause(): void {
    this.tracks.forEach(track => {
      track.pause();
    });
  }
  
  /**
   * Stop all tracks
   */
  stop(): void {
    this.tracks.forEach(track => {
      track.stop();
    });
  }

  /**
   * Play a specific audio buffer (for previewing)
   */
  playBuffer(buffer: AudioBuffer): void {
    if (this.player) {
      this.player.stop();
      this.player.disconnect();
      this.player.dispose();
    }
    
    this.player = new Tone.Player(buffer).toDestination();
    this.player.start();
  }
  
  /**
   * Stop playback of the preview player
   */
  stopPlayback(): void {
    if (this.player) {
      this.player.stop();
    }
  }
  
  /**
   * Get waveform data for visualization
   */
  getWaveform(): number[] {
    try {
      const data = this.analyzer.getValue() as Float32Array;
      return Array.from(data);
    } catch (e) {
      console.error('Error getting master waveform data:', e);
      return new Array(128).fill(0);
    }
  }
  
  /**
   * Start recording from the microphone
   */
  startRecording(onWaveformUpdate?: (waveform: Float32Array) => void): void {
    if (this.recorder) {
      this.recorder.stop();
      this.recorder.dispose();
      this.recorder = null;
    }
    
    // Create recorder and user media
    this.recorder = new Tone.Recorder();
    this.userMedia = new Tone.UserMedia();
    
    // Handle waveform updates if needed
    let analyzer: Tone.Analyser | null = null;
    let waveformInterval: number | null = null;
    
    if (onWaveformUpdate) {
      analyzer = new Tone.Analyser('waveform', 512);
      waveformInterval = window.setInterval(() => {
        if (analyzer) {
          const waveformData = analyzer.getValue() as Float32Array;
          onWaveformUpdate(waveformData);
        } else if (waveformInterval !== null) {
          window.clearInterval(waveformInterval);
        }
      }, 50);
    }
    
    // Open microphone and connect to recorder
    this.userMedia.open()
      .then(() => {
        if (this.recorder && this.userMedia) {
          if (analyzer) this.userMedia.connect(analyzer);
          this.userMedia.connect(this.recorder);
          this.recorder.start();
        }
      })
      .catch(error => {
        console.error('Failed to open microphone:', error);
        if (analyzer) analyzer.dispose();
        if (waveformInterval !== null) window.clearInterval(waveformInterval);
      });
  }
  
  /**
   * Stop recording and return the audio blob
   */
  async stopRecording(): Promise<Blob | null> {
    if (!this.recorder || !this.userMedia) {
      return null;
    }
    
    try {
      const blob = await this.recorder.stop();
      this.userMedia.close();
      this.userMedia.dispose();
      this.userMedia = null;
      this.recorder.dispose();
      this.recorder = null;
      return blob;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return null;
    }
  }
  
  /**
   * Clean up and dispose of resources
   */
  dispose(): void {
    this.tracks.forEach(track => {
      track.dispose();
    });
    this.tracks.clear();
    
    if (this.recorder) {
      this.recorder.dispose();
      this.recorder = null;
    }
    
    if (this.userMedia) {
      this.userMedia.close();
      this.userMedia.dispose();
      this.userMedia = null;
    }
    
    if (this.player) {
      this.player.stop();
      this.player.dispose();
      this.player = null;
    }
    
    this.masterCompressor.dispose();
    this.masterLimiter.dispose();
    this.masterGain.dispose();
    this.eqBands.dispose();
    this.analyzer.dispose();
    this.spectralAnalyzer.dispose();
    this.loudnessAnalyzer.dispose();
    
    if (this.reverbProcessor) {
      this.reverbProcessor.dispose();
    }
  }
}

export default AudioProcessor;