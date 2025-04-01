import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useStudio } from '@/hooks/use-studio';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,

  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDuration } from '@/lib/utils';

/**
 * Studio page with full functionality
 */
export default function StudioPage() {
  // Get project ID from route params or use a default
  const params = useParams();
  const projectId = params.projectId || 'default';
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local UI state
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCollabPanel, setShowCollabPanel] = useState(true);
  const [showMasteringDialog, setShowMasteringDialog] = useState(false);
  const [importTrackName, setImportTrackName] = useState('');
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  
  // Use our studio hook for all the functionality
  const studio = useStudio(projectId);
  
  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no modals are open and not typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      
      switch (e.key) {
        case ' ': // Spacebar - toggle play/pause
          e.preventDefault();
          studio.isPlaying ? studio.pause() : studio.play();
          break;
          
        case 'Escape': // Escape - stop
          studio.stop();
          break;
          
        case 'm': // m - toggle mute on selected track
          if (studio.selectedTrackId !== null) {
            studio.toggleTrackMute(studio.selectedTrackId);
          }
          break;
          
        case 's': // s - toggle solo on selected track
          if (studio.selectedTrackId !== null) {
            studio.toggleTrackSolo(studio.selectedTrackId);
          }
          break;
          
        case 'e': // e - toggle effects panel
          studio.setShowEffects(!studio.showEffects);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studio]);
  
  // Handle file import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsImporting(true);
    
    try {
      // Create a new track if none is selected
      let trackId = studio.selectedTrackId;
      if (trackId === null) {
        trackId = await studio.addTrack({
          name: importTrackName || file.name.split('.')[0]
        });
      }
      
      await studio.importAudioToTrack(trackId, file);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: 'Could not import audio file.'
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Handle recording toggle
  const handleRecordToggle = async () => {
    if (studio.isRecording) {
      if (studio.selectedTrackId !== null) {
        await studio.stopRecording(studio.selectedTrackId);
      }
    } else {
      let trackId = studio.selectedTrackId;
      if (trackId === null) {
        trackId = await studio.addTrack({
          name: `Recording ${studio.tracks.length + 1}`
        });
        studio.setSelectedTrackId(trackId);
      }
      
      await studio.startRecording(trackId);
    }
  };
  
  // Handle project export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await studio.exportProject();
    } finally {
      setIsExporting(false);
    }
  };
  
  // Start a live collaboration session
  const handleStartLiveSession = () => {
    const code = studio.startLiveSession();
    setSessionCode(code);
  };
  
  // Apply AI mastering with the selected genre
  const handleApplyMastering = (genre: string) => {
    studio.applyAIMastering(genre);
    setShowMasteringDialog(false);
  };
  
  return (
    <div className="min-h-full bg-black text-white">
      {/* Top toolbar with transport controls and actions */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="mr-2">
              <h1 className="text-xl font-bold">Studio</h1>
              <p className="text-sm text-zinc-400">Project: {projectId}</p>
            </div>
            
            <div className="flex items-center space-x-1 bg-zinc-800 rounded-md px-2 py-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`p-1 rounded hover:bg-zinc-700 ${studio.isPlaying ? 'text-primary' : 'text-zinc-300'}`}
                      onClick={() => studio.isPlaying ? studio.pause() : studio.play()}
                    >
                      {studio.isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{studio.isPlaying ? 'Pause' : 'Play'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="p-1 rounded hover:bg-zinc-700 text-zinc-300"
                      onClick={() => studio.stop()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Stop</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`p-1 rounded hover:bg-zinc-700 ${studio.isRecording ? 'text-red-500' : 'text-zinc-300'}`}
                      onClick={handleRecordToggle}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{studio.isRecording ? 'Stop Recording' : 'Record'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="text-zinc-300 text-sm ml-2">
                {formatDuration(studio.currentTime)}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              <span className="text-zinc-400 text-sm">BPM:</span>
              <Input 
                type="number" 
                className="w-16 h-8 bg-zinc-800 border-zinc-700 text-white text-sm"
                value={studio.bpm}
                onChange={(e) => studio.updateBpm(parseInt(e.target.value) || 120)}
                min={40}
                max={300}
              />
              
              <Select 
                value={studio.timeSignature}
                onValueChange={(value) => console.log('Time signature changed:', value)}
              >
                <SelectTrigger className="w-16 h-8 bg-zinc-800 border-zinc-700 text-white text-sm">
                  <SelectValue placeholder="4/4" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="4/4">4/4</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="6/8">6/8</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                    <path d="M9.97.97a.75.75 0 011.06 0l3 3a.75.75 0 01-1.06 1.06l-1.72-1.72v3.44h-1.5V3.31L8.03 5.03a.75.75 0 01-1.06-1.06l3-3zM9.75 6.75v6a.75.75 0 001.5 0v-6h3a3 3 0 013 3v7.5a3 3 0 01-3 3h-7.5a3 3 0 01-3-3v-7.5a3 3 0 013-3h3z" />
                  </svg>
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
                <DialogHeader>
                  <DialogTitle>Import Audio</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Track Name</label>
                    <Input
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="New Track"
                      value={importTrackName}
                      onChange={(e) => setImportTrackName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Audio File</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="block w-full text-sm text-zinc-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-zinc-800 file:text-white
                        hover:file:bg-zinc-700"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="border-zinc-700 text-zinc-300">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isImporting}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isImporting ? 'Importing...' : 'Import'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="sm"
              className="text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white"
              onClick={handleExport}
              disabled={isExporting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                <path d="M9.97 8.97a.75.75 0 001.06 0l3-3a.75.75 0 00-1.06-1.06l-1.72 1.72V3.75a.75.75 0 00-1.5 0v2.88l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3zM9.75 17.25a.75.75 0 001.5 0v-2.88l1.72 1.72a.75.75 0 101.06-1.06l-3-3a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v2.88z" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className={`border-zinc-700 hover:bg-zinc-800 ${studio.showEffects ? 'bg-primary text-black' : 'text-zinc-300'}`}
              onClick={() => studio.setShowEffects(!studio.showEffects)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                <path d="M18.75 12.75h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5zM12 6a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 6zM12 18a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 18zM3.75 6.75h1.5a.75.75 0 100-1.5h-1.5a.75.75 0 000 1.5zM5.25 18.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 010 1.5zM3 12a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 013 12zM9 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12.75 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM9 15.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
              </svg>
              Effects
            </Button>
            
            <Dialog open={showMasteringDialog} onOpenChange={setShowMasteringDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M10.5 3.798v5.02a3 3 0 01-.879 2.121l-2.377 2.377a9.845 9.845 0 015.091 1.013 8.315 8.315 0 005.713.636l.285-.071-3.954-3.955a3 3 0 01-.879-2.121v-5.02a23.614 23.614 0 00-3 0zm4.5.138a.75.75 0 00.093-1.495A24.837 24.837 0 0012 2.25a25.048 25.048 0 00-3.093.191A.75.75 0 009 3.936v4.882a1.5 1.5 0 01-.44 1.06l-6.293 6.294c-1.62 1.621-.903 4.475 1.471 4.88 2.686.46 5.447.698 8.262.698 2.816 0 5.576-.239 8.262-.697 2.373-.406 3.092-3.26 1.47-4.881L15.44 9.879A1.5 1.5 0 0115 8.818V3.936z" clipRule="evenodd" />
                  </svg>
                  AI Mastering
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
                <DialogHeader>
                  <DialogTitle>AI Mastering</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-zinc-400">
                    Choose a genre preset for AI-powered mastering. This will automatically
                    adjust EQ, compression, and loudness settings for optimal sound.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center justify-center border-zinc-700 hover:bg-zinc-800"
                      onClick={() => handleApplyMastering('hip-hop')}
                      disabled={studio.isMastering}
                    >
                      <div className="text-xl mb-1">🎤</div>
                      <div className="font-medium">Hip-Hop</div>
                      <div className="text-xs text-zinc-400 mt-1">Deep bass, punchy drums</div>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center justify-center border-zinc-700 hover:bg-zinc-800"
                      onClick={() => handleApplyMastering('pop')}
                      disabled={studio.isMastering}
                    >
                      <div className="text-xl mb-1">🎵</div>
                      <div className="font-medium">Pop</div>
                      <div className="text-xs text-zinc-400 mt-1">Bright, balanced sound</div>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center justify-center border-zinc-700 hover:bg-zinc-800"
                      onClick={() => handleApplyMastering('r&b')}
                      disabled={studio.isMastering}
                    >
                      <div className="text-xl mb-1">🎸</div>
                      <div className="font-medium">R&B</div>
                      <div className="text-xs text-zinc-400 mt-1">Smooth, warm tone</div>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center justify-center border-zinc-700 hover:bg-zinc-800"
                      onClick={() => handleApplyMastering('rock')}
                      disabled={studio.isMastering}
                    >
                      <div className="text-xl mb-1">🤘</div>
                      <div className="font-medium">Rock</div>
                      <div className="text-xs text-zinc-400 mt-1">Powerful, energetic mix</div>
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowMasteringDialog(false)} 
                    className="border-zinc-700 text-zinc-300"
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleStartLiveSession}
            >
              Start Live Session
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main studio interface */}
      <div className="grid grid-cols-4 gap-4 p-4 pb-24">
        {/* Track list */}
        <div className="col-span-1 bg-zinc-900 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Tracks</h2>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 text-zinc-400 hover:text-white"
              onClick={() => studio.addTrack({ name: `Track ${studio.tracks.length + 1}` })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
            {studio.tracks.length === 0 ? (
              <div className="text-center p-4 text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 mx-auto mb-2 opacity-50">
                  <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                  <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                </svg>
                <p className="text-sm">No tracks added yet</p>
                <p className="text-xs mt-1">Import audio or record to get started</p>
              </div>
            ) : (
              studio.tracks.map(track => (
                <div 
                  key={track.id}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    studio.selectedTrackId === track.id 
                      ? 'bg-zinc-700' 
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  onClick={() => studio.setSelectedTrackId(track.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: track.color }}
                      ></div>
                      <span className="font-medium text-sm">{track.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        className={`p-0.5 rounded hover:bg-zinc-600 ${track.muted ? 'text-red-500' : 'text-zinc-400'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          studio.toggleTrackMute(track.id);
                        }}
                      >
                        {track.muted ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                          </svg>
                        )}
                      </button>
                      <button 
                        className={`p-0.5 rounded hover:bg-zinc-600 ${track.soloed ? 'text-yellow-500' : 'text-zinc-400'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          studio.toggleTrackSolo(track.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
                        </svg>
                      </button>
                      <button 
                        className="p-0.5 rounded hover:bg-zinc-600 text-zinc-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          studio.deleteTrack(track.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Waveform display */}
                  <div className="h-12 bg-zinc-900 rounded overflow-hidden flex items-center justify-center">
                    {track.waveform && track.waveform.length > 0 ? (
                      <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`waveformGradient-${track.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={track.color} stopOpacity="0.7" />
                            <stop offset="100%" stopColor={track.color} stopOpacity="0.3" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M 0,25 ${track.waveform.map((v, i) => `L ${i},${25 - v * 20} `).join('')} V 50 H 0 Z`}
                          fill={`url(#waveformGradient-${track.id})`}
                        />
                        <path
                          d={`M 0,25 ${track.waveform.map((v, i) => `L ${i},${25 - v * 20} `).join('')}`}
                          fill="none"
                          stroke={track.color}
                          strokeWidth="1"
                        />
                      </svg>
                    ) : (
                      <span className="text-xs text-zinc-500">No audio</span>
                    )}
                  </div>
                  
                  {/* Volume and pan controls */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>Vol</span>
                        <span>0 dB</span>
                      </div>
                      <Slider 
                        defaultValue={[0.8]} 
                        max={1} 
                        step={0.01} 
                        onValueChange={(value) => studio.updateTrackVolume(track.id, value[0])}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>L</span>
                        <span>Pan</span>
                        <span>R</span>
                      </div>
                      <Slider 
                        defaultValue={[0]} 
                        min={-1} 
                        max={1} 
                        step={0.01} 
                        onValueChange={(value) => studio.updateTrackPan(track.id, value[0])}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Main editor */}
        <div className={`${studio.showEffects ? 'col-span-2' : 'col-span-3'} bg-zinc-900 rounded-lg p-4`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Timeline</h2>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-zinc-400 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Options</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Select defaultValue="bar">
                <SelectTrigger className="h-7 w-20 bg-zinc-800 border-zinc-700 text-zinc-300 text-xs">
                  <SelectValue placeholder="Snap" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="beat">Beat</SelectItem>
                  <SelectItem value="1/4">1/4</SelectItem>
                  <SelectItem value="1/8">1/8</SelectItem>
                  <SelectItem value="1/16">1/16</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-zinc-400 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM5.636 4.136a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.061 1.06l-1.591-1.59a.75.75 0 010-1.061zm12.728 0a.75.75 0 010 1.06l-1.591 1.592a.75.75 0 01-1.06-1.061l1.59-1.591a.75.75 0 011.061 0zm-6.816 4.496a.75.75 0 01.82.311l5.228 7.917a.75.75 0 01-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 01-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 01-1.247-.606l.569-9.47a.75.75 0 01.554-.68zM3 10.5a.75.75 0 01.75-.75H6a.75.75 0 010 1.5H3.75A.75.75 0 013 10.5zm14.25 0a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H18a.75.75 0 01-.75-.75zm-8.962 3.712a.75.75 0 010 1.061l-1.591 1.591a.75.75 0 11-1.061-1.06l1.591-1.592a.75.75 0 011.06 0z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Tools</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Empty timeline with grid */}
          <div className="bg-zinc-800 rounded-lg h-[calc(100vh-13rem)] p-4 relative overflow-hidden">
            {/* Time markers */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-zinc-900 border-b border-zinc-700 flex items-center px-4">
              {Array.from({ length: 17 }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="relative h-3 border-l border-zinc-600" style={{ marginLeft: i === 0 ? 0 : '60px' }}>
                    <span className="absolute -left-3 top-4 text-xs text-zinc-500">{i}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Playhead */}
            <div 
              className="absolute top-8 bottom-0 w-px bg-primary z-10" 
              style={{ left: `${Math.min(100, studio.currentTime * 10)}%` }}
            >
              <div className="w-3 h-3 bg-primary -ml-1.5 -mt-1.5 rounded-full"></div>
            </div>
            
            {/* Grid */}
            <div className="absolute top-8 left-0 right-0 bottom-0 grid grid-cols-16 gap-0">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="border-l border-zinc-700 h-full"></div>
              ))}
              
              {/* Beat divisions - horizontal lines */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute left-0 right-0 border-t border-zinc-700" 
                  style={{ top: `${(i + 1) * 12.5}%` }}
                ></div>
              ))}
            </div>
            
            {/* Placeholder content */}
            <div className="absolute inset-0 flex items-center justify-center pt-8">
              <div className="text-center text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto mb-2 opacity-30">
                  <path fillRule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">Arrange tracks on the timeline</p>
                <p className="text-xs mt-1">Import audio or record to get started</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Effects panel */}
        {studio.showEffects && (
          <div className="col-span-1 bg-zinc-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium">Effects</h2>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 text-zinc-400 hover:text-white"
                onClick={() => studio.setShowEffects(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-1 max-h-[calc(100vh-12rem)]">
              {/* Dynamic EQ */}
              <div className="bg-zinc-800 p-3 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Dynamic EQ</h3>
                <div className="h-32 bg-zinc-900 rounded-lg mb-3 relative overflow-hidden">
                  <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="eqGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#39dd5a" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#39dd5a" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path 
                      d={`M0,${25 - studio.eqSettings.low * 5} C${33},${25 - studio.eqSettings.mid * 5} ${66},${25 - studio.eqSettings.high * 5} 100,25`}
                      stroke="#39dd5a"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path 
                      d={`M0,${25 - studio.eqSettings.low * 5} C${33},${25 - studio.eqSettings.mid * 5} ${66},${25 - studio.eqSettings.high * 5} 100,25 V50 H0 Z`}
                      fill="url(#eqGradient)"
                      opacity="0.5"
                    />
                    
                    {/* Control points */}
                    <circle cx="0" cy={25 - studio.eqSettings.low * 5} r="3" fill="white" />
                    <circle cx="50" cy={25 - studio.eqSettings.mid * 5} r="3" fill="white" />
                    <circle cx="100" cy={25 - studio.eqSettings.high * 5} r="3" fill="white" />
                  </svg>
                  
                  {/* Frequency markers */}
                  <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2">
                    <span className="text-[10px] text-zinc-500">100Hz</span>
                    <span className="text-[10px] text-zinc-500">1kHz</span>
                    <span className="text-[10px] text-zinc-500">10kHz</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Low</span>
                      <span>{studio.eqSettings.low}dB</span>
                    </div>
                    <Slider 
                      value={[studio.eqSettings.low]} 
                      min={-12} 
                      max={12} 
                      step={0.5} 
                      onValueChange={(value) => studio.updateEQ(value[0], studio.eqSettings.mid, studio.eqSettings.high)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Mid</span>
                      <span>{studio.eqSettings.mid}dB</span>
                    </div>
                    <Slider 
                      value={[studio.eqSettings.mid]} 
                      min={-12} 
                      max={12} 
                      step={0.5} 
                      onValueChange={(value) => studio.updateEQ(studio.eqSettings.low, value[0], studio.eqSettings.high)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>High</span>
                      <span>{studio.eqSettings.high}dB</span>
                    </div>
                    <Slider 
                      value={[studio.eqSettings.high]} 
                      min={-12} 
                      max={12} 
                      step={0.5} 
                      onValueChange={(value) => studio.updateEQ(studio.eqSettings.low, studio.eqSettings.mid, value[0])}
                    />
                  </div>
                </div>
              </div>
              
              {/* Compressor */}
              <div className="bg-zinc-800 p-3 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Compressor</h3>
                <div className="h-24 bg-zinc-900 rounded-lg mb-3 relative overflow-hidden">
                  {/* Compression curve visualization */}
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="100" x2="100" y2="0" stroke="#666" strokeWidth="1" strokeDasharray="2,2" />
                    
                    {/* Threshold marker */}
                    <line 
                      x1={Math.max(0, Math.min(100, (studio.compressorSettings.threshold + 60) / 60 * 100))} 
                      y1="0" 
                      x2={Math.max(0, Math.min(100, (studio.compressorSettings.threshold + 60) / 60 * 100))} 
                      y2="100" 
                      stroke="#39dd5a" 
                      strokeWidth="1" 
                      strokeDasharray="2,2" 
                    />
                    
                    {/* Compression curve */}
                    <path 
                      d={`M0,100 
                         L${Math.max(0, Math.min(100, (studio.compressorSettings.threshold + 60) / 60 * 100))},${Math.max(0, Math.min(100, (studio.compressorSettings.threshold + 60) / 60 * 100))} 
                         L100,${Math.max(0, Math.min(100, (studio.compressorSettings.threshold + 60) / 60 * 100 + (100 - (studio.compressorSettings.threshold + 60) / 60 * 100) / studio.compressorSettings.ratio))}`} 
                      stroke="#39dd5a"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Threshold</span>
                      <span>{studio.compressorSettings.threshold}dB</span>
                    </div>
                    <Slider 
                      value={[studio.compressorSettings.threshold]} 
                      min={-60} 
                      max={0} 
                      step={1} 
                      onValueChange={(value) => studio.updateCompressor({ threshold: value[0] })}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Ratio</span>
                      <span>{studio.compressorSettings.ratio}:1</span>
                    </div>
                    <Slider 
                      value={[studio.compressorSettings.ratio]} 
                      min={1} 
                      max={20} 
                      step={0.5} 
                      onValueChange={(value) => studio.updateCompressor({ ratio: value[0] })}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Attack</span>
                      <span>{(studio.compressorSettings.attack * 1000).toFixed(1)}ms</span>
                    </div>
                    <Slider 
                      value={[studio.compressorSettings.attack]} 
                      min={0.001} 
                      max={0.5} 
                      step={0.001} 
                      onValueChange={(value) => studio.updateCompressor({ attack: value[0] })}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Release</span>
                      <span>{(studio.compressorSettings.release * 1000).toFixed(0)}ms</span>
                    </div>
                    <Slider 
                      value={[studio.compressorSettings.release]} 
                      min={0.01} 
                      max={1} 
                      step={0.01} 
                      onValueChange={(value) => studio.updateCompressor({ release: value[0] })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Limiter / LUFS Target */}
              <div className="bg-zinc-800 p-3 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Loudness (LUFS Target)</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Quiet</span>
                    <span>{studio.lufsTarget} LUFS</span>
                    <span>Loud</span>
                  </div>
                  <Slider 
                    value={[studio.lufsTarget]} 
                    min={-24} 
                    max={-6} 
                    step={0.5} 
                    onValueChange={(value) => studio.updateLUFSTarget(value[0])}
                  />
                </div>
                
                <div className="h-8 bg-zinc-900 rounded-lg overflow-hidden">
                  <div 
                    className={`h-full ${
                      studio.lufsTarget > -14 
                        ? 'bg-gradient-to-r from-green-500 to-yellow-500' 
                        : 'bg-gradient-to-r from-blue-500 to-green-500'
                    }`}
                    style={{ 
                      width: `${Math.max(0, Math.min(100, (studio.lufsTarget + 24) / 18 * 100))}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
                  <span>Streaming (-14)</span>
                  <span>CD (-9)</span>
                </div>
              </div>
              
              {/* AI Mastering button */}
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                onClick={() => setShowMasteringDialog(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2">
                  <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75zM4.117 19.125a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z" clipRule="evenodd" />
                  <path d="M10.076 8.64l-2.201-2.2V4.874a.75.75 0 00-.364-.643l-3.75-2.25a.75.75 0 00-.916.113l-.75.75a.75.75 0 00-.113.916l2.25 3.75a.75.75 0 00.643.364h1.564l2.062 2.062 1.575-1.297z" />
                  <path fillRule="evenodd" d="M12.556 17.329l4.183 4.182a3.375 3.375 0 004.773-4.773l-3.306-3.305a6.803 6.803 0 01-1.53.043c-.394-.034-.682-.006-.867.042a.589.589 0 00-.167.063l-3.086 3.748zm3.414-1.36a.75.75 0 011.06 0l1.875 1.876a.75.75 0 11-1.06 1.06L15.97 17.03a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
                {studio.isMastering ? 'Processing...' : 'Apply AI Mastering'}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Collaboration panel */}
      {showCollabPanel && (
        <div className="fixed top-24 right-4 z-50 bg-zinc-800/90 backdrop-blur-sm rounded-lg shadow-xl p-3 w-72">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Collaboration</h3>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1"></span>
              <span className="text-xs text-zinc-400">Live</span>
              <button 
                className="ml-2 text-zinc-400 hover:text-white" 
                onClick={() => setShowCollabPanel(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
          
          {sessionCode && (
            <div className="bg-zinc-900 p-2 rounded mb-3">
              <p className="text-xs text-zinc-400">Share this code to invite collaborators:</p>
              <div className="flex items-center mt-1">
                <div className="bg-zinc-950 px-2 py-1 rounded text-center flex-grow font-mono text-sm">
                  {sessionCode}
                </div>
                <button className="ml-2 text-zinc-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="mb-3">
            <h4 className="text-xs font-medium mb-2 text-zinc-300">Active Users</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-black">
                  {studio.collaborators.length > 0 ? studio.collaborators[0]?.name?.charAt(0) || 'U' : 'Y'}
                </div>
                <span className="ml-2 text-sm">
                  {studio.collaborators.length > 0 ? studio.collaborators[0]?.name || 'User' : 'You'}
                </span>
                <span className="ml-auto text-xs text-zinc-400">
                  Editing
                </span>
              </div>
              
              {studio.collaborators.slice(1).map((collaborator, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
                    style={{ backgroundColor: collaborator.color }}
                  >
                    {collaborator.name.charAt(0)}
                  </div>
                  <span className="ml-2 text-sm">{collaborator.name}</span>
                  <span className="ml-auto text-xs text-zinc-400">
                    Viewing
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <h4 className="text-xs font-medium mb-2 text-zinc-300">Chat</h4>
            <div className="bg-zinc-900 rounded h-28 p-2 overflow-y-auto mb-2 text-xs">
              {studio.messages.length === 0 ? (
                <p className="text-zinc-500 text-center mt-4">No messages yet</p>
              ) : (
                studio.messages.map((message, index) => (
                  <div key={index} className="mb-1.5">
                    <span 
                      className="font-medium mr-1"
                      style={{ color: message.sender?.id === 'system' ? '#39dd5a' : undefined }}
                    >
                      {message.sender?.name || 'System'}:
                    </span>
                    <span className="text-zinc-300">{message.text}</span>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex">
              <Input 
                className="flex-grow bg-zinc-900 border-zinc-700 text-white text-xs"
                placeholder="Type a message..."
                value={studio.newMessage}
                onChange={(e) => studio.setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && studio.newMessage) {
                    studio.sendMessage(studio.newMessage);
                  }
                }}
              />
              <Button 
                size="sm" 
                className="ml-2 bg-primary text-black"
                onClick={() => studio.sendMessage(studio.newMessage)}
                disabled={!studio.newMessage}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-zinc-500">
            <p>Press spacebar to play/pause</p>
          </div>
        </div>
      )}
      
      {/* Quick access to show collaboration panel */}
      {!showCollabPanel && (
        <Button 
          className="fixed bottom-20 right-4 z-50 bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700"
          size="sm"
          onClick={() => setShowCollabPanel(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
          </svg>
          Collaboration
        </Button>
      )}
      
      {/* Back to Dashboard */}
      <Button asChild className="fixed bottom-20 left-4 z-50">
        <Link href="/">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
            <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
          </svg>
          Dashboard
        </Link>
      </Button>
    </div>
  );
};