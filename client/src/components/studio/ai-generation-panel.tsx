import React, { useState } from 'react';
import { 
  Sparkles, 
  Music, 
  Mic, 
  MessageSquare, 
  Upload, 
  RotateCw, 
  Wand2, 
  Star, 
  Check,
  Download
} from 'lucide-react';

// Import Track and AudioRegion types from the parent component
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

interface AudioRegion {
  id: string;
  trackId: number;
  start: number;
  end: number;
  offset: number;
  name: string;
  waveform: number[];
  file: string;
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

// Define types

interface GenParameters {
  model: string;
  genre: string;
  mood: string;
  tempo: number;
  duration: number;
}

interface GenerationSettings {
  type: 'music' | 'vocal' | 'speech' | 'sfx';
  prompt: string;
  parameters: GenParameters;
}

interface HistoryItem {
  id: string;
  timestamp: Date;
  type: 'music' | 'vocal' | 'speech' | 'sfx';
  prompt: string;
  parameters: GenParameters;
  duration: number;
}

// Component props
interface AIGenerationPanelProps {
  onGenerateTrack: (track: {
    buffer: ArrayBuffer;
    name?: string;
    type?: 'audio' | 'instrument' | 'vocal' | 'drum' | 'mix';
    duration?: number;
    waveform?: number[];
    creationMethod?: 'recorded' | 'uploaded' | 'ai-generated';
  }) => void;
  activeTrack?: Track;
  selectedRegions?: AudioRegion[];
  bpm?: number;
  isSubscriptionActive?: boolean;
  apiKeyAvailable?: boolean;
}

export function AIGenerationPanel({
  onGenerateTrack,
  activeTrack,
  selectedRegions,
  bpm = 120,
  isSubscriptionActive = false,
  apiKeyAvailable = false
}: AIGenerationPanelProps) {
  // State
  const [activeTab, setActiveTab] = useState<'music' | 'vocal' | 'speech' | 'sfx'>('music');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<Blob | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Music generation state
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicGenre, setMusicGenre] = useState('electronic');
  const [musicMood, setMusicMood] = useState('upbeat');
  const [musicTempo, setMusicTempo] = useState(120);
  const [musicDuration, setMusicDuration] = useState(15);
  const [musicModel, setMusicModel] = useState('standard');
  
  // Vocal generation state
  const [vocalPrompt, setVocalPrompt] = useState('');
  const [vocalStyle, setVocalStyle] = useState('pop');
  const [vocalGender, setVocalGender] = useState('female');
  const [vocalDuration, setVocalDuration] = useState(10);
  
  // Speech generation state
  const [speechText, setSpeechText] = useState('');
  const [speechVoice, setSpeechVoice] = useState('default');
  const [speechSpeed, setSpeechSpeed] = useState(1);
  
  // SFX generation state
  const [sfxPrompt, setSfxPrompt] = useState('');
  const [sfxDuration, setSfxDuration] = useState(5);
  const [sfxCategory, setSfxCategory] = useState('ambient');
  
  // Handle generate button click
  const handleGenerate = async () => {
    if (!apiKeyAvailable) {
      toast({
        title: 'API Key Required',
        description: 'You need to add an API key to use AI generation features.',
        variant: 'destructive'
      });
      return;
    }
    
    // Check if we have a prompt
    if ((activeTab === 'music' && !musicPrompt) || 
        (activeTab === 'vocal' && !vocalPrompt) || 
        (activeTab === 'speech' && !speechText) || 
        (activeTab === 'sfx' && !sfxPrompt)) {
      toast({
        description: 'Please enter a prompt or text for generation.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Build parameters based on active tab
      let generationSettings: GenerationSettings;
      
      switch (activeTab) {
        case 'music':
          generationSettings = {
            type: 'music',
            prompt: musicPrompt,
            parameters: {
              model: musicModel,
              genre: musicGenre,
              mood: musicMood,
              tempo: musicTempo,
              duration: musicDuration
            }
          };
          break;
          
        case 'vocal':
          generationSettings = {
            type: 'vocal',
            prompt: vocalPrompt,
            parameters: {
              model: vocalStyle,
              genre: vocalStyle,
              mood: 'default',
              tempo: musicTempo,
              duration: vocalDuration
            }
          };
          break;
          
        case 'speech':
          generationSettings = {
            type: 'speech',
            prompt: speechText,
            parameters: {
              model: speechVoice,
              genre: 'speech',
              mood: 'default',
              tempo: speechSpeed,
              duration: Math.ceil(speechText.length / 15)
            }
          };
          break;
          
        case 'sfx':
          generationSettings = {
            type: 'sfx',
            prompt: sfxPrompt,
            parameters: {
              model: 'standard',
              genre: sfxCategory,
              mood: 'default',
              tempo: 100,
              duration: sfxDuration
            }
          };
          break;
      }
      
      // Simulate generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create a mock audio blob for demo
      const mockAudioBlob = new Blob(['dummy audio data'], { type: 'audio/mp3' });
      setGeneratedAudio(mockAudioBlob);
      
      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: activeTab,
        prompt: activeTab === 'speech' ? speechText : 
               activeTab === 'music' ? musicPrompt :
               activeTab === 'vocal' ? vocalPrompt : sfxPrompt,
        parameters: generationSettings.parameters,
        duration: generationSettings.parameters.duration
      };
      
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      
      // Call the callback
      // Convert Blob to ArrayBuffer
      const reader = new FileReader();
      reader.readAsArrayBuffer(mockAudioBlob);
      reader.onloadend = () => {
        if (reader.result) {
          onGenerateTrack({
            buffer: reader.result as ArrayBuffer,
            name: `Generated ${activeTab} - ${new Date().toLocaleTimeString()}`,
            type: activeTab === 'music' ? 'audio' : 
                 activeTab === 'vocal' ? 'vocal' : 
                 activeTab === 'speech' ? 'vocal' : 'audio',
            duration: generationSettings.parameters.duration,
            waveform: Array.from({ length: 100 }, () => Math.random() * 0.7 + 0.15),
            creationMethod: 'ai-generated'
          });
        }
      };
      
      toast({
        title: 'Generation Complete',
        description: `Your ${activeTab} has been generated successfully.`
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'There was an error generating your audio.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle add to project button click
  const handleAddToProject = () => {
    if (!generatedAudio) return;
    
    // Build settings object
    let settings: GenerationSettings;
    let duration = 0;
    
    switch (activeTab) {
      case 'music':
        settings = {
          type: 'music',
          prompt: musicPrompt,
          parameters: {
            model: musicModel,
            genre: musicGenre,
            mood: musicMood,
            tempo: musicTempo,
            duration: musicDuration
          }
        };
        duration = musicDuration;
        break;
        
      case 'vocal':
        settings = {
          type: 'vocal',
          prompt: vocalPrompt,
          parameters: {
            model: vocalStyle,
            genre: vocalStyle,
            mood: 'default',
            tempo: musicTempo,
            duration: vocalDuration
          }
        };
        duration = vocalDuration;
        break;
        
      case 'speech':
        settings = {
          type: 'speech',
          prompt: speechText,
          parameters: {
            model: speechVoice,
            genre: 'speech',
            mood: 'default',
            tempo: speechSpeed,
            duration: Math.ceil(speechText.length / 15)
          }
        };
        duration = Math.ceil(speechText.length / 15);
        break;
        
      case 'sfx':
        settings = {
          type: 'sfx',
          prompt: sfxPrompt,
          parameters: {
            model: 'standard',
            genre: sfxCategory,
            mood: 'default',
            tempo: 100,
            duration: sfxDuration
          }
        };
        duration = sfxDuration;
        break;
    }
    
    // Convert Blob to ArrayBuffer and call onGenerateTrack
    const reader = new FileReader();
    reader.readAsArrayBuffer(generatedAudio);
    reader.onloadend = () => {
      if (reader.result) {
        onGenerateTrack({
          buffer: reader.result as ArrayBuffer,
          name: `Generated ${activeTab} - ${new Date().toLocaleTimeString()}`,
          type: activeTab === 'music' ? 'audio' : 
               activeTab === 'vocal' ? 'vocal' : 
               activeTab === 'speech' ? 'vocal' : 'audio',
          duration: duration,
          waveform: Array.from({ length: 100 }, () => Math.random() * 0.7 + 0.15),
          creationMethod: 'ai-generated'
        });
      }
    };
    
    toast({
      title: 'Added to Project',
      description: `The generated ${activeTab} has been added to your project.`
    });
  };
  
  // Handle history item click
  const handleHistoryItemClick = (item: HistoryItem) => {
    // Load the settings from history
    switch (item.type) {
      case 'music':
        setActiveTab('music');
        setMusicPrompt(item.prompt);
        setMusicGenre(item.parameters.genre);
        setMusicMood(item.parameters.mood);
        setMusicTempo(item.parameters.tempo);
        setMusicDuration(item.parameters.duration);
        setMusicModel(item.parameters.model);
        break;
        
      case 'vocal':
        setActiveTab('vocal');
        setVocalPrompt(item.prompt);
        setVocalStyle(item.parameters.genre);
        setVocalDuration(item.parameters.duration);
        break;
        
      case 'speech':
        setActiveTab('speech');
        setSpeechText(item.prompt);
        setSpeechVoice(item.parameters.model);
        setSpeechSpeed(item.parameters.tempo);
        break;
        
      case 'sfx':
        setActiveTab('sfx');
        setSfxPrompt(item.prompt);
        setSfxCategory(item.parameters.genre);
        setSfxDuration(item.parameters.duration);
        break;
    }
    
    toast({
      description: `Loaded settings from history.`
    });
  };
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-md overflow-hidden">
      <div className="p-3 border-b border-gray-800 flex items-center space-x-2">
        <Sparkles size={16} className="text-purple-400" />
        <h3 className="font-medium">AI Generation</h3>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="p-2 border-b border-gray-800">
          <TabsList className="w-full bg-gray-800">
            <TabsTrigger value="music" className="flex-1">
              <Music size={14} className="mr-1" />
              Music
            </TabsTrigger>
            <TabsTrigger value="vocal" className="flex-1">
              <Mic size={14} className="mr-1" />
              Vocal
            </TabsTrigger>
            <TabsTrigger value="speech" className="flex-1">
              <MessageSquare size={14} className="mr-1" />
              Speech
            </TabsTrigger>
            <TabsTrigger value="sfx" className="flex-1">
              <Wand2 size={14} className="mr-1" />
              SFX
            </TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3">
            {/* Music Generation Tab */}
            <TabsContent value="music" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label>Describe the music you want</Label>
                <Textarea 
                  placeholder="An upbeat electronic track with deep bass, synth pads, and a driving beat..."
                  value={musicPrompt}
                  onChange={e => setMusicPrompt(e.target.value)}
                  className="bg-gray-800 border-gray-700 min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select value={musicGenre} onValueChange={setMusicGenre}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="hiphop">Hip Hop</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="ambient">Ambient</SelectItem>
                      <SelectItem value="classical">Classical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Mood</Label>
                  <Select value={musicMood} onValueChange={setMusicMood}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="happy">Happy</SelectItem>
                      <SelectItem value="upbeat">Upbeat</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="sad">Sad</SelectItem>
                      <SelectItem value="chilled">Chilled</SelectItem>
                      <SelectItem value="dramatic">Dramatic</SelectItem>
                      <SelectItem value="tense">Tense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Tempo</Label>
                  <span className="text-xs text-gray-400">{musicTempo} BPM</span>
                </div>
                <Slider
                  min={60}
                  max={200}
                  step={1}
                  value={[musicTempo]}
                  onValueChange={values => setMusicTempo(values[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Duration</Label>
                  <span className="text-xs text-gray-400">{formatTime(musicDuration)}</span>
                </div>
                <Slider
                  min={5}
                  max={60}
                  step={5}
                  value={[musicDuration]}
                  onValueChange={values => setMusicDuration(values[0])}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={musicModel} onValueChange={setMusicModel}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe (Higher Quality)</SelectItem>
                    <SelectItem value="pro">Pro (Best Quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            {/* Vocal Generation Tab */}
            <TabsContent value="vocal" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label>Describe the vocals you want</Label>
                <Textarea 
                  placeholder="A soulful female vocal singing about love and loss..."
                  value={vocalPrompt}
                  onChange={e => setVocalPrompt(e.target.value)}
                  className="bg-gray-800 border-gray-700 min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={vocalStyle} onValueChange={setVocalStyle}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="soul">Soul</SelectItem>
                      <SelectItem value="rnb">R&B</SelectItem>
                      <SelectItem value="hiphop">Hip Hop</SelectItem>
                      <SelectItem value="folk">Folk</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={vocalGender} onValueChange={setVocalGender}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="androgynous">Androgynous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Duration</Label>
                  <span className="text-xs text-gray-400">{formatTime(vocalDuration)}</span>
                </div>
                <Slider
                  min={5}
                  max={30}
                  step={5}
                  value={[vocalDuration]}
                  onValueChange={values => setVocalDuration(values[0])}
                />
              </div>
            </TabsContent>
            
            {/* Speech Generation Tab */}
            <TabsContent value="speech" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label>Text to convert to speech</Label>
                <Textarea 
                  placeholder="Enter the text you want to convert to speech..."
                  value={speechText}
                  onChange={e => setSpeechText(e.target.value)}
                  className="bg-gray-800 border-gray-700 min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Voice</Label>
                  <Select value={speechVoice} onValueChange={setSpeechVoice}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="male1">Male 1</SelectItem>
                      <SelectItem value="male2">Male 2</SelectItem>
                      <SelectItem value="female1">Female 1</SelectItem>
                      <SelectItem value="female2">Female 2</SelectItem>
                      <SelectItem value="narrator">Narrator</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Speed</Label>
                    <span className="text-xs text-gray-400">{speechSpeed}x</span>
                  </div>
                  <Slider
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={[speechSpeed]}
                    onValueChange={values => setSpeechSpeed(values[0])}
                  />
                </div>
              </div>
              
              <div className="pt-2 text-sm text-gray-400">
                <p>Approximate duration: {Math.ceil(speechText.length / 15)} seconds</p>
              </div>
            </TabsContent>
            
            {/* SFX Generation Tab */}
            <TabsContent value="sfx" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label>Describe the sound effect</Label>
                <Textarea 
                  placeholder="A door creaking open with a slight echo..."
                  value={sfxPrompt}
                  onChange={e => setSfxPrompt(e.target.value)}
                  className="bg-gray-800 border-gray-700 min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={sfxCategory} onValueChange={setSfxCategory}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="ambient">Ambient</SelectItem>
                      <SelectItem value="impacts">Impacts</SelectItem>
                      <SelectItem value="foley">Foley</SelectItem>
                      <SelectItem value="machines">Machines</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="weapons">Weapons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Duration</Label>
                    <span className="text-xs text-gray-400">{formatTime(sfxDuration)}</span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[sfxDuration]}
                    onValueChange={values => setSfxDuration(values[0])}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Common generation controls */}
            <div className="mt-4 space-y-4">
              {/* Generation button */}
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <RotateCw size={16} className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" />
                    Generate {activeTab === 'music' ? 'Music' : 
                             activeTab === 'vocal' ? 'Vocals' : 
                             activeTab === 'speech' ? 'Speech' : 'SFX'}
                  </>
                )}
              </Button>
              
              {/* Action buttons for generated audio */}
              {generatedAudio && (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-gray-800 border-gray-700"
                    onClick={() => {
                      // Play the audio
                      const audioURL = URL.createObjectURL(generatedAudio);
                      const audio = new Audio(audioURL);
                      audio.play();
                    }}
                  >
                    <Music size={16} className="mr-2" />
                    Play
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-700"
                    onClick={handleAddToProject}
                  >
                    <Check size={16} className="mr-2" />
                    Add to Project
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-700"
                    onClick={() => {
                      const audioURL = URL.createObjectURL(generatedAudio);
                      const a = document.createElement('a');
                      a.href = audioURL;
                      a.download = `generated-${activeTab}-${Date.now()}.mp3`;
                      a.click();
                    }}
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
            
            {/* Generation History */}
            {history.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Recent Generations</h4>
                <div className="space-y-2">
                  {history.map(item => (
                    <Card 
                      key={item.id} 
                      className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <CardContent className="p-3 flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            {item.type === 'music' && <Music size={14} className="text-blue-400" />}
                            {item.type === 'vocal' && <Mic size={14} className="text-purple-400" />}
                            {item.type === 'speech' && <MessageSquare size={14} className="text-green-400" />}
                            {item.type === 'sfx' && <Wand2 size={14} className="text-yellow-400" />}
                            <span className="font-medium">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.prompt}</p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(item.duration)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}