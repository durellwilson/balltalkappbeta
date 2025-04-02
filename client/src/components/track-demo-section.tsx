import React from 'react';
import { useLocation } from 'wouter';
import { usePlayer } from '@/context/player-context';
import { TrackListItem } from './track-list-item';
import { sampleTracks } from '@/data/sample-tracks';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Mic, Upload, Sparkles } from 'lucide-react';

export const TrackDemoSection: React.FC = () => {
  // Get the player functionality and navigation
  const { playTrack } = usePlayer();
  const [_, navigate] = useLocation();

  // Sample tracks for demonstration
  const displayedTracks = sampleTracks.slice(0, 3); // Limit to 3 tracks to avoid duplicates with Recent Releases

  // Function to navigate to different studio interfaces
  const navigateToStudio = (mode: 'record' | 'upload' | 'generate') => {
    navigate(`/enhanced-studio?mode=${mode}`);
  };

  return (
    <Card className="bg-zinc-900/50 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="border-b border-zinc-800/70">
        <CardTitle className="text-2xl font-bold">Create New Tracks</CardTitle>
        <CardDescription className="text-zinc-400">
          Start creating by recording, uploading, or using AI generation
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {/* Creative action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button 
            className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white border-0 h-14"
            onClick={() => navigateToStudio('record')}
          >
            <Mic className="mr-2 h-5 w-5" />
            Record Track
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white border-0 h-14"
            onClick={() => navigateToStudio('upload')}
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Audio
          </Button>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-indigo-800 hover:from-purple-700 hover:to-indigo-900 text-white border-0 h-14"
            onClick={() => navigateToStudio('generate')}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            AI Generation
          </Button>
        </div>

        {/* Sample tracks */}
        <div className="space-y-3">
          {displayedTracks.map((track) => (
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
          onClick={() => navigate('/enhanced-studio')}
        >
          Open Full Studio
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};