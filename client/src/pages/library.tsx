import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Music, Clock, Star, Trash2, Plus, Share2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

// Sample data for library tracks
const sampleTracks = [
  {
    id: 1,
    title: 'Pre-Game Hype',
    artistName: 'You',
    duration: '2:45',
    plays: 1250,
    dateAdded: '2023-04-01',
    isFavorite: true,
    coverArt: null
  },
  {
    id: 2,
    title: 'Victory Anthem',
    artistName: 'You',
    duration: '3:12',
    plays: 840,
    dateAdded: '2023-03-25',
    isFavorite: true,
    coverArt: null
  },
  {
    id: 3,
    title: 'Workout Flow',
    artistName: 'You',
    duration: '4:20',
    plays: 2100,
    dateAdded: '2023-03-15',
    isFavorite: false,
    coverArt: null
  },
  {
    id: 4,
    title: 'Game Day Energy',
    artistName: 'You',
    duration: '3:05',
    plays: 1870,
    dateAdded: '2023-03-10',
    isFavorite: false,
    coverArt: null
  },
  {
    id: 5,
    title: 'Post-Game Reflection',
    artistName: 'You',
    duration: '5:30',
    plays: 650,
    dateAdded: '2023-03-05',
    isFavorite: false,
    coverArt: null
  }
];

// Sample data for saved tracks
const savedTracks = [
  {
    id: 101,
    title: 'Champion Mindset',
    artistName: 'Marcus Thompson',
    duration: '3:44',
    plays: 1.5e6,
    dateAdded: '2023-04-10',
    isFavorite: true,
    coverArt: null
  },
  {
    id: 102,
    title: 'Court Vision',
    artistName: 'Sarah Williams',
    duration: '2:55',
    plays: 890000,
    dateAdded: '2023-04-05',
    isFavorite: true,
    coverArt: null
  },
  {
    id: 103,
    title: 'Game Day',
    artistName: 'Jordan Davis',
    duration: '3:23',
    plays: 2.2e6,
    dateAdded: '2023-03-30',
    isFavorite: false,
    coverArt: null
  }
];

// Sample playlists
const playlists = [
  {
    id: 1,
    name: 'Pregame Ritual',
    description: 'Tracks to get focused before the game',
    trackCount: 12,
    coverArt: null
  },
  {
    id: 2,
    name: 'Workout Mix',
    description: 'High energy tracks for training sessions',
    trackCount: 18,
    coverArt: null
  },
  {
    id: 3,
    name: 'Recovery Vibes',
    description: 'Chill tracks for post-game recovery',
    trackCount: 8,
    coverArt: null
  }
];

// Format play count in K/M format
const formatPlayCount = (count: number) => {
  if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`;
  if (count >= 1e3) return `${(count / 1e3).toFixed(1)}K`;
  return count.toString();
};

export default function LibraryPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track component
  const TrackItem = ({ track, isInMyTracks = false }: { track: any, isInMyTracks?: boolean }) => (
    <div className="group flex items-center p-2 hover:bg-accent/50 rounded-md transition-colors">
      <div className="w-10 h-10 bg-zinc-800 rounded mr-3 flex-shrink-0 flex items-center justify-center">
        {track.coverArt ? (
          <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover rounded" />
        ) : (
          <Music className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-grow min-w-0 flex items-center">
        <div className="flex-grow min-w-0">
          <div className="flex items-center">
            <h3 className="font-medium text-sm truncate">{track.title}</h3>
            {track.isFavorite && (
              <Star className="h-3.5 w-3.5 text-amber-500 ml-2" fill="currentColor" />
            )}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="truncate">{track.artistName}</span>
          </div>
        </div>
        
        <div className="flex items-center ml-auto gap-3 text-xs text-muted-foreground">
          <span>{formatPlayCount(track.plays)} plays</span>
          <span>{track.duration}</span>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10 3.75a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zM10 11.75a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zM10 19.75a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Add to playlist</DropdownMenuItem>
                <DropdownMenuItem>Edit details</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
                {isInMyTracks && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Delete track</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Playlist component
  const PlaylistItem = ({ playlist }: { playlist: any }) => (
    <Card className="group">
      <CardContent className="p-4">
        <div className="w-full aspect-square bg-zinc-800 rounded-md mb-3 flex items-center justify-center overflow-hidden">
          {playlist.coverArt ? (
            <img src={playlist.coverArt} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Music className="h-12 w-12 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">{playlist.trackCount} tracks</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button 
              size="sm" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Play
            </Button>
          </div>
        </div>
        <h3 className="font-medium text-sm">{playlist.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{playlist.description}</p>
      </CardContent>
    </Card>
  );
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Library</h1>
            <p className="text-muted-foreground">Manage your music collection</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search library..." 
              className="pl-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="my-tracks">
          <TabsList className="mb-6">
            <TabsTrigger value="my-tracks">My Tracks</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>
          
          {/* My Tracks Tab */}
          <TabsContent value="my-tracks">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Your Tracks</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New
                  </Button>
                </div>
                <CardDescription>Tracks you've created in the studio</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[450px]">
                  <div className="divide-y divide-border">
                    {sampleTracks.filter(track => 
                      !searchQuery || 
                      track.title.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(track => (
                      <TrackItem key={track.id} track={track} isInMyTracks={true} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Saved Tab */}
          <TabsContent value="saved">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Saved Tracks</CardTitle>
                <CardDescription>Tracks you've saved from other artists</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[450px]">
                  <div className="divide-y divide-border">
                    {savedTracks.filter(track => 
                      !searchQuery || 
                      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      track.artistName.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(track => (
                      <TrackItem key={track.id} track={track} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Playlists Tab */}
          <TabsContent value="playlists">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Playlists</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Playlist
              </Button>
            </div>
            
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {playlists.filter(playlist => 
                !searchQuery || 
                playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                playlist.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(playlist => (
                <PlaylistItem key={playlist.id} playlist={playlist} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}