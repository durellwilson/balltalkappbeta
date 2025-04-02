import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { 
  Mic, 
  Music, 
  Save, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  Square, 
  SkipBack,
  Sliders,
  Settings,
  Disc,
  Wand2,
  LayoutGrid,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import audioProcessor from '@/lib/audioProcessor';
import { ArrangementView, AudioRegion, Track } from '@/components/studio/arrangement-view';
import { RecordingControls } from '@/components/studio/recording-controls';
import { EffectsPanel } from '@/components/studio/effects-panel';
import { MasteringPanel } from '@/components/studio/mastering-panel';
import { AIGenerationPanel } from '@/components/studio/ai-generation-panel';
import { FileUploadModal } from '@/components/studio/file-upload-modal';

// Types
interface Project {
  id: string;
  name: string;
  bpm: number;
  createdAt: string;
  updatedAt: string;
}

interface Effect {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

const ModernStudio: React.FC = () => {
  // State
  const [project, setProject] = useState<Project>({
    id: 'demo-1',
    name: 'My Project',
    bpm: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [tracks, setTracks] = useState<Track[]>([]);
  const [regions, setRegions] = useState<AudioRegion[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // 2 minutes of timeline by default
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [trackEffects, setTrackEffects] = useState<Record<number, Effect[]>>({});
  const [masterEffects, setMasterEffects] = useState<Effect[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [audioInputLevel, setAudioInputLevel] = useState(0);
  const [audioOutputLevel, setAudioOutputLevel] = useState(0);
  const [microphoneAccess, setMicrophoneAccess] = useState(false);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [inputGain, setInputGain] = useState(100);
  const [overlapRecording, setOverlapRecording] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [rightPanelTab, setRightPanelTab] = useState<'effects' | 'master' | 'ai'>('effects');
  
  // Refs
  const recordingTimerRef = useRef<number | null>(null);
  const inputLevelIntervalRef = useRef<number | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Initialize audio engine
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Initialize audio processor
        if (!audioProcessor.isInitialized()) {
          await audioProcessor.initialize();
          
          // Configure settings
          audioProcessor.setBpm(project.bpm);
          
          toast({
            title: "Audio Engine Initialized",
            description: "The audio engine is ready to use."
          });
          
          // Create demo tracks
          const demoTracks: Track[] = [
            {
              id: 1,
              name: 'Vocals',
              type: 'vocal',
              volume: 0.8,
              pan: 0,
              isMuted: false,
              isSoloed: false,
              isArmed: true,
            },
            {
              id: 2,
              name: 'Guitar',
              type: 'instrument',
              volume: 0.7,
              pan: -0.3,
              isMuted: false,
              isSoloed: false,
              isArmed: false,
            },
            {
              id: 3,
              name: 'Drums',
              type: 'drum',
              volume: 0.75,
              pan: 0.1,
              isMuted: false,
              isSoloed: false,
              isArmed: false,
            }
          ];
          
          // Add tracks to audio processor
          demoTracks.forEach(track => {
            audioProcessor.createTrack(track.id);
          });
          
          setTracks(demoTracks);
          setSelectedTrackId(1);
          
          // Add a sample region
          const demoRegions: AudioRegion[] = [
            {
              id: 'region-1',
              trackId: 2,
              startTime: 4,
              duration: 8,
              name: 'Guitar Loop',
              waveformData: Array.from({ length: 100 }, () => Math.random() * 0.7 + 0.15)
            }
          ];
          
          setRegions(demoRegions);
        }
        
        // Start simulating input level
        startInputLevelSimulation();
        
        // Set up microphone
        checkMicrophoneAccess();
        
        // Enumerate input devices
        enumerateInputDevices();
        
        // Add keyboard shortcuts
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
          stopInputLevelSimulation();
          
          if (recordingTimerRef.current) {
            window.clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        };
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        toast({
          title: "Audio Initialization Error",
          description: "Could not initialize the audio engine.",
          variant: "destructive"
        });
      }
    };
    
    initializeAudio();
  }, []);
  
  // Check for microphone access
  const checkMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream right away, we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      setMicrophoneAccess(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
      setMicrophoneAccess(false);
      
      toast({
        title: "Microphone Access Denied",
        description: "Please grant microphone access for recording.",
        variant: "destructive"
      });
    }
  };
  
  // Get available input devices
  const enumerateInputDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      setInputDevices(audioInputs);
      
      if (audioInputs.length > 0 && !selectedInputDevice) {
        setSelectedInputDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  };
  
  // Simulate input level for demo
  const startInputLevelSimulation = () => {
    // Regularly update input level for visualization
    if (inputLevelIntervalRef.current) return;
    
    inputLevelIntervalRef.current = window.setInterval(() => {
      // Simulate microphone activity with some randomness
      if (isRecording) {
        // Higher, more active levels when recording
        setAudioInputLevel(Math.min(0.8, Math.random() * 0.5 + 0.2));
      } else if (isMonitoring) {
        // Medium levels when monitoring
        setAudioInputLevel(Math.random() * 0.4 + 0.1);
      } else {
        // Low, ambient noise levels when not active
        setAudioInputLevel(Math.random() * 0.1);
      }
      
      // Also update output level
      if (isPlaying) {
        setAudioOutputLevel(Math.min(0.9, Math.random() * 0.6 + 0.2));
      } else {
        setAudioOutputLevel(0);
      }
    }, 100);
  };
  
  // Stop input level simulation
  const stopInputLevelSimulation = () => {
    if (inputLevelIntervalRef.current) {
      window.clearInterval(inputLevelIntervalRef.current);
      inputLevelIntervalRef.current = null;
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Space bar = play/pause
    if (e.code === 'Space' && !e.target) {
      e.preventDefault();
      togglePlayback();
    }
    
    // Escape = stop
    if (e.code === 'Escape') {
      handleStop();
      
      if (isRecording) {
        handleStopRecording();
      }
    }
  }, [isPlaying, isRecording]);
  
  // Handle playback transport controls
  const togglePlayback = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };
  
  const handlePlay = () => {
    setIsPlaying(true);
    
    // In a real implementation, would call audioProcessor.play()
    toast({
      description: "Playback started"
    });
  };
  
  const handlePause = () => {
    setIsPlaying(false);
    
    // In a real implementation, would call audioProcessor.pause()
    toast({
      description: "Playback paused"
    });
  };
  
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    
    // In a real implementation, would call audioProcessor.stop()
    toast({
      description: "Playback stopped"
    });
  };
  
  // Handle recording controls
  const handleRecord = () => {
    if (!microphoneAccess) {
      toast({
        title: "Microphone Access Required",
        description: "Please grant microphone access to record audio.",
        variant: "destructive"
      });
      return;
    }
    
    setIsRecording(true);
    
    // Start playback if overlap recording is enabled
    if (overlapRecording && !isPlaying) {
      setIsPlaying(true);
    }
    
    // Start recording timer
    setRecordingTime(0);
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 0.1);
    }, 100);
    
    toast({
      title: "Recording Started",
      description: "Recording to armed tracks."
    });
  };
  
  const handleStopRecording = () => {
    setIsRecording(false);
    
    // Stop recording timer
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // In a real implementation, this would process the recorded audio
    // and create new regions on the armed tracks
    
    // Simulate creating a new region on an armed track
    const armedTracks = tracks.filter(track => track.isArmed);
    if (armedTracks.length > 0) {
      const firstArmedTrack = armedTracks[0];
      
      const newRegion: AudioRegion = {
        id: `region-${Date.now()}`,
        trackId: firstArmedTrack.id,
        startTime: overlapRecording ? currentTime : 0,
        duration: recordingTime,
        name: `Recording ${new Date().toLocaleTimeString()}`,
        waveformData: Array.from({ length: 100 }, () => Math.random() * 0.7 + 0.15)
      };
      
      setRegions(prev => [...prev, newRegion]);
      
      toast({
        title: "Recording Finished",
        description: `Added new recording to ${firstArmedTrack.name}`
      });
    }
  };
  
  // Handle timeline/transport time change
  const handleTimeChange = (time: number) => {
    setCurrentTime(time);
  };
  
  // Update time during playback
  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setCurrentTime(prev => {
          // Handle looping or stopping at the end
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
      
      return () => clearInterval(timer);
    }
  }, [isPlaying, duration]);
  
  // Handle track operations
  const handleTrackAdd = (type: string = 'audio') => {
    const newId = Math.max(...tracks.map(t => t.id), 0) + 1;
    
    const trackNames: Record<string, string> = {
      'audio': 'Audio',
      'vocal': 'Vocals',
      'instrument': 'Instrument',
      'drum': 'Drums'
    };
    
    const newTrack: Track = {
      id: newId,
      name: `${trackNames[type] || 'Track'} ${newId}`,
      type: type as any,
      volume: 0.8,
      pan: 0,
      isMuted: false,
      isSoloed: false,
      isArmed: false
    };
    
    setTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(newId);
    
    // In a real implementation, would also create the track in audioProcessor
    audioProcessor.createTrack(newId);
    
    toast({
      description: `Added new ${type} track`
    });
  };
  
  const handleTrackDelete = (trackId: number) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    
    // Also remove any regions on this track
    setRegions(prev => prev.filter(r => r.trackId !== trackId));
    
    // If the deleted track was selected, clear selection
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }
    
    // In a real implementation, would also remove the track from audioProcessor
    audioProcessor.removeTrack(trackId);
    
    toast({
      description: "Track removed"
    });
  };
  
  const handleTrackArmToggle = (trackId: number, armed: boolean) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, isArmed: armed } : t
    ));
  };
  
  const handleTrackMuteToggle = (trackId: number, muted: boolean) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, isMuted: muted } : t
    ));
    
    // In a real implementation, would also update the track in audioProcessor
    const track = audioProcessor.getTrack(trackId);
    if (track) {
      track.setMuted(muted);
    }
  };
  
  const handleTrackSoloToggle = (trackId: number, soloed: boolean) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, isSoloed: soloed } : t
    ));
    
    // In a real implementation, would also update the track in audioProcessor
    const track = audioProcessor.getTrack(trackId);
    if (track) {
      track.setSolo(soloed);
    }
  };
  
  const handleTrackVolumeChange = (trackId: number, volume: number) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, volume } : t
    ));
    
    // In a real implementation, would also update the track in audioProcessor
    const track = audioProcessor.getTrack(trackId);
    if (track) {
      track.setVolume(volume);
    }
  };
  
  const handleTrackPanChange = (trackId: number, pan: number) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, pan } : t
    ));
    
    // In a real implementation, would also update the track in audioProcessor
    const track = audioProcessor.getTrack(trackId);
    if (track) {
      track.setPan(pan);
    }
  };
  
  // Handle region operations
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
    setRegions(prev => prev.map(r => 
      r.id === regionId 
        ? { ...r, trackId, startTime } 
        : r
    ));
  };
  
  const handleRegionResize = (regionId: string, startTime: number, duration: number) => {
    setRegions(prev => prev.map(r => 
      r.id === regionId 
        ? { ...r, startTime, duration } 
        : r
    ));
  };
  
  const handleRegionCopy = (regionId: string) => {
    const regionToCopy = regions.find(r => r.id === regionId);
    if (!regionToCopy) return;
    
    const newRegion: AudioRegion = {
      ...regionToCopy,
      id: `region-${Date.now()}`,
      startTime: regionToCopy.startTime + regionToCopy.duration, // Place after the original
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
    if (splitTime <= regionToSplit.startTime || splitTime >= regionToSplit.startTime + regionToSplit.duration) {
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
      duration: splitTime - regionToSplit.startTime
    };
    
    const secondRegion: AudioRegion = {
      ...regionToSplit,
      id: `region-${Date.now()}-b`,
      startTime: splitTime,
      duration: regionToSplit.startTime + regionToSplit.duration - splitTime
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
  
  // Handle file upload
  const handleFileUpload = async (files: File[]): Promise<boolean> => {
    try {
      if (files.length === 0) return false;
      
      for (const file of files) {
        // Create a new track for each file if needed
        let targetTrackId = selectedTrackId;
        
        if (!targetTrackId) {
          // Create a new track
          const newId = Math.max(...tracks.map(t => t.id), 0) + 1;
          
          const newTrack: Track = {
            id: newId,
            name: file.name.split('.')[0] || `Audio ${newId}`,
            type: 'audio',
            volume: 0.8,
            pan: 0,
            isMuted: false,
            isSoloed: false,
            isArmed: false
          };
          
          setTracks(prev => [...prev, newTrack]);
          targetTrackId = newId;
          
          // Create track in audio processor
          audioProcessor.createTrack(newId);
        }
        
        // Create a region for the file
        const newRegion: AudioRegion = {
          id: `region-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          trackId: targetTrackId,
          startTime: currentTime,
          duration: 10, // Placeholder, would be calculated from audio file in real implementation
          name: file.name.split('.')[0] || 'Imported Audio',
          // Generate placeholder waveform data
          waveformData: Array.from({ length: 100 }, () => Math.random() * 0.7 + 0.15)
        };
        
        setRegions(prev => [...prev, newRegion]);
        
        // In a real implementation, would load the audio file into the track in audioProcessor
        // and calculate the actual duration
        const track = audioProcessor.getTrack(targetTrackId);
        if (track) {
          await track.loadAudioFile(file);
        }
      }
      
      toast({
        title: "Files Imported",
        description: `${files.length} audio ${files.length === 1 ? 'file' : 'files'} imported`
      });
      
      return true;
    } catch (error) {
      console.error("Failed to import audio files:", error);
      toast({
        title: "Import Error",
        description: "Failed to import audio files",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Handle monitor toggle
  const handleMonitorToggle = (enabled: boolean) => {
    setIsMonitoring(enabled);
    
    // In a real implementation, would enable/disable input monitoring in audioProcessor
    if (enabled) {
      toast({
        description: "Input monitoring enabled"
      });
    }
  };
  
  // Handle effects changes
  const handleTrackEffectsChange = (effects: Effect[]) => {
    if (!selectedTrackId) return;
    
    setTrackEffects(prev => ({
      ...prev,
      [selectedTrackId]: effects
    }));
    
    // In a real implementation, would update effects in audioProcessor
  };
  
  const handleMasterEffectsChange = (effects: Effect[]) => {
    setMasterEffects(effects);
    
    // In a real implementation, would update master effects in audioProcessor
  };
  
  // Save project
  const handleSaveProject = () => {
    const savedTime = new Date();
    
    setProject(prev => ({
      ...prev,
      updatedAt: savedTime.toISOString()
    }));
    
    toast({
      title: "Project Saved",
      description: `Last saved at ${savedTime.toLocaleTimeString()}`
    });
  };
  
  // Format the relative save time
  const formatSaveTime = (): string => {
    const now = new Date();
    const saved = new Date(project.updatedAt);
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    return `${diffMins} mins ago`;
  };
  
  // Render the component
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
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
              className="bg-transparent border-none text-lg font-medium h-8 p-0 focus-visible:ring-0"
            />
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>Last saved: {formatSaveTime()}</span>
              <Badge variant="outline" className="text-emerald-400 border-emerald-800 bg-emerald-950/20">
                120 BPM
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 h-9"
            onClick={() => setCurrentTime(0)}
          >
            <SkipBack size={16} />
          </Button>
          
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="sm"
            className={`h-9 ${isRecording ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'}`}
            onClick={isRecording ? handleStopRecording : handleRecord}
            disabled={!microphoneAccess || tracks.filter(t => t.isArmed).length === 0}
          >
            {isRecording ? (
              <>
                <Square size={14} className="mr-1" />
                Stop
              </>
            ) : (
              <>
                <Mic size={14} className="mr-1" />
                Record
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 h-9"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <>
                <Pause size={16} className="mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play size={16} className="mr-1" />
                Play
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 h-9"
            onClick={handleStop}
          >
            <Square size={16} />
          </Button>
          
          <div className="h-9 flex items-center border-l border-gray-800 pl-3 ml-1">
            <span className="font-mono text-sm">
              {/* Format current time as MM:SS.ms */}
              {`${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}.${Math.floor((currentTime % 1) * 100).toString().padStart(2, '0')}`}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-gray-800 border-gray-700"
            onClick={handleSaveProject}
          >
            <Save size={16} className="mr-1" />
            Save
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-gray-800 border-gray-700"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload size={16} className="mr-1" />
            Import
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-gray-800 border-gray-700"
          >
            <Download size={16} className="mr-1" />
            Export
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex">
        {/* Main workspace */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Arrangement view */}
          <div className="flex-1 overflow-hidden">
            <ArrangementView
              tracks={tracks}
              regions={regions}
              currentTime={currentTime}
              duration={duration}
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
              onTrackArmToggle={handleTrackArmToggle}
              onTrackAdd={() => handleTrackAdd('audio')}
              onTrackDelete={handleTrackDelete}
              onZoomChange={setZoom}
              zoom={zoom}
              selectedTrackId={selectedTrackId}
              onTrackSelect={setSelectedTrackId}
            />
          </div>
        </div>
        
        {/* Right sidebar */}
        <div className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col">
          <Tabs 
            value={rightPanelTab} 
            onValueChange={(value) => setRightPanelTab(value as any)}
            className="flex-1 flex flex-col"
          >
            <div className="p-2 border-b border-gray-800">
              <TabsList className="w-full bg-gray-800">
                <TabsTrigger value="effects" className="flex-1">
                  <Sliders size={14} className="mr-1" />
                  Effects
                </TabsTrigger>
                <TabsTrigger value="master" className="flex-1">
                  <Disc size={14} className="mr-1" />
                  Master
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex-1">
                  <Wand2 size={14} className="mr-1" />
                  AI
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="effects" className="flex-1 p-0 m-0 overflow-y-auto">
              <div className="p-3">
                <EffectsPanel
                  trackId={selectedTrackId || undefined}
                  trackName={selectedTrackId ? tracks.find(t => t.id === selectedTrackId)?.name : undefined}
                  trackType={selectedTrackId ? tracks.find(t => t.id === selectedTrackId)?.type : undefined}
                  effects={selectedTrackId ? trackEffects[selectedTrackId] || [] : []}
                  onEffectsChange={handleTrackEffectsChange}
                  inputLevel={audioInputLevel}
                  outputLevel={audioOutputLevel}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="master" className="flex-1 p-0 m-0 overflow-y-auto">
              <div className="p-3">
                <MasteringPanel
                  onEffectsChange={handleMasterEffectsChange}
                  inputLevel={audioOutputLevel}
                  outputLevel={audioOutputLevel}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="flex-1 p-0 m-0 overflow-y-auto">
              <div className="p-3">
                <AIGenerationPanel
                  onGenerateAudio={(blob, settings) => {
                    toast({
                      title: "AI Generation Complete",
                      description: "Audio generated successfully"
                    });
                    return;
                  }}
                  onAddToProject={(blob, settings) => {
                    // Create a region for the generated audio
                    if (selectedTrackId) {
                      const newRegion: AudioRegion = {
                        id: `region-${Date.now()}-ai`,
                        trackId: selectedTrackId,
                        startTime: currentTime,
                        duration: 20, // Placeholder, would be from actual audio
                        name: `AI Generated ${settings.type || 'Audio'}`,
                        waveformData: Array.from({ length: 100 }, () => Math.random() * 0.7 + 0.15)
                      };
                      
                      setRegions(prev => [...prev, newRegion]);
                      
                      toast({
                        title: "Added to Project",
                        description: "AI generated audio added to track"
                      });
                    }
                  }}
                  apiKeyAvailable={true}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Bottom recording panel */}
          <div className="p-3 border-t border-gray-800">
            <RecordingControls
              isRecording={isRecording}
              isPlaying={isPlaying}
              targetTrackId={selectedTrackId}
              tracks={tracks.map(t => ({
                id: t.id,
                name: t.name,
                type: t.type,
                isArmed: t.isArmed || false,
                isMuted: t.isMuted,
                isSoloed: t.isSoloed
              }))}
              onRecord={handleRecord}
              onStopRecording={handleStopRecording}
              onArmTrack={handleTrackArmToggle}
              onTrackSelect={setSelectedTrackId}
              onAddTrack={handleTrackAdd}
              audioInputLevel={audioInputLevel}
              timeElapsed={recordingTime}
              microphoneAccess={microphoneAccess}
              onMonitorToggle={handleMonitorToggle}
              isMonitoring={isMonitoring}
              inputDevices={inputDevices}
              selectedInputDevice={selectedInputDevice}
              onInputDeviceChange={setSelectedInputDevice}
              onInputGainChange={setInputGain}
              inputGain={inputGain}
              overlapRecording={overlapRecording}
              onOverlapRecordingToggle={setOverlapRecording}
            />
          </div>
        </div>
      </div>
      
      {/* File upload modal */}
      <FileUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onUpload={handleFileUpload}
        title="Import Audio Files"
        description="Upload audio files to add to your project. Supported formats: .mp3, .wav, .aiff, .m4a"
        allowMultiple={true}
      />
    </div>
  );
};

export default ModernStudio;