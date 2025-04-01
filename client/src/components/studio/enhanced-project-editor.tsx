import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, Pause, StopCircle, Plus, Trash2, Save, Volume2, 
  Share2, Waves, Mic, Settings, Maximize2, Headphones, 
  ZoomIn, ZoomOut, Sliders, Music, Download, Rewind, FastForward,
  Users, MessageSquare, BellRing, HelpCircle
} from "lucide-react";
import { useStudioCollaboration } from "@/hooks/use-studio-collaboration";
import { ProjectTrack, StudioProject } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDuration } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface EnhancedProjectEditorProps {
  projectId: number;
  sessionId?: number;
  sessionCode?: string;
  isLiveSession?: boolean;
  onBack: () => void;
}

export function EnhancedProjectEditor({ 
  projectId, 
  sessionId, 
  sessionCode, 
  isLiveSession,
  onBack
}: EnhancedProjectEditorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ userId: number; username: string; message: string; timestamp: string }>>([]);
  const [masterVolume, setMasterVolume] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [eqEnabled, setEqEnabled] = useState(false);
  const [compressorEnabled, setCompressorEnabled] = useState(false);
  const [limiterEnabled, setLimiterEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<'arrange' | 'mix' | 'master'>('arrange');
  
  const toneTransport = useRef(Tone.Transport);
  const players = useRef<Map<number, Tone.Player>>(new Map());
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Collaboration hook setup (if in a live session)
  const collaboration = sessionId && sessionCode ? useStudioCollaboration({
    sessionId,
    sessionCode,
    onUserJoined: (userId: number, username: string) => {
      // Add user joined notification to the chat
      setMessages(prev => [...prev, {
        userId,
        username: 'System',
        message: `${username} joined the session`,
        timestamp: new Date().toISOString()
      }]);
      
      toast({
        title: 'User Joined',
        description: `${username} joined the session`,
      });
    },
    onUserLeft: (userId: number, username: string) => {
      // Add user left notification to the chat
      setMessages(prev => [...prev, {
        userId: 0,
        username: 'System',
        message: `${username || 'A user'} left the session`,
        timestamp: new Date().toISOString()
      }]);
    },
    onTrackControl: (action: string, trackId: number, position: number, userId?: number) => {
      // Handle remote track control
      const trackPlayers = players.current;
      
      switch (action) {
        case 'play':
          if (!isPlaying) {
            toneTransport.current.start();
            setIsPlaying(true);
          }
          toneTransport.current.seconds = position;
          setCurrentTime(position);
          break;
        case 'pause':
          if (isPlaying) {
            toneTransport.current.pause();
            setIsPlaying(false);
          }
          break;
        case 'stop':
          if (isPlaying) {
            toneTransport.current.stop();
            setIsPlaying(false);
          }
          setCurrentTime(0);
          break;
        case 'mute':
          if (trackPlayers.has(trackId)) {
            const player = trackPlayers.get(trackId);
            if (player) {
              player.mute = true;
            }
          }
          break;
        case 'unmute':
          if (trackPlayers.has(trackId)) {
            const player = trackPlayers.get(trackId);
            if (player) {
              player.mute = false;
            }
          }
          break;
      }
    },
    onTrackComment: (comment: any) => {
      // Refresh track comments
      queryClient.invalidateQueries({ queryKey: [`/api/studio/tracks/${comment.projectTrackId}/comments`] });
    },
    onChatMessage: (userId: number, username: string, message: string, timestamp: string) => {
      setMessages(prev => [...prev, { userId, username, message, timestamp }]);
    }
  }) : null;
  
  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [`/api/studio/projects/${projectId}`],
    queryFn: async () => {
      const response = await fetch(`/api/studio/projects/${projectId}`);
      return response.json();
    }
  });
  
  // Fetch project tracks
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: [`/api/studio/projects/${projectId}/tracks`],
    queryFn: async () => {
      const response = await fetch(`/api/studio/projects/${projectId}/tracks`);
      return response.json();
    }
  });
  
  // Save project mutation
  const saveProjectMutation = useMutation({
    mutationFn: async (updatedProject: Partial<StudioProject>) => {
      const res = await apiRequest('POST', `/api/studio/projects/${projectId}/update`, updatedProject);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Project Saved',
        description: 'Your project has been saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/studio/projects/${projectId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update track mutation
  const updateTrackMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProjectTrack> }) => {
      const res = await apiRequest('POST', `/api/studio/tracks/${id}/update`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/studio/projects/${projectId}/tracks`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Delete track mutation
  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: number) => {
      const res = await apiRequest('DELETE', `/api/studio/tracks/${trackId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Track Deleted',
        description: 'The track has been deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/studio/projects/${projectId}/tracks`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Set up Tone.js transport
  useEffect(() => {
    if (!tracks) return;
    
    // Clear any existing players
    players.current.forEach(player => player.dispose());
    players.current.clear();
    
    // Initialize Tone.js
    Tone.start().then(() => {
      console.log('Tone.js started');
      
      let maxDuration = 0;
      
      // Create a player for each track
      tracks.forEach((track: ProjectTrack) => {
        const player = new Tone.Player({
          url: track.audioUrl,
          onload: () => {
            // Calculate the maximum duration of all tracks
            if (player.buffer.duration > maxDuration) {
              maxDuration = player.buffer.duration;
              setDuration(maxDuration);
            }
            
            // Draw waveform
            if (track.id === selectedTrackId) {
              drawWaveform(player.buffer);
            }
          }
        }).toDestination();
        
        // Set initial volume, pan, etc.
        player.volume.value = track.volume || 0;
        player.mute = track.muted || false;
        
        // Store the player
        players.current.set(track.id, player);
      });
      
      // Update transport time using ticks
      toneTransport.current.on('ticks', () => {
        const now = toneTransport.current.seconds;
        setCurrentTime(now);
      });
    });
    
    return () => {
      // Clean up on unmount
      toneTransport.current.stop();
      toneTransport.current.cancel();
      players.current.forEach(player => player.dispose());
    };
  }, [tracks, selectedTrackId]);
  
  // Draw waveform when selected track changes
  useEffect(() => {
    if (selectedTrackId) {
      const player = players.current.get(selectedTrackId);
      if (player && player.buffer.loaded) {
        drawWaveform(player.buffer);
      }
    }
  }, [selectedTrackId]);
  
  // Function to draw waveform
  const drawWaveform = (buffer: Tone.ToneAudioBuffer) => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get audio data
    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / canvas.width);
    
    // Set line style
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#10b981'; // Change to match your theme
    
    // Draw waveform
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i++) {
      const index = Math.floor(i * step);
      const value = channelData[index] * 0.4; // Scale the waveform
      
      const y = (0.5 + value) * canvas.height;
      
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();
  };
  
  // Handle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      toneTransport.current.pause();
      
      // Notify collaborators
      if (collaboration) {
        collaboration.sendTrackControl('pause', 0, currentTime);
      }
    } else {
      // If we haven't started yet or we're at the end, start from the beginning
      if (currentTime === 0 || currentTime >= duration) {
        players.current.forEach(player => {
          player.start();
        });
      }
      
      toneTransport.current.start();
      
      // Notify collaborators
      if (collaboration) {
        collaboration.sendTrackControl('play', 0, currentTime);
      }
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle stop
  const stopPlayback = () => {
    toneTransport.current.stop();
    players.current.forEach(player => {
      player.stop();
    });
    setIsPlaying(false);
    setCurrentTime(0);
    
    // Notify collaborators
    if (collaboration) {
      collaboration.sendTrackControl('stop', 0, 0);
    }
  };
  
  // Handle seek
  const handleSeek = (value: number[]) => {
    const newPosition = value[0];
    toneTransport.current.seconds = newPosition;
    setCurrentTime(newPosition);
    
    // If we're playing, we need to adjust the playback position
    if (isPlaying) {
      players.current.forEach(player => {
        player.stop();
        player.start('+0.1', newPosition);
      });
    }
  };
  
  // Handle track mute
  const toggleMute = (trackId: number) => {
    const track = tracks.find((t: ProjectTrack) => t.id === trackId);
    if (!track) return;
    
    const newMuted = !track.muted;
    
    // Update the player
    const player = players.current.get(trackId);
    if (player) {
      player.mute = newMuted;
    }
    
    // Update the track in the database
    updateTrackMutation.mutate({ id: trackId, data: { muted: newMuted } });
    
    // Notify collaborators
    if (collaboration) {
      collaboration.sendTrackControl(newMuted ? 'mute' : 'unmute', trackId, currentTime);
    }
  };
  
  // Handle track volume
  const handleVolumeChange = (trackId: number, value: number[]) => {
    const newVolume = value[0];
    
    // Update the player
    const player = players.current.get(trackId);
    if (player) {
      player.volume.value = newVolume;
    }
    
    // Debounce the update to the database
    const timeoutId = setTimeout(() => {
      updateTrackMutation.mutate({ id: trackId, data: { volume: newVolume } });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };
  
  // Handle track delete
  const handleDeleteTrack = (trackId: number) => {
    if (window.confirm('Are you sure you want to delete this track?')) {
      // Stop and dispose the player
      const player = players.current.get(trackId);
      if (player) {
        player.stop();
        player.dispose();
        players.current.delete(trackId);
      }
      
      // Delete the track from the database
      deleteTrackMutation.mutate(trackId);
    }
  };
  
  // Handle project title change
  const handleTitleChange = (newTitle: string) => {
    saveProjectMutation.mutate({ title: newTitle });
  };
  
  // Handle send chat message
  const handleSendMessage = () => {
    if (!chatMessage.trim() || !collaboration) return;
    
    collaboration.sendChatMessage(chatMessage);
    setChatMessage('');
  };
  
  // Handle master volume change
  const handleMasterVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setMasterVolume(newVolume);
    
    // Adjust Tone.js master volume
    Tone.Destination.volume.value = newVolume;
  };
  
  // Handle zoom change
  const handleZoomChange = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev + 10 : prev - 10;
      return Math.min(Math.max(newZoom, 50), 200); // Keep zoom between 50% and 200%
    });
  };
  
  if (projectLoading || tracksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Top toolbar */}
      <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-zinc-800"
            onClick={onBack}
          >
            <Rewind className="h-5 w-5" />
          </Button>
          
          <Input
            value={project?.title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="font-bold text-xl max-w-xs bg-transparent border-zinc-700 focus-visible:ring-primary"
          />
          
          <div className="flex items-center gap-2 px-4">
            <Button
              variant="outline"
              size="icon"
              className="text-white hover:bg-zinc-800 border-zinc-700"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-white hover:bg-zinc-800 border-zinc-700"
              onClick={stopPlayback}
            >
              <StopCircle size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-white hover:bg-zinc-800 border-zinc-700"
            >
              <Rewind size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-white hover:bg-zinc-800 border-zinc-700"
            >
              <FastForward size={18} />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 px-2">
            <span className="text-sm font-mono">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
            <Badge variant="secondary" className="bg-zinc-800 text-white">
              {project?.bpm || 120} BPM
            </Badge>
            <Badge variant="secondary" className="bg-zinc-800 text-white">
              {project?.key || 'C'} Major
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isLiveSession && (
            <div className="flex items-center gap-2 mr-4">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm">Live Session</span>
              <Badge variant="outline" className="border-green-500 text-green-500">
                {sessionCode}
              </Badge>
            </div>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="text-white hover:bg-zinc-800 border-zinc-700">
                  <Headphones size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Audio Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="text-white hover:bg-zinc-800 border-zinc-700">
                  <Settings size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Project Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90"
            onClick={() => saveProjectMutation.mutate({ title: project?.title })}
          >
            <Save size={16} className="mr-2" /> Save Project
          </Button>
        </div>
      </div>
      
      {/* Main workspace */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar - track list */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          <div className="p-2 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-sm font-semibold">Tracks</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <Plus size={16} className="mr-1" /> Add
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {tracks && tracks.length > 0 ? (
                tracks.map((track: ProjectTrack) => (
                  <div 
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedTrackId === track.id ? 'bg-primary/20 border-l-2 border-primary' : 'hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${track.muted ? 'bg-zinc-600' : 'bg-green-500'}`}></div>
                        <span className={`text-sm font-medium ${track.muted ? 'text-zinc-500' : 'text-white'}`}>
                          {track.name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-zinc-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute(track.id);
                          }}
                        >
                          <Volume2 size={14} className={track.muted ? 'text-zinc-600' : ''} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-1 pr-6">
                      <Slider
                        defaultValue={[track.volume || 0]}
                        max={12}
                        min={-60}
                        step={1}
                        className="h-1"
                        onValueChange={(value) => handleVolumeChange(track.id, value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tracks yet</p>
                  <p className="text-xs mt-1">Add a track to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Master volume */}
          <div className="p-3 border-t border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold uppercase text-zinc-400">Master</span>
              <div className="flex items-center">
                <span className="text-xs mr-2">{masterVolume.toFixed(1)} dB</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-zinc-400 hover:text-white"
                >
                  <Volume2 size={14} />
                </Button>
              </div>
            </div>
            <Slider
              defaultValue={[0]}
              max={12}
              min={-60}
              step={0.1}
              className="h-2"
              onValueChange={handleMasterVolumeChange}
            />
          </div>
        </div>
        
        {/* Center - main editor */}
        <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
          {/* View mode tabs */}
          <div className="px-4 py-1 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'arrange' ? 'default' : 'ghost'}
                size="sm"
                className={viewMode === 'arrange' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}
                onClick={() => setViewMode('arrange')}
              >
                Arrange
              </Button>
              <Button
                variant={viewMode === 'mix' ? 'default' : 'ghost'}
                size="sm"
                className={viewMode === 'mix' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}
                onClick={() => setViewMode('mix')}
              >
                Mix
              </Button>
              <Button
                variant={viewMode === 'master' ? 'default' : 'ghost'}
                size="sm"
                className={viewMode === 'master' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}
                onClick={() => setViewMode('master')}
              >
                Master
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-white"
                onClick={() => handleZoomChange('out')}
              >
                <ZoomOut size={16} />
              </Button>
              <span className="text-xs text-zinc-400">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-white"
                onClick={() => handleZoomChange('in')}
              >
                <ZoomIn size={16} />
              </Button>
            </div>
          </div>
          
          {/* Timeline and waveform editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Timeline rulers */}
            <div className="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-2">
              {/* Time markers would go here */}
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="h-4 border-l border-zinc-700 mr-[59px] relative">
                    <span className="absolute -left-2 top-4 text-[10px] text-zinc-500">{i}s</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Track display area */}
            <div className="flex-1 p-2 overflow-auto">
              {/* Selected track waveform */}
              {selectedTrackId ? (
                <div className="bg-zinc-900 rounded-md p-2 border border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">
                      {tracks?.find((t: ProjectTrack) => t.id === selectedTrackId)?.name}
                    </h4>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white">
                        <Waves size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-zinc-400 hover:text-white"
                        onClick={() => handleDeleteTrack(selectedTrackId)}
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <canvas 
                      ref={waveformCanvasRef} 
                      width={800} 
                      height={120} 
                      className="w-full bg-zinc-950 rounded"
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-primary opacity-70" 
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <Waves className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Select a track to view and edit</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Playback controls and time slider */}
            <div className="p-2 bg-zinc-900 border-t border-zinc-800">
              <Slider
                defaultValue={[0]}
                max={duration}
                min={0}
                step={0.01}
                value={[currentTime]}
                onValueChange={handleSeek}
                className="my-2"
              />
            </div>
          </div>
        </div>
        
        {/* Right sidebar - mixer or chat */}
        <div className="w-64 bg-zinc-900 border-l border-zinc-800 flex flex-col">
          <Tabs defaultValue={isLiveSession ? "chat" : "effects"}>
            <TabsList className="w-full flex border-b border-zinc-800 rounded-none bg-zinc-900">
              <TabsTrigger value="effects" className="flex-1 data-[state=active]:bg-zinc-800">
                <Sliders size={16} className="mr-2" /> Effects
              </TabsTrigger>
              {isLiveSession && (
                <TabsTrigger value="chat" className="flex-1 data-[state=active]:bg-zinc-800">
                  <MessageSquare size={16} className="mr-2" /> Chat
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="effects" className="p-2 flex flex-col h-[calc(100vh-12.5rem)]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="eq-enable" className="text-sm font-medium">Equalizer</Label>
                    <Switch
                      id="eq-enable"
                      checked={eqEnabled}
                      onCheckedChange={setEqEnabled}
                    />
                  </div>
                  <Card className={`bg-zinc-950 border-zinc-800 ${!eqEnabled ? 'opacity-50' : ''}`}>
                    <CardContent className="p-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Low</Label>
                          <Slider defaultValue={[0]} max={12} min={-12} disabled={!eqEnabled} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Mid</Label>
                          <Slider defaultValue={[0]} max={12} min={-12} disabled={!eqEnabled} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">High</Label>
                          <Slider defaultValue={[0]} max={12} min={-12} disabled={!eqEnabled} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="comp-enable" className="text-sm font-medium">Compressor</Label>
                    <Switch
                      id="comp-enable"
                      checked={compressorEnabled}
                      onCheckedChange={setCompressorEnabled}
                    />
                  </div>
                  <Card className={`bg-zinc-950 border-zinc-800 ${!compressorEnabled ? 'opacity-50' : ''}`}>
                    <CardContent className="p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Threshold</Label>
                          <Slider defaultValue={[-20]} max={0} min={-60} disabled={!compressorEnabled} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Ratio</Label>
                          <Slider defaultValue={[4]} max={20} min={1} disabled={!compressorEnabled} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="limiter-enable" className="text-sm font-medium">Limiter</Label>
                    <Switch
                      id="limiter-enable"
                      checked={limiterEnabled}
                      onCheckedChange={setLimiterEnabled}
                    />
                  </div>
                  <Card className={`bg-zinc-950 border-zinc-800 ${!limiterEnabled ? 'opacity-50' : ''}`}>
                    <CardContent className="p-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Ceiling</Label>
                        <Slider defaultValue={[-0.1]} max={0} min={-6} step={0.1} disabled={!limiterEnabled} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-auto pt-4">
                  <Button className="w-full" variant="outline">
                    <Download size={16} className="mr-2" /> Export Track
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {isLiveSession && (
              <TabsContent value="chat" className="p-0 flex flex-col h-[calc(100vh-12.5rem)]">
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${msg.username === 'System' ? 'justify-center' : 'gap-2'}`}
                    >
                      {msg.username === 'System' ? (
                        <div className="bg-zinc-800/50 rounded-full px-3 py-1 text-xs text-zinc-400">
                          {msg.message}
                        </div>
                      ) : (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {msg.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-zinc-800 rounded-lg p-2 text-sm max-w-[80%]">
                            <div className="font-medium text-xs text-zinc-400">{msg.username}</div>
                            <div>{msg.message}</div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="p-2 border-t border-zinc-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-zinc-800 border-zinc-700"
                    />
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handleSendMessage}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <MessageSquare size={16} />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-1 flex justify-between items-center text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <span>{project?.bpm || 120} BPM</span>
          <span>{project?.key || 'C Major'}</span>
          <span>{zoom}% Zoom</span>
        </div>
        
        <div className="flex items-center gap-4">
          {isLiveSession && (
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>3 Online</span>
            </div>
          )}
          <span>v{project?.version || '1.0'}</span>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-zinc-400">
            <HelpCircle size={14} className="mr-1" /> Help
          </Button>
        </div>
      </div>
    </div>
  );
}