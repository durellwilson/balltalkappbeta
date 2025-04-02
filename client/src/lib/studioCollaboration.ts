import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { v4 as uuidv4 } from 'uuid';
import { encode } from 'lib0/encoding';
import { fromUint8Array, toUint8Array } from 'js-base64';

/**
 * User state interface for shared awareness
 */
interface UserState {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number } | null;
  activeTrack?: string | null;
  isActive?: boolean;
  lastActive?: string;
  device?: string;
}

/**
 * Track data interface
 */
interface TrackData {
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

/**
 * Mixer settings interface
 */
interface MixerSettings {
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  eq?: { low: number; mid: number; high: number };
  effects?: { [key: string]: any };
}

/**
 * Timeline region interface
 */
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

/**
 * Message interface
 */
interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  text: string;
  timestamp: string;
}

/**
 * StudioCollaboration provides enterprise-grade real-time collaboration for the studio environment
 * using Y.js for conflict-free replicated data types (CRDT) and WebSockets for low-latency communication
 */
class StudioCollaboration {
  private doc: Y.Doc;
  private provider: WebsocketProvider;
  private projectId: string;
  private userId: string;
  private username: string;
  private awareness: any; // Y.js awareness type
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'connecting';
  private syncInterval: number | null = null;
  private heartbeatInterval: number | null = null;
  private lastSyncTime: number = 0;
  private pendingChanges: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimeout: number | null = null;
  private connectedUsers: Map<string, UserState> = new Map();
  private clientIdToUserId: Map<number, string> = new Map();
  
  // Shared data structures with strong typing
  private tracks: Y.Map<TrackData>;
  private mixer: Y.Map<MixerSettings>;
  private timeline: Y.Map<{ regions: TimelineRegion[] }>;
  private masterSettings: Y.Map<any>;
  private messageHistory: Y.Array<Message>;
  private undoManager: Y.UndoManager;
  
  // Event callbacks
  private onTrackUpdateCallback: ((tracks: Record<string, TrackData>) => void) | null = null;
  private onMixerUpdateCallback: ((mixer: Record<string, MixerSettings>) => void) | null = null;
  private onTimelineUpdateCallback: ((timeline: Record<string, { regions: TimelineRegion[] }>) => void) | null = null;
  private onMasterUpdateCallback: ((master: any) => void) | null = null;
  private onMessageCallback: ((message: Message) => void) | null = null;
  private onUserJoinCallback: ((user: UserState) => void) | null = null;
  private onUserLeaveCallback: ((user: UserState) => void) | null = null;
  private onConnectionStatusCallback: ((status: 'connected' | 'disconnected' | 'connecting') => void) | null = null;

  /**
   * Create a new StudioCollaboration instance
   * @param projectId Project identifier
   * @param userId Current user ID
   * @param username Current username
   * @param wsUrl WebSocket server URL (defaults to current host with /ws path)
   */
  constructor(projectId: string, userId: string, username: string, wsUrl?: string) {
    this.projectId = projectId;
    this.userId = userId;
    this.username = username;
    
    // Create a Y.js document with client ID for conflict resolution
    this.doc = new Y.Doc({ gc: true });
    
    // Set up collaborative data structures with strong typing
    this.tracks = this.doc.getMap('tracks');
    this.mixer = this.doc.getMap('mixer');
    this.timeline = this.doc.getMap('timeline');
    this.masterSettings = this.doc.getMap('master');
    this.messageHistory = this.doc.getArray('messages');
    
    // Setup undo manager for tracks and timeline (not for real-time mixer control)
    this.undoManager = new Y.UndoManager([this.tracks, this.timeline], {
      captureTimeout: 500, // Group edits within 500ms
      trackedOrigins: new Set([this.userId]) // Only track changes from this user
    });
    
    // Calculate WebSocket URL if not provided
    if (!wsUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use window.location.host but fallback to a specific port if needed
      // This ensures we have a valid WebSocket URL even in development environments where host may be incomplete
      const host = window.location.host || (window.location.hostname + ':5000');
      wsUrl = `${protocol}//${host}/ws`;
      console.log('WebSocket URL:', wsUrl); // Log for debugging
    }
    
    try {
      // Connect to WebSocket server with enhanced error handling and binary protocol support
      this.provider = new WebsocketProvider(wsUrl, `studio-${projectId}`, this.doc, {
        connect: true,
        awareness: {
          // Send client info when connecting
          clientID: userId as unknown as number, // Will be used internally by y-websocket
          name: this.username
        },
        resyncInterval: 10000, // Resync every 10 seconds to ensure consistency
        maxBackoffTime: 5000 // Maximum reconnection delay
      });
      
      // Set up awareness (for user presence) with device info
      this.awareness = this.provider.awareness;
      this.awareness.setLocalStateField('user', {
        id: this.userId,
        name: this.username,
        color: this.getUserColor(this.userId),
        cursor: null,
        activeTrack: null,
        isActive: true,
        lastActive: new Date().toISOString(),
        device: this.getDeviceInfo()
      });
      
      // Set up connection handlers
      this.setupConnectionHandling();
      
      // Set up periodic sync
      this.setupPeriodicSync();
      
      // Set up event listeners for real-time collaboration
      this.setupEventListeners();
      
      console.log('StudioCollaboration initialized with project ID:', projectId);
    } catch (error) {
      console.error('Failed to initialize StudioCollaboration:', error);
      this.connectionStatus = 'disconnected';
      if (this.onConnectionStatusCallback) {
        this.onConnectionStatusCallback('disconnected');
      }
    }
  }
  
  /**
   * Setup connection status tracking and recovery mechanisms
   */
  private setupConnectionHandling(): void {
    // Connection status monitoring 
    this.provider.on('status', ({ status }: { status: 'connected' | 'connecting' | 'disconnected' }) => {
      this.connectionStatus = status;
      
      if (this.onConnectionStatusCallback) {
        this.onConnectionStatusCallback(status);
      }
      
      if (status === 'connected') {
        this.reconnectAttempts = 0;
        
        // Update presence when reconnecting
        this.awareness.setLocalStateField('user', {
          ...this.awareness.getLocalState().user,
          isActive: true,
          lastActive: new Date().toISOString()
        });
        
        // Sync any pending changes
        if (this.pendingChanges) {
          this.forceSyncState();
          this.pendingChanges = false;
        }
      }
    });
  }
  
  /**
   * Setup periodic state synchronization for reliability
   */
  private setupPeriodicSync(): void {
    // Ensure regular syncs (useful for clients that were offline)
    this.syncInterval = window.setInterval(() => {
      if (this.connectionStatus === 'connected' && 
          (Date.now() - this.lastSyncTime > 60000 || this.pendingChanges)) {
        this.forceSyncState();
        this.pendingChanges = false;
      }
    }, 60000); // Every minute, check if we need to sync
    
    // Heartbeat to maintain awareness state
    this.heartbeatInterval = window.setInterval(() => {
      // Only update if connected and there's a local state
      if (this.connectionStatus === 'connected' && this.awareness.getLocalState()) {
        this.awareness.setLocalStateField('user', {
          ...this.awareness.getLocalState().user,
          lastActive: new Date().toISOString()
        });
      }
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Force a state sync with all peers, using binary encoding for efficiency
   */
  private forceSyncState(): void {
    if (this.connectionStatus === 'connected') {
      try {
        this.provider.emit('sync', {});
        this.lastSyncTime = Date.now();
      } catch (error) {
        console.error('Error during sync:', error);
      }
    }
  }
  
  /**
   * Get simplified device information for better collaboration context
   */
  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    let device = 'Unknown';
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      device = 'iOS';
    } else if (/Android/.test(userAgent)) {
      device = 'Android';
    } else if (/Mac/.test(userAgent)) {
      device = 'Mac';
    } else if (/Windows/.test(userAgent)) {
      device = 'Windows';
    } else if (/Linux/.test(userAgent)) {
      device = 'Linux';
    }
    
    return device;
  }
  
  /**
   * Set up event listeners for real-time updates with robust error handling
   */
  private setupEventListeners(): void {
    try {
      // Listen for track changes
      this.tracks.observe(() => {
        if (this.onTrackUpdateCallback) {
          try {
            this.onTrackUpdateCallback(this.getTracksData());
          } catch (error) {
            console.error('Error in track update callback:', error);
          }
        }
      });
      
      // Listen for mixer changes
      this.mixer.observe(() => {
        if (this.onMixerUpdateCallback) {
          try {
            this.onMixerUpdateCallback(this.getMixerData());
          } catch (error) {
            console.error('Error in mixer update callback:', error);
          }
        }
      });
      
      // Listen for timeline changes
      this.timeline.observe(() => {
        if (this.onTimelineUpdateCallback) {
          try {
            this.onTimelineUpdateCallback(this.getTimelineData());
          } catch (error) {
            console.error('Error in timeline update callback:', error);
          }
        }
      });
      
      // Listen for master settings changes
      this.masterSettings.observe(() => {
        if (this.onMasterUpdateCallback) {
          try {
            this.onMasterUpdateCallback(this.getMasterData());
          } catch (error) {
            console.error('Error in master settings update callback:', error);
          }
        }
      });
      
      // Listen for new messages
      this.messageHistory.observe(() => {
        try {
          // Only callback for new messages
          const messages = this.getMessages();
          if (messages.length > 0 && this.onMessageCallback) {
            // Call callback with the most recent message
            this.onMessageCallback(messages[messages.length - 1]);
          }
        } catch (error) {
          console.error('Error in message history update callback:', error);
        }
      });
      
      // Add fallback handling for user presence
      const awarenessInterval = window.setInterval(() => {
        try {
          if (!this.awareness || typeof this.awareness.getStates !== 'function') {
            console.warn('Awareness object not properly initialized');
            return;
          }
          
          // Fallback logic for awareness handling
          const currentUsers = new Set<string>();
          
          // Process current users
          this.awareness.getStates().forEach((state: any, clientId: number) => {
            try {
              if (state?.user && state.user.id !== this.userId) {
                currentUsers.add(state.user.id);
                
                // If we haven't seen this user before, treat as a join
                if (!this.connectedUsers.has(state.user.id) && this.onUserJoinCallback) {
                  // Track the user
                  this.clientIdToUserId.set(clientId, state.user.id);
                  
                  // Store user info
                  this.connectedUsers.set(state.user.id, {
                    id: state.user.id,
                    name: state.user.name,
                    color: state.user.color || this.getUserColor(state.user.id),
                    cursor: state.user.cursor,
                    activeTrack: state.user.activeTrack,
                    isActive: state.user.isActive,
                    lastActive: state.user.lastActive,
                    device: state.user.device
                  });
                  
                  // Notify callback
                  this.onUserJoinCallback({
                    id: state.user.id,
                    name: state.user.name,
                    color: state.user.color || this.getUserColor(state.user.id)
                  });
                }
              }
            } catch (error) {
              console.error('Error processing user state:', error);
            }
          });
          
          // Check for users who left
          if (this.onUserLeaveCallback) {
            // Copy to array to prevent modification during iteration
            const connectedUserIds = Array.from(this.connectedUsers.keys());
            
            for (const userId of connectedUserIds) {
              // If user is no longer in the current set, they left
              if (!currentUsers.has(userId) && userId !== this.userId) {
                const userInfo = this.connectedUsers.get(userId);
                if (userInfo) {
                  try {
                    this.onUserLeaveCallback({
                      id: userId,
                      name: userInfo.name,
                      color: userInfo.color
                    });
                  } catch (error) {
                    console.error('Error in user leave callback:', error);
                  }
                  this.connectedUsers.delete(userId);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error in awareness polling:', error);
        }
      }, 3000); // Check every 3 seconds
      
      // Clean up interval on page unload
      window.addEventListener('beforeunload', () => {
        window.clearInterval(awarenessInterval);
      });
      
      // Try to set up traditional awareness events if available
      try {
        this.provider.on('status', ({ status }: { status: 'connected' | 'connecting' | 'disconnected' }) => {
          if (this.onConnectionStatusCallback) {
            this.onConnectionStatusCallback(status);
          }
        });
      } catch (error) {
        console.warn('Could not set up status handler:', error);
      }
      
      console.log('Event listeners set up successfully');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }
  
  /**
   * Add a new track to the project
   */
  addTrack(trackData: any): string {
    const trackId = trackData.id || uuidv4();
    this.tracks.set(trackId, {
      ...trackData,
      id: trackId,
      createdBy: this.userId,
      createdAt: new Date().toISOString()
    });
    
    // Add default mixer settings for the track
    this.mixer.set(trackId, {
      volume: 0.8,
      pan: 0,
      muted: false,
      soloed: false
    });
    
    return trackId;
  }
  
  /**
   * Update an existing track
   */
  updateTrack(trackId: string, trackData: any): void {
    const existingTrack = this.tracks.get(trackId);
    if (!existingTrack) return;
    
    this.tracks.set(trackId, {
      ...existingTrack,
      ...trackData,
      updatedBy: this.userId,
      updatedAt: new Date().toISOString()
    });
  }
  
  /**
   * Remove a track from the project
   */
  removeTrack(trackId: string): void {
    if (this.tracks.has(trackId)) {
      this.tracks.delete(trackId);
    }
    
    if (this.mixer.has(trackId)) {
      this.mixer.delete(trackId);
    }
  }
  
  /**
   * Update mixer settings for a track
   */
  updateMixerSettings(trackId: string, settings: any): void {
    const existingSettings = this.mixer.get(trackId);
    if (!existingSettings) return;
    
    this.mixer.set(trackId, {
      ...existingSettings,
      ...settings
    });
  }
  
  /**
   * Update master settings
   */
  updateMasterSettings(settings: any): void {
    const existingSettings = this.masterSettings.toJSON();
    
    this.masterSettings.set('settings', {
      ...existingSettings.settings,
      ...settings,
      updatedBy: this.userId,
      updatedAt: new Date().toISOString()
    });
  }
  
  /**
   * Add a track region to the timeline (e.g. clip placement)
   */
  addTimelineRegion(trackId: string, regionData: any): string {
    const regionId = regionData.id || uuidv4();
    const trackTimeline = this.timeline.get(trackId) || { regions: [] };
    const regions = trackTimeline.regions || [];
    
    const updatedRegions = [
      ...regions,
      {
        ...regionData,
        id: regionId,
        createdBy: this.userId,
        createdAt: new Date().toISOString()
      }
    ];
    
    this.timeline.set(trackId, {
      ...trackTimeline,
      regions: updatedRegions
    });
    
    return regionId;
  }
  
  /**
   * Update a timeline region
   */
  updateTimelineRegion(trackId: string, regionId: string, regionData: any): void {
    const trackTimeline = this.timeline.get(trackId);
    if (!trackTimeline || !trackTimeline.regions) return;
    
    const regions = trackTimeline.regions;
    const regionIndex = regions.findIndex((r: any) => r.id === regionId);
    
    if (regionIndex === -1) return;
    
    const updatedRegions = [...regions];
    updatedRegions[regionIndex] = {
      ...regions[regionIndex],
      ...regionData,
      updatedBy: this.userId,
      updatedAt: new Date().toISOString()
    };
    
    this.timeline.set(trackId, {
      ...trackTimeline,
      regions: updatedRegions
    });
  }
  
  /**
   * Remove a timeline region
   */
  removeTimelineRegion(trackId: string, regionId: string): void {
    const trackTimeline = this.timeline.get(trackId);
    if (!trackTimeline || !trackTimeline.regions) return;
    
    const regions = trackTimeline.regions;
    const updatedRegions = regions.filter((r: any) => r.id !== regionId);
    
    this.timeline.set(trackId, {
      ...trackTimeline,
      regions: updatedRegions
    });
  }
  
  /**
   * Send a chat message to all users
   */
  sendMessage(text: string): void {
    const message: Message = {
      id: uuidv4(),
      sender: {
        id: this.userId,
        name: this.username
      },
      text,
      timestamp: new Date().toISOString()
    };
    
    this.messageHistory.push([message]);
    
    // Mark that we have pending changes to sync
    this.pendingChanges = true;
  }
  
  /**
   * Undo the last change made by this user
   */
  undo(): void {
    if (this.undoManager.canUndo()) {
      this.undoManager.undo();
      this.pendingChanges = true;
    }
  }
  
  /**
   * Redo the last undone change
   */
  redo(): void {
    if (this.undoManager.canRedo()) {
      this.undoManager.redo();
      this.pendingChanges = true;
    }
  }
  
  /**
   * Process incoming binary state update (from another client)
   * Used to manually merge updates for faster syncing or in offline scenarios
   */
  processExternalUpdate(base64Update: string): boolean {
    try {
      // Convert from base64 to binary
      const update = toUint8Array(base64Update);
      
      // Apply the update to the document
      Y.applyUpdate(this.doc, update);
      
      console.log('External update applied successfully');
      return true;
    } catch (error) {
      console.error('Failed to apply external update:', error);
      return false;
    }
  }
  
  /**
   * Export the current document state as a base64 string
   * Useful for saving the state or transferring via alternative channels
   */
  exportDocumentState(): string {
    const update = Y.encodeStateAsUpdate(this.doc);
    return fromUint8Array(update);
  }
  
  /**
   * Update user cursor position (for showing remote cursors)
   */
  updateCursor(position: { x: number, y: number }): void {
    try {
      if (!this.awareness) {
        console.warn('Awareness object is not available for cursor update');
        return;
      }
      
      // Safely get local state and update user cursor
      const localState = this.awareness.getLocalState() || {};
      const userData = localState.user || { 
        id: this.userId, 
        name: this.username,
        color: this.getUserColor(this.userId)
      };
      
      this.awareness.setLocalStateField('user', {
        ...userData,
        cursor: position
      });
    } catch (error) {
      console.error('Error updating cursor position:', error);
    }
  }
  
  /**
   * Update active track (shows what track each user is working on)
   */
  updateActiveTrack(trackId: string | null): void {
    try {
      if (!this.awareness) {
        console.warn('Awareness object is not available for active track update');
        return;
      }
      
      // Safely get local state and update user active track
      const localState = this.awareness.getLocalState() || {};
      const userData = localState.user || { 
        id: this.userId, 
        name: this.username,
        color: this.getUserColor(this.userId)
      };
      
      this.awareness.setLocalStateField('user', {
        ...userData,
        activeTrack: trackId
      });
    } catch (error) {
      console.error('Error updating active track:', error);
    }
  }
  
  /**
   * Get all tracks data
   */
  getTracksData(): any {
    return this.tracks.toJSON();
  }
  
  /**
   * Get mixer data for all tracks
   */
  getMixerData(): any {
    return this.mixer.toJSON();
  }
  
  /**
   * Get timeline data for all tracks
   */
  getTimelineData(): any {
    return this.timeline.toJSON();
  }
  
  /**
   * Get master settings
   */
  getMasterData(): any {
    return this.masterSettings.toJSON();
  }
  
  /**
   * Get all message history
   */
  getMessages(): any[] {
    return this.messageHistory.toArray();
  }
  
  /**
   * Get all active users in the session
   */
  getActiveUsers(): any[] {
    // Safely check if awareness exists and has getStates method
    if (!this.awareness || typeof this.awareness.getStates !== 'function') {
      console.warn('Awareness object or getStates method is not available');
      return [];
    }
    
    try {
      const states = Array.from(this.awareness.getStates().entries());
      return states
        .map(([clientId, state]: [number, any]) => state?.user)
        .filter((user: any) => user && user.id !== this.userId);
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }
  
  /**
   * Set callback for track updates
   */
  onTrackUpdate(callback: (tracks: any) => void): void {
    this.onTrackUpdateCallback = callback;
  }
  
  /**
   * Set callback for mixer updates
   */
  onMixerUpdate(callback: (mixer: any) => void): void {
    this.onMixerUpdateCallback = callback;
  }
  
  /**
   * Set callback for timeline updates
   */
  onTimelineUpdate(callback: (timeline: any) => void): void {
    this.onTimelineUpdateCallback = callback;
  }
  
  /**
   * Set callback for master settings updates
   */
  onMasterUpdate(callback: (master: any) => void): void {
    this.onMasterUpdateCallback = callback;
  }
  
  /**
   * Set callback for new messages
   */
  onMessage(callback: (message: any) => void): void {
    this.onMessageCallback = callback;
  }
  
  /**
   * Set callback for user joins
   */
  onUserJoin(callback: (user: any) => void): void {
    this.onUserJoinCallback = callback;
  }
  
  /**
   * Set callback for user leaves
   */
  onUserLeave(callback: (user: any) => void): void {
    this.onUserLeaveCallback = callback;
  }
  
  /**
   * Get a consistent color for a user based on their ID
   */
  private getUserColor(userId: string): string {
    // Simple hash function for user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    hash = Math.abs(hash);
    
    // Predefined colors for better visibility
    const colors = [
      '#3b82f6', // blue
      '#ef4444', // red
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#0ea5e9', // sky
      '#f97316', // orange
      '#14b8a6', // teal
      '#d946ef'  // fuchsia
    ];
    
    return colors[hash % colors.length];
  }
  
  /**
   * Disconnect from the collaboration session
   */
  disconnect(): void {
    if (this.provider) {
      this.provider.disconnect();
    }
  }
  
  /**
   * Reconnect to the collaboration session
   */
  reconnect(): void {
    if (this.provider) {
      this.provider.connect();
    }
  }
  
  /**
   * Set callback for connection status updates
   */
  onConnectionStatus(callback: (status: 'connected' | 'disconnected' | 'connecting') => void): void {
    this.onConnectionStatusCallback = callback;
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear intervals
    if (this.syncInterval !== null) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Disconnect from server
    this.disconnect();
    
    // Clean up data
    this.tracks.unobserve();
    this.mixer.unobserve();
    this.timeline.unobserve();
    this.masterSettings.unobserve();
    this.messageHistory.unobserve();
    
    // Clean up undo manager
    this.undoManager.stopCapturing();
    this.undoManager.clear();
    
    // Destroy the document (frees up memory)
    this.doc.destroy();
    
    console.log('StudioCollaboration resources cleaned up');
  }
}

export default StudioCollaboration;