import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronsRight, 
  ChevronsLeft, 
  ZoomIn, 
  ZoomOut, 
  Scissors, 
  Copy, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Headphones,
  Plus,
  Mic,
  Music,
  ChevronRight,
  ChevronLeft,
  AlignLeft,
  AlignRight,
  Grid,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Define interfaces for component props
import type { AudioRegion, Track } from '@/lib';
import { TrackRegion } from './track-region';

interface ArrangementViewProps {
  tracks: Track[];
  regions: AudioRegion[];
  currentTime: number;
  duration: number;
  bpm: number;
  timeSignature: [number, number];
  isPlaying: boolean;
  isRecording: boolean;
  onTimeChange: (time: number) => void;
  onRegionSelect: (regionId: string) => void;
  onRegionMove: (regionId: string, trackId: number, startTime: number) => void;
  onRegionResize: (regionId: string, startTime: number, endTime: number) => void;
  onRegionDelete: (regionId: string) => void;
  onRegionCopy: (regionId: string) => void;
  onRegionSplit: (regionId: string, time: number) => void;
  onTrackVolumeChange: (trackId: number, volume: number) => void;
  onTrackPanChange: (trackId: number, pan: number) => void;
  onTrackMuteToggle: (trackId: number, muted: boolean) => void;
  onTrackSoloToggle: (trackId: number, soloed: boolean) => void;
  onTrackArmToggle: (trackId: number, armed: boolean) => void;
  onTrackAdd: (type: string) => void;
  onTrackDelete: (trackId: number) => void;
  onZoomChange: (zoom: number) => void;
  zoom: number;
  selectedTrackId?: number | null;
  onTrackSelect: (trackId: number) => void;
}

export function ArrangementView({
  tracks,
  regions,
  currentTime,
  duration,
  bpm,
  timeSignature,
  isPlaying,
  isRecording,
  onTimeChange,
  onRegionSelect,
  onRegionMove,
  onRegionResize,
  onRegionDelete,
  onRegionCopy,
  onRegionSplit,
  onTrackVolumeChange,
  onTrackPanChange,
  onTrackMuteToggle,
  onTrackSoloToggle,
  onTrackArmToggle,
  onTrackAdd,
  onTrackDelete,
  onZoomChange,
  zoom,
  selectedTrackId,
  onTrackSelect
}: ArrangementViewProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  
  // View settings
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(0.25); // Quarter note by default
  const [showLabels, setShowLabels] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true); // Auto-scroll enabled by default
  const [dragData, setDragData] = useState<{
    regionId: string;
    type: 'move' | 'resizeLeft' | 'resizeRight';
    startX: number;
    initialStart: number;
    initialEnd: number;
    initialTrackId: number;
  } | null>(null);
  
  // Calculate timeline values
  const pixelsPerSecond = 100 * zoom;
  const secondsPerBeat = 60 / bpm;
  const pixelsPerBeat = secondsPerBeat * pixelsPerSecond;
  const beatsPerMeasure = timeSignature[0];
  const pixelsPerMeasure = pixelsPerBeat * beatsPerMeasure;
  const totalPixels = duration * pixelsPerSecond;
  
  // Calculate time from pixels
  const pixelToTime = (pixels: number): number => {
    return pixels / pixelsPerSecond;
  };
  
  // Calculate pixels from time
  const timeToPixel = (time: number): number => {
    return time * pixelsPerSecond;
  };
  
  // Round to grid size if snap is enabled
  const snapTime = (time: number): number => {
    if (!snapToGrid) return time;
    
    const gridInSeconds = gridSize * secondsPerBeat;
    return Math.round(time / gridInSeconds) * gridInSeconds;
  };
  
  // Update playhead position when currentTime changes
  useEffect(() => {
    if (playheadRef.current) {
      const pixelPosition = timeToPixel(currentTime);
      playheadRef.current.style.left = `${pixelPosition}px`;
      
      // Auto-scroll to follow playhead during playback
      if (autoScroll && isPlaying && tracksContainerRef.current) {
        const container = tracksContainerRef.current;
        const containerWidth = container.clientWidth;
        const visibleLeftEdge = container.scrollLeft;
        const visibleRightEdge = visibleLeftEdge + containerWidth;
        const buffer = containerWidth * 0.15; // 15% buffer on each side
        
        // Only scroll if the playhead is outside the middle portion of the visible area
        if (pixelPosition < visibleLeftEdge + buffer || pixelPosition > visibleRightEdge - buffer) {
          // Center the playhead in the visible area with smooth scrolling
          container.scrollTo({
            left: pixelPosition - containerWidth / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentTime, pixelsPerSecond, autoScroll, isPlaying]);
  
  // Handle click on timeline to change position
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const pixelOffset = e.clientX - rect.left;
      const timelineScroll = tracksContainerRef.current?.scrollLeft || 0;
      const clickTime = pixelToTime(pixelOffset + timelineScroll);
      onTimeChange(snapTime(clickTime));
    }
  };
  
  // Handle mouse down on region for drag operations
  const handleRegionMouseDown = (
    e: React.MouseEvent, 
    region: AudioRegion, 
    actionType: 'move' | 'resizeLeft' | 'resizeRight'
  ) => {
    if (region.locked) return;
    
    e.stopPropagation();
    
    const startX = e.clientX;
    const initialStart = region.start;
    const initialEnd = region.end;
    const initialTrackId = region.trackId;
    
    setIsDragging(true);
    setDragData({
      regionId: region.id,
      type: actionType,
      startX,
      initialStart,
      initialEnd,
      initialTrackId
    });
    
    onRegionSelect(region.id);
  };
  
  // Handle mouse move for drag operations
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragData || !tracksContainerRef.current) return;
      
      const dx = e.clientX - dragData.startX;
      const timeDelta = pixelToTime(dx);
      const trackContainer = tracksContainerRef.current;
      const trackElements = trackContainer.querySelectorAll('.track-row');
      
      if (dragData.type === 'move') {
        let newStart = snapTime(dragData.initialStart + timeDelta);
        
        // Keep the track the same - disable vertical dragging as requested
        let targetTrackId = dragData.initialTrackId;
        
        // Calculate duration and ensure we don't go negative
        const duration = dragData.initialEnd - dragData.initialStart;
        if (newStart < 0) newStart = 0;
        
        const selectedRegion = regions.find(r => r.id === dragData.regionId);
        if (selectedRegion) {
          if (newStart !== selectedRegion.start) {
            onRegionMove(dragData.regionId, targetTrackId, newStart);
          }
        }
      } else if (dragData.type === 'resizeLeft') {
        // Resize from left side (change start time)
        let newStart = snapTime(dragData.initialStart + timeDelta);
        
        // Don't allow start to go beyond end
        if (newStart >= dragData.initialEnd) {
          newStart = dragData.initialEnd - 0.01;
        }
        
        // Don't allow start to go negative
        if (newStart < 0) newStart = 0;
        
        onRegionResize(dragData.regionId, newStart, dragData.initialEnd);
      } else if (dragData.type === 'resizeRight') {
        // Resize from right side (change end time)
        let newEnd = snapTime(dragData.initialEnd + timeDelta);
        
        // Don't allow end to go before start
        if (newEnd <= dragData.initialStart) {
          newEnd = dragData.initialStart + 0.01;
        }
        
        onRegionResize(dragData.regionId, dragData.initialStart, newEnd);
      }
    },
    [
      isDragging,
      dragData,
      pixelToTime,
      snapTime,
      regions,
      onRegionMove,
      onRegionResize,
      tracks
    ]
  );
  
  // Handle mouse up to end drag operations
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragData(null);
    }
  }, [isDragging]);
  
  // Add/remove event listeners for drag operations
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // Synchronize scroll position between timeline and tracks
  const handleTracksScroll = () => {
    if (tracksContainerRef.current && timelineRef.current) {
      timelineRef.current.scrollLeft = tracksContainerRef.current.scrollLeft;
    }
  };
  
  // Format time as mm:ss.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Format time as bars.beats
  const formatMusicalTime = (seconds: number): string => {
    const totalBeats = seconds / secondsPerBeat;
    const bars = Math.floor(totalBeats / beatsPerMeasure) + 1;
    const beats = Math.floor(totalBeats % beatsPerMeasure) + 1;
    return `${bars}.${beats}`;
  };
  
  // Determine the color for a given track type
  const getTrackTypeColor = (type: string): string => {
    switch (type) {
      case 'vocal':
        return '#f43f5e';
      case 'instrument':
        return '#3b82f6';
      case 'drum':
        return '#a855f7';
      case 'mix':
        return '#0ea5e9';
      default:
        return '#10b981';
    }
  };
  
  // Generate tick marks for the timeline with professional DAW styling
  const generateTimelineTicks = () => {
    const ticks = [];
    const measuresCount = Math.ceil(duration / (secondsPerBeat * beatsPerMeasure));
    
    // Add time marker background for alternating measures (creates blocks like in pro DAWs)
    for (let measure = 0; measure <= measuresCount; measure++) {
      const measureTime = measure * beatsPerMeasure * secondsPerBeat;
      const measurePixel = timeToPixel(measureTime);
      const nextMeasurePixel = timeToPixel((measure + 1) * beatsPerMeasure * secondsPerBeat);
      const width = nextMeasurePixel - measurePixel;
      
      // Add alternating background for odd/even measures
      if (measure % 2 === 0) {
        ticks.push(
          <div 
            key={`measure-bg-${measure}`} 
            className="absolute top-0 h-full bg-gray-900/60"
            style={{ 
              left: `${measurePixel}px`,
              width: `${width}px`
            }}
          />
        );
      }
    }
    
    // Add actual tick marks
    for (let measure = 0; measure <= measuresCount; measure++) {
      const measureTime = measure * beatsPerMeasure * secondsPerBeat;
      const measurePixel = timeToPixel(measureTime);
      
      // Major measure bar with number
      ticks.push(
        <div 
          key={`measure-${measure}`} 
          className="absolute top-0 h-full border-l-2 border-gray-500"
          style={{ left: `${measurePixel}px` }}
        >
          <div className="absolute -left-3 -top-6 text-xs text-gray-300 whitespace-nowrap font-semibold">
            {measure + 1}
          </div>
        </div>
      );
      
      // Add time marker in MM:SS format at certain intervals
      if (measure % 4 === 0) {
        const timeAtMeasure = measureTime;
        ticks.push(
          <div 
            key={`time-${measure}`} 
            className="absolute -left-8 top-4 text-[8px] text-blue-300 whitespace-nowrap opacity-70"
            style={{ left: `${measurePixel}px` }}
          >
            {formatTime(timeAtMeasure)}
          </div>
        );
      }
      
      // Add beat ticks within each measure
      for (let beat = 1; beat < beatsPerMeasure; beat++) {
        const beatTime = measureTime + beat * secondsPerBeat;
        const beatPixel = timeToPixel(beatTime);
        
        // Regular beat line (quarter notes)
        ticks.push(
          <div 
            key={`beat-${measure}-${beat}`} 
            className="absolute top-0 h-full border-l border-gray-600"
            style={{ left: `${beatPixel}px` }}
          >
            {/* Only show beat numbers when sufficiently zoomed in */}
            {zoom > 0.8 && (
              <div className="absolute -left-2 -top-5 text-[10px] text-gray-500 whitespace-nowrap">
                {beat + 1}
              </div>
            )}
          </div>
        );
        
        // Add eighth notes
        const eighthBeatPixel = timeToPixel(beatTime - secondsPerBeat/2);
        ticks.push(
          <div 
            key={`eighth-${measure}-${beat}`} 
            className="absolute top-0 h-full border-l border-gray-700/70"
            style={{ left: `${eighthBeatPixel}px` }}
          />
        );
        
        // Add sixteenth note subdivisions when zoomed in
        if (zoom >= 1.2) { 
          for (let sub = 1; sub < 4; sub++) {
            if (sub === 2) continue; // Skip middle one as it's covered by eighth notes
            
            const subTime = beatTime + (sub * secondsPerBeat / 4) - secondsPerBeat;
            const subPixel = timeToPixel(subTime);
            
            ticks.push(
              <div 
                key={`sub-${measure}-${beat}-${sub}`} 
                className="absolute top-0 h-full border-l border-gray-800/60"
                style={{ left: `${subPixel}px` }}
              />
            );
          }
        }
        
        // Add 32nd note subdivisions at highest zoom levels
        if (zoom >= 2.5) {
          for (let sub = 1; sub < 8; sub++) {
            if (sub % 2 === 0) continue; // Skip ones covered by 16th notes and 8th notes
            
            const subTime = beatTime + (sub * secondsPerBeat / 8) - secondsPerBeat;
            const subPixel = timeToPixel(subTime);
            
            ticks.push(
              <div 
                key={`sub32-${measure}-${beat}-${sub}`} 
                className="absolute top-0 h-full border-l border-gray-800/30"
                style={{ left: `${subPixel}px` }}
              />
            );
          }
        }
      }
    }
    
    return ticks;
  };
  
  // Handle zoom in/out
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom * 1.5, 10));
  };
  
  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom / 1.5, 0.1));
  };
  
  // Render the component
  return (
    <div className="flex flex-col h-full bg-gray-950 select-none">
      {/* Control bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleZoomOut}
            disabled={zoom <= 0.1}
          >
            <ZoomOut size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleZoomIn}
            disabled={zoom >= 10}
          >
            <ZoomIn size={14} />
          </Button>
          <div className="text-xs text-gray-400">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 ${snapToGrid ? 'text-blue-400 bg-blue-950/20' : ''}`}
              onClick={() => setSnapToGrid(!snapToGrid)}
            >
              <Grid size={14} className="mr-1" />
              Snap
            </Button>
            
            <select
              className="h-7 px-1 text-xs bg-gray-800 border border-gray-700 rounded"
              value={gridSize}
              onChange={e => setGridSize(parseFloat(e.target.value))}
              disabled={!snapToGrid}
            >
              <option value="1">1/1</option>
              <option value="0.5">1/2</option>
              <option value="0.25">1/4</option>
              <option value="0.125">1/8</option>
              <option value="0.0625">1/16</option>
            </select>
            
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 ml-1 ${autoScroll ? 'text-green-400 bg-green-950/20' : ''}`}
              onClick={() => setAutoScroll(!autoScroll)}
              title={autoScroll ? "Auto-scrolling enabled" : "Auto-scrolling disabled"}
            >
              <ChevronRight size={14} className={`mr-1 ${autoScroll ? '' : 'opacity-50'}`} />
              Follow
            </Button>
          </div>
          
          <div className="text-xs text-gray-200 font-mono">
            {formatTime(currentTime)} | {formatMusicalTime(currentTime)}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-7 bg-gray-800 border-gray-700"
            onClick={() => onTrackAdd('audio')}
          >
            <Plus size={14} className="mr-1" />
            Add Track
          </Button>
        </div>
      </div>
      
      {/* Timeline */}
      <div 
        ref={timelineRef}
        className="h-8 bg-gray-900 border-b border-gray-800 overflow-x-hidden relative"
        onClick={handleTimelineClick}
      >
        <div 
          className="absolute top-0 left-0 h-full"
          style={{ width: `${totalPixels}px` }}
        >
          {generateTimelineTicks()}
        </div>
      </div>
      
      {/* Tracks */}
      <div 
        ref={tracksContainerRef}
        className="flex-1 overflow-auto"
        onScroll={handleTracksScroll}
      >
        <div 
          className="relative"
          style={{ minWidth: `${totalPixels}px`, minHeight: '100%' }}
        >
          {/* Play position indicator line */}
          <div 
            ref={playheadRef} 
            className={`absolute top-0 h-full w-px bg-blue-500 z-20`}
            style={{ left: `${timeToPixel(currentTime)}px` }}
          >
            <div className="w-3 h-3 rounded-full bg-blue-500 relative -left-1.5 -top-1.5" />
          </div>
          
          {/* Tracks */}
          <div className="flex flex-col">
            {tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Music size={32} className="mb-3 opacity-50" />
                <p>No tracks yet. Add a track to get started.</p>
                <Button 
                  className="mt-3" 
                  variant="outline"
                  onClick={() => onTrackAdd('audio')}
                >
                  <Plus size={14} className="mr-2" />
                  Add Track
                </Button>
              </div>
            ) : (
              tracks.map(track => (
                <div 
                  key={track.id} 
                  className={`track-row flex h-24 border-b border-gray-800 relative ${
                    track.id === selectedTrackId ? 'bg-blue-950/10' : 'bg-gray-900/50'
                  }`}
                >
                  {/* Track header */}
                  <div 
                    className={`track-header w-48 border-r border-gray-800 flex-shrink-0 p-2 ${
                      track.id === selectedTrackId ? 'bg-blue-950/30' : 'bg-gray-900'
                    }`}
                    onClick={() => onTrackSelect(track.id)}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-10 rounded-sm mr-2"
                        style={{ backgroundColor: getTrackTypeColor(track.type) }}
                      />
                      <div className="flex-1 overflow-hidden">
                        <div className="font-medium truncate">{track.name}</div>
                        <div className="text-xs text-gray-400 truncate">{track.type}</div>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 ${track.isMuted ? 'text-red-500 bg-red-900/20' : ''}`}
                        onClick={e => {
                          e.stopPropagation();
                          onTrackMuteToggle(track.id, !track.isMuted);
                        }}
                      >
                        {track.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 ${track.isSoloed ? 'text-yellow-500 bg-yellow-900/20' : ''}`}
                        onClick={e => {
                          e.stopPropagation();
                          onTrackSoloToggle(track.id, !track.isSoloed);
                        }}
                      >
                        <Headphones size={12} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 ${track.isArmed ? 'text-red-500 bg-red-900/20' : ''}`}
                        onClick={e => {
                          e.stopPropagation();
                          onTrackArmToggle(track.id, !track.isArmed);
                        }}
                      >
                        <Mic size={12} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-900/20"
                        onClick={e => {
                          e.stopPropagation();
                          onTrackDelete(track.id);
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Track content */}
                  <div 
                    className="flex-1 relative track-content"
                    onClick={() => onTrackSelect(track.id)}
                  >
                    {/* Track grid lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      {generateTimelineTicks()}
                    </div>
                    
                    {/* Regions for this track */}
                    {regions
                      .filter(region => region.trackId === track.id)
                      .map(region => (
                        <TrackRegion
                          key={region.id}
                          region={region}
                          selected={!!region.selected}
                          pixelsPerSecond={pixelsPerSecond}
                          height={110}  // Increased height for better waveform visualization
                          onSelect={onRegionSelect}
                          onMoveStart={(regionId, e) => handleRegionMouseDown(e, region, 'move')}
                          onResizeLeftStart={(regionId, e) => handleRegionMouseDown(e, region, 'resizeLeft')}
                          onResizeRightStart={(regionId, e) => handleRegionMouseDown(e, region, 'resizeRight')}
                          onCopy={onRegionCopy}
                          onDelete={onRegionDelete}
                          onSplit={(regionId) => onRegionSplit(regionId, currentTime)}
                          onToggleLock={(regionId, locked) => {
                            // Create a new region with updated locked state
                            const updatedRegion = { ...region, locked };
                            onRegionResize(regionId, region.start, region.end);
                          }}
                          currentTime={currentTime}
                          trackColor={getTrackTypeColor(track.type)}
                        />
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Selected region controls */}
      {regions.find(r => r.selected) && (
        <div className="p-2 border-t border-gray-800 bg-gray-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const selectedRegion = regions.find(r => r.selected);
                if (selectedRegion) {
                  onRegionDelete(selectedRegion.id);
                  toast({
                    description: 'Region deleted'
                  });
                }
              }}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 size={14} className="mr-1" />
              Delete
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const selectedRegion = regions.find(r => r.selected);
                if (selectedRegion) {
                  onRegionCopy(selectedRegion.id);
                  toast({
                    description: 'Region copied'
                  });
                }
              }}
            >
              <Copy size={14} className="mr-1" />
              Duplicate
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const selectedRegion = regions.find(r => r.selected);
                if (selectedRegion) {
                  onRegionSplit(selectedRegion.id, currentTime);
                  toast({
                    description: 'Region split at playhead position'
                  });
                }
              }}
            >
              <Scissors size={14} className="mr-1" />
              Split at Playhead
            </Button>
          </div>
          
          <div className="text-xs text-gray-400">
            {regions.find(r => r.selected)?.name} | 
            {formatTime(regions.find(r => r.selected)?.start || 0)} - 
            {formatTime(regions.find(r => r.selected)?.end || 0)}
          </div>
        </div>
      )}
    </div>
  );
}