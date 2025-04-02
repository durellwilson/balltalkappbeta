import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/player-context';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatTime } from '@/lib/utils';
import { Volume2, VolumeX, SkipBack, SkipForward, Play, Pause, Repeat, Repeat1, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NowPlayingBar: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    progress, 
    volume,
    playTrack, 
    pauseTrack, 
    resumeTrack,
    seekTo,
    setVolume,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    isShuffleOn,
    repeatMode,
    queue
  } = usePlayer();

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  // Calculate current time based on progress and duration
  useEffect(() => {
    if (currentTrack?.duration) {
      setDuration(currentTrack.duration);
      setCurrentTime((progress / 100) * currentTrack.duration);
    }
  }, [progress, currentTrack]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0] / 100);
    if (newVolume[0] === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleSeek = (newPosition: number[]) => {
    seekTo(newPosition[0]);
  };

  if (!currentTrack) {
    return null;
  }

  // Get repeat icon based on repeat mode
  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return <Repeat1 size={18} />;
      case 'all':
        return <Repeat size={18} className="text-primary" />;
      default:
        return <Repeat size={18} />;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-2 z-50">
      <div className="flex items-center justify-between">
        {/* Track info */}
        <div className="flex items-center space-x-3 w-1/4">
          <div 
            className="w-12 h-12 bg-zinc-800 rounded flex-shrink-0 overflow-hidden"
            style={{
              backgroundImage: currentTrack.coverArt ? `url(${currentTrack.coverArt})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="truncate">
            <h3 className="font-medium text-sm truncate">{currentTrack.title}</h3>
            <p className="text-xs text-zinc-400 truncate">{currentTrack.artistName || 'Unknown Artist'}</p>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex flex-col items-center space-y-1 w-2/4">
          <div className="flex items-center space-x-3">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={toggleShuffle}
              className={cn(isShuffleOn ? "text-primary" : "text-zinc-400 hover:text-white")}
            >
              <Shuffle size={20} />
            </Button>
            <Button size="icon" variant="ghost" onClick={prevTrack} className="text-zinc-400 hover:text-white">
              <SkipBack size={20} />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              onClick={handlePlayPause} 
              className="text-white border-zinc-700 hover:bg-zinc-800 h-10 w-10"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            <Button size="icon" variant="ghost" onClick={nextTrack} className="text-zinc-400 hover:text-white">
              <SkipForward size={20} />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={toggleRepeat}
              className={cn(repeatMode !== 'off' ? "text-primary" : "text-zinc-400 hover:text-white")}
            >
              {getRepeatIcon()}
            </Button>
          </div>

          <div className="flex items-center w-full space-x-2">
            <span className="text-xs text-zinc-400 w-10 text-right">{formatTime(currentTime)}</span>
            <Slider 
              value={[progress]} 
              onValueChange={handleSeek} 
              max={100} 
              step={0.1}
              className="w-full"
            />
            <span className="text-xs text-zinc-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume controls */}
        <div className="flex items-center space-x-2 w-1/4 justify-end">
          <Button size="icon" variant="ghost" onClick={toggleMute} className="text-zinc-400 hover:text-white">
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </Button>
          <Slider 
            value={[volume * 100]} 
            onValueChange={handleVolumeChange} 
            max={100} 
            step={1}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
};