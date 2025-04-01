import { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { useAuth } from './use-auth';

interface StudioCollaborationOptions {
  sessionId: number;
  sessionCode: string;
  onUserJoined?: (userId: number, username: string) => void;
  onUserLeft?: (userId: number, username: string) => void;
  onTrackControl?: (action: string, trackId: number, position: number, userId?: number) => void;
  onTrackComment?: (comment: any) => void;
  onChatMessage?: (userId: number, username: string, message: string, timestamp: string) => void;
}

interface StudioCollaborationState {
  isConnected: boolean;
  collaborators: { userId: number; username: string }[];
  doc: Y.Doc | null;
}

interface StudioCollaborationActions {
  sendTrackControl: (action: string, trackId: number, position: number) => void;
  sendChatMessage: (message: string) => void;
  addTrackComment: (trackId: number, comment: string, timestamp?: string) => void;
}

export function useStudioCollaboration({
  sessionId,
  sessionCode,
  onUserJoined,
  onUserLeft,
  onTrackControl,
  onTrackComment,
  onChatMessage
}: StudioCollaborationOptions): StudioCollaborationState & StudioCollaborationActions {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<{ userId: number; username: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const docRef = useRef<Y.Doc | null>(null);

  useEffect(() => {
    if (!user || !sessionId || !sessionCode) return;
    
    // Create a Y.js document
    const doc = new Y.Doc();
    docRef.current = doc;
    
    // Connect to WebSocket server with appropriate protocol
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
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'joined':
            setIsConnected(true);
            setCollaborators(message.collaborators || []);
            break;
            
          case 'user-joined':
            setCollaborators(prev => {
              // Don't add duplicate collaborators
              if (prev.some(c => c.userId === message.userId)) return prev;
              return [...prev, { userId: message.userId, username: message.username }];
            });
            onUserJoined?.(message.userId, message.username);
            break;
            
          case 'user-left':
            setCollaborators(prev => prev.filter(c => c.userId !== message.userId));
            onUserLeft?.(message.userId, message.username);
            break;
            
          case 'track-control':
            onTrackControl?.(
              message.action,
              message.trackId,
              message.position,
              message.userId
            );
            break;
            
          case 'track-comment':
            onTrackComment?.(message.comment);
            break;
            
          case 'chat-message':
            onChatMessage?.(
              message.userId,
              message.username,
              message.message,
              message.timestamp
            );
            break;
            
          case 'sync':
            if (message.update && docRef.current) {
              Y.applyUpdate(docRef.current, new Uint8Array(message.update));
            }
            break;
            
          case 'error':
            console.error('WebSocket error:', message.message);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      setCollaborators([]);
    };
    
    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'leave-session',
          sessionId,
          userId: user.id
        }));
        ws.close();
      }
      if (docRef.current) {
        docRef.current.destroy();
      }
    };
  }, [sessionId, sessionCode, user, onUserJoined, onUserLeft]);

  // Send track control action to other users
  const sendTrackControl = useCallback((action: string, trackId: number, position: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'track-control',
      sessionId,
      userId: user.id,
      username: user.username,
      action,
      trackId,
      position
    }));
  }, [sessionId, user]);

  // Send chat message to all users in the session
  const sendChatMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) return;
    
    const timestamp = new Date().toISOString();
    wsRef.current.send(JSON.stringify({
      type: 'chat-message',
      sessionId,
      userId: user.id,
      username: user.username,
      message,
      timestamp
    }));
  }, [sessionId, user]);

  // Add a comment to a track
  const addTrackComment = useCallback((trackId: number, content: string, timestamp?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) return;
    
    const commentTimestamp = timestamp || new Date().toISOString();
    const comment = {
      userId: user.id,
      username: user.username,
      projectTrackId: trackId,
      content,
      timestamp: commentTimestamp
    };
    
    wsRef.current.send(JSON.stringify({
      type: 'track-comment',
      sessionId,
      comment
    }));
  }, [sessionId, user]);

  return {
    isConnected,
    collaborators,
    doc: docRef.current,
    sendTrackControl,
    sendChatMessage,
    addTrackComment
  };
}