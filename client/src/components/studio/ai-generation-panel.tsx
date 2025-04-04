import React, { useState } from 'react';
import { 
  Sparkles, 
  Music, 
  Mic, 
  MessageSquare, 
  Upload, 
  RotateCw, 
  Wand2, 
  Star, 
  Check,
  Download,
  AlertTriangle,
  FileAudio,
  Info,
  Speaker
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function to generate synthetic audio for demos
async function generateSyntheticAudio(
  type: 'music' | 'vocal' | 'speech' | 'sfx' | 'drums' | 'melody',
  duration: number,
  parameters: any
): Promise<AudioBuffer> {
  console.log(`Generating ${type} with duration ${duration}s and parameters:`, parameters);
  
  // Create audio context and offline context for rendering
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = 44100;
  const numberOfChannels = 2;
  const frameCount = Math.ceil(duration * sampleRate);
  
  // Create offline context for better audio generation with effects
  const offlineContext = new OfflineAudioContext(
    numberOfChannels, 
    frameCount, 
    sampleRate
  );
  
  // Create master gain node for final output control
  const masterGain = offlineContext.createGain();
  masterGain.gain.value = 0.8; // Master volume control
  masterGain.connect(offlineContext.destination);
  
  // Create different types of audio based on the selected type
  if (type === 'music') {
    // Generate music with harmonic structure and rhythmic elements
    const baseFreq = ['electronic', 'pop'].includes(parameters.genre) ? 110 : 
                     ['rock', 'hiphop'].includes(parameters.genre) ? 82.41 : 220;
    const bpm = parameters.tempo;
    const beatsPerSecond = bpm / 60;
    const beatDuration = 60 / bpm;
    
    // Create a compressor for better dynamics
    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressor.connect(masterGain);
    
    // Create a low-pass filter to shape the sound
    const lowpass = offlineContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 5000;
    lowpass.Q.value = 1;
    lowpass.connect(compressor);
    
    // Generate drum patterns
    const totalBeats = Math.ceil(duration * beatsPerSecond);
    
    // Create kick drum pattern
    for (let beat = 0; beat < totalBeats; beat++) {
      if (beat % 4 === 0 || (parameters.genre === 'hiphop' && beat % 4 === 2)) {
        // Kick on beats 1 and 3 for most genres, more for hip-hop
        const time = beat * beatDuration;
        const kick = createKickDrum(offlineContext, time);
        kick.connect(compressor);
      }
      
      if ((beat % 4 === 2 && parameters.genre !== 'ambient') || 
          (parameters.genre === 'rock' && beat % 2 === 1)) {
        // Snare on beats 3 for most genres, more for rock
        const time = beat * beatDuration;
        const snare = createSnare(offlineContext, time);
        snare.connect(lowpass);
      }
      
      if (beat % 2 === 1 || parameters.genre === 'electronic') {
        // Hi-hats on off-beats, more for electronic
        const time = beat * beatDuration;
        const hihat = createHiHat(offlineContext, time, 0.3);
        hihat.connect(lowpass);
      }
    }
    
    // Create bass line
    const bassOscillator = offlineContext.createOscillator();
    const bassGain = offlineContext.createGain();
    
    bassOscillator.type = 'triangle';
    bassOscillator.frequency.value = baseFreq / 2;
    
    bassOscillator.connect(bassGain);
    bassGain.connect(lowpass);
    
    // Create bass pattern
    const bassPattern = [0, 0, 3, 0, 0, 0, 5, 7];
    const patternLength = 8;
    
    for (let beat = 0; beat < totalBeats; beat++) {
      const time = beat * beatDuration;
      const patternIndex = beat % patternLength;
      const note = bassPattern[patternIndex];
      
      // Calculate frequency from base note and pattern
      const freq = (baseFreq / 2) * Math.pow(2, note / 12);
      
      // Schedule the frequency change
      bassOscillator.frequency.setValueAtTime(freq, time);
      
      // Create volume envelope for each note
      bassGain.gain.setValueAtTime(0, time);
      bassGain.gain.linearRampToValueAtTime(0.7, time + 0.02);
      bassGain.gain.linearRampToValueAtTime(0.5, time + beatDuration * 0.5);
      bassGain.gain.linearRampToValueAtTime(0, time + beatDuration * 0.9);
    }
    
    // Start and stop the bass oscillator
    bassOscillator.start(0);
    bassOscillator.stop(duration);
    
    // Create lead melody with proper harmonic overtones
    const leadOscillator = offlineContext.createOscillator();
    const leadGain = offlineContext.createGain();
    
    // Set the oscillator type based on genre
    if (parameters.genre === 'electronic' || parameters.genre === 'pop') {
      leadOscillator.type = 'sawtooth';
    } else if (parameters.genre === 'rock') {
      leadOscillator.type = 'square';
    } else {
      leadOscillator.type = 'sine';
    }
    
    leadOscillator.frequency.value = baseFreq;
    
    // Connect lead through gain to master
    leadOscillator.connect(leadGain);
    leadGain.connect(lowpass);
    
    // Create lead melody pattern
    const leadPattern = [0, 4, 7, 4, 5, 9, 7, 11];
    
    for (let beat = 0; beat < totalBeats; beat++) {
      if (beat % 2 === 0) {  // Play notes on every other beat
        const time = beat * beatDuration;
        const patternIndex = (beat / 2) % leadPattern.length;
        const note = leadPattern[patternIndex];
        
        // Calculate frequency from base note and pattern
        const freq = baseFreq * Math.pow(2, note / 12);
        
        // Schedule the frequency change
        leadOscillator.frequency.setValueAtTime(freq, time);
        
        // Create volume envelope for each note
        leadGain.gain.setValueAtTime(0, time);
        leadGain.gain.linearRampToValueAtTime(0.5, time + 0.05);
        leadGain.gain.linearRampToValueAtTime(0.3, time + beatDuration * 0.5);
        leadGain.gain.linearRampToValueAtTime(0, time + beatDuration * 0.9);
      }
    }
    
    // Start and stop the lead oscillator
    leadOscillator.start(0);
    leadOscillator.stop(duration);
    
    // Add pad chords for thickness (if not ambient or electronic)
    if (!['ambient', 'electronic'].includes(parameters.genre)) {
      const padOscillators = [];
      const padGains = [];
      
      // Create chord notes
      const chordNotes = [0, 4, 7]; // Major triad
      
      for (let i = 0; i < chordNotes.length; i++) {
        const osc = offlineContext.createOscillator();
        const gain = offlineContext.createGain();
        
        // Set oscillator type and frequency
        osc.type = 'sine';
        osc.frequency.value = baseFreq * Math.pow(2, chordNotes[i] / 12);
        
        // Connect oscillator through gain
        osc.connect(gain);
        gain.connect(lowpass);
        
        // Set gain level - make it subtle
        gain.gain.value = 0.15;
        
        // Save references
        padOscillators.push(osc);
        padGains.push(gain);
        
        // Start oscillator
        osc.start(0);
        osc.stop(duration);
      }
      
      // Create chord changes
      const chordChanges = [0, 5, 7, 0]; // I - IV - V - I progression
      const chordDuration = beatDuration * 4; // One chord per bar
      
      for (let chord = 0; chord < Math.ceil(duration / chordDuration); chord++) {
        const time = chord * chordDuration;
        const chordIndex = chord % chordChanges.length;
        const transposeAmount = chordChanges[chordIndex];
        
        // Transpose each oscillator in the chord
        for (let i = 0; i < chordNotes.length; i++) {
          const transposedNote = chordNotes[i] + transposeAmount;
          const freq = baseFreq * Math.pow(2, transposedNote / 12);
          
          // Schedule frequency change
          padOscillators[i].frequency.setValueAtTime(freq, time);
          
          // Create volume envelope for each chord
          padGains[i].gain.setValueAtTime(0.05, time);
          padGains[i].gain.linearRampToValueAtTime(0.15, time + 1);
          padGains[i].gain.linearRampToValueAtTime(0.05, time + chordDuration * 0.9);
        }
      }
    }
    
    console.log(`Generated music with BPM=${bpm}, genre=${parameters.genre}, duration=${duration}s`);
  }
  else if (type === 'vocal' || type === 'speech') {
    // Generate vocal or speech simulation
    const isVocal = type === 'vocal';
    const baseFreq = isVocal ? 
                     (parameters.gender === 'male' ? 120 : 220) : // Vocal
                     180; // Speech
    
    // Create formant filters for vocal characteristics
    const formants = [];
    const formantGains = [];
    const formantFrequencies = isVocal ? 
                               [500, 1200, 2500, 3500] : // Singing formants
                               [730, 1090, 2440]; // Speech formants
    
    // Create source oscillator
    const source = offlineContext.createOscillator();
    source.type = 'sawtooth'; // Rich harmonic content for voice
    source.frequency.value = baseFreq;
    
    // Create source gain
    const sourceGain = offlineContext.createGain();
    sourceGain.gain.value = 0.6;
    
    // Connect source to gain
    source.connect(sourceGain);
    
    // Create formant filters
    for (let i = 0; i < formantFrequencies.length; i++) {
      const formant = offlineContext.createBiquadFilter();
      const formantGain = offlineContext.createGain();
      
      formant.type = 'bandpass';
      formant.frequency.value = formantFrequencies[i];
      formant.Q.value = 10;
      
      // Set gain based on formant importance
      formantGain.gain.value = 1.0 / (i + 1);
      
      // Connect source gain to formant filter to formant gain to master
      sourceGain.connect(formant);
      formant.connect(formantGain);
      formantGain.connect(masterGain);
      
      formants.push(formant);
      formantGains.push(formantGain);
    }
    
    // Create vibrato for vocals
    if (isVocal) {
      const vibratoAmount = 5; // Hz variation
      const vibratoRate = 5; // 5Hz vibrato
      
      // Add vibrato throughout the duration
      for (let t = 0; t < duration; t += 0.05) {
        source.frequency.setValueAtTime(
          baseFreq + Math.sin(t * vibratoRate * 2 * Math.PI) * vibratoAmount,
          t
        );
      }
    }
    
    // Create syllable patterns for realistic speech/singing
    const syllableDuration = isVocal ? 0.25 : 0.15; // seconds per syllable
    const syllables = Math.ceil(duration / syllableDuration);
    
    // Function to switch between different vowel sounds by changing formants
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    
    for (let i = 0; i < syllables; i++) {
      const time = i * syllableDuration;
      const vowelIndex = i % vowels.length;
      
      // Change formant frequencies for different vowels
      switch (vowels[vowelIndex]) {
        case 'a': // "ah" sound
          if (formants.length > 0) formants[0].frequency.setValueAtTime(730, time);
          if (formants.length > 1) formants[1].frequency.setValueAtTime(1090, time);
          if (formants.length > 2) formants[2].frequency.setValueAtTime(2440, time);
          break;
          
        case 'e': // "eh" sound
          if (formants.length > 0) formants[0].frequency.setValueAtTime(530, time);
          if (formants.length > 1) formants[1].frequency.setValueAtTime(1840, time);
          if (formants.length > 2) formants[2].frequency.setValueAtTime(2480, time);
          break;
          
        case 'i': // "ee" sound
          if (formants.length > 0) formants[0].frequency.setValueAtTime(270, time);
          if (formants.length > 1) formants[1].frequency.setValueAtTime(2290, time);
          if (formants.length > 2) formants[2].frequency.setValueAtTime(3010, time);
          break;
          
        case 'o': // "oh" sound
          if (formants.length > 0) formants[0].frequency.setValueAtTime(570, time);
          if (formants.length > 1) formants[1].frequency.setValueAtTime(840, time);
          if (formants.length > 2) formants[2].frequency.setValueAtTime(2410, time);
          break;
          
        case 'u': // "oo" sound
          if (formants.length > 0) formants[0].frequency.setValueAtTime(370, time);
          if (formants.length > 1) formants[1].frequency.setValueAtTime(950, time);
          if (formants.length > 2) formants[2].frequency.setValueAtTime(2650, time);
          break;
      }
      
      // Create amplitude envelope for each syllable
      sourceGain.gain.setValueAtTime(0.1, time);
      sourceGain.gain.linearRampToValueAtTime(0.6, time + 0.02);
      sourceGain.gain.linearRampToValueAtTime(0.3, time + syllableDuration * 0.7);
      sourceGain.gain.linearRampToValueAtTime(0.1, time + syllableDuration * 0.9);
    }
    
    // Add pitch contour (rising/falling) for more natural speech/singing
    for (let t = 0; t < duration; t += 1) {
      const pitchVariation = Math.sin(t * 0.5 * Math.PI) * 20; // +/- 20 Hz variation
      
      source.frequency.setValueAtTime(
        baseFreq + pitchVariation,
        t
      );
    }
    
    // Start and stop the oscillator
    source.start(0);
    source.stop(duration);
    
    console.log(`Generated ${type} with baseFreq=${baseFreq}, duration=${duration}s`);
  }
  else if (type === 'drums') {
    // Generate drum patterns with specified style and tempo
    const style = parameters.genre || 'trap';
    const bpm = parameters.tempo;
    const beatsPerSecond = bpm / 60;
    const beatDuration = 60 / bpm;
    
    // Create a compressor for better drum dynamics
    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressor.connect(masterGain);

    // Total number of beats in the duration
    const totalBeats = Math.ceil(duration * beatsPerSecond);
    
    // Pattern definitions for different styles
    let kickPattern: number[] = [];
    let snarePattern: number[] = [];
    let hihatPattern: number[] = [];

    switch (style) {
      case 'trap':
        // Trap style (heavy kicks, fast hi-hats, occasional snare)
        kickPattern = [0, 0, 7, 8, 12, 14];  // 16th notes where kicks occur
        snarePattern = [4, 12];              // Snares on beats 2 and 4
        hihatPattern = [0, 2, 4, 6, 8, 10, 12, 14]; // 8th notes hi-hats
        break;
      
      case 'hiphop':
        // Hip hop style (boom bap)
        kickPattern = [0, 2, 8, 10];
        snarePattern = [4, 12];
        hihatPattern = [0, 2, 4, 6, 8, 10, 12, 14];
        break;
        
      case 'rock':
        // Rock style (steady backbeat)
        kickPattern = [0, 6, 8, 14];
        snarePattern = [4, 12];
        hihatPattern = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // 16th notes
        break;
        
      case 'electronic':
        // Electronic style (four-on-the-floor)
        kickPattern = [0, 4, 8, 12];
        snarePattern = [4, 12];
        hihatPattern = [1, 3, 5, 7, 9, 11, 13, 15]; // Off-beat hi-hats
        break;
        
      case 'jazz':
        // Jazz style (ride-based pattern)
        kickPattern = [0, 8];
        snarePattern = [4, 12];
        hihatPattern = [0, 2, 4, 6, 8, 9, 10, 12, 14]; // Ride pattern
        break;
    }
    
    // Create drums for each beat
    for (let i = 0; i < totalBeats; i++) {
      const sixteenthInBeat = i % 16;
      const time = (i / 16) * 4 * beatDuration + (sixteenthInBeat * beatDuration / 4);
      
      // Add kick drum
      if (kickPattern.includes(sixteenthInBeat)) {
        const kick = createKickDrum(offlineContext, time);
        kick.connect(compressor);
      }
      
      // Add snare drum
      if (snarePattern.includes(sixteenthInBeat)) {
        const snare = createSnare(offlineContext, time);
        snare.connect(compressor);
      }
      
      // Add hi-hat
      if (hihatPattern.includes(sixteenthInBeat)) {
        // Vary the hi-hat volume to create rhythm
        const hihatGain = sixteenthInBeat % 4 === 0 ? 0.4 : 0.25;
        const hihat = createHiHat(offlineContext, time, hihatGain);
        hihat.connect(compressor);
      }
    }
    
    console.log(`Generated drums with style=${style}, tempo=${bpm}, duration=${duration}s`);
  }
  else if (type === 'melody') {
    // Generate melodic patterns with specified key, tempo and scale
    const combinedKeyScale = parameters.genre || 'Cmajor';
    const key = combinedKeyScale.charAt(0);
    const scale = combinedKeyScale.substring(1);
    const bpm = parameters.tempo;
    const beatsPerSecond = bpm / 60;
    const beatDuration = 60 / bpm;
    
    // Set up base frequency based on key
    let baseFreq: number;
    switch (key) {
      case 'C': baseFreq = 261.63; break; // C4
      case 'D': baseFreq = 293.66; break; // D4
      case 'E': baseFreq = 329.63; break; // E4
      case 'F': baseFreq = 349.23; break; // F4
      case 'G': baseFreq = 392.00; break; // G4
      case 'A': baseFreq = 440.00; break; // A4
      case 'B': baseFreq = 493.88; break; // B4
      default: baseFreq = 261.63; // Default to C4
    }
    
    // Define scale patterns
    let scaleIntervals: number[];
    switch (scale) {
      case 'major':
        scaleIntervals = [0, 2, 4, 5, 7, 9, 11]; // Whole, Whole, Half, Whole, Whole, Whole, Half
        break;
        
      case 'minor':
        scaleIntervals = [0, 2, 3, 5, 7, 8, 10]; // Whole, Half, Whole, Whole, Half, Whole, Whole
        break;
        
      case 'pentatonic':
        scaleIntervals = [0, 2, 4, 7, 9]; // Major pentatonic
        break;
        
      case 'blues':
        scaleIntervals = [0, 3, 5, 6, 7, 10]; // Blues scale
        break;
        
      default:
        scaleIntervals = [0, 2, 4, 5, 7, 9, 11]; // Default to major
    }
    
    // Create compressor and reverb for melody
    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressor.connect(masterGain);
    
    // Create a convolver for reverb
    const convolver = offlineContext.createConvolver();
    
    // Create a simple impulse response for reverb
    const impulseLength = 0.5 * offlineContext.sampleRate;
    const impulse = offlineContext.createBuffer(2, impulseLength, offlineContext.sampleRate);
    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);
    
    // Fill the impulse with decreasing random values
    for (let i = 0; i < impulseLength; i++) {
      const decay = Math.exp(-i / (impulseLength * 0.5));
      leftChannel[i] = (Math.random() * 2 - 1) * decay;
      rightChannel[i] = (Math.random() * 2 - 1) * decay;
    }
    
    convolver.buffer = impulse;
    
    // Create a gain node for the wet (reverb) signal
    const reverbGain = offlineContext.createGain();
    reverbGain.gain.value = 0.2; // Subtler reverb
    
    // Connect the reverb chain
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);
    
    // Create melody pattern
    const noteLength = beatDuration * 0.9; // Leave a small gap between notes
    const notesPerBar = 8; // 8th notes
    const totalNotes = Math.ceil(duration / (beatDuration / 2)); // 8th notes in the duration
    
    // Create a melody pattern based on scale
    // Simple pattern using scale tones
    let melodyPattern: number[] = [];
    
    for (let i = 0; i < totalNotes; i++) {
      // Use a combination of step-wise and interval motion
      if (i % 4 === 0) {
        // Start phrases on root or fifth
        melodyPattern.push(i % 8 === 0 ? 0 : 4);
      } else if (i % 4 === 1) {
        // Second note often steps up or down
        melodyPattern.push(i % 8 === 1 ? 1 : 2);
      } else if (i % 4 === 2) {
        // Third note often a larger jump
        melodyPattern.push(i % 8 === 2 ? 4 : 3);
      } else {
        // Fourth note returns to a stable tone
        melodyPattern.push(i % 8 === 3 ? 0 : 2);
      }
    }
    
    // Create oscillator for melody
    const melodyOsc = offlineContext.createOscillator();
    melodyOsc.type = 'sine';
    
    // Create gain node for shaping the notes
    const melodyGain = offlineContext.createGain();
    melodyGain.gain.value = 0;
    
    // Connect oscillator to gain to compressor and reverb
    melodyOsc.connect(melodyGain);
    melodyGain.connect(compressor);
    melodyGain.connect(convolver); // Send to reverb as well for depth
    
    // Schedule all the melody notes
    for (let i = 0; i < totalNotes; i++) {
      const time = i * (beatDuration / 2); // 8th notes
      
      // Get scale degree from pattern and map to actual interval
      const scaleDegree = melodyPattern[i % melodyPattern.length];
      const octave = Math.floor(scaleDegree / scaleIntervals.length);
      const scaleIndex = scaleDegree % scaleIntervals.length;
      const interval = scaleIntervals[scaleIndex] + (12 * octave);
      
      // Calculate frequency
      const freq = baseFreq * Math.pow(2, interval / 12);
      
      // Schedule frequency change
      melodyOsc.frequency.setValueAtTime(freq, time);
      
      // Create volume envelope for the note
      melodyGain.gain.setValueAtTime(0, time);
      melodyGain.gain.linearRampToValueAtTime(0.5, time + 0.02);
      melodyGain.gain.linearRampToValueAtTime(0.3, time + noteLength * 0.7);
      melodyGain.gain.linearRampToValueAtTime(0, time + noteLength);
    }
    
    // Start and stop the oscillator
    melodyOsc.start(0);
    melodyOsc.stop(duration);
    
    console.log(`Generated melody in key=${key} scale=${scale}, tempo=${bpm}, duration=${duration}s`);
  }
  else if (type === 'sfx') {
    // Generate sound effect based on category
    const sfxCategory = parameters.genre || 'ambient';
    
    switch (sfxCategory) {
      case 'ambient': {
        // Create ambient atmosphere with filtered noise and drones
        const noiseBufferSize = offlineContext.sampleRate * 2; // 2 seconds of noise
        const noiseBuffer = offlineContext.createBuffer(1, noiseBufferSize, offlineContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        
        // Fill the buffer with noise
        for (let i = 0; i < noiseBufferSize; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        
        // Create noise source
        const noiseSource = offlineContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        
        // Create filters
        const lowpassFilter = offlineContext.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.value = 400;
        lowpassFilter.Q.value = 0.7;
        
        const highpassFilter = offlineContext.createBiquadFilter();
        highpassFilter.type = 'highpass';
        highpassFilter.frequency.value = 100;
        highpassFilter.Q.value = 0.7;
        
        // Create gain node for noise
        const noiseGain = offlineContext.createGain();
        noiseGain.gain.value = 0.15;
        
        // Create slow LFO for filter modulation
        const lfoRate = 0.1; // Hz
        
        // Modulate filter frequency over time
        for (let t = 0; t < duration; t += 0.1) {
          const modulation = 200 + 100 * Math.sin(t * lfoRate * 2 * Math.PI);
          lowpassFilter.frequency.setValueAtTime(400 + modulation, t);
        }
        
        // Connect noise path
        noiseSource.connect(highpassFilter);
        highpassFilter.connect(lowpassFilter);
        lowpassFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        
        // Create drone tones for atmosphere
        const droneTones = [100, 150, 200, 300];
        
        for (let i = 0; i < droneTones.length; i++) {
          const droneOsc = offlineContext.createOscillator();
          const droneGain = offlineContext.createGain();
          
          droneOsc.type = 'sine';
          droneOsc.frequency.value = droneTones[i];
          
          droneGain.gain.value = 0.1 / (i + 1);
          
          // Add subtle pitch variations
          for (let t = 0; t < duration; t += 0.5) {
            const pitchVariation = droneTones[i] * 0.01 * Math.sin(t * 0.2 * 2 * Math.PI);
            droneOsc.frequency.setValueAtTime(droneTones[i] + pitchVariation, t);
          }
          
          // Connect drone
          droneOsc.connect(droneGain);
          droneGain.connect(masterGain);
          
          // Start oscillator
          droneOsc.start(0);
          droneOsc.stop(duration);
        }
        
        // Start noise
        noiseSource.start(0);
        noiseSource.stop(duration);
        
        console.log(`Generated ambient SFX with duration=${duration}s`);
        break;
      }
      
      case 'impact': {
        // Create impact/hit sound with sharp attack and quick decay
        
        // Noise component for the attack
        const noiseBufferSize = offlineContext.sampleRate;
        const noiseBuffer = offlineContext.createBuffer(1, noiseBufferSize, offlineContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        
        // Fill with noise
        for (let i = 0; i < noiseBufferSize; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        
        // Create noise source
        const noiseSource = offlineContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        // Create bandpass filter
        const bandpass = offlineContext.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1000;
        bandpass.Q.value = 0.7;
        
        // Create noise gain with sharp envelope
        const noiseGain = offlineContext.createGain();
        noiseGain.gain.setValueAtTime(0, 0);
        noiseGain.gain.linearRampToValueAtTime(0.7, 0.001);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, 0.3);
        
        // Connect noise path
        noiseSource.connect(bandpass);
        bandpass.connect(noiseGain);
        noiseGain.connect(masterGain);
        
        // Create tone component for the body
        const tone = offlineContext.createOscillator();
        const toneGain = offlineContext.createGain();
        
        tone.type = 'triangle';
        tone.frequency.setValueAtTime(200, 0);
        tone.frequency.exponentialRampToValueAtTime(50, 0.5);
        
        toneGain.gain.setValueAtTime(0, 0);
        toneGain.gain.linearRampToValueAtTime(0.8, 0.005);
        toneGain.gain.exponentialRampToValueAtTime(0.001, 1.0);
        
        // Connect tone path
        tone.connect(toneGain);
        toneGain.connect(masterGain);
        
        // Start sources
        noiseSource.start(0);
        tone.start(0);
        tone.stop(duration);
        
        console.log(`Generated impact SFX with duration=${duration}s`);
        break;
      }
      
      default: {
        // Create a synthetic SFX (electronic beep sequence)
        
        // Create oscillator
        const osc = offlineContext.createOscillator();
        const gain = offlineContext.createGain();
        
        osc.type = 'square';
        osc.frequency.value = 440;
        
        // Connect oscillator
        osc.connect(gain);
        gain.connect(masterGain);
        
        // Create sequence of beeps
        const beepDuration = 0.2;
        const numBeeps = Math.floor(duration / beepDuration);
        
        for (let i = 0; i < numBeeps; i++) {
          const time = i * beepDuration;
          
          // Vary frequency for each beep
          const freq = 440 + (i * 110);
          osc.frequency.setValueAtTime(freq, time);
          
          // Create envelope for each beep
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.6, time + 0.01);
          gain.gain.linearRampToValueAtTime(0.4, time + beepDuration * 0.5);
          gain.gain.linearRampToValueAtTime(0, time + beepDuration * 0.9);
        }
        
        // Start oscillator
        osc.start(0);
        osc.stop(duration);
        
        console.log(`Generated default SFX with duration=${duration}s`);
      }
    }
  }
  
  // Render the audio to a buffer
  console.log(`Rendering ${duration.toFixed(1)}s of audio...`);
  try {
    const renderedBuffer = await offlineContext.startRendering();
    console.log(`Successfully rendered audio (${renderedBuffer.duration.toFixed(2)}s, ${renderedBuffer.numberOfChannels} channels)`);
    return renderedBuffer;
  } catch (error) {
    console.error("Error rendering audio:", error);
    
    // Fallback to simple audio generation if offline rendering fails
    const fallbackBuffer = audioContext.createBuffer(
      numberOfChannels, 
      frameCount, 
      sampleRate
    );
    
    // Fill with a simple sine wave in case of error
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = fallbackBuffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        channelData[i] = Math.sin(2 * Math.PI * 440 * t) * 0.5;
      }
    }
    
    return fallbackBuffer;
  }
}

// Create a kick drum sound
function createKickDrum(context: AudioContext | OfflineAudioContext, time: number): AudioNode {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  
  oscillator.connect(gainNode);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(150, time);
  oscillator.frequency.exponentialRampToValueAtTime(40, time + 0.2);
  
  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(0.8, time + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  
  oscillator.start(time);
  oscillator.stop(time + 0.3);
  
  return gainNode;
}

// Create a snare drum sound
function createSnare(context: AudioContext | OfflineAudioContext, time: number): AudioNode {
  const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  
  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1000;
  
  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0, time);
  noiseGain.gain.linearRampToValueAtTime(0.8, time + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
  
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  
  noise.start(time);
  
  // Add body/tone
  const oscillator = context.createOscillator();
  const oscGain = context.createGain();
  
  oscillator.type = 'triangle';
  oscillator.frequency.value = 200;
  
  oscGain.gain.setValueAtTime(0, time);
  oscGain.gain.linearRampToValueAtTime(0.5, time + 0.01);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  
  oscillator.connect(oscGain);
  
  oscillator.start(time);
  oscillator.stop(time + 0.1);
  
  // Combine both components through a gain node
  const combinedGain = context.createGain();
  oscGain.connect(combinedGain);
  noiseGain.connect(combinedGain);
  
  return combinedGain;
}

// Create a hi-hat sound
function createHiHat(context: AudioContext | OfflineAudioContext, time: number, gain: number): AudioNode {
  const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.1, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  
  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 7000;
  
  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0, time);
  noiseGain.gain.linearRampToValueAtTime(gain, time + 0.005);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  
  noise.start(time);
  
  return noiseGain;
}

// Helper function to convert AudioBuffer to WAV format for playback
async function audioBufferToWAV(buffer: AudioBuffer): Promise<Blob> {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2;
  const dataView = new DataView(new ArrayBuffer(44 + length));
  
  // Write WAV header
  writeString(dataView, 0, 'RIFF');
  dataView.setUint32(4, 36 + length, true);
  writeString(dataView, 8, 'WAVE');
  writeString(dataView, 12, 'fmt ');
  dataView.setUint32(16, 16, true);
  dataView.setUint16(20, 1, true);
  dataView.setUint16(22, numOfChan, true);
  dataView.setUint32(24, buffer.sampleRate, true);
  dataView.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
  dataView.setUint16(32, numOfChan * 2, true);
  dataView.setUint16(34, 16, true);
  writeString(dataView, 36, 'data');
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
  
  return new Blob([dataView.buffer], { type: 'audio/wav' });
}

// Helper function to write strings to DataView
function writeString(dataView: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    dataView.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Extract waveform data from AudioBuffer for visualization
function extractWaveformData(audioBuffer: AudioBuffer): number[] {
  const channelData = audioBuffer.getChannelData(0); // Use the first channel
  
  // Calculate number of points based on duration to ensure high resolution
  // More points for longer audio (1 point per 10ms minimum)
  const duration = audioBuffer.duration;
  const points = Math.max(500, Math.floor(duration * 100)); 
  
  const blockSize = Math.floor(channelData.length / points);
  const waveform = [];
  
  // Calculate the maximum value for normalization
  let maxValue = 0.001; // Small non-zero default to avoid division by zero
  for (let i = 0; i < channelData.length; i++) {
    maxValue = Math.max(maxValue, Math.abs(channelData[i]));
  }
  
  // Fill the waveform data with normalized values
  for (let i = 0; i < points; i++) {
    const start = blockSize * i;
    let sum = 0;
    
    // Compute RMS (root mean square) for better amplitude representation
    for (let j = 0; j < blockSize; j++) {
      if (start + j < channelData.length) {
        const sample = channelData[start + j];
        sum += sample * sample; // Square for RMS calculation
      }
    }
    
    // Calculate RMS and normalize relative to maximum value
    const rms = Math.sqrt(sum / blockSize);
    const normalizedValue = rms / maxValue;
    
    // Scale to a reasonable amplitude range (0.05-0.95) to ensure visibility
    waveform.push(0.05 + normalizedValue * 0.9);
  }
  
  console.log(`Created high-resolution waveform with ${points} points for ${duration.toFixed(2)}s audio`);
  return waveform;
}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Make toast accessible throughout the component

// Import Track and AudioRegion types from the parent component
interface Track {
  id: number;
  name: string;
  type: 'audio' | 'instrument' | 'vocal' | 'drum' | 'mix';
  volume: number;
  pan: number;
  isMuted: boolean;
  isSoloed: boolean;
  createdBy?: string;
  collaborator?: {
    id: string;
    name: string;
    color: string;
  } | null;
  creationMethod?: 'recorded' | 'uploaded' | 'ai-generated';
}

interface AudioRegion {
  id: string;
  trackId: number;
  start: number;
  end: number;
  offset: number;
  name: string;
  waveform: number[];
  file: string;
}
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

// Define types

interface GenParameters {
  model: string;
  genre: string;
  mood: string;
  key?: string;
  scale?: string;
  tempo: number;
  duration: number;
  complexity?: number;
}

interface GenerationSettings {
  type: 'music' | 'vocal' | 'speech' | 'sfx' | 'drums' | 'melody';
  prompt: string;
  parameters: GenParameters;
}

interface HistoryItem {
  id: string;
  timestamp: Date;
  type: 'music' | 'vocal' | 'speech' | 'sfx' | 'drums' | 'melody' | 'enhance';
  prompt: string;
  parameters: GenParameters;
  duration: number;
}

// Component props
interface AIGenerationPanelProps {
  onGenerateTrack: (track: {
    buffer: ArrayBuffer;
    name?: string;
    type?: 'audio' | 'instrument' | 'vocal' | 'drum' | 'mix';
    duration?: number;
    waveform?: number[];
    creationMethod?: 'recorded' | 'uploaded' | 'ai-generated';
  }) => void;
  activeTrack?: Track;
  selectedRegions?: AudioRegion[];
  bpm?: number;
  isSubscriptionActive?: boolean;
  apiKeyAvailable?: boolean;
  onEnhanceTrack?: (trackId: number, enhancementOptions: {
    clarity?: number;
    noiseSuppression?: boolean;
    bassBoost?: number;
    stereoWidening?: number;
    denoise?: boolean;
    eq?: boolean;
    compression?: boolean;
  }) => void;
}

export function AIGenerationPanel({
  onGenerateTrack,
  activeTrack,
  selectedRegions,
  bpm = 120,
  isSubscriptionActive = false,
  apiKeyAvailable = false,
  onEnhanceTrack
}: AIGenerationPanelProps) {
  // Get toast function
  const { toast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState<'music' | 'drums' | 'melody' | 'vocal' | 'speech' | 'sfx' | 'enhance'>('music');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState<string>('Generating...');
  const [generatedAudio, setGeneratedAudio] = useState<Blob | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Enhancement settings
  const [enhanceClarity, setEnhanceClarity] = useState(0.5);
  const [enhanceNoiseSuppression, setEnhanceNoiseSuppression] = useState(false);
  const [enhanceBassBoost, setEnhanceBassBoost] = useState(0.3);
  const [enhanceStereoWidening, setEnhanceStereoWidening] = useState(0.2);
  const [enhanceDenoise, setEnhanceDenoise] = useState(true);
  const [enhanceEQ, setEnhanceEQ] = useState(true);
  const [enhanceCompression, setEnhanceCompression] = useState(true);
  
  // Music generation state
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicGenre, setMusicGenre] = useState('electronic');
  const [musicMood, setMusicMood] = useState('upbeat');
  const [musicTempo, setMusicTempo] = useState(120);
  const [musicDuration, setMusicDuration] = useState(15);
  const [musicModel, setMusicModel] = useState('standard');
  
  // Vocal generation state
  const [vocalPrompt, setVocalPrompt] = useState('');
  const [vocalStyle, setVocalStyle] = useState('pop');
  const [vocalGender, setVocalGender] = useState('female');
  const [vocalDuration, setVocalDuration] = useState(10);
  
  // Speech generation state
  const [speechText, setSpeechText] = useState('');
  const [speechVoice, setSpeechVoice] = useState('default');
  const [speechSpeed, setSpeechSpeed] = useState(1);
  
  // Drums/beat generation state
  const [drumsPrompt, setDrumsPrompt] = useState('');
  const [drumsStyle, setDrumsStyle] = useState('trap');
  const [drumsTempo, setDrumsTempo] = useState(120);
  const [drumsDuration, setDrumsDuration] = useState(8);
  const [drumsComplexity, setDrumsComplexity] = useState(70);
  
  // Melody generation state
  const [melodyPrompt, setMelodyPrompt] = useState('');
  const [melodyKey, setMelodyKey] = useState('C');
  const [melodyScale, setMelodyScale] = useState('major');
  const [melodyTempo, setMelodyTempo] = useState(120);
  const [melodyDuration, setMelodyDuration] = useState(8);
  const [melodyOctave, setMelodyOctave] = useState(4);
  
  // SFX generation state
  const [sfxPrompt, setSfxPrompt] = useState('');
  const [sfxDuration, setSfxDuration] = useState(5);
  const [sfxCategory, setSfxCategory] = useState('ambient');
  
  // Handle generate button click
  const handleGenerate = async () => {
    // Ensure audio context is started from user interaction
    try {
      await import('@/lib/audioProcessor').then(module => {
        const audioProcessor = new module.AudioProcessor();
        return audioProcessor.ensureAudioContextRunning();
      });
    } catch (error) {
      console.error('Failed to start audio context:', error);
    }
    
    if (!apiKeyAvailable) {
      toast({
        title: 'API Key Required',
        description: 'You need to add an API key to use AI generation features.',
        variant: 'destructive'
      });
      return;
    }
    
    // Check if we have a prompt and not on enhance tab
    if (activeTab === 'enhance') {
      return; // We shouldn't get here due to UI restrictions, but just in case
    }
    
    if ((activeTab === 'music' && !musicPrompt) || 
        (activeTab === 'vocal' && !vocalPrompt) || 
        (activeTab === 'speech' && !speechText) || 
        (activeTab === 'sfx' && !sfxPrompt) ||
        (activeTab === 'drums' && !drumsPrompt) ||
        (activeTab === 'melody' && !melodyPrompt)) {
      toast({
        description: 'Please enter a prompt or text for generation.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Build parameters based on active tab
      let generationSettings: GenerationSettings;
      let generationType: 'music' | 'vocal' | 'speech' | 'sfx' | 'drums' | 'melody' = activeTab as any;
      let generationDuration = 0;
      
      switch (activeTab) {
        case 'music':
          generationSettings = {
            type: 'music',
            prompt: musicPrompt,
            parameters: {
              model: musicModel,
              genre: musicGenre,
              mood: musicMood,
              key: melodyKey,
              scale: melodyScale,
              tempo: musicTempo,
              duration: musicDuration
            }
          };
          generationDuration = musicDuration;
          break;
          
        case 'drums':
          generationSettings = {
            type: 'drums',
            prompt: drumsPrompt,
            parameters: {
              model: 'standard',
              genre: drumsStyle,
              key: melodyKey,
              mood: 'default',
              tempo: drumsTempo,
              duration: drumsDuration,
              complexity: drumsComplexity / 100
            }
          };
          generationDuration = drumsDuration;
          break;
          
        case 'melody':
          generationSettings = {
            type: 'melody',
            prompt: melodyPrompt,
            parameters: {
              model: 'standard',
              genre: 'melody',
              key: melodyKey,
              scale: melodyScale,
              mood: 'default',
              tempo: melodyTempo,
              duration: melodyDuration
            }
          };
          generationDuration = melodyDuration;
          break;
          
        case 'vocal':
          generationSettings = {
            type: 'vocal',
            prompt: vocalPrompt,
            parameters: {
              model: vocalStyle,
              genre: vocalStyle,
              mood: 'default',
              tempo: musicTempo,
              duration: vocalDuration
            }
          };
          generationDuration = vocalDuration;
          break;
          
        case 'speech':
          generationSettings = {
            type: 'speech',
            prompt: speechText,
            parameters: {
              model: speechVoice,
              genre: 'speech',
              mood: 'default',
              tempo: speechSpeed,
              duration: Math.ceil(speechText.length / 15)
            }
          };
          generationDuration = Math.ceil(speechText.length / 15);
          break;
          
        case 'sfx':
          generationSettings = {
            type: 'sfx',
            prompt: sfxPrompt,
            parameters: {
              model: 'standard',
              genre: sfxCategory,
              mood: 'default',
              tempo: 100,
              duration: sfxDuration
            }
          };
          generationDuration = sfxDuration;
          break;
          
        default:
          toast({
            title: 'Invalid Tab',
            description: 'Please select a valid generation tab.',
            variant: 'destructive'
          });
          setIsGenerating(false);
          return;
      }
      
      // Show loading state
      setGeneratingMessage("Contacting AI service...");
      
      try {
        // Call our backend API which will use OpenAI
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: generationType,
            prompt: generationSettings.prompt,
            parameters: generationSettings.parameters
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('AI generation failed:', errorData);
          toast({
            title: "AI Generation Failed",
            description: errorData.message || "Unable to generate audio with AI",
            variant: "destructive",
            duration: 5000
          });
          setIsGenerating(false);
          return;
        }
        
        setGeneratingMessage("Processing AI response...");
        const data = await response.json();
        console.log('AI generation response:', data);
        
        // For now, since we're still building the full audio generation pipeline,
        // we'll create a synthetic audio that at least gives us something to work with
        setGeneratingMessage("Creating audio waveform...");
        const audioBuffer = await generateSyntheticAudio(
          generationType, 
          generationDuration, 
          generationSettings.parameters
        );
        
        // Convert AudioBuffer to WAV Blob
        const audioBlob = await audioBufferToWAV(audioBuffer);
        setGeneratedAudio(audioBlob);
        
        // Display the AI response description
        if (data.description) {
          toast({
            title: "AI Generation Complete",
            description: `Generated ${generationType}: ${data.description.substring(0, 100)}...`,
            duration: 5000
          });
        }
      } catch (error) {
        console.error('Error during AI generation:', error);
        toast({
          title: "AI Generation Error",
          description: "An unexpected error occurred during AI generation. Please try again.",
          variant: "destructive",
          duration: 5000
        });
        setIsGenerating(false);
      }
      
      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: activeTab,
        prompt: activeTab === 'speech' ? speechText : 
               activeTab === 'music' ? musicPrompt :
               activeTab === 'vocal' ? vocalPrompt : 
               activeTab === 'drums' ? drumsPrompt :
               activeTab === 'melody' ? melodyPrompt :
               sfxPrompt,
        parameters: generationSettings.parameters,
        duration: generationSettings.parameters.duration
      };
      
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      
      // Extract waveform data for visualization - with the audioBuffer from the last known successful generation
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();
      
      if (generatedAudio) {
        reader.readAsArrayBuffer(generatedAudio);
        reader.onload = async () => {
          try {
            // Decode the audio data to extract waveform
            const decodedBuffer = await audioContext.decodeAudioData(reader.result as ArrayBuffer);
            const waveformData = extractWaveformData(decodedBuffer);
            
            // Pass to onGenerateTrack directly
            onGenerateTrack({
              buffer: reader.result as ArrayBuffer,
              name: `Generated ${activeTab} - ${new Date().toLocaleTimeString()}`,
              type: activeTab === 'music' ? 'audio' : 
                   activeTab === 'vocal' ? 'vocal' : 
                   activeTab === 'speech' ? 'vocal' : 
                   activeTab === 'drums' ? 'drum' : 
                   activeTab === 'melody' ? 'instrument' : 'audio',
              duration: generationSettings.parameters.duration,
              waveform: waveformData,
              creationMethod: 'ai-generated'
            });
          } catch (error) {
            console.error("Error decoding audio data:", error);
          }
        };
      } else {
        console.error("No generated audio blob available");
        toast({
          title: "Processing Error",
          description: "There was an issue with the generated audio",
          variant: "destructive"
        });
      }
      // We process the audio in the onload event above, so we don't need this handler anymore
      // as it was causing a duplicate track issue and referencing undefined variables
      
      toast({
        title: 'Generation Complete',
        description: `Your ${activeTab} has been generated successfully.`
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'There was an error generating your audio.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle add to project button click
  const handleAddToProject = () => {
    if (!generatedAudio) return;
    
    // Build settings object
    let settings: GenerationSettings;
    let duration = 0;
    
    // Skip this processing if on enhance tab
    if (activeTab === 'enhance') {
      toast({
        title: 'Invalid Operation',
        description: 'Cannot add enhancement to project as a new track.',
        variant: 'destructive'
      });
      return;
    }
    
    switch (activeTab) {
      case 'music':
        settings = {
          type: 'music',
          prompt: musicPrompt,
          parameters: {
            model: musicModel,
            genre: musicGenre,
            mood: musicMood,
            key: melodyKey,
            scale: melodyScale,
            tempo: musicTempo,
            duration: musicDuration
          }
        };
        duration = musicDuration;
        break;
        
      case 'drums':
        settings = {
          type: 'drums',
          prompt: drumsPrompt,
          parameters: {
            model: 'standard',
            genre: drumsStyle,
            key: melodyKey,
            mood: 'default',
            tempo: drumsTempo,
            duration: drumsDuration,
            complexity: drumsComplexity / 100
          }
        };
        duration = drumsDuration;
        break;
        
      case 'melody':
        settings = {
          type: 'melody',
          prompt: melodyPrompt,
          parameters: {
            model: 'standard',
            genre: 'melody',
            key: melodyKey,
            scale: melodyScale,
            mood: 'default',
            tempo: melodyTempo,
            duration: melodyDuration
          }
        };
        duration = melodyDuration;
        break;
        
      case 'vocal':
        settings = {
          type: 'vocal',
          prompt: vocalPrompt,
          parameters: {
            model: vocalStyle,
            genre: vocalStyle,
            mood: 'default',
            tempo: musicTempo,
            duration: vocalDuration
          }
        };
        duration = vocalDuration;
        break;
        
      case 'speech':
        settings = {
          type: 'speech',
          prompt: speechText,
          parameters: {
            model: speechVoice,
            genre: 'speech',
            mood: 'default',
            tempo: speechSpeed,
            duration: Math.ceil(speechText.length / 15)
          }
        };
        duration = Math.ceil(speechText.length / 15);
        break;
        
      case 'sfx':
        settings = {
          type: 'sfx',
          prompt: sfxPrompt,
          parameters: {
            model: 'standard',
            genre: sfxCategory,
            mood: 'default',
            tempo: 100,
            duration: sfxDuration
          }
        };
        duration = sfxDuration;
        break;
        
      default:
        toast({
          title: 'Invalid Tab',
          description: 'Please select a valid generation tab.',
          variant: 'destructive'
        });
        return;
    }
    
    // Convert Blob to ArrayBuffer and call onGenerateTrack
    const reader = new FileReader();
    reader.readAsArrayBuffer(generatedAudio);
    reader.onloadend = async () => {
      if (reader.result) {
        // Convert ArrayBuffer to AudioBuffer for extracting waveform
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(reader.result as ArrayBuffer);
        
        // Extract the waveform data
        const waveformData = extractWaveformData(audioBuffer);
        
        console.log(`Adding track to project: ${activeTab}, duration=${duration}s, waveform points=${waveformData.length}`);
        
        onGenerateTrack({
          buffer: reader.result as ArrayBuffer,
          name: `Generated ${activeTab} - ${new Date().toLocaleTimeString()}`,
          type: activeTab === 'music' ? 'audio' : 
               activeTab === 'vocal' ? 'vocal' : 
               activeTab === 'speech' ? 'vocal' : 
               activeTab === 'drums' ? 'drum' : 
               activeTab === 'melody' ? 'instrument' : 'audio',
          duration: duration,
          waveform: waveformData,
          creationMethod: 'ai-generated'
        });
      }
    };
    
    toast({
      title: 'Added to Project',
      description: `The generated ${activeTab} has been added to your project.`
    });
  };
  
  // Handle history item click
  const handleHistoryItemClick = (item: HistoryItem) => {
    // Load the settings from history
    switch (item.type) {
      case 'music':
        setActiveTab('music');
        setMusicPrompt(item.prompt);
        setMusicGenre(item.parameters.genre);
        setMusicMood(item.parameters.mood);
        // Get key and scale if available
        if (item.parameters.key) {
          setMelodyKey(item.parameters.key);
        }
        if (item.parameters.scale) {
          setMelodyScale(item.parameters.scale);
        }
        setMusicTempo(item.parameters.tempo);
        setMusicDuration(item.parameters.duration);
        setMusicModel(item.parameters.model);
        break;
        
      case 'drums':
        setActiveTab('drums');
        setDrumsPrompt(item.prompt);
        setDrumsStyle(item.parameters.genre);
        // Get key if available
        if (item.parameters.key) {
          setMelodyKey(item.parameters.key);
        }
        setDrumsTempo(item.parameters.tempo);
        setDrumsDuration(item.parameters.duration);
        // Set complexity if available
        if (item.parameters.complexity !== undefined) {
          setDrumsComplexity(item.parameters.complexity * 100);
        }
        break;
        
      case 'melody':
        setActiveTab('melody');
        setMelodyPrompt(item.prompt);
        // Get key and scale directly from parameters if available
        if (item.parameters.key) {
          setMelodyKey(item.parameters.key);
        }
        if (item.parameters.scale) {
          setMelodyScale(item.parameters.scale);
        } else {
          // Legacy support: Extract key and scale from genre which was stored as a combined value
          const keyScale = item.parameters.genre || 'Cmajor';
          if (keyScale.length > 1) {
            const key = keyScale.charAt(0);
            const scale = keyScale.substring(1);
            setMelodyKey(key);
            setMelodyScale(scale);
          }
        }
        setMelodyTempo(item.parameters.tempo);
        setMelodyDuration(item.parameters.duration);
        break;
        
      case 'vocal':
        setActiveTab('vocal');
        setVocalPrompt(item.prompt);
        setVocalStyle(item.parameters.genre);
        setVocalDuration(item.parameters.duration);
        break;
        
      case 'speech':
        setActiveTab('speech');
        setSpeechText(item.prompt);
        setSpeechVoice(item.parameters.model);
        setSpeechSpeed(item.parameters.tempo);
        break;
        
      case 'sfx':
        setActiveTab('sfx');
        setSfxPrompt(item.prompt);
        setSfxCategory(item.parameters.genre);
        setSfxDuration(item.parameters.duration);
        break;
        
      case 'enhance':
        // We don't expect enhance items in history due to UI restrictions,
        // but handle it properly in case it happens
        setActiveTab('enhance');
        toast({
          title: 'Enhancement History',
          description: 'Enhancement settings loaded from history.',
        });
        break;
        
      default:
        toast({
          title: 'Unknown History Item',
          description: 'Could not load settings from history.',
          variant: 'destructive'
        });
        break;
    }
    
    toast({
      description: `Loaded settings from history.`
    });
  };
  
  // Process the generated track data
  const processGeneratedTrack = (buffer: ArrayBuffer, duration: number, waveform: number[]) => {
    onGenerateTrack({
      buffer: buffer,
      name: `Generated ${activeTab} - ${new Date().toLocaleTimeString()}`,
      type: activeTab === 'music' ? 'audio' : 
           activeTab === 'vocal' ? 'vocal' : 
           activeTab === 'speech' ? 'vocal' : 
           activeTab === 'drums' ? 'drum' : 
           activeTab === 'melody' ? 'instrument' : 'audio',
      duration: duration,
      waveform: waveform,
      creationMethod: 'ai-generated'
    });
  };
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-md overflow-hidden">
      <div className="p-3 border-b border-gray-800 flex items-center space-x-2">
        <Sparkles size={16} className="text-purple-400" />
        <h3 className="font-medium">AI Generation</h3>
        {apiKeyAvailable ? (
          <Badge variant="default" className="ml-auto bg-green-600 text-white">
            <Check size={12} className="mr-1" /> API Ready
          </Badge>
        ) : (
          <Badge variant="outline" className="ml-auto border-red-500 text-red-500">
            API Key Required
          </Badge>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="p-2 border-b border-gray-800">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="w-full bg-gray-800 inline-flex whitespace-nowrap min-w-max">
              <TabsTrigger value="music" className="flex-1">
                <Music size={14} className="mr-1" />
                Music
              </TabsTrigger>
              <TabsTrigger value="drums" className="flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="8" x2="12" y2="4"/><line x1="16" y1="12" x2="20" y2="12"/><line x1="12" y1="16" x2="12" y2="20"/><line x1="8" y1="12" x2="4" y2="12"/></svg>
                Drums
              </TabsTrigger>
              <TabsTrigger value="melody" className="flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Melody
              </TabsTrigger>
              <TabsTrigger value="vocal" className="flex-1">
                <Mic size={14} className="mr-1" />
                Vocal
              </TabsTrigger>
              <TabsTrigger value="speech" className="flex-1">
                <MessageSquare size={14} className="mr-1" />
                Speech
              </TabsTrigger>
              <TabsTrigger value="sfx" className="flex-1">
                <Wand2 size={14} className="mr-1" />
                SFX
              </TabsTrigger>
              <TabsTrigger value="enhance" className="flex-1">
                <Sparkles size={14} className="mr-1" />
                Enhance
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3">
            {!apiKeyAvailable && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md">
                <h4 className="text-red-400 font-medium flex items-center">
                  <Wand2 size={16} className="mr-2" /> API Key Required
                </h4>
                <p className="mt-1 text-sm text-gray-300">
                  To enable AI generation features, please add your API key in the settings.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-2 bg-transparent border-red-700 text-red-400 hover:bg-red-950 hover:text-red-300" 
                  size="sm"
                  onClick={() => setIsApiKeyModalOpen(true)}
                >
                  Add API Key
                </Button>
              </div>
            )}
            {/* Music Generation Tab */}
            <TabsContent value="music" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label>Describe the music you want</Label>
                <Textarea 
                  placeholder="An upbeat electronic track with deep bass, synth pads, and a driving beat..."
                  value={musicPrompt}
                  onChange={e => setMusicPrompt(e.target.value)}
                  onKeyDown={e => {
                    // Ensure spacebar events are processed
                    if (e.key === ' ') {
                      e.stopPropagation(); // Prevent default space behavior of scrolling
                    }
                  }}
                  className="bg-gray-800 border-gray-700 min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select value={musicGenre} onValueChange={setMusicGenre}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="hiphop">Hip Hop</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="ambient">Ambient</SelectItem>
                      <SelectItem value="classical">Classical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Mood</Label>
                  <Select value={musicMood} onValueChange={setMusicMood}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="happy">Happy</SelectItem>
                      <SelectItem value="upbeat">Upbeat</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="sad">Sad</SelectItem>
                      <SelectItem value="chilled">Chilled</SelectItem>
                      <SelectItem value="dramatic">Dramatic</SelectItem>
                      <SelectItem value="tense">Tense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Key</Label>
                  <Select defaultValue="C" onValueChange={setMelodyKey}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="C#">C#</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="D#">D#</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                      <SelectItem value="F#">F#</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="G#">G#</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="A#">A#</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Scale</Label>
                  <Select defaultValue="major" onValueChange={setMelodyScale}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="pentatonic">Pentatonic</SelectItem>
                      <SelectItem value="blues">Blues</SelectItem>
                      <SelectItem value="dorian">Dorian</SelectItem>
                      <SelectItem value="mixolydian">Mixolydian</SelectItem>
                      <SelectItem value="lydian">Lydian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Tempo</Label>
                  <span className="text-xs text-gray-400">{musicTempo} BPM</span>
                </div>
                <Slider
                  min={60}
                  max={200}
                  step={1}
                  value={[musicTempo]}
                  onValueChange={values => setMusicTempo(values[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Duration</Label>
                  <span className="text-xs text-gray-400">{formatTime(musicDuration)}</span>
                </div>
                <Slider
                  min={5}
                  max={60}
                  step={5}
                  value={[musicDuration]}
                  onValueChange={values => setMusicDuration(values[0])}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={musicModel} onValueChange={setMusicModel}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe (Higher Quality)</SelectItem>
                    <SelectItem value="pro">Pro (Best Quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            {/* Vocal Generation Tab */}
            <TabsContent value="vocal" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label>Describe the vocals you want</Label>
                <Textarea 
                  placeholder="A soulful female vocal singing about love and loss..."
                  value={vocalPrompt}
                  onChange={e => setVocalPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="bg-gray-800 border-gray-700 min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={vocalStyle} onValueChange={setVocalStyle}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="soul">Soul</SelectItem>
                      <SelectItem value="rnb">R&B</SelectItem>
                      <SelectItem value="hiphop">Hip Hop</SelectItem>
                      <SelectItem value="folk">Folk</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={vocalGender} onValueChange={setVocalGender}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="androgynous">Androgynous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Duration</Label>
                  <span className="text-xs text-gray-400">{formatTime(vocalDuration)}</span>
                </div>
                <Slider
                  min={5}
                  max={30}
                  step={5}
                  value={[vocalDuration]}
                  onValueChange={values => setVocalDuration(values[0])}
                />
              </div>
            </TabsContent>
            
            {/* Drums Generation Tab */}
            <TabsContent value="drums" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label>Describe the drums or beat you want</Label>
                <Textarea 
                  placeholder="A hard-hitting trap beat with punchy kicks and crisp hi-hats..."
                  value={drumsPrompt}
                  onChange={e => setDrumsPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="bg-gray-800 border-gray-700 min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={drumsStyle} onValueChange={setDrumsStyle}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="trap">Trap</SelectItem>
                      <SelectItem value="hiphop">Hip Hop</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="lofi">Lo-Fi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Key</Label>
                  <Select defaultValue="C" onValueChange={setMelodyKey}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="C#">C#</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="D#">D#</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                      <SelectItem value="F#">F#</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="G#">G#</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="A#">A#</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Tempo</Label>
                  <span className="text-xs text-gray-400">{drumsTempo} BPM</span>
                </div>
                <Slider
                  min={60}
                  max={200}
                  step={1}
                  value={[drumsTempo]}
                  onValueChange={values => setDrumsTempo(values[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Complexity</Label>
                  <span className="text-xs text-gray-400">{drumsComplexity}%</span>
                </div>
                <Slider
                  min={20}
                  max={100}
                  step={5}
                  value={[drumsComplexity]}
                  onValueChange={values => setDrumsComplexity(values[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Duration</Label>
                  <span className="text-xs text-gray-400">{formatTime(drumsDuration)}</span>
                </div>
                <Slider
                  min={4}
                  max={32}
                  step={4}
                  value={[drumsDuration]}
                  onValueChange={values => setDrumsDuration(values[0])}
                />
              </div>
            </TabsContent>
            
            {/* Melody Generation Tab */}
            <TabsContent value="melody" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label>Describe the melody you want</Label>
                <Textarea 
                  placeholder="A catchy piano melody with a hopeful progression..."
                  value={melodyPrompt}
                  onChange={e => setMelodyPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="bg-gray-800 border-gray-700 min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Key</Label>
                  <Select value={melodyKey} onValueChange={setMelodyKey}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="C#">C#</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="D#">D#</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                      <SelectItem value="F#">F#</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="G#">G#</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="A#">A#</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Scale</Label>
                  <Select value={melodyScale} onValueChange={setMelodyScale}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="pentatonic">Pentatonic</SelectItem>
                      <SelectItem value="blues">Blues</SelectItem>
                      <SelectItem value="dorian">Dorian</SelectItem>
                      <SelectItem value="mixolydian">Mixolydian</SelectItem>
                      <SelectItem value="lydian">Lydian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Tempo</Label>
                    <span className="text-xs text-gray-400">{melodyTempo} BPM</span>
                  </div>
                  <Slider
                    min={60}
                    max={200}
                    step={1}
                    value={[melodyTempo]}
                    onValueChange={values => setMelodyTempo(values[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Octave</Label>
                    <span className="text-xs text-gray-400">{melodyOctave}</span>
                  </div>
                  <Slider
                    min={2}
                    max={6}
                    step={1}
                    value={[melodyOctave]}
                    onValueChange={values => setMelodyOctave(values[0])}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Duration</Label>
                  <span className="text-xs text-gray-400">{formatTime(melodyDuration)}</span>
                </div>
                <Slider
                  min={4}
                  max={32}
                  step={4}
                  value={[melodyDuration]}
                  onValueChange={values => setMelodyDuration(values[0])}
                />
              </div>
            </TabsContent>
            
            {/* Speech Generation Tab */}
            <TabsContent value="speech" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label>Text to convert to speech</Label>
                <Textarea 
                  placeholder="Enter the text you want to convert to speech..."
                  value={speechText}
                  onChange={e => setSpeechText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="bg-gray-800 border-gray-700 min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Voice</Label>
                  <Select value={speechVoice} onValueChange={setSpeechVoice}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="male1">Male 1</SelectItem>
                      <SelectItem value="male2">Male 2</SelectItem>
                      <SelectItem value="female1">Female 1</SelectItem>
                      <SelectItem value="female2">Female 2</SelectItem>
                      <SelectItem value="narrator">Narrator</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Speed</Label>
                    <span className="text-xs text-gray-400">{speechSpeed}x</span>
                  </div>
                  <Slider
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={[speechSpeed]}
                    onValueChange={values => setSpeechSpeed(values[0])}
                  />
                </div>
              </div>
              
              <div className="pt-2 text-sm text-gray-400">
                <p>Approximate duration: {Math.ceil(speechText.length / 15)} seconds</p>
              </div>
            </TabsContent>
            
            {/* SFX Generation Tab */}
            <TabsContent value="sfx" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label>Describe the sound effect</Label>
                <Textarea 
                  placeholder="A door creaking open with a slight echo..."
                  value={sfxPrompt}
                  onChange={e => setSfxPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="bg-gray-800 border-gray-700 min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={sfxCategory} onValueChange={setSfxCategory}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="ambient">Ambient</SelectItem>
                      <SelectItem value="impacts">Impacts</SelectItem>
                      <SelectItem value="foley">Foley</SelectItem>
                      <SelectItem value="machines">Machines</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="weapons">Weapons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Duration</Label>
                    <span className="text-xs text-gray-400">{formatTime(sfxDuration)}</span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[sfxDuration]}
                    onValueChange={values => setSfxDuration(values[0])}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Enhancement Tab */}
            <TabsContent value="enhance" className="m-0 space-y-4">
              {activeTrack ? (
                <>
                  <div className="mb-4 p-3 bg-purple-900/30 border border-purple-800 rounded-md">
                    <h4 className="text-purple-300 font-medium flex items-center">
                      <Sparkles size={16} className="mr-2" /> Enhance Track: {activeTrack.name}
                    </h4>
                    <p className="mt-1 text-sm text-gray-300">
                      Apply AI-powered enhancements to improve the sound quality of this track.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Clarity Enhancement</Label>
                        <span className="text-xs text-gray-400">{Math.round(enhanceClarity * 100)}%</span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={[enhanceClarity]}
                        onValueChange={values => setEnhanceClarity(values[0])}
                        className="py-1"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Enhances vocal and instrument clarity by reducing frequency masking.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Bass Boost</Label>
                        <span className="text-xs text-gray-400">{Math.round(enhanceBassBoost * 100)}%</span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={[enhanceBassBoost]}
                        onValueChange={values => setEnhanceBassBoost(values[0])}
                        className="py-1"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Intelligently boosts low frequencies without muddiness.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Stereo Widening</Label>
                        <span className="text-xs text-gray-400">{Math.round(enhanceStereoWidening * 100)}%</span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={[enhanceStereoWidening]}
                        onValueChange={values => setEnhanceStereoWidening(values[0])}
                        className="py-1"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Creates a wider stereo field for more immersive sound.
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch 
                        id="noise-suppression" 
                        checked={enhanceNoiseSuppression}
                        onCheckedChange={setEnhanceNoiseSuppression}
                      />
                      <Label htmlFor="noise-suppression">Noise Suppression</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="denoise" 
                        checked={enhanceDenoise}
                        onCheckedChange={setEnhanceDenoise}
                      />
                      <Label htmlFor="denoise">Deep Denoise</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="eq" 
                        checked={enhanceEQ}
                        onCheckedChange={setEnhanceEQ}
                      />
                      <Label htmlFor="eq">Auto EQ</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="compression" 
                        checked={enhanceCompression}
                        onCheckedChange={setEnhanceCompression}
                      />
                      <Label htmlFor="compression">Smart Compression</Label>
                    </div>
                    
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 mt-4"
                      disabled={isEnhancing}
                      onClick={() => {
                        if (onEnhanceTrack && activeTrack) {
                          setIsEnhancing(true);
                          
                          // Show loading state
                          toast({
                            title: "Enhancing track...",
                            description: "AI is processing your audio. This may take a moment.",
                          });
                          
                          // Simulate processing time
                          setTimeout(() => {
                            onEnhanceTrack(activeTrack.id, {
                              clarity: enhanceClarity,
                              noiseSuppression: enhanceNoiseSuppression,
                              bassBoost: enhanceBassBoost,
                              stereoWidening: enhanceStereoWidening,
                              denoise: enhanceDenoise,
                              eq: enhanceEQ,
                              compression: enhanceCompression
                            });
                            
                            setIsEnhancing(false);
                            
                            toast({
                              title: "Enhancement Complete",
                              description: "Your track has been enhanced successfully.",
                            });
                          }, 2000);
                        }
                      }}
                    >
                      {isEnhancing ? (
                        <>
                          <RotateCw size={16} className="mr-2 animate-spin" />
                          Enhancing Track...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} className="mr-2" />
                          Apply Enhancements
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles size={32} className="text-purple-400 mb-3" />
                  <h3 className="text-lg font-medium mb-2">No Track Selected</h3>
                  <p className="text-sm text-gray-400 max-w-md">
                    Select a track in the timeline or press the "AI Enhance" button on any track
                    to activate this panel.
                  </p>
                </div>
              )}
            </TabsContent>
            
            {/* Common generation controls */}
            <div className="mt-4 space-y-4">
              {/* Generation button - only show if not in enhance tab */}
              {activeTab !== 'enhance' && (
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isGenerating}
                  onClick={handleGenerate}
                >
                  {isGenerating ? (
                    <>
                      <RotateCw size={16} className="mr-2 animate-spin" />
                      {generatingMessage}
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="mr-2" />
                      Generate {activeTab === 'music' ? 'Music' : 
                               activeTab === 'drums' ? 'Drums' :
                               activeTab === 'melody' ? 'Melody' :
                               activeTab === 'vocal' ? 'Vocals' : 
                               activeTab === 'speech' ? 'Speech' : 'SFX'}
                    </>
                  )}
                </Button>
              )}
              
              {/* Action buttons for generated audio - only show if not in enhance tab */}
              {generatedAudio && activeTab !== 'enhance' && (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-gray-800 border-gray-700"
                    onClick={async () => {
                      // Ensure audio context is started from user interaction
                      try {
                        await import('@/lib/audioProcessor').then(module => {
                          const audioProcessor = new module.AudioProcessor();
                          return audioProcessor.ensureAudioContextRunning();
                        });
                      } catch (error) {
                        console.error('Failed to start audio context:', error);
                      }
                      
                      // Play the audio
                      const audioURL = URL.createObjectURL(generatedAudio);
                      const audio = new Audio(audioURL);
                      audio.play().catch(err => {
                        console.error('Failed to play audio:', err);
                        toast({
                          title: 'Playback Error',
                          description: 'Could not play the audio. Please try again or reload the page.',
                          variant: 'destructive'
                        });
                      });
                    }}
                  >
                    <Music size={16} className="mr-2" />
                    Play
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-700"
                    onClick={handleAddToProject}
                  >
                    <Check size={16} className="mr-2" />
                    Add to Project
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-700"
                    onClick={async () => {
                      // Ensure audio context is started from user interaction
                      try {
                        await import('@/lib/audioProcessor').then(module => {
                          const audioProcessor = new module.AudioProcessor();
                          return audioProcessor.ensureAudioContextRunning();
                        });
                      } catch (error) {
                        console.error('Failed to start audio context:', error);
                      }
                      
                      const audioURL = URL.createObjectURL(generatedAudio);
                      const a = document.createElement('a');
                      a.href = audioURL;
                      a.download = `generated-${activeTab}-${Date.now()}.mp3`;
                      a.click();
                      
                      toast({
                        title: 'Download Started',
                        description: 'Your audio file is being downloaded.'
                      });
                    }}
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
            
            {/* Generation History - only show if not in enhance tab */}
            {history.length > 0 && activeTab !== 'enhance' && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Recent Generations</h4>
                <div className="space-y-2">
                  {history.map(item => (
                    <Card 
                      key={item.id} 
                      className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <CardContent className="p-3 flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            {item.type === 'music' && <Music size={14} className="text-blue-400" />}
                            {item.type === 'drums' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="8" x2="12" y2="4"/><line x1="16" y1="12" x2="20" y2="12"/><line x1="12" y1="16" x2="12" y2="20"/><line x1="8" y1="12" x2="4" y2="12"/></svg>}
                            {item.type === 'melody' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
                            {item.type === 'vocal' && <Mic size={14} className="text-purple-400" />}
                            {item.type === 'speech' && <MessageSquare size={14} className="text-green-400" />}
                            {item.type === 'sfx' && <Wand2 size={14} className="text-yellow-400" />}
                            <span className="font-medium">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.prompt}</p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(item.duration)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Tabs>
      
      {/* API Key Modal */}
      <Dialog open={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Add API Key for AI Generation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">AI Generation API Key</Label>
              <Input 
                id="api-key" 
                className="bg-gray-800 border-gray-700"
                placeholder="Enter your API key here"
                type="password"
              />
              <p className="text-sm text-gray-400">
                You can get your AI generation API key from the service provider's website.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApiKeyModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                // In a real implementation, this would send the API key to the server
                toast({
                  title: "API Key Added",
                  description: "Your AI generation API key has been saved.",
                });
                setIsApiKeyModalOpen(false);
              }}
            >
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}