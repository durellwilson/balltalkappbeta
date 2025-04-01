import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Track } from '@shared/schema';
import { Search, AlertTriangle, CheckCircle, XCircle, Flag, Play, Music, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// Mock data interfaces
interface ReportedContent {
  id: number;
  contentType: 'track' | 'message' | 'comment';
  contentId: number;
  reporterId: number;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  content: {
    id: number;
    title?: string;
    artist?: string;
    audioUrl?: string;
    text?: string;
  };
}

export default function ContentModeration() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState<ReportedContent | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  
  // Fetch reported content
  const { data: reportedContent, isLoading } = useQuery<ReportedContent[]>({
    queryKey: ['/api/moderation/reported-content'],
    queryFn: async () => {
      // Mock data - in a real app this would be fetched from API
      return [
        {
          id: 1,
          contentType: 'track',
          contentId: 101,
          reporterId: 5,
          reason: 'Inappropriate content',
          status: 'pending',
          createdAt: new Date().toISOString(),
          content: {
            id: 101,
            title: 'Explicit Track',
            artist: 'Athlete #1',
            audioUrl: '/uploads/audio/sample.mp3',
          }
        },
        {
          id: 2,
          contentType: 'message',
          contentId: 201,
          reporterId: 8,
          reason: 'Harassing message',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          content: {
            id: 201,
            text: 'This is a reported message content that was flagged as inappropriate by a user.',
          }
        },
        {
          id: 3,
          contentType: 'comment',
          contentId: 301,
          reporterId: 12,
          reason: 'Spam content',
          status: 'pending',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          content: {
            id: 301,
            text: 'This is a reported comment that was flagged as spam by multiple users.',
          }
        }
      ] as ReportedContent[];
    },
  });
  
  // Fetch all tracks for content review
  const { data: allTracks } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    queryFn: async () => {
      const res = await fetch('/api/tracks');
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
  });
  
  // Update content status mutation
  const updateContentStatusMutation = useMutation({
    mutationFn: async ({ contentId, contentType, action }: { contentId: number; contentType: string; action: 'approve' | 'reject' }) => {
      // In a real app, this would call an API endpoint
      // return apiRequest('POST', '/api/moderation/update-status', { contentId, contentType, action });
      
      // Mock successful response
      return new Promise(resolve => setTimeout(() => resolve({}), 1000));
    },
    onSuccess: () => {
      toast({
        title: 'Content Status Updated',
        description: 'The content moderation status has been updated successfully.',
      });
      // In a real app, invalidate queries to refresh the data
      // queryClient.invalidateQueries({ queryKey: ['/api/moderation/reported-content'] });
      setIsReviewDialogOpen(false);
      setSelectedContent(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleApprove = () => {
    if (!selectedContent) return;
    updateContentStatusMutation.mutate({ 
      contentId: selectedContent.contentId, 
      contentType: selectedContent.contentType,
      action: 'approve'
    });
  };
  
  const handleReject = () => {
    if (!selectedContent) return;
    updateContentStatusMutation.mutate({ 
      contentId: selectedContent.contentId, 
      contentType: selectedContent.contentType,
      action: 'reject'
    });
  };
  
  const openReviewDialog = (content: ReportedContent) => {
    setSelectedContent(content);
    setIsReviewDialogOpen(true);
  };
  
  // Filter reported content by search query
  const filteredContent = reportedContent?.filter(item => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    if (item.contentType === 'track' && item.content.title) {
      return item.content.title.toLowerCase().includes(searchLower);
    }
    
    if ((item.contentType === 'message' || item.contentType === 'comment') && item.content.text) {
      return item.content.text.toLowerCase().includes(searchLower);
    }
    
    return false;
  });
  
  // Format content type for display
  const formatContentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  return (
    <MainLayout 
      title="Content Moderation" 
      description="Review and moderate user-generated content"
    >
      <div className="mb-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1 text-base">
            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
            {isLoading ? 'Loading...' : (reportedContent ? `${reportedContent.length} Reports` : '0 Reports')}
          </Badge>
          
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search reported content"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter Options
        </Button>
      </div>
      
      <Tabs defaultValue="reported">
        <TabsList className="mb-8">
          <TabsTrigger value="reported">Reported Content</TabsTrigger>
          <TabsTrigger value="tracks">All Tracks</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reported">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredContent && filteredContent.length > 0 ? (
            <div className="space-y-6">
              {filteredContent.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                          {formatContentType(item.contentType)}
                        </Badge>
                        <CardTitle className="text-lg">
                          {item.contentType === 'track' ? item.content.title : `Reported ${formatContentType(item.contentType)}`}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary">Pending Review</Badge>
                    </div>
                    <CardDescription>
                      Reported {formatDate(item.createdAt)} • Reason: {item.reason}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {item.contentType === 'track' ? (
                      <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                        <div className="flex-shrink-0 h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Music className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">{item.content.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.content.artist}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="ml-auto">
                          <Play className="h-5 w-5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {item.content.text}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => openReviewDialog(item)}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Review Content
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 flex flex-col items-center justify-center">
                <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-center">No Reported Content</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
                  There is no reported content to review at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="tracks">
          {allTracks && allTracks.length > 0 ? (
            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Artist</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Genre</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Release Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {allTracks.map((track) => (
                      <tr key={track.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              {track.coverArt ? (
                                <img className="h-10 w-10 rounded object-cover" src={track.coverArt} alt={track.title} />
                              ) : (
                                <Music className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{track.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          Artist #{track.artistId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {track.genre.replace('-', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(track.releaseDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${track.isPublished 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'}`}>
                            {track.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="ghost" size="sm">Review</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 flex flex-col items-center justify-center">
                <Music className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-center">No Tracks Found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
                  There are no tracks available for review.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="messages">
          <Card>
            <CardContent className="py-10 flex flex-col items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-center">Messages Moderation</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
                This section will display messages that require moderation.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Review Dialog */}
      {selectedContent && (
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Reported Content</DialogTitle>
              <DialogDescription>
                Review the reported content and take appropriate action.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Content Type</h4>
                <p className="font-medium">{formatContentType(selectedContent.contentType)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Report Reason</h4>
                <p className="font-medium">{selectedContent.reason}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Content</h4>
                {selectedContent.contentType === 'track' ? (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                    <div className="flex items-center">
                      <Music className="h-8 w-8 mr-2 text-primary" />
                      <div>
                        <p className="font-medium">{selectedContent.content.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedContent.content.artist}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Play Track
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                    <p className="text-sm">{selectedContent.content.text}</p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="pt-4 flex justify-between">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={updateContentStatusMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Remove Content
              </Button>
              <Button
                onClick={handleApprove}
                disabled={updateContentStatusMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Content
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
}
