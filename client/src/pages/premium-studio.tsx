import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// UI Components
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';

// Icons
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
  AlignJustify,
  ArrowUpDown,
  Sparkles,
  Flame,
  Zap,
  MessageSquare,
  Crown,
  Star,
  Heart,
  Repeat,
  Bookmark,
  Bot,
  PenTool,
  Wand2,
  Layers,
  SplitSquareVertical,
  Github,
  Trash2,
  Check,
  Copy,
  MoreHorizontal,
  Maximize,
  Minimize,
  BoxSelect,
  Moon,
  Scissors
} from 'lucide-react';

// Tone.js for professional audio processing
import * as Tone from 'tone';

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

// Advanced waveform visualization
const generateSmoothWaveform = (length = 100, complexity = 3) => {
  // Generate a more organic looking waveform
  const baseWaveform = Array.from({ length }, () => Math.random());
  
  // Apply smoothing
  const smoothedWaveform = [];
  for (let i = 0; i < length; i++) {
    let sum = 0;
    let count = 0;
    
    for (let j = Math.max(0, i - complexity); j <= Math.min(length - 1, i + complexity); j++) {
      sum += baseWaveform[j];
      count++;
    }
    
    smoothedWaveform.push((sum / count) * 100);
  }
  
  return smoothedWaveform;
};

// Interface definitions
interface Track {
  id: number;
  name: string;
  type: 'audio' | 'vocal' | 'midi' | 'sample' | 'beat' | 'aiGenerated';
  color: string;
  isMuted: boolean;
  isSoloed: boolean;
  volume: number;
  pan: number;
  regions: Region[];
  effects: Effect[];
  collaborators?: string[];
  isLocked?: boolean;
  tags?: string[];
  createdWithAI?: boolean;
}

interface Region {
  id: number;
  start: number; // Start measure
  end: number;   // End measure
  waveformData: number[];
  audioBuffer?: AudioBuffer;
  notes?: Note[];
  clips?: Clip[];
  color?: string;
  name?: string;
  loopEnabled?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

interface Note {
  id: number;
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
}

interface Clip {
  id: number;
  type: 'sample' | 'audio' | 'midi';
  start: number;
  duration: number;
  source: string;
}

interface Effect {
  id: number;
  type: string;
  name: string;
  isActive: boolean;
  isLuxury?: boolean;
  parameters: Record<string, any>;
  presets?: Preset[];
}

interface Preset {
  id: number;
  name: string;
  parameters: Record<string, any>;
  isFavorite?: boolean;
}

interface Project {
  id: number;
  title: string;
  description?: string;
  bpm: number;
  timeSignature: string;
  key: string;
  genre?: string;
  tracks: Track[];
  lastModified: Date;
  collaborators?: { id: number; username: string; role: string }[];
  isPublic?: boolean;
  visualTheme?: string;
  mixingProgress?: number;
  masteringSettings?: MasteringSettings;
  comments?: Comment[];
  aiSuggestions?: AISuggestion[];
  versionHistory?: VersionHistory[];
}

interface MasteringSettings {
  id: number;
  projectId: number;
  compressionAmount: number;
  limitThreshold: number;
  eqSettings: {
    low: number;
    mid: number;
    high: number;
  };
  stereoWidth: number;
  loudness: number;
  clarity: number;
  presetName?: string;
}

interface Comment {
  id: number;
  userId: number;
  username: string;
  text: string;
  timestamp: Date;
  position?: number; // Position in the timeline
  trackId?: number;   // Related track
}

interface AISuggestion {
  id: number;
  type: string; // 'melody', 'chord', 'drum', 'mix', 'master'
  description: string;
  previewUrl?: string;
  applied: boolean;
}

interface VersionHistory {
  id: number;
  version: number;
  timestamp: Date;
  description: string;
  createdBy: string;
  snapshotUrl?: string;
}

// Available studio effects with luxury options
const studioEffects = [
  { 
    id: 'autoPitch', 
    name: 'BallTalk™ AutoPitch', 
    icon: <Zap className="h-4 w-4" />,
    isLuxury: true,
    description: 'Professional-grade pitch correction with advanced harmony generation'
  },
  { 
    id: 'stadiumVerb', 
    name: 'Stadium Reverb', 
    icon: <Layers className="h-4 w-4" />,
    isLuxury: true,
    description: 'Signature arena-sized spatial effects used by top performing artists'
  },
  { 
    id: 'dynamicEQ', 
    name: 'Dynamic EQ', 
    icon: <Sliders className="h-4 w-4" />,
    description: 'Precision frequency control that adapts to your performance'
  },
  { 
    id: 'soundprint', 
    name: 'SoundPrint™ Compressor', 
    icon: <Wand2 className="h-4 w-4" />,
    isLuxury: true,
    description: 'Signature compression algorithm developed with platinum producers'
  },
  { 
    id: 'beatSync', 
    name: 'Beat Synchronizer', 
    icon: <Repeat className="h-4 w-4" />,
    description: 'Precisely align audio elements to your track\'s tempo'
  },
  { 
    id: 'aiMaster', 
    name: 'AI Mastering', 
    icon: <Sparkles className="h-4 w-4" />,
    isLuxury: true,
    description: 'One-click professional mastering using advanced AI algorithms'
  }
];

// AutoPitch harmony styles with premium options
const harmonyStyles = [
  { id: 'classic', name: 'Classic', icon: '🎵', description: 'Traditional vocal harmonization' },
  { id: 'stadium', name: 'Stadium', icon: '🏟️', description: 'Wide, arena-filling harmonies', isPremium: true },
  { id: 'trapSoul', name: 'Trap Soul', icon: '💎', description: 'Modern R&B-inspired harmonies', isPremium: true },
  { id: 'vintage', name: 'Vintage', icon: '🎙️', description: 'Classic recording era warmth' },
  { id: 'hyperTune', name: 'HyperTune', icon: '⚡', description: 'Exaggerated effect for creative sound design', isPremium: true }
];

// Musical notes with octave variations
const musicalNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Luxury track color palette
const luxuryTrackColors = [
  'linear-gradient(45deg, #3b82f6, #93c5fd)', // blue luxury
  'linear-gradient(45deg, #8b5cf6, #c4b5fd)', // purple luxury
  'linear-gradient(45deg, #ec4899, #f9a8d4)', // pink luxury
  'linear-gradient(45deg, #ef4444, #fca5a5)', // red luxury
  'linear-gradient(45deg, #f59e0b, #fcd34d)', // amber luxury
  'linear-gradient(45deg, #10b981, #6ee7b7)', // emerald luxury
  'linear-gradient(45deg, #06b6d4, #67e8f9)', // cyan luxury
  'linear-gradient(45deg, #6366f1, #a5b4fc)', // indigo luxury
  'linear-gradient(45deg, #000000, #525252)', // black luxury
  'linear-gradient(45deg, #d97706, #fbbf24)', // gold luxury
];

// AI-powered beat templates
const aiBeats = [
  { id: 'trap', name: 'Trap Beat', bpm: 140, icon: '🔥' },
  { id: 'drill', name: 'Drill', bpm: 150, icon: '💥' },
  { id: 'afrobeat', name: 'Afrobeat', bpm: 105, icon: '🌍' },
  { id: 'lofi', name: 'Lo-Fi', bpm: 85, icon: '☁️' },
  { id: 'jersey', name: 'Jersey Club', bpm: 135, icon: '🎭' },
  { id: 'hyperpop', name: 'Hyperpop', bpm: 160, icon: '⚡' }
];

// Premium sample packs
const samplePacks = [
  { id: 'vip-drums', name: 'VIP Drum Collection', count: 120, icon: '🥁' },
  { id: 'athlete-vox', name: 'Athlete Vocal Chops', count: 75, icon: '🎤' },
  { id: 'stadium-fx', name: 'Stadium FX', count: 50, icon: '🏟️' },
  { id: 'lo-fi-kit', name: 'Lo-Fi Essentials', count: 90, icon: '📻' },
  { id: 'exclusive-808', name: 'Exclusive 808 Pack', count: 40, icon: '💰' },
];

const PremiumStudio: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  
  // Studio state
  const [project, setProject] = useState<Project>({
    id: Date.now(),
    title: 'New Heat 🔥',
    bpm: 140,
    timeSignature: '4/4',
    key: 'C',
    genre: 'Trap',
    tracks: [],
    lastModified: new Date(),
    collaborators: [],
    isPublic: false,
    visualTheme: 'midnight',
    mixingProgress: 0,
    comments: [],
    aiSuggestions: [],
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('studio');
  const [activeSidePanel, setActiveSidePanel] = useState<string | null>('mixer');
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState('waveform');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [studioTheme, setStudioTheme] = useState('dark');
  const [uiScale, setUiScale] = useState(1);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0); // In measures
  const [selectedTimeRange, setSelectedTimeRange] = useState<[number, number] | null>(null);
  
  // Track state
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [soloedTracks, setSoloedTracks] = useState<number[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  
  // Effect state
  const [selectedEffectId, setSelectedEffectId] = useState<number | null>(null);
  const [activeEffectPanel, setActiveEffectPanel] = useState<string | null>('autoPitch');
  const [showEffectBrowser, setShowEffectBrowser] = useState(false);
  
  // AutoPitch settings
  const [autoPitchEnabled, setAutoPitchEnabled] = useState(false);
  const [selectedHarmonyStyle, setSelectedHarmonyStyle] = useState('classic');
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedScale, setSelectedScale] = useState('major');
  const [autoPitchAmount, setAutoPitchAmount] = useState(50);
  const [autoPitchFormant, setAutoPitchFormant] = useState(0);
  const [aiVoiceLayering, setAiVoiceLayering] = useState(false);
  
  // Modals
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCollaborationDialog, setShowCollaborationDialog] = useState(false);
  const [showAIAssistantDialog, setShowAIAssistantDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  
  // AI Assistant
  const [aiSuggestionType, setAiSuggestionType] = useState('melody');
  const [aiQueryText, setAiQueryText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  
  // Project settings
  const [masterVolume, setMasterVolume] = useState(80);
  const [inputMonitoring, setInputMonitoring] = useState(false);
  
  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const playbackInterval = useRef<any>(null);
  const projectId = params.projectId ? parseInt(params.projectId) : null;
  
  // Initialize audio context and Tone.js
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  useEffect(() => {
    // Initialize audio context
    const ctx = getAudioContext();
    if (ctx) {
      setAudioContext(ctx);
      // Initialize Tone.js with our audio context
      Tone.setContext(ctx);
    }
    
    // Create default tracks if needed
    if (project.tracks.length === 0) {
      // Add a vocal track
      addTrack('vocal', 'Main Vocal');
      // Add a beat track
      addTrack('beat', 'Beat');
      // Add a sample track
      addTrack('sample', 'Samples');
    }
    
    // Clean up function
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
      
      // Dispose Tone.js resources
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);
  
  // Fetch project data if ID is provided
  useEffect(() => {
    if (projectId) {
      // This would fetch from the server in a real implementation
      // For now, we'll just use the default project
    }
  }, [projectId]);
  
  // Get selected track
  const selectedTrack = project.tracks.find(track => track.id === selectedTrackId);
  
  // Add a new track to the project
  const addTrack = (type: Track['type'], name?: string) => {
    const trackCount = project.tracks.filter(t => t.type === type).length;
    const trackName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${trackCount + 1}`;
    
    const newTrack: Track = {
      id: Date.now(),
      name: trackName,
      type,
      color: luxuryTrackColors[project.tracks.length % luxuryTrackColors.length],
      isMuted: false,
      isSoloed: false,
      volume: 75,
      pan: 0,
      regions: [],
      effects: [],
      collaborators: [],
      isLocked: false,
      tags: [],
      createdWithAI: type === 'aiGenerated'
    };
    
    // Add default effects based on track type
    if (type === 'vocal') {
      newTrack.effects.push({
        id: Date.now(),
        type: 'autoPitch',
        name: 'BallTalk™ AutoPitch',
        isActive: false,
        isLuxury: true,
        parameters: {
          style: 'classic',
          key: project.key,
          amount: 50,
          formant: 0,
          aiLayering: false
        }
      });
      
      newTrack.effects.push({
        id: Date.now() + 1,
        type: 'stadiumVerb',
        name: 'Stadium Reverb',
        isActive: false,
        isLuxury: true,
        parameters: {
          size: 0.7,
          decay: 2.5,
          predelay: 0.02,
          wet: 0.3,
          dry: 0.7
        }
      });
    }
    
    if (type === 'beat' || type === 'sample') {
      newTrack.effects.push({
        id: Date.now(),
        type: 'dynamicEQ',
        name: 'Dynamic EQ',
        isActive: false,
        parameters: {
          low: 0,
          mid: 0,
          high: 0,
          lowFreq: 200,
          highFreq: 5000
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
  
  // Add a region to a track
  const addRegionToTrack = (trackId: number, region: Omit<Region, 'id'>) => {
    const newRegion: Region = {
      id: Date.now(),
      ...region
    };
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            regions: [...track.regions, newRegion]
          };
        }
        return track;
      }),
      lastModified: new Date()
    }));
    
    return newRegion.id;
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
      if (track.isSoloed) {
        // Remove from soloed tracks
        setSoloedTracks(prev => prev.filter(id => id !== trackId));
        updateTrack(trackId, { isSoloed: false });
      } else {
        // Add to soloed tracks
        setSoloedTracks(prev => [...prev, trackId]);
        updateTrack(trackId, { isSoloed: true });
      }
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
  
  // Add an effect to a track
  const addEffectToTrack = (trackId: number, effectType: string) => {
    const effectInfo = studioEffects.find(e => e.id === effectType);
    if (!effectInfo) return;
    
    const defaultParameters: Record<string, any> = {};
    
    // Set default parameters based on effect type
    switch (effectType) {
      case 'autoPitch':
        defaultParameters.style = 'classic';
        defaultParameters.key = project.key;
        defaultParameters.amount = 50;
        defaultParameters.formant = 0;
        defaultParameters.aiLayering = false;
        break;
      case 'stadiumVerb':
        defaultParameters.size = 0.7;
        defaultParameters.decay = 2.5;
        defaultParameters.predelay = 0.02;
        defaultParameters.wet = 0.3;
        defaultParameters.dry = 0.7;
        break;
      case 'dynamicEQ':
        defaultParameters.low = 0;
        defaultParameters.mid = 0;
        defaultParameters.high = 0;
        defaultParameters.lowFreq = 200;
        defaultParameters.highFreq = 5000;
        break;
      case 'soundprint':
        defaultParameters.threshold = -20;
        defaultParameters.ratio = 4;
        defaultParameters.attack = 0.005;
        defaultParameters.release = 0.05;
        defaultParameters.makeup = 0;
        defaultParameters.quality = 'premium';
        break;
      case 'beatSync':
        defaultParameters.sync = 'bar';
        defaultParameters.amount = 50;
        defaultParameters.offset = 0;
        break;
      case 'aiMaster':
        defaultParameters.style = 'balanced';
        defaultParameters.intensity = 50;
        defaultParameters.clarity = 50;
        defaultParameters.warmth = 50;
        defaultParameters.loudness = 50;
        break;
    }
    
    const newEffect: Effect = {
      id: Date.now(),
      type: effectType,
      name: effectInfo.name,
      isActive: false,
      isLuxury: effectInfo.isLuxury,
      parameters: defaultParameters
    };
    
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            effects: [...track.effects, newEffect]
          };
        }
        return track;
      }),
      lastModified: new Date()
    }));
    
    return newEffect.id;
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
  
  // Remove effect from track
  const removeEffect = (trackId: number, effectId: number) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            effects: track.effects.filter(effect => effect.id !== effectId)
          };
        }
        return track;
      }),
      lastModified: new Date()
    }));
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
            start: startMeasure,
            end: endMeasure,
            waveformData: generateSmoothWaveform(500, 5),
            audioBuffer,
            name: `Take ${new Date().toLocaleTimeString()}`,
            loopEnabled: false,
            fadeIn: 0,
            fadeOut: 0
          });
        }
        
        audioChunks.current = [];
        setIsRecording(false);
        
        // Show success toast
        toast({
          title: "Recording saved",
          description: "Your vocal has been added to the project",
          variant: "default"
        });
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
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      // Start playback
      Tone.Transport.start();
      setIsPlaying(true);
      
      // Set the BPM in Tone.js
      Tone.Transport.bpm.value = project.bpm;
      
      playbackInterval.current = setInterval(() => {
        setCurrentPosition(prev => {
          if (isLooping && selectedTimeRange) {
            const [start, end] = selectedTimeRange;
            const newPos = prev + 0.1;
            return newPos >= end ? start : newPos;
          } else {
            // Standard playback
            const newPos = prev + 0.1;
            return newPos >= 16 ? 0 : newPos; // Loop at measure 16
          }
        });
      }, 100);
    }
  };
  
  // Stop playback and reset position
  const stopPlayback = () => {
    if (isPlaying) {
      clearInterval(playbackInterval.current);
      Tone.Transport.stop();
      setIsPlaying(false);
    }
    setCurrentPosition(0);
  };
  
  // Go to beginning
  const goToStart = () => {
    setCurrentPosition(0);
    if (isPlaying) {
      Tone.Transport.position = "0:0:0";
    }
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
  
  // Handle clicks on the timeline to set position
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const timelineWidth = rect.width;
    const measurePosition = (clickPosition / timelineWidth) * 16 / zoomLevel; // 16 measures in view, adjusted by zoom
    
    setCurrentPosition(Math.max(0, Math.min(16, measurePosition)));
    
    if (isPlaying) {
      // Also update Tone.js playback position
      const beatsPerMeasure = parseInt(project.timeSignature.split('/')[0]);
      const quarterNotes = measurePosition * beatsPerMeasure;
      Tone.Transport.position = `${Math.floor(quarterNotes)}:${Math.floor((quarterNotes % 1) * 4)}:0`;
    }
  };
  
  // Create a time range selection
  const handleTimeRangeSelection = (start: number, end: number) => {
    setSelectedTimeRange([start, end]);
  };
  
  // Save project
  const saveProject = () => {
    // In a real implementation, this would save to the server
    setProject(prev => ({
      ...prev,
      lastModified: new Date()
    }));
    
    toast({
      title: "Project Saved",
      description: "Your project has been saved successfully.",
    });
    
    setShowSaveDialog(false);
  };
  
  // Open AI assistant with specific context
  const openAIAssistant = (type: string) => {
    setAiSuggestionType(type);
    setShowAIAssistantDialog(true);
  };
  
  // Generate AI suggestion
  const generateAISuggestion = () => {
    if (!aiQueryText.trim()) {
      toast({
        title: "Input needed",
        description: "Please describe what you'd like the AI to create",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingAI(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
      const newSuggestion: AISuggestion = {
        id: Date.now(),
        type: aiSuggestionType,
        description: `AI ${aiSuggestionType} based on "${aiQueryText}"`,
        applied: false
      };
      
      setAiSuggestions(prev => [newSuggestion, ...prev]);
      setIsGeneratingAI(false);
      
      toast({
        title: "AI Suggestion Ready",
        description: `Your ${aiSuggestionType} suggestion has been generated.`,
      });
    }, 2000);
  };
  
  // Apply AI suggestion
  const applyAISuggestion = (suggestionId: number) => {
    const suggestion = aiSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;
    
    // Mark the suggestion as applied
    setAiSuggestions(prev => 
      prev.map(s => s.id === suggestionId ? { ...s, applied: true } : s)
    );
    
    // Apply the suggestion based on its type
    switch (suggestion.type) {
      case 'melody':
        // Create a new track with the AI melody
        const trackId = addTrack('aiGenerated', 'AI Melody').id;
        
        // Add a region to the track
        addRegionToTrack(trackId, {
          start: Math.floor(currentPosition),
          end: Math.floor(currentPosition) + 4,
          waveformData: generateSmoothWaveform(400, 5),
          name: suggestion.description,
          loopEnabled: true,
          fadeIn: 0,
          fadeOut: 0
        });
        break;
        
      case 'chord':
        // Add chord progression to selected track or create new one
        const chordTrackId = selectedTrackId || addTrack('midi', 'AI Chords').id;
        
        addRegionToTrack(chordTrackId, {
          start: Math.floor(currentPosition),
          end: Math.floor(currentPosition) + 4,
          waveformData: generateSmoothWaveform(400, 3),
          name: 'AI Chord Progression',
          loopEnabled: true,
          fadeIn: 0,
          fadeOut: 0
        });
        break;
        
      case 'drum':
        // Create a new drum track
        const drumTrackId = addTrack('beat', 'AI Drums').id;
        
        addRegionToTrack(drumTrackId, {
          start: Math.floor(currentPosition),
          end: Math.floor(currentPosition) + 4,
          waveformData: generateSmoothWaveform(400, 1),
          name: 'AI Drum Pattern',
          loopEnabled: true,
          fadeIn: 0,
          fadeOut: 0
        });
        break;
        
      case 'mix':
        // Apply mixing suggestion to project
        setProject(prev => ({
          ...prev,
          mixingProgress: Math.min(100, (prev.mixingProgress || 0) + 25)
        }));
        
        toast({
          title: "AI Mix Applied",
          description: "Your mix has been enhanced by AI."
        });
        break;
        
      case 'master':
        // Apply mastering settings
        setProject(prev => ({
          ...prev,
          masteringSettings: {
            id: Date.now(),
            projectId: prev.id,
            compressionAmount: 60,
            limitThreshold: -0.3,
            eqSettings: {
              low: 1,
              mid: -0.5,
              high: 1.5
            },
            stereoWidth: 120,
            loudness: 85,
            clarity: 70,
            presetName: 'AI Premium Master'
          }
        }));
        
        toast({
          title: "AI Mastering Applied",
          description: "Professional mastering has been applied to your project."
        });
        break;
    }
    
    // Close the AI dialog
    setShowAIAssistantDialog(false);
  };
  
  // Update the project's BPM
  const updateBPM = (bpm: number) => {
    setProject(prev => ({
      ...prev,
      bpm,
      lastModified: new Date()
    }));
    
    // Also update Tone.js BPM
    Tone.Transport.bpm.value = bpm;
  };
  
  // Update the project's time signature
  const updateTimeSignature = (timeSignature: string) => {
    setProject(prev => ({
      ...prev,
      timeSignature,
      lastModified: new Date()
    }));
  };
  
  // Update the project's key
  const updateKey = (key: string) => {
    setProject(prev => ({
      ...prev,
      key,
      lastModified: new Date()
    }));
  };
  
  // Update AutoPitch settings
  const updateAutoPitchSettings = (style: string, isEnabled: boolean) => {
    setSelectedHarmonyStyle(style);
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
              style,
              key: selectedKey,
              amount: autoPitchAmount,
              formant: autoPitchFormant,
              aiLayering: aiVoiceLayering
            }
          });
        } else {
          // Add the effect if it doesn't exist
          const newEffectId = addEffectToTrack(selectedTrackId, 'autoPitch');
          if (newEffectId) {
            updateEffect(selectedTrackId, newEffectId, {
              isActive: isEnabled,
              parameters: {
                style,
                key: selectedKey,
                amount: autoPitchAmount,
                formant: autoPitchFormant,
                aiLayering: aiVoiceLayering
              }
            });
          }
        }
      }
    }
  };
  
  // Export project
  const exportProject = (format: string, quality: string) => {
    toast({
      title: "Export Started",
      description: `Exporting project as ${format.toUpperCase()} (${quality})...`
    });
    
    // Simulate export process
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Your project has been exported as ${format.toUpperCase()}.`
      });
      setShowExportDialog(false);
    }, 3000);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };
  
  // Render the main studio interface
  return (
    <div 
      className={`flex flex-col h-screen text-white overflow-hidden ${
        studioTheme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-900'
      }`}
      style={{ fontSize: `${uiScale}rem` }}
    >
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4 flex items-center">
            <div className="flex items-center font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 mr-2">
                <Music className="h-4 w-4 text-white" />
              </div>
              BALLTALK
              <Crown className="h-4 w-4 ml-1 text-amber-400" />
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-1 text-sm">
            <button className="px-3 py-1 rounded hover:bg-zinc-800">File</button>
            <button className="px-3 py-1 rounded hover:bg-zinc-800">Edit</button>
            <button className="px-3 py-1 rounded hover:bg-zinc-800">View</button>
            <button className="px-3 py-1 rounded hover:bg-zinc-800">Tools</button>
          </div>
        </div>
        
        <div className="flex items-center">
          <Input
            value={project.title}
            onChange={(e) => setProject(prev => ({ ...prev, title: e.target.value }))}
            className="w-48 h-8 bg-zinc-800 border-zinc-700 text-center mr-4"
          />
          
          <span className="text-xs text-zinc-400 mr-4">
            Last saved: {project.lastModified.toLocaleTimeString()}
          </span>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    onClick={() => setShowSaveDialog(true)}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save your project</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    onClick={() => setShowShareDialog(true)}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share with collaborators</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    onClick={() => setShowExportDialog(true)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export your project</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  onClick={() => openAIAssistant('melody')}
                >
                  <Bot className="h-4 w-4 text-purple-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI Assistant</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  onClick={() => setShowSettingsDialog(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? 
                    <Minimize className="h-4 w-4" /> : 
                    <Maximize className="h-4 w-4" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Avatar className="h-8 w-8 border border-zinc-700">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
              {user?.username?.[0] || 'A'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Transport Bar */}
      <div className="h-14 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 mr-2">
            <Input 
              type="number"
              value={project.bpm} 
              onChange={(e) => updateBPM(parseInt(e.target.value))}
              className="w-16 h-7 bg-zinc-800 border-zinc-700 text-center px-1"
            />
            <span className="text-xs text-zinc-400">bpm</span>
          </div>
          
          <Select
            value={project.timeSignature}
            onValueChange={updateTimeSignature}
          >
            <SelectTrigger className="w-16 h-7 bg-zinc-800 border-zinc-700 text-center">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4/4">4/4</SelectItem>
              <SelectItem value="3/4">3/4</SelectItem>
              <SelectItem value="6/8">6/8</SelectItem>
              <SelectItem value="5/4">5/4</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={project.key}
            onValueChange={updateKey}
          >
            <SelectTrigger className="w-16 h-7 bg-zinc-800 border-zinc-700 text-center">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {musicalNotes.map(note => (
                <SelectItem key={note} value={note}>{note}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  onClick={goToStart}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to start</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            size="sm"
            variant={isPlaying ? "destructive" : "default"}
            className={`w-10 h-10 rounded-full ${isPlaying ? 
              "bg-red-600 hover:bg-red-700" : 
              "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"}`}
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  onClick={stopPlayback}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stop</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isRecording ? "destructive" : "outline"}
                  className={isRecording 
                    ? "bg-red-600 hover:bg-red-700 h-8 w-8 p-0" 
                    : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 h-8 w-8 p-0"}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  <span className="flex h-3 w-3 rounded-full bg-red-600"></span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? "Stop Recording" : "Record"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 w-8 p-0 ${isLooping ? 'text-purple-400' : 'text-zinc-400'} hover:text-white hover:bg-zinc-800`}
                  onClick={() => setIsLooping(!isLooping)}
                >
                  <Repeat className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Loop Selection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 w-8 p-0 ${isMetronomeEnabled ? 'text-purple-400' : 'text-zinc-400'} hover:text-white hover:bg-zinc-800`}
                  onClick={() => setIsMetronomeEnabled(!isMetronomeEnabled)}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Metronome</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="font-mono text-sm mr-2">
              {formatTimeCode(getTimeFromPosition(currentPosition))}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-zinc-400" />
            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${masterVolume}%` }}
              ></div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseInt(e.target.value))}
              className="absolute w-24 opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track List Panel */}
        <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
          <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase text-zinc-400">Tracks</h2>
            
            <div className="flex space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                      onClick={() => addTrack('vocal')}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Track</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <BoxSelect className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {project.tracks.map(track => (
              <div 
                key={track.id} 
                className={`relative border-b border-zinc-800 p-2 ${
                  selectedTrackId === track.id ? 'bg-zinc-900' : 'hover:bg-zinc-900/50'
                }`}
                onClick={() => setSelectedTrackId(track.id)}
              >
                {/* Track type indicator */}
                {track.createdWithAI && (
                  <div className="absolute top-2 right-2">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-1 h-12 rounded-full" 
                    style={{ background: track.color }}
                  ></div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[150px]">{track.name}</span>
                      
                      <div className="flex space-x-1">
                        <button 
                          className={`w-5 h-5 rounded flex items-center justify-center ${
                            track.isMuted ? 'bg-red-900/50 text-red-500' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                          onClick={(e) => { e.stopPropagation(); toggleMute(track.id); }}
                        >
                          {track.isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </button>
                        
                        <button 
                          className={`w-5 h-5 rounded flex items-center justify-center ${
                            track.isSoloed ? 'bg-amber-900/50 text-amber-500' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                          onClick={(e) => { e.stopPropagation(); toggleSolo(track.id); }}
                        >
                          <span className="text-xs font-bold">S</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Track type */}
                    <div className="flex items-center mt-0.5">
                      <Badge variant="outline" className="text-[10px] py-0 px-1 h-4 border-zinc-700 text-zinc-400">
                        {track.type}
                      </Badge>
                      
                      {track.effects.length > 0 && (
                        <span className="ml-2 text-xs text-zinc-500 flex items-center">
                          <Zap className="h-3 w-3 mr-0.5" />
                          {track.effects.filter(e => e.isActive).length}
                        </span>
                      )}
                    </div>
                    
                    {/* Volume slider */}
                    <div className="flex items-center mt-1 space-x-1">
                      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full"
                          style={{ 
                            width: `${track.volume}%`,
                            background: track.color
                          }}
                        ></div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={track.volume} 
                          onChange={(e) => changeVolume(track.id, parseInt(e.target.value))}
                          className="absolute w-full opacity-0 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {project.tracks.length === 0 && (
              <div className="h-20 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <Music className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs">No tracks yet</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick tools */}
          <div className="p-2 border-t border-zinc-800">
            <div className="flex flex-wrap gap-1">
              <Button 
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                onClick={() => openAIAssistant('melody')}
              >
                <Sparkles className="h-3 w-3 mr-1 text-purple-400" />
                Generate Melody
              </Button>
              
              <Button 
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                onClick={() => openAIAssistant('drum')}
              >
                <Sparkles className="h-3 w-3 mr-1 text-purple-400" />
                Create Drums
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Timeline and Tracks */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Horizontal Ruler/Measures */}
          <div 
            className="h-8 bg-zinc-900 border-b border-zinc-800 flex"
            ref={timelineRef}
            onClick={handleTimelineClick}
          >
            {Array.from({ length: Math.ceil(16 / zoomLevel) }, (_, i) => (
              <div 
                key={i} 
                className="flex-1 border-r border-zinc-800 flex flex-col items-center justify-center"
                style={{ flexBasis: `${100 / (16 / zoomLevel)}%` }}
              >
                <span className="text-xs text-zinc-500">{i + 1}</span>
                <div className="flex w-full">
                  {Array.from({ length: 4 }, (_, j) => (
                    <div key={j} className="flex-1 border-r border-zinc-800/50 last:border-r-0"></div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Playhead */}
            <div 
              ref={playheadRef}
              className="absolute top-0 bottom-0 w-px bg-purple-500 z-10"
              style={{ left: `${(currentPosition / (16 / zoomLevel)) * 100}%` }}
            >
              <div className="h-3 w-3 bg-purple-500 rounded-full -ml-1.5 -mt-1.5"></div>
            </div>
          </div>
          
          {/* Tracks area */}
          <div className="flex-1 overflow-auto bg-zinc-900" ref={trackContainerRef}>
            {project.tracks.map(track => (
              <div 
                key={track.id} 
                className={`h-24 border-b border-zinc-800 relative ${
                  selectedTrackId === track.id ? 'bg-zinc-800/30' : ''
                }`}
                onClick={() => setSelectedTrackId(track.id)}
              >
                {/* Track regions */}
                {track.regions.map(region => (
                  <div 
                    key={region.id}
                    className={`absolute top-2 bottom-2 rounded-md overflow-hidden cursor-pointer ${
                      selectedRegionId === region.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    style={{ 
                      left: `${(region.start / (16 / zoomLevel)) * 100}%`,
                      width: `${((region.end - region.start) / (16 / zoomLevel)) * 100}%`,
                      background: `linear-gradient(180deg, 
                        ${track.color.split(', ')[0]}, ${track.color.split(', ')[1].split(')')[0]}88)`
                    }}
                    onClick={(e) => { 
                      e.stopPropagation();
                      setSelectedRegionId(region.id);
                    }}
                  >
                    {/* Region name */}
                    <div className="px-2 py-1 text-xs font-medium truncate bg-black/20">
                      {region.name || `${track.name} Region`}
                    </div>
                    
                    {/* Waveform visualization */}
                    {visualizationMode === 'waveform' && (
                      <div className="h-full flex items-center px-1">
                        {region.waveformData.map((value, idx) => (
                          <div 
                            key={idx}
                            className="w-px bg-white/60"
                            style={{ 
                              height: `${Math.max(3, value/2)}%`,
                              marginRight: idx % 3 === 0 ? '1px' : '0'
                            }}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Empty state for tracks */}
                {track.regions.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                    <Music2 className="h-6 w-6 mb-1" />
                    <p className="text-xs">Drop or record audio</p>
                  </div>
                )}
              </div>
            ))}
            
            {/* Empty state for no tracks */}
            {project.tracks.length === 0 && (
              <div className="h-40 flex items-center justify-center text-zinc-500 bg-zinc-900">
                <div className="text-center">
                  <Music className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                  <p>Click "Add Track" to get started</p>
                  <Button
                    className="mt-4"
                    onClick={() => addTrack('vocal')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Vocal Track
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Effect Panel / Mixer */}
        <div 
          className={`border-l border-zinc-800 overflow-hidden ${
            activeSidePanel ? 'w-80' : 'w-0'
          } transition-width duration-300`}
        >
          {activeSidePanel === 'mixer' && (
            <div className="h-full flex flex-col bg-zinc-950">
              <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase text-zinc-400">Mixer</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setActiveSidePanel(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3">
                {selectedTrack ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-1 h-8 rounded-full" 
                        style={{ background: selectedTrack.color }}
                      ></div>
                      <div>
                        <h3 className="font-medium">{selectedTrack.name}</h3>
                        <div className="flex items-center mt-0.5">
                          <Badge variant="outline" className="text-[10px] py-0 px-1 h-4 border-zinc-700 text-zinc-400">
                            {selectedTrack.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs">Volume</Label>
                          <span className="text-xs">{selectedTrack.volume}%</span>
                        </div>
                        <Slider 
                          value={[selectedTrack.volume]} 
                          min={0} 
                          max={100} 
                          step={1}
                          onValueChange={(v) => changeVolume(selectedTrack.id, v[0])}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs">Pan</Label>
                          <span className="text-xs">{selectedTrack.pan === 0 ? 'C' : selectedTrack.pan < 0 ? `${selectedTrack.pan}L` : `${selectedTrack.pan}R`}</span>
                        </div>
                        <Slider 
                          value={[selectedTrack.pan + 100]} 
                          min={0} 
                          max={200} 
                          step={1}
                          onValueChange={(v) => changePan(selectedTrack.id, v[0] - 100)}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 pb-2 border-t border-zinc-800">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Zap className="h-4 w-4 mr-1 text-purple-400" />
                        Effects
                      </h3>
                      
                      {selectedTrack.effects.length > 0 ? (
                        <div className="space-y-2">
                          {selectedTrack.effects.map(effect => (
                            <div 
                              key={effect.id}
                              className={`p-2 rounded-md border ${effect.isLuxury ? 
                                'border-purple-800 bg-purple-950/20' : 
                                'border-zinc-800 bg-zinc-900'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {effect.isLuxury && (
                                    <Crown className="h-3 w-3 text-amber-400 mr-1" />
                                  )}
                                  <span className="font-medium text-sm">{effect.name}</span>
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  <Switch 
                                    checked={effect.isActive}
                                    onCheckedChange={() => toggleEffect(selectedTrack.id, effect.id)}
                                    className="data-[state=checked]:bg-purple-600"
                                  />
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => setSelectedEffectId(effect.id)}
                                  >
                                    <Settings className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-zinc-500 text-sm">
                          <p>No effects added yet</p>
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 bg-zinc-900 border-zinc-800"
                        onClick={() => setShowEffectBrowser(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Effect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-zinc-500">
                    <p>Select a track to view mixer settings</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeSidePanel === 'autoPitch' && (
            <div className="h-full flex flex-col bg-zinc-950">
              <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase flex items-center">
                  <Crown className="h-3 w-3 text-amber-400 mr-1" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">BallTalk™ AutoPitch</span>
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setActiveSidePanel(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3">
                {selectedTrack?.type === 'vocal' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Enable AutoPitch</span>
                      <Switch 
                        checked={autoPitchEnabled}
                        onCheckedChange={(checked) => updateAutoPitchSettings(selectedHarmonyStyle, checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-xs block">Harmony Style</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {harmonyStyles.map(style => (
                          <div 
                            key={style.id}
                            className={`relative p-2 rounded-lg border flex flex-col items-center justify-center cursor-pointer ${
                              selectedHarmonyStyle === style.id
                                ? 'bg-purple-950/30 border-purple-500'
                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                            }`}
                            onClick={() => updateAutoPitchSettings(style.id, autoPitchEnabled)}
                          >
                            {style.isPremium && (
                              <Crown className="absolute top-1 right-1 h-3 w-3 text-amber-400" />
                            )}
                            <span className="text-xl mb-1">{style.icon}</span>
                            <span className="text-xs text-center">{style.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs">Amount</Label>
                          <span className="text-xs">{autoPitchAmount}%</span>
                        </div>
                        <Slider 
                          value={[autoPitchAmount]} 
                          min={0} 
                          max={100} 
                          step={1}
                          onValueChange={(v) => setAutoPitchAmount(v[0])}
                          className="data-[state=active]:bg-purple-400"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs">Formant</Label>
                          <span className="text-xs">{autoPitchFormant > 0 ? `+${autoPitchFormant}` : autoPitchFormant}</span>
                        </div>
                        <Slider 
                          value={[autoPitchFormant + 12]} 
                          min={0} 
                          max={24} 
                          step={1}
                          onValueChange={(v) => setAutoPitchFormant(v[0] - 12)}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2 space-y-3">
                      <Label className="text-xs block">Key</Label>
                      <div className="grid grid-cols-7 gap-1">
                        {musicalNotes.slice(0, 7).map(note => (
                          <button 
                            key={note}
                            className={`p-2 h-9 w-9 rounded-full flex items-center justify-center ${
                              selectedKey === note 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                            onClick={() => setSelectedKey(note)}
                          >
                            {note}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 pb-2 border-t border-zinc-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Sparkles className="h-4 w-4 mr-1 text-purple-400" />
                          <Label>AI Voice Layering</Label>
                        </div>
                        <Switch 
                          checked={aiVoiceLayering}
                          onCheckedChange={setAiVoiceLayering}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Add AI-generated harmonies to your voice
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-zinc-500">
                    <div className="text-center">
                      <p>Select a vocal track to use AutoPitch</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => addTrack('vocal')}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Vocal Track
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Toolbar */}
      <div className="h-12 bg-gradient-to-r from-zinc-900 to-zinc-950 border-t border-zinc-800 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${activeSidePanel === 'mixer' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                  onClick={() => setActiveSidePanel(activeSidePanel === 'mixer' ? null : 'mixer')}
                >
                  <Sliders className="h-4 w-4 mr-1" />
                  Mixer
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show/Hide Mixer Panel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${activeSidePanel === 'autoPitch' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                  onClick={() => setActiveSidePanel(activeSidePanel === 'autoPitch' ? null : 'autoPitch')}
                >
                  <span className="flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-purple-400" />
                    AutoPitch
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show/Hide AutoPitch Controls</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label className="text-xs text-zinc-400 mr-1">Zoom:</Label>
          <Slider 
            value={[zoomLevel]} 
            min={0.5} 
            max={4} 
            step={0.5}
            className="w-32"
            onValueChange={(v) => setZoomLevel(v[0])}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  onClick={() => openAIAssistant('master')}
                >
                  <Sparkles className="h-4 w-4 mr-1 text-purple-400" />
                  AI Master
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Apply AI Mastering</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Your Track</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Dialogs */}
      
      {/* Save Project Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input 
                value={project.title} 
                onChange={(e) => setProject(prev => ({...prev, title: e.target.value}))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea 
                value={project.description || ''} 
                onChange={(e) => setProject(prev => ({...prev, description: e.target.value}))}
                className="bg-zinc-800 border-zinc-700 h-20 resize-none"
                placeholder="Add notes about your project..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Genre</Label>
              <Select
                value={project.genre || ''}
                onValueChange={(value) => setProject(prev => ({...prev, genre: value}))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                  <SelectItem value="Trap">Trap</SelectItem>
                  <SelectItem value="R&B">R&B</SelectItem>
                  <SelectItem value="Pop">Pop</SelectItem>
                  <SelectItem value="Drill">Drill</SelectItem>
                  <SelectItem value="Afrobeat">Afrobeat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center">
              <Label className="flex items-center text-sm">
                <input 
                  type="checkbox" 
                  className="mr-2 rounded bg-zinc-800 border-zinc-700"
                  checked={project.isPublic}
                  onChange={(e) => setProject(prev => ({...prev, isPublic: e.target.checked}))}
                />
                Make this project public
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={saveProject}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Export Project</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-800 border border-zinc-700 hover:border-purple-500 rounded-md p-3 cursor-pointer flex flex-col items-center">
                  <span className="font-bold">WAV</span>
                  <span className="text-xs text-zinc-400 mt-1">Lossless</span>
                </div>
                
                <div className="bg-purple-900/20 border border-purple-500 rounded-md p-3 cursor-pointer flex flex-col items-center">
                  <span className="font-bold">MP3</span>
                  <span className="text-xs text-zinc-400 mt-1">320kbps</span>
                </div>
                
                <div className="bg-zinc-800 border border-zinc-700 hover:border-purple-500 rounded-md p-3 cursor-pointer flex flex-col items-center">
                  <span className="font-bold">STEMS</span>
                  <span className="text-xs text-zinc-400 mt-1">Multi-track</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Quality</Label>
              <Select defaultValue="high">
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High Quality</SelectItem>
                  <SelectItem value="premium">Premium (VIP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Mastering</Label>
              <div className="flex items-center space-x-2">
                <Switch id="apply-mastering" defaultChecked />
                <Label htmlFor="apply-mastering">Apply professional mastering</Label>
              </div>
              <p className="text-xs text-zinc-400">
                Our premium mastering algorithm will enhance the sound quality for distribution.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={() => exportProject('mp3', 'high')}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI Assistant Dialog */}
      <Dialog open={showAIAssistantDialog} onOpenChange={setShowAIAssistantDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
              AI Music Assistant
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>I want to create</Label>
              <Select 
                value={aiSuggestionType}
                onValueChange={setAiSuggestionType}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select what to create" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="melody">Melody</SelectItem>
                  <SelectItem value="chord">Chord Progression</SelectItem>
                  <SelectItem value="drum">Drum Pattern</SelectItem>
                  <SelectItem value="mix">Mix Enhancement</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Describe what you want</Label>
              <Textarea 
                value={aiQueryText}
                onChange={(e) => setAiQueryText(e.target.value)}
                className="bg-zinc-800 border-zinc-700 h-24 resize-none"
                placeholder={`Describe the ${aiSuggestionType} you want to create...`}
              />
            </div>
            
            <div className="flex space-x-2">
              <div className="flex-1 p-2 bg-zinc-800 rounded-md">
                <span className="block text-xs text-zinc-400">Project Key</span>
                <span className="font-medium">{project.key}</span>
              </div>
              
              <div className="flex-1 p-2 bg-zinc-800 rounded-md">
                <span className="block text-xs text-zinc-400">BPM</span>
                <span className="font-medium">{project.bpm}</span>
              </div>
              
              <div className="flex-1 p-2 bg-zinc-800 rounded-md">
                <span className="block text-xs text-zinc-400">Time Signature</span>
                <span className="font-medium">{project.timeSignature}</span>
              </div>
            </div>
            
            {aiSuggestions.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Recent Suggestions</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {aiSuggestions.map(suggestion => (
                    <div 
                      key={suggestion.id}
                      className="p-2 bg-zinc-800 rounded-md flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <span className="mr-2">
                          {suggestion.type === 'melody' && '🎵'}
                          {suggestion.type === 'chord' && '🎹'}
                          {suggestion.type === 'drum' && '🥁'}
                          {suggestion.type === 'mix' && '🎚️'}
                          {suggestion.type === 'master' && '💿'}
                        </span>
                        <span className="text-sm">{suggestion.description}</span>
                      </div>
                      
                      {suggestion.applied ? (
                        <Badge className="bg-purple-600">Applied</Badge>
                      ) : (
                        <Button 
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 bg-purple-900/30 border-purple-700 hover:bg-purple-800/50"
                          onClick={() => applyAISuggestion(suggestion.id)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIAssistantDialog(false)}>Cancel</Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={generateAISuggestion}
              disabled={isGeneratingAI || !aiQueryText.trim()}
            >
              {isGeneratingAI ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Effect Browser Dialog */}
      <Dialog open={showEffectBrowser} onOpenChange={setShowEffectBrowser}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Add Effect</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {studioEffects.map(effect => (
                <div 
                  key={effect.id}
                  className={`p-3 rounded-md border cursor-pointer ${
                    effect.isLuxury ? 
                      'border-purple-800 bg-purple-950/20' : 
                      'border-zinc-800 bg-zinc-800 hover:border-zinc-700'
                  }`}
                  onClick={() => {
                    if (selectedTrackId) {
                      addEffectToTrack(selectedTrackId, effect.id);
                      setShowEffectBrowser(false);
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {effect.icon}
                    <div>
                      <div className="flex items-center">
                        {effect.isLuxury && (
                          <Crown className="h-3 w-3 text-amber-400 mr-1" />
                        )}
                        <span className="font-medium">{effect.name}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{effect.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEffectBrowser(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Add Collaborators</Label>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Enter username or email"
                  className="flex-1 bg-zinc-800 border-zinc-700"
                />
                <Button variant="outline">Invite</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Project Link</Label>
              <div className="flex space-x-2">
                <Input 
                  value="https://balltalk.studio/project/123456"
                  readOnly
                  className="flex-1 bg-zinc-800 border-zinc-700"
                />
                <Button variant="outline">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-zinc-400">
                This link will only work for people you've invited.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Current Collaborators</Label>
              <div className="space-y-2">
                <div className="p-2 bg-zinc-800 rounded-md flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                        U
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{user?.username || 'You'}</div>
                      <div className="text-xs text-purple-400">Owner</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <Label className="flex items-center text-sm">
                <input 
                  type="checkbox" 
                  className="mr-2 rounded bg-zinc-800 border-zinc-700"
                  checked={project.isPublic}
                  onChange={(e) => setProject(prev => ({...prev, isPublic: e.target.checked}))}
                />
                Make this project public
              </Label>
              <p className="text-xs text-zinc-400 mt-1 ml-5">
                Anyone can listen, but only collaborators can edit.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>Cancel</Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={() => {
                toast({
                  title: "Invitation Sent",
                  description: "Your collaborators will receive an invitation."
                });
                setShowShareDialog(false);
              }}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Studio Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className={`flex-1 ${studioTheme === 'dark' ? 'bg-zinc-800 border-purple-500' : 'bg-zinc-800 border-zinc-700'}`}
                  onClick={() => setStudioTheme('dark')}
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Dark
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 ${studioTheme === 'midnight' ? 'bg-zinc-800 border-purple-500' : 'bg-zinc-800 border-zinc-700'}`}
                  onClick={() => setStudioTheme('midnight')}
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Midnight
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>UI Scale</Label>
              <Slider 
                value={[uiScale * 100]} 
                min={80} 
                max={120} 
                step={5}
                onValueChange={(v) => setUiScale(v[0] / 100)}
              />
              <div className="flex justify-between text-xs text-zinc-400">
                <span>80%</span>
                <span>100%</span>
                <span>120%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Visualization Mode</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className={`flex-1 ${visualizationMode === 'waveform' ? 'bg-zinc-800 border-purple-500' : 'bg-zinc-800 border-zinc-700'}`}
                  onClick={() => setVisualizationMode('waveform')}
                >
                  <Music2 className="h-4 w-4 mr-1" />
                  Waveform
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 ${visualizationMode === 'blocks' ? 'bg-zinc-800 border-purple-500' : 'bg-zinc-800 border-zinc-700'}`}
                  onClick={() => setVisualizationMode('blocks')}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Blocks
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Input Monitoring</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Monitor input during recording</span>
                <Switch 
                  checked={inputMonitoring}
                  onCheckedChange={setInputMonitoring}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Effect Settings Dialog */}
      {selectedTrack && selectedEffectId && (
        <Dialog 
          open={!!selectedEffectId} 
          onOpenChange={(open) => !open && setSelectedEffectId(null)}
        >
          <DialogContent className="bg-zinc-900 border-zinc-700">
            <DialogHeader>
              <DialogTitle>
                {selectedTrack.effects.find(e => e.id === selectedEffectId)?.name || 'Effect Settings'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Render different controls based on effect type */}
              {selectedTrack.effects.find(e => e.id === selectedEffectId)?.type === 'dynamicEQ' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Low Gain</Label>
                      <span className="text-xs">
                        {selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.low || 0} dB
                      </span>
                    </div>
                    <Slider 
                      value={[Number(selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.low || 0) + 12]} 
                      min={0} 
                      max={24} 
                      step={0.5}
                      onValueChange={(v) => {
                        const effect = selectedTrack.effects.find(e => e.id === selectedEffectId);
                        if (effect) {
                          updateEffect(selectedTrack.id, effect.id, {
                            parameters: {
                              ...effect.parameters,
                              low: v[0] - 12
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Mid Gain</Label>
                      <span className="text-xs">
                        {selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.mid || 0} dB
                      </span>
                    </div>
                    <Slider 
                      value={[Number(selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.mid || 0) + 12]} 
                      min={0} 
                      max={24} 
                      step={0.5}
                      onValueChange={(v) => {
                        const effect = selectedTrack.effects.find(e => e.id === selectedEffectId);
                        if (effect) {
                          updateEffect(selectedTrack.id, effect.id, {
                            parameters: {
                              ...effect.parameters,
                              mid: v[0] - 12
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">High Gain</Label>
                      <span className="text-xs">
                        {selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.high || 0} dB
                      </span>
                    </div>
                    <Slider 
                      value={[Number(selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.high || 0) + 12]} 
                      min={0} 
                      max={24} 
                      step={0.5}
                      onValueChange={(v) => {
                        const effect = selectedTrack.effects.find(e => e.id === selectedEffectId);
                        if (effect) {
                          updateEffect(selectedTrack.id, effect.id, {
                            parameters: {
                              ...effect.parameters,
                              high: v[0] - 12
                            }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
              {selectedTrack.effects.find(e => e.id === selectedEffectId)?.type === 'stadiumVerb' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Size</Label>
                      <span className="text-xs">
                        {(selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.size || 0) * 100}%
                      </span>
                    </div>
                    <Slider 
                      value={[(selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.size || 0) * 100]} 
                      min={0} 
                      max={100} 
                      step={1}
                      onValueChange={(v) => {
                        const effect = selectedTrack.effects.find(e => e.id === selectedEffectId);
                        if (effect) {
                          updateEffect(selectedTrack.id, effect.id, {
                            parameters: {
                              ...effect.parameters,
                              size: v[0] / 100
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Decay</Label>
                      <span className="text-xs">
                        {selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.decay || 0} s
                      </span>
                    </div>
                    <Slider 
                      value={[selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.decay || 0]} 
                      min={0.1} 
                      max={10} 
                      step={0.1}
                      onValueChange={(v) => {
                        const effect = selectedTrack.effects.find(e => e.id === selectedEffectId);
                        if (effect) {
                          updateEffect(selectedTrack.id, effect.id, {
                            parameters: {
                              ...effect.parameters,
                              decay: v[0]
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Mix</Label>
                      <span className="text-xs">
                        {selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.wet || 0}%
                      </span>
                    </div>
                    <Slider 
                      value={[selectedTrack.effects.find(e => e.id === selectedEffectId)?.parameters.wet || 0]} 
                      min={0} 
                      max={100} 
                      step={1}
                      onValueChange={(v) => {
                        const effect = selectedTrack.effects.find(e => e.id === selectedEffectId);
                        if (effect) {
                          updateEffect(selectedTrack.id, effect.id, {
                            parameters: {
                              ...effect.parameters,
                              wet: v[0],
                              dry: 100 - v[0]
                            }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* For other effect types, show generic parameters */}
              {!['dynamicEQ', 'stadiumVerb'].includes(selectedTrack.effects.find(e => e.id === selectedEffectId)?.type || '') && (
                <div className="h-40 flex items-center justify-center">
                  <p className="text-zinc-400">Settings will appear here</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  if (selectedTrack && selectedEffectId) {
                    removeEffect(selectedTrack.id, selectedEffectId);
                    setSelectedEffectId(null);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
              <Button variant="outline" onClick={() => setSelectedEffectId(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PremiumStudio;