import React, { useEffect, useState } from 'react';
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import { Square, AlertCircle } from 'lucide-react';

interface RecordingStatusPanelProps {
  recordingTime: number;
  waveform: Float32Array | number[] | null;
  onStopRecording: () => void;
  maxRecordingTime?: number; // in seconds
  armedTrack?: { id: number; name: string } | null;
  showTimer?: boolean;
  animated?: boolean;
}

export function RecordingStatusPanel({
  recordingTime,
  waveform,
  onStopRecording,
  maxRecordingTime = 300, // 5 minutes default
  armedTrack,
  showTimer = true,
  animated = true
}: RecordingStatusPanelProps) {
  const [warningShown, setWarningShown] = useState(false);
  const waveformArray = waveform ? 
    (Array.isArray(waveform) ? waveform : Array.from(waveform)) : 
    [];

  // Auto-stop recording if it exceeds maximum time
  useEffect(() => {
    if (recordingTime >= maxRecordingTime) {
      onStopRecording();
    } else if (recordingTime >= maxRecordingTime - 30 && !warningShown) {
      // Show warning when 30 seconds remain
      setWarningShown(true);
    }
  }, [recordingTime, maxRecordingTime, onStopRecording, warningShown]);

  // Reset warning state when recording is restarted
  useEffect(() => {
    if (recordingTime < 1) {
      setWarningShown(false);
    }
  }, [recordingTime]);

  // Calculate remaining time
  const remainingTime = maxRecordingTime - recordingTime;
  const isNearingLimit = remainingTime < 30;

  return (
    <div className={`mt-2 mb-4 relative bg-black/30 rounded-lg border 
      ${isNearingLimit ? 'border-yellow-500/50 pulse-border' : 'border-red-500/30'} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
          <h3 className="text-red-500 font-medium">
            Recording in progress{armedTrack ? ` - ${armedTrack.name}` : ''}
          </h3>
        </div>
        <div className={`text-white font-mono px-2 rounded ${isNearingLimit ? 'bg-yellow-950/50' : 'bg-red-950/50'}`}>
          {showTimer && formatTime(recordingTime)}
          {isNearingLimit && ` (${Math.ceil(remainingTime)}s remaining)`}
        </div>
      </div>
      
      <div className="h-32 bg-black/50 rounded-lg overflow-hidden flex items-center">
        {waveformArray.length > 0 ? (
          <WaveformVisualizer
            waveform={waveformArray}
            height={128}
            width="100%"
            animated={animated}
            color="#ef4444"
            gradientColors={["#ef4444", "#7f1d1d"]}
            gain={1.5}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-red-500/50">
            Initializing recording...
          </div>
        )}
      </div>
      
      {isNearingLimit && (
        <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-md flex items-center">
          <AlertCircle className="text-yellow-500 h-5 w-5 mr-2 flex-shrink-0" />
          <span className="text-yellow-200 text-sm">
            Recording will automatically stop in {Math.ceil(remainingTime)} seconds. 
            Click 'Stop Recording' to finish now.
          </span>
        </div>
      )}
      
      <div className="mt-2 flex justify-end">
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={onStopRecording}
          className="flex items-center"
        >
          <Square className="h-4 w-4 mr-1" />
          Stop Recording
        </Button>
      </div>
    </div>
  );
}

export default RecordingStatusPanel;