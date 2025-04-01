import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import TrackList from '@/components/ui/track-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, LayoutGrid, List, Music, Heart, Clock, Download, Copy } from 'lucide-react';
import { Track } from '@shared/schema';

export default function Library() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Fetch user's tracks
  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    queryFn: async () => {
      const res = await fetch('/api/tracks');
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
  });
  
  // Filter tracks by search query
  const filteredTracks = tracks?.filter(track =>
    searchQuery === '' || 
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Mock playlists (would come from API in real app)
  const playlists = [
    { id: 1, name: 'Workout Mix', trackCount: 12 },
    { id: 2, name: 'Pre-Game Hype', trackCount: 8 },
    { id: 3, name: 'Recovery Vibes', trackCount: 15 },
    { id: 4, name: 'Focus Mode', trackCount: 10 },
  ];
  
  return (
    <MainLayout title="Your Library" description="Access your favorite tracks, playlists, and downloads">
      {/* Search Bar and View Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search your library"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="all">All Tracks</TabsTrigger>
          <TabsTrigger value="liked">Liked</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
        </TabsList>
        
        {/* All Tracks Tab */}
        <TabsContent value="all">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredTracks && filteredTracks.length > 0 ? (
            viewMode === 'list' ? (
              <TrackList tracks={filteredTracks} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredTracks.map(track => (
                  <div key={track.id} className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative group">
                      {track.coverArt ? (
                        <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                          <Music className="h-12 w-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" className="rounded-full bg-white text-black hover:bg-white/90">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold truncate">{track.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
                        {track.genre.replace('-', ' ')}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {track.plays} plays
                        </span>
                        <Button variant="ghost" size="sm" className="p-1 h-auto">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg shadow">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tracks in your library</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Browse the Discover page to find and add tracks to your library.
              </p>
              <Button className="mt-8" onClick={() => window.location.href = '/discover'}>
                Discover Music
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Liked Tab */}
        <TabsContent value="liked">
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg shadow">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No liked tracks yet</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Press the heart icon on any track to add it to your liked tracks.
            </p>
            <Button className="mt-8" onClick={() => window.location.href = '/discover'}>
              Discover Music
            </Button>
          </div>
        </TabsContent>
        
        {/* Playlists Tab */}
        <TabsContent value="playlists">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Create Playlist Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center p-8 h-60">
              <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 dark:bg-gray-800 h-16 w-16 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </Button>
              <h3 className="font-medium">Create Playlist</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                Organize your favorite tracks
              </p>
            </div>
            
            {/* Playlist Cards */}
            {playlists.map(playlist => (
              <div key={playlist.id} className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                <div className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Copy className="h-12 w-12 text-gray-400" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{playlist.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
                  </p>
                  <Button className="w-full mt-4" size="sm">
                    Play
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Downloads Tab */}
        <TabsContent value="downloads">
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg shadow">
            <Download className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No downloads yet</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Available with Gold tier subscription for offline listening.
            </p>
            <Button className="mt-8" onClick={() => window.location.href = '/subscriptions'}>
              Upgrade Subscription
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
