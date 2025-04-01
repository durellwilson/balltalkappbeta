import {
  users, tracks, messages, studioSessions, verificationDocs, studioProjects, projectTracks, masteringSettings, trackComments,
  type User, type Track, type Message, type StudioSession, type VerificationDoc, type StudioProject, type ProjectTrack, type MasteringSettings, type TrackComment,
  type InsertUser, type InsertTrack, type InsertMessage, type InsertStudioSession, type InsertVerificationDoc, 
  type InsertStudioProject, type InsertProjectTrack, type InsertMasteringSettings, type InsertTrackComment
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define the interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Verification operations
  addVerificationDoc(doc: InsertVerificationDoc): Promise<VerificationDoc>;
  getVerificationDocsByUserId(userId: number): Promise<VerificationDoc[]>;
  updateVerificationStatus(userId: number, status: string): Promise<User | undefined>;
  getAllPendingVerifications(): Promise<User[]>;
  
  // Track operations
  createTrack(track: InsertTrack): Promise<Track>;
  getTrack(id: number): Promise<Track | undefined>;
  getTracksByArtist(artistId: number): Promise<Track[]>;
  getAllTracks(): Promise<Track[]>;
  updateTrack(id: number, track: Partial<Track>): Promise<Track | undefined>;
  incrementTrackPlays(id: number): Promise<Track | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Studio session operations
  createStudioSession(session: InsertStudioSession): Promise<StudioSession>;
  getSessionsByUser(userId: number): Promise<StudioSession[]>;
  updateStudioSession(id: number, session: Partial<StudioSession>): Promise<StudioSession | undefined>;
  deleteStudioSession(id: number): Promise<boolean>;
  startLiveSession(id: number, sessionCode: string): Promise<StudioSession | undefined>;
  endLiveSession(id: number): Promise<StudioSession | undefined>;
  getLiveSessionByCode(sessionCode: string): Promise<StudioSession | undefined>;
  
  // Studio Project operations
  createStudioProject(project: InsertStudioProject): Promise<StudioProject>;
  getStudioProject(id: number): Promise<StudioProject | undefined>;
  getStudioProjectsByUser(userId: number): Promise<StudioProject[]>;
  getStudioProjectsBySession(sessionId: number): Promise<StudioProject[]>;
  updateStudioProject(id: number, project: Partial<StudioProject>): Promise<StudioProject | undefined>;
  deleteStudioProject(id: number): Promise<boolean>;
  
  // Project Track operations
  createProjectTrack(track: InsertProjectTrack): Promise<ProjectTrack>;
  getProjectTrack(id: number): Promise<ProjectTrack | undefined>;
  getProjectTracksByProject(projectId: number): Promise<ProjectTrack[]>;
  updateProjectTrack(id: number, track: Partial<ProjectTrack>): Promise<ProjectTrack | undefined>;
  deleteProjectTrack(id: number): Promise<boolean>;
  
  // Mastering operations
  saveMasteringSettings(settings: InsertMasteringSettings): Promise<MasteringSettings>;
  getMasteringSettings(projectId: number): Promise<MasteringSettings | undefined>;
  updateMasteringSettings(id: number, settings: Partial<MasteringSettings>): Promise<MasteringSettings | undefined>;
  
  // Track comments
  addTrackComment(comment: InsertTrackComment): Promise<TrackComment>;
  getTrackComments(projectTrackId: number): Promise<TrackComment[]>;
  deleteTrackComment(id: number): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tracks: Map<number, Track>;
  private messages: Map<number, Message>;
  private studioSessions: Map<number, StudioSession>;
  private verificationDocs: Map<number, VerificationDoc>;
  private studioProjects: Map<number, StudioProject>;
  private projectTracks: Map<number, ProjectTrack>;
  private masteringSettings: Map<number, MasteringSettings>;
  private trackComments: Map<number, TrackComment>;
  
  sessionStore: session.SessionStore;
  
  currentUserId: number;
  currentTrackId: number;
  currentMessageId: number;
  currentSessionId: number;
  currentVerificationDocId: number;
  currentStudioProjectId: number;
  currentProjectTrackId: number;
  currentMasteringSettingsId: number;
  currentTrackCommentId: number;

  constructor() {
    this.users = new Map();
    this.tracks = new Map();
    this.messages = new Map();
    this.studioSessions = new Map();
    this.verificationDocs = new Map();
    this.studioProjects = new Map();
    this.projectTracks = new Map();
    this.masteringSettings = new Map();
    this.trackComments = new Map();
    
    this.currentUserId = 1;
    this.currentTrackId = 1;
    this.currentMessageId = 1;
    this.currentSessionId = 1;
    this.currentVerificationDocId = 1;
    this.currentStudioProjectId = 1;
    this.currentProjectTrackId = 1;
    this.currentMasteringSettingsId = 1;
    this.currentTrackCommentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize some admin users
    this.createUser({
      username: 'admin',
      password: 'admin123', // This will be hashed in auth.ts
      email: 'admin@athletesound.com',
      fullName: 'System Admin',
      role: 'admin',
      bio: 'Platform administrator',
      verificationStatus: 'approved',
      subscriptionTier: 'none'
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    
    // Ensure all required fields have values
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName,
      role: insertUser.role || "fan",
      bio: insertUser.bio || null,
      profileImage: insertUser.profileImage || null,
      createdAt: now,
      updatedAt: now,
      verificationStatus: insertUser.verificationStatus || "pending",
      subscriptionTier: insertUser.subscriptionTier || "none",
      league: insertUser.league || null,
      team: insertUser.team || null,
      stripeCustomerId: insertUser.stripeCustomerId || null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId || null
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      ...userData,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Verification operations
  async addVerificationDoc(doc: InsertVerificationDoc): Promise<VerificationDoc> {
    const id = this.currentVerificationDocId++;
    const now = new Date();
    const verificationDoc: VerificationDoc = {
      ...doc,
      id,
      createdAt: now
    };
    this.verificationDocs.set(id, verificationDoc);
    return verificationDoc;
  }

  async getVerificationDocsByUserId(userId: number): Promise<VerificationDoc[]> {
    return Array.from(this.verificationDocs.values())
      .filter(doc => doc.userId === userId);
  }

  async updateVerificationStatus(userId: number, status: string): Promise<User | undefined> {
    return this.updateUser(userId, { verificationStatus: status as any });
  }

  async getAllPendingVerifications(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === 'athlete' && user.verificationStatus === 'pending');
  }

  // Track operations
  async createTrack(track: InsertTrack): Promise<Track> {
    const id = this.currentTrackId++;
    const now = new Date();
    const newTrack: Track = {
      ...track,
      id,
      releaseDate: now,
      plays: 0
    };
    this.tracks.set(id, newTrack);
    return newTrack;
  }

  async getTrack(id: number): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async getTracksByArtist(artistId: number): Promise<Track[]> {
    return Array.from(this.tracks.values())
      .filter(track => track.artistId === artistId);
  }

  async getAllTracks(): Promise<Track[]> {
    return Array.from(this.tracks.values())
      .filter(track => track.isPublished);
  }

  async updateTrack(id: number, trackData: Partial<Track>): Promise<Track | undefined> {
    const track = this.tracks.get(id);
    if (!track) return undefined;
    
    const updatedTrack = { ...track, ...trackData };
    this.tracks.set(id, updatedTrack);
    return updatedTrack;
  }

  async incrementTrackPlays(id: number): Promise<Track | undefined> {
    const track = this.tracks.get(id);
    if (!track) return undefined;
    
    const updatedTrack = { 
      ...track, 
      plays: (track.plays || 0) + 1 
    };
    this.tracks.set(id, updatedTrack);
    return updatedTrack;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const newMessage: Message = {
      ...message,
      id,
      isRead: false,
      createdAt: now
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.receiverId === userId || msg.senderId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === user1Id && msg.receiverId === user2Id) ||
        (msg.senderId === user2Id && msg.receiverId === user1Id)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Studio session operations
  async createStudioSession(sessionData: InsertStudioSession): Promise<StudioSession> {
    const id = this.currentSessionId++;
    const newSession: StudioSession = {
      ...sessionData,
      id
    };
    this.studioSessions.set(id, newSession);
    return newSession;
  }

  async getSessionsByUser(userId: number): Promise<StudioSession[]> {
    return Array.from(this.studioSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async updateStudioSession(id: number, sessionData: Partial<StudioSession>): Promise<StudioSession | undefined> {
    const session = this.studioSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...sessionData };
    this.studioSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteStudioSession(id: number): Promise<boolean> {
    return this.studioSessions.delete(id);
  }
  
  async startLiveSession(id: number, sessionCode: string): Promise<StudioSession | undefined> {
    const session = this.studioSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      isLive: true,
      sessionCode
    };
    this.studioSessions.set(id, updatedSession);
    return updatedSession;
  }
  
  async endLiveSession(id: number): Promise<StudioSession | undefined> {
    const session = this.studioSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      isLive: false,
      sessionCode: null
    };
    this.studioSessions.set(id, updatedSession);
    return updatedSession;
  }
  
  async getLiveSessionByCode(sessionCode: string): Promise<StudioSession | undefined> {
    return Array.from(this.studioSessions.values())
      .find(session => session.sessionCode === sessionCode && session.isLive === true);
  }
  
  // Studio Project operations
  async createStudioProject(project: InsertStudioProject): Promise<StudioProject> {
    const id = this.currentStudioProjectId++;
    const now = new Date();
    const newProject: StudioProject = {
      ...project,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.studioProjects.set(id, newProject);
    return newProject;
  }
  
  async getStudioProject(id: number): Promise<StudioProject | undefined> {
    return this.studioProjects.get(id);
  }
  
  async getStudioProjectsByUser(userId: number): Promise<StudioProject[]> {
    return Array.from(this.studioProjects.values())
      .filter(project => project.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getStudioProjectsBySession(sessionId: number): Promise<StudioProject[]> {
    return Array.from(this.studioProjects.values())
      .filter(project => project.sessionId === sessionId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async updateStudioProject(id: number, projectData: Partial<StudioProject>): Promise<StudioProject | undefined> {
    const project = this.studioProjects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { 
      ...project, 
      ...projectData,
      updatedAt: new Date()
    };
    this.studioProjects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteStudioProject(id: number): Promise<boolean> {
    return this.studioProjects.delete(id);
  }
  
  // Project Track operations
  async createProjectTrack(track: InsertProjectTrack): Promise<ProjectTrack> {
    const id = this.currentProjectTrackId++;
    const now = new Date();
    const newTrack: ProjectTrack = {
      ...track,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.projectTracks.set(id, newTrack);
    return newTrack;
  }
  
  async getProjectTrack(id: number): Promise<ProjectTrack | undefined> {
    return this.projectTracks.get(id);
  }
  
  async getProjectTracksByProject(projectId: number): Promise<ProjectTrack[]> {
    return Array.from(this.projectTracks.values())
      .filter(track => track.projectId === projectId)
      .sort((a, b) => a.position - b.position);
  }
  
  async updateProjectTrack(id: number, trackData: Partial<ProjectTrack>): Promise<ProjectTrack | undefined> {
    const track = this.projectTracks.get(id);
    if (!track) return undefined;
    
    const updatedTrack = { 
      ...track, 
      ...trackData,
      updatedAt: new Date()
    };
    this.projectTracks.set(id, updatedTrack);
    return updatedTrack;
  }
  
  async deleteProjectTrack(id: number): Promise<boolean> {
    return this.projectTracks.delete(id);
  }
  
  // Mastering operations
  async saveMasteringSettings(settings: InsertMasteringSettings): Promise<MasteringSettings> {
    const id = this.currentMasteringSettingsId++;
    const now = new Date();
    const newSettings: MasteringSettings = {
      ...settings,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.masteringSettings.set(id, newSettings);
    return newSettings;
  }
  
  async getMasteringSettings(projectId: number): Promise<MasteringSettings | undefined> {
    return Array.from(this.masteringSettings.values())
      .find(settings => settings.projectId === projectId);
  }
  
  async updateMasteringSettings(id: number, settingsData: Partial<MasteringSettings>): Promise<MasteringSettings | undefined> {
    const settings = this.masteringSettings.get(id);
    if (!settings) return undefined;
    
    const updatedSettings = { 
      ...settings, 
      ...settingsData,
      updatedAt: new Date()
    };
    this.masteringSettings.set(id, updatedSettings);
    return updatedSettings;
  }
  
  // Track comments
  async addTrackComment(comment: InsertTrackComment): Promise<TrackComment> {
    const id = this.currentTrackCommentId++;
    const now = new Date();
    const newComment: TrackComment = {
      ...comment,
      id,
      createdAt: now
    };
    this.trackComments.set(id, newComment);
    return newComment;
  }
  
  async getTrackComments(projectTrackId: number): Promise<TrackComment[]> {
    return Array.from(this.trackComments.values())
      .filter(comment => comment.projectTrackId === projectTrackId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  
  async deleteTrackComment(id: number): Promise<boolean> {
    return this.trackComments.delete(id);
  }
}

export const storage = new MemStorage();
