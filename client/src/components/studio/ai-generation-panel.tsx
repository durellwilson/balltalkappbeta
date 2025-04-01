import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Music, 
  Mic, 
  Volume2, 
  Play, 
  Square, 
  Save, 
  Clock, 
  Loader2,
  ArrowRight,
  Hash,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface AIGenerationPanelProps {
  onGenerateAudio?: (audioData: Blob, settings: any) => void;
  onAddToProject?: (audioData: Blob, settings: any) => void;
  isProcessing?: boolean;
  error?: string | null;
  apiKeyAvailable?: boolean;
  onRequestAPIKey?: () => void;
}

// Define available AI models (in a real app, this would come from an API)
const availableModels = [
  { id: 'music-gen-1', name: 'MusicGen Standard', type: 'music', description: 'Music generation model (30s clips)' },
  { id: 'text-to-speech-1', name: 'TTS Standard', type: 'speech', description: 'Text-to-speech model with natural voices' },
  { id: 'music-gen-2', name: 'MusicGen Premium', type: 'music', description: 'Advanced music generation (60s clips)' },
  { id: 'vocal-gen-1', name: 'VocalGen', type: 'vocal', description: 'Vocal track generation with lyrics' },
  { id: 'music-clone-1', name: 'StyleClone', type: 'music', description: 'Generate music in a specific style' },
  { id: 'sound-fx-1', name: 'SoundFX', type: 'sfx', description: 'Generate sound effects from text' }
];

// Available voices for TTS
const availableVoices = [
  { id: 'male-1', name: 'Daniel (Male)', gender: 'male', language: 'en-US' },
  { id: 'female-1', name: 'Sophia (Female)', gender: 'female', language: 'en-US' },
  { id: 'male-2', name: 'James (Male)', gender: 'male', language: 'en-GB' },
  { id: 'female-2', name: 'Emily (Female)', gender: 'female', language: 'en-GB' },
  { id: 'male-3', name: 'Carlos (Male)', gender: 'male', language: 'es-ES' },
  { id: 'female-3', name: 'Maria (Female)', gender: 'female', language: 'es-ES' }
];

// Musical styles/genres
const musicGenres = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Classical', 'Jazz',
  'R&B', 'Country', 'Folk', 'Ambient', 'Cinematic', 'Lo-Fi',
  'Trap', 'House', 'Dubstep', 'Funk', 'Soul', 'Metal'
];

// Mood options for music generation
const musicMoods = [
  'Happy', 'Sad', 'Energetic', 'Calm', 'Aggressive', 'Hopeful',
  'Mysterious', 'Romantic', 'Epic', 'Playful', 'Tense', 'Whimsical',
  'Dark', 'Bright', 'Nostalgic', 'Dreamy', 'Inspiring'
];

// Instruments that the AI can focus on
const instruments = [
  'Piano', 'Guitar', 'Drums', 'Bass', 'Strings', 'Synth',
  'Brass', 'Woodwinds', 'Percussion', 'Choir', 'Electric Guitar',
  'Acoustic Guitar', 'Violin', 'Saxophone', 'Trumpet', 'Flute'
];

// Sample generations
const sampleGenerations = [
  {
    id: 'gen1',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    duration: 26.4,
    type: 'music',
    prompt: 'A lo-fi hip hop beat with jazzy piano samples, chill drums and rain ambience',
    parameters: {
      model: 'music-gen-1',
      genre: 'Hip Hop',
      mood: 'Calm',
      tempo: 80,
      duration: 30
    }
  },
  {
    id: 'gen2',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    duration: 12.8,
    type: 'speech',
    prompt: 'Welcome to the audio studio, where creativity flows and ideas come to life. Let's make something amazing today!',
    parameters: {
      model: 'text-to-speech-1',
      voice: 'female-1',
      speed: 1.1,
      pitch: 1.0
    }
  },
  {
    id: 'gen3',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    duration: 18.2,
    type: 'sfx',
    prompt: 'A futuristic portal opening with energy charging up, then a whoosh as it activates',
    parameters: {
      model: 'sound-fx-1',
      complexity: 0.8,
      duration: 20
    }
  }
];

export function AIGenerationPanel({
  onGenerateAudio,
  onAddToProject,
  isProcessing = false,
  error = null,
  apiKeyAvailable = false,
  onRequestAPIKey
}: AIGenerationPanelProps) {
  // State
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [generationType, setGenerationType] = useState<'music' | 'speech' | 'vocal' | 'sfx'>('music');
  const [selectedModel, setSelectedModel] = useState(availableModels[0].id);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(30);
  const [genre, setGenre] = useState<string>('Pop');
  const [mood, setMood] = useState<string>('Happy');
  const [tempo, setTempo] = useState(120);
  const [selectedVoice, setSelectedVoice] = useState(availableVoices[0].id);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [includeInstrument, setIncludeInstrument] = useState(false);
  const [focusInstrument, setFocusInstrument] = useState<string>('Piano');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [generations, setGenerations] = useState(sampleGenerations);
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);
  const [useReference, setUseReference] = useState(false);
  
  // Handle model change
  const handleModelChange = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(modelId);
      setGenerationType(model.type as any);
    }
  };
  
  // Handle generation
  const handleGenerate = () => {
    if (!apiKeyAvailable) {
      if (onRequestAPIKey) {
        onRequestAPIKey();
      } else {
        toast({
          title: "API Key Required",
          description: "An API key is needed for AI generation.",
          variant: "destructive"
        });
      }
      return;
    }
    
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a detailed prompt to guide the AI generation.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would call an API with the appropriate parameters
    // For now, we'll just simulate a success after a delay
    toast({
      title: "Generation Started",
      description: `Your ${generationType} is being generated. This may take a minute.`
    });
    
    // Gather parameters based on generation type
    const parameters: any = {
      model: selectedModel,
      prompt,
    };
    
    if (generationType === 'music') {
      parameters.genre = genre;
      parameters.mood = mood;
      parameters.tempo = tempo;
      parameters.duration = duration;
      
      if (includeInstrument) {
        parameters.focusInstrument = focusInstrument;
      }
      
      if (useReference && referenceAudio) {
        parameters.referenceAudio = referenceAudio;
      }
    } else if (generationType === 'speech') {
      parameters.voice = selectedVoice;
      parameters.speed = speechSpeed;
      parameters.pitch = voicePitch;
    } else if (generationType === 'vocal') {
      parameters.voice = selectedVoice;
      parameters.pitch = voicePitch;
      parameters.duration = duration;
    } else if (generationType === 'sfx') {
      parameters.duration = Math.min(duration, 20); // SFX are limited to 20 seconds
    }
    
    // If we had a real implementation, we would call onGenerateAudio with the result
    // For now, let's just simulate success after 3 seconds
    setTimeout(() => {
      // In a real app, this would be the actual audio blob from the generation API
      const mockAudioBlob = new Blob([], { type: 'audio/wav' });
      
      if (onGenerateAudio) {
        onGenerateAudio(mockAudioBlob, parameters);
      }
      
      // Add to history
      setGenerations([
        {
          id: `gen-${Date.now()}`,
          timestamp: new Date().toISOString(),
          duration: duration,
          type: generationType,
          prompt,
          parameters
        },
        ...generations
      ]);
      
      toast({
        title: "Generation Complete",
        description: "Your audio has been generated successfully."
      });
    }, 3000);
  };
  
  // Handle play/stop generation
  const handlePlayGeneration = (id: string) => {
    if (currentlyPlaying === id) {
      // Stop playing
      setCurrentlyPlaying(null);
    } else {
      // Start playing
      setCurrentlyPlaying(id);
      
      // In a real app, we'd play the actual audio
      // For now, simulate stopping after 3 seconds
      setTimeout(() => {
        if (currentlyPlaying === id) {
          setCurrentlyPlaying(null);
        }
      }, 3000);
    }
  };
  
  // Handle adding a generation to the project
  const handleAddToProject = (id: string) => {
    const generation = generations.find(g => g.id === id);
    if (!generation) return;
    
    // In a real app, we'd have the actual audio blob
    // For now, create a mock blob
    const mockAudioBlob = new Blob([], { type: 'audio/wav' });
    
    if (onAddToProject) {
      onAddToProject(mockAudioBlob, generation.parameters);
      
      toast({
        title: "Added to Project",
        description: "The generated audio has been added to your project."
      });
    }
  };
  
  // Handle reference audio file selection
  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReferenceAudio(e.target.files[0]);
      setUseReference(true);
      
      toast({
        description: `Reference file "${e.target.files[0].name}" selected.`
      });
    }
  };
  
  // Format timestamp relative to now
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return date.toLocaleDateString();
  };
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Render the appropriate generation form based on type
  const renderGenerationForm = () => {
    return (
      <div className="space-y-4">
        {/* Model selection */}
        <div className="space-y-2">
          <Label>AI Model</Label>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {availableModels.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    <span className="text-xs text-gray-400">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Prompt</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <HelpCircle size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {generationType === 'music' && "Describe the music you want to generate. Include genre, mood, instruments, tempo, and style references."}
                    {generationType === 'speech' && "Enter the text you want the AI to speak. Add [pause] for pauses, [emphasis] for emphasis."}
                    {generationType === 'vocal' && "Enter lyrics and describe the vocal style, emotion, and delivery you want."}
                    {generationType === 'sfx' && "Describe the sound effect in detail, including environment, texture, and sonic characteristics."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-24 bg-gray-800 border-gray-700 resize-none"
            placeholder={
              generationType === 'music' 
                ? "Describe the music you want (e.g., 'A lo-fi hip hop beat with jazzy piano, chill drums, and rain ambience')"
                : generationType === 'speech'
                ? "Enter the text you want the AI to speak..."
                : generationType === 'vocal'
                ? "Enter lyrics and describe the vocal style..."
                : "Describe the sound effect in detail..."
            }
          />
        </div>
        
        {/* Additional parameters based on generation type */}
        {generationType === 'music' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {musicGenres.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select a mood" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {musicMoods.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tempo (BPM)</Label>
                <span className="text-sm text-gray-400">{tempo} BPM</span>
              </div>
              <Slider
                value={[tempo]}
                min={40}
                max={200}
                step={1}
                onValueChange={values => setTempo(values[0])}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Duration</Label>
                <span className="text-sm text-gray-400">{duration} seconds</span>
              </div>
              <Slider
                value={[duration]}
                min={5}
                max={60}
                step={5}
                onValueChange={values => setDuration(values[0])}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-instrument"
                  checked={includeInstrument}
                  onCheckedChange={setIncludeInstrument}
                />
                <Label htmlFor="include-instrument">Focus on specific instrument</Label>
              </div>
              
              {includeInstrument && (
                <Select value={focusInstrument} onValueChange={setFocusInstrument}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select an instrument" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {instruments.map(instrument => (
                      <SelectItem key={instrument} value={instrument}>{instrument}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-reference"
                  checked={useReference}
                  onCheckedChange={setUseReference}
                />
                <Label htmlFor="use-reference">Use reference audio</Label>
              </div>
              
              {useReference && (
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="audio/*"
                    className="bg-gray-800 border-gray-700"
                    onChange={handleReferenceFileChange}
                  />
                  {referenceAudio && (
                    <p className="text-xs text-gray-400 mt-1">
                      Selected: {referenceAudio.name} ({(referenceAudio.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        
        {generationType === 'speech' && (
          <>
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {availableVoices.map(voice => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span>{voice.name}</span>
                        <span className="text-xs text-gray-400">{voice.language}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Speed</Label>
                <span className="text-sm text-gray-400">{speechSpeed.toFixed(1)}x</span>
              </div>
              <Slider
                value={[speechSpeed * 10]}
                min={5}
                max={20}
                step={1}
                onValueChange={values => setSpeechSpeed(values[0] / 10)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pitch</Label>
                <span className="text-sm text-gray-400">{voicePitch.toFixed(1)}</span>
              </div>
              <Slider
                value={[voicePitch * 10]}
                min={7}
                max={13}
                step={1}
                onValueChange={values => setVoicePitch(values[0] / 10)}
              />
            </div>
          </>
        )}
        
        {generationType === 'vocal' && (
          <>
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {availableVoices.map(voice => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pitch</Label>
                <span className="text-sm text-gray-400">{voicePitch.toFixed(1)}</span>
              </div>
              <Slider
                value={[voicePitch * 10]}
                min={7}
                max={13}
                step={1}
                onValueChange={values => setVoicePitch(values[0] / 10)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Duration</Label>
                <span className="text-sm text-gray-400">{duration} seconds</span>
              </div>
              <Slider
                value={[duration]}
                min={5}
                max={60}
                step={5}
                onValueChange={values => setDuration(values[0])}
              />
            </div>
          </>
        )}
        
        {generationType === 'sfx' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Duration</Label>
              <span className="text-sm text-gray-400">{Math.min(duration, 20)} seconds</span>
            </div>
            <Slider
              value={[Math.min(duration, 20)]}
              min={1}
              max={20}
              step={1}
              onValueChange={values => setDuration(values[0])}
            />
            <p className="text-xs text-gray-400">Sound effects are limited to 20 seconds maximum</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-md p-3 text-red-400 flex items-start">
            <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {!apiKeyAvailable && (
          <div className="bg-yellow-900/30 border border-yellow-800 rounded-md p-3 text-yellow-400 flex items-start">
            <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">API key required for AI generation</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-yellow-800 bg-yellow-900/30 hover:bg-yellow-900/50"
                onClick={onRequestAPIKey}
              >
                Request API Key
              </Button>
            </div>
          </div>
        )}
        
        <Button 
          className="w-full"
          disabled={isProcessing || !prompt.trim() || !apiKeyAvailable}
          onClick={handleGenerate}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={16} className="mr-2" />
              Generate {generationType === 'music' ? 'Music' : generationType === 'speech' ? 'Speech' : generationType === 'vocal' ? 'Vocals' : 'Sound Effect'}
            </>
          )}
        </Button>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-md overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center">
          <Sparkles size={16} className="mr-2 text-purple-400" />
          <h3 className="font-medium">AI Audio Generation</h3>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="bg-gray-800">
            <TabsTrigger value="generate" className="text-xs">Generate</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="generate" className="flex-1 p-0 m-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <div className="grid gap-3 mb-4">
              <Button
                variant={generationType === 'music' ? 'default' : 'outline'}
                className={generationType === 'music' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 border-gray-700'}
                onClick={() => setGenerationType('music')}
              >
                <Music size={16} className="mr-2" />
                Music
              </Button>
              
              <Button
                variant={generationType === 'speech' ? 'default' : 'outline'}
                className={generationType === 'speech' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 border-gray-700'}
                onClick={() => setGenerationType('speech')}
              >
                <Volume2 size={16} className="mr-2" />
                Speech
              </Button>
              
              <Button
                variant={generationType === 'vocal' ? 'default' : 'outline'}
                className={generationType === 'vocal' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-800 border-gray-700'}
                onClick={() => setGenerationType('vocal')}
              >
                <Mic size={16} className="mr-2" />
                Vocals
              </Button>
              
              <Button
                variant={generationType === 'sfx' ? 'default' : 'outline'}
                className={generationType === 'sfx' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-800 border-gray-700'}
                onClick={() => setGenerationType('sfx')}
              >
                <Hash size={16} className="mr-2" />
                Sound FX
              </Button>
            </div>
            
            {renderGenerationForm()}
          </div>
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="history" className="flex-1 p-0 m-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {generations.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Clock size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No generations yet</p>
                <p className="text-xs mt-1">Your AI generations will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generations.map(gen => (
                  <Card key={gen.id} className="bg-gray-800 border-gray-700">
                    <CardHeader className="p-3 pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {gen.type === 'music' && <Music size={16} className="mr-2 text-blue-400" />}
                          {gen.type === 'speech' && <Volume2 size={16} className="mr-2 text-green-400" />}
                          {gen.type === 'vocal' && <Mic size={16} className="mr-2 text-purple-400" />}
                          {gen.type === 'sfx' && <Hash size={16} className="mr-2 text-amber-400" />}
                          <CardTitle className="text-sm font-medium">
                            {gen.type === 'music' ? 'Music' : gen.type === 'speech' ? 'Speech' : gen.type === 'vocal' ? 'Vocals' : 'Sound FX'} Generation
                          </CardTitle>
                        </div>
                        <Badge variant="outline" className="text-gray-400 text-xs">
                          {formatTimestamp(gen.timestamp)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-3">
                      <div className="mb-2 text-sm text-gray-300 line-clamp-2" title={gen.prompt}>
                        {gen.prompt}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {gen.parameters.model && (
                          <Badge variant="outline" className="text-xs bg-gray-900 border-gray-700">
                            {availableModels.find(m => m.id === gen.parameters.model)?.name || gen.parameters.model}
                          </Badge>
                        )}
                        
                        {gen.parameters.genre && (
                          <Badge variant="outline" className="text-xs bg-gray-900 border-gray-700">
                            {gen.parameters.genre}
                          </Badge>
                        )}
                        
                        {gen.parameters.mood && (
                          <Badge variant="outline" className="text-xs bg-gray-900 border-gray-700">
                            {gen.parameters.mood}
                          </Badge>
                        )}
                        
                        {gen.parameters.tempo && (
                          <Badge variant="outline" className="text-xs bg-gray-900 border-gray-700">
                            {gen.parameters.tempo} BPM
                          </Badge>
                        )}
                        
                        {gen.parameters.voice && (
                          <Badge variant="outline" className="text-xs bg-gray-900 border-gray-700">
                            {availableVoices.find(v => v.id === gen.parameters.voice)?.name || gen.parameters.voice}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock size={12} className="mr-1" />
                          {formatDuration(gen.duration)}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 px-2 bg-gray-800 border-gray-700"
                            onClick={() => handlePlayGeneration(gen.id)}
                          >
                            {currentlyPlaying === gen.id ? (
                              <>
                                <Square size={12} className="mr-1" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Play size={12} className="mr-1" />
                                Play
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 px-2 bg-gray-800 border-gray-700"
                            onClick={() => handleAddToProject(gen.id)}
                          >
                            <Save size={12} className="mr-1" />
                            Add to Project
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-3 pt-0">
                      <div className="flex justify-between w-full">
                        <div className="flex -space-x-0.5">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-6 w-6 p-0 rounded-full text-green-400 hover:text-green-300 hover:bg-green-900/20"
                          >
                            <ThumbsUp size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-6 w-6 p-0 rounded-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <ThumbsDown size={14} />
                          </Button>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 px-2 text-xs"
                        >
                          <RefreshCw size={12} className="mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </div>
  );
}