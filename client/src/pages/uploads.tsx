import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import MusicUploader from '@/components/ui/music-uploader';
import TrackList from '@/components/ui/track-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Track } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Plus, Music } from 'lucide-react';

export default function Uploads() {
  const { user } = useAuth();
  const [showUploader, setShowUploader] = useState(false);
  
  // Fetch user's tracks
  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks/artist', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/tracks/artist/${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  // Filter published and draft tracks
  const publishedTracks = tracks?.filter(track => track.isPublished);
  const draftTracks = tracks?.filter(track => !track.isPublished);
  
  return (
    <MainLayout 
      title="Uploads" 
      description="Manage your music uploads and releases"
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Total Tracks: {tracks?.length || 0} | Published: {publishedTracks?.length || 0} | Drafts: {draftTracks?.length || 0}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setShowUploader(!showUploader)}>
            {showUploader ? 'Cancel Upload' : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Upload New Track
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Upload Form */}
      {showUploader && (
        <div className="mb-8">
          <MusicUploader />
        </div>
      )}
      
      {/* Tracks Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tracks</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>
        
        {/* All Tracks Tab */}
        <TabsContent value="all">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : tracks && tracks.length > 0 ? (
            <TrackList tracks={tracks} />
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg shadow">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tracks uploaded yet</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Start uploading your music to connect with fans.
              </p>
              <Button className="mt-8" onClick={() => setShowUploader(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Your First Track
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Published Tracks Tab */}
        <TabsContent value="published">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : publishedTracks && publishedTracks.length > 0 ? (
            <TrackList tracks={publishedTracks} />
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg shadow">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No published tracks</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Publish your tracks to make them available to fans.
              </p>
              {tracks && tracks.length > 0 ? (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  You have {draftTracks?.length} draft(s) ready to be published.
                </p>
              ) : (
                <Button className="mt-8" onClick={() => setShowUploader(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload New Track
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Draft Tracks Tab */}
        <TabsContent value="drafts">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : draftTracks && draftTracks.length > 0 ? (
            <TrackList tracks={draftTracks} />
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg shadow">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No draft tracks</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your unpublished tracks will appear here.
              </p>
              <Button className="mt-8" onClick={() => setShowUploader(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload New Track
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
