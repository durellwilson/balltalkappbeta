import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer';
import { Check, Trash2, Play, Pause, Save, Undo, Sparkles } from 'lucide-react';
import { AudioProcessor } from '@/lib/audioProcessor';
import { useToast } from '@/hooks/use-toast';

const audioProcessor = new AudioProcessor();

interface RecordingPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioBuffer?: AudioBuffer | null;
  audioBlob?: Blob | null;
  audioUrl?: string;
  waveform?: number[];
  duration: number;
  onDiscard: () => void;
  onSave: (name: string, effects: { 
    reverb: number; 
    delay: number;
    aiEnhanced: boolean;
    isolateVocals: boolean;
    clarity: number;
    noiseSuppression: boolean;
  }) => void;
}

export function RecordingPreviewModal({
  open,
  onOpenChange,
  audioBuffer,
  audioBlob,
  audioUrl,
  waveform,
  duration,
  onDiscard,
  onSave
}: RecordingPreviewModalProps) {
  const [recordingName, setRecordingName] = useState('New Recording');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [reverb, setReverb] = useState(0.3);
  const [delay, setDelay] = useState(0.2);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [isolateVocals, setIsolateVocals] = useState(false);
  const [clarity, setClarity] = useState(0.5);
  const [noiseSuppression, setNoiseSuppression] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const playbackRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Generate waveform data if not provided
  const [processedWaveform, setProcessedWaveform] = useState<number[] | undefined>(waveform);
  
  // Create a reference for audio element playback
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | undefined>(audioUrl);
  
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setRecordingName('New Recording');
      setIsPlaying(false);
      setPlaybackPosition(0);
      setReverb(0.3);
      setDelay(0.2);
      
      // Generate waveform data from buffer if not provided
      if (!waveform && audioBuffer) {
        const tempWaveform = generateWaveformFromBuffer(audioBuffer);
        setProcessedWaveform(tempWaveform);
      } else {
        setProcessedWaveform(waveform);
      }
      
      // Create blob URL if an actual blob is available but no URL yet
      if (audioBlob && !audioUrl && !blobUrl) {
        const url = URL.createObjectURL(audioBlob);
        setBlobUrl(url);
        
        // Create an audio element for playback
        if (!audioElementRef.current) {
          const audioEl = new Audio(url);
          audioElementRef.current = audioEl;
        }
      } else if (audioUrl && !blobUrl) {
        setBlobUrl(audioUrl);
        
        // Create an audio element for playback
        if (!audioElementRef.current) {
          const audioEl = new Audio(audioUrl);
          audioElementRef.current = audioEl;
        }
      }
    }
    
    // Cleanup function to revoke any object URLs
    return () => {
      if (blobUrl && !audioUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [open, audioBuffer, audioBlob, audioUrl, waveform, blobUrl]);

  // Clean up when modal closes
  useEffect(() => {
    return () => {
      if (playbackRef.current) {
        window.clearInterval(playbackRef.current);
      }
      stopPlayback();
    };
  }, []);

  // Function to generate waveform from buffer
  const generateWaveformFromBuffer = (buffer: AudioBuffer): number[] => {
    const channelData = buffer.getChannelData(0); // Get data from first channel
    const sampleRate = buffer.sampleRate;
    const sampleStep = Math.floor(sampleRate / 100); // Aim for ~100 samples per second
    const waveformData: number[] = [];
    
    for (let i = 0; i < channelData.length; i += sampleStep) {
      // Find peak in this segment
      let segmentPeak = 0;
      const segmentEnd = Math.min(i + sampleStep, channelData.length);
      
      for (let j = i; j < segmentEnd; j++) {
        segmentPeak = Math.max(segmentPeak, Math.abs(channelData[j]));
      }
      
      waveformData.push(segmentPeak);
    }
    
    return waveformData;
  };

  // Play/pause the recording preview
  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Start playback with effects
  const startPlayback = () => {
    // Debug log current state
    console.log('Starting playback with:', {
      hasAudioElement: !!audioElementRef.current,
      hasBlobUrl: !!blobUrl,
      hasAudioBuffer: !!audioBuffer,
      hasAudioBlob: !!audioBlob,
      playbackPosition,
      duration
    });
    
    // Priority 1: Try to play using HTML Audio element with blob URL
    if (blobUrl) {
      try {
        // Create a new audio element if we don't have one
        if (!audioElementRef.current) {
          console.log('Creating new audio element with URL:', blobUrl);
          audioElementRef.current = new Audio(blobUrl);
        }
        
        const audioEl = audioElementRef.current;
        
        // Set up event listeners for the audio element
        audioEl.onended = () => {
          console.log('Audio playback ended');
          setPlaybackPosition(0);
          setIsPlaying(false);
        };
        
        // Set current time and play
        audioEl.currentTime = playbackPosition;
        audioEl.play()
          .then(() => {
            console.log('Audio playback started successfully');
            // Apply FX in the future by connecting to Web Audio API
          })
          .catch(err => {
            console.error('Error playing audio:', err);
            toast({
              title: "Playback Error",
              description: "There was a problem playing the recording",
              variant: "destructive"
            });
          });
        
        setIsPlaying(true);
        
        // Update playback position
        playbackRef.current = window.setInterval(() => {
          if (audioEl.paused) return;
          setPlaybackPosition(audioEl.currentTime);
        }, 30);
        
        return;
      } catch (error) {
        console.error('Error playing audio via HTML Audio element:', error);
      }
    }
    
    // Priority 2: If we have a blob but no URL, create one and try again
    else if (audioBlob) {
      try {
        const url = URL.createObjectURL(audioBlob);
        console.log('Created new blob URL from audioBlob:', url);
        setBlobUrl(url);
        
        // Create audio element with the new URL
        const audioEl = new Audio(url);
        audioElementRef.current = audioEl;
        
        // Set up event listener for when it's ready
        audioEl.oncanplaythrough = () => {
          console.log('Audio element can play through, starting playback');
          startPlayback(); // Recursive call with the new URL set
        };
        
        return;
      } catch (error) {
        console.error('Error creating blob URL from audioBlob:', error);
      }
    }
    
    // Priority 3: Fallback to AudioBuffer playback
    if (audioBuffer) {
      console.log('Falling back to AudioBuffer playback');
      
      try {
        // Play the buffer with effects
        audioProcessor.playBuffer(audioBuffer);
        
        setIsPlaying(true);
        
        // Update playback position
        const startTime = Date.now();
        playbackRef.current = window.setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= duration) {
            // Playback finished
            console.log('Buffer playback finished');
            setPlaybackPosition(0);
            setIsPlaying(false);
            stopPlayback();
            return;
          }
          setPlaybackPosition(elapsed);
        }, 30);
        
        return;
      } catch (error) {
        console.error('Error playing audio buffer:', error);
      }
    }
    
    // If all methods fail, show error
    toast({
      title: "Playback Error",
      description: "No audio data available for playback",
      variant: "destructive"
    });
  };

  // Stop playback
  const stopPlayback = () => {
    if (playbackRef.current) {
      window.clearInterval(playbackRef.current);
      playbackRef.current = null;
    }
    
    // If we have an HTML audio element, pause it
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
      } catch (error) {
        console.error('Error pausing audio element:', error);
      }
    }
    
    // Also stop any AudioBuffer playback
    audioProcessor.stopPlayback();
    setIsPlaying(false);
  };

  // Handle discard with confirmation
  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this recording? This action cannot be undone.')) {
      stopPlayback();
      onDiscard();
      toast({
        title: "Recording Discarded",
        description: "Your recording has been deleted",
      });
    }
  };

  // Handle save
  const handleSave = () => {
    stopPlayback();
    onSave(recordingName, { 
      reverb, 
      delay,
      aiEnhanced,
      isolateVocals,
      clarity,
      noiseSuppression
    });
    toast({
      title: "Recording Saved",
      description: "Your recording has been added to the arrangement",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        stopPlayback();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-[95vw] sm:max-w-3xl w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center">Recording Preview</DialogTitle>
          <DialogDescription className="text-gray-400 text-center px-2">
            Listen to your recording and add effects before adding
          </DialogDescription>
        </DialogHeader>

        {/* Waveform display */}
        <div className="mt-2 rounded-md overflow-hidden bg-gray-800 border border-gray-700">
          <WaveformVisualizer
            height={100}
            width="100%"
            waveform={processedWaveform}
            audioBuffer={audioBuffer}
            color="#3b82f6"
            gradientColors={["#3b82f6", "#1e40af"]}
            showTimeMarkers={false} // Simplified for all screen sizes
            showScale={false} // Simplified for all screen sizes
            duration={duration}
            playbackPosition={playbackPosition}
            responsive
            gain={1.5}
            onPositionClick={(position: number) => {
              setPlaybackPosition(position);
              // Restart playback from this position
              if (isPlaying) {
                stopPlayback();
                startPlayback();
              }
            }}
          />
        </div>

        {/* Playback controls */}
        <div className="flex justify-center mt-2 mb-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={togglePlayback}
            className="w-12 h-12 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="recording-name">Recording Name</Label>
            <Input
              id="recording-name"
              placeholder="New Recording"
              className="bg-gray-800 border-gray-700"
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
            />
          </div>

          <div>
            <Label className="block mb-1">Effects</Label>
            {/* Make layout responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <div className="space-y-1">
                <Label htmlFor="reverb" className="flex justify-between text-sm">
                  <span>Reverb</span>
                  <span className="text-gray-400">{Math.round(reverb * 100)}%</span>
                </Label>
                <Slider
                  id="reverb"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[reverb]}
                  onValueChange={(value) => setReverb(value[0])}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="delay" className="flex justify-between text-sm">
                  <span>Delay</span>
                  <span className="text-gray-400">{Math.round(delay * 100)}%</span>
                </Label>
                <Slider
                  id="delay"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[delay]}
                  onValueChange={(value) => setDelay(value[0])}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* AI Enhancement Section */}
            <div className="mt-4 border-t border-gray-800 pt-2">
              <Label className="block mb-1 flex items-center">
                <Sparkles className="w-4 h-4 text-purple-400 mr-1" />
                <span className="text-purple-300">AI Enhancement</span>
              </Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <div className="flex items-center justify-between space-x-2 rounded-md bg-gray-800/50 p-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <Label htmlFor="ai-enhance" className="text-sm font-normal">
                      AI Enhance
                    </Label>
                  </div>
                  <Switch
                    id="ai-enhance"
                    checked={aiEnhanced}
                    onCheckedChange={setAiEnhanced}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2 rounded-md bg-gray-800/50 p-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <Label htmlFor="isolate-vocals" className="text-sm font-normal">
                      Isolate Vocals
                    </Label>
                  </div>
                  <Switch
                    id="isolate-vocals"
                    checked={isolateVocals}
                    onCheckedChange={setIsolateVocals}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="clarity" className="flex justify-between text-sm">
                    <span>Clarity</span>
                    <span className="text-gray-400">{Math.round(clarity * 100)}%</span>
                  </Label>
                  <Slider
                    id="clarity"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[clarity]}
                    onValueChange={(value) => setClarity(value[0])}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2 rounded-md bg-gray-800/50 p-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414-9.9m1.414 0a9 9 0 000 12.728" />
                    </svg>
                    <Label htmlFor="noise-suppression" className="text-sm font-normal">
                      Noise Suppression
                    </Label>
                  </div>
                  <Switch
                    id="noise-suppression"
                    checked={noiseSuppression}
                    onCheckedChange={setNoiseSuppression}
                  />
                </div>
              </div>
              
              {(aiEnhanced || isolateVocals) && !isProcessing && (
                <div className="mt-2 p-2 rounded-md bg-purple-900/20 border border-purple-500/30 text-xs text-purple-200">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    AI enhancement will be applied when you add to track
                  </div>
                </div>
              )}
              
              {isProcessing && (
                <div className="mt-2 p-2 rounded-md bg-purple-900/20 border border-purple-500/30 text-purple-200 animate-pulse flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing audio with AI...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Make buttons stack on mobile */}
        <DialogFooter className="mt-3 flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={handleDiscard}
            className="w-full sm:w-auto order-1 sm:order-none"
          >
            <Trash2 size={14} className="mr-2" />
            Discard
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                // Reset effects
                setReverb(0.3);
                setDelay(0.2);
                setAiEnhanced(false);
                setIsolateVocals(false);
                setClarity(0.5);
                setNoiseSuppression(false);
              }}
              className="w-full sm:w-auto"
            >
              <Undo size={14} className="mr-2" />
              Reset Effects
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              className="w-full sm:w-auto"
            >
              <Save size={14} className="mr-2" />
              Add to Track
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}