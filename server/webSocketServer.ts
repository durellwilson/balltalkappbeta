import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import * as Y from 'yjs';
import { storage } from './storage';

// Map to store active document collections by studioSessionId
const documents = new Map<number, Y.Doc>();
// Map to store active connections by studioSessionId
const sessionConnections = new Map<number, Map<number, WebSocket>>();
// Map to store user data by connection
const connectionUsers = new Map<WebSocket, { userId: number, username: string }>();

export function setupWebSocketServer(httpServer: Server) {
  // Create WebSocket server on a specific path to avoid conflicts with Vite's HMR
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false, // Disable compression for simplicity
    clientTracking: true // Track connected clients
  });
  
  console.log('WebSocket server set up on path /ws');
  
  // Log server info
  httpServer.on('listening', () => {
    const addr = httpServer.address();
    const port = typeof addr === 'string' ? addr : addr?.port;
    console.log(`WebSocket server available on port ${port}`);
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket connection received');
    
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join-session':
            handleJoinSession(ws, data);
            break;
            
          case 'leave-session':
            handleLeaveSession(ws, data);
            break;
            
          case 'track-control':
            broadcastToSession(data.sessionId, {
              ...data,
              // Ensure we don't pass any extra data
              type: 'track-control',
              userId: data.userId,
              username: data.username,
              action: data.action,
              trackId: data.trackId,
              position: data.position
            }, ws);
            break;
            
          case 'track-comment':
            broadcastToSession(data.sessionId, {
              type: 'track-comment',
              comment: data.comment
            }, ws);
            
            // Also save comment to database
            try {
              await storage.addTrackComment({
                userId: data.comment.userId,
                projectTrackId: data.comment.projectTrackId,
                content: data.comment.content,
                timestamp: new Date(data.comment.timestamp)
              });
            } catch (error) {
              console.error('Failed to save track comment:', error);
            }
            break;
            
          case 'chat-message':
            broadcastToSession(data.sessionId, {
              type: 'chat-message',
              userId: data.userId,
              username: data.username,
              message: data.message,
              timestamp: data.timestamp
            }, ws);
            break;
            
          case 'sync':
            // Y.js sync - update the shared document
            if (data.sessionId && data.update) {
              const doc = getOrCreateSessionDoc(data.sessionId);
              Y.applyUpdate(doc, new Uint8Array(data.update));
              
              // Broadcast update to all other clients
              broadcastToSession(data.sessionId, {
                type: 'sync',
                update: Array.from(Y.encodeStateAsUpdate(doc))
              }, ws);
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });
    
    ws.on('close', () => {
      // Handle disconnection
      const userInfo = connectionUsers.get(ws);
      
      if (userInfo) {
        // Find which session this user was in
        sessionConnections.forEach((connections, sessionId) => {
          if (connections.has(userInfo.userId)) {
            // Remove from connections
            connections.delete(userInfo.userId);
            // Notify others
            broadcastToSession(sessionId, {
              type: 'user-left',
              userId: userInfo.userId,
              username: userInfo.username
            });
          }
        });
        
        connectionUsers.delete(ws);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Handle join session request
  async function handleJoinSession(ws: WebSocket, data: any) {
    const { sessionId, sessionCode, userId, username } = data;
    
    try {
      // Verify session exists and code matches
      const session = await storage.getLiveSessionByCode(sessionCode);
      
      if (!session || session.id !== sessionId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid session or session code'
        }));
        return;
      }
      
      // Store user connection
      let sessionConnections = getOrCreateSessionConnections(sessionId);
      sessionConnections.set(userId, ws);
      connectionUsers.set(ws, { userId, username });
      
      // Get current collaborators
      const collaborators = Array.from(sessionConnections.entries())
        .filter(([id]) => id !== userId)
        .map(([id]) => {
          const user = Array.from(connectionUsers.entries())
            .find(([_, info]) => info.userId === id);
          
          return user ? { 
            userId: user[1].userId, 
            username: user[1].username 
          } : null;
        })
        .filter(Boolean);
      
      // Create or get session document
      const doc = getOrCreateSessionDoc(sessionId);
      
      // Send confirmation to the client who joined
      ws.send(JSON.stringify({
        type: 'joined',
        sessionId,
        collaborators
      }));
      
      // If there's state in the document, send it
      if (doc) {
        ws.send(JSON.stringify({
          type: 'sync',
          update: Array.from(Y.encodeStateAsUpdate(doc))
        }));
      }
      
      // Notify other users that someone joined
      broadcastToSession(sessionId, {
        type: 'user-joined',
        userId,
        username
      }, ws);
      
    } catch (error) {
      console.error('Error in join session:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to join session'
      }));
    }
  }
  
  // Handle leave session request
  function handleLeaveSession(ws: WebSocket, data: any) {
    const { sessionId, userId } = data;
    const userInfo = connectionUsers.get(ws);
    
    if (!userInfo) return;
    
    const connections = sessionConnections.get(sessionId);
    if (connections) {
      connections.delete(userId);
      
      // Notify others that user left
      broadcastToSession(sessionId, {
        type: 'user-left',
        userId,
        username: userInfo.username
      });
    }
  }
  
  // Broadcast message to all clients in a session except the sender
  function broadcastToSession(sessionId: number, message: any, exclude?: WebSocket) {
    const connections = sessionConnections.get(sessionId);
    if (!connections) return;
    
    const messageStr = JSON.stringify(message);
    
    connections.forEach((ws, _) => {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
  
  // Get or create a Y.js document for a session
  function getOrCreateSessionDoc(sessionId: number): Y.Doc {
    if (!documents.has(sessionId)) {
      documents.set(sessionId, new Y.Doc());
    }
    return documents.get(sessionId)!;
  }
  
  // Get or create a connections map for a session
  function getOrCreateSessionConnections(sessionId: number): Map<number, WebSocket> {
    if (!sessionConnections.has(sessionId)) {
      sessionConnections.set(sessionId, new Map());
    }
    return sessionConnections.get(sessionId)!;
  }
  
  return wss;
}