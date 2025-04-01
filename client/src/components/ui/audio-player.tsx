import { useState, useEffect } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2, 
  List 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatDuration } from '@/lib/utils';

export default function AudioPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlayPause, 
    progress, 
    duration, 
    setProgress, 
    volume, 
    setVolume, 
    nextTrack, 
    previousTrack 
  } = useAudioPlayer();
  
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  
  // Format the current progress time
  const formattedProgress = formatDuration(progress);
  const formattedDuration = formatDuration(duration);
  
  // Calculate progress percentage for display
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  
  if (!currentTrack) return null;
  
  return (
    <div className="fixed inset-x-0 bottom-16 md:bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2 shadow-lg">
      <div className="container mx-auto flex items-center">
        {/* Track Info */}
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 rounded-md bg-gray-200 dark:bg-gray-700 overflow-hidden mr-3">
            {currentTrack.coverArt ? (
              <img src={currentTrack.coverArt} alt="Album cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 mr-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentTrack.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Athlete #{currentTrack.artistId}</p>
          </div>
        </div>
        
        {/* Controls - Hide on small screens */}
        <div className="hidden sm:flex flex-col flex-1 max-w-md">
          <div className="flex justify-center items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsShuffle(!isShuffle)}
              className={isShuffle ? "text-primary" : "text-gray-500 dark:text-gray-400"}
            >
              <Shuffle className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={previousTrack}
              className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button 
              size="icon" 
              onClick={togglePlayPause}
              className="bg-primary text-white hover:bg-primary-dark rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={nextTrack}
              className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsRepeat(!isRepeat)}
              className={isRepeat ? "text-primary" : "text-gray-500 dark:text-gray-400"}
            >
              <Repeat className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{formattedProgress}</span>
            <Slider
              value={[progress]}
              max={duration || 100}
              step={1}
              className="mx-2 h-1"
              onValueChange={(vals) => setProgress(vals[0])}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10">{formattedDuration}</span>
          </div>
        </div>
        
        {/* Volume & Queue */}
        <div className="flex items-center">
          <div className="hidden sm:flex items-center mr-4">
            <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400">
              <Volume2 className="h-5 w-5" />
            </Button>
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              className="w-24 h-1 mx-2"
              onValueChange={(vals) => setVolume(vals[0] / 100)}
            />
          </div>
          
          <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400">
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
