import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Disc,
  RefreshCw,
  ZapOff,
  Volume,
  Music,
  Headphones
} from 'lucide-react';

interface Effect {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, any>;
}
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface MasteringPanelProps {
  masterVolume?: number;
  onMasterVolumeChange?: (volume: number) => void;
  masterPan?: number;
  onMasterPanChange?: (pan: number) => void;
  inputLevel?: number;
  outputLevel?: number;
  onEffectsChange?: (effects: Effect[]) => void;
}

export function MasteringPanel({
  masterVolume = 0.8,
  onMasterVolumeChange = () => {},
  masterPan = 0,
  onMasterPanChange,
  inputLevel = 0,
  outputLevel = 0,
  onEffectsChange
}: MasteringPanelProps) {
  // Local state for the mastering panel
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [eqEnabled, setEqEnabled] = useState(true);
  const [compressorEnabled, setCompressorEnabled] = useState(true);
  const [limiterEnabled, setLimiterEnabled] = useState(true);
  const [reverbEnabled, setReverbEnabled] = useState(false);
  
  // EQ settings
  const [eqSettings, setEqSettings] = useState({
    lowGain: 0,
    midGain: 0,
    highGain: 0,
    lowFreq: 200,
    highFreq: 5000
  });
  
  // Compressor settings
  const [compressorSettings, setCompressorSettings] = useState({
    threshold: -24,
    ratio: 4,
    attack: 20,
    release: 250,
    knee: 10,
    makeupGain: 3
  });
  
  // Limiter settings
  const [limiterSettings, setLimiterSettings] = useState({
    threshold: -1,
    release: 50
  });
  
  // Reverb settings
  const [reverbSettings, setReverbSettings] = useState({
    mix: 0.2,
    decay: 2,
    damping: 0.5,
    roomSize: 0.8
  });
  
  // Presets
  const [selectedPreset, setSelectedPreset] = useState('none');
  
  const presets = [
    { value: 'none', label: 'No Preset' },
    { value: 'vocal', label: 'Vocal Focus' },
    { value: 'warm', label: 'Warm Master' },
    { value: 'bright', label: 'Bright and Clear' },
    { value: 'punch', label: 'Punchy Mix' },
    { value: 'vinyl', label: 'Vinyl Warmth' },
    { value: 'radio', label: 'Radio Ready' }
  ];
  
  // Apply preset
  const applyPreset = (preset: string) => {
    // Reset if no preset
    if (preset === 'none') {
      setEqSettings({
        lowGain: 0,
        midGain: 0,
        highGain: 0,
        lowFreq: 200,
        highFreq: 5000
      });
      
      setCompressorSettings({
        threshold: -24,
        ratio: 4,
        attack: 20,
        release: 250,
        knee: 10,
        makeupGain: 3
      });
      
      setLimiterSettings({
        threshold: -1,
        release: 50
      });
      
      setReverbSettings({
        mix: 0.2,
        decay: 2,
        damping: 0.5,
        roomSize: 0.8
      });
      
      setEqEnabled(true);
      setCompressorEnabled(true);
      setLimiterEnabled(true);
      setReverbEnabled(false);
    }
    
    // Apply vocal focus preset
    if (preset === 'vocal') {
      setEqSettings({
        lowGain: -2,
        midGain: 3,
        highGain: 1,
        lowFreq: 150,
        highFreq: 4000
      });
      
      setCompressorSettings({
        threshold: -20,
        ratio: 3,
        attack: 10,
        release: 150,
        knee: 8,
        makeupGain: 2
      });
      
      setLimiterSettings({
        threshold: -1.5,
        release: 60
      });
      
      setReverbSettings({
        mix: 0.15,
        decay: 1.5,
        damping: 0.6,
        roomSize: 0.7
      });
      
      setEqEnabled(true);
      setCompressorEnabled(true);
      setLimiterEnabled(true);
      setReverbEnabled(true);
    }
    
    // Apply warm master preset
    if (preset === 'warm') {
      setEqSettings({
        lowGain: 3,
        midGain: -1,
        highGain: -2,
        lowFreq: 250,
        highFreq: 3500
      });
      
      setCompressorSettings({
        threshold: -18,
        ratio: 3.5,
        attack: 30,
        release: 300,
        knee: 12,
        makeupGain: 2.5
      });
      
      setLimiterSettings({
        threshold: -1,
        release: 100
      });
      
      setReverbSettings({
        mix: 0.1,
        decay: 1.8,
        damping: 0.7,
        roomSize: 0.6
      });
      
      setEqEnabled(true);
      setCompressorEnabled(true);
      setLimiterEnabled(true);
      setReverbEnabled(false);
    }
    
    // Apply bright and clear preset
    if (preset === 'bright') {
      setEqSettings({
        lowGain: -1,
        midGain: 0,
        highGain: 4,
        lowFreq: 200,
        highFreq: 6000
      });
      
      setCompressorSettings({
        threshold: -22,
        ratio: 2.5,
        attack: 15,
        release: 200,
        knee: 6,
        makeupGain: 2
      });
      
      setLimiterSettings({
        threshold: -1,
        release: 40
      });
      
      setReverbSettings({
        mix: 0.05,
        decay: 1.2,
        damping: 0.3,
        roomSize: 0.5
      });
      
      setEqEnabled(true);
      setCompressorEnabled(true);
      setLimiterEnabled(true);
      setReverbEnabled(false);
    }
  };
  
  // Handle preset selection
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    applyPreset(preset);
  };
  
  // Generate and update effects when settings change
  useEffect(() => {
    if (onEffectsChange) {
      const effects: Effect[] = [];
      
      // Only add effects if master effects are enabled
      if (effectsEnabled) {
        // Add EQ effect if enabled
        if (eqEnabled) {
          effects.push({
            id: 'master-eq',
            type: 'eq',
            name: 'Parametric EQ',
            enabled: true,
            parameters: eqSettings
          });
        }
        
        // Add compressor effect if enabled
        if (compressorEnabled) {
          effects.push({
            id: 'master-compressor',
            type: 'compressor',
            name: 'Compressor',
            enabled: true,
            parameters: compressorSettings
          });
        }
        
        // Add limiter effect if enabled
        if (limiterEnabled) {
          effects.push({
            id: 'master-limiter',
            type: 'limiter',
            name: 'Limiter',
            enabled: true,
            parameters: limiterSettings
          });
        }
        
        // Add reverb effect if enabled
        if (reverbEnabled) {
          effects.push({
            id: 'master-reverb',
            type: 'reverb',
            name: 'Reverb',
            enabled: true,
            parameters: reverbSettings
          });
        }
      }
      
      onEffectsChange(effects);
    }
  }, [
    onEffectsChange, 
    effectsEnabled, 
    eqEnabled, eqSettings, 
    compressorEnabled, compressorSettings, 
    limiterEnabled, limiterSettings, 
    reverbEnabled, reverbSettings
  ]);
  
  // Format number with fixed decimal places
  const formatNumber = (value: number, decimals: number = 1): string => {
    return value.toFixed(decimals);
  };
  
  // Format dB value
  const formatDb = (value: number): string => {
    return value > 0 ? `+${formatNumber(value)}dB` : `${formatNumber(value)}dB`;
  };
  
  // Format percentage
  const formatPercent = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };
  
  // Format milliseconds
  const formatMs = (value: number): string => {
    return `${value}ms`;
  };
  
  // Format seconds
  const formatSeconds = (value: number): string => {
    return `${formatNumber(value)}s`;
  };
  
  // Format hertz
  const formatHz = (value: number): string => {
    return value >= 1000 ? `${formatNumber(value / 1000)}kHz` : `${value}Hz`;
  };
  
  return (
    <div className="flex flex-col h-full">
      <Card className="bg-gray-800 border-gray-700 mb-3">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center">
            <Disc size={14} className="mr-1 text-purple-400" />
            Master Output
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {/* Master output level */}
          <div className="mb-4 flex items-center space-x-4">
            <div className="flex flex-col justify-between h-16 w-4 bg-gray-900 rounded-full overflow-hidden relative">
              <div 
                className="w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500"
                style={{ height: `${Math.min(100, Math.max(outputLevel * 100, 1))}%` }}
              ></div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Master Volume</Label>
                <span className="text-xs text-gray-400">{Math.round(masterVolume * 100)}%</span>
              </div>
              <Slider
                value={[masterVolume * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(values) => onMasterVolumeChange(values[0] / 100)}
              />
              
              {onMasterPanChange && (
                <>
                  <div className="flex justify-between">
                    <Label className="text-xs">Stereo Balance</Label>
                    <span className="text-xs text-gray-400">
                      {masterPan === 0
                        ? 'Center'
                        : masterPan < 0
                        ? `${Math.round(Math.abs(masterPan) * 100)}% L`
                        : `${Math.round(masterPan * 100)}% R`}
                    </span>
                  </div>
                  <Slider
                    value={[((masterPan + 1) / 2) * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(values) => onMasterPanChange((values[0] / 100) * 2 - 1)}
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Effects master toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Sliders size={14} className={`mr-1 ${effectsEnabled ? 'text-blue-400' : 'text-gray-400'}`} />
              <Label className="text-sm font-medium">Mastering Effects</Label>
            </div>
            <Switch 
              checked={effectsEnabled}
              onCheckedChange={setEffectsEnabled}
            />
          </div>
          
          {/* Presets selection */}
          <div className="mb-4">
            <Label className="text-xs mb-1 block">Mastering Preset</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="bg-gray-900 border-gray-700">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {presets.map(preset => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedPreset !== 'none' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-xs h-7"
                onClick={() => handlePresetChange('none')}
              >
                <RotateCcw size={12} className="mr-1" />
                Reset to Default
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <ScrollArea className="flex-1">
        <div className="p-1 space-y-2">
          {/* Effects Accordion */}
          <Accordion type="multiple" defaultValue={['eq', 'comp', 'limiter']} className="mb-3">
            {/* EQ */}
            <AccordionItem value="eq" className="border-b-0">
              <AccordionTrigger className="py-2 px-3 text-sm hover:bg-gray-700/30 rounded-md hover:no-underline">
                <div className="flex items-center">
                  <div className={`w-2 h-10 rounded-sm mr-2 ${eqEnabled && effectsEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}></div>
                  <div>
                    <div className="font-medium text-sm flex items-center">
                      Parametric EQ
                      <Switch
                        checked={eqEnabled}
                        disabled={!effectsEnabled}
                        onCheckedChange={setEqEnabled}
                        className="ml-2 h-4 w-7 data-[state=checked]:bg-blue-600"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div className="text-xs text-gray-400">3-band equalizer</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-2 px-3">
                <div className={`space-y-3 ${(!eqEnabled || !effectsEnabled) ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Low Gain */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Low Gain</Label>
                      <span className="text-xs text-gray-400">{formatDb(eqSettings.lowGain)}</span>
                    </div>
                    <Slider
                      value={[eqSettings.lowGain + 12]}
                      min={0}
                      max={24}
                      step={0.5}
                      onValueChange={(values) => setEqSettings({...eqSettings, lowGain: values[0] - 12})}
                    />
                  </div>
                  
                  {/* Mid Gain */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Mid Gain</Label>
                      <span className="text-xs text-gray-400">{formatDb(eqSettings.midGain)}</span>
                    </div>
                    <Slider
                      value={[eqSettings.midGain + 12]}
                      min={0}
                      max={24}
                      step={0.5}
                      onValueChange={(values) => setEqSettings({...eqSettings, midGain: values[0] - 12})}
                    />
                  </div>
                  
                  {/* High Gain */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">High Gain</Label>
                      <span className="text-xs text-gray-400">{formatDb(eqSettings.highGain)}</span>
                    </div>
                    <Slider
                      value={[eqSettings.highGain + 12]}
                      min={0}
                      max={24}
                      step={0.5}
                      onValueChange={(values) => setEqSettings({...eqSettings, highGain: values[0] - 12})}
                    />
                  </div>
                  
                  {/* Low Frequency */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Low Cutoff</Label>
                      <span className="text-xs text-gray-400">{formatHz(eqSettings.lowFreq)}</span>
                    </div>
                    <Slider
                      value={[eqSettings.lowFreq]}
                      min={20}
                      max={1000}
                      step={10}
                      onValueChange={(values) => setEqSettings({...eqSettings, lowFreq: values[0]})}
                    />
                  </div>
                  
                  {/* High Frequency */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">High Cutoff</Label>
                      <span className="text-xs text-gray-400">{formatHz(eqSettings.highFreq)}</span>
                    </div>
                    <Slider
                      value={[eqSettings.highFreq]}
                      min={1000}
                      max={20000}
                      step={100}
                      onValueChange={(values) => setEqSettings({...eqSettings, highFreq: values[0]})}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Compressor */}
            <AccordionItem value="comp" className="border-b-0">
              <AccordionTrigger className="py-2 px-3 text-sm hover:bg-gray-700/30 rounded-md hover:no-underline">
                <div className="flex items-center">
                  <div className={`w-2 h-10 rounded-sm mr-2 ${compressorEnabled && effectsEnabled ? 'bg-purple-500' : 'bg-gray-700'}`}></div>
                  <div>
                    <div className="font-medium text-sm flex items-center">
                      Compressor
                      <Switch
                        checked={compressorEnabled}
                        disabled={!effectsEnabled}
                        onCheckedChange={setCompressorEnabled}
                        className="ml-2 h-4 w-7 data-[state=checked]:bg-purple-600"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div className="text-xs text-gray-400">Dynamic range control</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-2 px-3">
                <div className={`space-y-3 ${(!compressorEnabled || !effectsEnabled) ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Threshold */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Threshold</Label>
                      <span className="text-xs text-gray-400">{formatDb(compressorSettings.threshold)}</span>
                    </div>
                    <Slider
                      value={[compressorSettings.threshold + 60]}
                      min={0}
                      max={60}
                      step={0.5}
                      onValueChange={(values) => setCompressorSettings({...compressorSettings, threshold: values[0] - 60})}
                    />
                  </div>
                  
                  {/* Ratio */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Ratio</Label>
                      <span className="text-xs text-gray-400">{compressorSettings.ratio}:1</span>
                    </div>
                    <Slider
                      value={[compressorSettings.ratio]}
                      min={1}
                      max={20}
                      step={0.5}
                      onValueChange={(values) => setCompressorSettings({...compressorSettings, ratio: values[0]})}
                    />
                  </div>
                  
                  {/* Attack */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Attack</Label>
                      <span className="text-xs text-gray-400">{formatMs(compressorSettings.attack)}</span>
                    </div>
                    <Slider
                      value={[compressorSettings.attack]}
                      min={0}
                      max={200}
                      step={1}
                      onValueChange={(values) => setCompressorSettings({...compressorSettings, attack: values[0]})}
                    />
                  </div>
                  
                  {/* Release */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Release</Label>
                      <span className="text-xs text-gray-400">{formatMs(compressorSettings.release)}</span>
                    </div>
                    <Slider
                      value={[compressorSettings.release]}
                      min={50}
                      max={2000}
                      step={10}
                      onValueChange={(values) => setCompressorSettings({...compressorSettings, release: values[0]})}
                    />
                  </div>
                  
                  {/* Makeup Gain */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Makeup Gain</Label>
                      <span className="text-xs text-gray-400">{formatDb(compressorSettings.makeupGain)}</span>
                    </div>
                    <Slider
                      value={[compressorSettings.makeupGain]}
                      min={0}
                      max={24}
                      step={0.5}
                      onValueChange={(values) => setCompressorSettings({...compressorSettings, makeupGain: values[0]})}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Limiter */}
            <AccordionItem value="limiter" className="border-b-0">
              <AccordionTrigger className="py-2 px-3 text-sm hover:bg-gray-700/30 rounded-md hover:no-underline">
                <div className="flex items-center">
                  <div className={`w-2 h-10 rounded-sm mr-2 ${limiterEnabled && effectsEnabled ? 'bg-orange-500' : 'bg-gray-700'}`}></div>
                  <div>
                    <div className="font-medium text-sm flex items-center">
                      Limiter
                      <Switch
                        checked={limiterEnabled}
                        disabled={!effectsEnabled}
                        onCheckedChange={setLimiterEnabled}
                        className="ml-2 h-4 w-7 data-[state=checked]:bg-orange-600"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div className="text-xs text-gray-400">Prevent clipping and maximize volume</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-2 px-3">
                <div className={`space-y-3 ${(!limiterEnabled || !effectsEnabled) ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Threshold */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Threshold</Label>
                      <span className="text-xs text-gray-400">{formatDb(limiterSettings.threshold)}</span>
                    </div>
                    <Slider
                      value={[limiterSettings.threshold + 10]}
                      min={0}
                      max={10}
                      step={0.1}
                      onValueChange={(values) => setLimiterSettings({...limiterSettings, threshold: values[0] - 10})}
                    />
                  </div>
                  
                  {/* Release */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Release</Label>
                      <span className="text-xs text-gray-400">{formatMs(limiterSettings.release)}</span>
                    </div>
                    <Slider
                      value={[limiterSettings.release]}
                      min={10}
                      max={500}
                      step={5}
                      onValueChange={(values) => setLimiterSettings({...limiterSettings, release: values[0]})}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Reverb */}
            <AccordionItem value="reverb" className="border-b-0">
              <AccordionTrigger className="py-2 px-3 text-sm hover:bg-gray-700/30 rounded-md hover:no-underline">
                <div className="flex items-center">
                  <div className={`w-2 h-10 rounded-sm mr-2 ${reverbEnabled && effectsEnabled ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                  <div>
                    <div className="font-medium text-sm flex items-center">
                      Reverb
                      <Switch
                        checked={reverbEnabled}
                        disabled={!effectsEnabled}
                        onCheckedChange={setReverbEnabled}
                        className="ml-2 h-4 w-7 data-[state=checked]:bg-green-600"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div className="text-xs text-gray-400">Add space and depth</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-2 px-3">
                <div className={`space-y-3 ${(!reverbEnabled || !effectsEnabled) ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Mix */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Mix</Label>
                      <span className="text-xs text-gray-400">{formatPercent(reverbSettings.mix)}</span>
                    </div>
                    <Slider
                      value={[reverbSettings.mix * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(values) => setReverbSettings({...reverbSettings, mix: values[0] / 100})}
                    />
                  </div>
                  
                  {/* Decay */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Decay</Label>
                      <span className="text-xs text-gray-400">{formatSeconds(reverbSettings.decay)}</span>
                    </div>
                    <Slider
                      value={[reverbSettings.decay]}
                      min={0.1}
                      max={10}
                      step={0.1}
                      onValueChange={(values) => setReverbSettings({...reverbSettings, decay: values[0]})}
                    />
                  </div>
                  
                  {/* Damping */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Damping</Label>
                      <span className="text-xs text-gray-400">{formatPercent(reverbSettings.damping)}</span>
                    </div>
                    <Slider
                      value={[reverbSettings.damping * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(values) => setReverbSettings({...reverbSettings, damping: values[0] / 100})}
                    />
                  </div>
                  
                  {/* Room Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Room Size</Label>
                      <span className="text-xs text-gray-400">{formatPercent(reverbSettings.roomSize)}</span>
                    </div>
                    <Slider
                      value={[reverbSettings.roomSize * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(values) => setReverbSettings({...reverbSettings, roomSize: values[0] / 100})}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}