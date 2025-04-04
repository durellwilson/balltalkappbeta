import * as Tone from 'tone';
import type { 
  AudioTrigger, 
  AudioTrackOptions,
  TrackProcessorOptions,
  AudioProcessorOptions,
  RecordingOptions,
  RecordingState,
  PlaybackState,
  AudioRegion
} from './audio-types';

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
 * Main audio processor for the digital audio workstation
 * Handles the master audio processing chain and track management
 */
export class AudioProcessor {
  private context: Tone.Context['rawContext'];
  private masterCompressor: Tone.Compressor;
  private masterLimiter: Tone.Limiter;
  private masterGain: Tone.Gain;
  private eqBands: Tone.EQ3;
  private analyzer: Tone.Analyser;
  private spectralAnalyzer: Tone.FFT;
  private loudnessAnalyzer: Tone.Meter;
  private recorder: Tone.Recorder | null = null;
  private reverbProcessor: Tone.Reverb | null = null;
  private spectralProcessor: Tone.Chebyshev | null = null;
  private exciter: Tone.FrequencyShifter | null = null;
  private tracks: Map<number, TrackProcessor> = new Map();
  private workletNode: AudioWorkletNode | null = null;
  private processingActive: boolean = false;
  private isInitialized: boolean = false;
  private lufsTarget: number = -14; // Industry standard for streaming
  private workletReady: boolean = false;
  private processingLatency: number = 0;
  
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
    this.initializeAdvancedEffects().catch(error => {
      console.error('Failed to initialize advanced effects:', error);
    });
    
    // Add worklet initialization
    this.initializeWorklet().catch(error => {
      console.warn('Audio worklet initialization failed, using fallback:', error);
    });
    
    console.log('AudioProcessor initialized with professional processing chain');
  }
  
  /**
   * Initialize premium audio effect processors including AI-enhanced voice effects
   */
  private async initializeAdvancedEffects(): Promise<void> {
    try {
      // Initialize a higher quality reverb processor
      this.reverbProcessor = new Tone.Reverb({
        decay: 1.5,
        preDelay: 0.01,
        wet: 0
      });
      
      // Initialize harmonic exciter (for adding presence to vocals)
      this.exciter = new Tone.FrequencyShifter(0);
      
      // Initialize spectral processor (for sound design and special effects)
      this.spectralProcessor = new Tone.Chebyshev(1);
      
      // These are created but not connected to the chain by default
      // They will be used in specific processing scenarios
      await this.reverbProcessor.generate();
      console.log('Advanced audio effects initialized successfully');
    } catch (error) {
      console.error('Failed to initialize advanced effects:', error);
    }
  }
  
  /**
   * Check if the audio processor has been initialized
   * @returns Whether the audio processor is initialized
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
   * This must be called from a user interaction (click, tap) to comply with browser autoplay policies
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
   * Initialize and load audio worklet for low-latency processing
   */
  private async initializeWorklet(): Promise<void> {
    try {
      await this.context.audioWorklet.addModule('/worklets/processor.js');
      this.workletNode = new AudioWorkletNode(this.context, 'custom-processor');
      this.workletReady = true;
      this.processingLatency = (this.workletNode.parameters.get('latency')?.value || 0) / 1000;
      console.log(`Audio worklet initialized with ${this.processingLatency}ms latency`);
    } catch (error) {
      console.warn('Audio worklet not supported, using fallback processing:', error);
      this.workletReady = false;
      this.processingLatency = 0.029; // Typical Web Audio API latency
    }
  }
  
  /**
   * Create a new track with the given ID and settings
   */
  createTrack(trackId: number, options: TrackOptions = {}): TrackProcessor {
    if (this.tracks.has(trackId)) {
      console.warn(`Track ${trackId} already exists, returning existing track`);
      return this.tracks.get(trackId)!;
    }
    
    const track = new TrackProcessor(this.context, {
      volume: options.volume !== undefined ? options.volume : 1,
      pan: options.pan !== undefined ? options.pan : 0,
      muted: options.muted !== undefined ? options.muted : false,
      soloed: options.soloed !== undefined ? options.soloed : false,
      effects: options.effects || []
    });
    
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
   * This will play all tracks at the current transport position
   */
  play(): void {
    this.tracks.forEach(track => {
      track.play();
    });
    console.log('Starting playback of all tracks');
  }
  
  /**
   * Stop transport/playback
   * This will stop all tracks and reset the playback position
   */
  stop(): void {
    this.tracks.forEach(track => {
      track.stop();
    });
    console.log('All playback stopped');
  }
  
  /**
   * Pause transport/playback
   * This will pause all tracks at their current position
   */
  pause(): void {
    this.tracks.forEach(track => {
      track.pause();
    });
    console.log('All playback paused');
  }
  
  /**
   * Set the BPM (beats per minute)
   */
  setBpm(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
    console.log(`BPM set to ${bpm}`);
  }
  
  /**
   * Get the current BPM
   */
  getBpm(): number {
    return Tone.Transport.bpm.value;
  }
  
  /**
   * Set the playback position
   */
  setPosition(time: number): void {
    Tone.Transport.seconds = time;
    console.log(`Playback position set to ${time}s`);
  }
  
  /**
   * Get the current playback position in seconds
   */
  getPlaybackPosition(): number {
    return Tone.Transport.seconds;
  }
  
  /**
   * Get the raw audio context for advanced operations
   */
  getAudioContext(): BaseAudioContext {
    return this.context;
  }
  
  /**
   * Set the master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    console.log(`Master volume set to ${volume}`);
  }
  
  /**
   * Set EQ settings
   */
  setEQ(low: number, mid: number, high: number): void {
    this.eqBands.low.value = low;
    this.eqBands.mid.value = mid;
    this.eqBands.high.value = high;
    console.log(`EQ set to low: ${low}, mid: ${mid}, high: ${high}`);
  }
  
  /**
   * Set compressor settings
   */
  setCompressor(settings: Partial<CompressorSettings>): void {
    if (settings.threshold !== undefined) {
      this.masterCompressor.threshold.value = settings.threshold;
    }
    
    if (settings.ratio !== undefined) {
      this.masterCompressor.ratio.value = settings.ratio;
    }
    
    if (settings.attack !== undefined) {
      this.masterCompressor.attack.value = settings.attack;
    }
    
    if (settings.release !== undefined) {
      this.masterCompressor.release.value = settings.release;
    }
    
    console.log('Compressor settings updated:', settings);
  }
  
  /**
   * Set limiter threshold
   */
  setLimiterThreshold(threshold: number): void {
    this.masterLimiter.threshold.value = threshold;
    console.log(`Limiter threshold set to ${threshold} dB`);
  }
  
  /**
   * Set LUFS target
   */
  setLufsTarget(lufs: number): void {
    this.lufsTarget = lufs;
    console.log(`LUFS target set to ${lufs} dB`);
    
    // In a real implementation, this would analyze the signal and make dynamic adjustments
    const estimatedGain = Math.pow(10, (this.lufsTarget + 23) / 20);
    this.masterGain.gain.value = Math.max(0, Math.min(1, estimatedGain));
  }

  /**
   * Start recording the master output with real-time waveform visualization
   * 
   * @param onWaveformUpdate Optional callback to receive real-time waveform data for visualization
   */
  startRecording(onWaveformUpdate?: (waveform: Float32Array) => void): void {
    console.log('AudioProcessor: Starting recording with direct microphone approach');
    
    // First, ensure we don't have any existing recording in progress
    if (this.recorder) {
      try {
        this.recorder.stop();
        this.recorder.dispose();
        this.recorder = null;
      } catch (e) {
        console.warn('Error cleaning up previous recorder:', e);
      }
    }
    
    // Create a direct recorder for reliable recording
    this.recorder = new Tone.Recorder();
    
    // Set up a user media capture that will connect directly to our recorder
    const userMedia = new Tone.UserMedia();
    
    // Also connect to an analyzer for real-time visualization
    let analyzer: Tone.Analyser | null = null;
    let waveformInterval: number | null = null;
    
    if (onWaveformUpdate) {
      analyzer = new Tone.Analyser('waveform', 512);
      userMedia.connect(analyzer);
      
      // Poll the analyzer at regular intervals to update the visualization
      waveformInterval = window.setInterval(() => {
        if (analyzer) {
          const waveformData = analyzer.getValue() as Float32Array;
          onWaveformUpdate(waveformData);
        } else {
          // If analyzer is gone, clean up the interval
          if (waveformInterval !== null) {
            window.clearInterval(waveformInterval);
            waveformInterval = null;
          }
        }
      }, 50); // Update at 20fps for smooth visualization
    }
    
    // When the user media is ready, connect it to the recorder
    userMedia.open()
      .then(() => {
        console.log('Microphone opened successfully for recording');
        
        // Connect the microphone to our recorder
        userMedia.connect(this.recorder!);
        
        // Start the recorder
        this.recorder!.start();
        console.log('Recorder started successfully');
        
        // Store user media for later cleanup
        (this.recorder as any)._userMedia = userMedia;
        (this.recorder as any)._analyzer = analyzer;
        (this.recorder as any)._waveformInterval = waveformInterval;
        
        this.processingActive = true;
      })
      .catch(error => {
        console.error('Failed to open microphone for recording:', error);
        
        // Clean up resources on error
        if (analyzer) {
          analyzer.dispose();
        }
        
        if (waveformInterval !== null) {
          window.clearInterval(waveformInterval);
        }
        
        if (this.recorder) {
          this.recorder.dispose();
          this.recorder = null;
        }
        
        // Re-throw the error for the caller to handle
        throw error;
      });
  }

  /**
   * Stop recording and return the audio blob
   * @returns Promise that resolves to a Blob containing the recorded audio
   */
  async stopRecording(): Promise<Blob | null> {
    console.log('AudioProcessor: Stopping recording');
    
    if (!this.recorder) {
      console.warn('No recorder found when stopping recording');
      return null;
    }
    
    try {
      // Clean up any resources we stored on the recorder
      const userMedia = (this.recorder as any)._userMedia as Tone.UserMedia | undefined;
      const analyzer = (this.recorder as any)._analyzer as Tone.Analyser | undefined;
      const waveformInterval = (this.recorder as any)._waveformInterval as number | undefined;
      
      // Clear the waveform update interval if it exists
      if (waveformInterval !== undefined) {
        window.clearInterval(waveformInterval);
        (this.recorder as any)._waveformInterval = null;
      }
      
      // Get the recording blob before we close anything
      const recordingBlob = await this.recorder.stop();
      console.log('Successfully captured recording blob, size:', recordingBlob?.size);
      
      // Clean up the user media
      if (userMedia) {
        try {
          userMedia.close();
          userMedia.dispose();
          (this.recorder as any)._userMedia = null;
        } catch (e) {
          console.warn('Error cleaning up user media:', e);
        }
      }
      
      // Clean up the analyzer
      if (analyzer) {
        try {
          analyzer.dispose();
          (this.recorder as any)._analyzer = null;
        } catch (e) {
          console.warn('Error cleaning up analyzer:', e);
        }
      }
      
      // Clean up the recorder
      try {
        this.recorder.dispose();
      } catch (e) {
        console.warn('Error disposing recorder:', e);
      }
      
      // Clear the recorder
      this.recorder = null;
      
      // Reset state
      this.processingActive = false;
      
      return recordingBlob;
    } catch (error) {
      console.error('Error stopping recording:', error);
      
      // Make sure we clean up even on error
      try {
        if (this.recorder) {
          // Try to dispose of the recorder and its resources
          const userMedia = (this.recorder as any)._userMedia as Tone.UserMedia | undefined;
          const analyzer = (this.recorder as any)._analyzer as Tone.Analyser | undefined;
          const waveformInterval = (this.recorder as any)._waveformInterval as number | undefined;
          
          if (waveformInterval) {
            window.clearInterval(waveformInterval);
          }
          
          if (userMedia) {
            userMedia.close();
            userMedia.dispose();
          }
          
          if (analyzer) {
            analyzer.dispose();
          }
          
          this.recorder.dispose();
          this.recorder = null;
        }
      } catch (cleanupError) {
        console.warn('Error during cleanup after recording error:', cleanupError);
      }
      
      this.processingActive = false;
      return null;
    }
  }
  
  // Add methods to process existing tracks once AI-enhanced processing is implemented
  
  /**
   * Process audio based on user-selected algorithms and models
   * Will be extended with actual AI processing in future versions
   */
  async enhanceAudio(trackId: number, options: {
    clarity?: number;
    noiseSuppression?: boolean;
    bassBoost?: number;
    stereoWidening?: number;
    denoise?: boolean;
    eq?: boolean;
    compression?: boolean;
  }): Promise<boolean> {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.warn(`Track ${trackId} not found`);
      return false;
    }
    
    // Here's where we would apply the AI processing models
    // This is just a placeholder for the real implementation
    
    return true;
  }
  
  /**
   * Perform loudness normalization on a track for professional levels
   */
  async normalizeLoudness(trackId: number, targetLUFS: number = -14): Promise<boolean> {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.warn(`Track ${trackId} not found`);
      return false;
    }
    
    try {
      // In a real implementation, we would analyze the track's LUFS level
      // and apply a volume adjustment to match the target
      
      // This is a simplified version that just uses a volume adjustment
      // based on what would typically be needed
      const estimatedAdjustment = 0.8; // In a real implementation, this would be calculated
      track.setVolume(estimatedAdjustment);
      
      return true;
    } catch (error) {
      console.error(`Failed to normalize loudness for track ${trackId}:`, error);
      return false;
    }
  }
  
  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Clean up the tracks
    this.tracks.forEach((track, id) => {
      track.dispose();
    });
    this.tracks.clear();
    
    // Clean up the recorder if it exists
    if (this.recorder) {
      this.recorder.dispose();
      this.recorder = null;
    }
    
    // Clean up all the effects
    if (this.reverbProcessor) {
      this.reverbProcessor.dispose();
      this.reverbProcessor = null;
    }
    
    if (this.spectralProcessor) {
      this.spectralProcessor.dispose();
      this.spectralProcessor = null;
    }
    
    if (this.exciter) {
      this.exciter.dispose();
      this.exciter = null;
    }
    
    // Clean up the master chain
    this.analyzer.dispose();
    this.spectralAnalyzer.dispose();
    this.loudnessAnalyzer.dispose();
    this.masterCompressor.dispose();
    this.masterLimiter.dispose();
    this.masterGain.dispose();
    this.eqBands.dispose();
    
    this.isInitialized = false;
    this.processingActive = false;
    
    console.log('AudioProcessor resources disposed');
  }
  
  /**
   * Apply a real-time effect to all tracks
   */
  applyGlobalEffect(effect: string, value: number): void {
    switch (effect) {
      case 'reverb':
        if (this.reverbProcessor) {
          this.reverbProcessor.wet.value = value;
        }
        break;
      case 'exciter':
        if (this.exciter) {
          this.exciter.frequency.value = value * 2000;
        }
        break;
      case 'spectral':
        if (this.spectralProcessor) {
          this.spectralProcessor.order = Math.floor(value * 50);
        }
        break;
      default:
        console.warn(`Unknown global effect: ${effect}`);
    }
  }
  
  /**
   * Check if tracks are soloed and handle the routing accordingly
   */
  updateSoloState(): void {
    const hasSoloedTracks = Array.from(this.tracks.values()).some(track => track.isSoloed());
    
    this.tracks.forEach(track => {
      if (hasSoloedTracks) {
        // If any track is soloed, mute all non-soloed tracks
        if (!track.isSoloed() && !track.isMuted()) {
          track.setMuted(true, false); // Mute without affecting the stored mute state
        } else if (track.isSoloed() && track.isMuted()) {
          track.setMuted(false, false); // Unmute without affecting the stored mute state
        }
      } else {
        // If no track is soloed, restore original mute states
        track.resetMuteState();
      }
    });
  }
}

/**
 * TrackProcessor handles individual audio tracks with effects
 */
export class TrackProcessor {
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
  private recordingBuffer: AudioBuffer | null = null;
  private context: Tone.Context['rawContext'];
  private isPlaying: boolean = false;
  private storedMuteState: boolean = false;

  constructor(context: BaseAudioContext, options: TrackOptions = {}) {
    this.context = context as Tone.Context['rawContext'];
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
    this.muted = options.muted || false;
    this.storedMuteState = this.muted;
    this.soloed = options.soloed || false;
  }
  
  /**
   * Set the audio buffer for this track
   */
  setBuffer(buffer: AudioBuffer): void {
    // Dispose of the old player if it exists
    if (this.player) {
      this.player.stop();
      this.player.disconnect();
      this.player.dispose();
    }
    
    // Create a new player with the buffer
    this.player = new Tone.Player(buffer);
    this.player.connect(this.eq);
    this.audioBuffer = buffer;
    
    console.log('Track buffer set, duration:', buffer.duration.toFixed(2), 'seconds');
  }
  
  /**
   * Load audio from a URL or blob URL
   * @param url URL or blob URL of the audio file to load
   * @returns Promise that resolves when the audio is loaded
   */
  async loadAudio(url: string): Promise<void> {
    try {
      console.log('Loading audio from URL:', url);
      
      if (this.player) {
        this.player.stop();
        this.player.disconnect();
        this.player.dispose();
        this.player = null;
      }
      
      // Create a new player with the URL
      this.player = new Tone.Player(url, () => {
        console.log('Audio loaded successfully, duration:', this.player?.buffer.duration.toFixed(2), 'seconds');
        if (this.player && this.player.buffer) {
          this.audioBuffer = this.player.buffer.get() as AudioBuffer;
        }
      }).connect(this.eq);
      
      // Wait for the player to load
      await new Promise<void>((resolve, reject) => {
        if (!this.player) {
          reject(new Error('Player not created'));
          return;
        }
        
        this.player.onstop = () => resolve();
        
        // Set a timeout in case the load never completes
        const timeout = setTimeout(() => {
          reject(new Error('Audio load timed out'));
        }, 30000);
        
        // Check if it's already loaded
        if (this.player.loaded) {
          clearTimeout(timeout);
          if (this.player.buffer) {
            this.audioBuffer = this.player.buffer.get() as AudioBuffer;
          }
          resolve();
        } else {
          // Handle loading manually since the player might not have load() as a promise
          // This is a workaround for different Tone.js versions
          if (typeof this.player.load === 'function') {
            // For newer Tone.js versions - some versions require an empty param
            this.player.load('').then(() => {
              clearTimeout(timeout);
              if (this.player && this.player.buffer) {
                this.audioBuffer = this.player.buffer.get() as AudioBuffer;
              }
              resolve();
            });
          } else {
            // Fallback for older versions
            // Wait for the buffer to be available
            const checkLoaded = () => {
              if (this.player && this.player.loaded) {
                clearTimeout(timeout);
                if (this.player.buffer) {
                  this.audioBuffer = this.player.buffer.get() as AudioBuffer;
                }
                resolve();
              } else {
                // Check again in 100ms
                setTimeout(checkLoaded, 100);
              }
            };
            
            checkLoaded();
          }
        }
      });
      
      console.log('Audio loaded and ready to play');
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }
  
  /**
   * Play the track
   * @param startTime Optional time within the audio file to start playback from (in seconds)
   * @param offset Optional offset to add to the current transport time (for regions)
   * @param duration Optional duration to play (for clips/regions)
   */
  play(startTime: number = 0, offset: number = 0, duration?: number): void {
    if (!this.player || !this.player.loaded) {
      console.warn('Cannot play track: no player available');
      return;
    }
    
    try {
      // Stop playback if already playing
      if (this.isPlaying) {
        this.player.stop();
      }
      
      // Calculate actual start time including any offset
      const actualStartTime = startTime + offset;
      console.log(`Playing track from position ${actualStartTime}s`);
      
      // Start playback with the specified parameters
      if (duration) {
        this.player.start(Tone.now(), actualStartTime, duration);
        console.log(`Playing for duration: ${duration}s`);
      } else {
        this.player.start(Tone.now(), actualStartTime);
      }
      
      this.isPlaying = true;
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }
  
  /**
   * Stop playback
   */
  stop(): void {
    if (this.player) {
      this.player.stop();
      this.isPlaying = false;
    }
  }
  
  /**
   * Pause playback
   */
  pause(): void {
    if (this.player) {
      this.player.stop();
      this.isPlaying = false;
    }
  }
  
  /**
   * Set track volume (0-1)
   */
  setVolume(volume: number): void {
    // Convert from linear scale to dB
    const dbVolume = volume === 0 ? -Infinity : 20 * Math.log10(volume);
    this.volume.volume.value = dbVolume;
  }
  
  /**
   * Get track volume (0-1)
   */
  getVolume(): number {
    // Convert from dB to linear scale
    return this.volume.volume.value === -Infinity ? 0 : Math.pow(10, this.volume.volume.value / 20);
  }
  
  /**
   * Set track pan (-1 to 1)
   */
  setPan(pan: number): void {
    this.panner.pan.value = Math.max(-1, Math.min(1, pan));
  }
  
  /**
   * Get track pan
   */
  getPan(): number {
    return this.panner.pan.value;
  }
  
  /**
   * Mute/unmute the track
   * @param muted Whether to mute the track
   * @param storeState Whether to store this mute state (for solo functionality)
   */
  setMuted(muted: boolean, storeState: boolean = true): void {
    this.muted = muted;
    if (storeState) {
      this.storedMuteState = muted;
    }
    
    // Update the volume node
    this.volume.volume.value = muted ? -Infinity : (this.soloed ? 0 : this.volume.volume.value);
  }
  
  /**
   * Solo/unsolo the track
   */
  setSolo(soloed: boolean): void {
    this.soloed = soloed;
    // When soloed, bring volume to 0dB (unless muted)
    if (soloed && !this.muted) {
      this.volume.volume.value = 0;
    }
  }
  
  /**
   * Reset mute state to the stored value (used when solo is disabled)
   */
  resetMuteState(): void {
    this.setMuted(this.storedMuteState, false);
  }
  
  /**
   * Check if track is muted
   */
  isMuted(): boolean {
    return this.muted;
  }
  
  /**
   * Check if track is soloed
   */
  isSoloed(): boolean {
    return this.soloed;
  }
  
  /**
   * Convert blob to audio buffer for playback
   */
  async loadFromBlob(blob: Blob): Promise<void> {
    try {
      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();
      
      // Decode the audio data
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      // Set as the track's buffer
      this.setBuffer(audioBuffer);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error loading from blob:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Start recording to this track with real-time waveform updates
   */
  async startRecording(onWaveformUpdate?: (waveform: Float32Array) => void): Promise<void> {
    try {
      if (this.recorder) {
        console.warn('Recorder already exists, stopping previous recording');
        this.recorder.close();
        this.recorder.dispose();
        this.recorder = null;
      }
      
      // Create and configure user media for input
      this.recorder = new Tone.UserMedia();
      
      // Set up analyzer and interval for waveform updates if needed
      let waveformAnalyzer: Tone.Analyser | null = null;
      let waveformInterval: number | null = null;
      
      if (onWaveformUpdate) {
        waveformAnalyzer = new Tone.Analyser('waveform', 512);
        
        // Store references for cleanup
        (this.recorder as any)._waveformAnalyzer = waveformAnalyzer;
        
        // Set up polling interval for waveform updates
        waveformInterval = window.setInterval(() => {
          if (waveformAnalyzer) {
            const waveformData = waveformAnalyzer.getValue() as Float32Array;
            if (onWaveformUpdate) {
              onWaveformUpdate(waveformData);
            }
          } else {
            // Clean up interval if analyzer is gone
            if (waveformInterval !== null) {
              window.clearInterval(waveformInterval);
              waveformInterval = null;
            }
          }
        }, 50); // 20fps update rate
        
        // Store interval reference for cleanup
        (this.recorder as any)._waveformInterval = waveformInterval;
      }
      
      // Open user media (microphone)
      await this.recorder.open();
      console.log('Microphone opened for track recording');
      
      // Connect microphone to analyzer for waveform visualization if needed
      if (waveformAnalyzer) {
        this.recorder.connect(waveformAnalyzer);
      }
      
      // Connect to track processing chain to monitor input
      this.recorder.connect(this.eq);
      
      // Set flag to indicate we're recording
      (this.recorder as any)._isRecording = true;
      console.log('Started recording to track');
    } catch (error) {
      console.error('Failed to start track recording:', error);
      throw error;
    }
  }
  
  /**
   * Stop recording and return the recorded audio as a blob
   */
  async stopRecording(): Promise<Blob | null> {
    if (!this.recorder) {
      console.warn('No recorder available to stop');
      return null;
    }
    
    // Check if we're actually recording
    if (!(this.recorder as any)._isRecording) {
      console.warn('No active recording in progress');
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
      
      console.log('Track recording stopped, blob size:', audioBlob?.size);
      
      // Clean up the recorder resources
      const waveformInterval = (this.recorder as any)._waveformInterval as number | undefined;
      const waveformAnalyzer = (this.recorder as any)._waveformAnalyzer as Tone.Analyser | undefined;
      
      // Clear any waveform update interval
      if (waveformInterval !== undefined) {
        window.clearInterval(waveformInterval);
        (this.recorder as any)._waveformInterval = null;
      }
      
      // Dispose of the analyzer if it exists
      if (waveformAnalyzer) {
        waveformAnalyzer.dispose();
        (this.recorder as any)._waveformAnalyzer = null;
      }
      
      // Close and dispose of user media
      try {
        this.recorder.close();
        this.recorder.dispose();
      } catch (e) {
        console.warn('Error closing user media:', e);
      }
      
      // Clear the recorder
      this.recorder = null;
      
      // If we have a valid blob, convert it to buffer and set it on the track
      if (audioBlob && audioBlob.size > 0) {
        try {
          // Load the recorded audio into this track
          await this.loadFromBlob(audioBlob);
          console.log('Successfully loaded recording into track');
        } catch (loadError) {
          console.error('Failed to load recording into track:', loadError);
        }
      } else {
        console.warn('Recording produced an empty blob');
      }
      
      return audioBlob;
    } catch (error) {
      console.error('Error stopping track recording:', error);
      
      // Clean up resources on error
      try {
        if (this.recorder) {
          // Clean up any related resources
          const waveformInterval = (this.recorder as any)._waveformInterval as number | undefined;
          const waveformAnalyzer = (this.recorder as any)._waveformAnalyzer as Tone.Analyser | undefined;
          
          if (waveformInterval !== undefined) {
            window.clearInterval(waveformInterval);
          }
          
          if (waveformAnalyzer) {
            waveformAnalyzer.dispose();
          }
          
          // Close and dispose of the recorder
          this.recorder.close();
          this.recorder.dispose();
          this.recorder = null;
        }
      } catch (cleanupError) {
        console.warn('Error during recorder cleanup:', cleanupError);
      }
      
      return null;
    }
  }
  
  /**
   * Get the current recording buffer
   * @returns The current recording buffer or null if no recording exists
   */
  getRecordingBuffer(): AudioBuffer | null {
    return this.recordingBuffer;
  }
  
  /**
   * Check if the track is currently recording
   */
  isRecording(): boolean {
    return !!this.recorder && !!(this.recorder as any)._isRecording;
  }
  
  /**
   * Check if the track is currently playing
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
  
  /**
   * Connect the track output to the specified node
   */
  connectOutput(node: Tone.ToneAudioNode): void {
    this.output.connect(node);
  }
  
  /**
   * Disconnect the track from the master chain
   */
  disconnectFromMaster(): void {
    this.output.disconnect();
  }
  
  /**
   * Connect the track back to the master chain
   */
  connectToMaster(): void {
    // This function assumes that the track was previously connected to the master chain
    // and is used to reconnect after a disconnection
    // In a real implementation, you would store the master node reference
    // This is a simplified version that just connects to a provided node
    if (this.output && this._masterNode) {
      this.output.connect(this._masterNode);
    }
  }
  
  // Track the master node we're connected to
  private _masterNode: Tone.ToneAudioNode | null = null;
  
  /**
   * Remember the master node we're connected to
   */
  setMasterNode(node: Tone.ToneAudioNode): void {
    this._masterNode = node;
  }
  
  /**
   * Toggle playback for the track
   * Starts playback if stopped, stops if playing
   */
  togglePlayback(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }
  
  /**
   * Get a time-domain waveform of the entire audio file
   * (used for drawing the track waveform)
   * @param maxPoints Maximum number of points to generate (default: 500)
   * @param peakNormalize Whether to normalize the waveform to show peaks better (default: true)
   */
  getWaveform(maxPoints: number = 500, peakNormalize: boolean = true): number[] {
    if (!this.audioBuffer) {
      return new Array(maxPoints).fill(0);
    }
    
    const buffer = this.audioBuffer;
    const channelData = buffer.getChannelData(0); // Use the first channel
    const sampleRate = buffer.sampleRate;
    const duration = buffer.duration;
    
    // Calculate the number of samples to skip between points
    const samplesPerPoint = Math.floor(channelData.length / maxPoints);
    const waveform: number[] = [];
    
    // Generate the peak waveform (find max absolute value in each segment)
    for (let i = 0; i < maxPoints; i++) {
      const startSample = i * samplesPerPoint;
      let maxValue = 0;
      
      // Find the peak in this segment
      for (let j = 0; j < samplesPerPoint && startSample + j < channelData.length; j++) {
        const sample = Math.abs(channelData[startSample + j]);
        maxValue = Math.max(maxValue, sample);
      }
      
      waveform.push(maxValue);
    }
    
    // Normalize the waveform if requested
    if (peakNormalize) {
      // Find the peak value in the entire waveform
      const max = Math.max(...waveform);
      
      // Normalize to a 0-1 range if we have a non-zero peak
      if (max > 0) {
        for (let i = 0; i < waveform.length; i++) {
          waveform[i] = waveform[i] / max;
        }
      }
    }
    
    return waveform;
  }
  
  /**
   * Get the raw audio buffer for this track
   */
  getAudioBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }
  
  /**
   * Get the analyzer node for this track (for waveform visualization)
   */
  getAnalyzer(): Tone.Analyser {
    return this.analyzer;
  }
  
  /**
   * Get current analyzer data (for live visualization)
   */
  getAnalyzerData(): Float32Array {
    return this.analyzer.getValue() as Float32Array;
  }
  
  /**
   * Dispose of all resources (for cleanup)
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
  
  /**
   * Clean up the player
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
   * Clean up the recorder
   */
  private disposeRecorder(): void {
    if (this.recorder) {
      try {
        const waveformInterval = (this.recorder as any)._waveformInterval as number | undefined;
        if (waveformInterval !== undefined) {
          window.clearInterval(waveformInterval);
        }
        
        this.recorder.close();
        this.recorder.disconnect();
        this.recorder.dispose();
        this.recorder = null;
      } catch (e) {
        console.warn('Error disposing recorder:', e);
      }
    }
  }
}

// Audio triggers for controlling playback
const audioTriggers: AudioTrigger[] = [
  { id: 'play', label: 'Play', icon: 'play', action: 'play' },
  { id: 'stop', label: 'Stop', icon: 'stop', action: 'stop' },
  { id: 'record', label: 'Record', icon: 'circle', action: 'record' }
];

export { audioTriggers };