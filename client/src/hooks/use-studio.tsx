import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import audioProcessor from '@/lib/audioProcessor';
import StudioCollaboration from '@/lib/studioCollaboration';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook to manage the audio processing and real-time collaboration in the studio
 */
export const useStudio = (projectId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for tracks
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  
  // State for transport
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  
  // State for effects panel
  const [showEffects, setShowEffects] = useState(false);
  const [eqSettings, setEqSettings] = useState({ low: 0, mid: 0, high: 0 });
  const [compressorSettings, setCompressorSettings] = useState({
    threshold: -24,
    ratio: 4,
    attack: 0.003,
    release: 0.25
  });
  const [lufsTarget, setLufsTarget] = useState(-14);
  
  // State for AI mastering
  const [masteringGenre, setMasteringGenre] = useState<string>('balanced');
  const [isMastering, setIsMastering] = useState(false);
  
  // State for collaboration
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // State for recording
  const [isRecording, setIsRecording] = useState(false);
  
  // References
  const collaborationRef = useRef<StudioCollaboration | null>(null);
  const intervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  /**
   * Initialize audio context and collaboration system
   */
  useEffect(() => {
    const initStudio = async () => {
      try {
        // Initialize audio processor
        await audioProcessor.initialize();
        
        // Set up collaboration if user is authenticated
        if (user && projectId) {
          const collaboration = new StudioCollaboration(
            projectId.toString(),
            user.id.toString(),
            user.username
          );
          
          // Set up collaboration event listeners
          collaboration.onTrackUpdate(handleTrackUpdate);
          collaboration.onMixerUpdate(handleMixerUpdate);
          collaboration.onMasterUpdate(handleMasterUpdate);
          collaboration.onMessage(handleNewMessage);
          collaboration.onUserJoin(handleUserJoin);
          collaboration.onUserLeave(handleUserLeave);
          
          // Store collaboration instance
          collaborationRef.current = collaboration;
          
          // Load initial data
          const initialTracks = collaboration.getTracksData();
          if (Object.keys(initialTracks).length > 0) {
            const tracksArray = Object.values(initialTracks);
            setTracks(tracksArray);
            
            // Create audio tracks for existing tracks
            tracksArray.forEach((track: any) => {
              if (track.audioUrl) {
                const audioTrack = audioProcessor.createTrack(track.id);
                audioTrack.loadAudio(track.audioUrl).catch(console.error);
              }
            });
          }
          
          // Load initial messages
          const initialMessages = collaboration.getMessages();
          setMessages(initialMessages);
          
          // Load active collaborators
          const activeUsers = collaboration.getActiveUsers();
          setCollaborators(activeUsers);
          
          // Toast notification
          toast({
            title: "Studio Connected",
            description: "Real-time collaboration activated",
          });
        }
      } catch (error) {
        console.error('Failed to initialize studio:', error);
        toast({
          variant: "destructive",
          title: "Studio Initialization Failed",
          description: "Could not initialize the audio engine",
        });
      }
    };
    
    initStudio();
    
    // Clean up on unmount
    return () => {
      // Stop audio and clear timers
      audioProcessor.stop();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Disconnect collaboration
      if (collaborationRef.current) {
        collaborationRef.current.destroy();
      }
    };
  }, [projectId, user, toast]);
  
  /**
   * Transport control: Play
   */
  const play = useCallback(() => {
    audioProcessor.play();
    setIsPlaying(true);
    
    // Update current time regularly
    intervalRef.current = window.setInterval(() => {
      // This would normally come from Tone.Transport.seconds
      setCurrentTime(prev => prev + 0.1);
    }, 100);
    
  }, []);
  
  /**
   * Transport control: Pause
   */
  const pause = useCallback(() => {
    audioProcessor.pause();
    setIsPlaying(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  /**
   * Transport control: Stop
   */
  const stop = useCallback(() => {
    audioProcessor.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  /**
   * Set BPM (Beats Per Minute)
   */
  const updateBpm = useCallback((newBpm: number) => {
    audioProcessor.setBpm(newBpm);
    setBpm(newBpm);
    
    // Update collaboration if available
    if (collaborationRef.current) {
      collaborationRef.current.updateMasterSettings({ bpm: newBpm });
    }
  }, []);
  
  /**
   * Add a new track
   */
  const addTrack = useCallback(async (trackData: any) => {
    const trackId = Date.now(); // Simple unique ID
    
    // Create audio track
    const audioTrack = audioProcessor.createTrack(trackId);
    
    // Add track to state
    const newTrack = {
      id: trackId,
      name: trackData.name || `Track ${tracks.length + 1}`,
      color: trackData.color || getRandomColor(),
      waveform: [] // Will be populated when audio is loaded
    };
    
    setTracks(prev => [...prev, newTrack]);
    
    // Add to collaboration if available
    if (collaborationRef.current) {
      collaborationRef.current.addTrack(newTrack);
    }
    
    return trackId;
  }, [tracks]);
  
  /**
   * Delete a track
   */
  const deleteTrack = useCallback((trackId: number) => {
    // Remove from audio processor
    audioProcessor.removeTrack(trackId);
    
    // Remove from state
    setTracks(prev => prev.filter(track => track.id !== trackId));
    
    // Remove from selected track if needed
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }
    
    // Remove from collaboration if available
    if (collaborationRef.current) {
      collaborationRef.current.removeTrack(String(trackId));
    }
  }, [selectedTrackId]);
  
  /**
   * Import audio file to a track
   */
  const importAudioToTrack = useCallback(async (trackId: number, file: File) => {
    try {
      // Get or create track
      let audioTrack = audioProcessor.getTrack(trackId);
      if (!audioTrack) {
        audioTrack = audioProcessor.createTrack(trackId);
      }
      
      // Load audio file
      await audioTrack.loadAudioFile(file);
      
      // Get waveform data
      const waveform = audioTrack.getFullWaveform();
      
      // Create a blob URL for collaboration
      // In a real app, this would upload to a server and get a permanent URL
      const audioUrl = URL.createObjectURL(file);
      
      // Update track in state
      setTracks(prev => prev.map(track => 
        track.id === trackId 
          ? { ...track, waveform, audioUrl, fileName: file.name } 
          : track
      ));
      
      // Update collaboration if available
      if (collaborationRef.current) {
        collaborationRef.current.updateTrack(String(trackId), { 
          waveform, 
          audioUrl,
          fileName: file.name 
        });
      }
      
      toast({
        title: "Audio Imported",
        description: `${file.name} added to track`,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to import audio:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Could not import audio file",
      });
      return false;
    }
  }, [toast]);
  
  /**
   * Start recording on a track
   */
  const startRecording = useCallback(async (trackId: number) => {
    try {
      // Get or create track
      let audioTrack = audioProcessor.getTrack(trackId);
      if (!audioTrack) {
        audioTrack = audioProcessor.createTrack(trackId);
      }
      
      // Start recording
      await audioTrack.startRecording();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Recording audio from microphone",
      });
      
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        variant: "destructive",
        title: "Recording Failed",
        description: "Could not access microphone",
      });
      
      return false;
    }
  }, [toast]);
  
  /**
   * Stop recording on a track
   */
  const stopRecording = useCallback(async (trackId: number) => {
    try {
      const audioTrack = audioProcessor.getTrack(trackId);
      if (!audioTrack) return false;
      
      // Stop recording
      await audioTrack.stopRecording();
      setIsRecording(false);
      
      // Get waveform data
      const waveform = audioTrack.getFullWaveform();
      
      // In a real app, this would create a proper audio file
      // For now, we'll use a placeholder
      const recordingName = `Recording ${new Date().toISOString()}`;
      
      // Update track in state
      setTracks(prev => prev.map(track => 
        track.id === trackId 
          ? { ...track, waveform, fileName: recordingName } 
          : track
      ));
      
      // Update collaboration if available
      if (collaborationRef.current) {
        collaborationRef.current.updateTrack(String(trackId), { 
          waveform,
          fileName: recordingName 
        });
      }
      
      toast({
        title: "Recording Stopped",
        description: "Audio recorded successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      
      toast({
        variant: "destructive",
        title: "Recording Failed",
        description: "Could not process recorded audio",
      });
      
      return false;
    }
  }, [toast]);
  
  /**
   * Update track volume
   */
  const updateTrackVolume = useCallback((trackId: number, volume: number) => {
    const audioTrack = audioProcessor.getTrack(trackId);
    if (audioTrack) {
      audioTrack.setVolume(volume);
    }
    
    // Update collaboration if available
    if (collaborationRef.current) {
      collaborationRef.current.updateMixerSettings(String(trackId), { volume });
    }
  }, []);
  
  /**
   * Update track panning
   */
  const updateTrackPan = useCallback((trackId: number, pan: number) => {
    const audioTrack = audioProcessor.getTrack(trackId);
    if (audioTrack) {
      audioTrack.setPan(pan);
    }
    
    // Update collaboration if available
    if (collaborationRef.current) {
      collaborationRef.current.updateMixerSettings(String(trackId), { pan });
    }
  }, []);
  
  /**
   * Mute/unmute track
   */
  const toggleTrackMute = useCallback((trackId: number) => {
    const audioTrack = audioProcessor.getTrack(trackId);
    if (audioTrack) {
      const isMuted = !audioTrack.isMuted();
      audioTrack.setMuted(isMuted);
      
      // Update tracks in state
      setTracks(prev => prev.map(track => 
        track.id === trackId 
          ? { ...track, muted: isMuted } 
          : track
      ));
      
      // Update collaboration if available
      if (collaborationRef.current) {
        collaborationRef.current.updateMixerSettings(String(trackId), { muted: isMuted });
      }
    }
  }, []);
  
  /**
   * Solo/unsolo track
   */
  const toggleTrackSolo = useCallback((trackId: number) => {
    const audioTrack = audioProcessor.getTrack(trackId);
    if (audioTrack) {
      const isSoloed = !audioTrack.isSoloed();
      audioTrack.setSolo(isSoloed);
      
      // Update tracks in state
      setTracks(prev => prev.map(track => 
        track.id === trackId 
          ? { ...track, soloed: isSoloed } 
          : track
      ));
      
      // Update other tracks (if one track is soloed, all others should be muted)
      if (isSoloed) {
        tracks.forEach(track => {
          if (track.id !== trackId) {
            const otherTrack = audioProcessor.getTrack(track.id);
            if (otherTrack) {
              otherTrack.setMuted(true);
            }
          }
        });
      } else {
        // If no tracks are soloed anymore, unmute all
        const anyTrackSoloed = tracks.some(track => track.id !== trackId && track.soloed);
        if (!anyTrackSoloed) {
          tracks.forEach(track => {
            const otherTrack = audioProcessor.getTrack(track.id);
            if (otherTrack) {
              otherTrack.setMuted(false);
            }
          });
        }
      }
      
      // Update collaboration if available
      if (collaborationRef.current) {
        collaborationRef.current.updateMixerSettings(String(trackId), { soloed: isSoloed });
      }
    }
  }, [tracks]);
  
  /**
   * Update EQ settings
   */
  const updateEQ = useCallback((low: number, mid: number, high: number) => {
    audioProcessor.setEQ(low, mid, high);
    setEqSettings({ low, mid, high });
    
    // Update collaboration if available
    if (collaborationRef.current) {
      collaborationRef.current.updateMasterSettings({ 
        eq: { low, mid, high } 
      });
    }
  }, []);
  
  /**
   * Update compressor settings
   */
  const updateCompressor = useCallback((settings: any) => {
    audioProcessor.setCompressor(settings);
    setCompressorSettings(prev => ({ ...prev, ...settings }));
    
    // Update collaboration if available
    if (collaborationRef.current) {
      collaborationRef.current.updateMasterSettings({ 
        compressor: settings 
      });
    }
  }, []);
  
  /**
   * Update LUFS target
   */
  const updateLUFSTarget = useCallback((lufs: number) => {
    audioProcessor.setLufsTarget(lufs);
    setLufsTarget(lufs);
    
    // Update collaboration if available
    if (collaborationRef.current) {
      collaborationRef.current.updateMasterSettings({ 
        lufsTarget: lufs 
      });
    }
  }, []);
  
  /**
   * Apply AI mastering preset
   */
  const applyAIMastering = useCallback(async (genre: string) => {
    setIsMastering(true);
    
    try {
      // Simulating AI processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Apply preset
      audioProcessor.applyAIMasteringPreset(genre);
      setMasteringGenre(genre);
      
      // Update state with new settings (these would normally come from the AI model)
      const aiSettings = getAISettingsForGenre(genre);
      setEqSettings(aiSettings.eq);
      setCompressorSettings(aiSettings.compressor);
      setLufsTarget(aiSettings.lufsTarget);
      
      // Update collaboration if available
      if (collaborationRef.current) {
        collaborationRef.current.updateMasterSettings({ 
          masteringPreset: genre,
          eq: aiSettings.eq,
          compressor: aiSettings.compressor,
          lufsTarget: aiSettings.lufsTarget
        });
        
        // Send a message about the mastering
        collaborationRef.current.sendMessage(`Applied ${genre} mastering preset`);
      }
      
      toast({
        title: "AI Mastering Applied",
        description: `${genre} preset applied successfully`,
      });
    } catch (error) {
      console.error('AI mastering failed:', error);
      toast({
        variant: "destructive",
        title: "Mastering Failed",
        description: "Could not apply AI mastering preset",
      });
    } finally {
      setIsMastering(false);
    }
  }, [toast]);
  
  /**
   * Export the project
   */
  const exportProject = useCallback(async () => {
    try {
      // Start recording the master output
      audioProcessor.startRecording();
      
      // Play the entire project
      audioProcessor.play();
      
      // Wait for the project to finish (this would normally use the project duration)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Stop recording and get the audio blob
      audioProcessor.stop();
      const blob = await audioProcessor.stopRecording();
      
      if (blob) {
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectId}_export_${Date.now()}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export Complete",
          description: "Project exported successfully",
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export project audio",
      });
    }
  }, [projectId, toast]);
  
  /**
   * Start a live session for collaboration
   */
  const startLiveSession = useCallback(() => {
    if (!collaborationRef.current) {
      toast({
        variant: "destructive",
        title: "Collaboration Unavailable",
        description: "Could not start live session",
      });
      return;
    }
    
    // Generate a session code
    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Send a message about the session
    collaborationRef.current.sendMessage(`Started live session with code: ${sessionCode}`);
    
    // In a real app, this would create a session record in the database
    // For now we'll just show a toast
    toast({
      title: "Live Session Started",
      description: `Session code: ${sessionCode}`,
    });
    
    // This would normally return the session code or ID
    return sessionCode;
  }, [toast]);
  
  /**
   * Send a chat message
   */
  const sendMessage = useCallback((message: string) => {
    if (!message.trim() || !collaborationRef.current) return;
    
    collaborationRef.current.sendMessage(message);
    setNewMessage('');
  }, []);
  
  /**
   * Handle new track data from collaboration
   */
  const handleTrackUpdate = useCallback((tracksData: any) => {
    if (!tracksData) return;
    
    const tracksArray = Object.values(tracksData);
    setTracks(tracksArray as any[]);
  }, []);
  
  /**
   * Handle mixer updates from collaboration
   */
  const handleMixerUpdate = useCallback((mixerData: any) => {
    if (!mixerData) return;
    
    // Update audio processor with new mixer settings
    Object.entries(mixerData).forEach(([trackId, settings]: [string, any]) => {
      const audioTrack = audioProcessor.getTrack(Number(trackId));
      if (audioTrack) {
        if (settings.volume !== undefined) audioTrack.setVolume(settings.volume);
        if (settings.pan !== undefined) audioTrack.setPan(settings.pan);
        if (settings.muted !== undefined) audioTrack.setMuted(settings.muted);
        if (settings.soloed !== undefined) audioTrack.setSolo(settings.soloed);
      }
    });
  }, []);
  
  /**
   * Handle master updates from collaboration
   */
  const handleMasterUpdate = useCallback((masterData: any) => {
    if (!masterData || !masterData.settings) return;
    
    const settings = masterData.settings;
    
    // Update BPM
    if (settings.bpm !== undefined) {
      audioProcessor.setBpm(settings.bpm);
      setBpm(settings.bpm);
    }
    
    // Update EQ
    if (settings.eq) {
      audioProcessor.setEQ(settings.eq.low, settings.eq.mid, settings.eq.high);
      setEqSettings(settings.eq);
    }
    
    // Update compressor
    if (settings.compressor) {
      audioProcessor.setCompressor(settings.compressor);
      setCompressorSettings(prev => ({ ...prev, ...settings.compressor }));
    }
    
    // Update LUFS target
    if (settings.lufsTarget !== undefined) {
      audioProcessor.setLufsTarget(settings.lufsTarget);
      setLufsTarget(settings.lufsTarget);
    }
  }, []);
  
  /**
   * Handle new messages from collaboration
   */
  const handleNewMessage = useCallback((message: any) => {
    setMessages(prev => [...prev, message]);
  }, []);
  
  /**
   * Handle user joins
   */
  const handleUserJoin = useCallback((user: any) => {
    setCollaborators(prev => {
      // Avoid duplicates
      if (prev.some(u => u.id === user.id)) {
        return prev;
      }
      return [...prev, user];
    });
    
    toast({
      title: "User Joined",
      description: `${user.name} joined the session`,
    });
  }, [toast]);
  
  /**
   * Handle user leaves
   */
  const handleUserLeave = useCallback((user: any) => {
    setCollaborators(prev => prev.filter(u => u.id !== user.id));
    
    toast({
      description: `${user.name} left the session`,
    });
  }, [toast]);
  
  /**
   * Helper function to get a random color
   */
  const getRandomColor = () => {
    const colors = [
      '#f43f5e', // rose
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
      '#14b8a6', // teal
      '#d946ef'  // fuchsia
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  /**
   * Helper function to get AI settings for a genre
   */
  const getAISettingsForGenre = (genre: string) => {
    // These would normally come from a trained ML model
    // Simplified settings for demonstration
    switch (genre.toLowerCase()) {
      case 'hip-hop':
        return {
          eq: { low: 2, mid: 0, high: -1 },
          compressor: { 
            threshold: -18, 
            ratio: 4,
            attack: 0.01,
            release: 0.25
          },
          lufsTarget: -8
        };
      case 'pop':
        return {
          eq: { low: 1, mid: 1, high: 2 },
          compressor: { 
            threshold: -20, 
            ratio: 3,
            attack: 0.003,
            release: 0.15
          },
          lufsTarget: -10
        };
      case 'r&b':
        return {
          eq: { low: 3, mid: -1, high: 1 },
          compressor: { 
            threshold: -24, 
            ratio: 2.5,
            attack: 0.02,
            release: 0.4
          },
          lufsTarget: -12
        };
      case 'rock':
        return {
          eq: { low: 1, mid: 2, high: 3 },
          compressor: { 
            threshold: -16, 
            ratio: 6,
            attack: 0.005,
            release: 0.2
          },
          lufsTarget: -9
        };
      default: // balanced
        return {
          eq: { low: 0, mid: 0, high: 0 },
          compressor: { 
            threshold: -24, 
            ratio: 4,
            attack: 0.003,
            release: 0.25
          },
          lufsTarget: -14
        };
    }
  };
  
  return {
    // State
    tracks,
    selectedTrackId,
    isPlaying,
    currentTime,
    bpm,
    timeSignature,
    showEffects,
    eqSettings,
    compressorSettings,
    lufsTarget,
    masteringGenre,
    isMastering,
    collaborators,
    messages,
    newMessage,
    isRecording,
    
    // Actions
    setSelectedTrackId,
    setShowEffects,
    setNewMessage,
    play,
    pause,
    stop,
    updateBpm,
    addTrack,
    deleteTrack,
    importAudioToTrack,
    startRecording,
    stopRecording,
    updateTrackVolume,
    updateTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    updateEQ,
    updateCompressor,
    updateLUFSTarget,
    applyAIMastering,
    exportProject,
    startLiveSession,
    sendMessage
  };
};