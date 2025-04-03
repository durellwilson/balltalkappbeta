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
  audioBuffer: AudioBuffer | undefined | null;
  waveform?: number[];
  duration: number;
  onDiscard: () => void;
  onSave: (name: string, effects: { reverb: number; delay: number }) => void;
}

export function RecordingPreviewModal({
  open,
  onOpenChange,
  audioBuffer,
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
    }
  }, [open, audioBuffer, waveform]);

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
    if (!audioBuffer) return;
    
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
      <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-3xl">
        <DialogHeader>
          <DialogTitle>Recording Preview</DialogTitle>
          <DialogDescription className="text-gray-400">
            Listen to your recording and add effects before adding it to your project
          </DialogDescription>
        </DialogHeader>

        {/* Waveform display */}
        <div className="mt-4 rounded-md overflow-hidden bg-gray-800 border border-gray-700">
          <WaveformVisualizer
            height={120}
            width="100%"
            waveform={processedWaveform}
            audioBuffer={audioBuffer}
            color="#3b82f6"
            gradientColors={["#3b82f6", "#1e40af"]}
            showTimeMarkers
            showScale
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
        <div className="flex justify-center mt-2 mb-4">
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

        <div className="space-y-4">
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
            <Label>Effects</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="space-y-2">
                <Label htmlFor="reverb" className="flex justify-between">
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
              <div className="space-y-2">
                <Label htmlFor="delay" className="flex justify-between">
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

        <DialogFooter className="mt-4">
          <div className="flex justify-between w-full">
            <Button
              variant="destructive"
              onClick={handleDiscard}
            >
              <Trash2 size={14} className="mr-2" />
              Discard
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset effects
                  setReverb(0.3);
                  setDelay(0.2);
                }}
              >
                <Undo size={14} className="mr-2" />
                Reset Effects
              </Button>
              <Button
                variant="default"
                onClick={handleSave}
              >
                <Save size={14} className="mr-2" />
                Add to Arrangement
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}