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
export class StudioCollaboration {
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
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }
    
    // Connect to WebSocket server with enhanced error handling and binary protocol support
    this.provider = new WebsocketProvider(wsUrl, `studio-${projectId}`, this.doc, {
      connect: true,
      awareness: {
        // Send client info when connecting
        clientID: this.userId, // Will be used internally by y-websocket
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
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up connection status tracking
    this.setupConnectionHandling();
    
    // Set up periodic state syncing for more reliable real-time collaboration
    this.setupPeriodicSync();
  }
  
  /**
   * Setup connection status tracking and recovery mechanisms
   */
  private setupConnectionHandling(): void {
    // Connection and disconnection handling
    this.provider.on('status', ({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      this.connectionStatus = status;
      
      if (status === 'connected') {
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
        
        // Update status to show we're online
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
      } else if (status === 'disconnected') {
        // Set flag to sync when reconnected
        this.pendingChanges = true;
        
        // Try to reconnect automatically with exponential backoff
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const backoffTime = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
          console.log(`Connection lost. Attempting to reconnect in ${backoffTime / 1000} seconds...`);
          
          if (this.reconnectTimeout !== null) {
            window.clearTimeout(this.reconnectTimeout);
          }
          
          this.reconnectTimeout = window.setTimeout(() => {
            if (this.connectionStatus === 'disconnected') {
              this.reconnect();
              this.reconnectAttempts++;
            }
          }, backoffTime);
        }
      }
      
      // Trigger callback for UI updates
      if (this.onConnectionStatusCallback) {
        this.onConnectionStatusCallback(status);
      }
    });
    
    // Automatically update activity status every minute
    setInterval(() => {
      if (this.connectionStatus === 'connected') {
        this.awareness.setLocalStateField('user', {
          ...this.awareness.getLocalState().user,
          lastActive: new Date().toISOString()
        });
      }
    }, 60000);
  }
  
  /**
   * Setup periodic state synchronization for reliability
   */
  private setupPeriodicSync(): void {
    // Create a heartbeat to ensure connection stays alive
    this.heartbeatInterval = window.setInterval(() => {
      if (this.connectionStatus === 'connected') {
        // Send a minimal update to keep connection alive
        this.awareness.setLocalStateField('user', {
          ...this.awareness.getLocalState().user
        });
      }
    }, 30000); // Every 30 seconds
    
    // Sync state to ensure no updates are lost
    this.syncInterval = window.setInterval(() => {
      // Only sync if connected and changes have been made since last sync
      if (this.connectionStatus === 'connected' && 
          this.pendingChanges && 
          Date.now() - this.lastSyncTime > 5000) {
        this.forceSyncState();
      }
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Force a state sync with all peers, using binary encoding for efficiency
   */
  private forceSyncState(): void {
    if (this.connectionStatus !== 'connected') return;
    
    try {
      // Encode current document state as binary update
      const update = Y.encodeStateAsUpdate(this.doc);
      
      // Convert to base64 for transmission
      const base64Update = fromUint8Array(update);
      
      // Send via the provider's network layer
      this.provider.awareness.setLocalStateField('_yjs_sync', {
        update: base64Update,
        timestamp: Date.now()
      });
      
      this.lastSyncTime = Date.now();
      this.pendingChanges = false;
      
      console.log('Forced state synchronization complete');
    } catch (error) {
      console.error('Error during state synchronization:', error);
    }
  }
  
  /**
   * Get simplified device information for better collaboration context
   */
  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    let deviceType = 'Desktop';
    
    if (/Mobi|Android/i.test(userAgent)) {
      deviceType = 'Mobile';
    } else if (/iPad|Tablet/i.test(userAgent)) {
      deviceType = 'Tablet';
    }
    
    return deviceType;
  }

  /**
   * Set up event listeners for real-time updates
   */
  private setupEventListeners(): void {
    // Listen for track changes
    this.tracks.observe(event => {
      if (this.onTrackUpdateCallback) {
        this.onTrackUpdateCallback(this.getTracksData());
      }
    });
    
    // Listen for mixer changes
    this.mixer.observe(event => {
      if (this.onMixerUpdateCallback) {
        this.onMixerUpdateCallback(this.getMixerData());
      }
    });
    
    // Listen for timeline changes
    this.timeline.observe(event => {
      if (this.onTimelineUpdateCallback) {
        this.onTimelineUpdateCallback(this.getTimelineData());
      }
    });
    
    // Listen for master settings changes
    this.masterSettings.observe(event => {
      if (this.onMasterUpdateCallback) {
        this.onMasterUpdateCallback(this.getMasterData());
      }
    });
    
    // Listen for new messages
    this.messageHistory.observe(event => {
      // Only handle additions to the message history
      if (event.changes.added.length > 0) {
        const messages = Array.from(event.changes.added).map(item => item.content.getContent());
        
        if (this.onMessageCallback) {
          messages.forEach(msg => this.onMessageCallback!(msg));
        }
      }
    });
    
    // Listen for user state changes (join/leave)
    this.awareness.on('change', (changes: any) => {
      const { added, removed, updated } = changes;
      
      // Handle user joins
      if (added.length > 0 && this.onUserJoinCallback) {
        added.forEach((clientId: number) => {
          const state = this.awareness.getStates().get(clientId);
          if (state && state.user && state.user.id !== this.userId) {
            this.onUserJoinCallback!({
              id: state.user.id,
              name: state.user.name,
              color: state.user.color
            });
          }
        });
      }
      
      // Handle user leaves
      if (removed.length > 0 && this.onUserLeaveCallback) {
        removed.forEach((clientId: number) => {
          const state = this.awareness.getStates().get(clientId);
          if (state && state.user && state.user.id !== this.userId) {
            this.onUserLeaveCallback!({
              id: state.user.id,
              name: state.user.name,
              color: state.user.color || this.getUserColor(state.user.id)
            });
          }
        });
      }
    });
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
    const trackTimeline = this.timeline.get(trackId) || {};
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
    const localState = this.awareness.getLocalState();
    
    this.awareness.setLocalStateField('user', {
      ...localState.user,
      cursor: position
    });
  }

  /**
   * Update active track (shows what track each user is working on)
   */
  updateActiveTrack(trackId: string | null): void {
    const localState = this.awareness.getLocalState();
    
    this.awareness.setLocalStateField('user', {
      ...localState.user,
      activeTrack: trackId
    });
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
    const states = Array.from(this.awareness.getStates().entries());
    return states.map(([clientId, state]) => state.user)
      .filter(user => user && user.id !== this.userId);
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
    
    // Clean up event listeners
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