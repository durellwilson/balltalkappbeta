import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Track } from '@shared/schema';
import TrackCard from '@/components/ui/track-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Music } from 'lucide-react';

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  
  // Fetch all tracks
  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    queryFn: async () => {
      const res = await fetch('/api/tracks');
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
  });
  
  // Filter tracks by search query and genre
  const filteredTracks = tracks?.filter(track => {
    const matchesSearch = searchQuery === '' || 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.genre.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
    
    return matchesSearch && matchesGenre;
  });
  
  // Group tracks by genre for genre tab
  const tracksByGenre = filteredTracks?.reduce((acc, track) => {
    if (!acc[track.genre]) {
      acc[track.genre] = [];
    }
    acc[track.genre].push(track);
    return acc;
  }, {} as Record<string, Track[]>);
  
  return (
    <MainLayout title="Discover" description="Explore new music from professional athletes">
      {/* Search and Filters */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search tracks, genres, or athletes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Button 
            variant={selectedGenre === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedGenre('all')}
          >
            All Genres
          </Button>
          <Button 
            variant={selectedGenre === 'hip-hop' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedGenre('hip-hop')}
          >
            Hip-Hop
          </Button>
          <Button 
            variant={selectedGenre === 'r&b' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedGenre('r&b')}
          >
            R&B
          </Button>
          <Button 
            variant={selectedGenre === 'pop' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedGenre('pop')}
          >
            Pop
          </Button>
          <Button 
            variant={selectedGenre === 'rock' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedGenre('rock')}
          >
            Rock
          </Button>
          <Button 
            variant={selectedGenre === 'electronic' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedGenre('electronic')}
          >
            Electronic
          </Button>
          <Button 
            variant={selectedGenre === 'other' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedGenre('other')}
          >
            Other
          </Button>
        </div>
      </div>
      
      {/* Content Tabs */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="new">New Releases</TabsTrigger>
          <TabsTrigger value="genres">By Genre</TabsTrigger>
          <TabsTrigger value="artists">Top Athletes</TabsTrigger>
        </TabsList>
        
        {/* Trending Tab */}
        <TabsContent value="trending">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredTracks && filteredTracks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredTracks.map(track => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg shadow">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tracks found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                We couldn't find any tracks matching your search. Try adjusting your filters.
              </p>
              <Button className="mt-8" onClick={() => {
                setSearchQuery('');
                setSelectedGenre('all');
              }}>
                Reset Filters
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* New Releases Tab */}
        <TabsContent value="new">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredTracks && filteredTracks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {/* Sort by release date, newest first */}
              {[...filteredTracks]
                .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
                .map(track => (
                  <TrackCard key={track.id} track={track} />
                ))
              }
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg shadow">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No new releases</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Check back soon for new music from your favorite athletes.
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* By Genre Tab */}
        <TabsContent value="genres">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : tracksByGenre && Object.keys(tracksByGenre).length > 0 ? (
            <div className="space-y-12">
              {Object.entries(tracksByGenre).map(([genre, genreTracks]) => (
                <div key={genre} className="space-y-6">
                  <h3 className="text-xl font-bold capitalize">{genre.replace('-', ' ')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {genreTracks.slice(0, 5).map(track => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg shadow">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No genres available</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                We couldn't find any tracks matching your search criteria.
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Top Athletes Tab */}
        <TabsContent value="artists">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                <div className="h-40 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 dark:text-gray-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg">Athlete #{index + 1}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {index % 2 === 0 ? 'Hip-Hop, R&B' : 'Pop, Electronic'}
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.floor(Math.random() * 100)}K monthly listeners
                    </span>
                    <Button size="sm">Follow</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
