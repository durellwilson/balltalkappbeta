import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for different types
export const userRoleEnum = pgEnum('user_role', ['fan', 'athlete', 'admin']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['bronze', 'silver', 'gold', 'none']);
export const trackGenreEnum = pgEnum('track_genre', ['hip-hop', 'r&b', 'pop', 'rock', 'electronic', 'other']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default('fan'),
  bio: text("bio"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  verificationStatus: verificationStatusEnum("verification_status").default('pending'),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default('none'),
  league: text("league"),
  team: text("team"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

// Verification documents for athletes
export const verificationDocs = pgTable("verification_docs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type").notNull(),
  documentUrl: text("document_url").notNull(),
  status: verificationStatusEnum("status").default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  notes: text("notes"),
});

// Music tracks uploaded by athletes
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artistId: integer("artist_id").notNull().references(() => users.id),
  genre: trackGenreEnum("genre").notNull().default('other'),
  audioUrl: text("audio_url").notNull(),
  coverArt: text("cover_art"),
  releaseDate: timestamp("release_date").defaultNow(),
  duration: integer("duration"),
  plays: integer("plays").default(0),
  description: text("description"),
  isPublished: boolean("is_published").default(false),
});

// Messages between users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Studio sessions scheduled by athletes
// Enum for mastering presets
export const masteringPresetEnum = pgEnum('mastering_preset', ['warm', 'balanced', 'open', 'custom']);

export const studioSessions = pgTable("studio_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  collaborators: text("collaborators"),
  isLive: boolean("is_live").default(false),
  sessionCode: text("session_code"),
});

// Project files for studio sessions
export const studioProjects = pgTable("studio_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: integer("session_id").references(() => studioSessions.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  bpm: integer("bpm").default(120),
  key: text("key"),
  status: text("status").default('draft'),
  version: integer("version").default(1)
});

// Audio tracks within a project
export const projectTracks = pgTable("project_tracks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => studioProjects.id),
  name: text("name").notNull(),
  audioUrl: text("audio_url").notNull(),
  waveformData: text("waveform_data"),
  position: integer("position").default(0),
  muted: boolean("muted").default(false),
  solo: boolean("solo").default(false),
  volume: integer("volume").default(100),
  pan: integer("pan").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mastering settings
export const masteringSettings = pgTable("mastering_settings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => studioProjects.id),
  preset: masteringPresetEnum("preset").default('balanced'),
  eqSettings: text("eq_settings"), // Stored as JSON string
  compressorSettings: text("compressor_settings"), // Stored as JSON string
  limiterSettings: text("limiter_settings"), // Stored as JSON string
  lufsTarget: integer("lufs_target").default(-14), // Target loudness in LUFS
  referenceTrackUrl: text("reference_track_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Track comments for collaboration
export const trackComments = pgTable("track_comments", {
  id: serial("id").primaryKey(),
  projectTrackId: integer("project_track_id").notNull().references(() => projectTracks.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: integer("timestamp").notNull(), // Position in ms where comment is placed
  createdAt: timestamp("created_at").defaultNow(),
});

// Create the insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertVerificationDocSchema = createInsertSchema(verificationDocs)
  .omit({ id: true, createdAt: true });

export const insertTrackSchema = createInsertSchema(tracks)
  .omit({ id: true, plays: true, releaseDate: true });

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, isRead: true, createdAt: true });

export const insertStudioSessionSchema = createInsertSchema(studioSessions)
  .omit({ id: true });

export const insertStudioProjectSchema = createInsertSchema(studioProjects)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertProjectTrackSchema = createInsertSchema(projectTracks)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertMasteringSettingsSchema = createInsertSchema(masteringSettings)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertTrackCommentSchema = createInsertSchema(trackComments)
  .omit({ id: true, createdAt: true });

// Define types from the schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertVerificationDoc = z.infer<typeof insertVerificationDocSchema>;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertStudioSession = z.infer<typeof insertStudioSessionSchema>;
export type InsertStudioProject = z.infer<typeof insertStudioProjectSchema>;
export type InsertProjectTrack = z.infer<typeof insertProjectTrackSchema>;
export type InsertMasteringSettings = z.infer<typeof insertMasteringSettingsSchema>;
export type InsertTrackComment = z.infer<typeof insertTrackCommentSchema>;

export type User = typeof users.$inferSelect;
export type VerificationDoc = typeof verificationDocs.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type StudioSession = typeof studioSessions.$inferSelect;
export type StudioProject = typeof studioProjects.$inferSelect;
export type ProjectTrack = typeof projectTracks.$inferSelect;
export type MasteringSettings = typeof masteringSettings.$inferSelect;
export type TrackComment = typeof trackComments.$inferSelect;

// Extended schemas for login
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;
