import React from 'react';
import { usePlayer } from '@/context/player-context';
import { PlayableTrack } from '@/context/player-context';
import { Heart, Share2, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackListItemProps {
  track: PlayableTrack;
  plays?: number;
}

export const TrackListItem: React.FC<TrackListItemProps> = ({ track, plays = 0 }) => {
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = usePlayer();
  
  const isCurrentTrack = currentTrack?.id === track.id;
  
  const handlePlayClick = () => {
    if (isCurrentTrack) {
      if (isPlaying) {
        pauseTrack();
      } else {
        resumeTrack();
      }
    } else {
      playTrack(track);
    }
  };
  
  return (
    <div className={cn(
      "bg-zinc-900 rounded-lg p-3 flex items-center hover:bg-zinc-800 transition-colors",
      isCurrentTrack && "border-l-4 border-primary"
    )}>
      <div 
        className="w-12 h-12 bg-zinc-800 rounded mr-3 flex-shrink-0 overflow-hidden relative group"
        style={{
          backgroundImage: track.coverArt ? `url(${track.coverArt})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <button 
          onClick={handlePlayClick}
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isCurrentTrack && isPlaying ? 
            <Pause className="text-white" size={24} /> : 
            <Play className="text-white" size={24} />
          }
        </button>
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="font-medium text-sm">{track.title}</h3>
        <p className="text-xs text-zinc-400">{track.artistName}</p>
        <div className="flex items-center mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-zinc-400 mr-1">
            <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 011.06 3.389 5.5 5.5 0 01-1.06 3.389.75.75 0 101.06 1.061 7 7 0 001.5-4.45 7 7 0 00-1.5-4.45z" />
          </svg>
          <span className="text-xs text-zinc-400">{plays.toLocaleString()} plays</span>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button className="text-zinc-400 hover:text-white transition-colors">
          <Heart size={20} />
        </button>
        <button className="text-zinc-400 hover:text-white transition-colors">
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
};