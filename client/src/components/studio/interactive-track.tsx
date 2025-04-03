import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer';
import { SpectrumAnalyzer } from '@/components/ui/spectrum-analyzer';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import audioProcessor from '@/lib/audioProcessor';

import {
  Volume2,
  VolumeX,
  Mic,
  Upload,
  Trash2,
  MoreHorizontal,
  Activity, // Using Activity instead of Waveform which doesn't exist
  BarChart,
  BarChart3,
  Maximize,
  Minimize,
  PlayCircle,
  StopCircle,
  PauseCircle,
  SkipForward,
  SkipBack,
  Download,
  Copy,
  LayoutGrid,
  Scissors,
  Hammer,
  Sparkles
} from 'lucide-react';

interface InteractiveTrackProps {
  id: number;
  name: string;
  type?: 'audio' | 'instrument' | 'vocal' | 'drum' | 'mix';
  isActive?: boolean;
  isMuted?: boolean;
  isSoloed?: boolean;
  onMuteToggle?: (id: number, muted: boolean) => void;
  onSoloToggle?: (id: number, soloed: boolean) => void;
  onVolumeChange?: (id: number, volume: number) => void;
  onPanChange?: (id: number, pan: number) => void;
  onSelect?: (id: number) => void;
  onDelete?: (id: number) => void;
  onFileUpload?: (id: number, file: File) => void;
  onRecordStart?: (id: number) => void;
  onRecordStop?: (id: number) => void;
  onPlay?: (id: number) => void;
  onStop?: (id: number) => void;
  onAiEnhance?: (id: number) => void;
  volume?: number;
  pan?: number;
  color?: string;
  collaborator?: { id: string; name: string; color: string } | null;
  className?: string;
  creationMethod?: 'recorded' | 'uploaded' | 'ai-generated';
}

/**
 * InteractiveTrack is a professional track component with advanced
 * visualization and control features for the DAW interface
 */
const InteractiveTrack: React.FC<InteractiveTrackProps> = ({
  id,
  name,
  type = 'audio',
  isActive = false,
  isMuted = false,
  isSoloed = false,
  onMuteToggle,
  onSoloToggle,
  onVolumeChange,
  onPanChange,
  onSelect,
  onDelete,
  onFileUpload,
  onRecordStart,
  onRecordStop,
  onPlay,
  onStop,
  onAiEnhance,
  volume = 0.8,
  pan = 0,
  color = '#3b82f6',
  collaborator = null,
  className,
  creationMethod,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [visualizationType, setVisualizationType] = useState<'waveform' | 'spectrum'>('waveform');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hovered, setHovered] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Effect to update processor settings when volume or pan changes
  useEffect(() => {
    const track = audioProcessor.getTrack(id);
    if (track) {
      track.setVolume(volume);
      track.setPan(pan);
      track.setMuted(isMuted);
      track.setSolo(isSoloed);
    }
  }, [id, volume, pan, isMuted, isSoloed]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Get track processor and load audio file
      const track = audioProcessor.getTrack(id);
      if (track) {
        track.loadAudioFile(file);
      }
      
      // Call parent handler if provided
      if (onFileUpload) {
        onFileUpload(id, file);
      }
    }
  };

  // Handle record toggle
  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      const track = audioProcessor.getTrack(id);
      if (track) {
        track.stopRecording();
      }
      if (onRecordStop) {
        onRecordStop(id);
      }
    } else {
      setIsRecording(true);
      const track = audioProcessor.getTrack(id);
      if (track) {
        track.startRecording();
      }
      if (onRecordStart) {
        onRecordStart(id);
      }
    }
  };

  // Handle play/stop toggle
  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      const track = audioProcessor.getTrack(id);
      if (track) {
        track.stop();
      }
      if (onStop) {
        onStop(id);
      }
    } else {
      setIsPlaying(true);
      const track = audioProcessor.getTrack(id);
      if (track) {
        track.play();
      }
      if (onPlay) {
        onPlay(id);
      }
    }
  };

  // Get track color based on creation method (if specified) or type as fallback
  const getTrackTypeColor = () => {
    // If creation method is specified, use that for coloring
    if (creationMethod) {
      switch (creationMethod) {
        case 'recorded':
          return 'from-red-500 to-rose-500'; // Red/Rose for recorded tracks
        case 'uploaded':
          return 'from-blue-500 to-sky-500'; // Blue/Sky for uploaded tracks
        case 'ai-generated':
          return 'from-purple-500 to-fuchsia-500'; // Purple/Fuchsia for AI-generated tracks
      }
    }
    
    // Fall back to type-based coloring if no creation method specified
    switch (type) {
      case 'vocal':
        return 'from-rose-500 to-pink-500';
      case 'instrument':
        return 'from-amber-500 to-orange-500';
      case 'drum':
        return 'from-indigo-500 to-blue-500';
      case 'mix':
        return 'from-emerald-500 to-green-500';
      default:
        return 'from-sky-500 to-blue-500';
    }
  };

  // Export track audio as WAV
  const handleExportTrack = async () => {
    const track = audioProcessor.getTrack(id);
    if (track) {
      const blob = await track.exportAudio();
      if (blob) {
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.wav`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  // Make track draggable
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('track/id', id.toString());
    e.dataTransfer.setData('track/type', type);
    e.dataTransfer.setData('track/name', name);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a ghost image that shows what's being dragged
    const ghostElement = document.createElement('div');
    ghostElement.classList.add('bg-gray-800', 'p-2', 'rounded', 'text-white');
    ghostElement.innerHTML = `<div>${name}</div>`;
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 0, 0);
    
    // Remove the ghost element after drag starts
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative rounded-md overflow-hidden shadow-md cursor-grab active:cursor-grabbing',
        isActive ? 'ring-2 ring-blue-500' : '',
        className
      )}
      ref={trackRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect && onSelect(id)}
      draggable={true}
      onDragStart={handleDragStart}
    >
      {/* Collaborator indicator */}
      {collaborator && (
        <div 
          className="absolute top-2 right-2 z-10 flex items-center space-x-1 rounded-full px-2 py-1 text-xs text-white"
          style={{ backgroundColor: collaborator.color }}
        >
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          <span>{collaborator.name}</span>
        </div>
      )}

      {/* Main track panel */}
      <Card className="bg-gray-900 text-white border-none">
        <div className="p-3">
          {/* Track header with controls */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-full min-h-[2rem] rounded-sm bg-gradient-to-b ${getTrackTypeColor()}`}
              ></div>
              <div className="flex flex-col">
                <h3 className="text-sm font-medium truncate">{name}</h3>
                {creationMethod && (
                  <span className="text-xs text-gray-400">
                    {creationMethod === 'recorded' && 'Recorded'}
                    {creationMethod === 'uploaded' && 'Uploaded'}
                    {creationMethod === 'ai-generated' && 'AI Generated'}
                  </span>
                )}
              </div>
              {isRecording && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-xs text-red-500">REC</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  isMuted ? "text-red-500" : "text-gray-400 hover:text-white"
                )}
                onClick={() => onMuteToggle && onMuteToggle(id, !isMuted)}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  isSoloed ? "text-yellow-500" : "text-gray-400 hover:text-white"
                )}
                onClick={() => onSoloToggle && onSoloToggle(id, !isSoloed)}
              >
                <span className="text-xs font-bold">S</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 text-purple-400 hover:text-purple-300"
                )}
                onClick={() => onAiEnhance && onAiEnhance(id)}
                title="AI Enhance"
              >
                <Sparkles size={16} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <Minimize size={16} /> : <Maximize size={16} />}
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-gray-800 border-gray-700 text-white p-2">
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} className="mr-2" />
                      <span>Load Audio</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={handleRecordToggle}
                    >
                      <Mic size={14} className="mr-2" />
                      <span>{isRecording ? 'Stop Recording' : 'Record'}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={handleExportTrack}
                    >
                      <Download size={14} className="mr-2" />
                      <span>Export as WAV</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => {
                        setVisualizationType(
                          visualizationType === 'waveform' ? 'spectrum' : 'waveform'
                        )
                      }}
                    >
                      {visualizationType === 'waveform' ? 
                        <BarChart3 size={14} className="mr-2" /> : 
                        <Activity size={14} className="mr-2" />
                      }
                      <span>Switch View</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8 text-purple-400 hover:text-purple-300 hover:bg-purple-950"
                      onClick={() => onAiEnhance && onAiEnhance(id)}
                    >
                      <Sparkles size={14} className="mr-2" />
                      <span>AI Enhance</span>
                    </Button>
                    
                    <hr className="border-gray-700 my-1" />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8 text-red-400 hover:text-red-300 hover:bg-red-950"
                      onClick={() => onDelete && onDelete(id)}
                    >
                      <Trash2 size={14} className="mr-2" />
                      <span>Delete Track</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Volume slider */}
          <div className="flex items-center space-x-2 mb-2">
            <Volume2 size={14} className="text-gray-400 shrink-0" />
            <Slider
              value={[volume * 100]}
              min={0}
              max={100}
              step={1}
              className="flex-1"
              onValueChange={(values) => {
                const newVolume = values[0] / 100;
                if (onVolumeChange) {
                  onVolumeChange(id, newVolume);
                }
              }}
            />
            <span className="text-xs text-gray-400 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
          
          {/* Pan slider - only shown when expanded */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs text-gray-400">L</span>
                  <Slider
                    value={[(pan + 1) * 50]}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                    onValueChange={(values) => {
                      const newPan = (values[0] / 50) - 1;
                      if (onPanChange) {
                        onPanChange(id, newPan);
                      }
                    }}
                  />
                  <span className="text-xs text-gray-400">R</span>
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {pan === 0 
                      ? 'C' 
                      : pan < 0 
                        ? `L${Math.abs(Math.round(pan * 100))}` 
                        : `R${Math.round(pan * 100)}`
                    }
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Visualization area */}
          <div className="relative h-24 rounded overflow-hidden">
            {visualizationType === 'waveform' ? (
              <WaveformVisualizer
                trackId={id}
                isActive={isActive}
                animated={true}
                showPlayhead={true}
                gradientColors={['#2563eb', '#3b82f6', '#60a5fa']}
                className="w-full h-full"
              />
            ) : (
              <SpectrumAnalyzer
                trackId={id}
                height={96}
                barCount={32}
                style="bars"
                gradientColors={['#3b82f6', '#8b5cf6', '#d946ef']}
                className="w-full h-full"
              />
            )}
            
            {/* Playback controls overlay - show on hover */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40"
                >
                  <div className="flex space-x-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full"
                      onClick={() => {
                        // Seek backwards
                      }}
                    >
                      <SkipBack size={18} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 bg-white/20 hover:bg-white/30 rounded-full"
                      onClick={handlePlayToggle}
                    >
                      {isPlaying ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full"
                      onClick={() => {
                        // Seek forwards
                      }}
                    >
                      <SkipForward size={18} />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Expanded section: EQ, effects, etc. */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 pt-3 border-t border-gray-800"
              >
                <div className="grid grid-cols-2 gap-3">
                  {/* EQ Controls */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-400">EQ</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Low</Label>
                        <Slider
                          value={[50]}
                          min={0}
                          max={100}
                          step={1}
                          className="w-28"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Mid</Label>
                        <Slider
                          value={[50]}
                          min={0}
                          max={100}
                          step={1}
                          className="w-28"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">High</Label>
                        <Slider
                          value={[50]}
                          min={0}
                          max={100}
                          step={1}
                          className="w-28"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Effects Controls */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-400">Effects</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Reverb</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Delay</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Compress</Label>
                        <Switch checked />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tools row */}
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-xs">
                      <Scissors size={12} className="mr-1" />
                      Split
                    </Button>
                    <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-xs">
                      <Copy size={12} className="mr-1" />
                      Duplicate
                    </Button>
                    <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-xs">
                      <Hammer size={12} className="mr-1" />
                      Normalize
                    </Button>
                    <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-xs">
                      <LayoutGrid size={12} className="mr-1" />
                      Quantize
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="audio/*"
        onChange={handleFileUpload}
      />
    </motion.div>
  );
};

export { InteractiveTrack };
export type { InteractiveTrackProps };