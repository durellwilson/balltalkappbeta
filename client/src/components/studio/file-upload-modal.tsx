import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { FileDropZone } from './file-drop-zone';
import { Loader2, Music, Mic, Volume2, FileMusic, Clock, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Track } from '@/lib';
import { Label } from '../ui/label';

interface FileUploadOptions {
  targetTrackId?: number | null;
  createNewTrack: boolean;
  trackType: 'audio' | 'instrument' | 'vocal' | 'drum' | 'mix';
  position: 'start' | 'playhead' | 'end';
  aligned: boolean;
  allowOverlap: boolean;
  normalize: boolean;
  normalizationLevel: number;
}

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[], options: FileUploadOptions) => Promise<boolean>;
  title?: string;
  description?: string;
  allowMultiple?: boolean;
  existingTracks?: Track[];
  currentPlayheadPosition?: number;
}

// Form schema for file upload options
const uploadFormSchema = z.object({
  targetTrackId: z.string().nullable().optional(),
  createNewTrack: z.boolean().default(true),
  trackType: z.enum(['audio', 'instrument', 'vocal', 'drum', 'mix']).default('audio'),
  position: z.enum(['start', 'playhead', 'end']).default('playhead'),
  aligned: z.boolean().default(true),
  allowOverlap: z.boolean().default(true),
  normalize: z.boolean().default(false),
  normalizationLevel: z.number().min(-12).max(0).default(-3),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

export function FileUploadModal({
  open,
  onOpenChange,
  onUpload,
  title = 'Import Audio Files',
  description = 'Upload audio files to add to your project.',
  allowMultiple = true,
  existingTracks = [],
  currentPlayheadPosition = 0,
}: FileUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Set up form with default values
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      targetTrackId: existingTracks.length > 0 ? existingTracks[0].id.toString() : null,
      createNewTrack: existingTracks.length === 0 ? true : false,
      trackType: 'audio',
      position: 'playhead',
      aligned: true,
      allowOverlap: true,
      normalize: false,
      normalizationLevel: -3,
    },
  });
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        targetTrackId: existingTracks.length > 0 ? existingTracks[0].id.toString() : null,
        createNewTrack: existingTracks.length === 0 ? true : false,
        trackType: 'audio',
        position: 'playhead',
        aligned: true,
        allowOverlap: true,
        normalize: false,
        normalizationLevel: -3,
      });
      setFiles([]);
    }
  }, [open, existingTracks, form]);
  
  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    
    // If files suggest a particular type, update the form
    if (selectedFiles.length > 0) {
      const fileName = selectedFiles[0].name.toLowerCase();
      if (fileName.includes('drum') || fileName.includes('beat') || fileName.includes('percussion')) {
        form.setValue('trackType', 'drum');
      } else if (fileName.includes('vocal') || fileName.includes('voice') || fileName.includes('vox')) {
        form.setValue('trackType', 'vocal');
      } else if (fileName.includes('guitar') || fileName.includes('piano') || fileName.includes('bass') ||
                 fileName.includes('synth') || fileName.includes('keys')) {
        form.setValue('trackType', 'instrument');
      }
    }
  };
  
  const handleSubmit = async (data: UploadFormValues) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      // Convert the form data to the expected options format
      const options: FileUploadOptions = {
        targetTrackId: data.createNewTrack ? null : (data.targetTrackId ? parseInt(data.targetTrackId) : null),
        createNewTrack: data.createNewTrack,
        trackType: data.trackType,
        position: data.position,
        aligned: data.aligned,
        allowOverlap: data.allowOverlap,
        normalize: data.normalize,
        normalizationLevel: data.normalizationLevel,
      };
      
      const success = await onUpload(files, options);
      if (success) {
        // Clear selection and close modal on success
        setFiles([]);
        onOpenChange(false);
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCancel = () => {
    setFiles([]);
    onOpenChange(false);
  };
  
  // Get the track type icon
  const getTrackTypeIcon = (type: string) => {
    switch (type) {
      case 'vocal':
        return <Mic className="h-4 w-4" />;
      case 'instrument':
        return <Music className="h-4 w-4" />;
      case 'drum':
        return <FileMusic className="h-4 w-4" />;
      case 'mix':
        return <Users className="h-4 w-4" />;
      default:
        return <Volume2 className="h-4 w-4" />;
    }
  };
  
  // Watch form values for conditional rendering
  const createNewTrack = form.watch('createNewTrack');
  const normalize = form.watch('normalize');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileMusic className="h-5 w-5 text-blue-400" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="py-2">
              <FileDropZone
                onFilesSelected={handleFilesSelected}
                allowMultiple={allowMultiple}
              />
              
              {files.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Selected files:</h4>
                  <ul className="text-sm space-y-1 max-h-24 overflow-y-auto p-2 bg-gray-800 rounded-md">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center text-gray-300">
                        <FileMusic className="h-3 w-3 mr-2 text-blue-400" />
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-gray-500 ml-2">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* Track Selection or Creation */}
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="createNewTrack"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 border-gray-800">
                        <div className="space-y-0.5">
                          <FormLabel>Create new track</FormLabel>
                          <FormDescription className="text-xs text-gray-500">
                            {field.value
                              ? "Adding files to a new track"
                              : "Adding files to an existing track"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {createNewTrack ? (
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="trackType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Track Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-700">
                                <SelectValue placeholder="Select a track type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="audio" className="flex items-center">
                                <div className="flex items-center">
                                  {getTrackTypeIcon('audio')}
                                  <span className="ml-2">Audio</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="vocal">
                                <div className="flex items-center">
                                  {getTrackTypeIcon('vocal')}
                                  <span className="ml-2">Vocal</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="instrument">
                                <div className="flex items-center">
                                  {getTrackTypeIcon('instrument')}
                                  <span className="ml-2">Instrument</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="drum">
                                <div className="flex items-center">
                                  {getTrackTypeIcon('drum')}
                                  <span className="ml-2">Drum</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="mix">
                                <div className="flex items-center">
                                  {getTrackTypeIcon('mix')}
                                  <span className="ml-2">Mix</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="targetTrackId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Track</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-700">
                                <SelectValue placeholder="Select a track" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              {existingTracks.map(track => (
                                <SelectItem key={track.id} value={track.id.toString()}>
                                  <div className="flex items-center">
                                    {getTrackTypeIcon(track.type)}
                                    <span className="ml-2">{track.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {/* Positioning Options */}
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <div className="flex flex-col space-y-1.5">
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value="start" 
                                id="position-start" 
                                className="border-gray-600" 
                              />
                              <Label htmlFor="position-start" className="flex items-center cursor-pointer">
                                <span className="flex items-center text-sm">
                                  <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                  Start of timeline
                                </span>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value="playhead" 
                                id="position-playhead" 
                                className="border-gray-600" 
                              />
                              <Label htmlFor="position-playhead" className="flex items-center cursor-pointer">
                                <span className="flex items-center text-sm">
                                  <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                                  Current playhead position ({currentPlayheadPosition.toFixed(2)}s)
                                </span>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value="end" 
                                id="position-end" 
                                className="border-gray-600" 
                              />
                              <Label htmlFor="position-end" className="flex items-center cursor-pointer">
                                <span className="flex items-center text-sm">
                                  <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                  End of timeline
                                </span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Additional Options */}
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="aligned"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 border-gray-800">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Snap to grid</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="allowOverlap"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 border-gray-800">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Allow overlapping</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="normalize"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 border-gray-800">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Normalize audio</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {normalize && (
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="normalizationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Normalization Level: {field.value} dB</FormLabel>
                          <FormControl>
                            <Slider
                              min={-12}
                              max={0}
                              step={1}
                              defaultValue={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="pt-2"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="flex flex-row justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-gray-700"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={files.length === 0 || isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Import Files'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}