import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Define the history entry interface
interface HistoryEntry<T> {
  state: T;
  description: string;
}

// Define actions that can be undone
export type UndoableAction = 
  | 'added-track'
  | 'deleted-track'
  | 'modified-track'
  | 'added-region'
  | 'deleted-region'
  | 'moved-region'
  | 'split-region'
  | 'merged-regions'
  | 'applied-effect'
  | 'changed-project-settings'
  | 'recorded-audio'
  | 'imported-audio';

/**
 * Custom hook for managing undo/redo history
 * @param initialState The initial state
 * @param maxHistory Maximum number of history entries to keep
 * @returns History management functions and current state
 */
export function useUndoHistory<T>(initialState: T, maxHistory: number = 50) {
  // State references
  const [currentState, setCurrentState] = useState<T>(initialState);
  const historyRef = useRef<HistoryEntry<T>[]>([]);
  const futureRef = useRef<HistoryEntry<T>[]>([]);
  const isPerformingUndoRedoRef = useRef(false);
  const { toast } = useToast();

  // Initialize history with initial state
  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current = [{ state: initialState, description: 'Initial state' }];
    }
  }, [initialState]);

  // Function to push a new state to history
  const pushHistory = useCallback((newState: T, actionDescription: string) => {
    if (isPerformingUndoRedoRef.current) return;

    // Add the new state to history
    historyRef.current = [
      ...historyRef.current.slice(-maxHistory + 1), 
      { state: newState, description: actionDescription }
    ];
    
    // Clear future states since we're creating a new timeline
    futureRef.current = [];
    
    // Update current state
    setCurrentState(newState);
  }, [maxHistory]);

  // Undo the last action
  const undo = useCallback(() => {
    if (historyRef.current.length <= 1) {
      toast({
        title: "Cannot Undo",
        description: "There are no actions to undo.",
        variant: "default"
      });
      return currentState; // Nothing to undo
    }

    isPerformingUndoRedoRef.current = true;
    
    try {
      // Move current state to future
      const current = historyRef.current.pop()!;
      futureRef.current = [current, ...futureRef.current];
      
      // Get previous state
      const previous = historyRef.current[historyRef.current.length - 1];
      setCurrentState(previous.state);
      
      toast({
        title: "Undo Complete",
        description: `Undid: ${current.description}`,
        variant: "default"
      });
      
      return previous.state;
    } finally {
      isPerformingUndoRedoRef.current = false;
    }
  }, [currentState, toast]);

  // Redo the last undone action
  const redo = useCallback(() => {
    if (futureRef.current.length === 0) {
      toast({
        title: "Cannot Redo",
        description: "There are no actions to redo.",
        variant: "default"
      });
      return currentState; // Nothing to redo
    }

    isPerformingUndoRedoRef.current = true;
    
    try {
      // Get the next future state
      const [next, ...remainingFuture] = futureRef.current;
      futureRef.current = remainingFuture;
      
      // Add it back to history
      historyRef.current = [...historyRef.current, next];
      setCurrentState(next.state);
      
      toast({
        title: "Redo Complete",
        description: `Redid: ${next.description}`,
        variant: "default"
      });
      
      return next.state;
    } finally {
      isPerformingUndoRedoRef.current = false;
    }
  }, [currentState, toast]);

  // Clear all history
  const clearHistory = useCallback(() => {
    historyRef.current = [{ state: currentState, description: 'History cleared' }];
    futureRef.current = [];
  }, [currentState]);

  // Generate a description for the action
  const getActionDescription = useCallback((action: UndoableAction, details?: string): string => {
    switch (action) {
      case 'added-track':
        return `Added track${details ? ': ' + details : ''}`;
      case 'deleted-track':
        return `Deleted track${details ? ': ' + details : ''}`;
      case 'modified-track':
        return `Modified track${details ? ': ' + details : ''}`;
      case 'added-region':
        return `Added audio region${details ? ': ' + details : ''}`;
      case 'deleted-region':
        return `Deleted audio region${details ? ': ' + details : ''}`;
      case 'moved-region':
        return `Moved audio region${details ? ': ' + details : ''}`;
      case 'split-region':
        return `Split audio region${details ? ': ' + details : ''}`;
      case 'merged-regions':
        return `Merged audio regions${details ? ': ' + details : ''}`;
      case 'applied-effect':
        return `Applied effect${details ? ': ' + details : ''}`;
      case 'changed-project-settings':
        return `Changed project settings${details ? ': ' + details : ''}`;
      case 'recorded-audio':
        return `Recorded audio${details ? ': ' + details : ''}`;
      case 'imported-audio':
        return `Imported audio${details ? ': ' + details : ''}`;
      default:
        return details || 'Unknown action';
    }
  }, []);

  // Commit a new state with an action description
  const commit = useCallback((newState: T, action: UndoableAction, details?: string) => {
    const description = getActionDescription(action, details);
    pushHistory(newState, description);
    return newState;
  }, [pushHistory, getActionDescription]);

  // Return the hook API
  return {
    state: currentState,
    commit,
    undo,
    redo,
    clearHistory,
    canUndo: historyRef.current.length > 1,
    canRedo: futureRef.current.length > 0,
    historyLength: historyRef.current.length,
    futureLength: futureRef.current.length
  };
}