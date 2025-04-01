import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Track } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlayPause: () => void;
  setProgress: (value: number) => void;
  setVolume: (value: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  queue: Track[];
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: number) => void;
  clearQueue: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [queue, setQueue] = useState<Track[]>([]);
  const { toast } = useToast();

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    setAudioElement(audio);

    // Clean up on unmount
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Set up audio event listeners
  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      setProgress(audioElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      nextTrack();
    };

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('ended', handleEnded);

    // Set volume
    audioElement.volume = volume;

    // Clean up
    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement, volume]);

  // Play a track
  const playTrack = async (track: Track) => {
    if (!audioElement) return;

    try {
      // Load the track
      audioElement.src = track.audioUrl;
      audioElement.load();
      
      // Play it
      await audioElement.play();
      setIsPlaying(true);
      setCurrentTrack(track);
      
      // Record play in backend
      try {
        await apiRequest('POST', `/api/tracks/${track.id}/play`);
      } catch (error) {
        console.error('Failed to record play:', error);
      }
    } catch (error) {
      toast({
        title: 'Playback Error',
        description: 'Could not play the selected track. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Pause the current track
  const pauseTrack = () => {
    if (audioElement && isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  // Resume the current track
  const resumeTrack = async () => {
    if (audioElement && !isPlaying && currentTrack) {
      try {
        await audioElement.play();
        setIsPlaying(true);
      } catch (error) {
        toast({
          title: 'Playback Error',
          description: 'Could not resume playback. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  // Set the progress manually (seeking)
  const setProgressManually = (value: number) => {
    if (audioElement) {
      audioElement.currentTime = value;
      setProgress(value);
    }
  };

  // Set the volume
  const setVolumeLevel = (value: number) => {
    if (audioElement) {
      audioElement.volume = Math.max(0, Math.min(1, value));
      setVolume(value);
    }
  };

  // Play next track in queue
  const nextTrack = () => {
    if (queue.length > 0) {
      const nextTrackInQueue = queue[0];
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      playTrack(nextTrackInQueue);
    }
  };

  // Play previous track (reset current track if progress > 3 seconds)
  const previousTrack = () => {
    if (audioElement) {
      if (audioElement.currentTime > 3) {
        audioElement.currentTime = 0;
      } else {
        // TODO: Implement history to go back to previous track
        audioElement.currentTime = 0;
      }
    }
  };

  // Add track to queue
  const addToQueue = (track: Track) => {
    setQueue([...queue, track]);
    toast({
      title: 'Added to Queue',
      description: `"${track.title}" added to your playback queue.`
    });
  };

  // Remove track from queue
  const removeFromQueue = (trackId: number) => {
    setQueue(queue.filter(track => track.id !== trackId));
  };

  // Clear queue
  const clearQueue = () => {
    setQueue([]);
  };

  const value = {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    playTrack,
    pauseTrack,
    resumeTrack,
    togglePlayPause,
    setProgress: setProgressManually,
    setVolume: setVolumeLevel,
    nextTrack,
    previousTrack,
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
