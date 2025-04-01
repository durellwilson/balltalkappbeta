import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Play, Pause, StopCircle, Plus, Trash2, Save, Volume2, Share2, Waves } from "lucide-react";
import { useStudioCollaboration } from "@/hooks/use-studio-collaboration";
import { ProjectTrack, StudioProject } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDuration } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ProjectEditorProps {
  projectId: number;
  sessionId?: number;
  sessionCode?: string;
  isLiveSession?: boolean;
}

export function ProjectEditor({ projectId, sessionId, sessionCode, isLiveSession }: ProjectEditorProps) {
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ userId: number; username: string; message: string; timestamp: string }>>([]);
  
  const toneTransport = useRef(Tone.Transport);
  const players = useRef<Map<number, Tone.Player>>(new Map());
  
  // Collaboration hook setup (if in a live session)
  const collaboration = sessionId && sessionCode ? useStudioCollaboration({
    sessionId,
    sessionCode,
    onUserJoined: (userId, username) => {
      // Add user joined notification to the chat
      setMessages(prev => [...prev, {
        userId,
        username: 'System',
        message: `${username} joined the session`,
        timestamp: new Date().toISOString()
      }]);
    },
    onUserLeft: () => {
      // Add user left notification to the chat
      setMessages(prev => [...prev, {
        userId: 0,
        username: 'System',
        message: 'A user left the session',
        timestamp: new Date().toISOString()
      }]);
    },
    onTrackControl: (action, trackId, position, userId) => {
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
    onTrackComment: (comment) => {
      // Refresh track comments
      queryClient.invalidateQueries({ queryKey: [`/api/studio/tracks/${comment.projectTrackId}/comments`] });
    },
    onChatMessage: (userId, username, message, timestamp) => {
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
          }
        }).toDestination();
        
        // Set initial volume, pan, etc.
        player.volume.value = track.volume || 0;
        player.mute = track.muted || false;
        
        // Store the player
        players.current.set(track.id, player);
      });
      
      // Update transport time
      toneTransport.current.on('update', () => {
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
  }, [tracks]);
  
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
  
  if (projectLoading || tracksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Input
            value={project?.title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="font-bold text-xl w-64"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={stopPlayback}
            >
              <StopCircle size={20} />
            </Button>
          </div>
          <div className="text-sm">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLiveSession && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm">Live Session</span>
            </div>
          )}
          <Button variant="outline" onClick={() => saveProjectMutation.mutate({ title: project?.title })}>
            <Save size={16} className="mr-2" /> Save Project
          </Button>
          {isLiveSession && (
            <Button variant="outline">
              <Share2 size={16} className="mr-2" /> Invite
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="tracks" className="h-full">
          <TabsList className="px-4 pt-2">
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="mixer">Mixer</TabsTrigger>
            <TabsTrigger value="mastering">Mastering</TabsTrigger>
            {isLiveSession && <TabsTrigger value="chat">Chat</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="tracks" className="p-4 h-[calc(100%-48px)] overflow-y-auto">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Tracks</h3>
                <Button>
                  <Plus size={16} className="mr-2" /> Add Track
                </Button>
              </div>
              
              <div className="space-y-2">
                {tracks && tracks.length > 0 ? (
                  tracks.map((track: ProjectTrack) => (
                    <Card
                      key={track.id}
                      className={`${
                        selectedTrackId === track.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedTrackId(track.id)}
                    >
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{track.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMute(track.id);
                              }}
                            >
                              <Volume2
                                size={16}
                                className={track.muted ? 'text-muted-foreground' : ''}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTrack(track.id);
                              }}
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-0">
                        <div className="flex items-center gap-4 mb-2">
                          <Waves size={16} className="text-muted-foreground" />
                          <div className="w-full h-12 bg-muted rounded-md">
                            {/* Waveform visualization would go here */}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No tracks added yet. Click "Add Track" to upload audio.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="mixer" className="p-4 h-[calc(100%-48px)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tracks && tracks.map((track: ProjectTrack) => (
                <Card key={track.id}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{track.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor={`volume-${track.id}`}>Volume</Label>
                          <span>{track.volume || 0} dB</span>
                        </div>
                        <Slider
                          id={`volume-${track.id}`}
                          defaultValue={[track.volume || 0]}
                          min={-40}
                          max={6}
                          step={0.1}
                          onValueChange={(value) => handleVolumeChange(track.id, value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor={`pan-${track.id}`}>Pan</Label>
                          <span>{track.pan || 0}</span>
                        </div>
                        <Slider
                          id={`pan-${track.id}`}
                          defaultValue={[track.pan || 0]}
                          min={-1}
                          max={1}
                          step={0.01}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`mute-${track.id}`}
                          checked={track.muted || false}
                          onCheckedChange={() => toggleMute(track.id)}
                        />
                        <Label htmlFor={`mute-${track.id}`}>Mute</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`solo-${track.id}`}
                          checked={track.solo || false}
                        />
                        <Label htmlFor={`solo-${track.id}`}>Solo</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="mastering" className="p-4 h-[calc(100%-48px)] overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>Mastering (Coming Soon)</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Mastering tools will be available in the next update.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          {isLiveSession && (
            <TabsContent value="chat" className="p-4 h-[calc(100%-48px)] overflow-y-auto">
              <Card className="h-full flex flex-col">
                <CardHeader className="py-3">
                  <CardTitle>Live Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.length > 0 ? (
                      messages.map((msg, idx) => (
                        <div key={idx} className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{msg.username}:</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p>{msg.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage}>Send</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      <div className="p-4 border-t">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.01}
          onValueChange={handleSeek}
        />
      </div>
    </div>
  );
}