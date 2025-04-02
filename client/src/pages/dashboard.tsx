import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  BarChart, 
  ChevronRight, 
  Music, 
  Play, 
  Plus, 
  Mic, 
  Upload, 
  Headphones, 
  CreditCard,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { TrackListItem } from '@/components/track-list-item';
import { TrackDemoSection } from '@/components/track-demo-section';
import { sampleTracks } from '@/data/sample-tracks';

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  // Force isAthlete to be true for demonstration purposes
  const isAthlete = true; // user?.role === 'athlete';
  
  // Fetch recent tracks
  const { data: recentTracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['/api/tracks/recent'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/tracks');
        const allTracks = await response.json();
        // Take the 5 most recent tracks
        return allTracks.slice(0, 5);
      } catch (error) {
        console.error('Failed to fetch tracks:', error);
        return [];
      }
    }
  });
  
  // Fetch user's studio sessions if they're an athlete
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/studio/sessions'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/studio/sessions');
        const allSessions = await response.json();
        // Take the 3 most recent sessions
        return allSessions.slice(0, 3);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        return [];
      }
    },
    enabled: isAthlete
  });
  
  // Fetch user's projects if they're an athlete
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/studio/projects'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/studio/projects');
        const allProjects = await response.json();
        // Take the 3 most recent projects
        return allProjects.slice(0, 3);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        return [];
      }
    },
    enabled: isAthlete
  });
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/50 backdrop-blur-lg rounded-xl p-8 border border-zinc-800/60 shadow-xl mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Welcome, {user?.username || 'User'}
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">
            Your premium music experience awaits
          </p>
        </div>
        
        {isAthlete && (
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate('/enhanced-studio?action=record')} 
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 border-0 shadow-lg hover:shadow-red-500/30 transition-all"
            >
              <Mic className="mr-2 h-4 w-4" />
              Record Track
            </Button>
            <Button 
              onClick={() => navigate('/enhanced-studio?action=upload')} 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Track
            </Button>
            <Button 
              onClick={() => navigate('/enhanced-studio?action=ai')} 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-lg hover:shadow-emerald-500/30 transition-all"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/enhanced-studio')} 
              className="border border-zinc-700 bg-black/40 hover:bg-black/60 shadow-lg"
            >
              <Music className="mr-2 h-4 w-4" />
              Open Studio
            </Button>
          </div>
        )}
      </div>
      
      {/* Quick access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => navigate('/discover')}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-900/90 z-0"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYxMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-30 z-0"></div>
          <CardContent className="p-8 relative z-10 text-white">
            <div className="bg-white/10 backdrop-blur-lg rounded-full p-3 w-14 h-14 flex items-center justify-center mb-6">
              <Music className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-2xl tracking-tight">Discover</h3>
            <p className="text-blue-100 text-sm mt-2 opacity-80">Explore exclusive tracks from elite athletes worldwide</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => navigate('/library')}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-fuchsia-900/90 z-0"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYxMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-30 z-0"></div>
          <CardContent className="p-8 relative z-10 text-white">
            <div className="bg-white/10 backdrop-blur-lg rounded-full p-3 w-14 h-14 flex items-center justify-center mb-6">
              <Headphones className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-2xl tracking-tight">Library</h3>
            <p className="text-purple-100 text-sm mt-2 opacity-80">Your curated collection of premium tracks and playlists</p>
          </CardContent>
        </Card>
        
        {isAthlete && (
          <Card className="relative overflow-hidden border-0 shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => navigate('/earnings')}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/90 to-red-900/90 z-0"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYxMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-30 z-0"></div>
            <CardContent className="p-8 relative z-10 text-white">
              <div className="bg-white/10 backdrop-blur-lg rounded-full p-3 w-14 h-14 flex items-center justify-center mb-6">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-2xl tracking-tight">Earnings</h3>
              <p className="text-amber-100 text-sm mt-2 opacity-80">Monitor your revenue streams and audience engagement</p>
            </CardContent>
          </Card>
        )}
        
        <Card className="relative overflow-hidden border-0 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => navigate('/subscriptions')}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-green-900/90 z-0"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYxMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-30 z-0"></div>
          <CardContent className="p-8 relative z-10 text-white">
            <div className="bg-white/10 backdrop-blur-lg rounded-full p-3 w-14 h-14 flex items-center justify-center mb-6">
              <BarChart className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-2xl tracking-tight">Subscriptions</h3>
            <p className="text-green-100 text-sm mt-2 opacity-80">Elevate your experience with elite membership options</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Content section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Player Demo */}
        <div className="lg:col-span-3 mb-8">
          <TrackDemoSection />
        </div>
        
        {/* Recent releases */}
        <Card className="lg:col-span-2 border-0 shadow-xl bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-zinc-800/70">
            <CardTitle className="text-2xl font-bold">Recent Releases</CardTitle>
            <CardDescription className="text-zinc-400">
              Exclusive tracks from top athletes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {tracksLoading ? (
              <div className="flex justify-center p-8">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-2 border-zinc-700 opacity-20"></div>
                  <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                </div>
              </div>
            ) : recentTracks && recentTracks.length > 0 ? (
              <div className="space-y-5">
                {recentTracks.map((track: any) => (
                  <div 
                    key={track.id} 
                    className="flex items-center space-x-4 p-3 rounded-xl bg-black/20 hover:bg-black/40 transition-all duration-200 group border border-zinc-800/40 hover:border-zinc-700/80"
                  >
                    <div className="relative">
                      {track.coverArt ? (
                        <img src={track.coverArt} alt={track.title} className="h-20 w-20 rounded-lg object-cover shadow-lg" />
                      ) : (
                        <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-lg">
                          <Music className="h-10 w-10 text-zinc-600" />
                        </div>
                      )}
                      <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white rounded-full p-2.5 shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play className="h-4 w-4 text-black" fill="currentColor" />
                        </div>
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg truncate">{track.title}</h4>
                      <p className="text-sm text-zinc-400 truncate">
                        {track.artistName || 'Unknown Artist'}
                      </p>
                      <div className="flex items-center mt-2">
                        <Badge variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-xs font-medium">
                          {track.genre || 'Other'}
                        </Badge>
                        {track.releaseDate && (
                          <span className="text-xs text-zinc-500 ml-2">
                            {formatDate(new Date(track.releaseDate))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="19" cy="12" r="1"></circle>
                          <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-black/20 rounded-xl border border-zinc-800/50">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 mb-4">
                  <Music className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-lg font-medium">No tracks available yet</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
                  We're working with elite athletes to bring you exclusive content. Check back soon for new releases.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 pb-6 px-6">
            <Button variant="outline" className="w-full border border-zinc-800 hover:bg-zinc-800 bg-black/30" onClick={() => navigate('/discover')}>
              Explore All Releases
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* Athlete dashboard or subscription info */}
        <div className="space-y-6">
          {isAthlete ? (
            <>
              {/* Studio Projects */}
              <Card className="border-0 shadow-xl bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-zinc-800/70">
                  <CardTitle className="text-xl font-bold">Your Studio Projects</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Continue where you left off
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  {projectsLoading ? (
                    <div className="flex justify-center p-6">
                      <div className="relative h-10 w-10">
                        <div className="absolute inset-0 rounded-full border-2 border-zinc-700 opacity-20"></div>
                        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                      </div>
                    </div>
                  ) : projects && projects.length > 0 ? (
                    <div className="space-y-3">
                      {projects.map((project: any) => (
                        <div 
                          key={project.id} 
                          className="flex items-center p-3 rounded-lg bg-black/20 hover:bg-black/40 cursor-pointer transition-all duration-200 border border-zinc-800/40 hover:border-zinc-700"
                          onClick={() => navigate(`/studio/${project.id}`)}
                        >
                          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center mr-3 border border-zinc-800">
                            <Mic className="h-5 w-5 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{project.title}</h4>
                            <p className="text-xs text-zinc-400">
                              Updated {formatDate(new Date(project.updatedAt))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-black/20 rounded-xl border border-zinc-800/50">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 mb-3">
                        <Mic className="h-6 w-6 text-zinc-600" />
                      </div>
                      <h3 className="text-base font-medium">No projects yet</h3>
                      <p className="text-sm text-zinc-500 mt-2 mb-4">
                        Start creating your first studio project
                      </p>
                      <Button 
                        variant="outline" 
                        className="border-zinc-800 bg-black/30 hover:bg-zinc-800 text-white"
                        onClick={() => navigate('/enhanced-studio')}
                      >
                        Create New Project
                      </Button>
                    </div>
                  )}
                </CardContent>
                {projects && projects.length > 0 && (
                  <CardFooter className="pt-0 pb-5 px-5">
                    <Button variant="outline" size="sm" className="w-full border-zinc-800 bg-black/30 hover:bg-zinc-800" onClick={() => navigate('/enhanced-studio')}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Project
                    </Button>
                  </CardFooter>
                )}
              </Card>
              
              {/* Live Sessions */}
              <Card className="border-0 shadow-xl bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-zinc-800/70">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold">Studio Sessions</CardTitle>
                    {sessions && sessions.some((s: any) => s.isLive) && (
                      <Badge className="bg-red-500 hover:bg-red-600 px-2">LIVE</Badge>
                    )}
                  </div>
                  <CardDescription className="text-zinc-400">
                    Your scheduled recording sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  {sessionsLoading ? (
                    <div className="flex justify-center p-6">
                      <div className="relative h-10 w-10">
                        <div className="absolute inset-0 rounded-full border-2 border-zinc-700 opacity-20"></div>
                        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                      </div>
                    </div>
                  ) : sessions && sessions.length > 0 ? (
                    <div className="space-y-3">
                      {sessions.map((session: any) => (
                        <div key={session.id} className="p-3 rounded-lg bg-black/20 hover:bg-black/40 transition-all duration-200 border border-zinc-800/40 hover:border-zinc-700">
                          <div className="flex items-center">
                            <div className="mr-3">
                              <div className={`w-12 h-12 rounded-md flex items-center justify-center border border-zinc-800 ${
                                session.isLive 
                                  ? 'bg-gradient-to-br from-red-600/20 to-red-800/20' 
                                  : 'bg-gradient-to-br from-blue-600/20 to-indigo-600/20'
                              }`}>
                                <Mic className={`h-5 w-5 ${session.isLive ? 'text-red-400' : 'text-blue-400'}`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">{session.title}</h4>
                              <div className="flex items-center mt-1">
                                <p className="text-xs text-zinc-400">
                                  {formatDate(new Date(session.startTime))}
                                </p>
                                {session.isLive && (
                                  <Badge variant="default" className="ml-2 text-xs bg-red-500 hover:bg-red-600">
                                    Live Now
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-black/20 rounded-xl border border-zinc-800/50">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-zinc-600">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <h3 className="text-base font-medium">No sessions scheduled</h3>
                      <p className="text-sm text-zinc-500 mt-2 mb-4">
                        Schedule your next studio session
                      </p>
                      <Button 
                        variant="outline" 
                        className="border-zinc-800 bg-black/30 hover:bg-zinc-800 text-white"
                        onClick={() => navigate('/enhanced-studio')}
                      >
                        Schedule Session
                      </Button>
                    </div>
                  )}
                </CardContent>
                {sessions && sessions.length > 0 && (
                  <CardFooter className="pt-0 pb-5 px-5">
                    <Button variant="outline" size="sm" className="w-full border-zinc-800 bg-black/30 hover:bg-zinc-800" onClick={() => navigate('/enhanced-studio')}>
                      Manage Sessions
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </>
          ) : (
            <Card className="border-0 shadow-xl bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-zinc-800/70">
                <CardTitle className="text-xl font-bold">Elite Membership</CardTitle>
                <CardDescription className="text-zinc-400">
                  Upgrade to unlock premium features
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-900 p-6 text-white">
                    <div className="absolute top-0 right-0 p-2 bg-black/20 rounded-bl-lg text-xs font-bold">
                      CURRENT PLAN
                    </div>
                    <h3 className="font-bold text-xl mb-1">Free Tier</h3>
                    <p className="text-sm text-indigo-200">Limited access to premium features</p>
                    <div className="mt-4 mb-1">
                      <span className="text-3xl font-bold">$0</span>
                      <span className="text-indigo-200 ml-1">/month</span>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-indigo-500">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Included Features
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center text-zinc-200">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 text-emerald-500">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Access to all free tracks
                        </li>
                        <li className="flex items-center text-zinc-200">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 text-emerald-500">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Create and share playlists
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-indigo-500">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        Elite Tier Benefits
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center text-zinc-500">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 text-zinc-600">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                          Exclusive athlete content
                        </li>
                        <li className="flex items-center text-zinc-500">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 text-zinc-600">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                          High quality lossless audio
                        </li>
                        <li className="flex items-center text-zinc-500">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 text-zinc-600">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                          Priority access to new releases
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 bg-black/30">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg" onClick={() => navigate('/subscriptions')}>
                  Upgrade to Elite Tier
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
