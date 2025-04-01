import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, CheckCircle, Clock, XCircle, Upload } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

// Form schema
const verificationSchema = z.object({
  documentType: z.string().min(1, 'Please select a document type'),
  league: z.string().min(1, 'League is required'),
  team: z.string().min(1, 'Team is required'),
  additionalInfo: z.string().optional(),
});

type VerificationForm = z.infer<typeof verificationSchema>;

export default function AthleteVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Fetch verification status
  const { data: verificationData, isLoading } = useQuery({
    queryKey: ['/api/verification/status'],
    queryFn: async () => {
      const res = await fetch('/api/verification/status');
      if (!res.ok) throw new Error('Failed to fetch verification status');
      return res.json();
    },
  });
  
  // Form definition
  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      documentType: '',
      league: user?.league || '',
      team: user?.team || '',
      additionalInfo: '',
    },
  });
  
  // Submit verification mutation
  const verificationMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        body: data,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit verification');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Verification submitted',
        description: 'Your verification documents have been submitted successfully. We will review them shortly.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/verification/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      form.reset();
      setUploadedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: VerificationForm) => {
    if (!uploadedFile) {
      toast({
        title: 'Document required',
        description: 'Please upload a verification document',
        variant: 'destructive',
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('documentType', data.documentType);
    formData.append('document', uploadedFile);
    formData.append('league', data.league);
    formData.append('team', data.team);
    
    if (data.additionalInfo) {
      formData.append('additionalInfo', data.additionalInfo);
    }
    
    verificationMutation.mutate(formData);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };
  
  // Status components based on verification status
  const renderVerificationStatus = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (!verificationData) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Unable to fetch verification status. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    switch (verificationData.status) {
      case 'approved':
        return (
          <Card className="border-green-500">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <CardTitle>Verification Approved</CardTitle>
              </div>
              <CardDescription>
                Your athlete status has been verified. You now have full access to all athlete features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-800 dark:text-green-300">
                  Congratulations! You're now a verified athlete on our platform. You can access all athlete features including the studio, uploads, and earnings.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'pending':
        return (
          <Card className="border-yellow-500">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-yellow-500" />
                <CardTitle>Verification Pending</CardTitle>
              </div>
              <CardDescription>
                Your verification is being reviewed by our team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300">
                  We've received your verification request and are currently reviewing your documents. This process typically takes 1-2 business days. We'll notify you when your verification is complete.
                </p>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Submitted Documents</h3>
                <ul className="space-y-2">
                  {verificationData.documents && verificationData.documents.map((doc: any) => (
                    <li key={doc.id} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span>{doc.documentType} - {new Date(doc.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'rejected':
        return (
          <Card className="border-red-500">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <XCircle className="h-8 w-8 text-red-500" />
                <CardTitle>Verification Rejected</CardTitle>
              </div>
              <CardDescription>
                Your verification request was not approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
                <p className="text-red-800 dark:text-red-300">
                  Unfortunately, we couldn't verify your athlete status with the documents provided. Please submit a new verification request with clearer or more appropriate documentation.
                </p>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Submit New Verification</h3>
                {renderVerificationForm()}
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return renderVerificationForm();
    }
  };
  
  // Verification form
  const renderVerificationForm = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <CardTitle>Athlete Verification</CardTitle>
          </div>
          <CardDescription>
            Submit your information to get verified as a professional athlete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="league"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>League/Association*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. NBA, NFL, MLB" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="team"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team*</FormLabel>
                      <FormControl>
                        <Input placeholder="Your current or most recent team" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="player_id">Player ID Card</SelectItem>
                        <SelectItem value="contract">Team Contract</SelectItem>
                        <SelectItem value="league_id">League ID</SelectItem>
                        <SelectItem value="press_pass">Press/Media Pass</SelectItem>
                        <SelectItem value="other_document">Other Official Document</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border-2 border-dashed rounded-lg p-6">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="mb-2 text-sm font-medium">Upload Verification Document*</p>
                  <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">PDF, JPG or PNG up to 10MB</p>
                  
                  <Input
                    type="file"
                    id="document"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('document')?.click()}
                  >
                    Browse Files
                  </Button>
                  
                  {uploadedFile && (
                    <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded w-full">
                      <p className="text-sm truncate">{uploadedFile.name}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional details that might help with verification" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Verification typically takes 1-2 business days. You'll receive an email notification when your status is updated.
                </p>
              </div>
              
              <CardFooter className="px-0 pt-4">
                <Button
                  type="submit"
                  disabled={verificationMutation.isPending}
                  className="w-full"
                >
                  {verificationMutation.isPending ? 'Submitting...' : 'Submit Verification'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <MainLayout 
      title="Athlete Verification" 
      description="Get verified as a professional athlete to access creator features"
    >
      {renderVerificationStatus()}
    </MainLayout>
  );
}
