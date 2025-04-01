import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Music, Plus, Calendar, Users, Mic } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ProjectEditor } from '@/components/studio/project-editor';

export default function StudioPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [matchProject, paramsProject] = useRoute('/studio/:projectId');
  const [matchJoin, paramsJoin] = useRoute('/studio/join/:code');
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [joinLiveSessionCode, setJoinLiveSessionCode] = useState('');
  const [joinSessionDialogOpen, setJoinSessionDialogOpen] = useState(false);
  
  // State for tracking which project/session we're currently viewing
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [activeLiveSession, setActiveLiveSession] = useState<any | null>(null);
  
  // Fetch user's studio sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/studio/sessions'],
    queryFn: async () => {
      const response = await fetch('/api/studio/sessions');
      return response.json();
    }
  });
  
  // Fetch user's projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/studio/projects'],
    queryFn: async () => {
      const response = await fetch('/api/studio/projects');
      return response.json();
    }
  });
  
  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const res = await apiRequest('POST', '/api/studio/sessions', sessionData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Session Created',
        description: 'Your studio session has been created successfully',
      });
      setCreateSessionOpen(false);
      setNewSessionTitle('');
      setNewSessionDescription('');
      queryClient.invalidateQueries({ queryKey: ['/api/studio/sessions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Create new project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const res = await apiRequest('POST', '/api/studio/projects', projectData);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Project Created',
        description: 'Your project has been created successfully',
      });
      setCreateProjectOpen(false);
      setNewProjectTitle('');
      queryClient.invalidateQueries({ queryKey: ['/api/studio/projects'] });
      
      // Navigate to the new project
      setLocation(`/studio/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Start live session mutation
  const startLiveSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiRequest('POST', `/api/studio/sessions/${sessionId}/start-live`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Live Session Started',
        description: `Session code: ${data.sessionCode}`,
      });
      setActiveLiveSession(data);
      queryClient.invalidateQueries({ queryKey: ['/api/studio/sessions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Start Live Session',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // End live session mutation
  const endLiveSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiRequest('POST', `/api/studio/sessions/${sessionId}/end-live`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Live Session Ended',
        description: 'Your live session has been ended',
      });
      setActiveLiveSession(null);
      queryClient.invalidateQueries({ queryKey: ['/api/studio/sessions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to End Live Session',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Join live session by code
  const joinLiveSessionMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest('GET', `/api/studio/join/${code}`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Joined Live Session',
        description: `You've joined ${data.title}`,
      });
      setActiveLiveSession(data);
      setJoinSessionDialogOpen(false);
      
      // Find a project in this session to load
      queryClient.fetchQuery({
        queryKey: [`/api/studio/sessions/${data.id}/projects`],
        queryFn: async () => {
          const response = await fetch(`/api/studio/sessions/${data.id}/projects`);
          return response.json();
        }
      }).then((sessionProjects) => {
        if (sessionProjects && sessionProjects.length > 0) {
          // Load the first project
          setActiveProjectId(sessionProjects[0].id);
        }
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Join Session',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handle creation of a new session
  const handleCreateSession = () => {
    if (!newSessionTitle) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title for your session',
        variant: 'destructive',
      });
      return;
    }
    
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    createSessionMutation.mutate({
      title: newSessionTitle,
      description: newSessionDescription,
      startTime: now.toISOString(),
      endTime: oneHourLater.toISOString(),
      isLive: false
    });
  };
  
  // Handle creation of a new project
  const handleCreateProject = () => {
    if (!newProjectTitle) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title for your project',
        variant: 'destructive',
      });
      return;
    }
    
    createProjectMutation.mutate({
      title: newProjectTitle,
      sessionId: null,
      status: 'active'
    });
  };
  
  // Handle joining a live session
  const handleJoinLiveSession = () => {
    if (!joinLiveSessionCode) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a session code',
        variant: 'destructive',
      });
      return;
    }
    
    joinLiveSessionMutation.mutate(joinLiveSessionCode.toUpperCase());
  };
  
  // Check if we're requesting a specific project or joining a session via URL
  useEffect(() => {
    if (matchProject && paramsProject && paramsProject.projectId) {
      setActiveProjectId(parseInt(paramsProject.projectId));
    } else if (matchJoin && paramsJoin && paramsJoin.code) {
      joinLiveSessionMutation.mutate(paramsJoin.code.toUpperCase());
    }
  }, [matchProject, matchJoin, paramsProject, paramsJoin]);
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  // If the user is not authenticated or not an athlete, show a message
  if (!user || user.role !== 'athlete') {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only verified athletes can access the studio. Please complete the verification process to continue.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation('/athlete-verification')}>
              Go to Verification
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If a project is active, show the project editor
  if (activeProjectId) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <ProjectEditor
          projectId={activeProjectId}
          sessionId={activeLiveSession?.id}
          sessionCode={activeLiveSession?.sessionCode}
          isLiveSession={!!activeLiveSession}
        />
        <Button
          variant="outline"
          className="absolute top-20 left-4"
          onClick={() => {
            setActiveProjectId(null);
            setLocation('/studio');
          }}
        >
          Back to Studio
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Studio</h1>
        <div className="flex gap-2">
          <Dialog open={joinSessionDialogOpen} onOpenChange={setJoinSessionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Join Live Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Live Session</DialogTitle>
                <DialogDescription>
                  Enter the session code provided by the session host
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sessionCode" className="text-right">
                    Code
                  </Label>
                  <Input
                    id="sessionCode"
                    value={joinLiveSessionCode}
                    onChange={(e) => setJoinLiveSessionCode(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter session code (e.g. AB12CD)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleJoinLiveSession}>Join Session</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Studio Session</DialogTitle>
                <DialogDescription>
                  Studio sessions help you organize your recording time and collaborations
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="Session title"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={newSessionDescription}
                    onChange={(e) => setNewSessionDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateSession}>Create Session</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
            <DialogTrigger asChild>
              <Button>
                <Music className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Studio Project</DialogTitle>
                <DialogDescription>
                  Create a new audio project to start recording, mixing and mastering
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectTitle" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="projectTitle"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="Project title"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="projects">
        <TabsList className="mb-4">
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="sessions">Recording Sessions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects">
          {projectsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="flex flex-col justify-center items-center h-64 cursor-pointer hover:border-primary transition-colors" onClick={() => setCreateProjectOpen(true)}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Create New Project</h3>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Start a new audio project for recording and mastering
                  </p>
                </CardContent>
              </Card>
              
              {projects && projects.map((project: any) => (
                <Card key={project.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                  setActiveProjectId(project.id);
                  setLocation(`/studio/${project.id}`);
                }}>
                  <CardHeader>
                    <CardTitle>{project.title}</CardTitle>
                    <CardDescription>
                      Last updated: {formatDate(project.updatedAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Music className="h-4 w-4" />
                      <span>Project ID: {project.id}</span>
                    </div>
                    {project.status && (
                      <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {project.status}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button variant="ghost" className="w-full" onClick={(e) => {
                      e.stopPropagation();
                      setActiveProjectId(project.id);
                      setLocation(`/studio/${project.id}`);
                    }}>
                      Open Project
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sessions">
          {sessionsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="flex flex-col justify-center items-center h-64 cursor-pointer hover:border-primary transition-colors" onClick={() => setCreateSessionOpen(true)}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Create New Session</h3>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Schedule a recording session or collaboration
                  </p>
                </CardContent>
              </Card>
              
              {sessions && sessions.map((session: any) => (
                <Card key={session.id} className={session.isLive ? 'border-green-500' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{session.title}</CardTitle>
                      {session.isLive && (
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-green-500">LIVE</span>
                        </div>
                      )}
                    </div>
                    <CardDescription>
                      {formatDate(session.startTime)} - {formatDate(session.endTime)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mb-4">{session.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mic className="h-4 w-4" />
                      <span>Session ID: {session.id}</span>
                    </div>
                    {session.sessionCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium">Code:</span>
                        <code className="px-2 py-1 rounded bg-muted text-sm">{session.sessionCode}</code>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex flex-col gap-2">
                    {session.isLive ? (
                      <>
                        <Button variant="default" className="w-full" onClick={() => {
                          setActiveLiveSession(session);
                          
                          // Try to find a project to load
                          queryClient.fetchQuery({
                            queryKey: [`/api/studio/sessions/${session.id}/projects`],
                            queryFn: async () => {
                              const response = await fetch(`/api/studio/sessions/${session.id}/projects`);
                              return response.json();
                            }
                          }).then((projects) => {
                            if (projects && projects.length > 0) {
                              setActiveProjectId(projects[0].id);
                            } else {
                              // If no projects, create one
                              createProjectMutation.mutate({
                                title: `${session.title} Project`,
                                sessionId: session.id,
                                status: 'active'
                              });
                            }
                          });
                        }}>
                          Join Live Session
                        </Button>
                        <Button variant="destructive" className="w-full" onClick={() => endLiveSessionMutation.mutate(session.id)}>
                          End Live Session
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={() => startLiveSessionMutation.mutate(session.id)}>
                        Start Live Session
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}