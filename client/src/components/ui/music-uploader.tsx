import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Music } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function MusicUploader() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverArtInputRef = useRef<HTMLInputElement>(null);
  
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!audioFile || !title || !genre) {
        throw new Error('Please provide all required fields');
      }
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('genre', genre);
      formData.append('description', description);
      formData.append('duration', String(duration));
      formData.append('isPublished', String(isPublished));
      formData.append('audio', audioFile);
      
      if (coverArtFile) {
        formData.append('coverArt', coverArtFile);
      }
      
      const response = await fetch('/api/tracks/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload track');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Reset form
      setTitle('');
      setGenre('');
      setDescription('');
      setDuration(0);
      setIsPublished(false);
      setAudioFile(null);
      setCoverArtFile(null);
      setCoverArtPreview(null);
      
      // Invalidate tracks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/tracks/artist'] });
      
      toast({
        title: 'Track uploaded successfully',
        description: 'Your track has been uploaded and is now available.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      
      // Create an audio element to get duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        setDuration(Math.round(audio.duration));
      };
    }
  };
  
  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverArtFile(file);
      setCoverArtPreview(URL.createObjectURL(file));
    }
  };
  
  const removeCoverArt = () => {
    setCoverArtFile(null);
    setCoverArtPreview(null);
    if (coverArtInputRef.current) {
      coverArtInputRef.current.value = '';
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload New Track</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Track Title *</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter track title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="genre">Genre *</Label>
                <Select value={genre} onValueChange={setGenre} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                    <SelectItem value="r&b">R&B</SelectItem>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Enter track description"
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="publish"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="publish">Publish immediately</Label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="audio">Audio File *</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => audioInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    id="audio" 
                    ref={audioInputRef}
                    accept="audio/*" 
                    onChange={handleAudioChange} 
                    className="hidden" 
                    required={!audioFile}
                  />
                  
                  {audioFile ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Music className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium truncate">{audioFile.name}</span>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm font-medium">Click to upload audio file</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">MP3, WAV up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="coverArt">Cover Art</Label>
                {coverArtPreview ? (
                  <div className="relative h-40 rounded-lg overflow-hidden">
                    <img 
                      src={coverArtPreview} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover" 
                    />
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80"
                      onClick={removeCoverArt}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 h-40 flex flex-col items-center justify-center"
                    onClick={() => coverArtInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      id="coverArt" 
                      ref={coverArtInputRef}
                      accept="image/*" 
                      onChange={handleCoverArtChange} 
                      className="hidden" 
                    />
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm font-medium">Click to upload cover art</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG, WebP up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          type="submit" 
          onClick={handleSubmit}
          disabled={uploadMutation.isPending || !title || !genre || !audioFile}
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Track'}
        </Button>
      </CardFooter>
    </Card>
  );
}
