import { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

interface StudioCollaborationOptions {
  sessionId: number;
  sessionCode: string;
  onUserJoined?: (userId: number, username: string) => void;
  onUserLeft?: (sessionId: number) => void;
  onTrackControl?: (action: string, trackId: number, position: number, userId: number) => void;
  onTrackComment?: (comment: any) => void;
  onChatMessage?: (userId: number, username: string, message: string, timestamp: string) => void;
}

interface StudioCollaborationState {
  isConnected: boolean;
  collaborators: { userId: number; username: string }[];
  doc: Y.Doc | null;
}

export function useStudioCollaboration({
  sessionId,
  sessionCode,
  onUserJoined,
  onUserLeft,
  onTrackControl,
  onTrackComment,
  onChatMessage,
}: StudioCollaborationOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<StudioCollaborationState>({
    isConnected: false,
    collaborators: [],
    doc: null,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  
  // Connect to the WebSocket server
  useEffect(() => {
    if (!sessionId || !sessionCode || !user) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      // Join the studio session
      ws.send(JSON.stringify({
        type: 'join-session',
        sessionId,
        sessionCode,
        userId: user.id,
        username: user.username
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'error':
            toast({
              title: 'Collaboration Error',
              description: data.message,
              variant: 'destructive',
            });
            break;
            
          case 'joined':
            console.log('Joined studio session', data.sessionId);
            // Create or update the Y.Doc
            const doc = new Y.Doc();
            if (data.state) {
              Y.applyUpdate(doc, new Uint8Array(data.state));
            }
            setState(prev => ({
              ...prev,
              isConnected: true,
              doc
            }));
            break;
            
          case 'user-joined':
            console.log('User joined', data.userId, data.username);
            setState(prev => ({
              ...prev,
              collaborators: [
                ...prev.collaborators,
                { userId: data.userId, username: data.username }
              ]
            }));
            
            toast({
              title: 'User Joined',
              description: `${data.username} has joined the session`,
            });
            
            if (onUserJoined) {
              onUserJoined(data.userId, data.username);
            }
            break;
            
          case 'user-left':
            console.log('User left', data.sessionId);
            if (onUserLeft) {
              onUserLeft(data.sessionId);
            }
            break;
            
          case 'sync-update':
            if (state.doc) {
              Y.applyUpdate(state.doc, new Uint8Array(data.update));
            }
            break;
            
          case 'track-control':
            if (onTrackControl) {
              onTrackControl(data.action, data.trackId, data.position, data.userId);
            }
            break;
            
          case 'track-comment':
            if (onTrackComment) {
              onTrackComment(data.comment);
            }
            break;
            
          case 'chat-message':
            if (onChatMessage) {
              onChatMessage(data.userId, data.username, data.message, data.timestamp);
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the collaboration server',
        variant: 'destructive',
      });
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setState(prev => ({
        ...prev,
        isConnected: false
      }));
    };
    
    return () => {
      ws.close();
    };
  }, [sessionId, sessionCode, user, toast, onUserJoined, onUserLeft, onTrackControl, onTrackComment, onChatMessage]);
  
  // Function to send track control messages (play, pause, etc.)
  const sendTrackControl = useCallback((action: string, trackId: number, position: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'track-control',
      action,
      trackId,
      position,
      userId: user.id
    }));
  }, [user]);
  
  // Function to send track comments
  const sendTrackComment = useCallback((trackId: number, content: string, timestamp: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'track-comment',
      trackId,
      userId: user.id,
      content,
      timestamp
    }));
  }, [user]);
  
  // Function to send chat messages
  const sendChatMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'chat-message',
      userId: user.id,
      username: user.username,
      message
    }));
  }, [user]);
  
  // Function to sync Y.js document updates
  const syncUpdate = useCallback((update: Uint8Array) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'sync-update',
      update: Array.from(update)
    }));
  }, []);
  
  return {
    ...state,
    sendTrackControl,
    sendTrackComment,
    sendChatMessage,
    syncUpdate
  };
}