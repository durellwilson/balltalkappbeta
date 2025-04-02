import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track } from '@shared/schema';

// Playable track interface - minimum required properties for playback
export interface PlayableTrack extends Partial<Track> {
  id: number;
  title: string;
  artistName?: string;
  audioUrl: string;
  coverArt?: string;
  duration?: number;
  genre?: 'hip-hop' | 'electronic' | 'rock' | 'r&b' | 'pop' | 'other';
}

// Player context type definition
interface PlayerContextType {
  currentTrack: PlayableTrack | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  playTrack: (track: PlayableTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  seekTo: (position: number) => void;
  setVolume: (level: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  isShuffleOn: boolean;
  repeatMode: 'off' | 'all' | 'one';
  queue: PlayableTrack[];
  addToQueue: (track: PlayableTrack) => void;
  removeFromQueue: (trackId: number) => void;
  clearQueue: () => void;
  getPlayCount: (trackId: number) => number;
  incrementPlayCount: (trackId: number) => void;
}

// Creating the context with default values
const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  volume: 0.8,
  playTrack: () => {},
  pauseTrack: () => {},
  resumeTrack: () => {},
  seekTo: () => {},
  setVolume: () => {},
  nextTrack: () => {},
  prevTrack: () => {},
  toggleShuffle: () => {},
  toggleRepeat: () => {},
  isShuffleOn: false,
  repeatMode: 'off',
  queue: [],
  addToQueue: () => {},
  removeFromQueue: () => {},
  clearQueue: () => {},
  getPlayCount: () => 0,
  incrementPlayCount: () => {}
});

// Provider component that wraps the app
export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [queue, setQueue] = useState<PlayableTrack[]>([]);
  const [playCounts, setPlayCounts] = useState<Record<number, number>>({});
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  // Initialize audio element on component mount
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    
    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Setup event listeners when currentTrack changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    const audio = audioRef.current;
    
    // Set up the audio src
    audio.src = currentTrack.audioUrl;
    audio.load();

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      if (repeatMode === 'one') {
        // If repeat one, just restart the current track
        audio.currentTime = 0;
        audio.play().catch(handleError);
      } else if (repeatMode === 'all' || queue.length > 0) {
        // Move to next track when current track ends
        nextTrack();
      } else {
        // If no more tracks and not repeating, just stop
        setIsPlaying(false);
        setProgress(0);
      }
    };
    
    // Add event listeners
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    
    // Start playing if isPlaying is true
    if (isPlaying) {
      audio.play().catch(handleError);
    }
    
    // Setup progress tracking
    startProgressInterval();
    
    // Clean up
    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentTrack]);
  
  // Handle play state changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch((e) => {
        console.error('Error playing audio:', e);
        setIsPlaying(false);
      });
      startProgressInterval();
    } else {
      audioRef.current.pause();
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isPlaying]);
  
  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Function to start the progress tracking interval
  const startProgressInterval = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    intervalRef.current = window.setInterval(() => {
      if (audioRef.current) {
        const currentProgress = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
        setProgress(currentProgress);
      }
    }, 1000);
  };
  
  // Play a track
  const playTrack = (track: PlayableTrack) => {
    // If we're already playing this track, just resume
    if (currentTrack && currentTrack.id === track.id) {
      resumeTrack();
      return;
    }
    
    // Increment play count when starting a new track
    incrementPlayCount(track.id);
    
    setCurrentTrack(track);
    setIsPlaying(true);
  };
  
  // Get play count for a track
  const getPlayCount = (trackId: number): number => {
    return playCounts[trackId] || 0;
  };
  
  // Increment play count for a track
  const incrementPlayCount = (trackId: number): void => {
    setPlayCounts(prev => ({
      ...prev,
      [trackId]: (prev[trackId] || 0) + 1
    }));
  };
  
  // Pause the current track
  const pauseTrack = () => {
    setIsPlaying(false);
  };
  
  // Resume the current track
  const resumeTrack = () => {
    if (currentTrack) {
      setIsPlaying(true);
    }
  };
  
  // Seek to a specific position (0-100)
  const seekTo = (position: number) => {
    if (audioRef.current && currentTrack) {
      const seekPosition = (position / 100) * (audioRef.current.duration || 0);
      audioRef.current.currentTime = seekPosition;
      setProgress(position);
    }
  };
  
  // Set the volume (0-1)
  const setVolume = (level: number) => {
    setVolumeState(level);
  };
  
  // Play the next track in queue
  const nextTrack = () => {
    if (queue.length === 0) {
      // No more tracks in queue
      if (repeatMode === 'all' && currentTrack) {
        // If repeat all is on, go back to the first track
        playTrack(currentTrack);
      }
      return;
    }
    
    // Get the next track (either shuffled or the first in queue)
    let nextTrackIndex = 0;
    if (isShuffleOn) {
      nextTrackIndex = Math.floor(Math.random() * queue.length);
    }
    
    const nextUp = queue[nextTrackIndex];
    
    // Remove the track from queue
    setQueue(prev => prev.filter((_, i) => i !== nextTrackIndex));
    
    // Play the track
    playTrack(nextUp);
  };
  
  // Play the previous track
  const prevTrack = () => {
    // If we're more than 3 seconds into the track, restart it
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    
    // Otherwise, we would go to the previous track
    // But for now, just restart the current track
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };
  
  // Toggle shuffle mode
  const toggleShuffle = () => {
    setIsShuffleOn(prev => !prev);
  };
  
  // Toggle repeat mode
  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };
  
  // Add a track to the queue
  const addToQueue = (track: PlayableTrack) => {
    setQueue(prev => [...prev, track]);
  };
  
  // Remove a track from the queue
  const removeFromQueue = (trackId: number) => {
    setQueue(prev => prev.filter(t => t.id !== trackId));
  };
  
  // Clear the entire queue
  const clearQueue = () => {
    setQueue([]);
  };
  
  // Create the context value object with all our methods and state
  const value: PlayerContextType = {
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
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    getPlayCount,
    incrementPlayCount
  };
  
  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

// Custom hook to use the player context
export const usePlayer = () => useContext(PlayerContext);