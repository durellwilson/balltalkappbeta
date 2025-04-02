import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, CloudOff, RefreshCw, Check, X, Clock, CloudLightning } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistance } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

interface ProjectSyncProps {
  projectId: number;
}

export function ProjectSync({ projectId }: ProjectSyncProps) {
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get sync status
  const { data: syncStatus, isLoading, error } = useQuery({
    queryKey: ['/api/studio/projects', projectId, 'sync'],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/studio/projects/${projectId}/sync`);
      } catch (error) {
        // If no sync exists yet, return null (this is not an error)
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    refetchInterval: isSyncing ? 2000 : false // Poll every 2 seconds while syncing
  });

  // Mutation to start a sync
  const mutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/studio/projects/${projectId}/sync`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Sync started',
        description: 'Your project is being synced to the cloud.',
      });
      setIsSyncing(true);
      setSyncProgress(10);
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/studio/projects', projectId, 'sync'] });
    },
    onError: (error) => {
      toast({
        title: 'Sync failed',
        description: 'Failed to start project sync. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Check if we need to animate progress
  useEffect(() => {
    if (!syncStatus) return;

    if (syncStatus.status === 'syncing') {
      setIsSyncing(true);
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          // Increment progress but don't reach 100% until sync is complete
          const newProgress = Math.min(prev + 5, 95);
          return newProgress;
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else if (syncStatus.status === 'synced') {
      setIsSyncing(false);
      setSyncProgress(100);
    } else {
      setIsSyncing(false);
    }
  }, [syncStatus]);

  // Handle sync button click
  const handleSync = () => {
    mutation.mutate();
  };

  // Get status badge
  const getStatusBadge = () => {
    if (!syncStatus) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">Never synced</Badge>;
    }

    switch (syncStatus.status) {
      case 'syncing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-500">Syncing</Badge>;
      case 'synced':
        return <Badge variant="outline" className="bg-green-100 text-green-500">Synced</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-500">Pending</Badge>;
    }
  };

  // Format last synced time
  const getLastSyncedTime = () => {
    if (!syncStatus || !syncStatus.syncedAt) return 'Never';
    
    return formatDistance(new Date(syncStatus.syncedAt), new Date(), { addSuffix: true });
  };

  // Get sync version
  const getSyncVersion = () => {
    if (!syncStatus || !syncStatus.version) return '0';
    return syncStatus.version.toString();
  };

  // Get icon based on status
  const getIcon = () => {
    if (!syncStatus) return <CloudOff className="h-5 w-5 text-gray-400" />;

    switch (syncStatus.status) {
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'synced':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <X className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <CloudOff className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Cloud Sync
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Back up your project to the cloud for safe keeping and access from any device.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        {isSyncing && (
          <div className="mb-4">
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Last synced:</span>
            <span className="font-medium flex items-center gap-1">
              {getIcon()} {getLastSyncedTime()}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Version:</span>
            <span className="font-medium">{getSyncVersion()}</span>
          </div>
          
          {syncStatus?.cloudUrl && (
            <div className="flex justify-between">
              <span className="text-gray-500">Location:</span>
              <span className="font-medium text-xs truncate max-w-[200px]">
                {syncStatus.cloudUrl}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSync} 
          disabled={isSyncing || mutation.isPending}
          className="w-full"
          variant={!syncStatus || syncStatus.status === 'failed' ? "default" : "outline"}
        >
          {isSyncing || mutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              {syncStatus?.status === 'synced' ? (
                <>
                  <CloudLightning className="mr-2 h-4 w-4" />
                  Sync Again
                </>
              ) : (
                <>
                  <Cloud className="mr-2 h-4 w-4" />
                  {!syncStatus ? 'Sync Now' : 'Retry Sync'}
                </>
              )}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}