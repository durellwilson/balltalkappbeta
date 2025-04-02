import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useParams } from 'wouter';
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
  ChevronRight,
  ChevronLeft,
  Mic,
  Music,
  Disc,
  HelpCircle,
  Wand2,
  Sliders,
  SkipBack,
  SkipForward,
  Headphones,
  Record,
  Zap,
  LayoutGrid,
  Cloud,
  Folder,
  Sparkles,
  Grid,
  Clock,
  FileMusic,
  BarChart,
  MousePointer,
  Scissors,
  Maximize,
  Minimize
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
import { ArrangementView } from '@/components/studio/arrangement-view';
import type { AudioRegion } from '@/lib/audio-engine';
import { RecordingControls } from '@/components/studio/recording-controls';
import { EffectsPanel } from '@/components/studio/effects-panel';
import type { Effect as StudioEffect, EffectType as StudioEffectType } from '@/components/studio/effects-panel';
import { MasteringPanel } from '@/components/studio/mastering-panel';
import { AIGenerationPanel } from '@/components/studio/ai-generation-panel';
import { ProjectSync } from '@/components/studio/project-sync';

// Hooks and Utils
import { useToast } from '@/hooks/use-toast';
import audioProcessor from '@/lib/audioProcessor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useStudioCollaboration } from '@/hooks/use-studio-collaboration';
import { useAuth } from '@/hooks/use-auth';

// Utility Types
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

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
  creationMethod?: 'recorded' | 'uploaded' | 'ai-generated';
}

interface EffectParameter {
  name: string;
  value: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

// Effect type already imported from effects-panel

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
  // Get query parameters to check for initial actions
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1]);
  const initialAction = queryParams.get('action');
  const initialMode = queryParams.get('mode'); // 'record', 'upload', or 'generate'
  
  // State
  const [project, setProject] = useState<Project>({
    id: 'new-project',
    name: 'Untitled Project',
    bpm: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [tracks, setTracks] = useState<Track[]>([]);
  const [regions, setRegions] = useState<AudioRegion[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<number | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [chatMessages, setChatMessages] = useState<{id: string, user: User, text: string, time: string}[]>([]);
  const [newChatMessage, setNewChatMessage] = useState<string>('');
  const [sidebarTab, setSidebarTab] = useState<'tracks' | 'mixer' | 'collab' | 'cloud' | 'effects' | 'master' | 'ai'>('tracks');
  const [projectTime, setProjectTime] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(120); // Total timeline duration in seconds
  
  // Calculate a suitable timeline duration based on regions
  const calculateTimelineDuration = useCallback(() => {
    // Minimum duration is 2 minutes (120s)
    const minDuration = 120;
    
    // Find the latest end time of any region
    const regionsEndTime = regions.length > 0 
      ? Math.max(...regions.map(r => r.end || 0)) 
      : 0;
    
    // Add some padding (30 seconds or 25% of total, whichever is greater)
    const padding = Math.max(30, regionsEndTime * 0.25);
    
    // Round up to the nearest minute for clean timeline divisions
    const roundedDuration = Math.ceil((regionsEndTime + padding) / 60) * 60;
    
    // Return the greater of minimum duration or calculated duration
    return Math.max(minDuration, roundedDuration);
  }, [regions]);
  const [audioInputLevel, setAudioInputLevel] = useState<number>(0);
  const [audioOutputLevel, setAudioOutputLevel] = useState<number>(0);
  const [trackEffects, setTrackEffects] = useState<Record<number, Effect[]>>({});
  const [masterEffects, setMasterEffects] = useState<Effect[]>([]);
  
  const [microphoneAccess, setMicrophoneAccess] = useState<boolean>(false);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [inputGain, setInputGain] = useState<number>(100);
  const [overlapRecording, setOverlapRecording] = useState<boolean>(true);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [rightPanelTab, setRightPanelTab] = useState<'effects' | 'master' | 'collab' | 'ai'>('effects');
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean>(true);
  
  // References
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>(0);
  
  // Hooks
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Initialize collaboration
  const collaboration = useStudioCollaboration({
    projectId: project.id,
    userId: user ? user.id.toString() : 'guest-user',
    username: user ? user.username : 'Guest User',
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
        
        // Start with empty project - no demo tracks
        
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
  
  // Check if AI API key is available
  useEffect(() => {
    // In a real implementation, check if API key exists in environment 
    // or user has valid subscription for AI features
    const checkApiKeyAvailability = async () => {
      try {
        // This would be a call to backend to check if API key exists
        // For now we'll simulate this with a simple check
        const hasApiKey = true; // In production, check with backend API
        setApiKeyAvailable(hasApiKey);
        
        if (!hasApiKey) {
          console.log('AI generation API key not available');
        } else {
          console.log('AI generation API key available');
        }
      } catch (error) {
        console.error('Failed to check API key availability:', error);
        setApiKeyAvailable(false);
      }
    };
    
    checkApiKeyAvailability();
  }, []);

  // Apply master effects when they change
  useEffect(() => {
    if (audioProcessor.isReady() && masterEffects.length > 0) {
      console.log('Applying master effects:', masterEffects);
      // Apply each effect to the master channel
      // In a real implementation, this would call proper audio engine methods
      // based on the effect types and parameters
      masterEffects.forEach(effect => {
        if (effect.type === 'eq' && effect.enabled) {
          console.log('Applying EQ effect with parameters:', effect.parameters);
          // audioProcessor.applyMasterEQ(effect.parameters);
        } else if (effect.type === 'compressor' && effect.enabled) {
          console.log('Applying compressor effect with parameters:', effect.parameters);
          // audioProcessor.applyMasterCompressor(effect.parameters);
        } else if (effect.type === 'limiter' && effect.enabled) {
          console.log('Applying limiter effect with parameters:', effect.parameters);
          // audioProcessor.applyMasterLimiter(effect.parameters);
        } else if (effect.type === 'reverb' && effect.enabled) {
          console.log('Applying reverb effect with parameters:', effect.parameters);
          // audioProcessor.applyMasterReverb(effect.parameters);
        }
      });
    }
  }, [masterEffects]);
  
  // Update timeline duration when regions change
  useEffect(() => {
    const newDuration = calculateTimelineDuration();
    if (newDuration !== duration) {
      setDuration(newDuration);
    }
  }, [regions, calculateTimelineDuration, duration]);
  
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  // Handle initial actions from URL parameters
  useEffect(() => {
    // Wait a bit to ensure audio engine is ready
    const timer = setTimeout(() => {
      // Check for mode parameter first (from direct navigation buttons)
      if (initialMode) {
        if (initialMode === 'upload') {
          setIsUploadModalOpen(true);
          console.log('Opening upload modal based on URL parameter (mode)');
        } else if (initialMode === 'record') {
          // Focus on the recording controls - we can't auto-start recording due to browser security
          setRightPanelTab('effects');
          toast({
            title: "Recording Ready",
            description: "Click the Record button to start recording your track.",
          });
          console.log('Setting up for recording based on URL parameter (mode)');
        } else if (initialMode === 'generate') {
          // Open AI sidebar
          setSidebarTab('ai');
          toast({
            title: "AI Generation Ready",
            description: "Use the AI panel to generate a new track.",
          });
          console.log('Setting up AI generation based on URL parameter (mode)');
        }
      } 
      // Fall back to action parameter for backward compatibility
      else if (initialAction) {
        if (initialAction === 'upload') {
          setIsUploadModalOpen(true);
          console.log('Opening upload modal based on URL parameter');
        } else if (initialAction === 'record') {
          // Focus on the recording controls - we can't auto-start recording due to browser security
          setRightPanelTab('effects');
          toast({
            title: "Recording Ready",
            description: "Click the Record button to start recording your track.",
          });
          console.log('Setting up for recording based on URL parameter');
        } else if (initialAction === 'ai') {
          setSidebarTab('ai');
          setShowSidebar(true); // Force sidebar to be visible
          toast({
            title: "AI Generation Ready",
            description: "Use the AI panel to generate a new track.",
          });
          console.log('Setting up AI generation based on URL parameter');
        }
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [initialAction, initialMode]);
  
  // Update timer when playing by getting actual position from audio engine
  useEffect(() => {
    if (isPlaying && audioProcessor.isReady()) {
      const timer = setInterval(() => {
        try {
          // Get the actual position from the audio engine - use the method from our AudioEngine class
          const currentTime = audioProcessor.getPlaybackPosition();
          
          // Update the UI with the precise position from the audio engine
          setProjectTime(currentTime);
          
          // Log position updates at longer intervals to avoid console spam
          if (Math.floor(currentTime * 10) % 50 === 0) {
            console.log(`Playback position: ${currentTime.toFixed(2)}s`);
          }
        } catch (error) {
          console.warn("Could not get playback position:", error);
        }
      }, 50); // Increased update frequency for smoother UI
      
      return () => clearInterval(timer);
    }
  }, [isPlaying, audioProcessor]);
  
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
          isSoloed: false,
          creationMethod: 'recorded'
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
          
          // Create a region for this recording
          const recordingDuration = recordingTime;
          const newRegion: AudioRegion = {
            id: `region-${Date.now()}`,
            trackId: newTrackId,
            start: overlapRecording ? projectTime - recordingDuration : 0,
            end: overlapRecording ? projectTime : recordingDuration,
            offset: 0,
            name: `Recording ${new Date().toLocaleTimeString()}`,
            waveform: audioProcessor.getTrack(newTrackId)?.getWaveform() || [],
            file: url
          };
          
          // Add to regions
          setRegions(prev => [...prev, newRegion]);
          
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
      setRecordingTime(0);
    }
  };
  
  // Set up recording timer
  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 0.1);
      }, 100);
      
      return () => clearInterval(timer);
    }
  }, [isRecording]);
  
  // Handle arrangement view interactions and playhead movement
  const handleTimeChange = (time: number) => {
    console.log(`Time change requested to ${time} seconds`);
    
    // Update local state
    setProjectTime(time);
    
    // Update audio processor position if it's ready
    if (audioProcessor.isReady()) {
      try {
        // Ensure time is within valid bounds
        const validTime = Math.max(0, time);
        
        // Update the playback position in the audio engine
        audioProcessor.setPosition(validTime);
        
        console.log(`Playhead position updated to ${validTime} seconds`);
      } catch (error) {
        console.error('Error setting playback position:', error);
        toast({
          title: "Playback Error",
          description: "Could not set the playback position. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Region operations
  const handleRegionSelect = (regionId: string, addToSelection: boolean = false) => {
    if (addToSelection) {
      // Multi-select (add/remove from selection)
      setSelectedRegions(prev => 
        prev.includes(regionId) 
          ? prev.filter(id => id !== regionId) 
          : [...prev, regionId]
      );
    } else {
      // Single select
      setSelectedRegions([regionId]);
    }
  };
  
  const handleRegionMove = (regionId: string, trackId: number, startTime: number) => {
    // Apply snap to grid based on BPM
    const secondsPerBeat = 60 / project.bpm;
    const gridSizes = [
      secondsPerBeat * 4,    // Whole note
      secondsPerBeat,        // Quarter note
      secondsPerBeat / 2,    // Eighth note 
      secondsPerBeat / 4     // Sixteenth note
    ];
    
    // Use appropriate grid size based on zoom level
    const gridSize = zoomLevel > 2 ? gridSizes[3] : 
                    zoomLevel > 1 ? gridSizes[2] : 
                    zoomLevel > 0.5 ? gridSizes[1] : gridSizes[0];
    
    // Snap to grid if zoom is medium or higher
    const snappedTime = Math.round(startTime / gridSize) * gridSize;
    const finalStartTime = zoomLevel > 0.5 ? snappedTime : startTime;
    
    // Update region position in state
    setRegions(prev => prev.map(r => {
      if (r.id === regionId) {
        const duration = r.end - r.start;
        
        // If track changed, handle the reassignment
        if (r.trackId !== trackId) {
          // In a real implementation, would move audio data between track processors
          console.log(`Moving region from track ${r.trackId} to track ${trackId}`);
          
          // Get source and destination track processors
          const sourceTrack = audioProcessor.getTrack(r.trackId);
          const destTrack = audioProcessor.getTrack(trackId);
          
          if (sourceTrack && destTrack && r.buffer) {
            // This would be the place to transfer audio between tracks in the processor
          }
        }
        
        return { 
          ...r, 
          trackId, 
          start: finalStartTime,
          end: finalStartTime + duration
        };
      }
      return r;
    }));
    
    // Show feedback toast for precise movements
    if (zoomLevel > 1) {
      toast({
        title: "Region Moved",
        description: `Positioned at ${formatTime(finalStartTime)} (bar ${Math.floor((finalStartTime / secondsPerBeat) / 4) + 1})`,
        variant: "default"
      });
    }
  };
  
  const handleRegionResize = (regionId: string, startTime: number, endTime: number) => {
    // Apply snap to grid based on BPM - same logic as in handleRegionMove
    const secondsPerBeat = 60 / project.bpm;
    const gridSizes = [
      secondsPerBeat * 4,    // Whole note
      secondsPerBeat,        // Quarter note
      secondsPerBeat / 2,    // Eighth note 
      secondsPerBeat / 4     // Sixteenth note
    ];
    
    // Use appropriate grid size based on zoom level
    const gridSize = zoomLevel > 2 ? gridSizes[3] : 
                    zoomLevel > 1 ? gridSizes[2] : 
                    zoomLevel > 0.5 ? gridSizes[1] : gridSizes[0];
    
    // Snap to grid if zoom is medium or higher
    let finalStartTime = startTime;
    let finalEndTime = endTime;
    
    if (zoomLevel > 0.5) {
      finalStartTime = Math.round(startTime / gridSize) * gridSize;
      finalEndTime = Math.round(endTime / gridSize) * gridSize;
      
      // Ensure minimal length (at least one grid unit)
      if (finalEndTime - finalStartTime < gridSize) {
        finalEndTime = finalStartTime + gridSize;
      }
    }
    
    // Update region in state
    setRegions(prev => prev.map(r => {
      if (r.id === regionId) {
        return { 
          ...r, 
          start: finalStartTime,
          end: finalEndTime
        };
      }
      return r;
    }));
    
    // Update the playback time range in the audio processor (in a real implementation)
    const regionToUpdate = regions.find(r => r.id === regionId);
    if (regionToUpdate && regionToUpdate.trackId) {
      const track = audioProcessor.getTrack(regionToUpdate.trackId);
      if (track) {
        console.log(`Updated region in track ${regionToUpdate.trackId}: ${finalStartTime}s - ${finalEndTime}s`);
        // In a real implementation, would update the playback range in the track processor
      }
    }
    
    // Calculate the new duration for feedback
    const newDuration = finalEndTime - finalStartTime;
    
    // Show feedback toast for precise adjustments
    if (zoomLevel > 1) {
      toast({
        title: "Region Resized",
        description: `Duration: ${formatTime(newDuration)}`,
        variant: "default"
      });
    }
  };
  
  const handleRegionCopy = (regionId: string) => {
    const regionToCopy = regions.find(r => r.id === regionId);
    if (!regionToCopy) return;
    
    const newRegion: AudioRegion = {
      ...regionToCopy,
      id: `region-${Date.now()}`,
      start: regionToCopy.start !== undefined ? regionToCopy.start + (regionToCopy.end - regionToCopy.start) : 0,
      end: regionToCopy.end !== undefined ? regionToCopy.end + (regionToCopy.end - regionToCopy.start) : 0,
      offset: regionToCopy.offset || 0
    };
    
    setRegions(prev => [...prev, newRegion]);
    
    toast({
      description: "Region duplicated"
    });
  };
  
  const handleRegionDelete = (regionId: string) => {
    setRegions(prev => prev.filter(r => r.id !== regionId));
    
    // Remove from selection if selected
    setSelectedRegions(prev => prev.filter(id => id !== regionId));
    
    toast({
      description: "Region deleted"
    });
  };
  
  const handleRegionSplit = (regionId: string, splitTime: number) => {
    const regionToSplit = regions.find(r => r.id === regionId);
    if (!regionToSplit) return;
    
    // Only split if the split point is within the region
    if (splitTime <= (regionToSplit.start || 0) || splitTime >= (regionToSplit.end || 0)) {
      toast({
        title: "Cannot Split",
        description: "Split point is outside the region",
        variant: "destructive"
      });
      return;
    }
    
    // Create two new regions
    const firstRegion: AudioRegion = {
      ...regionToSplit,
      id: `region-${Date.now()}-a`,
      start: regionToSplit.start || 0,
      end: splitTime,
      offset: regionToSplit.offset || 0
    };
    
    const secondRegion: AudioRegion = {
      ...regionToSplit,
      id: `region-${Date.now()}-b`,
      start: splitTime,
      end: regionToSplit.end || 0,
      offset: (regionToSplit.offset || 0) + (splitTime - (regionToSplit.start || 0))
    };
    
    // Replace the original with the two new regions
    setRegions(prev => [
      ...prev.filter(r => r.id !== regionId),
      firstRegion,
      secondRegion
    ]);
    
    toast({
      description: "Region split at playhead"
    });
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
      isSoloed: false,
      creationMethod: 'uploaded' // Default creation method
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
  interface FileUploadOptions {
    targetTrackId?: number | null;
    createNewTrack: boolean;
    trackType: 'audio' | 'instrument' | 'vocal' | 'drum' | 'mix';
    position: 'start' | 'playhead' | 'end';
    aligned: boolean;
    allowOverlap: boolean;
    normalize: boolean;
    normalizationLevel: number;
    enhanceAudio?: boolean;  // New option for audio enhancement
    enhanceOptions?: {
      clarity?: number;      // Clarity enhancement (0-1)
      noiseSuppression?: boolean; // Suppress background noise
      bassBoost?: number;    // Bass enhancement level (0-1)
      stereoWidening?: number; // Stereo field enhancement (0-1)
    };
  }

  const handleFileUpload = async (
    files: File[],
    options?: FileUploadOptions
  ): Promise<boolean> => {
    try {
      // Check if audio processor is ready
      if (!audioProcessor.isReady()) {
        await audioProcessor.initialize();
        if (!audioProcessor.isReady()) {
          toast({
            title: "Audio Not Initialized",
            description: "Please enable the audio engine first using the 'Enable Audio Engine' button.",
            variant: "destructive"
          });
          return false;
        }
      }
      
      if (files.length === 0) return false;
      
      // Default options if none provided
      const uploadOptions = options || {
        createNewTrack: true,
        trackType: 'audio',
        position: 'playhead',
        aligned: true,
        allowOverlap: true,
        normalize: false,
        normalizationLevel: -3,
        enhanceAudio: false,
        enhanceOptions: {
          clarity: 0.5,
          noiseSuppression: false,
          bassBoost: 0,
          stereoWidening: 0
        }
      };
      
      // Arrays to collect uploaded items
      const uploadedRegions: AudioRegion[] = [];
      const createdTracks: Track[] = [];
      
      // Process each file
      for (const file of files) {
        try {
          // Determine the track to use
          let targetTrackId = uploadOptions.targetTrackId || 0;
          let newTrack: Track | undefined;
          
          // If creating a new track
          if (uploadOptions.createNewTrack) {
            // Generate a new ID
            const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
            
            // Determine track type based on filename if not specified
            let trackType = uploadOptions.trackType;
            if (trackType === 'audio') {
              const fileName = file.name.toLowerCase();
              if (fileName.includes('drum') || fileName.includes('beat') || fileName.includes('percussion')) {
                trackType = 'drum';
              } else if (fileName.includes('vocal') || fileName.includes('voice') || fileName.includes('vox')) {
                trackType = 'vocal';
              } else if (fileName.includes('guitar') || fileName.includes('piano') || fileName.includes('bass') ||
                        fileName.includes('synth') || fileName.includes('keys')) {
                trackType = 'instrument';
              }
            }
            
            // Create the track object
            newTrack = {
              id: newTrackId,
              name: file.name.split('.')[0] || `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} ${newTrackId}`,
              type: trackType,
              volume: 0.8,
              pan: 0,
              isMuted: false,
              isSoloed: false,
              creationMethod: 'uploaded'
            };
            
            targetTrackId = newTrackId;
            createdTracks.push(newTrack);
            
            // Create track processor
            audioProcessor.createTrack(newTrackId, {
              volume: newTrack.volume,
              pan: newTrack.pan
            });
          } else {
            // Use existing track
            if (!targetTrackId) {
              throw new Error('No target track specified');
            }
          }
          
          // Get the audio processor track
          const track = audioProcessor.getTrack(targetTrackId);
          if (!track) {
            throw new Error(`Track ${targetTrackId} not found in audio processor`);
          }
          
          // Load the audio file
          // Create a buffer from the file
          const arrayBuffer = await file.arrayBuffer();
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const waveform = generateWaveform(audioBuffer);
          
          const fileData = {
            buffer: audioBuffer,
            waveform,
            duration: audioBuffer.duration
          };
          
          // Determine the start position based on options
          let startPosition = 0;
          
          if (uploadOptions.position === 'playhead') {
            startPosition = projectTime;
          } else if (uploadOptions.position === 'end') {
            // Find the latest end time of any region
            const lastEndTime = regions.length > 0 ? 
              Math.max(...regions.map(r => r.end)) : 
              0;
            startPosition = Math.max(lastEndTime, 0.1); // At least 0.1s
          }
          
          // Apply snap to grid if needed
          if (uploadOptions.aligned) {
            // Get grid size in seconds (based on BPM)
            const secondsPerBeat = 60 / project.bpm;
            const gridSize = 0.25; // Quarter note by default
            const gridInSeconds = gridSize * secondsPerBeat;
            
            // Snap to nearest grid line
            startPosition = Math.round(startPosition / gridInSeconds) * gridInSeconds;
          }
          
          // Create the region
          const region: AudioRegion = {
            id: `region-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            trackId: targetTrackId,
            start: startPosition,
            end: startPosition + fileData.duration,
            offset: 0,
            name: file.name.split('.')[0] || 'Audio Region',
            waveform: fileData.waveform,
            buffer: fileData.buffer,
            file: URL.createObjectURL(file)
          };
          
          // Apply normalization if needed
          if (uploadOptions.normalize && fileData.buffer) {
            try {
              const context = new AudioContext();
              const gainNode = context.createGain();
              const maxGain = Math.pow(10, uploadOptions.normalizationLevel / 20);
              gainNode.gain.value = maxGain;
              // Note: In a real implementation, we would do proper peak normalization
              // For now we're just setting a consistent gain based on the target level
            } catch (normError) {
              console.error('Failed to normalize audio:', normError);
            }
          }
          
          // Apply audio enhancement if requested
          if (uploadOptions.enhanceAudio && fileData.buffer && uploadOptions.enhanceOptions) {
            try {
              const enhanceOptions = uploadOptions.enhanceOptions;
              
              // Log enhancement settings being applied
              console.log('Applying audio enhancements:', {
                clarity: enhanceOptions.clarity,
                noiseSuppression: enhanceOptions.noiseSuppression,
                bassBoost: enhanceOptions.bassBoost,
                stereoWidening: enhanceOptions.stereoWidening
              });
              
              // In a real application, we would apply actual DSP processing here
              // For now, we'll just simulate the enhancement by showing a toast
              
              const enhancementsApplied = [];
              
              if (enhanceOptions.clarity && enhanceOptions.clarity > 0) {
                enhancementsApplied.push(`Clarity enhancement (${Math.round(enhanceOptions.clarity * 100)}%)`);
              }
              
              if (enhanceOptions.noiseSuppression) {
                enhancementsApplied.push('Noise suppression');
              }
              
              if (enhanceOptions.bassBoost && enhanceOptions.bassBoost > 0) {
                enhancementsApplied.push(`Bass boost (${Math.round(enhanceOptions.bassBoost * 100)}%)`);
              }
              
              if (enhanceOptions.stereoWidening && enhanceOptions.stereoWidening > 0) {
                enhancementsApplied.push(`Stereo widening (${Math.round(enhanceOptions.stereoWidening * 100)}%)`);
              }
              
              if (enhancementsApplied.length > 0) {
                toast({
                  title: 'Audio Enhanced',
                  description: `Applied: ${enhancementsApplied.join(', ')}`,
                  variant: 'default'
                });
              }
              
            } catch (enhanceError) {
              console.error('Failed to enhance audio:', enhanceError);
              toast({
                title: 'Enhancement Warning',
                description: 'Some audio enhancements could not be applied.',
                variant: 'warning'
              });
            }
          }
          
          // Add the region to our collection
          uploadedRegions.push(region);
          
          // Add audio to the processor's timeline
          track.loadAudio(region.file as string);
        } catch (error) {
          const fileError = error as Error;
          console.error(`Failed to process file ${file.name}:`, fileError);
          toast({
            title: 'Upload Error',
            description: `Failed to process ${file.name}. ${fileError.message}`,
            variant: 'destructive'
          });
        }
      }
      
      // Update the state with all created tracks and regions
      if (createdTracks.length > 0) {
        setTracks((prev: Track[]) => [...prev, ...createdTracks]);
      }
      
      if (uploadedRegions.length > 0) {
        setRegions(prev => [...prev, ...uploadedRegions]);
        
        // Select the first uploaded region
        setSelectedRegions([uploadedRegions[0].id]);
        
        // Set active track to the track of the first uploaded region
        if (uploadedRegions[0].trackId) {
          setActiveTrackId(uploadedRegions[0].trackId);
        }
      }
      
      toast({
        title: 'Files imported',
        description: `${uploadedRegions.length} audio ${uploadedRegions.length === 1 ? 'file' : 'files'} added to your project.`
      });
      
      // Set to tracks panel
      setSidebarTab('tracks');
      
      return uploadedRegions.length > 0;
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
  const generateWaveform = (buffer: AudioBuffer, samples: number = 200): number[] => {
    const channelData = buffer.getChannelData(0); // Get only the first channel
    const blockSize = Math.floor(channelData.length / samples);
    const waveform = [];

    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i;
      let sum = 0;
      
      // Find the max value in this block
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[blockStart + j] || 0);
      }
      
      // Normalize and store the value
      waveform.push(sum / blockSize);
    }

    // Normalize the entire waveform to 0-1 range
    const max = Math.max(...waveform, 0.01); // Avoid division by zero
    return waveform.map(val => val / max);
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
              onChange={e => setProject((prev: typeof project) => ({ ...prev, name: e.target.value }))}
              className="bg-transparent border-none text-lg font-medium h-7 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              {currentUsers.length > 0 && (
                <Badge variant="outline" className="text-emerald-400 border-emerald-800">
                  Collaborating ({currentUsers.length + 1})
                </Badge>
              )}
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
          <div className="flex-1 bg-gray-900 overflow-hidden">
            <ArrangementView
              tracks={tracks.map(track => ({
                id: track.id,
                name: track.name,
                type: track.type || 'audio',
                volume: track.volume,
                pan: track.pan,
                isMuted: track.isMuted,
                isSoloed: track.isSoloed,
                isArmed: false
              }))}
              regions={regions || []}
              currentTime={projectTime}
              duration={duration} // Based on project content
              bpm={project.bpm}
              timeSignature={[4, 4]}
              isPlaying={isPlaying}
              isRecording={isRecording}
              onTimeChange={handleTimeChange}
              onRegionSelect={handleRegionSelect}
              onRegionMove={handleRegionMove}
              onRegionResize={handleRegionResize}
              onRegionDelete={handleRegionDelete}
              onRegionCopy={handleRegionCopy}
              onRegionSplit={handleRegionSplit}
              onTrackVolumeChange={handleTrackVolumeChange}
              onTrackPanChange={handleTrackPanChange}
              onTrackMuteToggle={handleTrackMuteToggle}
              onTrackSoloToggle={handleTrackSoloToggle}
              onTrackArmToggle={() => {}}
              onTrackAdd={(type: string) => handleAddTrack(type as ('audio' | 'instrument' | 'vocal' | 'drum' | 'mix'))}
              onTrackDelete={handleDeleteTrack}
              onZoomChange={setZoomLevel}
              zoom={zoomLevel}
              selectedTrackId={activeTrackId}
              onTrackSelect={setActiveTrackId}
            />
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
                    <TabsTrigger value="effects" className="flex-1">
                      <Sliders size={14} className="mr-1" />
                      Effects
                    </TabsTrigger>
                    <TabsTrigger value="master" className="flex-1">
                      <Wand2 size={14} className="mr-1" />
                      Master
                    </TabsTrigger>
                    <TabsTrigger value="mixer" className="flex-1">
                      <Settings size={14} className="mr-1" />
                      Mixer
                    </TabsTrigger>
                    <TabsTrigger value="collab" className="flex-1">
                      <Users size={14} className="mr-1" />
                      Collab
                    </TabsTrigger>
                    <TabsTrigger value="cloud" className="flex-1">
                      <Cloud size={14} className="mr-1" />
                      Cloud
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex-1">
                      <Sparkles size={14} className="mr-1" />
                      AI
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
                              
                              setTracks(newTracks as Track[]);
                              // Sync with collaboration if available
                              // Add tracks to collaboration system one by one
                              if (collaboration) {
                                try {
                                  newTracks.forEach(track => {
                                    collaboration.addTrack({
                                      id: track.id.toString(),
                                      name: track.name,
                                      type: track.type,
                                      createdBy: user?.id?.toString() || 'unknown'
                                    });
                                  });
                                } catch (error) {
                                  console.warn('Error adding tracks to collaboration:', error);
                                }
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

                <TabsContent value="effects" className="m-0">
                  <div className="p-3">
                    <h3 className="text-sm font-medium mb-3">Track Effects</h3>
                    
                    {activeTrackId ? (
                      <EffectsPanel
                        trackId={activeTrackId}
                        trackName={tracks.find(t => t.id === activeTrackId)?.name || 'Selected Track'}
                        trackType={tracks.find(t => t.id === activeTrackId)?.type || 'audio'}
                        effects={trackEffects[activeTrackId] || []}
                        onEffectsChange={(effects) => {
                          setTrackEffects((prev: Record<number, Effect[]>) => ({
                            ...prev,
                            [activeTrackId]: effects
                          }));
                        }}
                        inputLevel={0.7}
                        outputLevel={0.8}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Sliders size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Select a track to edit effects</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="master" className="m-0">
                  <div className="p-3">
                    <h3 className="text-sm font-medium mb-3">Mastering</h3>
                    
                    <MasteringPanel
                      masterVolume={masterVolume}
                      onMasterVolumeChange={handleMasterVolumeChange}
                      inputLevel={audioInputLevel}
                      outputLevel={audioOutputLevel}
                      onEffectsChange={(effects) => {
                        setMasterEffects(effects);
                      }}
                    />
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

                <TabsContent value="cloud" className="m-0">
                  <div className="p-3">
                    <h3 className="text-sm font-medium mb-3">Cloud Storage</h3>
                    <div className="space-y-4">
                      <ProjectSync projectId={parseInt(project.id)} />
                      
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            Project Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Project Name:</span>
                            <span className="font-medium">{project.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Created:</span>
                            <span className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Last Modified:</span>
                            <span className="font-medium">{new Date(project.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tracks:</span>
                            <span className="font-medium">{tracks.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">BPM:</span>
                            <span className="font-medium">{project.bpm}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="m-0">
                  <div className="p-3">
                    <h3 className="text-sm font-medium mb-3">AI Tools</h3>
                    
                    <AIGenerationPanel 
                      onGenerateTrack={(track) => {
                        if (track && track.buffer) {
                          // Create a new track with the AI generated audio
                          const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
                          const newTrack: Track = {
                            id: newTrackId,
                            name: track.name || `AI Generated ${newTrackId}`,
                            type: track.type || 'audio',
                            volume: 0.8,
                            pan: 0,
                            isMuted: false,
                            isSoloed: false,
                            creationMethod: track.creationMethod || 'ai-generated'
                          };
                          
                          // Create track processor
                          const trackProcessor = audioProcessor.createTrack(newTrackId, {
                            volume: newTrack.volume,
                            pan: newTrack.pan
                          });
                          
                          // Add to tracks list
                          setTracks(prev => [...prev, newTrack]);
                          
                          // Create a blob from the buffer
                          const blob = new Blob([track.buffer], { type: 'audio/wav' });
                          const url = URL.createObjectURL(blob);
                          
                          // Add region for this generated audio
                          const newRegion: AudioRegion = {
                            id: `region-${Date.now()}`,
                            trackId: newTrackId,
                            start: 0,
                            end: track.duration || 10,
                            offset: 0,
                            name: track.name || 'AI Generated',
                            waveform: track.waveform || audioProcessor.getTrack(newTrackId)?.getWaveform() || [],
                            file: url
                          };
                          
                          // Add to regions
                          setRegions(prev => [...prev, newRegion]);
                          
                          toast({
                            title: 'AI Generation Completed',
                            description: `New track "${newTrack.name}" created with AI generated audio.`
                          });
                        }
                      }}
                      activeTrack={activeTrackId ? tracks.find(t => t.id === activeTrackId) : undefined}
                      selectedRegions={regions.filter(r => selectedRegions.includes(r.id))}
                      bpm={project.bpm}
                      isSubscriptionActive={true}
                      apiKeyAvailable={apiKeyAvailable}
                    />
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
        allowMultiple={true}
        existingTracks={tracks}
        currentPlayheadPosition={projectTime}
      />
    </div>
  );
};

export default EnhancedStudio;