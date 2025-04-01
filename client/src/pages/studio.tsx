import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { StudioSession } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Mic2, Calendar, Clock, Trash2, Edit } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';

// Form schema for studio session
const studioSessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Start time is required and must be a valid date',
  }),
  endTime: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'End time is required and must be a valid date',
  }),
  collaborators: z.string().optional(),
}).refine(data => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

type StudioSessionForm = z.infer<typeof studioSessionSchema>;

export default function Studio() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSession, setCurrentSession] = useState<StudioSession | null>(null);
  const { toast } = useToast();
  
  // Fetch studio sessions
  const { data: sessions, isLoading } = useQuery<StudioSession[]>({
    queryKey: ['/api/studio/sessions'],
    queryFn: async () => {
      const res = await fetch('/api/studio/sessions');
      if (!res.ok) throw new Error('Failed to fetch studio sessions');
      return res.json();
    },
  });
  
  // Form definition
  const form = useForm<StudioSessionForm>({
    resolver: zodResolver(studioSessionSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      startTime: '',
      endTime: '',
      collaborators: '',
    },
  });
  
  // Update form values when editing a session
  useEffect(() => {
    if (currentSession && isEditing) {
      const startTime = new Date(currentSession.startTime);
      const endTime = new Date(currentSession.endTime);
      
      // Format date-time for datetime-local input
      const formatDateForInput = (date: Date) => {
        return date.toISOString().slice(0, 16);  // Format as "YYYY-MM-DDThh:mm"
      };
      
      form.reset({
        title: currentSession.title,
        description: currentSession.description || '',
        location: currentSession.location || '',
        startTime: formatDateForInput(startTime),
        endTime: formatDateForInput(endTime),
        collaborators: currentSession.collaborators || '',
      });
    }
  }, [currentSession, isEditing, form]);
  
  // Create studio session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: StudioSessionForm) => {
      const res = await apiRequest('POST', '/api/studio/sessions', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/sessions'] });
      toast({
        title: 'Success',
        description: 'Studio session created successfully',
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create session: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update studio session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (data: StudioSessionForm & { id: number }) => {
      const { id, ...sessionData } = data;
      const res = await apiRequest('POST', `/api/studio/sessions/${id}/update`, sessionData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/sessions'] });
      toast({
        title: 'Success',
        description: 'Studio session updated successfully',
      });
      setIsDialogOpen(false);
      setIsEditing(false);
      setCurrentSession(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update session: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Delete studio session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/studio/sessions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/sessions'] });
      toast({
        title: 'Success',
        description: 'Studio session deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete session: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: StudioSessionForm) => {
    if (isEditing && currentSession) {
      updateSessionMutation.mutate({ ...data, id: currentSession.id });
    } else {
      createSessionMutation.mutate(data);
    }
  };
  
  const openCreateDialog = () => {
    setIsEditing(false);
    setCurrentSession(null);
    form.reset({
      title: '',
      description: '',
      location: '',
      startTime: '',
      endTime: '',
      collaborators: '',
    });
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (session: StudioSession) => {
    setIsEditing(true);
    setCurrentSession(session);
    setIsDialogOpen(true);
  };
  
  // Group sessions by date
  const groupedSessions = sessions?.reduce((acc, session) => {
    const date = new Date(session.startTime).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, StudioSession[]>);
  
  return (
    <MainLayout 
      title="Studio" 
      description="Manage your recording sessions and creative workspace"
    >
      <div className="mb-6 flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Studio Session
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="space-y-8">
          {groupedSessions && Object.entries(groupedSessions)
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, dateSessions]) => (
              <div key={date} className="space-y-4">
                <h3 className="text-xl font-bold">{formatDate(date)}</h3>
                <div className="grid gap-4">
                  {dateSessions
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map(session => (
                      <Card key={session.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row md:items-center">
                            <div className="bg-primary/10 p-6 md:w-56 flex justify-center items-center">
                              <div className="text-center">
                                <Mic2 className="h-12 w-12 mx-auto text-primary" />
                                <p className="mt-2 font-medium text-gray-700 dark:text-gray-300">
                                  {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                  {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="p-6 flex-1">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                  <h3 className="text-lg font-bold">{session.title}</h3>
                                  {session.location && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                      <span className="inline-block mr-1">📍</span> {session.location}
                                    </p>
                                  )}
                                </div>
                                <div className="flex space-x-2 mt-4 md:mt-0">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openEditDialog(session)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => deleteSessionMutation.mutate(session.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                              {session.description && (
                                <p className="mt-4 text-gray-700 dark:text-gray-300">{session.description}</p>
                              )}
                              {session.collaborators && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">Collaborators:</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{session.collaborators}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <Mic2 className="mx-auto h-12 w-12 text-primary/60" />
            <CardTitle className="mt-4">No Studio Sessions Scheduled</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Schedule your first studio session to start creating music
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Studio Session
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Create/Edit Session Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Studio Session' : 'Create New Studio Session'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update your studio session details below.' 
                : 'Fill in the details to schedule a new studio session.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Beat Making Session" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time*</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time*</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Home Studio, Studio A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add details about the session" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="collaborators"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collaborators</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Producer Jay, Audio Engineer Marcus" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSessionMutation.isPending || updateSessionMutation.isPending}
                >
                  {createSessionMutation.isPending || updateSessionMutation.isPending
                    ? 'Saving...'
                    : isEditing ? 'Update Session' : 'Create Session'
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
