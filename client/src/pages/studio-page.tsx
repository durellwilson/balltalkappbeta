import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic,
  Play,
  Pause,
  Square,
  Save,
  Upload,
  Plus,
  Music,
  Download,
  Settings,
  Sliders,
  Volume2,
  VolumeX,
  X,
  SkipBack,
  SkipForward,
  Clock,
  Share2,
  Users,
  Music2,
  HelpCircle,
  Info,
  LayoutGrid,
  Cloud,
  Layers,
  Scissors,
  Copy,
  Trash2,
  FileText,
  Maximize2,
  Zap,
  MessageSquare,
  Bookmark,
  PenTool,
  AlignLeft,
  Award,
  Heart,
  BarChart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Type definitions
interface Track {
  id: number;
  name: string;
  audioUrl?: string;
  waveformData?: number[];
  volume: number;
  pan: number;
  isMuted: boolean;
  isSoloed: boolean;
  effects: Effect[];
  color: string;
  type: 'audio' | 'midi' | 'vocal';
  recordingDate?: Date;
}

interface Effect {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  parameters: {
    [key: string]: number | boolean | string;
  };
}

interface Project {
  id: number;
  title: string;
  description?: string;
  bpm: number;
  key: string;
  timeSignature: string;
  genres: string[];
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
  collaborators?: User[];
  isPublic: boolean;
  thumbnail?: string;
}

interface User {
  id: number;
  username: string;
  profileImage?: string;
  role: string;
}

// Available audio effect types
const effectTypes = [
  { id: 'eq', name: 'Equalizer', icon: <Sliders className="h-4 w-4" /> },
  { id: 'compressor', name: 'Compressor', icon: <Heart className="h-4 w-4" /> },
  { id: 'reverb', name: 'Reverb', icon: <Music2 className="h-4 w-4" /> },
  { id: 'delay', name: 'Delay', icon: <Cloud className="h-4 w-4" /> },
  { id: 'autotune', name: 'AutoPitch™', icon: <Zap className="h-4 w-4" /> },
  { id: 'limiter', name: 'Limiter', icon: <BarChart className="h-4 w-4" /> }
];

// Track color options
const trackColors = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-pink-600', 
  'bg-red-600',
  'bg-amber-600',
  'bg-green-600',
  'bg-emerald-600',
  'bg-teal-600',
  'bg-indigo-600'
];

// Generate waveform data (placeholder until we have real audio)
const generateWaveform = () => {
  return Array.from({ length: 100 }, () => Math.random() * 100);
};

// Date formatting helper
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

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

export default function StudioPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  
  // Studio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [showNewTrackDialog, setShowNewTrackDialog] = useState(false);
  const [showEffectsDialog, setShowEffectsDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCollaborationDialog, setShowCollaborationDialog] = useState(false);
  const [activeEffectType, setActiveEffectType] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackType, setNewTrackType] = useState<'audio' | 'vocal' | 'midi'>('vocal');

  // References
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingInterval = useRef<any>(null);
  const playbackInterval = useRef<any>(null);
  
  // Fetch project data if we have a projectId
  const projectId = params.projectId ? parseInt(params.projectId) : null;
  
  const { isLoading: projectLoading } = useQuery({
    queryKey: ['/api/studio/projects', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      try {
        const response = await fetch(`/api/studio/projects/${projectId}`);
        if (!response.ok) throw new Error('Project not found');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch project:", error);
        toast({
          title: "Error",
          description: "Could not load project. It may have been deleted or you don't have access.",
          variant: "destructive"
        });
        return null;
      }
    },
    enabled: !!projectId,
    onSuccess: (data) => {
      if (data) setCurrentProject(data);
    }
  });
  
  // Initialize a new project if none exists
  useEffect(() => {
    if (!projectId && !currentProject) {
      // Create a new project instance
      const newProject: Project = {
        id: Date.now(),
        title: 'Untitled Project',
        bpm: 90,
        key: 'C Major',
        timeSignature: '4/4',
        genres: ['Hip Hop'],
        tracks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false
      };
      setCurrentProject(newProject);
    }
  }, [projectId, currentProject]);
  
  // Initialize Audio context
  useEffect(() => {
    const initializeAudio = () => {
      const ctx = getAudioContext();
      if (ctx) {
        setAudioContext(ctx);
        return true;
      }
      return false;
    };
    
    initializeAudio();
    
    // Cleanup function
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      if (playbackInterval.current) clearInterval(playbackInterval.current);
      
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Handle track selection
  const selectedTrack = useMemo(() => {
    if (!currentProject || !selectedTrackId) return null;
    return currentProject.tracks.find(track => track.id === selectedTrackId) || null;
  }, [currentProject, selectedTrackId]);
  
  // Project Save/Update
  const saveProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
      try {
        const endpoint = project.id ? `/api/studio/projects/${project.id}` : '/api/studio/projects';
        const method = project.id ? 'PUT' : 'POST';
        
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(project)
        });
        
        if (!response.ok) throw new Error('Failed to save project');
        
        return await response.json();
      } catch (error) {
        console.error("Error saving project:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Update the current project with the saved data
      setCurrentProject(data);
      queryClient.invalidateQueries({ queryKey: ['/api/studio/projects'] });
      
      toast({
        title: "Success",
        description: "Project saved successfully",
      });
      
      // If this is a new project, navigate to the project URL
      if (!projectId && data.id) {
        navigate(`/studio/${data.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Save project function
  const saveProject = () => {
    if (!currentProject) return;
    
    // Update the project's updatedAt timestamp
    const projectToSave = {
      ...currentProject,
      updatedAt: new Date()
    };
    
    saveProjectMutation.mutate(projectToSave);
  };
  
  // Create a new track in the project
  const addTrack = (trackData: Partial<Track>) => {
    if (!currentProject) return;
    
    const newTrack: Track = {
      id: Date.now(),
      name: trackData.name || `Track ${currentProject.tracks.length + 1}`,
      volume: 100,
      pan: 0,
      isMuted: false,
      isSoloed: false,
      effects: [],
      color: trackColors[Math.floor(Math.random() * trackColors.length)],
      type: trackData.type || 'audio',
      audioUrl: trackData.audioUrl,
      waveformData: trackData.waveformData || generateWaveform(),
      recordingDate: new Date()
    };
    
    setCurrentProject({
      ...currentProject,
      tracks: [...currentProject.tracks, newTrack]
    });
    
    // Select the new track
    setSelectedTrackId(newTrack.id);
    
    return newTrack;
  };
  
  // Remove a track from the project
  const removeTrack = (trackId: number) => {
    if (!currentProject) return;
    
    const updatedTracks = currentProject.tracks.filter(track => track.id !== trackId);
    
    setCurrentProject({
      ...currentProject,
      tracks: updatedTracks
    });
    
    // If the deleted track was selected, deselect it
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }
  };
  
  // Update a track's properties
  const updateTrack = (trackId: number, updates: Partial<Track>) => {
    if (!currentProject) return;
    
    const updatedTracks = currentProject.tracks.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    );
    
    setCurrentProject({
      ...currentProject,
      tracks: updatedTracks
    });
  };
  
  // Add an effect to a track
  const addEffect = (trackId: number, effectType: string) => {
    if (!currentProject) return;
    
    const track = currentProject.tracks.find(t => t.id === trackId);
    if (!track) return;
    
    let parameters: any = {};
    
    // Set default parameters based on effect type
    switch (effectType) {
      case 'eq':
        parameters = {
          lowGain: 0,
          midGain: 0,
          highGain: 0,
          lowFreq: 200,
          highFreq: 5000
        };
        break;
      case 'compressor':
        parameters = {
          threshold: -24,
          ratio: 4,
          attack: 0.003,
          release: 0.25,
          makeup: 0
        };
        break;
      case 'reverb':
        parameters = {
          decay: 2,
          preDelay: 0.01,
          wet: 30,
          dry: 70
        };
        break;
      case 'delay':
        parameters = {
          time: 0.25,
          feedback: 30,
          wet: 30
        };
        break;
      case 'autotune':
        parameters = {
          amount: 50,
          key: 'C',
          formant: 0,
          speed: 50
        };
        break;
      case 'limiter':
        parameters = {
          threshold: -0.5,
          release: 0.1
        };
        break;
    }
    
    const newEffect: Effect = {
      id: Date.now(),
      name: effectTypes.find(e => e.id === effectType)?.name || 'Effect',
      type: effectType,
      isActive: true,
      parameters
    };
    
    const updatedTrack = {
      ...track,
      effects: [...track.effects, newEffect]
    };
    
    updateTrack(trackId, updatedTrack);
    
    return newEffect;
  };
  
  // Update an effect's parameters
  const updateEffect = (trackId: number, effectId: number, updates: Partial<Effect>) => {
    if (!currentProject) return;
    
    const track = currentProject.tracks.find(t => t.id === trackId);
    if (!track) return;
    
    const updatedEffects = track.effects.map(effect => 
      effect.id === effectId ? { ...effect, ...updates } : effect
    );
    
    updateTrack(trackId, { effects: updatedEffects });
  };
  
  // Remove an effect from a track
  const removeEffect = (trackId: number, effectId: number) => {
    if (!currentProject) return;
    
    const track = currentProject.tracks.find(t => t.id === trackId);
    if (!track) return;
    
    const updatedEffects = track.effects.filter(effect => effect.id !== effectId);
    
    updateTrack(trackId, { effects: updatedEffects });
  };
  
  // Toggle mute on a track
  const toggleMute = (trackId: number) => {
    if (!currentProject) return;
    
    const track = currentProject.tracks.find(t => t.id === trackId);
    if (!track) return;
    
    updateTrack(trackId, { isMuted: !track.isMuted });
  };
  
  // Toggle solo on a track
  const toggleSolo = (trackId: number) => {
    if (!currentProject) return;
    
    const track = currentProject.tracks.find(t => t.id === trackId);
    if (!track) return;
    
    updateTrack(trackId, { isSoloed: !track.isSoloed });
  };
  
  // Change track's volume
  const changeVolume = (trackId: number, volume: number) => {
    updateTrack(trackId, { volume });
  };
  
  // Change track's pan
  const changePan = (trackId: number, pan: number) => {
    updateTrack(trackId, { pan });
  };
  
  // Start/Stop recording functionality
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
      
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Add a new track with the recorded audio
        const newTrack = addTrack({
          name: newTrackName || `Recording ${new Date().toLocaleTimeString()}`,
          type: 'vocal',
          audioUrl: audioUrl,
          waveformData: generateWaveform() // In a real implementation, we'd analyze the audio to generate waveform data
        });
        
        // Add AutoPitch as a default effect for vocal tracks
        if (newTrack) {
          addEffect(newTrack.id, 'autotune');
        }
        
        audioChunks.current = [];
        setShowNewTrackDialog(false);
      };
      
      // Start recording
      mediaRecorder.current.start();
      setIsRecording(true);
      
      // Update recording time display
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      // Clear the recording timer
      clearInterval(recordingInterval.current);
      setRecordingTime(0);
      
      // Stop all tracks to release the microphone
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  // Playback controls
  const togglePlayback = () => {
    if (isPlaying) {
      // Stop playback
      clearInterval(playbackInterval.current);
      setIsPlaying(false);
    } else {
      // Start playback
      setIsPlaying(true);
      playbackInterval.current = setInterval(() => {
        setPlaybackPosition(prev => {
          // Simulate 30-second loop
          if (prev >= 30) return 0;
          return prev + 0.1;
        });
      }, 100);
    }
  };
  
  const stopPlayback = () => {
    if (isPlaying) {
      clearInterval(playbackInterval.current);
      setIsPlaying(false);
      setPlaybackPosition(0);
    }
  };
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle export options
  const handleExport = (format: string) => {
    // In a real implementation, this would process the audio and generate a file
    toast({
      title: "Export Started",
      description: `Exporting project as ${format.toUpperCase()}...`
    });
    
    // Simulate export process
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Your project has been exported as ${format.toUpperCase()}.`
      });
      setShowExportDialog(false);
    }, 1500);
  };
  
  const handleInviteCollaborator = (email: string) => {
    // In a real implementation, this would send an invitation
    toast({
      title: "Invitation Sent",
      description: `Collaboration invitation sent to ${email}`
    });
    setShowCollaborationDialog(false);
  };
  
  // Create a demo track
  const createDemoTrack = () => {
    // Generate a demo track with some effects
    const demoTrack = addTrack({
      name: "Demo Beat",
      type: "audio",
      waveformData: generateWaveform()
    });
    
    if (demoTrack) {
      // Add some effects to the demo track
      addEffect(demoTrack.id, 'compressor');
      addEffect(demoTrack.id, 'eq');
    }
    
    toast({
      title: "Demo Track Added",
      description: "A demo track has been added to your project."
    });
  };
  
  // Loading state
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-zinc-700 opacity-20"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin"></div>
          </div>
          <p className="mt-4 text-zinc-400">Loading studio...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800 py-3 px-4 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-2">
              <X className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
            <div className="flex items-center gap-2">
              {currentProject?.thumbnail ? (
                <div className="w-8 h-8 bg-zinc-800 rounded-md overflow-hidden mr-2">
                  <img src={currentProject.thumbnail} alt="Project" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-zinc-800 rounded-md flex items-center justify-center mr-2">
                  <Music className="h-4 w-4 text-zinc-500" />
                </div>
              )}
              <Input
                value={currentProject?.title || ''}
                onChange={e => setCurrentProject(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="max-w-[200px] bg-transparent border-none focus-visible:ring-0 font-bold text-lg px-0"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Clock className="h-4 w-4 mr-1" />
              {currentProject && <span className="text-xs text-zinc-400">Updated {formatDate(new Date(currentProject.updatedAt))}</span>}
            </Button>
            
            <Button variant="secondary" size="sm" className="hidden sm:flex" onClick={() => setShowCollaborationDialog(true)}>
              <Users className="h-4 w-4 mr-1" />
              Collaborate
            </Button>
            
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={saveProject} disabled={saveProjectMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {saveProjectMutation.isPending ? "Saving..." : "Save"}
            </Button>
            
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setShowExportDialog(true)}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            
            <Button size="sm" onClick={() => {
              saveProject();
              toast({
                title: "Project Published",
                description: "Your project is now live and available to your followers."
              });
            }}>
              <Upload className="h-4 w-4 mr-1" />
              Publish
            </Button>
          </div>
        </div>
      </header>
      
      {/* Transport Controls */}
      <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border-b border-zinc-800 py-2 px-4 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setPlaybackPosition(0)}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to Start</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button 
              size="sm" 
              className={isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"} 
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isPlaying ? "Stop" : "Play"}
            </Button>
            
            <Button variant="ghost" size="icon" disabled={true}>
              <SkipForward className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center ml-4 space-x-3">
              <div className="text-sm font-mono">{formatTime(playbackPosition)}</div>
              <div className="h-7 w-32 md:w-64 lg:w-96 bg-zinc-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-primary/50" 
                  style={{ width: `${(playbackPosition / 30) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm font-mono text-zinc-400">0:30</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-xs">
                <span className="font-mono">4/4</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                <span className="font-mono">{currentProject?.bpm || 90} BPM</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-xs hidden md:flex">
                <span className="font-mono">{currentProject?.key || 'C Major'}</span>
              </Button>
            </div>
            
            <div className="w-px h-6 bg-zinc-800"></div>
            
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Sliders className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Tracks Panel */}
        <div className="w-full md:w-64 lg:w-80 xl:w-96 bg-zinc-950 p-4 border-r border-zinc-800/50 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Tracks</h2>
            <Dialog open={showNewTrackDialog} onOpenChange={setShowNewTrackDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Track
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <DialogTitle>Add New Track</DialogTitle>
                  <DialogDescription>
                    Create a new track for your project.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Track Name</Label>
                    <Input
                      placeholder="My Awesome Track"
                      value={newTrackName}
                      onChange={e => setNewTrackName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Track Type</Label>
                    <Select 
                      value={newTrackType} 
                      onValueChange={(value: 'audio' | 'vocal' | 'midi') => setNewTrackType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select track type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vocal">Vocal Track (with AutoPitch™)</SelectItem>
                        <SelectItem value="audio">Audio Track</SelectItem>
                        <SelectItem value="midi">MIDI Instrument</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Add Method</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        className="justify-start" 
                        onClick={() => {
                          const newTrack = addTrack({
                            name: newTrackName || 'Audio Track',
                            type: newTrackType,
                            waveformData: generateWaveform()
                          });
                          
                          // Add default effect based on track type
                          if (newTrack && newTrack.type === 'vocal') {
                            addEffect(newTrack.id, 'autotune');
                          }
                          
                          setShowNewTrackDialog(false);
                        }}
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Empty Track
                      </Button>
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        disabled={newTrackType !== 'vocal'} 
                        onClick={() => {
                          if (newTrackType === 'vocal') {
                            // Show recording interface
                            setIsRecording(false);
                            setRecordingTime(0);
                          }
                        }}
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Record Voice
                      </Button>
                    </div>
                  </div>
                  
                  {isRecording ? (
                    <div className="mt-6">
                      <div className="flex items-center justify-center py-6">
                        <div className="flex flex-col items-center">
                          <div className="h-20 w-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-3 animate-pulse">
                            <Mic className="h-10 w-10 text-red-500" />
                          </div>
                          <div className="text-2xl font-mono mb-4">{formatTime(recordingTime)}</div>
                          <Button onClick={stopRecording} variant="destructive" size="lg">
                            <Square className="h-4 w-4 mr-2" />
                            Stop Recording
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : newTrackType === 'vocal' && (
                    <div className="mt-4">
                      <Button 
                        onClick={startRecording} 
                        className="w-full bg-red-500 hover:bg-red-600 h-10"
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewTrackDialog(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <ScrollArea className="h-[calc(100vh-250px)] pr-4">
            {currentProject && currentProject.tracks.length > 0 ? (
              <div className="space-y-3">
                {currentProject.tracks.map(track => (
                  <div
                    key={track.id}
                    className={`rounded-lg overflow-hidden border transition-all ${
                      selectedTrackId === track.id 
                        ? 'border-primary/50 bg-primary/10' 
                        : 'border-zinc-800/50 bg-zinc-900/50 hover:bg-zinc-900'
                    }`}
                    onClick={() => setSelectedTrackId(track.id)}
                  >
                    <div className="flex items-center px-3 py-2">
                      <div className={`w-1 self-stretch ${track.color} rounded-full mr-2`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate max-w-[140px]">{track.name}</h3>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSolo(track.id);
                              }}
                            >
                              <Badge variant={track.isSoloed ? "default" : "outline"} className="text-[10px] h-5 px-1">
                                S
                              </Badge>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMute(track.id);
                              }}
                            >
                              {track.isMuted ? (
                                <VolumeX className="h-3 w-3" />
                              ) : (
                                <Volume2 className="h-3 w-3" />
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="19" cy="12" r="1"></circle>
                                    <circle cx="5" cy="12" r="1"></circle>
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setShowEffectsDialog(true);
                                  setSelectedTrackId(track.id);
                                }}>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Effects & Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  removeTrack(track.id);
                                }}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Track
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div>
                          <div className="relative h-8 bg-black/20 rounded overflow-hidden mb-1">
                            {track.waveformData && (
                              <div className="absolute inset-0 flex items-center justify-between px-1">
                                {track.waveformData.map((value, i) => (
                                  <div
                                    key={i}
                                    className={`w-px ${track.isMuted ? 'bg-zinc-700/50' : 'bg-white/70'}`}
                                    style={{ 
                                      height: `${Math.max(5, (value / 100) * 70)}%`,
                                      opacity: track.isMuted ? 0.5 : ((value / 100) * 0.8 + 0.2)
                                    }}
                                  ></div>
                                ))}
                              </div>
                            )}
                            <div 
                              className="absolute left-0 top-0 bottom-0 bg-primary/20"
                              style={{ width: `${(playbackPosition / 30) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Volume2 className="h-3 w-3 text-zinc-500" />
                            <Slider
                              value={[track.volume]}
                              max={100}
                              step={1}
                              className="h-1"
                              onValueChange={(value) => {
                                changeVolume(track.id, value[0]);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={track.isMuted}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {track.effects.length > 0 && (
                      <div className="bg-black/20 px-3 py-1.5 border-t border-zinc-800/50">
                        <div className="flex flex-wrap gap-1">
                          {track.effects.map(effect => (
                            <Badge 
                              key={effect.id} 
                              variant={effect.isActive ? "secondary" : "outline"}
                              className="text-[10px] cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateEffect(track.id, effect.id, { isActive: !effect.isActive });
                              }}
                            >
                              {effect.name}
                            </Badge>
                          ))}
                          <Badge 
                            variant="outline" 
                            className="text-[10px] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEffectsDialog(true);
                              setSelectedTrackId(track.id);
                            }}
                          >
                            <Plus className="h-2 w-2 mr-1" />
                            Add
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <Music className="h-12 w-12 text-zinc-700 mb-3" />
                <h3 className="text-lg font-medium mb-2">No Tracks Yet</h3>
                <p className="text-zinc-500 text-sm max-w-[250px] mb-6">
                  Add tracks to your project to start creating music.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setShowNewTrackDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Track
                  </Button>
                  <Button variant="outline" onClick={createDemoTrack}>
                    <Music className="h-4 w-4 mr-1" />
                    Add Demo
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
          
          {/* Master volume */}
          <div className="mt-4 border-t border-zinc-800/50 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Master Volume</h3>
              <Badge variant="secondary" className="text-xs">Master</Badge>
            </div>
            <div className="rounded-lg bg-zinc-900/50 p-3 border border-zinc-800/50">
              <div className="flex items-center space-x-2 mb-2">
                <Volume2 className="h-4 w-4 text-zinc-500" />
                <Slider
                  defaultValue={[100]}
                  max={100}
                  step={1}
                  className="h-2"
                />
              </div>
              <div className="w-full h-8 bg-black/20 rounded overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-green-500 to-yellow-500 opacity-40"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="editor" className="flex-1 flex flex-col">
            <div className="bg-zinc-900 border-b border-zinc-800 px-4">
              <TabsList className="h-12 bg-transparent border-b border-transparent">
                <TabsTrigger value="editor" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                  Editor
                </TabsTrigger>
                <TabsTrigger value="mixer" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                  Mixer
                </TabsTrigger>
                <TabsTrigger value="mastering" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                  Mastering
                </TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                  Notes
                </TabsTrigger>
                <TabsTrigger value="chat" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                  Collaboration
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="editor" className="flex-1 p-0 overflow-hidden flex flex-col">
              {!selectedTrack ? (
                <div className="flex-1 flex items-center justify-center bg-grid-zinc-950/[0.03] bg-zinc-950">
                  <div className="text-center max-w-md p-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 mb-4">
                      <Music2 className="h-8 w-8 text-zinc-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Track Editor</h2>
                    <p className="text-zinc-400 mb-6">
                      Select a track from the sidebar to edit its contents, or add a new track to get started.
                    </p>
                    <Button onClick={() => setShowNewTrackDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Track
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col md:flex-row">
                  <div className="flex-1 overflow-auto bg-zinc-950 p-6">
                    <div className="h-full flex flex-col">
                      <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-8 ${selectedTrack.color} rounded-full mr-3`}></div>
                          <div>
                            <h2 className="text-xl font-bold">{selectedTrack.name}</h2>
                            <div className="flex items-center mt-1">
                              <Badge variant="secondary" className="mr-2">{selectedTrack.type}</Badge>
                              {selectedTrack.effects.length > 0 && (
                                <span className="text-xs text-zinc-500">{selectedTrack.effects.length} effects active</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setShowEffectsDialog(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Effects
                          </Button>
                          {selectedTrack.type === 'vocal' && (
                            <Button size="sm" className="bg-primary hover:bg-primary/90">
                              <Zap className="h-4 w-4 mr-2" />
                              AutoPitch™
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Advanced Waveform Editor */}
                      <div className="flex-1 bg-zinc-900/30 rounded-xl border border-zinc-800/50 overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 py-2 bg-black/20 border-b border-zinc-800/50">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Scissors className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Separator orientation="vertical" className="h-6 bg-zinc-800" />
                            <Select defaultValue="off">
                              <SelectTrigger className="h-8 w-36 text-xs bg-black/20 border-zinc-800">
                                <SelectValue placeholder="Snap to Grid" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="off">Grid Snap: Off</SelectItem>
                                <SelectItem value="bar">Snap to Bar</SelectItem>
                                <SelectItem value="beat">Snap to Beat</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="text-xs text-zinc-500">Time: {formatTime(playbackPosition)}</div>
                        </div>
                      
                        <div className="p-4 pt-14 h-full">
                          <div className="relative h-36 bg-black/20 rounded-lg overflow-hidden mb-4">
                            <div className="absolute inset-0 flex items-center">
                              {selectedTrack.waveformData?.map((value, i) => (
                                <div
                                  key={i}
                                  style={{
                                    height: `${value}%`,
                                    width: '3px',
                                    marginRight: '1px',
                                    background: `${selectedTrack.color.replace('bg-', 'rgb')}`
                                  }}
                                  className="opacity-70"
                                ></div>
                              ))}
                            </div>
                            
                            <div 
                              className="absolute top-0 bottom-0 w-px bg-primary opacity-80"
                              style={{ left: `${(playbackPosition / 30) * 100}%` }}
                            ></div>
                            
                            {/* Time markers */}
                            <div className="absolute top-0 left-0 right-0 flex justify-between px-2">
                              {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="text-[10px] text-zinc-600">{formatTime(i * 5)}</div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Track regions display */}
                          <div className="relative h-16 w-full bg-black/20 rounded-lg overflow-hidden">
                            <div className="absolute inset-0 flex items-center">
                              <div 
                                className={`h-10 ${selectedTrack.color.replace('-600', '-700')}/30 border border-${selectedTrack.color.replace('bg-', '')}/50 rounded-md px-2 flex items-center`}
                                style={{ width: '80%' }}
                              >
                                <div className="text-xs font-medium truncate">{selectedTrack.name} - Main Region</div>
                              </div>
                            </div>
                            
                            <div 
                              className="absolute top-0 bottom-0 w-px bg-primary opacity-80"
                              style={{ left: `${(playbackPosition / 30) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Effect Panel - hidden on mobile, shown on larger screens */}
                  <div className="hidden lg:block w-72 xl:w-80 bg-zinc-900 border-l border-zinc-800/50 overflow-y-auto p-4">
                    <h3 className="font-bold text-lg mb-4">Track Effects</h3>
                    
                    {selectedTrack.effects.length > 0 ? (
                      <div className="space-y-4">
                        {selectedTrack.effects.map(effect => (
                          <div 
                            key={effect.id} 
                            className="border border-zinc-800/50 rounded-lg overflow-hidden"
                          >
                            <div className="flex items-center justify-between p-3 bg-zinc-900">
                              <div className="flex items-center">
                                {effectTypes.find(e => e.id === effect.type)?.icon}
                                <span className="font-medium text-sm ml-2">{effect.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Switch 
                                  checked={effect.isActive} 
                                  onCheckedChange={(checked) => {
                                    updateEffect(selectedTrack.id, effect.id, { isActive: checked });
                                  }}
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => removeEffect(selectedTrack.id, effect.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="bg-black/20 p-3">
                              {effect.type === 'eq' && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">Low</Label>
                                      <span className="text-xs">{effect.parameters.lowGain} dB</span>
                                    </div>
                                    <Slider 
                                      value={[effect.parameters.lowGain as number]} 
                                      min={-12} 
                                      max={12} 
                                      step={0.5}
                                      onValueChange={(v) => {
                                        const updated = { ...effect.parameters, lowGain: v[0] };
                                        updateEffect(selectedTrack.id, effect.id, { parameters: updated });
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">Mid</Label>
                                      <span className="text-xs">{effect.parameters.midGain} dB</span>
                                    </div>
                                    <Slider 
                                      value={[effect.parameters.midGain as number]} 
                                      min={-12} 
                                      max={12} 
                                      step={0.5}
                                      onValueChange={(v) => {
                                        const updated = { ...effect.parameters, midGain: v[0] };
                                        updateEffect(selectedTrack.id, effect.id, { parameters: updated });
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">High</Label>
                                      <span className="text-xs">{effect.parameters.highGain} dB</span>
                                    </div>
                                    <Slider 
                                      value={[effect.parameters.highGain as number]} 
                                      min={-12} 
                                      max={12} 
                                      step={0.5}
                                      onValueChange={(v) => {
                                        const updated = { ...effect.parameters, highGain: v[0] };
                                        updateEffect(selectedTrack.id, effect.id, { parameters: updated });
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {effect.type === 'autotune' && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">Amount</Label>
                                      <span className="text-xs">{effect.parameters.amount}%</span>
                                    </div>
                                    <Slider 
                                      value={[effect.parameters.amount as number]} 
                                      min={0} 
                                      max={100}
                                      onValueChange={(v) => {
                                        const updated = { ...effect.parameters, amount: v[0] };
                                        updateEffect(selectedTrack.id, effect.id, { parameters: updated });
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <Label className="text-xs">Key</Label>
                                    <Select 
                                      value={effect.parameters.key as string}
                                      onValueChange={(value) => {
                                        const updated = { ...effect.parameters, key: value };
                                        updateEffect(selectedTrack.id, effect.id, { parameters: updated });
                                      }}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select key" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="C">C Major</SelectItem>
                                        <SelectItem value="D">D Major</SelectItem>
                                        <SelectItem value="E">E Major</SelectItem>
                                        <SelectItem value="F">F Major</SelectItem>
                                        <SelectItem value="G">G Major</SelectItem>
                                        <SelectItem value="A">A Major</SelectItem>
                                        <SelectItem value="B">B Major</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">Speed</Label>
                                      <span className="text-xs">{effect.parameters.speed}%</span>
                                    </div>
                                    <Slider 
                                      value={[effect.parameters.speed as number]} 
                                      min={0} 
                                      max={100}
                                      onValueChange={(v) => {
                                        const updated = { ...effect.parameters, speed: v[0] };
                                        updateEffect(selectedTrack.id, effect.id, { parameters: updated });
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {effect.type === 'reverb' && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">Decay</Label>
                                      <span className="text-xs">{effect.parameters.decay}s</span>
                                    </div>
                                    <Slider 
                                      value={[effect.parameters.decay as number]} 
                                      min={0.1} 
                                      max={10}
                                      step={0.1}
                                      onValueChange={(v) => {
                                        const updated = { ...effect.parameters, decay: v[0] };
                                        updateEffect(selectedTrack.id, effect.id, { parameters: updated });
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">Mix</Label>
                                      <span className="text-xs">{effect.parameters.wet}%</span>
                                    </div>
                                    <Slider 
                                      value={[effect.parameters.wet as number]} 
                                      min={0} 
                                      max={100}
                                      onValueChange={(v) => {
                                        const updated = { 
                                          ...effect.parameters, 
                                          wet: v[0],
                                          dry: 100 - v[0]
                                        };
                                        updateEffect(selectedTrack.id, effect.id, { parameters: updated });
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {effect.type === 'compressor' && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">Threshold</Label>
                                      <span className="text-xs">{effect.parameters.threshold} dB</span>
                                    </div>
                                    <Slider 
                                      value={[effect.parameters.threshold as number]} 
                                      min={-60} 
                                      max={0}
                                      onValueChange={(v) => {
                                        const updated = { ...effect.parameters, threshold: v[0] };
                                        updateEffect(selectedTrack.id, effect.id, { parameters: updated });
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">Ratio</Label>
                                      <span className="text-xs">{effect.parameters.ratio}:1</span>
                                    </div>
                                    <Slider 
                                      value={[effect.parameters.ratio as number]} 
                                      min={1} 
                                      max={20}
                                      step={0.5}
                                      onValueChange={(v) => {
                                        const updated = { ...effect.parameters, ratio: v[0] };
                                        updateEffect(selectedTrack.id, effect.id, { parameters: updated });
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        <Button 
                          variant="outline" 
                          className="w-full bg-black/20 border-dashed"
                          onClick={() => {
                            setActiveEffectType(null);
                            setShowEffectsDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Effect
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-zinc-800/50 rounded-lg bg-black/20">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 mb-3">
                          <Sliders className="h-6 w-6 text-zinc-600" />
                        </div>
                        <h3 className="font-medium mb-2">No Effects Yet</h3>
                        <p className="text-zinc-500 text-sm mb-4">
                          Enhance your track with professional effects
                        </p>
                        <Button 
                          variant="secondary" 
                          onClick={() => {
                            setActiveEffectType(null);
                            setShowEffectsDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Effect
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="mixer" className="flex-1 overflow-auto p-6 bg-zinc-950">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Mixer</h2>
                <p className="text-zinc-400">Balance and adjust your tracks</p>
              </div>
              
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800/50 bg-black/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                      <div className="h-6 w-px bg-zinc-800"></div>
                      <div className="space-x-2">
                        <Badge variant="outline" className="bg-black/20">All Tracks</Badge>
                        <Badge variant="outline" className="bg-black/20">Master</Badge>
                      </div>
                    </div>
                    <div>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {currentProject && currentProject.tracks.length > 0 ? (
                    <div className="flex gap-4 pb-6 overflow-x-auto hide-scrollbar">
                      {currentProject.tracks.map(track => (
                        <div key={track.id} className="flex flex-col items-center min-w-[100px] w-[100px]">
                          <div className="mb-3 w-full">
                            <div className={`h-1 w-full ${track.color} rounded-full mb-1`}></div>
                            <div className="text-sm font-medium truncate text-center">{track.name}</div>
                          </div>
                          
                          <div className="h-56 w-8 bg-zinc-900 rounded-full relative mb-3">
                            <div className="absolute inset-x-0 bottom-0 rounded-full overflow-hidden">
                              <div 
                                className={`w-full ${track.color.replace('-600', '-500')} bg-opacity-40`}
                                style={{ height: `${track.volume}%` }}
                              ></div>
                            </div>
                            <div 
                              className="absolute left-0 right-0 h-2 bg-white rounded-full border border-zinc-600"
                              style={{ bottom: `${track.volume}%` }}
                            ></div>
                          </div>
                          
                          <div className="space-y-2 w-full">
                            <div className="flex justify-center space-x-1">
                              <Button 
                                variant={track.isMuted ? "destructive" : "outline"} 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => toggleMute(track.id)}
                              >
                                <VolumeX className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant={track.isSoloed ? "default" : "outline"} 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => toggleSolo(track.id)}
                              >
                                <span className="text-xs font-bold">S</span>
                              </Button>
                            </div>
                            <div className="flex justify-center">
                              <span className="text-xs font-mono">{track.volume}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Master Channel */}
                      <div className="flex flex-col items-center min-w-[100px] w-[100px]">
                        <div className="mb-3 w-full">
                          <div className="h-1 w-full bg-primary rounded-full mb-1"></div>
                          <div className="text-sm font-medium truncate text-center">Master</div>
                        </div>
                        
                        <div className="h-56 w-8 bg-zinc-900 rounded-full relative mb-3">
                          <div className="absolute inset-x-0 bottom-0 rounded-full overflow-hidden">
                            <div 
                              className="w-full bg-primary bg-opacity-40"
                              style={{ height: `100%` }}
                            ></div>
                          </div>
                          <div 
                            className="absolute left-0 right-0 h-2 bg-white rounded-full border border-zinc-600"
                            style={{ bottom: `100%` }}
                          ></div>
                        </div>
                        
                        <div className="space-y-2 w-full">
                          <div className="flex justify-center">
                            <Button 
                              variant="secondary" 
                              size="icon" 
                              className="h-7 w-7"
                            >
                              <Sliders className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex justify-center">
                            <span className="text-xs font-mono">0.0 dB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 mb-3">
                        <Sliders className="h-6 w-6 text-zinc-600" />
                      </div>
                      <h3 className="font-medium mb-2">No Tracks to Mix</h3>
                      <p className="text-zinc-500 text-sm mb-4">
                        Add tracks to your project to start mixing
                      </p>
                      <Button 
                        variant="secondary" 
                        onClick={() => setShowNewTrackDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Track
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="mastering" className="flex-1 overflow-auto p-6 bg-zinc-950">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Mastering</h2>
                  <p className="text-zinc-400">Professional mastering tools</p>
                </div>
                <div>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Zap className="h-4 w-4 mr-1" />
                    Instant Master
                  </Button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-zinc-800 bg-zinc-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Heart className="h-4 w-4 mr-2 text-primary" />
                        Mastering Compressor
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm mb-0.5">
                            <span>Threshold</span>
                            <span>-18 dB</span>
                          </div>
                          <Slider defaultValue={[18]} max={60} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm mb-0.5">
                            <span>Ratio</span>
                            <span>2.5:1</span>
                          </div>
                          <Slider defaultValue={[25]} max={100} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm mb-0.5">
                              <span>Attack</span>
                              <span>10 ms</span>
                            </div>
                            <Slider defaultValue={[10]} max={100} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm mb-0.5">
                              <span>Release</span>
                              <span>150 ms</span>
                            </div>
                            <Slider defaultValue={[15]} max={100} />
                          </div>
                        </div>
                        <div className="pt-2">
                          <div className="w-full h-12 bg-zinc-950 rounded-md relative overflow-hidden">
                            <div className="absolute inset-0 flex items-end">
                              {Array.from({ length: 50 }).map((_, i) => {
                                const height = 20 + Math.random() * 60;
                                return (
                                  <div
                                    key={i}
                                    className="w-1 mx-px bg-gradient-to-t from-green-500 to-yellow-500"
                                    style={{ height: `${height}%` }}
                                  ></div>
                                );
                              })}
                            </div>
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-red-500/50 border-dashed"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-zinc-800 bg-zinc-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Sliders className="h-4 w-4 mr-2 text-primary" />
                        Mastering EQ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40 w-full bg-zinc-950 rounded-md relative overflow-hidden mb-4">
                        <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full">
                          <path
                            d="M0,50 C30,40 60,60 90,50 C120,40 150,70 180,50 C210,30 240,60 270,50 C300,40 300,50 300,50"
                            stroke="rgb(168, 85, 247)"
                            strokeWidth="2"
                            fill="none"
                          />
                        </svg>
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-indigo-500/10 to-transparent"></div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm mb-0.5">
                            <span>Low</span>
                            <span>+2 dB</span>
                          </div>
                          <Slider defaultValue={[52]} max={100} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm mb-0.5">
                            <span>Mid</span>
                            <span>-1 dB</span>
                          </div>
                          <Slider defaultValue={[48]} max={100} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm mb-0.5">
                            <span>High</span>
                            <span>+1 dB</span>
                          </div>
                          <Slider defaultValue={[51]} max={100} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="border-zinc-800 bg-zinc-900/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <BarChart className="h-4 w-4 mr-2 text-primary" />
                      Mastering Limiter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm mb-0.5">
                          <span>Threshold</span>
                          <span>-0.5 dB</span>
                        </div>
                        <Slider defaultValue={[95]} max={100} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm mb-0.5">
                          <span>Release</span>
                          <span>50 ms</span>
                        </div>
                        <Slider defaultValue={[50]} max={100} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm mb-0.5">
                          <span>Output Gain</span>
                          <span>+2.5 dB</span>
                        </div>
                        <Slider defaultValue={[25]} max={60} />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <div className="w-full h-16 bg-zinc-950 rounded-md overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-between">
                          {Array.from({ length: 100 }).map((_, i) => {
                            const height = Math.min(90, 10 + Math.pow(Math.random() * 10, 1.5));
                            return (
                              <div
                                key={i}
                                className="w-px bg-gradient-to-t from-green-500 to-red-500"
                                style={{ height: `${height}%` }}
                              ></div>
                            );
                          })}
                        </div>
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/20"></div>
                        </div>
                        <div className="absolute inset-0 flex items-end">
                          <div className="w-full border-t border-red-500/70 border-dashed"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-zinc-800 bg-zinc-900/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Output Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm mb-1.5 block">Output Format</Label>
                        <Select defaultValue="wav">
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wav">WAV (Lossless)</SelectItem>
                            <SelectItem value="mp3">MP3 (320kbps)</SelectItem>
                            <SelectItem value="flac">FLAC (Lossless)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 block">Sample Rate</Label>
                        <Select defaultValue="48000">
                          <SelectTrigger>
                            <SelectValue placeholder="Select sample rate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="44100">44.1 kHz (CD Quality)</SelectItem>
                            <SelectItem value="48000">48 kHz (Professional)</SelectItem>
                            <SelectItem value="96000">96 kHz (High Resolution)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 block">Bit Depth</Label>
                        <Select defaultValue="24">
                          <SelectTrigger>
                            <SelectValue placeholder="Select bit depth" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16">16-bit</SelectItem>
                            <SelectItem value="24">24-bit</SelectItem>
                            <SelectItem value="32">32-bit float</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowExportDialog(true)}>
                        <Download className="h-4 w-4 mr-1" />
                        Export Master
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="flex-1 overflow-auto p-6 bg-zinc-950">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Project Notes</h2>
                <p className="text-zinc-400">Keep track of ideas and changes</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card className="border-zinc-800 bg-zinc-900/30 h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        Project Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <Textarea 
                        className="h-[calc(100vh-300px)] min-h-[200px] bg-black/20 resize-none border-zinc-800 focus-visible:ring-primary"
                        placeholder="Add your project notes here..."
                        value={currentProject?.description || ''}
                        onChange={(e) => setCurrentProject(prev => 
                          prev ? { ...prev, description: e.target.value } : null
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={saveProject}>
                        <Save className="h-4 w-4 mr-1" />
                        Save Notes
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div>
                  <div className="space-y-5">
                    <Card className="border-zinc-800 bg-zinc-900/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          Project Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-xs text-zinc-400 mb-1 block">Project Title</Label>
                          <Input 
                            value={currentProject?.title || ''} 
                            onChange={(e) => setCurrentProject(prev => 
                              prev ? { ...prev, title: e.target.value } : null
                            )}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs text-zinc-400 mb-1 block">BPM</Label>
                          <Input 
                            type="number" 
                            value={currentProject?.bpm || 90} 
                            onChange={(e) => setCurrentProject(prev => 
                              prev ? { ...prev, bpm: parseInt(e.target.value) || 90 } : null
                            )}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs text-zinc-400 mb-1 block">Key</Label>
                          <Select 
                            value={currentProject?.key || 'C Major'}
                            onValueChange={(value) => setCurrentProject(prev => 
                              prev ? { ...prev, key: value } : null
                            )}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select key" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="C Major">C Major</SelectItem>
                              <SelectItem value="G Major">G Major</SelectItem>
                              <SelectItem value="D Major">D Major</SelectItem>
                              <SelectItem value="A Major">A Major</SelectItem>
                              <SelectItem value="E Major">E Major</SelectItem>
                              <SelectItem value="A Minor">A Minor</SelectItem>
                              <SelectItem value="E Minor">E Minor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-zinc-400 mb-1 block">Time Signature</Label>
                          <Select 
                            value={currentProject?.timeSignature || '4/4'}
                            onValueChange={(value) => setCurrentProject(prev => 
                              prev ? { ...prev, timeSignature: value } : null
                            )}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time signature" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4/4">4/4</SelectItem>
                              <SelectItem value="3/4">3/4</SelectItem>
                              <SelectItem value="6/8">6/8</SelectItem>
                              <SelectItem value="5/4">5/4</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-zinc-400 mb-1 block">Genres</Label>
                          <div className="flex flex-wrap gap-1">
                            {['Hip Hop', 'R&B', 'Pop', 'Trap', 'Electronic', 'Drill', 'Jersey Club'].map(genre => (
                              <Badge 
                                key={genre} 
                                variant={currentProject?.genres.includes(genre) ? "default" : "outline"} 
                                className="cursor-pointer"
                                onClick={() => {
                                  if (!currentProject) return;
                                  
                                  const updatedGenres = currentProject.genres.includes(genre)
                                    ? currentProject.genres.filter(g => g !== genre)
                                    : [...currentProject.genres, genre];
                                  
                                  setCurrentProject({
                                    ...currentProject,
                                    genres: updatedGenres
                                  });
                                }}
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-zinc-800 bg-zinc-900/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center">
                          <Share2 className="h-4 w-4 mr-2 text-primary" />
                          Visibility
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start space-x-2">
                          <div>
                            <Checkbox 
                              id="public" 
                              checked={currentProject?.isPublic || false}
                              onCheckedChange={(checked) => {
                                if (!currentProject) return;
                                setCurrentProject({
                                  ...currentProject,
                                  isPublic: !!checked
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="public" className="text-sm font-medium">Make project public</Label>
                            <p className="text-xs text-zinc-400">
                              Allow others to see this project on your profile
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <div>
                            <Checkbox id="collaborative" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="collaborative" className="text-sm font-medium">Enable collaboration</Label>
                            <p className="text-xs text-zinc-400">
                              Allow invited collaborators to edit this project
                            </p>
                          </div>
                        </div>
                        
                        <Button variant="outline" className="w-full mt-2" onClick={saveProject}>
                          <Save className="h-4 w-4 mr-1" />
                          Save Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="chat" className="flex-1 p-0 overflow-hidden flex">
              <div className="flex-1 flex flex-col bg-zinc-950">
                <div className="flex-1 p-6 overflow-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-1">Collaboration</h2>
                    <p className="text-zinc-400">Collaborate in real-time with others</p>
                  </div>
                  
                  <div className="flex items-center justify-center mt-24">
                    <div className="text-center max-w-md p-8">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 mb-4">
                        <Users className="h-8 w-8 text-zinc-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Start Collaborating</h2>
                      <p className="text-zinc-400 mb-6">
                        Invite other people to collaborate on this project in real-time.
                      </p>
                      <Button onClick={() => setShowCollaborationDialog(true)}>
                        <Users className="mr-2 h-4 w-4" />
                        Invite Collaborators
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
                  <div className="flex items-center gap-4">
                    <Input placeholder="Type a message..." className="flex-1" />
                    <Button>
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="w-64 border-l border-zinc-800 bg-zinc-900 p-4 hidden lg:block">
                <h3 className="font-medium mb-4">Collaborators</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-2 rounded-md bg-zinc-800/50">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-black">
                        {user?.username?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{user?.username || 'You'}</div>
                      <div className="text-xs text-zinc-400">Owner</div>
                    </div>
                    <Badge variant="secondary" className="ml-2">Online</Badge>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Invite People</h3>
                  <Button variant="outline" className="w-full" onClick={() => setShowCollaborationDialog(true)}>
                    <Users className="h-4 w-4 mr-1" />
                    Invite
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Effects Dialog */}
      <Dialog open={showEffectsDialog} onOpenChange={setShowEffectsDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Effects</DialogTitle>
            <DialogDescription>
              Enhance your track with professional effects
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {effectTypes.map(effect => (
              <Button
                key={effect.id}
                variant="outline"
                className="h-auto py-3 px-4 justify-start bg-black/20 border-zinc-800 hover:bg-zinc-800"
                onClick={() => {
                  if (selectedTrackId) {
                    addEffect(selectedTrackId, effect.id);
                    setShowEffectsDialog(false);
                  }
                }}
              >
                <div className="flex items-center">
                  <div className="bg-primary/10 rounded-full p-2 mr-3">
                    {effect.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{effect.name}</div>
                    <div className="text-xs text-zinc-400">
                      {effect.id === 'eq' && 'Shape your sound'}
                      {effect.id === 'compressor' && 'Control dynamics'}
                      {effect.id === 'reverb' && 'Add space & depth'}
                      {effect.id === 'delay' && 'Create echoes'}
                      {effect.id === 'autotune' && 'Vocal pitch correction'}
                      {effect.id === 'limiter' && 'Maximize loudness'}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEffectsDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Export Project</DialogTitle>
            <DialogDescription>
              Choose an export format for your project
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-auto py-4 px-4 justify-start bg-black/20 border-zinc-800 hover:bg-zinc-800"
              onClick={() => handleExport('wav')}
            >
              <div className="flex items-center">
                <div className="bg-blue-500/10 rounded-full p-2 mr-3">
                  <Download className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">WAV (Lossless)</div>
                  <div className="text-xs text-zinc-400">
                    High quality, uncompressed audio
                  </div>
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 px-4 justify-start bg-black/20 border-zinc-800 hover:bg-zinc-800"
              onClick={() => handleExport('mp3')}
            >
              <div className="flex items-center">
                <div className="bg-green-500/10 rounded-full p-2 mr-3">
                  <Download className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">MP3 (320kbps)</div>
                  <div className="text-xs text-zinc-400">
                    Compressed, good for sharing
                  </div>
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 px-4 justify-start bg-black/20 border-zinc-800 hover:bg-zinc-800"
              onClick={() => handleExport('stems')}
            >
              <div className="flex items-center">
                <div className="bg-purple-500/10 rounded-full p-2 mr-3">
                  <Layers className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Export Stems</div>
                  <div className="text-xs text-zinc-400">
                    Individual tracks as separate files
                  </div>
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 px-4 justify-start bg-black/20 border-zinc-800 hover:bg-zinc-800"
              onClick={() => handleExport('project')}
            >
              <div className="flex items-center">
                <div className="bg-amber-500/10 rounded-full p-2 mr-3">
                  <Save className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Project File</div>
                  <div className="text-xs text-zinc-400">
                    Export complete project file
                  </div>
                </div>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Collaboration Dialog */}
      <Dialog open={showCollaborationDialog} onOpenChange={setShowCollaborationDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Invite Collaborators</DialogTitle>
            <DialogDescription>
              Invite others to collaborate on this project
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Email or Username</Label>
              <Input placeholder="Enter email address or username" />
            </div>
            
            <div className="space-y-2">
              <Label>Permission Level</Label>
              <Select defaultValue="edit">
                <SelectTrigger>
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Can Edit</SelectItem>
                  <SelectItem value="view">Can View</SelectItem>
                  <SelectItem value="comment">Can Comment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Personal Message (Optional)</Label>
              <Textarea placeholder="Add a personal message to your invitation" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollaborationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleInviteCollaborator('collaborator@example.com')}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}