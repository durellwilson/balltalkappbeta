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
  CreditCard 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isAthlete = user?.role === 'athlete';
  
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome, {user?.username || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening on Athlete Sound
          </p>
        </div>
        
        {isAthlete && (
          <div className="flex gap-2">
            <Button onClick={() => navigate('/uploads')}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Track
            </Button>
            <Button variant="outline" onClick={() => navigate('/studio')}>
              <Mic className="mr-2 h-4 w-4" />
              Studio
            </Button>
          </div>
        )}
      </div>
      
      {/* Quick access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/discover')}>
          <CardContent className="p-6">
            <Music className="h-8 w-8 mb-4" />
            <h3 className="font-bold text-xl">Discover</h3>
            <p className="text-blue-100 text-sm mt-1">Find new music from athletes</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/library')}>
          <CardContent className="p-6">
            <Headphones className="h-8 w-8 mb-4" />
            <h3 className="font-bold text-xl">Library</h3>
            <p className="text-purple-100 text-sm mt-1">Your saved tracks and playlists</p>
          </CardContent>
        </Card>
        
        {isAthlete && (
          <Card className="bg-gradient-to-br from-amber-500 to-red-600 text-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/earnings')}>
            <CardContent className="p-6">
              <CreditCard className="h-8 w-8 mb-4" />
              <h3 className="font-bold text-xl">Earnings</h3>
              <p className="text-amber-100 text-sm mt-1">Track your revenue and stats</p>
            </CardContent>
          </Card>
        )}
        
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/subscriptions')}>
          <CardContent className="p-6">
            <BarChart className="h-8 w-8 mb-4" />
            <h3 className="font-bold text-xl">Subscriptions</h3>
            <p className="text-green-100 text-sm mt-1">Manage your subscription plan</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Content section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent releases */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Releases</CardTitle>
            <CardDescription>
              The latest tracks from athletes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tracksLoading ? (
              <div className="flex justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentTracks && recentTracks.length > 0 ? (
              <div className="space-y-4">
                {recentTracks.map((track: any) => (
                  <div key={track.id} className="flex items-center space-x-4 p-2 rounded-md hover:bg-accent transition-colors group">
                    {track.coverArt ? (
                      <img src={track.coverArt} alt={track.title} className="h-16 w-16 rounded-md object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                        <Music className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{track.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artistName || 'Unknown Artist'}
                      </p>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="text-xs">
                          {track.genre || 'Other'}
                        </Badge>
                        {track.releaseDate && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatDate(new Date(track.releaseDate))}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                      <Play className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <Music className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>No tracks available yet</p>
                <p className="text-sm mt-1">Check back soon for new releases</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/discover')}>
              View All Tracks
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* Athlete dashboard or subscription info */}
        <div className="space-y-6">
          {isAthlete ? (
            <>
              {/* Studio Projects */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Studio Projects</CardTitle>
                  <CardDescription>
                    Continue where you left off
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {projectsLoading ? (
                    <div className="flex justify-center p-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : projects && projects.length > 0 ? (
                    <div className="space-y-3">
                      {projects.map((project: any) => (
                        <div 
                          key={project.id} 
                          className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => navigate(`/studio/${project.id}`)}
                        >
                          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                            <Mic className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{project.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              Last updated: {formatDate(new Date(project.updatedAt))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      <p className="text-sm">No projects yet</p>
                      <Button 
                        variant="link" 
                        className="mt-1 text-sm text-primary"
                        onClick={() => navigate('/studio')}
                      >
                        Create your first project
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/studio')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Live Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Studio Sessions</CardTitle>
                  <CardDescription>
                    Your scheduled recording sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="flex justify-center p-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : sessions && sessions.length > 0 ? (
                    <div className="space-y-3">
                      {sessions.map((session: any) => (
                        <div key={session.id} className="p-2 rounded-md hover:bg-accent transition-colors">
                          <div className="flex items-center">
                            <div className="mr-3">
                              <div className="w-10 h-10 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <Mic className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{session.title}</h4>
                              <div className="flex items-center">
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(new Date(session.startTime))}
                                </p>
                                {session.isLive && (
                                  <Badge variant="default" className="ml-2 text-xs">
                                    Live
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      <p className="text-sm">No sessions scheduled</p>
                      <Button 
                        variant="link" 
                        className="mt-1 text-sm text-primary"
                        onClick={() => navigate('/studio')}
                      >
                        Schedule a session
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/studio')}>
                    Manage Sessions
                  </Button>
                </CardFooter>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Subscription</CardTitle>
                <CardDescription>
                  Current plan and benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
                    <h3 className="font-bold text-lg">Free Plan</h3>
                    <p className="text-sm opacity-90">Upgrade for premium features</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">What you get:</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                        Access to all free tracks
                      </li>
                      <li className="flex items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                        Create playlists
                      </li>
                      <li className="flex items-center opacity-50">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-2"></span>
                        Ad-free listening (Premium)
                      </li>
                      <li className="flex items-center opacity-50">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-2"></span>
                        Access to exclusive content (Premium)
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => navigate('/subscriptions')}>
                  Upgrade to Premium
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
