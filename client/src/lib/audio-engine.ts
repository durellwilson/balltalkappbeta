import * as Tone from 'tone';

export interface AudioRegion {
  id: string;
  trackId: number;
  start: number;
  end: number;
  startTime?: number;  // Alias for start
  duration?: number;   // Alias for (end - start)
  offset: number;
  file?: string;
  buffer?: AudioBuffer;
  name: string;
  color?: string;
  waveform?: number[];
  locked?: boolean;
  selected?: boolean;
  gain?: number;
  pan?: number;
}

export interface TrackEffects {
  eq?: {
    low: number;
    mid: number;
    high: number;
    enabled: boolean;
  };
  compressor?: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    enabled: boolean;
  };
  reverb?: {
    decay: number;
    mix: number;
    enabled: boolean;
  };
  delay?: {
    time: number;
    feedback: number;
    mix: number;
    enabled: boolean;
  };
}

export interface Track {
  id: number;
  name: string;
  type: 'audio' | 'instrument' | 'vocal' | 'drum' | 'mix';
  volume: number;
  pan: number;
  isMuted: boolean;
  isSoloed: boolean;
  isArmed?: boolean;
  effects?: TrackEffects;
}

/**
 * AudioEngine handles the audio processing and playback
 */
export class AudioEngine {
  private context: AudioContext;
  private initialized: boolean = false;
  private master: Tone.Channel;
  private tracks: Map<number, {
    channel: Tone.Channel;
    eq?: Tone.EQ3;
    compressor?: Tone.Compressor;
    reverb?: Tone.Reverb;
    delay?: Tone.FeedbackDelay;
  }> = new Map();
  private players: Map<string, Tone.Player> = new Map();
  private buffers: Map<string, AudioBuffer> = new Map();
  private waveforms: Map<string, number[]> = new Map();
  private recorder: MediaRecorder | null = null;
  private recordedChunks: BlobPart[] = [];
  private recordingTrackId: number | null = null;
  private recordingStartTime: number = 0;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private microphoneGain: GainNode | null = null;
  private monitorNode: GainNode | null = null;
  private isMonitoring: boolean = false;
  private analyzer: Tone.Analyser;
  private inputAnalyzer: Tone.Analyser | null = null;

  constructor() {
    // Initialize Tone.js
    this.context = Tone.getContext().rawContext;
    this.master = new Tone.Channel().toDestination();
    this.analyzer = new Tone.Analyser('waveform', 128);
    this.master.connect(this.analyzer);
  }

  /**
   * Initialize the audio engine
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Resume audio context (needed for browsers)
      await Tone.start();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      return false;
    }
  }

  /**
   * Check if the audio engine is initialized
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Set the master volume
   */
  setMasterVolume(volume: number): void {
    this.master.volume.value = Tone.gainToDb(volume);
  }

  /**
   * Get current playback position
   */
  getPosition(): number {
    return Tone.Transport.seconds;
  }

  /**
   * Set the playback position
   */
  setPosition(time: number): void {
    Tone.Transport.seconds = time;
  }

  /**
   * Start playback
   */
  play(): void {
    Tone.Transport.start();
  }

  /**
   * Pause playback
   */
  pause(): void {
    Tone.Transport.pause();
  }

  /**
   * Stop playback
   */
  stop(): void {
    Tone.Transport.stop();
  }

  /**
   * Set BPM (Beats Per Minute)
   */
  setBpm(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }

  /**
   * Load an audio file
   */
  async loadAudioFile(file: File): Promise<{ 
    buffer: AudioBuffer; 
    waveform: number[]; 
    duration: number;
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      const waveform = this.generateWaveform(audioBuffer);
      
      return {
        buffer: audioBuffer,
        waveform,
        duration: audioBuffer.duration
      };
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw error;
    }
  }

  /**
   * Generate a waveform from an audio buffer
   */
  private generateWaveform(buffer: AudioBuffer, samples: number = 200): number[] {
    const channelData = buffer.getChannelData(0); // Get only the first channel
    const blockSize = Math.floor(channelData.length / samples);
    const waveform = [];

    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i;
      let sum = 0;
      
      // Find the max value in this block
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[blockStart + j] || 0);
      }
      
      // Normalize and store the value
      waveform.push(sum / blockSize);
    }

    // Normalize the entire waveform to 0-1 range
    const max = Math.max(...waveform);
    return waveform.map(val => val / max);
  }

  /**
   * Add an audio region to the playback timeline
   */
  addRegion(region: AudioRegion): void {
    if (!region.buffer && !region.file) {
      console.error('Region has no buffer or file:', region);
      return;
    }

    // If buffer is provided, use it directly
    if (region.buffer) {
      this.buffers.set(region.id, region.buffer);
      if (!region.waveform) {
        const waveform = this.generateWaveform(region.buffer);
        this.waveforms.set(region.id, waveform);
      } else {
        this.waveforms.set(region.id, region.waveform);
      }
    } 
    // If file URL is provided, load it
    else if (region.file) {
      const player = new Tone.Player(region.file, () => {
        // Once loaded, generate waveform if not provided
        if (!region.waveform && player.buffer) {
          const waveform = this.generateWaveform(player.buffer.get());
          this.waveforms.set(region.id, waveform);
        } else if (region.waveform) {
          this.waveforms.set(region.id, region.waveform);
        }
      }).sync();
      
      // Set player options
      player.loop = false;
      player.volume.value = Tone.gainToDb(region.gain || 1);

      // Connect to the appropriate track channel
      const trackChannel = this.getTrackChannel(region.trackId);
      player.connect(trackChannel);
      
      // Schedule the player
      player.start(
        region.start,          // When to start
        region.offset || 0,    // Where in the sample to start
        region.end - region.start  // Duration to play
      );
      
      // Store the player
      this.players.set(region.id, player);
    }
  }

  /**
   * Update an existing audio region
   */
  updateRegion(region: AudioRegion): void {
    // Remove the old region first
    this.removeRegion(region.id);
    
    // Add the updated region
    this.addRegion(region);
  }

  /**
   * Remove an audio region from the playback timeline
   */
  removeRegion(regionId: string): void {
    const player = this.players.get(regionId);
    if (player) {
      player.dispose();
      this.players.delete(regionId);
    }
    
    this.buffers.delete(regionId);
    this.waveforms.delete(regionId);
  }

  /**
   * Get the waveform data for a region
   */
  getWaveform(regionId: string): number[] | undefined {
    return this.waveforms.get(regionId);
  }

  /**
   * Create or get a track channel
   */
  private getTrackChannel(trackId: number): Tone.Channel {
    // Check if the track channel already exists
    let trackNode = this.tracks.get(trackId);
    if (trackNode) {
      return trackNode.channel;
    }
    
    // Create a new track channel
    const channel = new Tone.Channel().connect(this.master);
    this.tracks.set(trackId, { channel });
    
    return channel;
  }

  /**
   * Update track properties
   */
  updateTrack(track: Track): void {
    const trackNode = this.tracks.get(track.id);
    if (!trackNode) {
      // Create the track if it doesn't exist
      const channel = new Tone.Channel().connect(this.master);
      channel.volume.value = Tone.gainToDb(track.volume);
      channel.pan.value = track.pan;
      channel.mute = track.isMuted;
      this.tracks.set(track.id, { channel });
      return;
    }
    
    // Update track properties
    trackNode.channel.volume.value = Tone.gainToDb(track.volume);
    trackNode.channel.pan.value = track.pan;
    trackNode.channel.mute = track.isMuted;
    
    // Update effects if provided
    if (track.effects) {
      this.updateTrackEffects(track.id, track.effects);
    }
  }

  /**
   * Update track effects
   */
  private updateTrackEffects(trackId: number, effects: TrackEffects): void {
    const trackNode = this.tracks.get(trackId);
    if (!trackNode) return;
    
    // Handle EQ
    if (effects.eq) {
      if (!trackNode.eq && effects.eq.enabled) {
        // Create EQ if it doesn't exist and is enabled
        trackNode.eq = new Tone.EQ3();
        trackNode.channel.disconnect(this.master);
        trackNode.channel.connect(trackNode.eq);
        trackNode.eq.connect(this.master);
      }
      
      if (trackNode.eq) {
        if (effects.eq.enabled) {
          // Update EQ values
          trackNode.eq.low.value = effects.eq.low;
          trackNode.eq.mid.value = effects.eq.mid;
          trackNode.eq.high.value = effects.eq.high;
        } else {
          // Disconnect and dispose if disabled
          trackNode.eq.disconnect();
          trackNode.eq.dispose();
          trackNode.eq = undefined;
          
          // Reconnect channel directly to master or to the next effect
          this.reconnectTrackEffects(trackId);
        }
      }
    }
    
    // Handle Compressor
    if (effects.compressor) {
      if (!trackNode.compressor && effects.compressor.enabled) {
        // Create compressor if it doesn't exist and is enabled
        trackNode.compressor = new Tone.Compressor();
        
        // Connect it in the chain
        const lastEffect = this.getLastActiveEffect(trackId);
        if (lastEffect) {
          lastEffect.disconnect();
          lastEffect.connect(trackNode.compressor);
          trackNode.compressor.connect(this.master);
        } else {
          trackNode.channel.disconnect(this.master);
          trackNode.channel.connect(trackNode.compressor);
          trackNode.compressor.connect(this.master);
        }
      }
      
      if (trackNode.compressor) {
        if (effects.compressor.enabled) {
          // Update compressor values
          trackNode.compressor.threshold.value = effects.compressor.threshold;
          trackNode.compressor.ratio.value = effects.compressor.ratio;
          trackNode.compressor.attack.value = effects.compressor.attack / 1000; // ms to seconds
          trackNode.compressor.release.value = effects.compressor.release / 1000; // ms to seconds
        } else {
          // Disconnect and dispose if disabled
          trackNode.compressor.disconnect();
          trackNode.compressor.dispose();
          trackNode.compressor = undefined;
          
          // Reconnect effects chain
          this.reconnectTrackEffects(trackId);
        }
      }
    }
    
    // Handle Reverb
    if (effects.reverb) {
      if (!trackNode.reverb && effects.reverb.enabled) {
        // Create reverb if it doesn't exist and is enabled
        trackNode.reverb = new Tone.Reverb();
        
        // Connect it in the chain
        const lastEffect = this.getLastActiveEffect(trackId);
        if (lastEffect) {
          lastEffect.disconnect();
          lastEffect.connect(trackNode.reverb);
          trackNode.reverb.connect(this.master);
        } else {
          trackNode.channel.disconnect(this.master);
          trackNode.channel.connect(trackNode.reverb);
          trackNode.reverb.connect(this.master);
        }
      }
      
      if (trackNode.reverb) {
        if (effects.reverb.enabled) {
          // Update reverb values
          trackNode.reverb.decay = effects.reverb.decay;
          trackNode.reverb.wet.value = effects.reverb.mix;
        } else {
          // Disconnect and dispose if disabled
          trackNode.reverb.disconnect();
          trackNode.reverb.dispose();
          trackNode.reverb = undefined;
          
          // Reconnect effects chain
          this.reconnectTrackEffects(trackId);
        }
      }
    }
    
    // Handle Delay
    if (effects.delay) {
      if (!trackNode.delay && effects.delay.enabled) {
        // Create delay if it doesn't exist and is enabled
        trackNode.delay = new Tone.FeedbackDelay();
        
        // Connect it in the chain
        const lastEffect = this.getLastActiveEffect(trackId);
        if (lastEffect) {
          lastEffect.disconnect();
          lastEffect.connect(trackNode.delay);
          trackNode.delay.connect(this.master);
        } else {
          trackNode.channel.disconnect(this.master);
          trackNode.channel.connect(trackNode.delay);
          trackNode.delay.connect(this.master);
        }
      }
      
      if (trackNode.delay) {
        if (effects.delay.enabled) {
          // Update delay values
          trackNode.delay.delayTime.value = effects.delay.time;
          trackNode.delay.feedback.value = effects.delay.feedback;
          trackNode.delay.wet.value = effects.delay.mix;
        } else {
          // Disconnect and dispose if disabled
          trackNode.delay.disconnect();
          trackNode.delay.dispose();
          trackNode.delay = undefined;
          
          // Reconnect effects chain
          this.reconnectTrackEffects(trackId);
        }
      }
    }
  }

  /**
   * Get the last active effect in the chain
   */
  private getLastActiveEffect(trackId: number): Tone.ToneAudioNode | null {
    const trackNode = this.tracks.get(trackId);
    if (!trackNode) return null;
    
    if (trackNode.delay) return trackNode.delay;
    if (trackNode.reverb) return trackNode.reverb;
    if (trackNode.compressor) return trackNode.compressor;
    if (trackNode.eq) return trackNode.eq;
    
    return null;
  }

  /**
   * Reconnect track effects in the correct order
   */
  private reconnectTrackEffects(trackId: number): void {
    const trackNode = this.tracks.get(trackId);
    if (!trackNode) return;
    
    // Disconnect all first
    trackNode.channel.disconnect();
    if (trackNode.eq) trackNode.eq.disconnect();
    if (trackNode.compressor) trackNode.compressor.disconnect();
    if (trackNode.reverb) trackNode.reverb.disconnect();
    if (trackNode.delay) trackNode.delay.disconnect();
    
    // Now reconnect in the correct order
    let lastNode: Tone.ToneAudioNode = trackNode.channel;
    
    if (trackNode.eq) {
      lastNode.connect(trackNode.eq);
      lastNode = trackNode.eq;
    }
    
    if (trackNode.compressor) {
      lastNode.connect(trackNode.compressor);
      lastNode = trackNode.compressor;
    }
    
    if (trackNode.reverb) {
      lastNode.connect(trackNode.reverb);
      lastNode = trackNode.reverb;
    }
    
    if (trackNode.delay) {
      lastNode.connect(trackNode.delay);
      lastNode = trackNode.delay;
    }
    
    // Connect the last node to the master
    lastNode.connect(this.master);
  }

  /**
   * Start recording a new track
   */
  async startRecording(trackId: number, overlapRecording: boolean = false): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      this.recorder = new MediaRecorder(stream);
      this.recordingTrackId = trackId;
      this.recordedChunks = [];
      this.recordingStartTime = overlapRecording ? this.getPosition() : 0;
      
      // Set up recording events
      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      // Create microphone input for monitoring
      this.microphone = this.context.createMediaStreamSource(stream);
      this.microphoneGain = this.context.createGain();
      this.microphone.connect(this.microphoneGain);
      
      // Set up analyzer for input level monitoring
      this.inputAnalyzer = new Tone.Analyser('waveform', 128);
      this.microphoneGain.connect(this.inputAnalyzer.input);
      
      // Start the actual recording
      this.recorder.start();
      
      // If overlap recording is enabled, keep playback going
      if (overlapRecording) {
        if (!Tone.Transport.state === 'started') {
          this.play();
        }
      } else {
        // Otherwise, start from the beginning
        this.stop();
        this.setPosition(0);
        this.play();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  /**
   * Stop recording and return the recorded audio
   */
  async stopRecording(): Promise<{ 
    buffer: AudioBuffer; 
    waveform: number[]; 
    duration: number; 
    startTime: number;
  } | null> {
    if (!this.recorder || !this.recordingTrackId) {
      return null;
    }
    
    return new Promise((resolve) => {
      this.recorder!.onstop = async () => {
        try {
          // Create a blob from the recorded chunks
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          
          // Convert blob to audio buffer
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
          
          // Generate waveform
          const waveform = this.generateWaveform(audioBuffer);
          
          // Clean up recording resources
          if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
          }
          if (this.microphoneGain) {
            this.microphoneGain.disconnect();
            this.microphoneGain = null;
          }
          if (this.inputAnalyzer) {
            this.inputAnalyzer.dispose();
            this.inputAnalyzer = null;
          }
          
          this.recorder = null;
          this.recordedChunks = [];
          
          // Return recording result
          resolve({
            buffer: audioBuffer,
            waveform,
            duration: audioBuffer.duration,
            startTime: this.recordingStartTime
          });
          
          this.recordingTrackId = null;
        } catch (error) {
          console.error('Failed to process recording:', error);
          resolve(null);
        }
      };
      
      // Stop the recorder
      this.recorder!.stop();
    });
  }

  /**
   * Toggle monitoring of the microphone input
   */
  toggleMonitoring(enabled: boolean): boolean {
    if (!this.microphoneGain || !this.microphone) {
      return false;
    }
    
    this.isMonitoring = enabled;
    
    if (enabled) {
      // Create monitor node if needed
      if (!this.monitorNode) {
        this.monitorNode = this.context.createGain();
        this.monitorNode.gain.value = 0.5; // Reduce level to avoid feedback
      }
      
      // Connect microphone to output
      this.microphoneGain.connect(this.monitorNode);
      this.monitorNode.connect(this.context.destination);
    } else if (this.monitorNode) {
      // Disconnect monitoring
      this.monitorNode.disconnect();
    }
    
    return true;
  }

  /**
   * Set the microphone input gain
   */
  setInputGain(gain: number): boolean {
    if (!this.microphoneGain) {
      return false;
    }
    
    this.microphoneGain.gain.value = gain;
    return true;
  }

  /**
   * Get the current input level (0-1 range)
   */
  getInputLevel(): number {
    if (!this.inputAnalyzer) {
      return 0;
    }
    
    const waveform = this.inputAnalyzer.getValue() as Float32Array;
    let sum = 0;
    
    // Calculate RMS of the waveform
    for (let i = 0; i < waveform.length; i++) {
      sum += waveform[i] * waveform[i];
    }
    
    const rms = Math.sqrt(sum / waveform.length);
    return Math.min(1, rms * 5); // Scale up a bit for better visualization
  }

  /**
   * Get the current output waveform
   */
  getOutputWaveform(): Float32Array {
    return this.analyzer.getValue() as Float32Array;
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    // Stop and clear all players
    this.players.forEach((player) => {
      player.stop();
      player.dispose();
    });
    this.players.clear();
    
    // Clean up track channels and effects
    this.tracks.forEach((trackNode) => {
      if (trackNode.eq) trackNode.eq.dispose();
      if (trackNode.compressor) trackNode.compressor.dispose();
      if (trackNode.reverb) trackNode.reverb.dispose();
      if (trackNode.delay) trackNode.delay.dispose();
      trackNode.channel.dispose();
    });
    this.tracks.clear();
    
    // Clean up recording resources
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    if (this.microphoneGain) {
      this.microphoneGain.disconnect();
      this.microphoneGain = null;
    }
    if (this.monitorNode) {
      this.monitorNode.disconnect();
      this.monitorNode = null;
    }
    if (this.inputAnalyzer) {
      this.inputAnalyzer.dispose();
      this.inputAnalyzer = null;
    }
    
    // Clean up master channel and analyzer
    this.analyzer.dispose();
    this.master.dispose();
    
    // Clear buffers and waveforms
    this.buffers.clear();
    this.waveforms.clear();
    
    this.initialized = false;
  }
}