import React, { useState } from 'react';
import { 
  Disc, 
  Sliders, 
  Save, 
  PlayCircle, 
  SquareSlash, 
  Waveform, 
  BarChart3, 
  Download,
  RefreshCw,
  Sparkles,
  CornerRightDown,
  Check,
  Copy,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { SpectrumAnalyzer } from '@/components/ui/spectrum-analyzer';
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer';

interface MasteringPanelProps {
  onMaster?: (settings: MasteringSettings) => Promise<boolean>;
  onExport?: (format: string, quality: string) => Promise<string>;
  onAiMaster?: () => Promise<boolean>;
  inputLevel?: number; // 0-1 range for meter
  outputLevel?: number; // 0-1 range for meter
  isProcessing?: boolean;
  masterSettings?: MasteringSettings;
  onSettingsChange?: (settings: MasteringSettings) => void;
  presetNames?: string[];
  onSavePreset?: (name: string, settings: MasteringSettings) => void;
  onLoadPreset?: (name: string) => void;
}

interface MasteringSettings {
  limiter: {
    enabled: boolean;
    threshold: number;
    release: number;
  };
  compressor: {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    knee: number;
    makeupGain: number;
  };
  equalizer: {
    enabled: boolean;
    lowGain: number;
    midGain: number;
    highGain: number;
    lowFreq: number;
    midFreq: number;
    highFreq: number;
  };
  stereoWidth: {
    enabled: boolean;
    width: number;
  };
  maximizer: {
    enabled: boolean;
    gain: number;
    ceiling: number;
  };
  outputGain: number;
}

const defaultSettings: MasteringSettings = {
  limiter: {
    enabled: true,
    threshold: -1.0,
    release: 50
  },
  compressor: {
    enabled: true,
    threshold: -18,
    ratio: 3,
    attack: 5,
    release: 100,
    knee: 10,
    makeupGain: 1
  },
  equalizer: {
    enabled: true,
    lowGain: 0,
    midGain: 0,
    highGain: 0,
    lowFreq: 200,
    midFreq: 1000,
    highFreq: 5000
  },
  stereoWidth: {
    enabled: false,
    width: 100
  },
  maximizer: {
    enabled: true,
    gain: 3,
    ceiling: -0.3
  },
  outputGain: 0
};

// Sample presets
const samplePresets = [
  'Clean Master',
  'Loud and Proud',
  'Warm and Smooth',
  'Crisp and Clear',
  'Deep Bass',
  'Vocal Focus',
  'Lo-Fi Warmth',
  'Electronic Dance'
];

export function MasteringPanel({
  onMaster,
  onExport,
  onAiMaster,
  inputLevel = 0,
  outputLevel = 0,
  isProcessing = false,
  masterSettings = defaultSettings,
  onSettingsChange,
  presetNames = samplePresets,
  onSavePreset,
  onLoadPreset
}: MasteringPanelProps) {
  const [activeTab, setActiveTab] = useState('mastering');
  const [isPlaying, setIsPlaying] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [exportFormat, setExportFormat] = useState('wav');
  const [exportQuality, setExportQuality] = useState('high');
  const [localSettings, setLocalSettings] = useState<MasteringSettings>(masterSettings);
  
  // Update local settings when prop changes
  React.useEffect(() => {
    setLocalSettings(masterSettings);
  }, [masterSettings]);
  
  // Handle settings change
  const handleSettingChange = (
    module: keyof MasteringSettings,
    setting: string,
    value: number | boolean
  ) => {
    const newSettings = { ...localSettings };
    
    if (module === 'outputGain') {
      (newSettings as any)[module] = value;
    } else {
      (newSettings[module] as any)[setting] = value;
    }
    
    setLocalSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };
  
  // Handle master command
  const handleMaster = async () => {
    try {
      if (onMaster) {
        await onMaster(localSettings);
      }
      toast({
        title: "Mastering Complete",
        description: "Your project has been mastered with the current settings."
      });
    } catch (error) {
      toast({
        title: "Mastering Failed",
        description: "There was a problem applying the mastering settings.",
        variant: "destructive"
      });
    }
  };
  
  // Handle AI mastering
  const handleAiMaster = async () => {
    try {
      if (onAiMaster) {
        await onAiMaster();
      }
      toast({
        title: "AI Mastering Complete",
        description: "Your project has been mastered using AI optimization."
      });
    } catch (error) {
      toast({
        title: "AI Mastering Failed",
        description: "There was a problem with AI mastering.",
        variant: "destructive"
      });
    }
  };
  
  // Handle export
  const handleExport = async () => {
    try {
      if (onExport) {
        const exportPath = await onExport(exportFormat, exportQuality);
        
        toast({
          title: "Export Complete",
          description: `Your project has been exported as ${exportFormat.toUpperCase()}.`
        });
        
        return exportPath;
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was a problem exporting your project.",
        variant: "destructive"
      });
    }
    
    return '';
  };
  
  // Handle saving a preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast({
        title: "Preset Name Required",
        description: "Please enter a name for your preset.",
        variant: "destructive"
      });
      return;
    }
    
    if (onSavePreset) {
      onSavePreset(newPresetName, localSettings);
      setNewPresetName('');
      
      toast({
        title: "Preset Saved",
        description: `"${newPresetName}" preset has been saved.`
      });
    }
  };
  
  // Handle loading a preset
  const handleLoadPreset = (presetName: string) => {
    if (onLoadPreset) {
      onLoadPreset(presetName);
      
      toast({
        description: `"${presetName}" preset loaded.`
      });
    }
  };
  
  // Toggle play/stop
  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would start/stop playback of the master output
  };
  
  // Reset settings to default
  const handleResetSettings = () => {
    setLocalSettings(defaultSettings);
    if (onSettingsChange) {
      onSettingsChange(defaultSettings);
    }
    
    toast({
      description: "Settings reset to default."
    });
  };
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-md overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center">
          <Disc size={16} className="mr-2 text-purple-400" />
          <h3 className="font-medium">Mastering & Export</h3>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800">
            <TabsTrigger value="mastering" className="text-xs">Mastering</TabsTrigger>
            <TabsTrigger value="analyze" className="text-xs">Analyze</TabsTrigger>
            <TabsTrigger value="export" className="text-xs">Export</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-auto">
        <TabsContent value="mastering" className="p-0 m-0 h-full">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {/* Main controls */}
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700"
                  onClick={handleResetSettings}
                >
                  <RefreshCw size={14} className="mr-1" />
                  Reset
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-gray-800 border-gray-700">
                      <Save size={14} className="mr-1" />
                      Presets
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    {presetNames.map(name => (
                      <DropdownMenuItem key={name} onClick={() => handleLoadPreset(name)}>
                        {name}
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    
                    <div className="p-2">
                      <div className="flex space-x-1">
                        <Input
                          value={newPresetName}
                          onChange={e => setNewPresetName(e.target.value)}
                          placeholder="New preset name..."
                          className="h-7 text-xs bg-gray-900 border-gray-700"
                        />
                        <Button 
                          size="sm"
                          className="h-7 px-2"
                          disabled={!newPresetName.trim()}
                          onClick={handleSavePreset}
                        >
                          <Save size={12} />
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleAiMaster}
                  disabled={isProcessing}
                >
                  <Sparkles size={14} className="mr-1" />
                  AI Master
                </Button>
              </div>
              
              {/* Compressor */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-3 pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <CornerRightDown size={14} className="mr-1" />
                      Compressor
                    </CardTitle>
                    <Switch
                      checked={localSettings.compressor.enabled}
                      onCheckedChange={value => handleSettingChange('compressor', 'enabled', value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Threshold</Label>
                        <span className="text-xs text-gray-400">{localSettings.compressor.threshold} dB</span>
                      </div>
                      <Slider
                        disabled={!localSettings.compressor.enabled}
                        value={[localSettings.compressor.threshold]}
                        min={-60}
                        max={0}
                        step={0.5}
                        onValueChange={values => handleSettingChange('compressor', 'threshold', values[0])}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Ratio</Label>
                        <span className="text-xs text-gray-400">{localSettings.compressor.ratio}:1</span>
                      </div>
                      <Slider
                        disabled={!localSettings.compressor.enabled}
                        value={[localSettings.compressor.ratio]}
                        min={1}
                        max={20}
                        step={0.5}
                        onValueChange={values => handleSettingChange('compressor', 'ratio', values[0])}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Attack</Label>
                          <span className="text-xs text-gray-400">{localSettings.compressor.attack} ms</span>
                        </div>
                        <Slider
                          disabled={!localSettings.compressor.enabled}
                          value={[localSettings.compressor.attack]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={values => handleSettingChange('compressor', 'attack', values[0])}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Release</Label>
                          <span className="text-xs text-gray-400">{localSettings.compressor.release} ms</span>
                        </div>
                        <Slider
                          disabled={!localSettings.compressor.enabled}
                          value={[localSettings.compressor.release]}
                          min={0}
                          max={1000}
                          step={10}
                          onValueChange={values => handleSettingChange('compressor', 'release', values[0])}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Knee</Label>
                          <span className="text-xs text-gray-400">{localSettings.compressor.knee} dB</span>
                        </div>
                        <Slider
                          disabled={!localSettings.compressor.enabled}
                          value={[localSettings.compressor.knee]}
                          min={0}
                          max={40}
                          step={1}
                          onValueChange={values => handleSettingChange('compressor', 'knee', values[0])}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Makeup Gain</Label>
                          <span className="text-xs text-gray-400">{localSettings.compressor.makeupGain} dB</span>
                        </div>
                        <Slider
                          disabled={!localSettings.compressor.enabled}
                          value={[localSettings.compressor.makeupGain]}
                          min={0}
                          max={24}
                          step={0.5}
                          onValueChange={values => handleSettingChange('compressor', 'makeupGain', values[0])}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Equalizer */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-3 pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Sliders size={14} className="mr-1" />
                      Equalizer
                    </CardTitle>
                    <Switch
                      checked={localSettings.equalizer.enabled}
                      onCheckedChange={value => handleSettingChange('equalizer', 'enabled', value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Low</Label>
                          <span className="text-xs text-gray-400">{localSettings.equalizer.lowGain} dB</span>
                        </div>
                        <Slider
                          disabled={!localSettings.equalizer.enabled}
                          value={[localSettings.equalizer.lowGain]}
                          min={-12}
                          max={12}
                          step={0.5}
                          onValueChange={values => handleSettingChange('equalizer', 'lowGain', values[0])}
                        />
                        <div className="flex justify-center">
                          <span className="text-xs text-gray-400">{localSettings.equalizer.lowFreq} Hz</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Mid</Label>
                          <span className="text-xs text-gray-400">{localSettings.equalizer.midGain} dB</span>
                        </div>
                        <Slider
                          disabled={!localSettings.equalizer.enabled}
                          value={[localSettings.equalizer.midGain]}
                          min={-12}
                          max={12}
                          step={0.5}
                          onValueChange={values => handleSettingChange('equalizer', 'midGain', values[0])}
                        />
                        <div className="flex justify-center">
                          <span className="text-xs text-gray-400">{localSettings.equalizer.midFreq} Hz</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">High</Label>
                          <span className="text-xs text-gray-400">{localSettings.equalizer.highGain} dB</span>
                        </div>
                        <Slider
                          disabled={!localSettings.equalizer.enabled}
                          value={[localSettings.equalizer.highGain]}
                          min={-12}
                          max={12}
                          step={0.5}
                          onValueChange={values => handleSettingChange('equalizer', 'highGain', values[0])}
                        />
                        <div className="flex justify-center">
                          <span className="text-xs text-gray-400">{localSettings.equalizer.highFreq} Hz</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Low Freq</Label>
                          <Slider
                            disabled={!localSettings.equalizer.enabled}
                            value={[localSettings.equalizer.lowFreq]}
                            min={20}
                            max={500}
                            step={10}
                            onValueChange={values => handleSettingChange('equalizer', 'lowFreq', values[0])}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Mid Freq</Label>
                          <Slider
                            disabled={!localSettings.equalizer.enabled}
                            value={[localSettings.equalizer.midFreq]}
                            min={200}
                            max={5000}
                            step={100}
                            onValueChange={values => handleSettingChange('equalizer', 'midFreq', values[0])}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">High Freq</Label>
                          <Slider
                            disabled={!localSettings.equalizer.enabled}
                            value={[localSettings.equalizer.highFreq]}
                            min={2000}
                            max={20000}
                            step={1000}
                            onValueChange={values => handleSettingChange('equalizer', 'highFreq', values[0])}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Limiter */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-3 pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Zap size={14} className="mr-1" />
                      Limiter
                    </CardTitle>
                    <Switch
                      checked={localSettings.limiter.enabled}
                      onCheckedChange={value => handleSettingChange('limiter', 'enabled', value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Threshold</Label>
                        <span className="text-xs text-gray-400">{localSettings.limiter.threshold} dB</span>
                      </div>
                      <Slider
                        disabled={!localSettings.limiter.enabled}
                        value={[localSettings.limiter.threshold]}
                        min={-12}
                        max={0}
                        step={0.1}
                        onValueChange={values => handleSettingChange('limiter', 'threshold', values[0])}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Release</Label>
                        <span className="text-xs text-gray-400">{localSettings.limiter.release} ms</span>
                      </div>
                      <Slider
                        disabled={!localSettings.limiter.enabled}
                        value={[localSettings.limiter.release]}
                        min={1}
                        max={500}
                        step={1}
                        onValueChange={values => handleSettingChange('limiter', 'release', values[0])}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Stereo Width */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-3 pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Stereo Width</CardTitle>
                    <Switch
                      checked={localSettings.stereoWidth.enabled}
                      onCheckedChange={value => handleSettingChange('stereoWidth', 'enabled', value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Width</Label>
                      <span className="text-xs text-gray-400">{localSettings.stereoWidth.width}%</span>
                    </div>
                    <Slider
                      disabled={!localSettings.stereoWidth.enabled}
                      value={[localSettings.stereoWidth.width]}
                      min={0}
                      max={200}
                      step={1}
                      onValueChange={values => handleSettingChange('stereoWidth', 'width', values[0])}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Maximizer */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-3 pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Maximizer</CardTitle>
                    <Switch
                      checked={localSettings.maximizer.enabled}
                      onCheckedChange={value => handleSettingChange('maximizer', 'enabled', value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Gain</Label>
                        <span className="text-xs text-gray-400">{localSettings.maximizer.gain} dB</span>
                      </div>
                      <Slider
                        disabled={!localSettings.maximizer.enabled}
                        value={[localSettings.maximizer.gain]}
                        min={0}
                        max={12}
                        step={0.1}
                        onValueChange={values => handleSettingChange('maximizer', 'gain', values[0])}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Ceiling</Label>
                        <span className="text-xs text-gray-400">{localSettings.maximizer.ceiling} dB</span>
                      </div>
                      <Slider
                        disabled={!localSettings.maximizer.enabled}
                        value={[localSettings.maximizer.ceiling]}
                        min={-6}
                        max={0}
                        step={0.1}
                        onValueChange={values => handleSettingChange('maximizer', 'ceiling', values[0])}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Output Gain */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-sm font-medium">Output Gain</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Gain</Label>
                      <span className="text-xs text-gray-400">{localSettings.outputGain} dB</span>
                    </div>
                    <Slider
                      value={[localSettings.outputGain]}
                      min={-12}
                      max={12}
                      step={0.5}
                      onValueChange={values => handleSettingChange('outputGain', '', values[0])}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Apply Button */}
              <div className="pt-2">
                <Button className="w-full" onClick={handleMaster} disabled={isProcessing}>
                  {isProcessing ? (
                    <>Applying Mastering...</>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" />
                      Apply Mastering
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="analyze" className="p-4 m-0">
          <div className="grid gap-4">
            {/* Spectrum Analyzer */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm font-medium flex items-center">
                  <BarChart3 size={14} className="mr-1" />
                  Spectrum Analyzer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-48">
                  <SpectrumAnalyzer 
                    height={180}
                    barCount={128}
                    style="area"
                    gradientColors={['#3b82f6', '#8b5cf6', '#d946ef']}
                    isMaster={true}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Waveform */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Waveform size={14} className="mr-1" />
                  Waveform
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-48">
                  <WaveformVisualizer
                    height={180}
                    isMaster={true}
                    animated={true}
                    showPlayhead={true}
                    gradientColors={['#6366f1', '#8b5cf6', '#d946ef']}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Level Meters */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm font-medium">Level Meters</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="flex justify-around">
                  <div className="flex flex-col items-center">
                    <Label className="text-xs mb-2">Input</Label>
                    <div className="h-32 w-6 bg-gray-900 rounded-sm relative">
                      <div 
                        className={`absolute bottom-0 left-0 right-0 ${
                          inputLevel > 0.9 ? 'bg-red-500' : 
                          inputLevel > 0.7 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        } transition-all`}
                        style={{ height: `${inputLevel * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Label className="text-xs mb-2">Output</Label>
                    <div className="h-32 w-6 bg-gray-900 rounded-sm relative">
                      <div 
                        className={`absolute bottom-0 left-0 right-0 ${
                          outputLevel > 0.9 ? 'bg-red-500' : 
                          outputLevel > 0.7 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        } transition-all`}
                        style={{ height: `${outputLevel * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Playback controls */}
            <div className="flex items-center justify-center mt-2">
              <Button onClick={handlePlayToggle} variant="outline" className="bg-gray-800 border-gray-700">
                {isPlaying ? (
                  <>
                    <SquareSlash size={16} className="mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <PlayCircle size={16} className="mr-2" />
                    Play Mastered Audio
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="export" className="p-4 m-0">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm font-medium">Export Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="wav">WAV (Uncompressed)</SelectItem>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="aac">AAC</SelectItem>
                      <SelectItem value="ogg">OGG Vorbis</SelectItem>
                      <SelectItem value="flac">FLAC (Lossless)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select value={exportQuality} onValueChange={setExportQuality}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {exportFormat === 'wav' ? (
                        <>
                          <SelectItem value="high">32-bit / 96kHz</SelectItem>
                          <SelectItem value="medium">24-bit / 48kHz</SelectItem>
                          <SelectItem value="low">16-bit / 44.1kHz</SelectItem>
                        </>
                      ) : exportFormat === 'flac' ? (
                        <>
                          <SelectItem value="high">Level 8 (Best)</SelectItem>
                          <SelectItem value="medium">Level 5 (Medium)</SelectItem>
                          <SelectItem value="low">Level 1 (Fast)</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="high">320 kbps</SelectItem>
                          <SelectItem value="medium">192 kbps</SelectItem>
                          <SelectItem value="low">128 kbps</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Metadata</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      placeholder="Title" 
                      className="bg-gray-800 border-gray-700" 
                    />
                    <Input 
                      placeholder="Artist" 
                      className="bg-gray-800 border-gray-700" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      placeholder="Album" 
                      className="bg-gray-800 border-gray-700" 
                    />
                    <Input 
                      placeholder="Genre" 
                      className="bg-gray-800 border-gray-700" 
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button className="w-full" onClick={handleExport} disabled={isProcessing}>
                    <Download size={16} className="mr-2" />
                    Export Project
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-400 pt-2">
                  <Copy size={12} />
                  <p>Your exported files will be available in your downloads folder</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </div>
  );
}