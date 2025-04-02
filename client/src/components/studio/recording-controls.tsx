import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Mic, 
  Circle,
  FileAudio, 
  Plus, 
  Settings, 
  Volume, 
  VolumeX, 
  Headphones,
  HeadphoneOff as HeadphoneOff,
  Timer, 
  ListMusic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

// Component props interface
interface RecordingControlsProps {
  isRecording: boolean;
  isPlaying: boolean;
  targetTrackId?: number | null;
  tracks: Array<{
    id: number;
    name: string;
    type: string;
    isArmed: boolean;
    isMuted: boolean;
    isSoloed: boolean;
  }>;
  onRecord: () => void;
  onStopRecording: () => void;
  onArmTrack: (trackId: number, armed: boolean) => void;
  onTrackSelect: (trackId: number) => void;
  onAddTrack: (type: string) => void;
  audioInputLevel?: number; // 0-1 scale
  timeElapsed?: number; // in seconds
  microphoneAccess?: boolean;
  onMonitorToggle?: (enabled: boolean) => void;
  isMonitoring?: boolean;
  inputDevices?: MediaDeviceInfo[];
  selectedInputDevice?: string;
  onInputDeviceChange?: (deviceId: string) => void;
  onInputGainChange?: (gain: number) => void;
  inputGain?: number;
  overlapRecording?: boolean;
  onOverlapRecordingToggle?: (enabled: boolean) => void;
}

export function RecordingControls({
  isRecording,
  isPlaying,
  targetTrackId,
  tracks,
  onRecord,
  onStopRecording,
  onArmTrack,
  onTrackSelect,
  onAddTrack,
  audioInputLevel = 0,
  timeElapsed = 0,
  microphoneAccess = false,
  onMonitorToggle,
  isMonitoring = false,
  inputDevices = [],
  selectedInputDevice = '',
  onInputDeviceChange,
  onInputGainChange,
  inputGain = 1,
  overlapRecording = false,
  onOverlapRecordingToggle
}: RecordingControlsProps) {
  // Local state
  const [showSettings, setShowSettings] = useState(false);
  
  // Format recording time as mm:ss.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Get the number of armed tracks
  const armedTracksCount = tracks.filter(track => track.isArmed).length;
  
  return (
    <div className="flex flex-col">
      {/* Main recording controls */}
      <Card className="bg-gray-800 border-gray-700 mb-3">
        <CardContent className="p-3 space-y-3">
          {/* Record/Stop buttons */}
          <div className="flex space-x-2">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              className="flex-1 h-12"
              onClick={isRecording ? onStopRecording : onRecord}
              disabled={!microphoneAccess || armedTracksCount === 0}
            >
              {isRecording ? (
                <>
                  <Square className="mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Circle className="mr-2 text-red-500" />
                  {targetTrackId ? `Record to ${tracks.find(t => t.id === targetTrackId)?.name || 'Selected Track'}` : 'Record'}
                </>
              )}
            </Button>
          </div>
          
          {/* Recording time and level indicator */}
          {isRecording && (
            <div className="bg-gray-900 rounded-md p-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Circle className="text-red-500 animate-pulse" size={12} />
                <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
              </div>
              
              <div className="w-32 h-4 bg-gray-950 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-100"
                  style={{ 
                    width: `${Math.min(100, Math.max(audioInputLevel * 100, 1))}%`,
                    background: `linear-gradient(90deg, #10b981 0%, #10b981 70%, #eab308 70%, #eab308 85%, #ef4444 85%, #ef4444 100%)`
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Microphone access warning */}
          {!microphoneAccess && (
            <div className="bg-amber-900/30 border border-amber-800/50 rounded-md p-2 text-xs text-amber-200">
              <div className="flex items-center">
                <Mic className="mr-2 text-amber-400" size={14} />
                <span>Microphone access is required for recording.</span>
              </div>
            </div>
          )}
          
          {/* No armed tracks warning */}
          {microphoneAccess && armedTracksCount === 0 && (
            <div className="bg-blue-900/30 border border-blue-800/50 rounded-md p-2 text-xs text-blue-200">
              <div className="flex items-center">
                <ListMusic className="mr-2 text-blue-400" size={14} />
                <span>Arm at least one track to enable recording.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Armed tracks list */}
      <Card className="bg-gray-800 border-gray-700 mb-3">
        <CardContent className="p-3">
          <Label className="text-xs text-gray-400 mb-2 block">
            Armed tracks ({armedTracksCount})
          </Label>
          
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {tracks.length === 0 ? (
              <div className="text-xs text-gray-500 py-1">
                No tracks available. Add a track first.
              </div>
            ) : tracks.filter(t => t.isArmed).length === 0 ? (
              <div className="text-xs text-gray-500 py-1">
                No armed tracks. Arm a track to enable recording.
              </div>
            ) : (
              tracks
                .filter(track => track.isArmed)
                .map(track => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-2 bg-gray-850 rounded border border-gray-700 cursor-pointer hover:bg-gray-800"
                    onClick={() => onTrackSelect(track.id)}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-8 mr-2 rounded-sm"
                        style={{ 
                          backgroundColor: 
                            track.type === 'vocal' ? '#f43f5e' : 
                            track.type === 'instrument' ? '#3b82f6' :
                            track.type === 'drum' ? '#a855f7' :
                            '#10b981'
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium">{track.name}</div>
                        <div className="text-xs text-gray-400">{track.type}</div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 w-7 p-0 text-red-500 bg-red-900/20`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onArmTrack(track.id, false);
                      }}
                    >
                      <Mic size={14} />
                    </Button>
                  </div>
                ))
            )}
          </div>
          
          {/* Quick track selection */}
          <div className="mt-3 flex flex-wrap gap-2">
            {tracks
              .filter(track => !track.isArmed)
              .slice(0, 3)
              .map(track => (
                <Button
                  key={track.id}
                  variant="outline"
                  size="sm"
                  className="bg-gray-900 border-gray-700 h-7 px-2"
                  onClick={() => onArmTrack(track.id, true)}
                >
                  <Plus size={10} className="mr-1" />
                  Arm {track.name}
                </Button>
              ))}
            
            {tracks.filter(track => !track.isArmed).length > 3 && (
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-900 border-gray-700 h-7 px-2"
                onClick={() => {/* Show all tracks */}}
              >
                <Plus size={10} className="mr-1" />
                More...
              </Button>
            )}
            
            {tracks.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-900 border-gray-700"
                onClick={() => onAddTrack('vocal')}
              >
                <FileAudio size={12} className="mr-1" />
                Add New Track
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Recording settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-400">
              Recording Settings
            </Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={12} />
            </Button>
          </div>
          
          {showSettings && (
            <div className="space-y-3 mt-2 text-sm">
              {/* Input device selection */}
              {inputDevices.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Input Device</Label>
                  <Select
                    value={selectedInputDevice}
                    onValueChange={onInputDeviceChange}
                  >
                    <SelectTrigger className="h-8 text-xs bg-gray-900 border-gray-700">
                      <SelectValue placeholder="Select input device" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {inputDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Input ${device.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Input gain control */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Input Gain</Label>
                  <span className="text-xs text-gray-400">{Math.round(inputGain * 100)}%</span>
                </div>
                <Slider
                  value={[inputGain * 100]}
                  min={0}
                  max={150}
                  step={1}
                  onValueChange={values => onInputGainChange && onInputGainChange(values[0] / 100)}
                  disabled={!microphoneAccess}
                />
              </div>
              
              {/* Monitoring toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isMonitoring ? (
                    <Headphones size={12} className="text-blue-400" />
                  ) : (
                    <HeadphoneOff size={12} className="text-gray-400" />
                  )}
                  <Label className="text-xs">Monitor Input</Label>
                </div>
                <Switch
                  checked={isMonitoring}
                  onCheckedChange={checked => onMonitorToggle && onMonitorToggle(checked)}
                  disabled={!microphoneAccess}
                />
              </div>
              
              {/* Overdub recording toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mic size={12} className={overlapRecording ? "text-purple-400" : "text-gray-400"} />
                  <Label className="text-xs">Overdub Recording</Label>
                </div>
                <Switch
                  checked={overlapRecording}
                  onCheckedChange={checked => onOverlapRecordingToggle && onOverlapRecordingToggle(checked)}
                />
              </div>
              
              <div className="text-xs text-gray-500 italic">
                When enabled, recording will continue playback of other tracks,
                allowing you to record over existing audio.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}