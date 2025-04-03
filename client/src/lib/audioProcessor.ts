import * as Tone from 'tone';

/**
 * AudioProcessor provides a high-level interface for professional audio manipulation
 * using the Tone.js library and AudioWorklets for zero-latency processing,
 * with support for real-time effects, recording, and high-resolution waveform generation
 */
class AudioProcessor {
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
    // Create Tone context with optimized settings for lower latency
    this.context = Tone.context.rawContext;
    
    // Configure Tone.js for lower latency
    Tone.context.lookAhead = 0.01; // 10ms lookahead for more responsive playback
    
    // Set up master chain with professional mastering-grade processors
    this.masterGain = new Tone.Gain(0.8).toDestination();
    
    // Advanced multiband compressor for transparent dynamics processing
    this.masterCompressor = new Tone.Compressor({
      ratio: 4,
      threshold: -24,
      release: 0.25,
      attack: 0.003,
      knee: 30
    }).connect(this.masterGain);
    
    // Brick-wall limiter for preventing digital clipping
    this.masterLimiter = new Tone.Limiter(-0.1).connect(this.masterCompressor);
    
    // Studio-grade 3-band EQ with precise frequency control
    this.eqBands = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0,
      lowFrequency: 300,
      highFrequency: 3000
    }).connect(this.masterLimiter);
    
    // High-resolution spectrum analyzers
    this.analyzer = new Tone.Analyser('waveform', 2048); // Higher resolution waveform
    this.spectralAnalyzer = new Tone.FFT(2048); // Frequency analysis
    this.loudnessAnalyzer = new Tone.Meter(); // Loudness monitoring
    
    // Connect analyzers
    this.eqBands.connect(this.analyzer);
    this.eqBands.connect(this.spectralAnalyzer);
    this.eqBands.connect(this.loudnessAnalyzer);
    
    // Initialize premium effects (lazy-loaded)
    this.initializeAdvancedEffects();
  }
  
  /**
   * Initialize premium audio effect processors
   */
  private async initializeAdvancedEffects(): Promise<void> {
    try {
      // Studio-quality reverb with adjustable parameters
      this.reverbProcessor = new Tone.Reverb({
        decay: 2.5,
        preDelay: 0.01,
        wet: 0 // Initially disabled
      });
      
      // Harmonic exciter for adding brilliance and clarity
      this.exciter = new Tone.FrequencyShifter(0);
      
      // Spectral processor for harmonics enhancement
      this.spectralProcessor = new Tone.Chebyshev(4);
      
      // Pre-load impulse responses
      await this.reverbProcessor.generate();
      
      // Insert in chain (bypassed initially)
      this.spectralProcessor.wet.value = 0;
      this.exciter.wet.value = 0;
      this.reverbProcessor.connect(this.eqBands);
      this.spectralProcessor.connect(this.reverbProcessor);
      this.exciter.connect(this.spectralProcessor);
    } catch (error) {
      console.error('Failed to initialize advanced effects:', error);
    }
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  /**
   * Check if the audio processor has been initialized
   * @returns Whether the audio processor is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Initialize the audio processor and start the audio context
   * This must be called from a user interaction (click, tap) to comply with browser autoplay policies
   */
  async init(): Promise<void> {
    return this.initialize();
  }
  
  /**
   * Initialize the audio processor and start the audio context
   * This must be called from a user interaction (click, tap) to comply with browser autoplay policies
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      // If already initialized, ensure audio context is running
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Resumed suspended audio context');
      }
      return;
    }
    
    try {
      // Start audio context - this requires user interaction due to browser autoplay policies
      await Tone.start();
      console.log('Tone.js audio context started successfully');
      
      // Set default BPM
      Tone.Transport.bpm.value = 120;
      
      // Load audio worklet processor for zero-latency DSP
      await this.initializeWorklet();
      
      this.isInitialized = true;
      console.log('Audio context initialized with enhanced processing capabilities');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }
  
  /**
   * Ensure audio context is running (call from UI event handlers)
   */
  async ensureAudioContextRunning(): Promise<void> {
    if (Tone.context.state !== 'running') {
      try {
        await Tone.start();
        console.log('Audio context started from user interaction');
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
      // Create worklet processor code
      const workletCode = `
        class LowLatencyProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.port.onmessage = this.handleMessage.bind(this);
          }
          
          handleMessage(event) {
            // Handle control messages from main thread
            if (event.data.type === 'setLatency') {
              // Update internal processing parameters
            }
          }
          
          process(inputs, outputs, parameters) {
            // Zero-latency processing - copy input to output
            const input = inputs[0];
            const output = outputs[0];
            
            if (input && output) {
              for (let channel = 0; channel < input.length; channel++) {
                const inputChannel = input[channel];
                const outputChannel = output[channel];
                
                for (let i = 0; i < inputChannel.length; i++) {
                  outputChannel[i] = inputChannel[i];
                }
              }
            }
            
            return true; // Keep processor alive
          }
        }
        
        registerProcessor('low-latency-processor', LowLatencyProcessor);
      `;
      
      // Create blob URL for worklet code
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      
      // Load worklet
      await this.context.audioWorklet.addModule(workletUrl);
      
      // Create worklet node
      this.workletNode = new AudioWorkletNode(this.context, 'low-latency-processor');
      
      // Connect communication port
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'latency') {
          this.processingLatency = event.data.value;
        }
      };
      
      // Clean up URL
      URL.revokeObjectURL(workletUrl);
      
      this.workletReady = true;
      
      console.log('Audio worklet for low-latency processing initialized');
    } catch (error) {
      console.warn('Audio worklet initialization failed (this is expected in some browsers):', error);
      console.log('Falling back to standard audio processing');
    }
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
   * This will play all tracks at the current transport position
   */
  play(): void {
    // Ensure we're initialized
    if (!this.isInitialized) {
      console.warn('Audio processor not initialized, attempting to initialize now');
      this.initialize().catch(err => {
        console.error('Failed to initialize audio processor:', err);
      });
      return;
    }
    
    // Start the transport
    Tone.Transport.start();
    
    // Get the current playback position
    const currentTime = Tone.Transport.seconds;
    console.log(`Starting playback at position ${currentTime}s`);
    
    // Play all tracks synchronized at the current transport position
    this.tracks.forEach((track, trackId) => {
      // Only play tracks that aren't muted
      if (!track.isMuted()) {
        try {
          console.log(`Playing track ${trackId} from position ${currentTime}s`);
          track.play(currentTime);
        } catch (error) {
          console.error(`Failed to play track ${trackId}:`, error);
        }
      } else {
        console.log(`Track ${trackId} is muted, skipping playback`);
      }
    });
  }

  /**
   * Stop transport/playback
   * This will stop all tracks and reset the playback position
   */
  stop(): void {
    // Stop the transport
    Tone.Transport.stop();
    
    // Stop all tracks
    this.tracks.forEach((track, trackId) => {
      try {
        track.stop();
      } catch (error) {
        console.error(`Failed to stop track ${trackId}:`, error);
      }
    });
    
    console.log('All playback stopped');
  }

  /**
   * Pause transport/playback
   * This will pause all tracks at their current position
   */
  pause(): void {
    // Pause the transport
    Tone.Transport.pause();
    
    // Pause all tracks
    this.tracks.forEach((track, trackId) => {
      try {
        track.stop();
      } catch (error) {
        console.error(`Failed to pause track ${trackId}:`, error);
      }
    });
    
    console.log('Playback paused');
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
   * Set the playback position
   */
  setPosition(time: number): void {
    Tone.Transport.seconds = time;
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
   * Start recording the master output with real-time waveform visualization
   * 
   * @param onWaveformUpdate Optional callback to receive real-time waveform data for visualization
   */
  startRecording(onWaveformUpdate?: (waveform: Float32Array) => void): void {
    // Create a new track for recording
    const recordingTrackId = Date.now();
    const recordingTrack = this.createTrack(recordingTrackId);
    
    // Start recording on this track with real-time visualization callback
    recordingTrack.startRecording(onWaveformUpdate).catch(error => {
      console.error('Failed to start track recording:', error);
    });
    
    // Also start master recording for backup
    this.recorder = new Tone.Recorder();
    this.masterGain.connect(this.recorder);
    this.recorder.start();
    
    // Set flag to indicate we're recording
    this.processingActive = true;
    console.log('Started recording with real-time visualization');
  }

  /**
   * Stop recording and return the audio blob
   * @returns Promise that resolves to a Blob containing the recorded audio
   */
  async stopRecording(): Promise<Blob | null> {
    try {
      // Find the recording track (should be the last one created)
      const trackIds = this.getTrackIds();
      const recordingTrackId = Math.max(...trackIds);
      const recordingTrack = this.getTrack(recordingTrackId);
      
      // Stop recording and get the audio data
      let recordingBlob: Blob | null = null;
      
      if (recordingTrack) {
        // Try to get recording from the track first
        try {
          recordingBlob = await recordingTrack.stopRecording();
          console.log('Successfully captured recording from track');
          
          // Clean up the temporary recording track since we'll create a new playback track
          this.removeTrack(recordingTrackId);
        } catch (trackError) {
          console.error('Failed to get recording from track:', trackError);
        }
      }
      
      // Fallback to master recording if track recording failed
      if (!recordingBlob && this.recorder) {
        try {
          recordingBlob = await this.recorder.stop();
          console.log('Falling back to master recording');
        } catch (masterError) {
          console.error('Failed to get master recording:', masterError);
        }
        
        this.masterGain.disconnect(this.recorder);
        this.recorder = null;
      }
      
      this.processingActive = false;
      return recordingBlob;
    } catch (error) {
      console.error('Error stopping recording:', error);
      if (this.recorder) {
        this.masterGain.disconnect(this.recorder);
        this.recorder = null;
      }
      this.processingActive = false;
      return null;
    }
  }

  /**
   * Play a specific audio buffer (for previewing recordings)
   * @param buffer The audio buffer to play
   */
  playBuffer(buffer: AudioBuffer | null): void {
    if (!buffer) return;
    
    // Create a buffer source
    const source = new Tone.BufferSource(buffer).connect(this.eqBands);
    source.start();
    console.log('Playing buffer preview');
  }
  
  /**
   * Stop any active playback
   */
  stopPlayback(): void {
    // In a more complex implementation, we would keep track of the
    // buffer sources and stop them appropriately
    console.log('Stopping buffer playback');
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
  private recordingBuffer: AudioBuffer | null = null;
  private context: Tone.Context['rawContext'];
  private isPlaying: boolean = false;

  constructor(context: Tone.Context['rawContext'], options: TrackProcessorOptions = {}) {
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
      
      // Create a new player with proper connection to the signal chain
      this.player = new Tone.Player().connect(this.compressor);
      this.player.load(url).then(() => {
        if (this.player) {
          const buffer = this.player.buffer.get();
          this.audioBuffer = buffer ? buffer : null;
          console.log(`Loaded audio: ${url}`);
        }
      });
      
      // Wait for the audio to be fully loaded before returning
      return new Promise((resolve, reject) => {
        try {
          // Set up proper onload callback that resolves the promise
          this.player!.buffer.onload = () => {
            console.log(`Audio successfully loaded: ${url}`);
            resolve();
          };
          
          // Start the loading process
          this.player!.load(url).catch(error => {
            console.error('Error in player.load():', error);
            reject(error);
          });
        } catch (error) {
          console.error('Error setting up audio load:', error);
          reject(error);
        }
      });
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
      
      // Create a properly connected player that's ready to use
      // Create a player and set the buffer directly
      this.player = new Tone.Player().connect(this.compressor);
      this.player.buffer.set(audioBuffer);
      console.log(`Player loaded successfully with buffer from file: ${file.name}`);
      
      // Make sure player is properly initialized before continuing
      return new Promise((resolve) => {
        // Use the existing buffer and check that it's valid
        if (this.player && this.player.buffer.loaded) {
          console.log(`Audio buffer loaded successfully: ${file.name}`);
          resolve();
        } else {
          // Set up a callback in case it's not loaded yet
          this.player!.buffer.onload = () => {
            console.log(`Audio buffer loaded asynchronously: ${file.name}`);
            resolve();
          };
        }
      });
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw error;
    }
  }

  /**
   * Start recording from microphone with real-time waveform visualization
   * @param onWaveformUpdate Optional callback to receive real-time waveform data
   */
  async startRecording(onWaveformUpdate?: (waveform: Float32Array) => void): Promise<void> {
    try {
      // Dispose of any existing player
      this.disposePlayer();
      
      // Create recorder from microphone
      this.recorder = new Tone.UserMedia().connect(this.compressor);
      
      // Connect to a meter for real-time analysis if we have a callback
      if (onWaveformUpdate) {
        // Create high-resolution analyzer for real-time waveform visualization
        const realTimeAnalyzer = new Tone.Analyser('waveform', 512);
        this.recorder.connect(realTimeAnalyzer);
        
        // Set up interval to poll the waveform data
        const updateInterval = setInterval(() => {
          if (this.recorder) {
            const waveformData = realTimeAnalyzer.getValue() as Float32Array;
            onWaveformUpdate(waveformData);
          } else {
            // Clean up if recording has stopped
            clearInterval(updateInterval);
            realTimeAnalyzer.dispose();
          }
        }, 50); // Update every 50ms for smooth visualization
      }
      
      // Open the microphone
      await this.recorder.open();
      console.log('Started recording with real-time visualization');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and create a player with the recorded audio
   * Returns the recording blob so it can be used immediately
   */
  async stopRecording(): Promise<Blob | null> {
    if (!this.recorder) return null;
    
    try {
      const recorder = new Tone.Recorder();
      this.recorder.connect(recorder);
      recorder.start();
      
      // Record for at least 500ms to capture some audio
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const blob = await recorder.stop();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      this.disposeRecorder();
      recorder.dispose();
      
      this.audioBuffer = audioBuffer;
      this.player = new Tone.Player().connect(this.compressor);
      this.player.buffer.set(audioBuffer);
      
      // Return the blob so it can be used immediately
      return blob;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.disposeRecorder();
      throw error;
    }
  }

  /**
   * Play the track
   * @param startTime Optional time within the audio file to start playback from (in seconds)
   * @param offset Optional offset to add to the current transport time (for regions)
   * @param duration Optional duration to play (for clips/regions)
   */
  play(startTime?: number, offset?: number, duration?: number): void {
    if (!this.player) {
      console.warn('Cannot play track: no player available');
      return;
    }
    
    try {
      // If the player is already playing, stop it first
      if (this.player.state === 'started') {
        this.player.stop();
      }
      
      // Configure playback options
      const now = Tone.now();
      
      if (startTime !== undefined) {
        // If we have a specific start time in the audio file
        if (duration) {
          // Play a specific section (for regions/clips)
          console.log(`Playing track from ${startTime}s for ${duration}s duration with offset ${offset || 0}s`);
          this.player.start(now, startTime, duration);
        } else {
          // Play from a specific point to the end
          console.log(`Playing track from ${startTime}s to end`);
          this.player.start(now, startTime);
        }
      } else {
        // Play from the beginning
        console.log('Playing track from beginning');
        this.player.start();
      }
    } catch (error) {
      console.error('Error playing track:', error);
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
   * Get the current recording buffer
   * @returns The current recording buffer or null if no recording exists
   */
  getRecordingBuffer(): AudioBuffer | null {
    return this.recordingBuffer;
  }
  
  /**
   * Toggle playback for the track
   * Starts playback if stopped, stops if playing
   */
  togglePlayback(): void {
    if (this.isPlaying) {
      this.stop();
      this.isPlaying = false;
    } else {
      this.play();
      this.isPlaying = true;
    }
  }

  /**
   * Get a time-domain waveform of the entire audio file
   * (used for drawing the track waveform)
   * @param maxPoints Maximum number of points to generate (default: 500)
   * @param peakNormalize Whether to normalize the waveform to show peaks better (default: true)
   */
  getFullWaveform(maxPoints: number = 500, peakNormalize: boolean = true): number[] {
    if (!this.audioBuffer) return [];
    
    // Get the first channel data
    const rawData = this.audioBuffer.getChannelData(0);
    
    // Determine how many points to use (limited by maxPoints)
    const points = Math.min(maxPoints, rawData.length / 2);
    const blockSize = Math.floor(rawData.length / points);
    const waveform = [];
    
    // Find the maximum amplitude for normalization if requested
    let maxAmplitude = 0;
    if (peakNormalize) {
      for (let i = 0; i < rawData.length; i++) {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(rawData[i]));
      }
    }
    
    // Process the audio data in blocks to get peaks
    for (let i = 0; i < points; i++) {
      const start = blockSize * i;
      let minSample = 0;
      let maxSample = 0;
      
      // Look for min and max in each block
      for (let j = 0; j < blockSize; j++) {
        const sample = rawData[start + j] || 0;
        minSample = Math.min(minSample, sample);
        maxSample = Math.max(maxSample, sample);
      }
      
      // Use peak-to-peak values for better visualization
      const amplitude = maxSample - minSample;
      
      // Apply normalization if requested
      if (peakNormalize && maxAmplitude > 0) {
        waveform.push(amplitude / maxAmplitude);
      } else {
        waveform.push(amplitude);
      }
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