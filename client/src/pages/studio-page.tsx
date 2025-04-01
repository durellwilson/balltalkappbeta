import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic,
  Play,
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
  X
} from 'lucide-react';

export default function StudioPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const [isRecording, setIsRecording] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [activeTrack, setActiveTrack] = useState<number | null>(null);
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [showNewTrackDialog, setShowNewTrackDialog] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const audioContext = useRef<AudioContext | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingInterval = useRef<any>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAudioContextInitialized, setIsAudioContextInitialized] = useState(false);

  // Simplified Audio setup - create AudioContext when needed
  const initializeAudioContext = () => {
    try {
      if (!audioContext.current) {
        // @ts-ignore - AudioContext might not be available in all browsers
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log("Audio context initialized");
        setIsAudioContextInitialized(true);
        return true;
      }
      return true;
    } catch (error) {
      console.error("Failed to initialize studio:", error);
      return false;
    }
  };

  const startRecording = async () => {
    if (!initializeAudioContext()) return;
    
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
        
        // Add new track
        setTracks([
          ...tracks,
          {
            id: Date.now(),
            name: newTrackName || `Track ${tracks.length + 1}`,
            url: audioUrl,
            volume: 100,
            isMuted: false
          }
        ]);
        
        audioChunks.current = [];
      };
      
      // Start recording
      mediaRecorder.current.start();
      setIsRecording(true);
      console.log("Started recording");
      
      // Update recording time display
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setShowNewTrackDialog(false);
      
      // Clear the recording timer
      clearInterval(recordingInterval.current);
      setRecordingTime(0);
      
      // Stop all tracks to release the microphone
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = (trackId: number) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, isMuted: !track.isMuted } : track
    ));
  };

  const changeVolume = (trackId: number, volume: number) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, volume } : track
    ));
  };

  const deleteTrack = (trackId: number) => {
    setTracks(tracks.filter(track => track.id !== trackId));
    if (activeTrack === trackId) {
      setActiveTrack(null);
    }
  };

  // Sample tracks (if none exist)
  useEffect(() => {
    if (tracks.length === 0) {
      const sampleTrack = {
        id: 1,
        name: "Demo Track",
        url: "", // Empty URL since we don't have an actual audio file
        volume: 100,
        isMuted: false
      };
      setTracks([sampleTrack]);
    }

    // Initialize audio context
    initializeAudioContext();

    // Clean up
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-2">
              <X className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
            <Input
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              className="max-w-[200px] bg-transparent border-none focus-visible:ring-0 font-bold text-lg px-0"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            
            <Button size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Publish
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-64 lg:w-80 bg-zinc-900 p-4 border-r border-zinc-800 overflow-y-auto">
          <Card className="bg-black/50 border-zinc-800 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-0">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Project Title</label>
                <Input 
                  value={projectTitle}
                  onChange={e => setProjectTitle(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Genre</label>
                <Select defaultValue="hiphop">
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hiphop">Hip Hop</SelectItem>
                    <SelectItem value="rnb">R&B</SelectItem>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">BPM</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    defaultValue="90"
                    className="h-8 text-sm"
                  />
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Detect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/50 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Tracks</CardTitle>
                <Dialog open={showNewTrackDialog} onOpenChange={setShowNewTrackDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-7">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Track
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle>Record New Track</DialogTitle>
                      <DialogDescription>
                        Give your track a name and click record to start capturing audio.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Track Name</label>
                        <Input
                          placeholder="My Awesome Track"
                          value={newTrackName}
                          onChange={e => setNewTrackName(e.target.value)}
                        />
                      </div>
                      
                      {isRecording && (
                        <div className="flex items-center justify-center py-4">
                          <div className="flex flex-col items-center">
                            <div className="h-16 w-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-2 animate-pulse">
                              <Mic className="h-8 w-8 text-red-500" />
                            </div>
                            <div className="text-lg font-mono">{formatTime(recordingTime)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      {!isRecording ? (
                        <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                          <Mic className="h-4 w-4 mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <Button onClick={stopRecording} variant="destructive">
                          <Square className="h-4 w-4 mr-2" />
                          Stop Recording
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="py-0 space-y-1">
              <ScrollArea className="h-[calc(100vh-450px)] min-h-[200px] pr-3">
                {tracks.length > 0 ? (
                  <div className="space-y-2">
                    {tracks.map(track => (
                      <div
                        key={track.id}
                        className={`p-2 rounded-md flex flex-col ${
                          activeTrack === track.id ? 'bg-primary/20 border border-primary/30' : 'bg-zinc-800/50 hover:bg-zinc-800'
                        } cursor-pointer transition-colors`}
                        onClick={() => setActiveTrack(track.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <Music className="h-4 w-4 mr-2 text-zinc-400" />
                            <span className="font-medium text-sm truncate max-w-[120px]">{track.name}</span>
                          </div>
                          <div className="flex items-center">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400 hover:text-red-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTrack(track.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="px-1">
                          <Slider
                            defaultValue={[track.volume]}
                            max={100}
                            step={1}
                            onValueChange={(value) => changeVolume(track.id, value[0])}
                            onClick={(e) => e.stopPropagation()}
                            disabled={track.isMuted}
                            className="h-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Music className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No tracks added yet</p>
                    <p className="text-xs mt-1">Click "Add Track" to get started</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="editor" className="flex-1 flex flex-col">
            <div className="bg-zinc-900 border-b border-zinc-800 px-4">
              <TabsList className="bg-transparent border-b border-transparent h-12">
                <TabsTrigger value="editor" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                  Editor
                </TabsTrigger>
                <TabsTrigger value="mastering" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                  Mastering
                </TabsTrigger>
                <TabsTrigger value="mix" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                  Mix
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="editor" className="flex-1 p-4 space-y-4 h-full overflow-y-auto">
              <div className="h-full flex flex-col">
                {!isAudioContextInitialized ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8 max-w-md mx-auto">
                      <div className="mb-4 inline-flex h-16 w-16 rounded-full bg-zinc-900 items-center justify-center">
                        <Mic className="h-8 w-8 text-zinc-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Studio Initialization</h2>
                      <p className="text-zinc-400 mb-4">
                        To use the studio, we need permission to access your microphone. This allows you to record tracks directly in the browser.
                      </p>
                      <Button onClick={initializeAudioContext} className="bg-primary hover:bg-primary/90">
                        Initialize Studio
                      </Button>
                    </div>
                  </div>
                ) : activeTrack ? (
                  <div className="flex-1 flex flex-col">
                    <div className="bg-zinc-900 rounded-lg p-4 mb-4">
                      <h3 className="font-medium mb-2">
                        {tracks.find(t => t.id === activeTrack)?.name || 'Track Editor'}
                      </h3>
                      <div className="h-32 bg-zinc-800 rounded-md flex items-center justify-center">
                        <div className="text-zinc-600">
                          Waveform visualization goes here
                        </div>
                      </div>
                      <div className="flex justify-center mt-4 space-x-2">
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-1" />
                          Play
                        </Button>
                        <Button size="sm" variant="outline" className="bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-500">
                          <Mic className="h-4 w-4 mr-1" />
                          Re-record
                        </Button>
                      </div>
                    </div>
                    
                    <Card className="flex-1 bg-zinc-900 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-sm">Track Effects</CardTitle>
                        <CardDescription>
                          Enhance your track with professional tools
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium">AutoPitch™</label>
                              <Button variant="outline" size="sm">
                                <Settings className="h-3.5 w-3.5 mr-1" />
                                Configure
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch />
                              <Label>Enable automatic pitch correction</Label>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium">Equalizer</label>
                              <Button variant="outline" size="sm">
                                <Sliders className="h-3.5 w-3.5 mr-1" />
                                Adjust
                              </Button>
                            </div>
                            <Select defaultValue="vocal">
                              <SelectTrigger>
                                <SelectValue placeholder="Select preset" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vocal">Vocal Clarity</SelectItem>
                                <SelectItem value="bass">Bass Boost</SelectItem>
                                <SelectItem value="balanced">Balanced</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Reverb</label>
                            <Select defaultValue="room">
                              <SelectTrigger>
                                <SelectValue placeholder="Select preset" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="room">Small Room</SelectItem>
                                <SelectItem value="hall">Concert Hall</SelectItem>
                                <SelectItem value="plate">Plate Reverb</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="pt-2">
                              <label className="text-xs text-zinc-400 mb-1 block">Amount</label>
                              <Slider defaultValue={[30]} max={100} step={1} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="mb-4 inline-flex h-16 w-16 rounded-full bg-zinc-900 items-center justify-center">
                        <Music className="h-8 w-8 text-zinc-600" />
                      </div>
                      <h2 className="text-xl font-bold mb-2">Select a Track</h2>
                      <p className="text-zinc-400 mb-4">
                        Choose a track from the sidebar to edit it, or create a new one to get started.
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-1" />
                            New Track
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800">
                          <DialogHeader>
                            <DialogTitle>Add New Track</DialogTitle>
                            <DialogDescription>
                              Start recording a new audio track for your project
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Track Name</label>
                              <Input
                                placeholder="My Awesome Track"
                                value={newTrackName}
                                onChange={e => setNewTrackName(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => {
                              setShowNewTrackDialog(true);
                            }}>
                              <Mic className="h-4 w-4 mr-1" />
                              Start Recording
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="mastering" className="p-4 h-full overflow-y-auto">
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="mb-4 inline-flex h-16 w-16 rounded-full bg-zinc-900 items-center justify-center">
                    <Sliders className="h-8 w-8 text-zinc-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Mastering Tools</h2>
                  <p className="text-zinc-400 mb-6">
                    Professional-grade mastering tools are available once you have tracks in your project.
                  </p>
                  <img 
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzIwMjAyMCIgcng9IjgiIC8+PHBhdGggZD0iTTQ5IDE3MCBMNDkgMzAgTTk4IDE3MCBMOTggNzAgTTE0NyAxNzAgTDE0NyA1MCBNMTY2IDE3MCBMMTY2IDkwIE0yMTUgMTcwIEwyMTUgMTEwIE0yNjQgMTcwIEwyNjQgNDAgTTMxMyAxNzAgTDMxMyA5MCBNNDQ1IDE3MCBMNDYyIDMwIE0zNjIgMTcwIEwzNjIgNTAgTTQxMSAxNzAgTDQxMSA5MCBNNDQ1IDE3MCBMNDQ1IDYwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLCAwKSIgc3Ryb2tlPSIjOEM1MkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==" 
                    alt="Mastering visualization"
                    className="w-full max-w-md rounded-lg border border-zinc-800"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="mix" className="p-4 h-full overflow-y-auto">
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="mb-4 inline-flex h-16 w-16 rounded-full bg-zinc-900 items-center justify-center">
                    <Volume2 className="h-8 w-8 text-zinc-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Mixing Console</h2>
                  <p className="text-zinc-400 mb-4">
                    Balance your tracks perfectly with our professional mixing tools.
                  </p>
                  <Button onClick={() => setShowNewTrackDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add a track to start mixing
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// This component is needed for the studio page
function Switch() {
  const [isChecked, setIsChecked] = useState(false);
  
  return (
    <div
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
        isChecked ? 'bg-primary' : 'bg-zinc-700'
      }`}
      onClick={() => setIsChecked(!isChecked)}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isChecked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-zinc-400">{children}</div>
  );
}