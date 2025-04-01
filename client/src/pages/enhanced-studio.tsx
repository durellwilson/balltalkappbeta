import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  PlusCircle, 
  Save, 
  Trash2, 
  Download, 
  Upload, 
  Volume2, 
  VolumeX,
  Settings, 
  Users, 
  MessageSquare, 
  LayoutPanelLeft,
  Play,
  Pause,
  Square,
  PlayCircle,
  PauseCircle,
  Import,
  ChevronRight,
  ChevronLeft,
  Mic,
  Music,
  Disc,
  HelpCircle
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Custom Components
import { InteractiveTrack } from '@/components/studio/interactive-track';
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer';
import { SpectrumAnalyzer } from '@/components/ui/spectrum-analyzer';
import { FileUploadModal } from '@/components/studio/file-upload-modal';
import { FileDropZone } from '@/components/studio/file-drop-zone';

// Hooks and Utils
import { useToast } from '@/hooks/use-toast';
import audioProcessor from '@/lib/audioProcessor';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useStudioCollaboration } from '@/hooks/use-studio-collaboration';

// Types and Interfaces
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
}

interface Project {
  id: string;
  name: string;
  bpm: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  color?: string;
}

const EnhancedStudio: React.FC = () => {
  // State
  const [project, setProject] = useState<Project>({
    id: 'demo-1',
    name: 'My Project',
    bpm: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [chatMessages, setChatMessages] = useState<{id: string, user: User, text: string, time: string}[]>([]);
  const [newChatMessage, setNewChatMessage] = useState<string>('');
  const [sidebarTab, setSidebarTab] = useState<'tracks' | 'mixer' | 'collab'>('tracks');
  const [projectTime, setProjectTime] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  
  // References
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>(0);
  
  // Hooks
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Initialize collaboration
  const collaboration = useStudioCollaboration({
    projectId: project.id,
    userId: 'current-user',
    username: 'Current User',
    onUserJoin: (user) => {
      setCurrentUsers(prev => [...prev, user]);
      toast({
        title: 'User joined',
        description: `${user.name} has joined the studio`,
      });
    },
    onUserLeave: (user) => {
      setCurrentUsers(prev => prev.filter(u => u.id !== user.id));
      toast({
        title: 'User left',
        description: `${user.name} has left the studio`,
      });
    },
    onMessage: (message) => {
      const newMessage = {
        id: message.id,
        user: {
          id: message.sender.id,
          name: message.sender.name
        },
        text: message.text,
        time: new Date(message.timestamp).toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, newMessage]);
    }
  });
  
  // Configure audio processor for this studio session
  useEffect(() => {
    const configureAudio = () => {
      try {
        // Configure master settings without initializing the audio context
        // Audio context initialization happens on user interaction
        if (audioProcessor.isReady()) {
          audioProcessor.setMasterVolume(masterVolume);
          audioProcessor.setBpm(project.bpm);
        }
        
        // Initialize demo tracks
        const demoTracks: Track[] = [
          {
            id: 1,
            name: 'Vocals',
            type: 'vocal',
            volume: 0.8,
            pan: 0,
            isMuted: false,
            isSoloed: false
          },
          {
            id: 2,
            name: 'Guitar',
            type: 'instrument',
            volume: 0.7,
            pan: -0.3,
            isMuted: false,
            isSoloed: false
          },
          {
            id: 3,
            name: 'Drums',
            type: 'drum',
            volume: 0.75,
            pan: 0.1,
            isMuted: false,
            isSoloed: false
          }
        ];
        
        // Create tracks in the audio processor
        demoTracks.forEach(track => {
          audioProcessor.createTrack(track.id, {
            volume: track.volume,
            pan: track.pan,
            muted: track.isMuted,
            soloed: track.isSoloed
          });
        });
        
        setTracks(demoTracks);
        
        // Add listener for esc key to stop playback
        window.addEventListener('keydown', handleKeyPress);
        
        return () => {
          window.removeEventListener('keydown', handleKeyPress);
          audioProcessor.dispose();
        };
      } catch (error) {
        console.error('Failed to initialize audio engine:', error);
        toast({
          title: 'Audio Engine Error',
          description: 'Failed to initialize the audio engine. Please try again.',
          variant: 'destructive'
        });
      }
    };
    
    configureAudio();
  }, []);
  
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  // Update timer when playing
  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setProjectTime(prev => prev + 0.1);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [isPlaying]);
  
  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Space bar toggles play/pause
    if (e.code === 'Space') {
      e.preventDefault();
      handlePlayPause();
    }
    
    // Escape stops playback and recording
    if (e.code === 'Escape') {
      e.preventDefault();
      if (isPlaying) {
        handleStop();
      }
      if (isRecording) {
        handleRecordStop();
      }
    }
  }, [isPlaying, isRecording]);
  
  // Handle playback controls
  const handlePlayPause = async () => {
    try {
      // Check if audio processor is ready - if not, we show the overlay prompt now
      if (!audioProcessor.isReady()) {
        toast({
          title: "Audio Not Initialized",
          description: "Please enable the audio engine first using the 'Enable Audio Engine' button.",
          variant: "destructive"
        });
        return;
      }
      
      // Toggle play state
      if (isPlaying) {
        audioProcessor.pause();
        setIsPlaying(false);
      } else {
        audioProcessor.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Failed to play/pause:", error);
      toast({
        title: "Playback Error",
        description: "Could not control playback. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleStop = () => {
    if (audioProcessor.isReady()) {
      audioProcessor.stop();
      setIsPlaying(false);
      setProjectTime(0);
    }
  };
  
  const handleRecordStart = async () => {
    try {
      // Check if audio processor is ready - if not, we show the overlay prompt now
      if (!audioProcessor.isReady()) {
        toast({
          title: "Audio Not Initialized",
          description: "Please enable the audio engine first using the 'Enable Audio Engine' button.",
          variant: "destructive"
        });
        return;
      }
      
      // Request microphone permissions explicitly
      try {
        // Check if we have microphone permissions
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // If we get here, we have permissions - immediately stop the stream
        stream.getTracks().forEach(track => track.stop());
        
        // Now start recording with the audio processor
        await audioProcessor.startRecording();
        setIsRecording(true);
        
        // If not playing, start playback too
        if (!isPlaying) {
          audioProcessor.play();
          setIsPlaying(true);
        }
      } catch (micError) {
        console.error("Microphone access error:", micError);
        toast({
          title: "Microphone Access Denied",
          description: "Please grant microphone permissions to record audio.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Recording Error",
        description: "Could not start recording. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleRecordStop = async () => {
    if (!audioProcessor.isReady()) {
      setIsRecording(false);
      return;
    }
    
    try {
      // Stop the recording and get resulting audio data
      const blob = await audioProcessor.stopRecording();
      
      if (blob) {
        // Create a new track with the recording
        const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
        const newTrack: Track = {
          id: newTrackId,
          name: `Recording ${newTrackId}`,
          type: 'audio',
          volume: 0.8,
          pan: 0,
          isMuted: false,
          isSoloed: false
        };
        
        // Create track processor
        const track = audioProcessor.createTrack(newTrackId, {
          volume: newTrack.volume,
          pan: newTrack.pan
        });
        
        try {
          // Load the recorded audio
          const url = URL.createObjectURL(blob);
          await track.loadAudio(url);
          
          // Add to tracks list
          setTracks(prev => [...prev, newTrack]);
          
          toast({
            title: 'Recording completed',
            description: `New track "${newTrack.name}" created with your recording.`
          });
        } catch (error) {
          console.error("Failed to load recorded audio:", error);
          toast({
            title: "Recording Error",
            description: "Recorded audio could not be loaded. Please try again.",
            variant: "destructive"
          });
          
          // Clean up the created track
          audioProcessor.removeTrack(newTrackId);
        }
      } else {
        toast({
          title: "Recording Error",
          description: "No audio was recorded. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast({
        title: "Recording Error",
        description: "Could not save the recording. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRecording(false);
    }
  };
  
  // Handle track operations
  const handleAddTrack = (type: 'audio' | 'instrument' | 'vocal' | 'drum' | 'mix' = 'audio') => {
    const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
    const trackNames = {
      audio: 'Audio Track',
      instrument: 'Instrument',
      vocal: 'Vocals',
      drum: 'Drums',
      mix: 'Mix'
    };
    
    const newTrack: Track = {
      id: newTrackId,
      name: `${trackNames[type]} ${newTrackId}`,
      type,
      volume: 0.8,
      pan: 0,
      isMuted: false,
      isSoloed: false
    };
    
    // Create track in audio processor
    audioProcessor.createTrack(newTrackId, {
      volume: newTrack.volume,
      pan: newTrack.pan
    });
    
    // Add to tracks list
    setTracks(prev => [...prev, newTrack]);
    
    // Set as active track
    setActiveTrackId(newTrackId);
    
    // Show tracks panel
    setSidebarTab('tracks');
  };
  
  const handleDeleteTrack = (id: number) => {
    // Remove from audio processor
    audioProcessor.removeTrack(id);
    
    // Remove from state
    setTracks(prev => prev.filter(track => track.id !== id));
    
    // If active track was deleted, clear selection
    if (activeTrackId === id) {
      setActiveTrackId(null);
    }
  };
  
  const handleTrackMuteToggle = (id: number, muted: boolean) => {
    setTracks(prev => prev.map(track => 
      track.id === id ? { ...track, isMuted: muted } : track
    ));
    
    // Update audio processor
    const track = audioProcessor.getTrack(id);
    if (track) {
      track.setMuted(muted);
    }
  };
  
  const handleTrackSoloToggle = (id: number, soloed: boolean) => {
    setTracks(prev => prev.map(track => 
      track.id === id ? { ...track, isSoloed: soloed } : track
    ));
    
    // Update audio processor
    const track = audioProcessor.getTrack(id);
    if (track) {
      track.setSolo(soloed);
    }
    
    // When a track is soloed, mute all other tracks
    if (soloed) {
      tracks.forEach(otherTrack => {
        if (otherTrack.id !== id && !otherTrack.isSoloed) {
          const track = audioProcessor.getTrack(otherTrack.id);
          if (track) {
            track.setMuted(true);
          }
        }
      });
    } else {
      // When unsolo-ing, check if any other tracks are soloed
      const anyTracksSoloed = tracks.some(t => t.id !== id && t.isSoloed);
      
      if (!anyTracksSoloed) {
        // If no other tracks are soloed, unmute all tracks
        tracks.forEach(otherTrack => {
          if (otherTrack.id !== id && !otherTrack.isMuted) {
            const track = audioProcessor.getTrack(otherTrack.id);
            if (track) {
              track.setMuted(false);
            }
          }
        });
      }
    }
  };
  
  const handleTrackVolumeChange = (id: number, volume: number) => {
    setTracks(prev => prev.map(track => 
      track.id === id ? { ...track, volume } : track
    ));
    
    // Update audio processor
    const track = audioProcessor.getTrack(id);
    if (track) {
      track.setVolume(volume);
    }
  };
  
  const handleTrackPanChange = (id: number, pan: number) => {
    setTracks(prev => prev.map(track => 
      track.id === id ? { ...track, pan } : track
    ));
    
    // Update audio processor
    const track = audioProcessor.getTrack(id);
    if (track) {
      track.setPan(pan);
    }
  };
  
  const handleMasterVolumeChange = (volume: number) => {
    setMasterVolume(volume);
    audioProcessor.setMasterVolume(volume);
  };
  
  const handleBpmChange = (bpm: number) => {
    setProject(prev => ({ ...prev, bpm }));
    audioProcessor.setBpm(bpm);
  };
  
  // Handle file uploads
  const handleFileUpload = async (files: File[]): Promise<boolean> => {
    try {
      // Check if audio processor is ready
      if (!audioProcessor.isReady()) {
        toast({
          title: "Audio Not Initialized",
          description: "Please enable the audio engine first using the 'Enable Audio Engine' button.",
          variant: "destructive"
        });
        return false;
      }
      
      if (files.length === 0) return false;
      
      // Process each file
      for (const file of files) {
        // Create a new track for this file
        const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
        const newTrack: Track = {
          id: newTrackId,
          name: file.name.split('.')[0] || `Audio ${newTrackId}`, // Use filename without extension as track name
          type: 'audio',
          volume: 0.8,
          pan: 0,
          isMuted: false,
          isSoloed: false
        };
        
        // Create track processor
        const track = audioProcessor.createTrack(newTrackId, {
          volume: newTrack.volume,
          pan: newTrack.pan
        });
        
        // Load the audio file
        await track.loadAudioFile(file);
        
        // Add to tracks list
        setTracks(prev => [...prev, newTrack]);
        
        // Set as active track
        setActiveTrackId(newTrackId);
      }
      
      toast({
        title: 'Files imported',
        description: `${files.length} audio ${files.length === 1 ? 'file' : 'files'} added to your project.`
      });
      
      // Set to tracks panel
      setSidebarTab('tracks');
      
      return true;
    } catch (error) {
      console.error("Failed to import audio files:", error);
      toast({
        title: "Import Error",
        description: "Failed to import audio files. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Handle chat message send
  const handleSendMessage = () => {
    if (!newChatMessage.trim()) return;
    
    // Send via collaboration system
    collaboration.sendMessage(newChatMessage);
    
    // Clear input
    setNewChatMessage('');
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Function to init audio engine on direct user interaction
  const initAudio = async () => {
    try {
      // Show loading state
      toast({
        title: "Initializing audio engine...",
        description: "Please wait while we set up the audio system.",
      });
      
      // Initialize the audio processor
      await audioProcessor.initialize();
      
      // Now configure the audio settings
      audioProcessor.setMasterVolume(masterVolume);
      audioProcessor.setBpm(project.bpm);
      
      toast({
        title: "Audio engine ready",
        description: "You can now play and record audio.",
      });
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      toast({
        title: "Audio Error",
        description: "Could not initialize audio engine. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Audio initialization overlay - shown when audio is not initialized */}
      {!audioProcessor.isReady() && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md text-center">
            <Music size={48} className="mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-bold mb-2">Enable Audio</h2>
            <p className="mb-4 text-gray-300">
              Click the button below to enable the audio engine. Browsers require a direct user interaction to allow audio playback.
            </p>
            <Button 
              size="lg" 
              className="mx-auto bg-blue-600 hover:bg-blue-700"
              onClick={initAudio}
            >
              <Volume2 className="mr-2" />
              Enable Audio Engine
            </Button>
          </div>
        </div>
      )}
      
      {/* Top header with transport controls */}
      <header className="bg-gray-900 border-b border-gray-800 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="icon"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            onClick={() => setLocation('/')}
          >
            <ChevronLeft size={18} />
          </Button>
          
          <div className="flex flex-col">
            <Input
              value={project.name}
              onChange={e => setProject(prev => ({ ...prev, name: e.target.value }))}
              className="bg-transparent border-none text-lg font-medium h-7 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>Last saved: 2 mins ago</span>
              <Badge variant="outline" className="text-emerald-400 border-emerald-800">
                Collaborating ({currentUsers.length + 1})
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              className={isRecording ? "bg-red-900" : "bg-gray-800 border-gray-700"}
              onClick={isRecording ? handleRecordStop : handleRecordStart}
            >
              <Mic size={16} className="mr-1" />
              {isRecording ? "Stop" : "Record"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700"
              onClick={handleStop}
            >
              <Square size={14} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm font-mono">{formatTime(projectTime)}</div>
            <div className="h-5 border-r border-gray-700"></div>
            <div className="flex items-center">
              <Label htmlFor="bpm" className="mr-2 text-xs text-gray-400">BPM</Label>
              <Input
                id="bpm"
                type="number"
                value={project.bpm}
                onChange={e => handleBpmChange(parseInt(e.target.value))}
                className="w-16 h-7 text-sm bg-gray-800 border-gray-700"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Volume2 size={16} className="text-gray-400" />
            <Slider
              value={[masterVolume * 100]}
              min={0}
              max={100}
              step={1}
              className="w-24"
              onValueChange={values => handleMasterVolumeChange(values[0] / 100)}
            />
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  {showSidebar ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showSidebar ? "Hide sidebar" : "Show sidebar"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>
      
      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main editor area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Timeline and arrange view */}
          <div className="flex-1 bg-gray-900 p-4 overflow-auto">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Arrangement</h2>
              
              {/* Zoom controls */}
              <div className="flex items-center space-x-2 mb-3">
                <Label className="text-xs text-gray-400">Zoom</Label>
                <Slider
                  value={[zoomLevel * 100]}
                  min={10}
                  max={200}
                  step={10}
                  className="w-36"
                  onValueChange={values => setZoomLevel(values[0] / 100)}
                />
                <span className="text-xs text-gray-400">{zoomLevel.toFixed(1)}x</span>
              </div>
              
              {/* Timeline ruler */}
              <div className="h-6 bg-gray-800 rounded-t-md flex items-center px-2 text-xs text-gray-400 border-b border-gray-700">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="flex-1 flex items-center justify-center">
                    <span>{i + 1}</span>
                  </div>
                ))}
              </div>
              
              {/* Track arrangement area */}
              <div
                className="bg-gray-800 rounded-b-md"
                style={{ 
                  width: `${1200 * zoomLevel}px`, 
                  minHeight: '400px',
                  position: 'relative'
                }}
              >
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                  style={{ 
                    left: `${(projectTime / 60) * 1200 * zoomLevel}px`,
                    height: '100%'
                  }}
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full -ml-1"></div>
                </div>
                
                {/* Empty state message */}
                {tracks.length === 0 && (
                  <div className="h-60 flex items-center justify-center flex-col text-gray-500">
                    <Music size={48} className="mb-2 opacity-30" />
                    <h3 className="text-lg font-medium mb-1">No Tracks Yet</h3>
                    <p className="text-sm">Add tracks using the sidebar to start making music.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Master channel visualization */}
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Master Output</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                  <CardContent className="p-3">
                    <WaveformVisualizer
                      isMaster={true}
                      animated={true}
                      showPlayhead={true}
                      height={80}
                      gradientColors={['#e11d48', '#f43f5e', '#fb7185']}
                    />
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                  <CardContent className="p-3">
                    <SpectrumAnalyzer
                      isMaster={true}
                      height={80}
                      barCount={64}
                      style="area"
                      gradientColors={['#8b5cf6', '#d946ef', '#f43f5e']}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Bottom transport and status bar */}
          <div className="h-8 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4 text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>{project.bpm} BPM</span>
              <span>44.1kHz / 24-bit</span>
              <span>{isPlaying ? 'Playing' : 'Stopped'}</span>
              {isRecording && (
                <span className="text-red-500 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1"></span>
                  Recording
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span>Tracks: {tracks.length}</span>
              <span>CPU: 2%</span>
              <span>Memory: 128MB</span>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900 border-l border-gray-800 overflow-hidden"
            >
              <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as any)}>
                <div className="p-3 border-b border-gray-800">
                  <TabsList className="w-full bg-gray-800">
                    <TabsTrigger value="tracks" className="flex-1">
                      <LayoutPanelLeft size={14} className="mr-1" />
                      Tracks
                    </TabsTrigger>
                    <TabsTrigger value="mixer" className="flex-1">
                      <Settings size={14} className="mr-1" />
                      Mixer
                    </TabsTrigger>
                    <TabsTrigger value="collab" className="flex-1">
                      <Users size={14} className="mr-1" />
                      Collab
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="tracks" className="m-0">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">Tracks</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <PlusCircle size={14} className="mr-1" />
                            Add Track
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem onClick={() => handleAddTrack('audio')}>
                            <Music size={14} className="mr-2" />
                            Audio Track
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddTrack('vocal')}>
                            <Mic size={14} className="mr-2" />
                            Vocal Track
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddTrack('instrument')}>
                            <Music size={14} className="mr-2" />
                            Instrument Track
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)}>
                            <Upload size={14} className="mr-2" />
                            Import Audio
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddTrack('drum')}>
                            <Disc size={14} className="mr-2" />
                            Drum Track
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <ScrollArea className="h-[calc(100vh-200px)]">
                      <div 
                        className="space-y-3 min-h-[300px] relative"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.add('bg-gray-800/30', 'border-dashed', 'border-2', 'border-blue-500/50');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove('bg-gray-800/30', 'border-dashed', 'border-2', 'border-blue-500/50');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          e.currentTarget.classList.remove('bg-gray-800/30', 'border-dashed', 'border-2', 'border-blue-500/50');
                          
                          // Get data from drag event
                          const id = e.dataTransfer.getData('track/id');
                          const type = e.dataTransfer.getData('track/type');
                          const name = e.dataTransfer.getData('track/name');
                          
                          if (id && type && name) {
                            // Reorder tracks (simple implementation)
                            const trackId = parseInt(id);
                            const trackIndex = tracks.findIndex(t => t.id === trackId);
                            
                            if (trackIndex !== -1) {
                              // Calculate drop position based on mouse Y position
                              const containerRect = e.currentTarget.getBoundingClientRect();
                              const dropY = e.clientY - containerRect.top;
                              
                              // Find closest track to drop position
                              let newPosition = 0;
                              const trackElements = e.currentTarget.querySelectorAll('.track-item');
                              
                              for (let i = 0; i < trackElements.length; i++) {
                                const trackRect = trackElements[i].getBoundingClientRect();
                                const trackCenter = trackRect.top + trackRect.height / 2 - containerRect.top;
                                
                                if (dropY > trackCenter) {
                                  newPosition = i + 1;
                                }
                              }
                              
                              // Re-order tracks
                              const newTracks = [...tracks];
                              const [movedTrack] = newTracks.splice(trackIndex, 1);
                              newTracks.splice(newPosition, 0, movedTrack);
                              
                              setTracks(newTracks);
                              // Sync with collaboration if available
                              if (collaboration?.syncTracks) {
                                collaboration.syncTracks(newTracks);
                              }
                            }
                          }
                        }}
                      >
                        {tracks.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <Music size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No tracks yet. Add a track to get started.</p>
                            <div className="mt-4">
                              <FileDropZone 
                                onFilesSelected={files => {
                                  // Don't open modal, directly process files
                                  handleFileUpload(files);
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          tracks.map(track => (
                            <div key={track.id} className="track-item">
                              <InteractiveTrack
                                id={track.id}
                                name={track.name}
                                type={track.type}
                                isActive={activeTrackId === track.id}
                                isMuted={track.isMuted}
                                isSoloed={track.isSoloed}
                                volume={track.volume}
                                pan={track.pan}
                                collaborator={track.collaborator}
                                onSelect={() => setActiveTrackId(track.id)}
                                onMuteToggle={handleTrackMuteToggle}
                                onSoloToggle={handleTrackSoloToggle}
                                onVolumeChange={handleTrackVolumeChange}
                                onPanChange={handleTrackPanChange}
                                onDelete={handleDeleteTrack}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
                
                <TabsContent value="mixer" className="m-0">
                  <div className="p-3">
                    <h3 className="text-sm font-medium mb-3">Mixer</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-2">Master</h4>
                        <Card className="bg-gray-800 border-gray-700">
                          <CardContent className="p-3">
                            <div className="flex flex-col items-center">
                              <span className="text-xs mb-1">Volume</span>
                              <div className="h-24 flex items-center">
                                <Slider
                                  orientation="vertical"
                                  value={[masterVolume * 100]}
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="h-full"
                                  onValueChange={values => handleMasterVolumeChange(values[0] / 100)}
                                />
                              </div>
                              <span className="text-xs mt-1">{Math.round(masterVolume * 100)}%</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-2">Track Faders</h4>
                        <div className="flex space-x-3 overflow-x-auto pb-2">
                          {tracks.map(track => (
                            <Card key={track.id} className="bg-gray-800 border-gray-700 min-w-[70px] relative">
                              {track.isMuted && (
                                <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
                                  <VolumeX size={16} className="text-red-500" />
                                </div>
                              )}
                              <CardContent className="p-2">
                                <div className="flex flex-col items-center">
                                  <span className="text-xs mb-1 truncate w-full text-center">{track.name}</span>
                                  <div className="h-28 flex items-center">
                                    <Slider
                                      orientation="vertical"
                                      value={[track.volume * 100]}
                                      min={0}
                                      max={100}
                                      step={1}
                                      className="h-full"
                                      onValueChange={values => handleTrackVolumeChange(track.id, values[0] / 100)}
                                    />
                                  </div>
                                  <span className="text-xs mt-1">{Math.round(track.volume * 100)}%</span>
                                  <div className="flex mt-2 space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-6 w-6 ${track.isMuted ? 'text-red-500' : 'text-gray-400'}`}
                                      onClick={() => handleTrackMuteToggle(track.id, !track.isMuted)}
                                    >
                                      <VolumeX size={12} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-6 w-6 ${track.isSoloed ? 'text-yellow-500' : 'text-gray-400'}`}
                                      onClick={() => handleTrackSoloToggle(track.id, !track.isSoloed)}
                                    >
                                      <span className="text-[10px] font-bold">S</span>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="collab" className="m-0 h-[calc(100vh-130px)] flex flex-col">
                  <div className="p-3 border-b border-gray-800">
                    <h3 className="text-sm font-medium mb-2">Collaborators</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-2 h-2 rounded-full bg-green-500"
                          style={{ boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)' }}
                        ></div>
                        <span className="text-sm">You (Current User)</span>
                        <Badge className="ml-auto bg-blue-600">Owner</Badge>
                      </div>
                      
                      {currentUsers.map(user => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <div 
                            className="w-2 h-2 rounded-full bg-green-500"
                            style={{ boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)' }}
                          ></div>
                          <span className="text-sm">{user.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-hidden flex flex-col p-3">
                    <h3 className="text-sm font-medium mb-2">Chat</h3>
                    
                    <Card className="bg-gray-800 border-gray-700 flex-1 flex flex-col overflow-hidden">
                      <CardContent className="p-3 flex-1 overflow-auto">
                        {chatMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <MessageSquare size={32} className="mb-2 opacity-30" />
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs">Start the conversation!</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {chatMessages.map(message => (
                              <div 
                                key={message.id} 
                                className={`flex ${message.user.id === 'current-user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                    message.user.id === 'current-user' 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-gray-700 text-white'
                                  }`}
                                >
                                  {message.user.id !== 'current-user' && (
                                    <div className="text-xs font-medium mb-1 text-blue-300">
                                      {message.user.name}
                                    </div>
                                  )}
                                  <p className="text-sm">{message.text}</p>
                                  <div className="text-[10px] opacity-70 mt-1 text-right">
                                    {message.time}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div ref={chatEndRef} />
                          </div>
                        )}
                      </CardContent>
                      
                      <div className="p-3 border-t border-gray-700">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Type your message..."
                            className="bg-gray-700 border-gray-600"
                            value={newChatMessage}
                            onChange={e => setNewChatMessage(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleSendMessage();
                              }
                            }}
                          />
                          <Button onClick={handleSendMessage}>Send</Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Help dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-4 right-4 rounded-full h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg"
          >
            <HelpCircle size={20} />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Play/Pause</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Space</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Stop</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Esc</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Delete Selected</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Delete</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Undo</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl+Z</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Save Project</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl+S</kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* File upload modal */}
      <FileUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onUpload={handleFileUpload}
        title="Import Audio Files"
        description="Upload audio files to add to your project. Supported formats: .mp3, .wav, .aiff, .m4a"
      />
    </div>
  );
};

export default EnhancedStudio;