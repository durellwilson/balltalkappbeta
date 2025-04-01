import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Activity, 
  Disc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface RecordingInterfaceProps {
  isRecording: boolean;
  onRecordStart: () => Promise<void>;
  onRecordStop: () => Promise<void>;
  inputLevel?: number; // 0-1 for meter display
  audioInitialized: boolean;
  microphoneStatus?: 'ready' | 'denied' | 'unavailable';
  inputDevice?: MediaDeviceInfo | null;
  onInputDeviceChange?: (deviceId: string) => void;
  recordingTime?: number; // in seconds
}

export function RecordingInterface({
  isRecording,
  onRecordStart,
  onRecordStop,
  inputLevel = 0,
  audioInitialized = false,
  microphoneStatus = 'unavailable',
  inputDevice = null,
  onInputDeviceChange,
  recordingTime = 0
}: RecordingInterfaceProps) {
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [inputGain, setInputGain] = useState(100);
  const meterRef = useRef<HTMLDivElement>(null);
  const peakLevelRef = useRef<number>(0);
  const peakHoldTimerRef = useRef<number | null>(null);
  
  // Format recording time as MM:SS.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Check for available audio input devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // First request permission if needed
        if (microphoneStatus !== 'ready') {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream right away, we just needed permission
            stream.getTracks().forEach(track => track.stop());
          } catch (err) {
            console.error('Microphone access denied:', err);
            return;
          }
        }
        
        // Get device list
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAvailableDevices(audioInputs);
        
        // Setup device change listener
        navigator.mediaDevices.addEventListener('devicechange', async () => {
          const updatedDevices = await navigator.mediaDevices.enumerateDevices();
          const updatedAudioInputs = updatedDevices.filter(device => device.kind === 'audioinput');
          setAvailableDevices(updatedAudioInputs);
        });
        
        return () => {
          navigator.mediaDevices.removeEventListener('devicechange', () => {});
        };
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };
    
    getDevices();
  }, [microphoneStatus]);
  
  // Update level meter with animation frame
  useEffect(() => {
    if (!meterRef.current) return;
    
    const updateMeter = () => {
      if (meterRef.current) {
        // Calculate level height (0-100)
        const levelHeight = Math.min(100, Math.max(0, inputLevel * 100));
        
        // Update meter colors based on level
        let meterColor = 'bg-green-500';
        if (levelHeight > 80) meterColor = 'bg-red-500';
        else if (levelHeight > 60) meterColor = 'bg-yellow-500';
        
        // Set the height and color
        meterRef.current.style.height = `${levelHeight}%`;
        meterRef.current.className = `absolute bottom-0 left-0 right-0 transition-all ${meterColor}`;
        
        // Update peak indicator
        if (levelHeight > peakLevelRef.current) {
          peakLevelRef.current = levelHeight;
          
          // Clear existing peak hold timer
          if (peakHoldTimerRef.current !== null) {
            window.clearTimeout(peakHoldTimerRef.current);
          }
          
          // Set new peak hold timer
          peakHoldTimerRef.current = window.setTimeout(() => {
            peakLevelRef.current = 0;
          }, 1500);
        }
      }
      
      requestAnimationFrame(updateMeter);
    };
    
    const animationId = requestAnimationFrame(updateMeter);
    return () => {
      cancelAnimationFrame(animationId);
      if (peakHoldTimerRef.current !== null) {
        window.clearTimeout(peakHoldTimerRef.current);
      }
    };
  }, [inputLevel]);
  
  // Handle monitor toggle
  const handleMonitorToggle = () => {
    if (!audioInitialized) {
      toast({
        title: "Audio Not Initialized",
        description: "Please enable the audio engine first before monitoring.",
        variant: "destructive"
      });
      return;
    }
    
    if (microphoneStatus !== 'ready') {
      toast({
        title: "Microphone Required",
        description: "Please grant microphone access to enable monitoring.",
        variant: "destructive"
      });
      return;
    }
    
    setIsMonitoring(!isMonitoring);
    // In a real app, this would enable/disable microphone monitoring through the audio system
  };
  
  // Handle record button click
  const handleRecordClick = async () => {
    if (!audioInitialized) {
      toast({
        title: "Audio Not Initialized",
        description: "Please enable the audio engine first before recording.",
        variant: "destructive"
      });
      return;
    }
    
    if (microphoneStatus !== 'ready') {
      toast({
        title: "Microphone Required",
        description: "Please grant microphone access to record audio.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (isRecording) {
        await onRecordStop();
      } else {
        await onRecordStart();
        // Automatically enable monitoring when recording starts
        setIsMonitoring(true);
      }
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording Error",
        description: "An error occurred with the recording. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeviceChange = (deviceId: string) => {
    if (onInputDeviceChange) {
      onInputDeviceChange(deviceId);
    }
    setShowDeviceSelector(false);
  };
  
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center">
              <Mic className="mr-1 h-4 w-4" />
              Recording
            </h3>
            
            {/* Input device selector trigger */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-gray-800 border-gray-700 h-7 px-2"
                    onClick={() => setShowDeviceSelector(!showDeviceSelector)}
                  >
                    <Disc className="mr-1 h-3 w-3" />
                    {inputDevice?.label?.slice(0, 20) || 'Select Input'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select audio input device</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Device selector dropdown */}
          {showDeviceSelector && (
            <div className="bg-gray-800 rounded-md p-2 border border-gray-700 max-h-48 overflow-auto">
              {availableDevices.length > 0 ? (
                <div className="space-y-1">
                  {availableDevices.map((device) => (
                    <Button
                      key={device.deviceId}
                      variant="ghost"
                      className="w-full justify-start text-xs h-auto py-1 px-2"
                      onClick={() => handleDeviceChange(device.deviceId)}
                    >
                      {device.label || `Device ${device.deviceId.slice(0, 5)}`}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-gray-400 text-sm">
                  No audio input devices detected
                </div>
              )}
            </div>
          )}
          
          {/* Status indicators */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Badge 
                variant={microphoneStatus === 'ready' ? 'default' : 'destructive'}
                className={microphoneStatus === 'ready' ? 'bg-green-600' : 'bg-red-600'}
              >
                {microphoneStatus === 'ready' ? 'Mic Ready' : 'No Microphone'}
              </Badge>
              
              <Badge 
                variant={audioInitialized ? 'default' : 'outline'}
                className={audioInitialized ? 'bg-blue-600' : 'text-gray-400'}
              >
                {audioInitialized ? 'Audio Ready' : 'Audio Off'}
              </Badge>
            </div>
            
            {isRecording && (
              <div className="font-mono font-medium text-red-400 flex items-center">
                <span className="animate-pulse mr-1">●</span>
                {formatTime(recordingTime)}
              </div>
            )}
          </div>
          
          {/* Recording controls */}
          <div className="flex items-center space-x-4">
            {/* Level meter */}
            <div className="w-6 h-24 bg-gray-800 border border-gray-700 rounded-sm relative">
              <div ref={meterRef} className="absolute bottom-0 left-0 right-0 bg-green-500" style={{ height: '0%' }}></div>
              
              {/* Peak indicator */}
              {peakLevelRef.current > 0 && (
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-white" 
                  style={{ bottom: `${peakLevelRef.current}%` }}
                ></div>
              )}
              
              {/* Level markers */}
              <div className="absolute left-0 right-0 h-0.5 bg-red-500/50" style={{ bottom: '80%' }}></div>
              <div className="absolute left-0 right-0 h-0.5 bg-yellow-500/50" style={{ bottom: '60%' }}></div>
            </div>
            
            {/* Input gain control */}
            <div className="flex flex-col items-center h-24 justify-center space-y-1">
              <span className="text-xs text-gray-400">Gain</span>
              <Slider
                orientation="vertical"
                value={[inputGain]}
                min={0}
                max={150}
                step={1}
                className="h-16"
                onValueChange={values => setInputGain(values[0])}
              />
              <span className="text-xs">{inputGain}%</span>
            </div>
            
            {/* Monitor toggle */}
            <Button
              variant="outline"
              size="sm"
              className={`h-8 ${isMonitoring ? 'bg-green-900 border-green-700 text-green-400' : 'bg-gray-800 border-gray-700'}`}
              onClick={handleMonitorToggle}
              disabled={!audioInitialized || microphoneStatus !== 'ready'}
            >
              {isMonitoring ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span className="ml-1">{isMonitoring ? 'Monitoring' : 'Monitor'}</span>
            </Button>
            
            {/* Record button */}
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              className={`h-9 w-24 ${isRecording ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'}`}
              onClick={handleRecordClick}
              disabled={!audioInitialized || microphoneStatus !== 'ready'}
            >
              {isRecording ? (
                <>
                  <Square className="mr-1" size={14} />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="mr-1" size={14} />
                  Record
                </>
              )}
            </Button>
          </div>
          
          {/* Warning message if microphone is not ready */}
          {microphoneStatus !== 'ready' && (
            <div className="text-xs bg-yellow-900/30 border border-yellow-700/50 rounded p-2 text-yellow-400 flex items-start mt-1">
              <AlertCircle size={14} className="mr-1 flex-shrink-0 mt-0.5" />
              <span>
                Microphone access is required for recording. Please check your browser permissions and ensure a microphone is connected.
              </span>
            </div>
          )}
          
          {/* Input processing status */}
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{inputLevel > 0.01 ? 'Signal detected' : 'No input signal'}</span>
            <span className="flex items-center">
              <Activity size={12} className="mr-1" />
              {inputLevel > 0.8 ? (
                <span className="text-red-400">Clipping!</span>
              ) : inputLevel > 0.6 ? (
                <span className="text-yellow-400">High level</span>
              ) : inputLevel > 0.01 ? (
                <span className="text-green-400">Good level</span>
              ) : (
                <span>Silence</span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}