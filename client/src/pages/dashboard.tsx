import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import TrackList from '@/components/ui/track-list';
import UserStats from '@/components/ui/user-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Mic, Calendar, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { Track, StudioSession } from '@shared/schema';
import { defaultStats } from '@/components/ui/user-stats';
import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const [upcomingSessions, setUpcomingSessions] = useState<StudioSession[]>([]);
  
  // Fetch user's tracks
  const { data: tracks, isLoading: isLoadingTracks } = useQuery<Track[]>({
    queryKey: ['/api/tracks/artist', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/tracks/artist/${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch messages
  const { data: messages } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!user,
  });
  
  // Fetch studio sessions for athletes
  const { data: studioSessions } = useQuery({
    queryKey: ['/api/studio/sessions'],
    queryFn: async () => {
      const res = await fetch('/api/studio/sessions');
      if (!res.ok) throw new Error('Failed to fetch studio sessions');
      return res.json();
    },
    enabled: user?.role === 'athlete',
  });
  
  // Process upcoming sessions
  useEffect(() => {
    if (studioSessions) {
      const now = new Date();
      const upcoming = studioSessions
        .filter((session: StudioSession) => new Date(session.startTime) > now)
        .sort((a: StudioSession, b: StudioSession) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
        .slice(0, 3);
      setUpcomingSessions(upcoming);
    }
  }, [studioSessions]);
  
  return (
    <MainLayout 
      title="Dashboard" 
      description={`Welcome back, ${user?.fullName || user?.username}. Here's what's happening with your content.`}
    >
      {/* Stats Cards */}
      <UserStats stats={defaultStats} className="mb-8" />
      
      {/* Top Tracks */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Top Tracks</h3>
          {user?.role === 'athlete' && (
            <Link href="/uploads">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload Track
              </Button>
            </Link>
          )}
        </div>
        
        {isLoadingTracks ? (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading tracks...</p>
          </div>
        ) : (
          tracks && tracks.length > 0 ? (
            <TrackList tracks={tracks.slice(0, 5)} />
          ) : (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {user?.role === 'athlete' 
                  ? "You haven't uploaded any tracks yet." 
                  : "No tracks found. Start discovering music!"}
              </p>
              {user?.role === 'athlete' && (
                <Link href="/uploads">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Your First Track
                  </Button>
                </Link>
              )}
            </div>
          )
        )}
      </div>
      
      {/* Content Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Messages */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Messages</h3>
            <Button variant="link" size="sm">View all</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {messages && messages.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {messages.slice(0, 3).map((message: any) => (
                    <div key={message.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                              {message.senderId !== user?.id ? 'S' : 'R'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {message.senderId !== user?.id ? `Sender #${message.senderId}` : `Receiver #${message.receiverId}`}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Upcoming Studio Sessions (Athletes Only) */}
        {user?.role === 'athlete' && (
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Studio Sessions</h3>
              <Link href="/studio">
                <Button variant="link" size="sm">View calendar</Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-6">
                  {upcomingSessions && upcomingSessions.length > 0 ? (
                    upcomingSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-primary text-white p-3 rounded-lg">
                            <Mic className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <h4 className="text-base font-medium text-gray-900 dark:text-white">{session.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{session.location || 'No location specified'}</p>
                            <div className="flex items-center mt-1">
                              <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(session.startTime)}
                              </span>
                              <Clock className="h-4 w-4 text-gray-400 ml-3 mr-1" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming studio sessions</p>
                      <Link href="/studio">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule New Session
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                
                {upcomingSessions && upcomingSessions.length > 0 && (
                  <div className="mt-6 text-center">
                    <Link href="/studio">
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule New Session
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Recommended Artists (Fans Only) */}
        {user?.role === 'fan' && (
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recommended Artists</h3>
              <Link href="/discover">
                <Button variant="link" size="sm">Discover More</Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((id) => (
                    <Card key={id} className="overflow-hidden">
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold">Athlete #{id}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Hip-Hop, R&B</p>
                        <div className="mt-2 flex justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">24K monthly listeners</span>
                          <Button variant="link" size="sm" className="p-0 h-auto">Follow</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
