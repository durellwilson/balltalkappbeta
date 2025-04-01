import { useState, useEffect, useRef, useCallback } from 'react';
import StudioCollaboration from '@/lib/studioCollaboration';

interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number } | null;
  activeTrack?: string | null;
  isActive?: boolean;
  lastActive?: string;
  device?: string;
}

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  text: string;
  timestamp: string;
}

interface Track {
  id: string;
  name: string;
  type: string;
  audioUrl?: string;
  waveform?: number[];
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface MixerSettings {
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  eq?: { low: number; mid: number; high: number };
  effects?: { [key: string]: any };
}

interface TimelineRegion {
  id: string;
  start: number;
  end: number;
  color?: string;
  label?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

interface UseStudioCollaborationProps {
  projectId: string;
  userId: string;
  username: string;
  wsUrl?: string;
  onUserJoin?: (user: User) => void;
  onUserLeave?: (user: User) => void;
  onMessage?: (message: Message) => void;
  onTrackUpdate?: (tracks: Record<string, Track>) => void;
  onMixerUpdate?: (mixer: Record<string, MixerSettings>) => void;
  onTimelineUpdate?: (timeline: Record<string, { regions: TimelineRegion[] }>) => void;
  onMasterUpdate?: (master: any) => void;
  onConnectionStatus?: (status: 'connected' | 'disconnected' | 'connecting') => void;
  autoReconnect?: boolean;
}

/**
 * Custom hook for using the StudioCollaboration system
 * Manages collaboration state and provides methods for interacting with the collaboration system
 */
export const useStudioCollaboration = ({
  projectId,
  userId,
  username,
  wsUrl,
  onUserJoin,
  onUserLeave,
  onMessage,
  onTrackUpdate,
  onMixerUpdate,
  onTimelineUpdate,
  onMasterUpdate,
  onConnectionStatus,
  autoReconnect = true
}: UseStudioCollaborationProps) => {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tracks, setTracks] = useState<Record<string, Track>>({});
  const [mixer, setMixer] = useState<Record<string, MixerSettings>>({});
  const [timeline, setTimeline] = useState<Record<string, { regions: TimelineRegion[] }>>({});
  const [masterSettings, setMasterSettings] = useState<any>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  // Use ref to keep instance across renders
  const collaborationRef = useRef<StudioCollaboration | null>(null);
  
  // Initialize the collaboration system
  useEffect(() => {
    if (!projectId || !userId || !username) return;
    
    // Create the collaboration instance
    collaborationRef.current = new StudioCollaboration(
      projectId,
      userId,
      username,
      wsUrl
    );
    
    const collaboration = collaborationRef.current;
    
    // Set up callbacks
    collaboration.onUserJoin((user) => {
      setActiveUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      if (onUserJoin) onUserJoin(user);
    });
    
    collaboration.onUserLeave((user) => {
      setActiveUsers(prev => prev.filter(u => u.id !== user.id));
      if (onUserLeave) onUserLeave(user);
    });
    
    collaboration.onMessage((message) => {
      setMessages(prev => [...prev, message]);
      if (onMessage) onMessage(message);
    });
    
    collaboration.onTrackUpdate((newTracks) => {
      setTracks(newTracks);
      if (onTrackUpdate) onTrackUpdate(newTracks);
    });
    
    collaboration.onMixerUpdate((newMixer) => {
      setMixer(newMixer);
      if (onMixerUpdate) onMixerUpdate(newMixer);
    });
    
    collaboration.onTimelineUpdate((newTimeline) => {
      setTimeline(newTimeline);
      if (onTimelineUpdate) onTimelineUpdate(newTimeline);
    });
    
    collaboration.onMasterUpdate((newMaster) => {
      setMasterSettings(newMaster);
      if (onMasterUpdate) onMasterUpdate(newMaster);
    });
    
    collaboration.onConnectionStatus((status) => {
      setConnectionStatus(status);
      if (onConnectionStatus) onConnectionStatus(status);
    });
    
    // Initialize with current data
    setTracks(collaboration.getTracksData());
    setMixer(collaboration.getMixerData());
    setTimeline(collaboration.getTimelineData());
    setMasterSettings(collaboration.getMasterData());
    setMessages(collaboration.getMessages());
    setActiveUsers(collaboration.getActiveUsers());
    
    // Auto-reconnect on visibility change (when user returns to tab)
    if (autoReconnect) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && 
            collaborationRef.current && 
            connectionStatus === 'disconnected') {
          collaborationRef.current.reconnect();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (collaborationRef.current) {
          collaborationRef.current.destroy();
          collaborationRef.current = null;
        }
      };
    }
    
    return () => {
      if (collaborationRef.current) {
        collaborationRef.current.destroy();
        collaborationRef.current = null;
      }
    };
  }, [projectId, userId, username, wsUrl]);
  
  // Send a chat message
  const sendMessage = useCallback((text: string) => {
    if (collaborationRef.current) {
      collaborationRef.current.sendMessage(text);
    }
  }, []);
  
  // Add a track
  const addTrack = useCallback((trackData: Partial<Track>) => {
    if (collaborationRef.current) {
      return collaborationRef.current.addTrack(trackData);
    }
    return '';
  }, []);
  
  // Update a track
  const updateTrack = useCallback((trackId: string, trackData: Partial<Track>) => {
    if (collaborationRef.current) {
      collaborationRef.current.updateTrack(trackId, trackData);
    }
  }, []);
  
  // Remove a track
  const removeTrack = useCallback((trackId: string) => {
    if (collaborationRef.current) {
      collaborationRef.current.removeTrack(trackId);
    }
  }, []);
  
  // Update mixer settings
  const updateMixerSettings = useCallback((trackId: string, settings: Partial<MixerSettings>) => {
    if (collaborationRef.current) {
      collaborationRef.current.updateMixerSettings(trackId, settings);
    }
  }, []);
  
  // Update master settings
  const updateMasterSettings = useCallback((settings: any) => {
    if (collaborationRef.current) {
      collaborationRef.current.updateMasterSettings(settings);
    }
  }, []);
  
  // Add a timeline region
  const addTimelineRegion = useCallback((trackId: string, regionData: Partial<TimelineRegion>) => {
    if (collaborationRef.current) {
      return collaborationRef.current.addTimelineRegion(trackId, regionData);
    }
    return '';
  }, []);
  
  // Update a timeline region
  const updateTimelineRegion = useCallback((trackId: string, regionId: string, regionData: Partial<TimelineRegion>) => {
    if (collaborationRef.current) {
      collaborationRef.current.updateTimelineRegion(trackId, regionId, regionData);
    }
  }, []);
  
  // Remove a timeline region
  const removeTimelineRegion = useCallback((trackId: string, regionId: string) => {
    if (collaborationRef.current) {
      collaborationRef.current.removeTimelineRegion(trackId, regionId);
    }
  }, []);
  
  // Update cursor position
  const updateCursor = useCallback((position: { x: number, y: number }) => {
    if (collaborationRef.current) {
      collaborationRef.current.updateCursor(position);
    }
  }, []);
  
  // Update active track
  const updateActiveTrack = useCallback((trackId: string | null) => {
    if (collaborationRef.current) {
      collaborationRef.current.updateActiveTrack(trackId);
    }
  }, []);
  
  // Undo last change
  const undo = useCallback(() => {
    if (collaborationRef.current) {
      collaborationRef.current.undo();
    }
  }, []);
  
  // Redo last undone change
  const redo = useCallback(() => {
    if (collaborationRef.current) {
      collaborationRef.current.redo();
    }
  }, []);
  
  // Force a state sync
  const forceSync = useCallback(() => {
    if (collaborationRef.current) {
      collaborationRef.current.forceSyncState();
    }
  }, []);
  
  // Export the document state
  const exportState = useCallback(() => {
    if (collaborationRef.current) {
      return collaborationRef.current.exportDocumentState();
    }
    return '';
  }, []);
  
  // Import a document state
  const importState = useCallback((state: string) => {
    if (collaborationRef.current) {
      return collaborationRef.current.processExternalUpdate(state);
    }
    return false;
  }, []);
  
  // Reconnect
  const reconnect = useCallback(() => {
    if (collaborationRef.current) {
      collaborationRef.current.reconnect();
    }
  }, []);
  
  // Disconnect
  const disconnect = useCallback(() => {
    if (collaborationRef.current) {
      collaborationRef.current.disconnect();
    }
  }, []);
  
  return {
    activeUsers,
    messages,
    tracks,
    mixer,
    timeline,
    masterSettings,
    connectionStatus,
    sendMessage,
    addTrack,
    updateTrack,
    removeTrack,
    updateMixerSettings,
    updateMasterSettings,
    addTimelineRegion,
    updateTimelineRegion,
    removeTimelineRegion,
    updateCursor,
    updateActiveTrack,
    undo,
    redo,
    forceSync,
    exportState,
    importState,
    reconnect,
    disconnect
  };
};

export default useStudioCollaboration;