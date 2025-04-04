import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Play, Plus, HeartIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AppLayout } from '@/components/layout/app-layout';

interface AudioTrackProps {
  title: string;
  artist: string;
  imageUrl?: string;
  isLiked?: boolean;
}

// Audio Track Card Component
const AudioTrackCard = ({ title, artist, imageUrl, isLiked = false }: AudioTrackProps) => {
  const [liked, setLiked] = useState(isLiked);
  
  return (
    <div className="bg-card rounded-lg overflow-hidden transition-all duration-300 hover:bg-accent group">
      <div className="aspect-square relative bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
            <span className="text-4xl font-bold text-zinc-700">{title[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button size="icon" variant="default" className="rounded-full h-12 w-12">
            <Play className="h-6 w-6" />
          </Button>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="truncate flex-1">
            <h3 className="font-medium text-base line-clamp-1">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{artist}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8" 
              onClick={() => setLiked(!liked)}
            >
              <HeartIcon className={`h-4 w-4 ${liked ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Add to playlist</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuItem>Download</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PlaylistCardProps {
  title: string;
  description: string;
  tracksCount: number;
  imageUrl?: string;
}

// Playlist Card Component
const PlaylistCard = ({ title, description, tracksCount, imageUrl }: PlaylistCardProps) => {
  return (
    <Card className="transition-all duration-300 hover:bg-accent/50 h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="aspect-square relative w-full bg-muted rounded-md overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
              <span className="text-4xl font-bold text-primary/40">{title[0]}</span>
            </div>
          )}
          <div className="absolute right-2 bottom-2">
            <Button size="icon" variant="default" className="rounded-full h-10 w-10 shadow-lg">
              <Play className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <CardTitle className="text-base mt-2 truncate">{title}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs mt-1">{description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
        {tracksCount} tracks
      </CardFooter>
    </Card>
  );
};

// Main Library Component
export default function LibraryPage() {
  const { user } = useAuth();
  
  // Sample data for the library page
  const recentlyPlayed: AudioTrackProps[] = [
    { title: "Game Day Motivation", artist: "Marcus Thompson", isLiked: true, imageUrl: undefined },
    { title: "Championship Flow", artist: "Sarah Williams", imageUrl: undefined },
    { title: "Victory Anthem", artist: "DK Metcalf", imageUrl: undefined },
    { title: "Pre-Game Ritual", artist: "LeBron James", isLiked: true, imageUrl: undefined },
  ];
  
  const favoriteAlbums: PlaylistCardProps[] = [
    { title: "Stadium Energy Mix", description: "Perfect for game day preparation", tracksCount: 12, imageUrl: undefined },
    { title: "Workout Sessions Vol.3", description: "High intensity training soundtrack", tracksCount: 15, imageUrl: undefined },
    { title: "Post-Game Relaxation", description: "Chill beats to unwind after the game", tracksCount: 8, imageUrl: undefined },
    { title: "Motivational Speeches", description: "Inspirational words from sporting legends", tracksCount: 10, imageUrl: undefined },
  ];

  const favoriteArtists: PlaylistCardProps[] = [
    { title: "Marcus Thompson", description: "Basketball", tracksCount: 24, imageUrl: undefined },
    { title: "Sarah Williams", description: "Soccer", tracksCount: 16, imageUrl: undefined },
    { title: "DK Metcalf", description: "Football", tracksCount: 8, imageUrl: undefined },
    { title: "LeBron James", description: "Basketball", tracksCount: 32, imageUrl: undefined },
  ];
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Library</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="athletes">Athletes</TabsTrigger>
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="downloads">Downloads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Recently Played</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recentlyPlayed.map((track, index) => (
                  <AudioTrackCard key={index} {...track} />
                ))}
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Your Playlists</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favoriteAlbums.map((album, index) => (
                  <PlaylistCard key={index} {...album} />
                ))}
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Favorite Athletes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favoriteArtists.map((artist, index) => (
                  <PlaylistCard key={index} {...artist} />
                ))}
              </div>
            </section>
          </TabsContent>
          
          <TabsContent value="playlists" className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Your Playlists</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favoriteAlbums.map((album, index) => (
                  <PlaylistCard key={index} {...album} />
                ))}
              </div>
            </section>
          </TabsContent>
          
          <TabsContent value="athletes" className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Favorite Athletes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favoriteArtists.map((artist, index) => (
                  <PlaylistCard key={index} {...artist} />
                ))}
              </div>
            </section>
          </TabsContent>
          
          <TabsContent value="tracks" className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Your Tracks</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recentlyPlayed.map((track, index) => (
                  <AudioTrackCard key={index} {...track} />
                ))}
              </div>
            </section>
          </TabsContent>
          
          <TabsContent value="downloads" className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Downloaded Content</h2>
              <div className="py-12 text-center">
                <h3 className="text-xl font-medium mb-2">No downloads yet</h3>
                <p className="text-muted-foreground mb-6">Download your favorite content to listen offline</p>
                <Button asChild>
                  <Link href="/discover">Browse Content</Link>
                </Button>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}