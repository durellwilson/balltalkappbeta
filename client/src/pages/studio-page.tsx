import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { EnhancedProjectEditor } from '@/components/studio/enhanced-project-editor';
import { RecordingControls } from '@/components/studio/recording-controls';
import { EffectsPanel } from '@/components/studio/effects-panel';
import { MasteringPanel } from '@/components/studio/mastering-panel';
import { FileUploadModal } from '@/components/studio/file-upload-modal';
import { useStudioCollaboration } from '@/hooks/use-studio-collaboration';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic,
  Play,
  Pause,
  Square,
  Save,
  Download,
  Upload,
  Settings,
  Users,
  Music,
  Sliders,
  Volume2,
  VolumeX,
  Plus,
  X,
  Wand2,
  Crown,
  Sparkles,
  Clock,
  Share2
} from 'lucide-react';

// Define types
interface Track {
  id: number;
  name: string;
  type: 'audio' | 'vocal' | 'midi' | 'beat';
  volume: number;
  pan: number;
  isMuted: boolean;
  isSoloed: boolean;
  effects: Effect[];
  color: string;
  waveformData?: number[];
}

interface Effect {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  isLuxury?: boolean;
  parameters: Record<string, any>;
}

interface Project {
  id: number;
  title: string;
  bpm: number;
  key: string;
  timeSignature: string;
  tracks: Track[];
  masterEffects: Effect[];
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Available effects with premium options
const studioEffects = [
  { id: 'autoPitch', name: 'BallTalk™ AutoPitch', icon: <Sparkles className="h-4 w-4" />, isLuxury: true },
  { id: 'stadiumVerb', name: 'Stadium Reverb', icon: <Crown className="h-4 w-4" />, isLuxury: true },
  { id: 'compressor', name: 'Compressor', icon: <Sliders className="h-4 w-4" /> },
  { id: 'eq', name: 'EQ', icon: <Settings className="h-4 w-4" /> }
];

// Track colors for visual organization
const trackColors = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-amber-600',
  'bg-emerald-600'
];

export default function StudioPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();

  // Core state
  const [project, setProject] = useState<Project | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [showEffectsDialog, setShowEffectsDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCollabDialog, setShowCollabDialog] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);
  const [recordingTime, setRecordingTime] = useState(0);

  // Initialize collaboration features
  const collaboration = useStudioCollaboration({
    projectId: project?.id.toString() || '',
    userId: user?.id.toString() || '',
    username: user?.username || '',
    onUserJoin: (user) => {
      toast({ description: `${user.name} joined the studio` });
    },
    onUserLeave: (user) => {
      toast({ description: `${user.name} left the studio` });
    }
  });

  // Initialize audio engine
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Tone.start();
        toast({
          title: "Audio Engine Ready",
          description: "You can now play and record audio"
        });
      } catch (err) {
        console.error("Failed to initialize audio:", err);
        toast({
          title: "Audio Error",
          description: "Could not initialize audio engine",
          variant: "destructive"
        });
      }
    };

    initAudio();
  }, []);

  // Load project data
  const { data: projectData } = useQuery({
    queryKey: ['project', params.projectId],
    queryFn: async () => {
      if (!params.projectId) return null;
      const res = await fetch(`/api/studio/projects/${params.projectId}`);
      if (!res.ok) throw new Error('Failed to load project');
      return res.json();
    },
    enabled: !!params.projectId
  });

  // Update project when data changes
  useEffect(() => {
    if (projectData) {
      setProject(projectData);
    } else {
      // Create new project if none exists
      setProject({
        id: Date.now(),
        title: 'New Project',
        bpm: 120,
        key: 'C',
        timeSignature: '4/4',
        tracks: [],
        masterEffects: [],
        collaborators: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }, [projectData]);

  // Playback controls
  const togglePlayback = () => {
    if (isPlaying) {
      Tone.Transport.pause();
    } else {
      Tone.Transport.start();
    }
    setIsPlaying(!isPlaying);
  };

  // Recording controls
  const startRecording = async () => {
    if (!selectedTrackId) {
      toast({
        title: "No Track Selected",
        description: "Please select a track to record to",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Set up recording with Web Audio API...
      setIsRecording(true);
      toast({ description: "Recording started" });
    } catch (err) {
      console.error("Recording error:", err);
      toast({
        title: "Recording Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Process recorded audio...
    toast({ description: "Recording stopped" });
  };

  const addTrack = (type: Track['type'] = 'audio') => {
    if (!project) return;

    const newTrack: Track = {
      id: Date.now(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track`,
      type,
      volume: 1,
      pan: 0,
      isMuted: false,
      isSoloed: false,
      effects: [],
      color: trackColors[project.tracks.length % trackColors.length],
      waveformData: Array.from({ length: 100 }, () => Math.random())
    };

    setProject({
      ...project,
      tracks: [...project.tracks, newTrack]
    });

    setSelectedTrackId(newTrack.id);
  };

  // Effect management
  const addEffect = (trackId: number, effectType: string) => {
    if (!project) return;

    const track = project.tracks.find(t => t.id === trackId);
    if (!track) return;

    const effectInfo = studioEffects.find(e => e.id === effectType);
    if (!effectInfo) return;

    const newEffect: Effect = {
      id: Date.now(),
      name: effectInfo.name,
      type: effectType,
      isActive: true,
      isLuxury: effectInfo.isLuxury,
      parameters: {}
    };

    setProject({
      ...project,
      tracks: project.tracks.map(t =>
        t.id === trackId
          ? { ...t, effects: [...t.effects, newEffect] }
          : t
      )
    });
  };

  // Save project
  const saveProject = async () => {
    if (!project) return;

    try {
      const res = await fetch(`/api/studio/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });

      if (!res.ok) throw new Error('Failed to save project');

      toast({ description: "Project saved successfully" });
    } catch (err) {
      toast({
        title: "Save Error",
        description: "Failed to save project",
        variant: "destructive"
      });
    }
  };

  // Render studio interface
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <X className="h-4 w-4 mr-2" />
              Exit
            </Button>

            <div>
              <Input
                value={project?.title || ''}
                onChange={e => project && setProject({ ...project, title: e.target.value })}
                className="bg-transparent border-none text-xl font-bold"
              />
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {project?.bpm || 120} BPM
                </Badge>
                <Badge variant="outline">
                  {project?.key || 'C'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={saveProject}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>

            <Button variant="outline" onClick={() => setShowCollabDialog(true)}>
              <Users className="h-4 w-4 mr-2" />
              Collaborate
            </Button>

            <Button onClick={() => setShowExportDialog(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Tracks panel */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Tracks</h2>
            <Button size="sm" onClick={() => addTrack()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Track
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-2">
              {project?.tracks.map(track => (
                <div
                  key={track.id}
                  className={`p-3 rounded-lg border ${
                    selectedTrackId === track.id
                      ? 'border-primary bg-primary/10'
                      : 'border-zinc-800 bg-zinc-800/50'
                  }`}
                  onClick={() => setSelectedTrackId(track.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-8 rounded-full ${track.color}`} />
                      <div>
                        <div className="font-medium">{track.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {track.type}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updatedTrack = { ...track, isMuted: !track.isMuted };
                          setProject({
                            ...project,
                            tracks: project.tracks.map(t =>
                              t.id === track.id ? updatedTrack : t
                            )
                          });
                        }}
                      >
                        {track.isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Slider
                      value={[track.volume * 100]}
                      max={100}
                      step={1}
                      onValueChange={([value]) => {
                        const updatedTrack = { ...track, volume: value / 100 };
                        setProject({
                          ...project,
                          tracks: project.tracks.map(t =>
                            t.id === track.id ? updatedTrack : t
                          )
                        });
                      }}
                    />

                    {track.effects.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {track.effects.map(effect => (
                          <Badge
                            key={effect.id}
                            variant={effect.isActive ? "default" : "outline"}
                            className="text-xs"
                          >
                            {effect.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main editor */}
        <div className="flex-1 bg-zinc-950">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {isRecording ? "Stop Recording" : "Record"}
                </Button>

                <Button variant="outline" onClick={togglePlayback}>
                  {isPlaying ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono">
                  {new Date(currentTime * 1000).toISOString().substr(14, 5)}
                </span>

                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <Slider
                    value={[masterVolume * 100]}
                    max={100}
                    className="w-32"
                    onValueChange={([value]) => setMasterVolume(value / 100)}
                  />
                </div>
              </div>
            </div>

            {/* Waveform view */}
            <div className="h-64 bg-zinc-900 rounded-lg border border-zinc-800">
              {/* Implement waveform visualization here */}
            </div>
          </div>
        </div>

        {/* Effects panel */}
        <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-4">
          <Tabs defaultValue="effects">
            <TabsList className="w-full">
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="master">Master</TabsTrigger>
            </TabsList>

            <TabsContent value="effects">
              <div className="space-y-4">
                <h3 className="font-medium">Track Effects</h3>

                {selectedTrackId ? (
                  <div className="space-y-2">
                    {project?.tracks.find(t => t.id === selectedTrackId)?.effects.map(effect => (
                      <div
                        key={effect.id}
                        className="p-3 rounded-lg border border-zinc-800 bg-zinc-800/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {effect.isLuxury && (
                              <Crown className="h-4 w-4 text-amber-400" />
                            )}
                            <span>{effect.name}</span>
                          </div>

                          <Switch
                            checked={effect.isActive}
                            onCheckedChange={checked => {
                              const updatedEffect = { ...effect, isActive: checked };
                              setProject({
                                ...project,
                                tracks: project.tracks.map(t =>
                                  t.id === selectedTrackId
                                    ? {
                                        ...t,
                                        effects: t.effects.map(e =>
                                          e.id === effect.id ? updatedEffect : e
                                        )
                                      }
                                    : t
                                )
                              });
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowEffectsDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Effect
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    Select a track to add effects
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="master">
              <div className="space-y-4">
                <h3 className="font-medium">Master Effects</h3>

                <div className="space-y-2">
                  {project?.masterEffects.map(effect => (
                    <div
                      key={effect.id}
                      className="p-3 rounded-lg border border-zinc-800 bg-zinc-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <span>{effect.name}</span>
                        <Switch
                          checked={effect.isActive}
                          onCheckedChange={checked => {
                            const updatedEffect = { ...effect, isActive: checked };
                            setProject({
                              ...project,
                              masterEffects: project.masterEffects.map(e =>
                                e.id === effect.id ? updatedEffect : e
                              )
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowEffectsDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Master Effect
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showEffectsDialog} onOpenChange={setShowEffectsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Effect</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {studioEffects.map(effect => (
              <Button
                key={effect.id}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  if (selectedTrackId) {
                    addEffect(selectedTrackId, effect.id);
                  }
                  setShowEffectsDialog(false);
                }}
              >
                {effect.icon}
                <span>{effect.name}</span>
                {effect.isLuxury && (
                  <Badge variant="premium">Premium</Badge>
                )}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Project</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Format</Label>
              <Select defaultValue="wav">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="stems">Stems</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quality</Label>
              <Select defaultValue="high">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowExportDialog(false)}>
              Start Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCollabDialog} onOpenChange={setShowCollabDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collaboration</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={`https://studio.app/join/${project?.id}`}
                  readOnly
                />
                <Button variant="outline">Copy</Button>
              </div>
            </div>

            <div>
              <Label>Active Collaborators</Label>
              <div className="space-y-2">
                {project?.collaborators.map(collaborator => (
                  <div
                    key={collaborator}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-800"
                  >
                    <span>{collaborator}</span>
                    <Badge>Online</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}