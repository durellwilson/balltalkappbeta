import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer';
import { Check, Trash2, Play, Pause, Save, Undo } from 'lucide-react';
import audioProcessor from '@/lib/audioProcessor';
import { useToast } from '@/hooks/use-toast';

interface RecordingPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioBuffer?: AudioBuffer | null;
  audioBlob?: Blob | null;
  audioUrl?: string;
  waveform?: number[];
  duration: number;
  onDiscard: () => void;
  onSave: (name: string, effects: { reverb: number; delay: number }) => void;
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
    // If we have an HTML audio element (created from blob), use that
    if (audioElementRef.current && blobUrl) {
      try {
        const audioEl = audioElementRef.current;
        
        // Set up event listeners for the audio element
        audioEl.onended = () => {
          setPlaybackPosition(0);
          setIsPlaying(false);
        };
        
        // Play the audio
        audioEl.currentTime = playbackPosition;
        audioEl.play()
          .then(() => {
            console.log('Audio playback started successfully');
            // Apply FX
            // Note: In a real implementation, we would connect this audio element
            // to a Web Audio API context and apply effects, but for now we'll just play it
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
    
    // Fallback to AudioBuffer playback if we don't have a blob URL
    if (!audioBuffer) {
      toast({
        title: "Playback Error",
        description: "No audio data available",
        variant: "destructive"
      });
      return;
    }
    
    // Play the buffer with effects
    audioProcessor.playBuffer(audioBuffer);
    
    setIsPlaying(true);
    
    // Update playback position
    const startTime = Date.now();
    playbackRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= duration) {
        // Playback finished
        setPlaybackPosition(0);
        setIsPlaying(false);
        stopPlayback();
        return;
      }
      setPlaybackPosition(elapsed);
    }, 30);
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
    onSave(recordingName, { reverb, delay });
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
            onPositionClick={(position) => {
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