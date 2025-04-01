import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { v4 as uuidv4 } from 'uuid';

/**
 * StudioCollaboration provides real-time collaboration for the studio environment
 * using Y.js for conflict-free replicated data types (CRDT) and WebSockets for communication
 */
export class StudioCollaboration {
  private doc: Y.Doc;
  private provider: WebsocketProvider;
  private projectId: string;
  private userId: string;
  private username: string;
  private awareness: any; // Y.js awareness type
  
  // Shared data structures
  private tracks: Y.Map<any>;
  private mixer: Y.Map<any>;
  private timeline: Y.Map<any>;
  private masterSettings: Y.Map<any>;
  private messageHistory: Y.Array<any>;
  
  // Event callbacks
  private onTrackUpdateCallback: ((tracks: any) => void) | null = null;
  private onMixerUpdateCallback: ((mixer: any) => void) | null = null;
  private onTimelineUpdateCallback: ((timeline: any) => void) | null = null;
  private onMasterUpdateCallback: ((master: any) => void) | null = null;
  private onMessageCallback: ((message: any) => void) | null = null;
  private onUserJoinCallback: ((user: any) => void) | null = null;
  private onUserLeaveCallback: ((user: any) => void) | null = null;

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
    
    // Create a Y.js document
    this.doc = new Y.Doc();
    
    // Set up collaborative data structures
    this.tracks = this.doc.getMap('tracks');
    this.mixer = this.doc.getMap('mixer');
    this.timeline = this.doc.getMap('timeline');
    this.masterSettings = this.doc.getMap('master');
    this.messageHistory = this.doc.getArray('messages');
    
    // Calculate WebSocket URL if not provided
    if (!wsUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }
    
    // Connect to WebSocket server
    this.provider = new WebsocketProvider(wsUrl, `studio-${projectId}`, this.doc, {
      connect: true,
      awareness: {
        // Send client info when connecting
        clientID: this.userId,
        name: this.username
      }
    });
    
    // Set up awareness (for user presence)
    this.awareness = this.provider.awareness;
    this.awareness.setLocalStateField('user', {
      id: this.userId,
      name: this.username,
      color: this.getUserColor(this.userId),
      cursor: null,
      activeTrack: null
    });
    
    // Set up awareness event listeners
    this.setupEventListeners();
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
              name: state.user.name
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
    const message = {
      id: uuidv4(),
      sender: {
        id: this.userId,
        name: this.username
      },
      text,
      timestamp: new Date().toISOString()
    };
    
    this.messageHistory.push([message]);
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
    const hash = [...userId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
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
   * Clean up resources
   */
  destroy(): void {
    this.disconnect();
    this.doc.destroy();
  }
}

export default StudioCollaboration;