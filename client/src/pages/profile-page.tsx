import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  User, 
  Music, 
  MessageSquare, 
  Settings, 
  CreditCard, 
  Share,
  Users,
  Bell,
  Edit3,
  Mic,
  Play,
  Heart,
  ChevronsUpDown
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/user/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/stats');
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        return null;
      }
    }
  });

  // Fetch user tracks
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['/api/user/tracks'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/tracks');
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch user tracks:', error);
        return [];
      }
    }
  });

  // Sample stats data
  const sampleStats = {
    followers: 1200000,
    plays: 3500000,
    engagement: 78,
    earnings: {
      total: 87500,
      recent: 12500,
      trend: 'up'
    },
    topTracks: [
      { id: 1, title: "Game Day Vibes", plays: 125000 },
      { id: 2, title: "Championship Flow", plays: 98000 }
    ]
  };

  // Use sample data if no actual data is available
  const displayStats = stats || sampleStats;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-b from-indigo-900/50 to-black pt-12 pb-6 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYxMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-10 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 h-28 w-28 rounded-full p-1">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user?.username} 
                  className="rounded-full h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center">
                  <User className="h-12 w-12 text-zinc-400" />
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold">{user?.username || 'Athlete Name'}</h1>
              <p className="text-zinc-400 mt-1">{user?.role === 'athlete' ? 'Professional Athlete' : 'Music Fan'}</p>
              
              <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-zinc-400" />
                  <span className="font-medium">{displayStats.followers.toLocaleString()}</span>
                  <span className="text-sm text-zinc-400 ml-1">followers</span>
                </div>
                <div className="flex items-center">
                  <Play className="h-4 w-4 mr-1 text-zinc-400" />
                  <span className="font-medium">{displayStats.plays.toLocaleString()}</span>
                  <span className="text-sm text-zinc-400 ml-1">plays</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="rounded-full border-zinc-700">
                <Share className="h-4 w-4 mr-1" /> Share
              </Button>
              <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90">
                <Edit3 className="h-4 w-4 mr-1" /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6">Athlete Dashboard</h2>
        <p className="text-zinc-400 mb-6">Manage your profile and content</p>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-zinc-900 rounded-lg p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Music className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="monetize" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <CreditCard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Monetize</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Plays</CardTitle>
                  <CardDescription>All-time track plays</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{displayStats.plays.toLocaleString()}</div>
                  <div className="text-sm text-emerald-500 mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                      <path d="m6 9 6-6 6 6"/>
                      <path d="M6 12h12"/>
                      <path d="M6 15h12"/>
                      <path d="M6 18h12"/>
                    </svg>
                    <span>+15.8% this month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Followers</CardTitle>
                  <CardDescription>Total follower count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{displayStats.followers.toLocaleString()}</div>
                  <div className="text-sm text-emerald-500 mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                      <path d="m6 9 6-6 6 6"/>
                      <path d="M6 12h12"/>
                      <path d="M6 15h12"/>
                      <path d="M6 18h12"/>
                    </svg>
                    <span>+8.3% this month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Earnings</CardTitle>
                  <CardDescription>Total revenue earned</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${displayStats.earnings.total.toLocaleString()}</div>
                  <div className="text-sm text-emerald-500 mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                      <path d="m6 9 6-6 6 6"/>
                      <path d="M6 12h12"/>
                      <path d="M6 15h12"/>
                      <path d="M6 18h12"/>
                    </svg>
                    <span>+12.4% this month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Engagement</CardTitle>
                  <CardDescription>Average engagement rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{displayStats.engagement}%</div>
                  <Progress value={displayStats.engagement} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Top Tracks</CardTitle>
                  <CardDescription>Your most played content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayStats.topTracks.map((track: any) => (
                      <div key={track.id} className="flex items-center p-2 rounded-md hover:bg-zinc-800 transition-colors">
                        <div className="h-10 w-10 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 rounded-md flex items-center justify-center mr-3">
                          <Music className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{track.title}</h4>
                          <div className="flex items-center">
                            <Play className="h-3 w-3 text-zinc-400 mr-1" />
                            <span className="text-xs text-zinc-400">{track.plays.toLocaleString()} plays</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-full p-0 h-8 w-8">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest interactions with your content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-2 rounded-md hover:bg-zinc-800 transition-colors">
                      <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                        <Heart className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm"><span className="font-medium">Sarah W.</span> liked your track <span className="font-medium">Game Day Vibes</span></p>
                        <p className="text-xs text-zinc-400 mt-1">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-2 rounded-md hover:bg-zinc-800 transition-colors">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm"><span className="font-medium">James H.</span> commented on your track <span className="font-medium">Championship Flow</span></p>
                        <p className="text-xs text-zinc-400 mt-1">5 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-2 rounded-md hover:bg-zinc-800 transition-colors">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm"><span className="font-medium">Michael B.</span> started following you</p>
                        <p className="text-xs text-zinc-400 mt-1">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Music Catalogue</CardTitle>
                  <CardDescription>Manage your tracks and uploads</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => navigate('/studio')} className="flex items-center w-full justify-between">
                    <div className="flex items-center">
                      <Mic className="mr-2 h-4 w-4" />
                      <span>Open Studio</span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 opacity-70" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Profile Verification</CardTitle>
                  <CardDescription>Get verified as a professional athlete</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-yellow-400">
                          <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Verification Pending</h3>
                        <p className="text-sm text-zinc-400 mt-1">We're reviewing your documents. This usually takes 1-2 business days.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="community" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Messaging Center</CardTitle>
                  <CardDescription>Connect with fans and other athletes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open Messages
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>View detailed engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="monetize" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Revenue Management</CardTitle>
                  <CardDescription>Monitor your earnings and payouts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    View Earnings
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Subscription Management</CardTitle>
                  <CardDescription>Manage your subscription plans</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Subscriptions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your preferences and security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 mr-3 text-zinc-400" />
                    <div>
                      <h3 className="font-medium">Notification Settings</h3>
                      <p className="text-sm text-zinc-400">Manage how you receive alerts</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-zinc-400" />
                    <div>
                      <h3 className="font-medium">Profile Settings</h3>
                      <p className="text-sm text-zinc-400">Edit your public profile</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 mr-3 text-zinc-400" />
                    <div>
                      <h3 className="font-medium">Account Security</h3>
                      <p className="text-sm text-zinc-400">Manage passwords and 2FA</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}