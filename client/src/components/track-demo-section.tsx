import React from 'react';
import { usePlayer } from '@/context/player-context';
import { TrackListItem } from './track-list-item';
import { sampleTracks } from '@/data/sample-tracks';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export const TrackDemoSection: React.FC = () => {
  // Get the player functionality
  const { playTrack } = usePlayer();

  return (
    <Card className="bg-zinc-900/50 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="border-b border-zinc-800/70">
        <CardTitle className="text-2xl font-bold">Popular Tracks</CardTitle>
        <CardDescription className="text-zinc-400">
          Listen to top tracks from professional athletes
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {sampleTracks.map((track) => (
            <TrackListItem 
              key={track.id} 
              track={track} 
              plays={Math.floor(Math.random() * 100000) + 10000}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-6 px-6">
        <Button 
          variant="outline" 
          className="w-full border border-zinc-800 hover:bg-zinc-800 bg-black/30"
          onClick={() => playTrack(sampleTracks[0])}
        >
          Play All Tracks
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};