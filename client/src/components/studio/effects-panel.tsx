import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  BarChart3, 
  Waveform, 
  Sliders, 
  Plus, 
  X, 
  ChevronUp, 
  ChevronDown,
  RotateCcw,
  Save,
  Disc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { SpectrumAnalyzer } from '@/components/ui/spectrum-analyzer';

// Types
interface Effect {
  id: string;
  type: EffectType;
  name: string;
  enabled: boolean;
  parameters: EffectParameters;
  presetName?: string;
}

type EffectType = 
  | 'eq' 
  | 'compressor' 
  | 'reverb' 
  | 'delay' 
  | 'limiter' 
  | 'distortion'
  | 'filter'
  | 'chorus'
  | 'phaser'
  | 'pitchShift'
  | 'tremolo'
  | 'autoFilter'
  | 'gate';

interface EffectParameters {
  [key: string]: number | boolean | string;
}

interface PresetType {
  id: string;
  name: string;
  type: EffectType;
  parameters: EffectParameters;
}

// Defines which parameters each effect type has
const effectDefinitions: Record<EffectType, {name: string, parameters: {name: string, type: 'range' | 'switch' | 'select', min?: number, max?: number, step?: number, options?: string[], unit?: string, defaultValue: any}[]}> = {
  eq: {
    name: 'EQ',
    parameters: [
      { name: 'low', type: 'range', min: -24, max: 24, step: 0.5, unit: 'dB', defaultValue: 0 },
      { name: 'mid', type: 'range', min: -24, max: 24, step: 0.5, unit: 'dB', defaultValue: 0 },
      { name: 'high', type: 'range', min: -24, max: 24, step: 0.5, unit: 'dB', defaultValue: 0 },
      { name: 'lowFrequency', type: 'range', min: 20, max: 500, step: 10, unit: 'Hz', defaultValue: 250 },
      { name: 'midFrequency', type: 'range', min: 200, max: 5000, step: 50, unit: 'Hz', defaultValue: 1000 },
      { name: 'highFrequency', type: 'range', min: 2000, max: 20000, step: 100, unit: 'Hz', defaultValue: 5000 },
      { name: 'Q', type: 'range', min: 0.1, max: 10, step: 0.1, defaultValue: 1 }
    ]
  },
  compressor: {
    name: 'Compressor',
    parameters: [
      { name: 'threshold', type: 'range', min: -60, max: 0, step: 1, unit: 'dB', defaultValue: -24 },
      { name: 'ratio', type: 'range', min: 1, max: 20, step: 0.5, defaultValue: 4 },
      { name: 'attack', type: 'range', min: 0, max: 1000, step: 1, unit: 'ms', defaultValue: 20 },
      { name: 'release', type: 'range', min: 0, max: 1000, step: 10, unit: 'ms', defaultValue: 250 },
      { name: 'knee', type: 'range', min: 0, max: 40, step: 1, unit: 'dB', defaultValue: 10 },
      { name: 'makeupGain', type: 'range', min: 0, max: 24, step: 0.5, unit: 'dB', defaultValue: 0 }
    ]
  },
  reverb: {
    name: 'Reverb',
    parameters: [
      { name: 'decay', type: 'range', min: 0.1, max: 10, step: 0.1, unit: 's', defaultValue: 1.5 },
      { name: 'preDelay', type: 'range', min: 0, max: 500, step: 10, unit: 'ms', defaultValue: 0 },
      { name: 'wet', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
      { name: 'dry', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
      { name: 'roomSize', type: 'select', options: ['small', 'medium', 'large', 'hall'], defaultValue: 'medium' }
    ]
  },
  delay: {
    name: 'Delay',
    parameters: [
      { name: 'delayTime', type: 'range', min: 0, max: 2, step: 0.01, unit: 's', defaultValue: 0.25 },
      { name: 'feedback', type: 'range', min: 0, max: 0.95, step: 0.01, defaultValue: 0.45 },
      { name: 'wet', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
      { name: 'dry', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
      { name: 'syncToBpm', type: 'switch', defaultValue: false }
    ]
  },
  limiter: {
    name: 'Limiter',
    parameters: [
      { name: 'threshold', type: 'range', min: -60, max: 0, step: 0.5, unit: 'dB', defaultValue: -3 },
      { name: 'release', type: 'range', min: 10, max: 1000, step: 10, unit: 'ms', defaultValue: 100 },
      { name: 'lookAhead', type: 'range', min: 0, max: 100, step: 1, unit: 'ms', defaultValue: 5 }
    ]
  },
  distortion: {
    name: 'Distortion',
    parameters: [
      { name: 'amount', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 0.2 },
      { name: 'oversample', type: 'select', options: ['none', '2x', '4x'], defaultValue: 'none' },
      { name: 'type', type: 'select', options: ['soft', 'hard', 'asymmetric', 'sine'], defaultValue: 'soft' }
    ]
  },
  filter: {
    name: 'Filter',
    parameters: [
      { name: 'frequency', type: 'range', min: 20, max: 20000, step: 10, unit: 'Hz', defaultValue: 1000 },
      { name: 'Q', type: 'range', min: 0.1, max: 10, step: 0.1, defaultValue: 1 },
      { name: 'gain', type: 'range', min: -40, max: 40, step: 0.5, unit: 'dB', defaultValue: 0 },
      { name: 'type', type: 'select', options: ['lowpass', 'highpass', 'bandpass', 'notch', 'lowshelf', 'highshelf', 'peaking'], defaultValue: 'lowpass' }
    ]
  },
  chorus: {
    name: 'Chorus',
    parameters: [
      { name: 'frequency', type: 'range', min: 0.1, max: 10, step: 0.1, unit: 'Hz', defaultValue: 1.5 },
      { name: 'delayTime', type: 'range', min: 0.001, max: 0.05, step: 0.001, unit: 's', defaultValue: 0.003 },
      { name: 'depth', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
      { name: 'spread', type: 'range', min: 0, max: 180, step: 1, unit: '°', defaultValue: 120 },
      { name: 'wet', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 0.5 }
    ]
  },
  phaser: {
    name: 'Phaser',
    parameters: [
      { name: 'frequency', type: 'range', min: 0.1, max: 10, step: 0.1, unit: 'Hz', defaultValue: 0.5 },
      { name: 'octaves', type: 'range', min: 1, max: 5, step: 0.1, defaultValue: 3 },
      { name: 'stages', type: 'range', min: 2, max: 12, step: 2, defaultValue: 4 },
      { name: 'wet', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 0.3 }
    ]
  },
  pitchShift: {
    name: 'Pitch Shift',
    parameters: [
      { name: 'pitch', type: 'range', min: -24, max: 24, step: 1, unit: 'semitones', defaultValue: 0 },
      { name: 'windowSize', type: 'range', min: 0.01, max: 1, step: 0.01, unit: 's', defaultValue: 0.1 },
      { name: 'wet', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 1 }
    ]
  },
  tremolo: {
    name: 'Tremolo',
    parameters: [
      { name: 'frequency', type: 'range', min: 0.1, max: 20, step: 0.1, unit: 'Hz', defaultValue: 4 },
      { name: 'depth', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
      { name: 'spread', type: 'range', min: 0, max: 180, step: 1, unit: '°', defaultValue: 0 },
      { name: 'type', type: 'select', options: ['sine', 'square', 'triangle', 'sawtooth'], defaultValue: 'sine' }
    ]
  },
  autoFilter: {
    name: 'Auto Filter',
    parameters: [
      { name: 'frequency', type: 'range', min: 0.1, max: 10, step: 0.1, unit: 'Hz', defaultValue: 1 },
      { name: 'baseFrequency', type: 'range', min: 20, max: 20000, step: 10, unit: 'Hz', defaultValue: 500 },
      { name: 'octaves', type: 'range', min: 0, max: 8, step: 0.1, defaultValue: 2.5 },
      { name: 'depth', type: 'range', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
      { name: 'type', type: 'select', options: ['sine', 'square', 'triangle', 'sawtooth'], defaultValue: 'sine' },
      { name: 'filter', type: 'select', options: ['lowpass', 'highpass', 'bandpass', 'notch'], defaultValue: 'lowpass' }
    ]
  },
  gate: {
    name: 'Noise Gate',
    parameters: [
      { name: 'threshold', type: 'range', min: -100, max: 0, step: 1, unit: 'dB', defaultValue: -50 },
      { name: 'attack', type: 'range', min: 0, max: 500, step: 1, unit: 'ms', defaultValue: 10 },
      { name: 'release', type: 'range', min: 0, max: 1000, step: 10, unit: 'ms', defaultValue: 100 }
    ]
  }
};

// Sample presets (in a real app, these could be stored in a database)
const samplePresets: PresetType[] = [
  {
    id: 'p1',
    name: 'Vocal Clarity',
    type: 'eq',
    parameters: {
      low: -3,
      mid: 2,
      high: 4,
      lowFrequency: 200,
      midFrequency: 1000,
      highFrequency: 5000,
      Q: 0.8
    }
  },
  {
    id: 'p2',
    name: 'Drum Punch',
    type: 'compressor',
    parameters: {
      threshold: -24,
      ratio: 4,
      attack: 10,
      release: 150,
      knee: 10,
      makeupGain: 3
    }
  },
  {
    id: 'p3',
    name: 'Vocal Plate',
    type: 'reverb',
    parameters: {
      decay: 1.2,
      preDelay: 20,
      wet: 0.35,
      dry: 0.65,
      roomSize: 'medium'
    }
  },
  {
    id: 'p4',
    name: 'Low-pass Filter',
    type: 'filter',
    parameters: {
      frequency: 1000,
      Q: 1,
      gain: 0,
      type: 'lowpass'
    }
  }
];

interface EffectsPanelProps {
  trackId?: number | 'master';
  trackName?: string;
  trackType?: string;
  effects: Effect[];
  onEffectsChange: (effects: Effect[]) => void;
  presets?: PresetType[];
  onSavePreset?: (preset: Omit<PresetType, 'id'>) => void;
  isMaster?: boolean;
  inputLevel?: number; // 0-1 range for meter
  outputLevel?: number; // 0-1 range for meter
}

export function EffectsPanel({
  trackId = 'master',
  trackName = 'Master',
  trackType = 'mix',
  effects = [],
  onEffectsChange,
  presets = samplePresets,
  onSavePreset,
  isMaster = false,
  inputLevel = 0,
  outputLevel = 0
}: EffectsPanelProps) {
  const [activeTab, setActiveTab] = useState<'effects' | 'presets' | 'analyzer'>('effects');
  const [draggingEffectId, setDraggingEffectId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PresetType | null>(null);
  const [expandedEffect, setExpandedEffect] = useState<string | null>(null);
  const [accordionValue, setAccordionValue] = useState<string[]>([]);
  
  // Function to create a new effect
  const createEffect = (type: EffectType): Effect => {
    const definition = effectDefinitions[type];
    const parameters: EffectParameters = {};
    
    // Initialize with default values
    definition.parameters.forEach(param => {
      parameters[param.name] = param.defaultValue;
    });
    
    return {
      id: `effect-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      name: definition.name,
      enabled: true,
      parameters
    };
  };
  
  // Add an effect
  const handleAddEffect = (type: EffectType) => {
    const newEffect = createEffect(type);
    onEffectsChange([...effects, newEffect]);
    
    // Expand the newly added effect
    setExpandedEffect(newEffect.id);
    setAccordionValue([...accordionValue, newEffect.id]);
    
    toast({
      title: "Effect Added",
      description: `Added ${newEffect.name} to ${trackName}`
    });
  };
  
  // Remove an effect
  const handleRemoveEffect = (id: string) => {
    onEffectsChange(effects.filter(effect => effect.id !== id));
    
    toast({
      title: "Effect Removed",
      description: `Removed effect from ${trackName}`
    });
  };
  
  // Toggle effect enabled/disabled
  const handleToggleEffect = (id: string) => {
    onEffectsChange(
      effects.map(effect => 
        effect.id === id 
          ? { ...effect, enabled: !effect.enabled } 
          : effect
      )
    );
  };
  
  // Update effect parameter
  const handleParameterChange = (effectId: string, paramName: string, value: any) => {
    onEffectsChange(
      effects.map(effect => 
        effect.id === effectId 
          ? { 
              ...effect, 
              parameters: { 
                ...effect.parameters, 
                [paramName]: value 
              } 
            } 
          : effect
      )
    );
  };
  
  // Reset effect to defaults
  const handleResetEffect = (effectId: string) => {
    onEffectsChange(
      effects.map(effect => {
        if (effect.id === effectId) {
          const definition = effectDefinitions[effect.type];
          const parameters: EffectParameters = {};
          
          // Reset to default values
          definition.parameters.forEach(param => {
            parameters[param.name] = param.defaultValue;
          });
          
          return {
            ...effect,
            parameters,
            presetName: undefined
          };
        }
        return effect;
      })
    );
    
    toast({
      description: "Effect reset to default settings"
    });
  };
  
  // Apply a preset to an effect
  const handleApplyPreset = (effectId: string, preset: PresetType) => {
    onEffectsChange(
      effects.map(effect => 
        effect.id === effectId && effect.type === preset.type
          ? { 
              ...effect, 
              parameters: { ...preset.parameters },
              presetName: preset.name
            } 
          : effect
      )
    );
    
    toast({
      title: "Preset Applied",
      description: `Applied "${preset.name}" to ${
        effects.find(e => e.id === effectId)?.name || 'effect'
      }`
    });
  };
  
  // Save current effect settings as a preset
  const handleSaveAsPreset = (effectId: string) => {
    const effect = effects.find(e => e.id === effectId);
    if (!effect || !newPresetName.trim() || !onSavePreset) return;
    
    const newPreset = {
      name: newPresetName,
      type: effect.type,
      parameters: { ...effect.parameters }
    };
    
    onSavePreset(newPreset);
    setNewPresetName('');
    
    toast({
      title: "Preset Saved",
      description: `Saved "${newPresetName}" preset for ${effect.name}`
    });
  };
  
  // Handle dragging for reordering effects
  const handleDragStart = (e: React.DragEvent, effectId: string) => {
    setDraggingEffectId(effectId);
    // For better drag visualization
    if (e.dataTransfer.setDragImage) {
      const element = document.getElementById(`effect-${effectId}`);
      if (element) {
        e.dataTransfer.setDragImage(element, 20, 20);
      }
    }
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggingEffectId) return;
    
    const sourceIndex = effects.findIndex(effect => effect.id === draggingEffectId);
    if (sourceIndex === -1) return;
    
    // Create a new array with the reordered effects
    const newEffects = [...effects];
    const [movedEffect] = newEffects.splice(sourceIndex, 1);
    newEffects.splice(targetIndex, 0, movedEffect);
    
    onEffectsChange(newEffects);
    setDraggingEffectId(null);
    setDragOverIndex(null);
  };
  
  // Handle accordion state
  const handleAccordionChange = (value: string[]) => {
    setAccordionValue(value);
    setExpandedEffect(value.length > 0 ? value[value.length - 1] : null);
  };
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-md overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center">
          <Settings size={16} className="mr-2 text-gray-400" />
          <div>
            <h3 className="font-medium">{trackName}</h3>
            <p className="text-xs text-gray-400">{isMaster ? 'Master Output' : `Track ${trackId} (${trackType})`}</p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="bg-gray-800">
            <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
            <TabsTrigger value="analyzer" className="text-xs">Analyzer</TabsTrigger>
            <TabsTrigger value="presets" className="text-xs">Presets</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="effects" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
        {/* Add Effect Button */}
        <div className="p-3 border-b border-gray-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full bg-gray-800 border-gray-700">
                <Plus size={14} className="mr-1" />
                Add Effect
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem onClick={() => handleAddEffect('eq')}>
                Equalizer (EQ)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('compressor')}>
                Compressor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('limiter')}>
                Limiter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('reverb')}>
                Reverb
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('delay')}>
                Delay
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddEffect('filter')}>
                Filter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('distortion')}>
                Distortion
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('chorus')}>
                Chorus
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('phaser')}>
                Phaser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('tremolo')}>
                Tremolo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('pitchShift')}>
                Pitch Shift
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('autoFilter')}>
                Auto Filter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddEffect('gate')}>
                Noise Gate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Effects List */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {effects.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Settings size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No effects added yet</p>
                <p className="text-xs mt-1">Click "Add Effect" to get started</p>
              </div>
            ) : (
              <Accordion
                type="multiple"
                value={accordionValue}
                onValueChange={handleAccordionChange}
                className="space-y-2"
              >
                {effects.map((effect, index) => (
                  <div
                    key={effect.id}
                    id={`effect-${effect.id}`}
                    className={`transition-colors ${
                      dragOverIndex === index ? 'bg-gray-800/50 border-blue-500/50' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, effect.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={() => {
                      setDraggingEffectId(null);
                      setDragOverIndex(null);
                    }}
                  >
                    <AccordionItem value={effect.id} className="border border-gray-800 rounded-md overflow-hidden bg-gray-800/30">
                      <AccordionTrigger className="px-3 py-2 hover:bg-gray-800/80 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-2">
                          <div className="flex items-center">
                            <Switch
                              checked={effect.enabled}
                              onCheckedChange={() => handleToggleEffect(effect.id)}
                              className="mr-2 data-[state=checked]:bg-blue-600"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex flex-col items-start">
                              <span className={`text-sm font-medium ${!effect.enabled ? 'text-gray-500' : ''}`}>
                                {effect.name}
                              </span>
                              {effect.presetName && (
                                <Badge variant="outline" className="px-1 py-0 h-4 text-[10px] text-blue-400 border-blue-800">
                                  {effect.presetName}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {/* The accordion chevron is automatically added */}
                          </div>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="p-3 pt-1 bg-gray-800/20">
                        {/* Effect parameters */}
                        <div className="space-y-3">
                          {effectDefinitions[effect.type].parameters.map(param => (
                            <div key={`${effect.id}-${param.name}`} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs capitalize">
                                  {param.name.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </Label>
                                <span className="text-xs text-gray-400">
                                  {typeof effect.parameters[param.name] === 'number' 
                                    ? `${effect.parameters[param.name]}${param.unit || ''}`
                                    : effect.parameters[param.name].toString()
                                  }
                                </span>
                              </div>
                              
                              {param.type === 'range' && (
                                <Slider
                                  value={[effect.parameters[param.name] as number]}
                                  min={param.min}
                                  max={param.max}
                                  step={param.step}
                                  disabled={!effect.enabled}
                                  onValueChange={values => handleParameterChange(effect.id, param.name, values[0])}
                                />
                              )}
                              
                              {param.type === 'switch' && (
                                <Switch
                                  checked={effect.parameters[param.name] as boolean}
                                  disabled={!effect.enabled}
                                  onCheckedChange={checked => handleParameterChange(effect.id, param.name, checked)}
                                  className="data-[state=checked]:bg-blue-600"
                                />
                              )}
                              
                              {param.type === 'select' && param.options && (
                                <Select
                                  value={effect.parameters[param.name] as string}
                                  disabled={!effect.enabled}
                                  onValueChange={value => handleParameterChange(effect.id, param.name, value)}
                                >
                                  <SelectTrigger className="h-7 bg-gray-800 border-gray-700 text-xs">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700">
                                    {param.options.map(option => (
                                      <SelectItem key={option} value={option}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          ))}
                          
                          {/* Effect footer with preset and remove options */}
                          <div className="flex justify-between pt-2">
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-7 px-2 bg-gray-800 border-gray-700"
                                      onClick={() => handleResetEffect(effect.id)}
                                    >
                                      <RotateCcw size={12} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reset to defaults</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              {/* Preset dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-7 px-2 bg-gray-800 border-gray-700"
                                  >
                                    <Disc size={12} className="mr-1" />
                                    Presets
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                  {presets
                                    .filter(preset => preset.type === effect.type)
                                    .map(preset => (
                                      <DropdownMenuItem 
                                        key={preset.id}
                                        onClick={() => handleApplyPreset(effect.id, preset)}
                                      >
                                        {preset.name}
                                      </DropdownMenuItem>
                                    ))
                                  }
                                  {presets.filter(preset => preset.type === effect.type).length === 0 && (
                                    <div className="px-2 py-1 text-xs text-gray-400">
                                      No presets for this effect
                                    </div>
                                  )}
                                  
                                  <DropdownMenuSeparator />
                                  
                                  {onSavePreset && (
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
                                          onClick={() => handleSaveAsPreset(effect.id)}
                                        >
                                          <Save size={12} />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              onClick={() => handleRemoveEffect(effect.id)}
                            >
                              <X size={14} className="mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </div>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="analyzer" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
        <div className="p-3 border-b border-gray-800">
          <Tabs defaultValue="spectrum">
            <TabsList className="bg-gray-800">
              <TabsTrigger value="spectrum" className="text-xs">
                <BarChart3 size={12} className="mr-1" />
                Spectrum
              </TabsTrigger>
              <TabsTrigger value="waveform" className="text-xs">
                <Waveform size={12} className="mr-1" />
                Waveform
              </TabsTrigger>
              <TabsTrigger value="meter" className="text-xs">
                <Sliders size={12} className="mr-1" />
                Meters
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex-1 p-3">
          <TabsContent value="spectrum" className="m-0 h-full">
            <Card className="bg-gray-800 border-gray-700 h-full">
              <CardContent className="p-4">
                <SpectrumAnalyzer 
                  height={200}
                  barCount={128}
                  style="area"
                  gradientColors={['#3b82f6', '#8b5cf6', '#d946ef']}
                  isMaster={isMaster}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="waveform" className="m-0 h-full">
            <Card className="bg-gray-800 border-gray-700 h-full">
              <CardContent className="p-4">
                {/* Waveform visualization would go here */}
                <div className="bg-gray-900 w-full h-64 rounded flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Waveform size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Waveform Visualization</p>
                    <p className="text-xs mt-1">Displays real-time audio waveform</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="meter" className="m-0 h-full">
            <Card className="bg-gray-800 border-gray-700 h-full">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Input Level</h4>
                    <div className="h-48 w-8 bg-gray-900 rounded-sm relative mx-auto">
                      <div 
                        className={`absolute bottom-0 left-0 right-0 ${
                          inputLevel > 0.9 ? 'bg-red-500' : 
                          inputLevel > 0.7 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        } transition-all`}
                        style={{ height: `${inputLevel * 100}%` }}
                      ></div>
                      
                      {/* Level markers */}
                      <div className="absolute top-0 left-0 right-0 p-0.5">
                        <div className="text-[10px] text-red-400">0dB</div>
                      </div>
                      <div className="absolute top-[30%] left-0 right-0 p-0.5 border-t border-red-500/30">
                        <div className="text-[10px] text-red-400">-3dB</div>
                      </div>
                      <div className="absolute top-[50%] left-0 right-0 p-0.5 border-t border-yellow-500/30">
                        <div className="text-[10px] text-yellow-400">-6dB</div>
                      </div>
                      <div className="absolute top-[70%] left-0 right-0 p-0.5 border-t border-green-500/30">
                        <div className="text-[10px] text-green-400">-12dB</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Output Level</h4>
                    <div className="h-48 w-8 bg-gray-900 rounded-sm relative mx-auto">
                      <div 
                        className={`absolute bottom-0 left-0 right-0 ${
                          outputLevel > 0.9 ? 'bg-red-500' : 
                          outputLevel > 0.7 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        } transition-all`}
                        style={{ height: `${outputLevel * 100}%` }}
                      ></div>
                      
                      {/* Level markers */}
                      <div className="absolute top-0 left-0 right-0 p-0.5">
                        <div className="text-[10px] text-red-400">0dB</div>
                      </div>
                      <div className="absolute top-[30%] left-0 right-0 p-0.5 border-t border-red-500/30">
                        <div className="text-[10px] text-red-400">-3dB</div>
                      </div>
                      <div className="absolute top-[50%] left-0 right-0 p-0.5 border-t border-yellow-500/30">
                        <div className="text-[10px] text-yellow-400">-6dB</div>
                      </div>
                      <div className="absolute top-[70%] left-0 right-0 p-0.5 border-t border-green-500/30">
                        <div className="text-[10px] text-green-400">-12dB</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </TabsContent>
      
      <TabsContent value="presets" className="flex-1 p-0 m-0 overflow-hidden">
        <div className="p-3 border-b border-gray-800">
          <Select
            value={selectedPreset ? selectedPreset.id : ''}
            onValueChange={(value) => {
              const preset = presets.find(p => p.id === value);
              if (preset) {
                setSelectedPreset(preset);
              }
            }}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select a preset" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name} ({effectDefinitions[preset.type].name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <ScrollArea className="flex-1">
          {selectedPreset ? (
            <div className="p-3">
              <div className="mb-3">
                <h4 className="font-medium">{selectedPreset.name}</h4>
                <p className="text-xs text-gray-400">
                  Type: {effectDefinitions[selectedPreset.type].name}
                </p>
              </div>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-3">
                  <div className="space-y-3">
                    {effectDefinitions[selectedPreset.type].parameters.map(param => (
                      <div key={param.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs capitalize">
                            {param.name.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </Label>
                          <span className="text-xs text-gray-400">
                            {selectedPreset.parameters[param.name] !== undefined 
                              ? `${selectedPreset.parameters[param.name]}${param.unit || ''}`
                              : 'N/A'
                            }
                          </span>
                        </div>
                        
                        {param.type === 'range' && (
                          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600"
                              style={{ 
                                width: `${
                                  ((selectedPreset.parameters[param.name] as number - (param.min || 0)) / 
                                  ((param.max || 1) - (param.min || 0))) * 100
                                }%` 
                              }}
                            ></div>
                          </div>
                        )}
                        
                        {param.type === 'switch' && (
                          <div className="flex items-center">
                            <div 
                              className={`w-3 h-3 rounded-full mr-2 ${
                                selectedPreset.parameters[param.name] ? 'bg-blue-500' : 'bg-gray-700'
                              }`}
                            ></div>
                            <span className="text-xs">
                              {selectedPreset.parameters[param.name] ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        )}
                        
                        {param.type === 'select' && (
                          <div className="px-2 py-1 bg-gray-900 rounded text-xs">
                            {selectedPreset.parameters[param.name] as string}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-4">
                <Button 
                  onClick={() => {
                    // Find an appropriate effect to apply this preset to,
                    // or create a new one if none exists
                    const compatibleEffect = effects.find(e => e.type === selectedPreset.type);
                    
                    if (compatibleEffect) {
                      handleApplyPreset(compatibleEffect.id, selectedPreset);
                    } else {
                      // Create a new effect and then apply the preset
                      const newEffect = createEffect(selectedPreset.type);
                      const updatedEffects = [...effects, newEffect];
                      onEffectsChange(updatedEffects);
                      
                      // Need to wait for the state to update before applying the preset
                      setTimeout(() => {
                        handleApplyPreset(newEffect.id, selectedPreset);
                      }, 100);
                    }
                    
                    setActiveTab('effects');
                  }}
                  className="w-full"
                >
                  Apply Preset to {
                    effects.some(e => e.type === selectedPreset.type) 
                      ? `Existing ${effectDefinitions[selectedPreset.type].name}` 
                      : `New ${effectDefinitions[selectedPreset.type].name}`
                  }
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center py-6 text-gray-400">
              <Settings size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Select a preset to view details</p>
              <p className="text-xs mt-1">You can apply presets to your effects</p>
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </div>
  );
}