import express, { type Express, type Request, type Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";
import Stripe from "stripe";
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { insertTrackSchema, insertMessageSchema, insertStudioSessionSchema } from "@shared/schema";
import fetch from 'node-fetch';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Missing Stripe secret key. Payment processing will not work.");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Set up multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
(async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(path.join(uploadDir, "audio"), { recursive: true });
    await fs.mkdir(path.join(uploadDir, "images"), { recursive: true });
    await fs.mkdir(path.join(uploadDir, "documents"), { recursive: true });
  } catch (error) {
    console.error("Error creating upload directories:", error);
  }
})();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let dest = uploadDir;
      if (file.fieldname === 'audio') {
        dest = path.join(uploadDir, "audio");
      } else if (file.fieldname === 'image' || file.fieldname === 'coverArt') {
        dest = path.join(uploadDir, "images");
      } else if (file.fieldname === 'document') {
        dest = path.join(uploadDir, "documents");
      }
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: () => void) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is an athlete
const isAthlete = (req: Request, res: Response, next: () => void) => {
  if (req.isAuthenticated() && req.user.role === 'athlete') {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Athletes only" });
};

// Middleware to check if user is an admin
const isAdmin = (req: Request, res: Response, next: () => void) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admins only" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Basic check to ensure we're only serving media files
    const ext = path.extname(req.path).toLowerCase();
    const allowedExts = ['.mp3', '.wav', '.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    
    if (allowedExts.includes(ext)) {
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  }, express.static(uploadDir));

  // User routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords before sending
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:role", isAdmin, async (req, res) => {
    try {
      const { role } = req.params;
      const users = await storage.getUsersByRole(role);
      // Remove passwords before sending
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users/:id/update-role", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }
      
      const updatedUser = await storage.updateUser(parseInt(id), { role });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post("/api/users/:id/update-subscription", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { subscriptionTier } = req.body;
      
      // Only admins or the user themselves can update subscription
      if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      if (!subscriptionTier) {
        return res.status(400).json({ message: "Subscription tier is required" });
      }
      
      const updatedUser = await storage.updateUser(parseInt(id), { subscriptionTier });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Profile routes
  app.post("/api/profile/update", isAuthenticated, upload.single('profileImage'), async (req, res) => {
    try {
      const userData = req.body;
      
      // If password is being updated, hash it
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      // If there's a file upload, add the path
      if (req.file) {
        userData.profileImage = `/uploads/images/${req.file.filename}`;
      }
      
      const updatedUser = await storage.updateUser(req.user.id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Verification routes
  app.post("/api/verification/submit", isAuthenticated, upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Document is required" });
      }
      
      const { documentType } = req.body;
      if (!documentType) {
        return res.status(400).json({ message: "Document type is required" });
      }
      
      // If user is not already an athlete, update their role
      if (req.user.role !== 'athlete') {
        await storage.updateUser(req.user.id, { role: 'athlete' });
      }
      
      const verificationDoc = await storage.addVerificationDoc({
        userId: req.user.id,
        documentType,
        documentUrl: `/uploads/documents/${req.file.filename}`,
        status: 'pending'
      });
      
      res.status(201).json(verificationDoc);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit verification document" });
    }
  });

  app.get("/api/verification/status", isAuthenticated, async (req, res) => {
    try {
      const docs = await storage.getVerificationDocsByUserId(req.user.id);
      res.json({ 
        status: req.user.verificationStatus,
        documents: docs
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verification status" });
    }
  });

  app.get("/api/verification/pending", isAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getAllPendingVerifications();
      const results = await Promise.all(pendingUsers.map(async user => {
        const docs = await storage.getVerificationDocsByUserId(user.id);
        // Remove password from user
        const { password, ...userWithoutPassword } = user;
        return {
          user: userWithoutPassword,
          documents: docs
        };
      }));
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending verifications" });
    }
  });

  // Track routes
  app.post("/api/tracks/upload", isAthlete, upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'coverArt', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.audio || !files.audio[0]) {
        return res.status(400).json({ message: "Audio file is required" });
      }
      
      const trackData = req.body;
      
      // Create track object
      const trackInput = {
        title: trackData.title,
        artistId: req.user.id,
        genre: trackData.genre || 'other',
        audioUrl: `/uploads/audio/${files.audio[0].filename}`,
        coverArt: files.coverArt ? `/uploads/images/${files.coverArt[0].filename}` : undefined,
        duration: parseInt(trackData.duration) || 0,
        description: trackData.description,
        isPublished: trackData.isPublished === 'true'
      };
      
      // Validate with schema
      const validationResult = insertTrackSchema.safeParse(trackInput);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid track data", 
          errors: validationResult.error.format() 
        });
      }
      
      const track = await storage.createTrack(validationResult.data);
      res.status(201).json(track);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload track" });
    }
  });

  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tracks" });
    }
  });

  app.get("/api/tracks/artist/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tracks = await storage.getTracksByArtist(parseInt(id));
      
      // If user is not the artist and not an admin, only show published tracks
      if (!req.isAuthenticated() || (req.user.id !== parseInt(id) && req.user.role !== 'admin')) {
        const publishedTracks = tracks.filter(track => track.isPublished);
        return res.json(publishedTracks);
      }
      
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist tracks" });
    }
  });

  app.get("/api/tracks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const track = await storage.getTrack(parseInt(id));
      
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      
      // If track is not published, only the artist or admin can see it
      if (!track.isPublished && 
          (!req.isAuthenticated() || 
           (req.user.id !== track.artistId && req.user.role !== 'admin'))) {
        return res.status(403).json({ message: "Track not available" });
      }
      
      res.json(track);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch track" });
    }
  });

  app.post("/api/tracks/:id/play", async (req, res) => {
    try {
      const { id } = req.params;
      const track = await storage.incrementTrackPlays(parseInt(id));
      
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      
      res.json({ plays: track.plays });
    } catch (error) {
      res.status(500).json({ message: "Failed to record play" });
    }
  });

  app.post("/api/tracks/:id/update", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const track = await storage.getTrack(parseInt(id));
      
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      
      // Only the artist or admin can update the track
      if (req.user.id !== track.artistId && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedTrack = await storage.updateTrack(parseInt(id), req.body);
      res.json(updatedTrack);
    } catch (error) {
      res.status(500).json({ message: "Failed to update track" });
    }
  });

  // Message routes
  app.post("/api/messages/send", isAuthenticated, async (req, res) => {
    try {
      const messageData = {
        ...req.body,
        senderId: req.user.id
      };
      
      // Validate with schema
      const validationResult = insertMessageSchema.safeParse(messageData);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: validationResult.error.format() 
        });
      }
      
      const message = await storage.createMessage(validationResult.data);
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getMessagesByUser(req.user.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/conversation/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getConversation(req.user.id, parseInt(userId));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post("/api/messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const message = await storage.markMessageAsRead(parseInt(id));
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Only the receiver can mark a message as read
      if (message.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Studio session routes
  app.post("/api/studio/sessions", isAthlete, async (req, res) => {
    try {
      const sessionData = {
        ...req.body,
        userId: req.user.id
      };
      
      // Convert string dates to Date objects
      if (typeof sessionData.startTime === 'string') {
        sessionData.startTime = new Date(sessionData.startTime);
      }
      if (typeof sessionData.endTime === 'string') {
        sessionData.endTime = new Date(sessionData.endTime);
      }
      
      // Validate with schema
      const validationResult = insertStudioSessionSchema.safeParse(sessionData);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid session data", 
          errors: validationResult.error.format() 
        });
      }
      
      const session = await storage.createStudioSession(validationResult.data);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create studio session" });
    }
  });

  app.get("/api/studio/sessions", isAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getSessionsByUser(req.user.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch studio sessions" });
    }
  });

  app.post("/api/studio/sessions/:id/update", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const sessionId = parseInt(id);
      
      // Convert string dates to Date objects if present
      const updates = { ...req.body };
      if (typeof updates.startTime === 'string') {
        updates.startTime = new Date(updates.startTime);
      }
      if (typeof updates.endTime === 'string') {
        updates.endTime = new Date(updates.endTime);
      }
      
      const session = await storage.updateStudioSession(sessionId, updates);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Only the session owner can update it
      if (session.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update studio session" });
    }
  });

  app.delete("/api/studio/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const sessionId = parseInt(id);
      
      // Check ownership before deleting
      const session = await storage.getStudioSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Only the session owner or admin can delete it
      if (session.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteStudioSession(sessionId);
      
      if (success) {
        res.status(200).json({ message: "Session deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete session" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete studio session" });
    }
  });

  // Cloud sync routes
  app.post("/api/studio/projects/:projectId/sync", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.id;
      
      // Verify the project exists and belongs to the user
      const project = await storage.getStudioProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to sync this project' });
      }
      
      // Start the sync process
      const syncRecord = await storage.startProjectSync(projectId, userId);
      
      // In a real application, this would trigger an async job to upload to cloud storage
      // For now, we'll simulate the process completing successfully after a short delay
      setTimeout(async () => {
        const cloudUrl = `https://cloud-storage.example.com/projects/${projectId}/backup-${Date.now()}.json`;
        const syncHash = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        
        await storage.completeProjectSync(syncRecord.id, cloudUrl, syncHash);
      }, 2000);
      
      res.status(202).json({
        status: 'syncing',
        message: 'Project sync started',
        syncId: syncRecord.id
      });
    } catch (error) {
      console.error('Error starting project sync:', error);
      res.status(500).json({ error: 'Failed to start project sync' });
    }
  });
  
  app.get("/api/studio/projects/:projectId/sync", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.id;
      
      // Get the latest sync status for this project
      const syncStatus = await storage.getProjectSyncStatus(projectId);
      
      if (!syncStatus) {
        return res.status(404).json({ error: 'No sync record found for this project' });
      }
      
      // Verify ownership
      if (syncStatus.userId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to view this sync record' });
      }
      
      res.json(syncStatus);
    } catch (error) {
      console.error('Error getting project sync status:', error);
      res.status(500).json({ error: 'Failed to get project sync status' });
    }
  });
  
  app.get("/api/user/syncs", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get all sync records for this user
      const syncs = await storage.getProjectSyncsByUser(userId);
      
      res.json(syncs);
    } catch (error) {
      console.error('Error getting user sync records:', error);
      res.status(500).json({ error: 'Failed to get user sync records' });
    }
  });

  // Stripe payment endpoints
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const { tier } = req.body;
      
      // Set amount based on subscription tier
      let amount = 499; // Default to Bronze tier price ($4.99)
      if (tier === 'silver') {
        amount = 999; // $9.99
      } else if (tier === 'gold') {
        amount = 1499; // $14.99
      }
      
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        // Store any additional information in metadata
        metadata: {
          userId: req.user.id.toString(),
          subscriptionTier: tier
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Handle successful subscription payments
  app.post("/api/subscription/confirm", isAuthenticated, async (req, res) => {
    try {
      const { paymentIntentId, tier } = req.body;
      
      if (!paymentIntentId || !tier) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // Verify the payment intent exists and is successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment has not been completed" });
      }
      
      // Update the user's subscription tier
      const updatedUser = await storage.updateUser(req.user.id, { subscriptionTier: tier });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return success response with updated user (minus password)
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI Generation routes
  app.post("/api/ai/generate", async (req, res) => {
    try {
      // Check if AI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI generation is currently unavailable. Missing API key." });
      }

      const { type, prompt, parameters } = req.body;

      if (!type || !parameters) {
        return res.status(400).json({ message: "Type and parameters are required" });
      }

      console.log(`AI Generation request: ${type}`, { prompt, parameters });

      // Different handling based on generation type
      let aiResponse;
      let messageContent;

      // Build OpenAI prompt based on generation type
      switch (type) {
        case 'music':
          messageContent = `Generate a ${parameters.genre} music track with ${parameters.mood} mood, in the key of ${parameters.key} ${parameters.scale}. BPM: ${parameters.tempo}. Duration: ${parameters.duration} seconds. Prompt: ${prompt}`;
          break;
        case 'drums':
          messageContent = `Generate a drum beat in ${parameters.genre} style with complexity level ${parameters.complexity}. BPM: ${parameters.tempo}. Duration: ${parameters.duration} seconds.`;
          break;
        case 'melody':
          messageContent = `Generate a melody in the key of ${parameters.key} ${parameters.scale} with BPM: ${parameters.tempo}. Duration: ${parameters.duration} seconds. Prompt: ${prompt}`;
          break;
        case 'vocal':
          messageContent = `Generate vocal audio in style ${parameters.genre}. Duration: ${parameters.duration} seconds. Prompt: ${prompt}`;
          break;
        case 'speech':
          messageContent = `Generate speech audio using voice ${parameters.model}. Speed: ${parameters.tempo}. Content: ${prompt}`;
          break;
        case 'sfx':
          messageContent = `Generate a sound effect in category ${parameters.genre}. Duration: ${parameters.duration} seconds. Description: ${prompt}`;
          break;
        default:
          return res.status(400).json({ message: "Invalid generation type" });
      }

      // Call OpenAI API with the appropriate prompt
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o", // Use the latest model that supports audio generation
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that helps with audio generation. Provide detailed audio generation instructions."
            },
            {
              role: "user",
              content: messageContent
            }
          ],
          max_tokens: 1000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("OpenAI API error:", data);
        return res.status(500).json({ message: "Error from AI service", error: data });
      }

      aiResponse = data.choices[0].message.content;
      
      // In a real implementation, we would use this response to generate actual audio
      // For now, we'll just return the text description from OpenAI
      
      res.json({
        success: true,
        generationType: type,
        description: aiResponse,
        // In a real implementation, we'd include a URL to the generated audio file
        // audioUrl: `/uploads/generated/${filename}.wav`,
      });
    } catch (error: any) {
      console.error("AI generation error:", error);
      res.status(500).json({ message: "Failed to generate AI content", error: error.message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time collaboration
  if (process.env.NODE_ENV !== 'test') {
    const { setupWebSocketServer } = await import('./webSocketServer');
    setupWebSocketServer(httpServer);
  }
  
  return httpServer;
}
