import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { 
  Search, 
  Play, 
  Heart, 
  Share2, 
  SkipBack, 
  SkipForward, 
  Home, 
  BookOpen,
  Radio
} from 'lucide-react';

export default function DiscoverPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch tracks
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['/api/tracks'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/tracks');
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch tracks:', error);
        return [];
      }
    }
  });
  
  // Fetch athletes
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ['/api/users/athletes'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/users?role=athlete');
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch athletes:', error);
        return [];
      }
    }
  });

  // Sample data (for demonstration until backend is fully functional)
  const sampleTracks = [
    {
      id: 1,
      title: "Game Day Vibes",
      artistName: "Marcus Thompson",
      plays: "125K",
      genre: "Basketball",
      coverArt: null
    },
    {
      id: 2,
      title: "Championship Flow",
      artistName: "Sarah Williams",
      plays: "98K",
      genre: "Soccer",
      coverArt: null
    }
  ];

  const sampleAthletes = [
    {
      id: 1,
      username: "Marcus Thompson",
      sport: "Basketball",
      followers: "1.2M",
      profileImage: null
    },
    {
      id: 2,
      username: "Sarah Williams",
      sport: "Soccer",
      followers: "890K",
      profileImage: null
    }
  ];

  const sampleGenres = [
    { id: 1, name: "Workout", color: "from-orange-500 to-red-600" },
    { id: 2, name: "Pre-Game", color: "from-blue-500 to-indigo-600" },
    { id: 3, name: "Victory", color: "from-green-500 to-emerald-600" },
    { id: 4, name: "Focus", color: "from-purple-500 to-pink-600" }
  ];

  // Use sample data if no actual data is available
  const displayTracks = tracks && tracks.length > 0 ? tracks : sampleTracks;
  const displayAthletes = athletes && athletes.length > 0 ? athletes : sampleAthletes;

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-bold text-xl mr-1">BALL</span>
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mx-0.5">
              <span className="sr-only">Microphone</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-black">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            </div>
            <span className="font-bold text-xl">TALK</span>
          </div>
          
          <div className="relative max-w-md w-full mx-4 hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <Input 
              placeholder="Search athletes, tracks..." 
              className="w-full pl-10 bg-zinc-800 border-zinc-700 rounded-full text-sm h-9"
            />
          </div>
          
          <div className="flex items-center">
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => navigate('/profile')}>
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user?.username} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-sm font-medium">{user?.username?.charAt(0) || 'U'}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Mobile Search */}
      <div className="px-4 py-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
          <Input 
            placeholder="Search artists, tracks, or sports..." 
            className="w-full pl-10 bg-zinc-800 border-zinc-700 rounded-full text-sm"
          />
          <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
              <path d="M3 4C3 3.44772 3.44772 3 4 3H11C11.5523 3 12 3.44772 12 4C12 4.55228 11.5523 5 11 5H4C3.44772 5 3 4.55228 3 4Z" fill="currentColor" />
              <path d="M3 8C3 7.44772 3.44772 7 4 7H11C11.5523 7 12 7.44772 12 8C12 8.55228 11.5523 9 11 9H4C3.44772 9 3 8.55228 3 8Z" fill="currentColor" />
              <path d="M3 12C3 11.4477 3.44772 11 4 11H11C11.5523 11 12 11.4477 12 12C12 12.5523 11.5523 13 11 13H4C3.44772 13 3 12.5523 3 12Z" fill="currentColor" />
            </svg>
          </Button>
        </div>
      </div>
      
      {/* Category tabs */}
      <div className="px-4 py-2 overflow-x-auto flex space-x-2 hide-scrollbar">
        <Badge 
          className={`px-4 py-1.5 cursor-pointer ${activeTab === 'all' ? 'bg-primary text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </Badge>
        <Badge 
          className={`px-4 py-1.5 cursor-pointer ${activeTab === 'basketball' ? 'bg-primary text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          onClick={() => setActiveTab('basketball')}
        >
          Basketball <span className="ml-1 text-xs opacity-70">1.2K</span>
        </Badge>
        <Badge 
          className={`px-4 py-1.5 cursor-pointer ${activeTab === 'football' ? 'bg-primary text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          onClick={() => setActiveTab('football')}
        >
          Football <span className="ml-1 text-xs opacity-70">856</span>
        </Badge>
        <Badge 
          className={`px-4 py-1.5 cursor-pointer ${activeTab === 'soccer' ? 'bg-primary text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          onClick={() => setActiveTab('soccer')}
        >
          Soccer <span className="ml-1 text-xs opacity-70">645</span>
        </Badge>
      </div>
      
      {/* Main content */}
      <div className="flex-1 px-4 py-4 space-y-8 pb-24">
        {/* Featured Athletes */}
        <section>
          <h2 className="text-xl font-bold mb-4">Featured Athletes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {!athletesLoading && displayAthletes.map((athlete: any) => (
              <Card key={athlete.id} className="bg-zinc-900 border-zinc-800 overflow-hidden hover:bg-zinc-800/80 transition-colors">
                <div className="aspect-square bg-zinc-800 flex items-center justify-center">
                  {athlete.profileImage ? (
                    <img 
                      src={athlete.profileImage} 
                      alt={athlete.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-zinc-500 text-opacity-30 text-xl">
                      400 × 200
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm">{athlete.username}</h3>
                  <p className="text-xs text-zinc-400">{athlete.sport}</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-zinc-400 mr-1">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span className="text-xs text-zinc-400">{athlete.followers}</span>
                    </div>
                    <Button size="sm" className="text-xs rounded-full py-0 h-7 bg-primary text-black hover:bg-primary/90">
                      Follow
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Trending Tracks */}
        <section>
          <h2 className="text-xl font-bold mb-4">Trending Tracks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {!tracksLoading && displayTracks.map((track: any) => (
              <div key={track.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group">
                <div className="relative aspect-square bg-zinc-800 flex items-center justify-center">
                  {track.coverArt ? (
                    <img 
                      src={track.coverArt} 
                      alt={track.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-zinc-500 text-opacity-30 text-xl">
                      200 × 200
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="icon" className="bg-white text-black hover:bg-white/90 h-12 w-12 rounded-full">
                      <Play className="h-6 w-6 fill-current" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm">{track.title}</h3>
                  <p className="text-xs text-zinc-400">{track.artistName}</p>
                  <div className="flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-zinc-400 mr-1">
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    <span className="text-xs text-zinc-400">{track.plays} plays</span>
                  </div>
                </div>
                <button className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
        
        {/* Genres & Moods */}
        <section>
          <h2 className="text-xl font-bold mb-4">Genres & Moods</h2>
          <div className="grid grid-cols-2 gap-4">
            {sampleGenres.map((genre) => (
              <div 
                key={genre.id}
                className={`bg-gradient-to-br ${genre.color} rounded-lg p-5 cursor-pointer hover:shadow-lg transition-shadow`}
              >
                <h3 className="font-bold text-white text-xl">{genre.name}</h3>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      {/* Now Playing Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 py-2 px-4 flex items-center">
        <div className="flex items-center flex-1 min-w-0">
          <div className="h-10 w-10 bg-zinc-800 rounded-md mr-3 flex-shrink-0">
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="font-medium text-sm truncate">Game Day Vibes</h4>
            <p className="text-xs text-zinc-400 truncate">Marcus Thompson</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button className="h-8 w-8 rounded-full bg-white text-black hover:bg-white/90 p-0 flex-shrink-0">
            <Play className="h-4 w-4 fill-current" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-6 py-2 flex justify-between items-center">
        <Button variant="ghost" size="sm" className="flex flex-col items-center" onClick={() => navigate('/')}>
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center" onClick={() => navigate('/discover')}>
          <Search className="h-5 w-5" />
          <span className="text-xs mt-1">Discover</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center" onClick={() => navigate('/live')}>
          <Radio className="h-5 w-5" />
          <span className="text-xs mt-1">Live</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center" onClick={() => navigate('/library')}>
          <BookOpen className="h-5 w-5" />
          <span className="text-xs mt-1">Library</span>
        </Button>
      </div>
    </div>
  );
}