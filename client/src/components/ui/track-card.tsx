import { Track } from '@shared/schema';
import { Play, MoreVertical, Plus } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { formatDuration } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface TrackCardProps {
  track: Track;
  className?: string;
}

export default function TrackCard({ track, className }: TrackCardProps) {
  const { playTrack, addToQueue } = useAudioPlayer();
  
  return (
    <Card className={className}>
      <div className="relative group">
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
          {track.coverArt ? (
            <img 
              src={track.coverArt} 
              alt={track.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
              </svg>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-14 w-14 rounded-full bg-white text-black hover:bg-white/90"
              onClick={() => playTrack(track)}
            >
              <Play className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1 overflow-hidden">
            <h3 className="font-semibold text-lg truncate">{track.title}</h3>
            <p className="text-sm text-muted-foreground capitalize">{track.genre.replace('-', ' ')}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => playTrack(track)}>
                <Play className="mr-2 h-4 w-4" />
                Play
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addToQueue(track)}>
                <Plus className="mr-2 h-4 w-4" />
                Add to Queue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <div>{formatDuration(track.duration)}</div>
        <div>{track.plays.toLocaleString()} plays</div>
      </CardFooter>
    </Card>
  );
}
