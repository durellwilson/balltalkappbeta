import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import * as Y from 'yjs';
import { storage } from './storage';

// Map to store active document collections by studioSessionId
const documents = new Map<number, Y.Doc>();
// Map to store active connections by studioSessionId
const connections = new Map<number, Set<WebSocket>>();

// Initialize the WebSocket server
export function setupYjs(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    // Initial connection without session context
    let sessionId: number | null = null;
    
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Join a specific studio session
        if (data.type === 'join-session') {
          sessionId = parseInt(data.sessionId);
          
          // Validate the session exists
          const session = await storage.getLiveSessionByCode(data.sessionCode);
          if (!session || session.id !== sessionId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid session or session code' 
            }));
            return;
          }
          
          // Get or create the Y.Doc for this session
          let doc = documents.get(sessionId);
          if (!doc) {
            doc = new Y.Doc();
            documents.set(sessionId, doc);
          }
          
          // Get or create the connections set for this session
          let sessionConnections = connections.get(sessionId);
          if (!sessionConnections) {
            sessionConnections = new Set();
            connections.set(sessionId, sessionConnections);
          }
          
          // Add this connection to the session
          sessionConnections.add(ws);
          
          // Send confirmation and initial state
          const state = Y.encodeStateAsUpdate(doc);
          ws.send(JSON.stringify({ 
            type: 'joined', 
            sessionId,
            state: Array.from(state) // Convert UInt8Array to regular array for JSON
          }));
          
          // Notify other clients that a new user joined
          sessionConnections.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ 
                type: 'user-joined', 
                userId: data.userId,
                username: data.username
              }));
            }
          });
        }
        // Handle Y.js document updates
        else if (data.type === 'sync-update' && sessionId) {
          const doc = documents.get(sessionId);
          if (!doc) return;
          
          // Apply the update
          Y.applyUpdate(doc, new Uint8Array(data.update));
          
          // Broadcast to all other clients in the session
          const sessionConnections = connections.get(sessionId);
          if (sessionConnections) {
            sessionConnections.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'sync-update',
                  update: data.update
                }));
              }
            });
          }
        }
        // Handle track changes (play, pause, etc.)
        else if (data.type === 'track-control' && sessionId) {
          const sessionConnections = connections.get(sessionId);
          if (sessionConnections) {
            sessionConnections.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'track-control',
                  action: data.action,
                  trackId: data.trackId,
                  position: data.position,
                  userId: data.userId
                }));
              }
            });
          }
        }
        // Handle track comments
        else if (data.type === 'track-comment' && sessionId) {
          // Store comment in the database
          const comment = await storage.addTrackComment({
            projectTrackId: data.trackId,
            userId: data.userId,
            content: data.content,
            timestamp: data.timestamp
          });
          
          // Broadcast to all clients in the session
          const sessionConnections = connections.get(sessionId);
          if (sessionConnections) {
            sessionConnections.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'track-comment',
                  comment
                }));
              }
            });
          }
        }
        // Handle chat messages
        else if (data.type === 'chat-message' && sessionId) {
          const sessionConnections = connections.get(sessionId);
          if (sessionConnections) {
            sessionConnections.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'chat-message',
                  userId: data.userId,
                  username: data.username,
                  message: data.message,
                  timestamp: new Date().toISOString()
                }));
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });
    
    ws.on('close', () => {
      // Remove this connection from all sessions it was part of
      if (sessionId) {
        const sessionConnections = connections.get(sessionId);
        if (sessionConnections) {
          sessionConnections.delete(ws);
          
          // If the session has no more connections, clean up the Y.doc
          if (sessionConnections.size === 0) {
            connections.delete(sessionId);
            documents.delete(sessionId);
          } else {
            // Notify remaining users that someone left
            sessionConnections.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'user-left',
                  sessionId
                }));
              }
            });
          }
        }
      }
    });
  });
  
  console.log('WebSocket server is running');
  return wss;
}