import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CheckCircle, XCircle, Eye, UserCheck, Shield, Clock } from 'lucide-react';

// Types for verification data
interface VerificationDoc {
  id: number;
  userId: number;
  documentType: string;
  documentUrl: string;
  status: string;
  createdAt: string;
  notes?: string;
}

interface VerificationUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  verificationStatus: string;
  league?: string;
  team?: string;
}

interface VerificationRequest {
  user: VerificationUser;
  documents: VerificationDoc[];
}

export default function VerificationsAdmin() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isDocViewDialogOpen, setIsDocViewDialogOpen] = useState(false);
  
  // Fetch pending verifications
  const { data: verifications, isLoading } = useQuery<VerificationRequest[]>({
    queryKey: ['/api/verification/pending'],
    queryFn: async () => {
      const res = await fetch('/api/verification/pending');
      if (!res.ok) throw new Error('Failed to fetch pending verifications');
      return res.json();
    },
  });
  
  // Update verification status mutation
  const updateVerificationMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      const res = await apiRequest('POST', '/api/verify-athlete', { userId, status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Verification Updated',
        description: 'The athlete verification status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/verification/pending'] });
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
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
    if (!selectedRequest) return;
    updateVerificationMutation.mutate({ userId: selectedRequest.user.id, status: 'approved' });
  };
  
  const handleReject = () => {
    if (!selectedRequest) return;
    updateVerificationMutation.mutate({ userId: selectedRequest.user.id, status: 'rejected' });
  };
  
  const openReviewDialog = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setIsReviewDialogOpen(true);
  };
  
  const viewDocument = (docUrl: string) => {
    setViewingDocUrl(docUrl);
    setIsDocViewDialogOpen(true);
  };
  
  // Format document type for display
  const formatDocumentType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <MainLayout 
      title="Athlete Verifications" 
      description="Review and manage athlete verification requests"
    >
      <div className="mb-8 flex items-center justify-between">
        <Badge variant="outline" className="px-3 py-1 text-base">
          <Clock className="h-4 w-4 mr-2" />
          {isLoading ? 'Loading...' : (verifications ? `${verifications.length} Pending` : '0 Pending')}
        </Badge>
        
        <div className="flex gap-4">
          <Button variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Verification Guidelines
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="pending">
        <TabsList className="mb-8">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : verifications && verifications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {verifications.map((request) => (
                <Card key={request.user.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{request.user.fullName}</CardTitle>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <CardDescription>
                      @{request.user.username} • {request.user.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">League/Association</p>
                        <p className="font-medium">{request.user.league || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team</p>
                        <p className="font-medium">{request.user.team || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Verification Documents</p>
                      <div className="space-y-2">
                        {request.documents.map((doc) => (
                          <div 
                            key={doc.id} 
                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => viewDocument(doc.documentUrl)}
                          >
                            <div className="flex items-center">
                              <div className="bg-primary/10 p-2 rounded mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                              </div>
                              <span className="text-sm">{formatDocumentType(doc.documentType)}</span>
                            </div>
                            <Eye className="h-4 w-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => openReviewDialog(request)}
                    >
                      Review Application
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 flex flex-col items-center justify-center">
                <UserCheck className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-center">No Pending Verifications</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
                  All athlete verification requests have been processed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="approved">
          <Card>
            <CardContent className="py-10 flex flex-col items-center justify-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-center">Approved Verifications</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
                This section will show approved athlete verifications.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rejected">
          <Card>
            <CardContent className="py-10 flex flex-col items-center justify-center">
              <XCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-center">Rejected Verifications</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
                This section will show rejected athlete verifications.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Review Dialog */}
      {selectedRequest && (
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Verification Request</DialogTitle>
              <DialogDescription>
                Review the athlete's verification information and documents.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Athlete</h4>
                  <p className="font-medium">{selectedRequest.user.fullName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</h4>
                  <p className="font-medium">@{selectedRequest.user.username}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">League</h4>
                  <p className="font-medium">{selectedRequest.user.league || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Team</h4>
                  <p className="font-medium">{selectedRequest.user.team || 'Not specified'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Submitted Documents</h4>
                <div className="space-y-2">
                  {selectedRequest.documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => viewDocument(doc.documentUrl)}
                    >
                      <span className="text-sm">{formatDocumentType(doc.documentType)}</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter className="pt-4 flex justify-between">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={updateVerificationMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={updateVerificationMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Document Viewer Dialog */}
      <Dialog open={isDocViewDialogOpen} onOpenChange={setIsDocViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verification Document</DialogTitle>
          </DialogHeader>
          
          <div className="h-[500px] bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
            {viewingDocUrl && (
              <iframe 
                src={viewingDocUrl} 
                className="w-full h-full rounded"
                title="Verification Document"
              />
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsDocViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
