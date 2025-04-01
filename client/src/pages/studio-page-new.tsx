import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Mic,
  Play,
  Pause,
  Square,
  Save,
  Plus,
  Music,
  Settings,
  Sliders,
  Volume2,
  VolumeX,
  Zap,
  SkipBack,
  SkipForward,
  Download,
  Users,
  Share2,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LayoutGrid,
  Music2,
  ArrowUpDown,
} from 'lucide-react';

// Audio context for the entire studio
let audioContextInstance: AudioContext | null = null;

// Singleton for audio context
const getAudioContext = () => {
  if (!audioContextInstance) {
    try {
      // @ts-ignore - For cross-browser support
      audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.error("Could not create AudioContext:", error);
    }
  }
  return audioContextInstance;
};

// Generate mock waveform data for visualization
const generateWaveform = (length = 500) => {
  return Array.from({ length }, () => Math.random() * 100);
};

interface Track {
  id: number;
  name: string;
  type: 'audio' | 'vocal' | 'midi';
  color: string;
  isMuted: boolean;
  isSoloed: boolean;
  volume: number;
  pan: number;
  regions: Region[];
  effects: Effect[];
}

interface Region {
  id: number;
  start: number; // Start measure
  end: number;   // End measure
  waveformData: number[];
  audioBuffer?: AudioBuffer;
}

interface Effect {
  id: number;
  type: string;
  name: string;
  isActive: boolean;
  parameters: Record<string, any>;
}

interface Project {
  id: number;
  title: string;
  bpm: number;
  timeSignature: string;
  key: string;
  tracks: Track[];
  lastModified: Date;
}

// Available auto-pitch modes
const autoPitchModes = [
  { id: 'classic', name: 'Classic', icon: '🎵' },
  { id: 'duet', name: 'Duet', icon: '🎤' },
  { id: 'bigHarmony', name: 'Big Harmony', icon: '🎹' },
  { id: 'natural', name: 'Natural', icon: '🌱' }
];

// Musical notes for chromatic scale
const musicalNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Track color options
const trackColors = [
  'rgb(59, 130, 246)', // blue
  'rgb(168, 85, 247)',  // purple
  'rgb(236, 72, 153)',  // pink
  'rgb(239, 68, 68)',   // red
  'rgb(245, 158, 11)',  // amber
  'rgb(34, 197, 94)',   // green
  'rgb(16, 185, 129)',  // emerald
  'rgb(20, 184, 166)',  // teal
  'rgb(99, 102, 241)'   // indigo
];

const BandLabStudio: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId ? parseInt(params.projectId) : null;
  
  // Studio state
  const [project, setProject] = useState<Project>({
    id: Date.now(),
    title: 'New Project',
    bpm: 120,
    timeSignature: '4/4',
    key: 'C',
    tracks: [],
    lastModified: new Date()
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0); // In measures
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [activeEffectPanel, setActiveEffectPanel] = useState<string | null>('autoPitch');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCollaborationDialog, setShowCollaborationDialog] = useState(false);
  const [selectedAutoPitchMode, setSelectedAutoPitchMode] = useState('classic');
  const [autoPitchEnabled, setAutoPitchEnabled] = useState(false);
  const [selectedKey, setSelectedKey] = useState('C');
  const [inputVolume, setInputVolume] = useState(75);
  const [outputVolume, setOutputVolume] = useState(75);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const playbackInterval = useRef<any>(null);
  
  // Initialize audio context
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  useEffect(() => {
    const ctx = getAudioContext();
    if (ctx) {
      setAudioContext(ctx);
    }
    
    // Create a default vocal track if no tracks exist
    if (project.tracks.length === 0) {
      addTrack('vocal');
    }
    
    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
      
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
        if (mediaRecorder.current.stream) {
          mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);
  
  // Fetch project data if ID is provided
  useEffect(() => {
    if (projectId) {
      // This would fetch from the server in a real implementation
      // For now, we'll just use the default project
    }
  }, [projectId]);
  
  // Currently selected track
  const selectedTrack = project.tracks.find(track => track.id === selectedTrackId);
  
  // Add a new track to the project
  const addTrack = (type: 'audio' | 'vocal' | 'midi') => {
    const trackName = type === 'vocal' ? 'Vocal/Audio' : 
                     type === 'midi' ? 'MIDI' : 'Audio';
    
    const newTrack: Track = {
      id: Date.now(),
      name: `${project.tracks.length + 1}. ${trackName}`,
      type,
      color: trackColors[project.tracks.length % trackColors.length],
      isMuted: false,
      isSoloed: false,
      volume: 75,
      pan: 0,
      regions: [],
      effects: []
    };
    
    // Add default effects for vocal tracks
    if (type === 'vocal') {
      newTrack.effects.push({
        id: Date.now(),
        type: 'autoPitch',
        name: 'AutoPitch™',
        isActive: false,
        parameters: {
          mode: 'classic',
          key: 'C',
          amount: 50
        }
      });
    }
    
    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
      lastModified: new Date()
    }));
    
    setSelectedTrackId(newTrack.id);
    return newTrack;
  };
  
  // Remove track from project
  const removeTrack = (trackId: number) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId),
      lastModified: new Date()
    }));
    
    if (selectedTrackId === trackId) {
      setSelectedTrackId(project.tracks[0]?.id || null);
    }
  };
  
  // Update track properties
  const updateTrack = (trackId: number, updates: Partial<Track>) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId ? { ...track, ...updates } : track
      ),
      lastModified: new Date()
    }));
  };
  
  // Toggle mute for a track
  const toggleMute = (trackId: number) => {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { isMuted: !track.isMuted });
    }
  };
  
  // Toggle solo for a track
  const toggleSolo = (trackId: number) => {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { isSoloed: !track.isSoloed });
    }
  };
  
  // Change track's volume
  const changeVolume = (trackId: number, volume: number) => {
    updateTrack(trackId, { volume });
  };
  
  // Change track's pan
  const changePan = (trackId: number, pan: number) => {
    updateTrack(trackId, { pan });
  };
  
  // Update effect settings
  const updateEffect = (trackId: number, effectId: number, updates: Partial<Effect>) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            effects: track.effects.map(effect => 
              effect.id === effectId ? { ...effect, ...updates } : effect
            )
          };
        }
        return track;
      }),
      lastModified: new Date()
    }));
  };
  
  // Toggle effect active state
  const toggleEffect = (trackId: number, effectId: number) => {
    const track = project.tracks.find(t => t.id === trackId);
    if (!track) return;
    
    const effect = track.effects.find(e => e.id === effectId);
    if (effect) {
      updateEffect(trackId, effectId, { isActive: !effect.isActive });
    }
  };
  
  // Start recording
  const startRecording = async () => {
    if (!audioContext || isRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Convert blob to arraybuffer for audio processing
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Find the selected track or use the first vocal track
        const targetTrackId = selectedTrackId || 
          project.tracks.find(t => t.type === 'vocal')?.id || 
          project.tracks[0]?.id;
        
        if (targetTrackId) {
          // Calculate the end measure based on recording duration and project tempo
          const startMeasure = Math.floor(currentPosition);
          const durationInSeconds = audioBuffer.duration;
          const secondsPerMeasure = (60 / project.bpm) * 4; // assuming 4/4 time
          const lengthInMeasures = durationInSeconds / secondsPerMeasure;
          const endMeasure = startMeasure + Math.ceil(lengthInMeasures);
          
          // Add new region to the track
          addRegionToTrack(targetTrackId, {
            id: Date.now(),
            start: startMeasure,
            end: endMeasure,
            waveformData: generateWaveform(),
            audioBuffer
          });
        }
        
        audioChunks.current = [];
        setIsRecording(false);
      };
      
      // Start recording
      mediaRecorder.current.start();
      setIsRecording(true);
      
      // Start playback for recording along with the project
      if (!isPlaying) {
        togglePlayback();
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  };
  
  // Add region to track
  const addRegionToTrack = (trackId: number, region: Region) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            regions: [...track.regions, region]
          };
        }
        return track;
      }),
      lastModified: new Date()
    }));
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      
      // Stop the tracks to release microphone
      if (mediaRecorder.current.stream) {
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  // Play/pause functionality
  const togglePlayback = () => {
    if (isPlaying) {
      // Stop playback
      clearInterval(playbackInterval.current);
      setIsPlaying(false);
    } else {
      // Start playback
      setIsPlaying(true);
      playbackInterval.current = setInterval(() => {
        setCurrentPosition(prev => {
          // Loop back to start when reaching end of visible area (16 measures)
          const newPos = prev + 0.1;
          return newPos >= 16 ? 0 : newPos;
        });
      }, 100);
    }
  };
  
  // Stop playback and reset position
  const stopPlayback = () => {
    if (isPlaying) {
      clearInterval(playbackInterval.current);
      setIsPlaying(false);
    }
    setCurrentPosition(0);
  };
  
  // Go to beginning
  const goToStart = () => {
    setCurrentPosition(0);
  };
  
  // Save project
  const saveProject = () => {
    // In a real implementation, this would save to the server
    // For now, we'll just update the lastModified date
    setProject(prev => ({
      ...prev,
      lastModified: new Date()
    }));
    
    toast({
      title: "Project Saved",
      description: "Your project has been saved successfully."
    });
    
    setShowSaveDialog(false);
  };
  
  // Format time code display (MM:SS.MS)
  const formatTimeCode = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
  };
  
  // Calculate time from position in measures
  const getTimeFromPosition = (position: number) => {
    const beatsPerMeasure = parseInt(project.timeSignature.split('/')[0]);
    const secondsPerBeat = 60 / project.bpm;
    return position * beatsPerMeasure * secondsPerBeat;
  };
  
  // Update auto-pitch settings
  const updateAutoPitchSettings = (mode: string, isEnabled: boolean) => {
    setSelectedAutoPitchMode(mode);
    setAutoPitchEnabled(isEnabled);
    
    // Update the auto-pitch effect on the current track if it exists
    if (selectedTrackId) {
      const track = project.tracks.find(t => t.id === selectedTrackId);
      if (track) {
        const autoPitchEffect = track.effects.find(e => e.type === 'autoPitch');
        if (autoPitchEffect) {
          updateEffect(selectedTrackId, autoPitchEffect.id, {
            isActive: isEnabled,
            parameters: {
              ...autoPitchEffect.parameters,
              mode,
              key: selectedKey
            }
          });
        }
      }
    }
  };
  
  // Handle clicks on the timeline to set position
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const timelineWidth = rect.width;
    const measurePosition = (clickPosition / timelineWidth) * 16; // 16 measures in view
    
    setCurrentPosition(Math.max(0, Math.min(16, measurePosition)));
  };
  
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header/Transport */}
      <div className="flex justify-between items-center px-4 py-2 bg-zinc-900 border-b border-zinc-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Menu className="h-5 w-5 mr-3 text-zinc-400 cursor-pointer" />
            <div className="flex items-center">
              <span className="font-bold">Ball</span>
              <div className="w-5 h-5 mx-1 bg-purple-600 rounded-full flex items-center justify-center">
                <Music className="h-3 w-3 text-white" />
              </div>
              <span className="font-bold">Talk</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 text-xs bg-zinc-800 rounded px-2 py-1">
            <span className="text-purple-400">Get</span>
            <span className="bg-amber-400 text-black font-medium rounded px-1">+</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="font-medium text-sm">{project.title}</div>
          <div className="text-xs text-zinc-400">Last saved: {project.lastModified.toLocaleTimeString()}</div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            Publish
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            onClick={() => setShowCollaborationDialog(true)}
          >
            Invite
            <span className="ml-1 w-5 h-5 flex items-center justify-center bg-zinc-700 rounded-full text-xs">
              {user ? 1 : 0}
            </span>
          </Button>
        </div>
      </div>
      
      {/* Transport Controls */}
      <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-zinc-700">
        <div className="flex items-center space-x-2 mr-6">
          <div className="flex items-center space-x-2 mr-2">
            <Input 
              value={project.bpm} 
              onChange={(e) => setProject(prev => ({...prev, bpm: parseInt(e.target.value)}))}
              className="w-12 h-7 bg-zinc-800 border-zinc-700 text-center p-1"
            />
            <span className="text-xs text-zinc-400">bpm</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Select
              value={project.timeSignature}
              onValueChange={(value) => setProject(prev => ({...prev, timeSignature: value}))}
            >
              <SelectTrigger className="w-14 h-7 bg-zinc-800 border-zinc-700 text-center">
                <SelectValue defaultValue="4/4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4/4">4/4</SelectItem>
                <SelectItem value="3/4">3/4</SelectItem>
                <SelectItem value="6/8">6/8</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={project.key}
              onValueChange={(value) => setProject(prev => ({...prev, key: value}))}
            >
              <SelectTrigger className="w-14 h-7 bg-zinc-800 border-zinc-700 text-center">
                <SelectValue defaultValue="C" />
              </SelectTrigger>
              <SelectContent>
                {musicalNotes.map(note => (
                  <SelectItem key={note} value={note}>{note}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button onClick={goToStart} className="text-zinc-400 hover:text-white">
            <SkipBack className="h-4 w-4" />
          </button>
          
          <Button
            size="sm"
            variant={isPlaying ? "destructive" : "default"}
            className={isPlaying ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"}
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <button onClick={stopPlayback} className="text-zinc-400 hover:text-white">
            <Square className="h-4 w-4" />
          </button>
          
          <Button
            size="sm"
            variant={isRecording ? "destructive" : "outline"}
            className={isRecording 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"}
            onClick={isRecording ? stopRecording : startRecording}
          >
            <span className="flex h-3 w-3 rounded-full bg-red-600"></span>
          </Button>
        </div>
        
        <div className="flex items-center ml-6">
          <span className="font-mono text-sm mr-3">
            {formatTimeCode(getTimeFromPosition(currentPosition))}
          </span>
          
          <div className="flex items-center space-x-1">
            <button className="text-zinc-400 hover:text-white">
              <SkipBack className="h-3 w-3" />
            </button>
            <div className="bg-zinc-800 w-16 h-4 rounded-sm"></div>
            <button className="text-zinc-400 hover:text-white">
              <SkipForward className="h-3 w-3" />
            </button>
          </div>
        </div>
        
        <div className="ml-auto flex items-center">
          <div className="flex items-center mr-4">
            <div className="text-xs text-zinc-400 mr-2">Master</div>
            <div className="flex items-center">
              <span className="text-xs mr-1">-∞</span>
              <div className="bg-zinc-800 w-32 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-500 to-yellow-500 h-full"
                  style={{ width: `${outputVolume}%` }}
                ></div>
              </div>
              <span className="text-xs ml-1">+0 dB</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track List / Channel Strip */}
        <div className="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col">
          <div className="flex items-center justify-between p-2 border-b border-zinc-800">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs flex items-center"
              onClick={() => addTrack('vocal')}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Track
            </Button>
            
            <div className="flex">
              <button className="p-1 text-zinc-400 hover:text-white">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button className="p-1 text-zinc-400 hover:text-white">
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {project.tracks.map(track => (
              <div 
                key={track.id} 
                className={`border-b border-zinc-800 ${selectedTrackId === track.id ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}
                onClick={() => setSelectedTrackId(track.id)}
              >
                <div className="p-2 flex items-center">
                  {/* Track color indicator */}
                  <div 
                    className="w-1 self-stretch mr-2 rounded-full" 
                    style={{ backgroundColor: track.color }}
                  ></div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xs font-medium">{track.name}</span>
                        {track.type === 'vocal' && (
                          <span className="ml-1 text-xs text-zinc-500">+Fx</span>
                        )}
                      </div>
                      
                      <div className="flex">
                        <button 
                          className={`p-1 ${track.isMuted ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`}
                          onClick={(e) => { e.stopPropagation(); toggleMute(track.id); }}
                        >
                          {track.isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </button>
                        <button 
                          className={`p-1 ${track.isSoloed ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                          onClick={(e) => { e.stopPropagation(); toggleSolo(track.id); }}
                        >
                          <span className="text-xs font-bold">S</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Volume slider */}
                    <div className="flex items-center mt-1 space-x-1">
                      <Volume2 className="h-3 w-3 text-zinc-500" />
                      <div className="relative flex-1 h-1 bg-zinc-700 rounded-full">
                        <div 
                          className="absolute inset-y-0 left-0 bg-zinc-500 rounded-full"
                          style={{ width: `${track.volume}%` }}
                        ></div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={track.volume} 
                          onChange={(e) => changeVolume(track.id, parseInt(e.target.value))}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    {/* Pan knob (simplified as a slider) */}
                    <div className="flex items-center mt-1 space-x-1">
                      <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                      <div className="relative flex-1 h-1 bg-zinc-700 rounded-full">
                        <div 
                          className="absolute inset-y-0 bg-zinc-500 rounded-full"
                          style={{ 
                            left: `${track.pan < 0 ? 50 + track.pan/2 : 50}%`, 
                            right: `${track.pan > 0 ? 50 - track.pan/2 : 50}%` 
                          }}
                        ></div>
                        <input 
                          type="range" 
                          min="-100" 
                          max="100" 
                          value={track.pan} 
                          onChange={(e) => changePan(track.id, parseInt(e.target.value))}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Timeline and Tracks */}
        <div className="flex-1 flex flex-col">
          {/* Measure numbers */}
          <div 
            className="relative h-8 bg-zinc-900 border-b border-zinc-800 flex"
            ref={timelineRef}
            onClick={handleTimelineClick}
          >
            {Array.from({ length: 16 }, (_, i) => (
              <div 
                key={i} 
                className="flex-1 border-r border-zinc-800 flex flex-col items-center justify-center"
              >
                <span className="text-xs text-zinc-500">{i + 1}</span>
                <div className="flex w-full">
                  {Array.from({ length: 4 }, (_, j) => (
                    <div key={j} className="flex-1 border-r border-zinc-800 last:border-r-0"></div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Playhead */}
            <div 
              ref={playheadRef}
              className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
              style={{ left: `${(currentPosition / 16) * 100}%` }}
            >
              <div className="h-3 w-3 bg-red-500 rounded-full -ml-1.5 -mt-1.5"></div>
            </div>
          </div>
          
          {/* Tracks area */}
          <div className="flex-1 overflow-y-auto bg-zinc-950">
            {project.tracks.map(track => (
              <div 
                key={track.id} 
                className={`h-28 border-b border-zinc-800 relative ${selectedTrackId === track.id ? 'bg-zinc-900/30' : ''}`}
                onClick={() => setSelectedTrackId(track.id)}
              >
                {/* Track regions */}
                {track.regions.map(region => (
                  <div 
                    key={region.id}
                    className="absolute top-0 bottom-0 bg-opacity-30 rounded-sm overflow-hidden"
                    style={{ 
                      left: `${(region.start / 16) * 100}%`,
                      width: `${((region.end - region.start) / 16) * 100}%`,
                      backgroundColor: track.color
                    }}
                  >
                    {/* Waveform visualization */}
                    <div className="h-full flex items-center">
                      {region.waveformData.map((value, idx) => (
                        <div 
                          key={idx}
                          className="w-px bg-white opacity-70"
                          style={{ height: `${Math.max(3, value/3)}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Empty state message */}
                {track.regions.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                    <Music2 className="h-8 w-8 mb-2" />
                    <p className="text-xs">Drop a loop or an audio/MIDI/video file</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Effect Panel (Bottom) */}
          <div className="h-72 bg-zinc-900 border-t border-zinc-800">
            <Tabs defaultValue="autoPitch">
              <div className="border-b border-zinc-800 flex items-center justify-between px-2">
                <TabsList className="bg-transparent border-b border-transparent">
                  <TabsTrigger 
                    value="autoPitch" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none data-[state=active]:shadow-none"
                    onClick={() => setActiveEffectPanel('autoPitch')}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    AutoPitch™
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fx" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none data-[state=active]:shadow-none"
                    onClick={() => setActiveEffectPanel('fx')}
                  >
                    <Sliders className="h-4 w-4 mr-1" />
                    Effects
                  </TabsTrigger>
                  <TabsTrigger 
                    value="editor" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none data-[state=active]:shadow-none"
                    onClick={() => setActiveEffectPanel('editor')}
                  >
                    Editor
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-zinc-400 hover:text-white"
                    onClick={() => {
                      // Close panel logic here
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <TabsContent value="autoPitch" className="p-4">
                <div className="grid grid-cols-3 gap-8">
                  {/* Input settings */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Input</h3>
                    <div className="space-y-2">
                      <Select defaultValue="default">
                        <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Select input" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">No Device</SelectItem>
                          <SelectItem value="mic">Microphone</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select defaultValue="1">
                        <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Channel 1</SelectItem>
                          <SelectItem value="2">Channel 2</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Input Level</Label>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '50%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-xs bg-zinc-800 border-zinc-700">
                          <span className="mr-1">🎧</span> Monitoring
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* AutoPitch controls */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Switch 
                          checked={autoPitchEnabled} 
                          onCheckedChange={(checked) => updateAutoPitchSettings(selectedAutoPitchMode, checked)}
                          className="mr-4"
                        />
                        <h2 className="text-lg font-bold">AutoPitch™</h2>
                      </div>
                      
                      <div className="flex items-center">
                        <Label className="text-xs mr-2">AutoDetect Key</Label>
                        <Switch />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 mb-6">
                      {/* Harmony modes */}
                      <div>
                        <Label className="text-xs mb-2 block">Category</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {autoPitchModes.map(mode => (
                            <button 
                              key={mode.id}
                              className={`p-3 rounded-lg flex flex-col items-center justify-center ${
                                selectedAutoPitchMode === mode.id
                                  ? 'bg-purple-600 bg-opacity-30 border border-purple-500'
                                  : 'bg-zinc-800 border border-zinc-700'
                              }`}
                              onClick={() => updateAutoPitchSettings(mode.id, autoPitchEnabled)}
                            >
                              <span className="text-xl mb-1">{mode.icon}</span>
                              <span className="text-xs">{mode.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Scale selection */}
                      <div>
                        <Label className="text-xs mb-2 block">Scale</Label>
                        <Select defaultValue="chromatic">
                          <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                            <SelectValue placeholder="Select scale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chromatic">Chromatic</SelectItem>
                            <SelectItem value="major">Major</SelectItem>
                            <SelectItem value="minor">Minor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Circular amount control */}
                    <div className="flex justify-center mb-4">
                      <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-purple-600 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-1 w-16 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-16 w-1 bg-gradient-to-b from-transparent via-purple-500 to-transparent"></div>
                        </div>
                        <div className="absolute bottom-2 right-2 h-4 w-4 bg-white rounded-full shadow-md"></div>
                      </div>
                    </div>
                    
                    {/* Note buttons */}
                    <div className="flex justify-center space-x-1">
                      {musicalNotes.slice(0, 7).map(note => (
                        <button 
                          key={note}
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedKey === note 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                          onClick={() => setSelectedKey(note)}
                        >
                          {note}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="fx" className="p-4">
                <div className="h-full flex items-center justify-center text-zinc-500">
                  <p>Effects panel will appear here</p>
                </div>
              </TabsContent>
              
              <TabsContent value="editor" className="p-4">
                <div className="h-full flex items-center justify-center text-zinc-500">
                  <p>Audio editor will appear here</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input 
                value={project.title} 
                onChange={(e) => setProject(prev => ({...prev, title: e.target.value}))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={saveProject}>Save Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showCollaborationDialog} onOpenChange={setShowCollaborationDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Collaborate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-zinc-400">Share this project with others to collaborate in real-time.</p>
            <div className="space-y-2">
              <Label>Invite by Email or Username</Label>
              <Input 
                placeholder="Enter email or username"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            <div className="bg-zinc-800 p-3 rounded-md">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback className="bg-purple-600 text-white">
                    {user?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user?.username || 'You'}</div>
                  <div className="text-xs text-zinc-400">Owner</div>
                </div>
                <Badge className="ml-auto">Online</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollaborationDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              toast({
                title: "Invitation Sent",
                description: "Your collaborator will receive an invitation email."
              });
              setShowCollaborationDialog(false);
            }}>
              <Share2 className="h-4 w-4 mr-1" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BandLabStudio;