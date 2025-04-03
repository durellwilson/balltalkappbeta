import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Grid, Ruler, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Types
interface AudioRegion {
  id: string;
  trackId: number;
  startTime: number;  // in seconds
  duration: number;   // in seconds
  offset?: number;    // offset into original audio file, in seconds
  color?: string;
  name: string;
  waveformData?: number[];
  muted?: boolean;
  loop?: boolean;
  gain?: number;
  selected?: boolean;
}

interface TimelineSequencerProps {
  tracks: Array<{
    id: number;
    name: string;
    type: string;
    color?: string;
    height?: number;
  }>;
  regions: AudioRegion[];
  currentTime: number;
  duration: number;
  bpm: number;
  timeSignature: [number, number];
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onRegionClick: (regionId: string) => void;
  onRegionMove: (regionId: string, trackId: number, startTime: number) => void;
  onRegionResize: (regionId: string, startTime: number, duration: number) => void;
  onRegionDuplicate: (regionId: string) => void;
  onRegionDelete: (regionId: string) => void;
  onTimeChange: (time: number) => void;
  onAddMarker?: (time: number, name: string) => void;
  onSnapChange?: (snapEnabled: boolean, snapUnit: string) => void;
  markers?: Array<{ id: string; time: number; name: string; color?: string }>;
  onTrackSelection?: (trackId: number) => void;
  selectedTrackId?: number | null;
}

export function TimelineSequencer({
  tracks,
  regions,
  currentTime,
  duration,
  bpm,
  timeSignature = [4, 4],
  zoom = 1,
  onZoomChange,
  onRegionClick,
  onRegionMove,
  onRegionResize,
  onRegionDuplicate,
  onRegionDelete,
  onTimeChange,
  onAddMarker,
  onSnapChange,
  markers = [],
  onTrackSelection,
  selectedTrackId
}: TimelineSequencerProps) {
  // State
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapUnit, setSnapUnit] = useState('beat'); // 'beat', 'bar', 'second', 'custom'
  const [snapValue, setSnapValue] = useState(1); // For custom snap values
  const [gridVisible, setGridVisible] = useState(true);
  const [draggingRegion, setDraggingRegion] = useState<string | null>(null);
  const [resizingRegion, setResizingRegion] = useState<{id: string, edge: 'start' | 'end'} | null>(null);
  const [contextMenuRegion, setContextMenuRegion] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null);
  const [timeDisplay, setTimeDisplay] = useState<'seconds' | 'measures'>('measures');
  
  // References
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  
  // Computed values
  const pixelsPerSecond = 100 * zoom;
  const timelineWidth = Math.max(duration * pixelsPerSecond, 1200);
  const secondsPerBeat = 60 / bpm;
  const beatsPerBar = timeSignature[0];
  const secondsPerBar = secondsPerBeat * beatsPerBar;
  
  // Calculate snap increment in seconds
  const getSnapIncrement = (): number => {
    switch (snapUnit) {
      case 'bar':
        return secondsPerBar;
      case 'beat':
        return secondsPerBeat;
      case 'second':
        return 1;
      case 'custom':
        return snapValue * secondsPerBeat;
      default:
        return secondsPerBeat;
    }
  };
  
  // Snap a time value to the grid
  const snapToGrid = (time: number): number => {
    if (!snapEnabled) return time;
    const increment = getSnapIncrement();
    return Math.round(time / increment) * increment;
  };
  
  // Format time as bars.beats.sixteenths
  const formatTimeAsMeasure = (timeInSeconds: number): string => {
    if (timeInSeconds < 0) return '0.0.0';
    
    const totalBeats = timeInSeconds / secondsPerBeat;
    const bars = Math.floor(totalBeats / beatsPerBar) + 1; // 1-based
    const beats = Math.floor(totalBeats % beatsPerBar) + 1; // 1-based
    const sixteenths = Math.floor((totalBeats % 1) * 4) + 1;
    
    return `${bars}.${beats}.${sixteenths}`;
  };
  
  // Format time as MM:SS.ms
  const formatTimeAsSeconds = (timeInSeconds: number): string => {
    if (timeInSeconds < 0) return '00:00.00';
    
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const ms = Math.floor((timeInSeconds % 1) * 100);
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Convert between pixels and seconds
  const pixelsToSeconds = (pixels: number): number => pixels / pixelsPerSecond;
  const secondsToPixels = (seconds: number): number => seconds * pixelsPerSecond;
  
  // Handle playhead movement via click/drag
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDraggingPlayhead) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollOffset = containerRef.current ? containerRef.current.scrollLeft : 0;
    
    // Include scroll position in the calculation for precise positioning
    const clickX = (e.clientX - rect.left) + scrollOffset;
    
    // Calculate time based on pixels
    const rawTime = pixelsToSeconds(clickX);
    
    // Apply snap if enabled
    const newTime = snapEnabled ? snapToGrid(rawTime) : rawTime;
    
    // Ensure time is within bounds
    onTimeChange(Math.max(0, Math.min(duration, newTime)));
  };
  
  // Handle playhead drag start
  const handlePlayheadDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Store initial click position for more accurate dragging
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const initialX = e.clientX;
      
      // Store the initial state to have a reference point
      setIsDraggingPlayhead(true);
      
      // Dispatch a custom event with additional data
      window.dispatchEvent(new CustomEvent('playhead-drag-start', { 
        detail: { initialX, currentTime } 
      }));
    }
  };
  
  // Handle playhead drag
  const handlePlayheadDrag = (e: MouseEvent) => {
    if (!isDraggingPlayhead || !timelineRef.current || !containerRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollOffset = containerRef.current.scrollLeft;
    
    // Include scroll position for accurate positioning
    const dragX = (e.clientX - rect.left) + scrollOffset;
    
    // Prevent negative positions and positions beyond duration
    const boundedDragX = Math.max(0, Math.min(dragX, duration * pixelsPerSecond));
    
    // Calculate time based on pixels with high precision
    const rawTime = pixelsToSeconds(boundedDragX);
    
    // Apply snap if enabled
    const newTime = snapEnabled ? snapToGrid(rawTime) : rawTime;
    
    // Prevent any time jumps outside permissible bounds
    onTimeChange(Math.max(0, Math.min(duration, newTime)));
    
    // Auto-scroll if the cursor is near the edges
    const containerWidth = containerRef.current.clientWidth;
    const edgeThreshold = 50; // pixels from edge to trigger scroll
    
    if (e.clientX - rect.left < edgeThreshold) {
      // Near left edge, scroll left
      containerRef.current.scrollLeft = Math.max(0, scrollOffset - 15);
    } else if (rect.right - e.clientX < edgeThreshold) {
      // Near right edge, scroll right
      containerRef.current.scrollLeft = Math.min(
        timelineWidth - containerWidth,
        scrollOffset + 15
      );
    }
  };
  
  // Handle playhead drag end
  const handlePlayheadDragEnd = () => {
    if (isDraggingPlayhead) {
      setIsDraggingPlayhead(false);
      
      // Dispatch a custom event to notify that dragging has ended
      window.dispatchEvent(new CustomEvent('playhead-drag-end'));
    }
  };
  
  // Attach global mouse event listeners for playhead dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead) {
        handlePlayheadDrag(e);
      }
    };
    
    const handleMouseUp = () => {
      if (isDraggingPlayhead) {
        handlePlayheadDragEnd();
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead]);
  
  // Update snap setting when changed
  useEffect(() => {
    if (onSnapChange) {
      onSnapChange(snapEnabled, snapUnit);
    }
  }, [snapEnabled, snapUnit, onSnapChange]);
  
  // Auto-scroll to keep playhead visible when playing
  useEffect(() => {
    if (containerRef.current && playheadRef.current && currentTime > 0) {
      // Only auto-scroll if we're not actively dragging the playhead
      if (isDraggingPlayhead) return;
      
      const container = containerRef.current;
      const playhead = playheadRef.current;
      
      // Calculate the position of the playhead in pixels
      const playheadPosition = secondsToPixels(currentTime);
      
      // Get the visible area of the container
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const viewportRightEdge = scrollLeft + containerWidth;
      
      // Define a margin for smoother scrolling experience
      const scrollMargin = containerWidth * 0.2; // 20% of container width
      
      // Check if playhead is approaching the right edge of the viewport
      if (playheadPosition > viewportRightEdge - scrollMargin) {
        // Smooth scroll to keep the playhead in view with some lead space
        container.scrollTo({
          left: playheadPosition - containerWidth + scrollMargin,
          behavior: 'smooth'
        });
      }
      
      // Check if playhead is approaching the left edge of the viewport
      else if (playheadPosition < scrollLeft + scrollMargin) {
        // Smooth scroll to keep the playhead in view with some lead space
        container.scrollTo({
          left: Math.max(0, playheadPosition - scrollMargin),
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime, isDraggingPlayhead, pixelsPerSecond]);
  
  // Render time axis markers (bars and beats)
  const renderTimeMarkers = () => {
    const totalSeconds = Math.max(duration, currentTime + 60); // Ensure we have some future space
    const markers = [];
    
    // Add bar markers
    for (let time = 0; time <= totalSeconds; time += secondsPerBar) {
      const position = secondsToPixels(time);
      const barNumber = Math.floor(time / secondsPerBar) + 1;
      
      markers.push(
        <div
          key={`bar-${barNumber}`}
          className="absolute top-0 bottom-0 border-l border-gray-600"
          style={{ left: `${position}px` }}
        >
          <div className="px-1 text-xs text-gray-400 bg-gray-800">
            {barNumber}
          </div>
        </div>
      );
      
      // Add beat markers within this bar
      for (let beat = 1; beat < beatsPerBar; beat++) {
        const beatTime = time + (beat * secondsPerBeat);
        const beatPosition = secondsToPixels(beatTime);
        
        markers.push(
          <div
            key={`beat-${barNumber}-${beat}`}
            className="absolute top-0 bottom-0 border-l border-gray-700"
            style={{ left: `${beatPosition}px` }}
          >
            <div className="text-[10px] text-gray-500 px-1">
              {`${barNumber}.${beat + 1}`}
            </div>
          </div>
        );
      }
    }
    
    return markers;
  };
  
  // Render tracks and audio regions
  const renderTracks = () => {
    return tracks.map(track => {
      const trackHeight = track.height || 80;
      const trackRegions = regions.filter(region => region.trackId === track.id);
      const isSelected = selectedTrackId === track.id;
      
      return (
        <div 
          key={`track-${track.id}`}
          className={`relative border-b border-gray-800 ${isSelected ? 'bg-gray-800/50' : ''}`}
          style={{ height: `${trackHeight}px` }}
          onClick={() => onTrackSelection && onTrackSelection(track.id)}
        >
          {/* Track header */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-36 bg-gray-900 border-r border-gray-800 z-10 flex items-center px-2"
          >
            <div className="truncate">
              <div className="text-sm font-medium">{track.name}</div>
              <div className="text-xs text-gray-400">{track.type}</div>
            </div>
          </div>
          
          {/* Track content area */}
          <div className="ml-36 h-full relative">
            {/* Render gridlines if enabled */}
            {gridVisible && (
              <div className="absolute inset-0 pointer-events-none">
                {renderTimeMarkers().map(marker => React.cloneElement(marker, { 
                  className: marker.props.className.replace('text-xs text-gray-400 bg-gray-800', 'text-transparent') 
                }))}
              </div>
            )}
            
            {/* Render regions on this track */}
            {trackRegions.map(region => (
              <RegionComponent
                key={region.id}
                region={region}
                pixelsPerSecond={pixelsPerSecond}
                trackHeight={trackHeight}
                trackId={track.id}
                snapToGrid={snapToGrid}
                onRegionClick={() => onRegionClick(region.id)}
                onRegionMove={(trackId, startTime) => onRegionMove(region.id, trackId, startTime)}
                onRegionResize={(startTime, duration) => onRegionResize(region.id, startTime, duration)}
                onRegionDuplicate={() => onRegionDuplicate(region.id)}
                onRegionDelete={() => onRegionDelete(region.id)}
                setContextMenu={(id, position) => {
                  setContextMenuRegion(id);
                  setContextMenuPosition(position);
                }}
              />
            ))}
          </div>
        </div>
      );
    });
  };
  
  // Render position markers (cue points, etc.)
  const renderMarkers = () => {
    return markers.map(marker => (
      <div
        key={marker.id}
        className="absolute top-0 h-6 border-l-2 cursor-pointer"
        style={{ 
          left: `${secondsToPixels(marker.time)}px`,
          borderColor: marker.color || 'rgba(59, 130, 246, 0.8)'
        }}
        title={marker.name}
      >
        <div className="text-xs px-1 py-0.5 rounded-sm" style={{ 
          backgroundColor: marker.color || 'rgba(59, 130, 246, 0.8)',
          transform: 'translateX(-50%)',
          color: 'white',
          whiteSpace: 'nowrap'
        }}>
          {marker.name}
        </div>
      </div>
    ));
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-md overflow-hidden">
      {/* Timeline toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 bg-gray-800 border-gray-700"
                  onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}
                >
                  <ZoomOut size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Slider
            value={[zoom * 100]}
            min={50}
            max={300}
            step={25}
            className="w-32"
            onValueChange={values => onZoomChange(values[0] / 100)}
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 bg-gray-800 border-gray-700"
                  onClick={() => onZoomChange(Math.min(3, zoom + 0.25))}
                >
                  <ZoomIn size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="h-5 border-l border-gray-700 mx-1"></div>
          
          <div className="flex items-center space-x-1">
            <Switch
              checked={snapEnabled}
              onCheckedChange={setSnapEnabled}
              id="snap-toggle"
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="snap-toggle" className="text-xs">Snap</Label>
          </div>
          
          <Select
            value={snapUnit}
            onValueChange={setSnapUnit}
            disabled={!snapEnabled}
          >
            <SelectTrigger className="h-7 w-24 bg-gray-800 border-gray-700 text-xs">
              <SelectValue placeholder="Snap Unit" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="beat">Beat</SelectItem>
              <SelectItem value="second">Second</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2 ${gridVisible ? 'text-blue-400 border-blue-800 bg-blue-950' : 'bg-gray-800 border-gray-700'}`}
                  onClick={() => setGridVisible(!gridVisible)}
                >
                  <Grid size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Grid</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tabs value={timeDisplay} onValueChange={(v) => setTimeDisplay(v as any)} className="h-7">
            <TabsList className="h-7 bg-gray-800">
              <TabsTrigger value="measures" className="h-6 text-xs px-2">Bars.Beats</TabsTrigger>
              <TabsTrigger value="seconds" className="h-6 text-xs px-2">Time</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="bg-gray-800 px-3 py-1 rounded-md font-mono text-sm">
            {timeDisplay === 'measures' 
              ? formatTimeAsMeasure(currentTime) 
              : formatTimeAsSeconds(currentTime)
            }
          </div>
        </div>
      </div>
      
      {/* Timeline header (time markers) */}
      <div className="relative h-6 border-b border-gray-800 overflow-hidden bg-gray-900" ref={timelineRef}>
        <div style={{ width: `${timelineWidth}px`, height: '100%', position: 'relative' }}>
          {renderTimeMarkers()}
          {renderMarkers()}
        </div>
      </div>
      
      {/* Main timeline area with tracks and regions */}
      <div 
        className="flex-1 overflow-auto relative"
        ref={containerRef}
        onClick={handleTimelineClick}
      >
        {/* Content container with proper width based on zoom */}
        <div style={{ width: `${timelineWidth}px`, minHeight: '100%', position: 'relative' }}>
          {/* Track lanes */}
          {renderTracks()}
          
          {/* Playhead */}
          <div
            ref={playheadRef}
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 cursor-ew-resize"
            style={{ left: `${secondsToPixels(currentTime)}px` }}
            onMouseDown={handlePlayheadDragStart}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full absolute -left-[5px] -top-1.5"></div>
          </div>
        </div>
      </div>
      
      {/* Context menu for regions */}
      {contextMenuPosition && contextMenuRegion && (
        <div 
          className="fixed z-50 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 w-48"
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
        >
          <button 
            className="w-full text-left px-3 py-1 text-sm hover:bg-gray-700"
            onClick={() => {
              onRegionDuplicate(contextMenuRegion);
              setContextMenuPosition(null);
            }}
          >
            Duplicate
          </button>
          <button 
            className="w-full text-left px-3 py-1 text-sm hover:bg-gray-700"
            onClick={() => {
              // Logic to split region at playhead position
              setContextMenuPosition(null);
            }}
          >
            Split at Playhead
          </button>
          <div className="border-t border-gray-700 my-1"></div>
          <button 
            className="w-full text-left px-3 py-1 text-sm text-red-400 hover:bg-gray-700"
            onClick={() => {
              onRegionDelete(contextMenuRegion);
              setContextMenuPosition(null);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// Individual audio region component
interface RegionComponentProps {
  region: AudioRegion;
  pixelsPerSecond: number;
  trackHeight: number;
  trackId: number;
  snapToGrid: (time: number) => number;
  onRegionClick: () => void;
  onRegionMove: (trackId: number, startTime: number) => void;
  onRegionResize: (startTime: number, duration: number) => void;
  onRegionDuplicate: () => void;
  onRegionDelete: () => void;
  setContextMenu: (id: string, position: {x: number, y: number}) => void;
}

function RegionComponent({
  region,
  pixelsPerSecond,
  trackHeight,
  trackId,
  snapToGrid,
  onRegionClick,
  onRegionMove,
  onRegionResize,
  onRegionDuplicate,
  onRegionDelete,
  setContextMenu
}: RegionComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [originalRegion, setOriginalRegion] = useState({
    startTime: region.startTime,
    duration: region.duration,
    trackId: region.trackId
  });
  
  // Convert seconds to pixels
  const startPx = region.startTime * pixelsPerSecond;
  const widthPx = region.duration * pixelsPerSecond;
  
  // Waveform visualization
  const renderWaveform = () => {
    if (!region.waveformData || region.waveformData.length === 0) {
      // Render a default pattern if no waveform data
      return (
        <div className="h-full flex items-center justify-center">
          <div className="h-1/2 w-full bg-opacity-30 bg-gradient-to-r from-transparent via-current to-transparent"></div>
        </div>
      );
    }
    
    // Calculate how many points we can show based on width
    const pointsToShow = Math.min(region.waveformData.length, Math.floor(widthPx));
    const skipFactor = region.waveformData.length / pointsToShow;
    
    const path = [...Array(pointsToShow)].map((_, i) => {
      const dataIndex = Math.floor(i * skipFactor);
      const amplitude = region.waveformData![dataIndex] * 0.5; // Scale to half for visualization
      const x = (i / pointsToShow) * widthPx;
      const y = (trackHeight / 2) * (1 - amplitude);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="100%" height="100%" className="pointer-events-none">
        <path 
          d={path} 
          stroke="currentColor" 
          strokeWidth="1.5" 
          fill="none" 
          strokeOpacity="0.7"
        />
        <path 
          d={[...Array(pointsToShow)].map((_, i) => {
            const dataIndex = Math.floor(i * skipFactor);
            const amplitude = region.waveformData![dataIndex] * 0.5;
            const x = (i / pointsToShow) * widthPx;
            const y = (trackHeight / 2) * (1 + amplitude);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ')} 
          stroke="currentColor" 
          strokeWidth="1.5" 
          fill="none"
          strokeOpacity="0.7"
        />
      </svg>
    );
  };
  
  // Handle mouse down on region (start drag or resize)
  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    
    if (action === 'drag') {
      setIsDragging(true);
    } else if (action === 'resize-start') {
      setIsResizing('start');
    } else if (action === 'resize-end') {
      setIsResizing('end');
    }
    
    setStartPosition({ x: e.clientX, y: e.clientY });
    setOriginalRegion({
      startTime: region.startTime,
      duration: region.duration,
      trackId: region.trackId
    });
  };
  
  // Handle mouse move (drag or resize)
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const deltaX = e.clientX - startPosition.x;
    const deltaTimeSeconds = deltaX / pixelsPerSecond;
    
    if (isDragging) {
      // Calculate new start time with snap
      const newStartTime = snapToGrid(Math.max(0, originalRegion.startTime + deltaTimeSeconds));
      
      // Find what track we're hovering over based on mouse position
      // This would require knowledge of the tracks' positions, which we don't have here
      // For simplicity, we'll keep the same track
      const newTrackId = originalRegion.trackId;
      
      onRegionMove(newTrackId, newStartTime);
    } else if (isResizing) {
      if (isResizing === 'start') {
        // Resize from start (changes both start time and duration)
        const maxDelta = originalRegion.duration - 0.1; // Ensure min duration of 0.1s
        const limitedDeltaTime = Math.min(maxDelta, deltaTimeSeconds);
        
        const newStartTime = snapToGrid(Math.max(0, originalRegion.startTime + limitedDeltaTime));
        const startDiff = newStartTime - originalRegion.startTime;
        const newDuration = Math.max(0.1, originalRegion.duration - startDiff);
        
        onRegionResize(newStartTime, newDuration);
      } else {
        // Resize from end (changes only duration)
        const newDuration = snapToGrid(Math.max(0.1, originalRegion.duration + deltaTimeSeconds));
        onRegionResize(originalRegion.startTime, newDuration);
      }
    }
  };
  
  // Handle mouse up (end drag or resize)
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };
  
  // Handle right click (context menu)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu(region.id, { x: e.clientX, y: e.clientY });
  };
  
  // Attach global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, startPosition, originalRegion]);
  
  return (
    <motion.div
      className={`absolute rounded-sm overflow-hidden ${
        region.selected ? 'ring-2 ring-blue-500' : ''
      } ${region.muted ? 'opacity-50' : ''}`}
      style={{
        left: `${startPx}px`,
        width: `${widthPx}px`,
        height: `${trackHeight - 4}px`,
        top: '2px',
        backgroundColor: region.color || '#3b82f6',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
      onClick={(e) => {
        e.stopPropagation();
        onRegionClick();
      }}
      onContextMenu={handleContextMenu}
      layout
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10"
        onMouseDown={(e) => handleMouseDown(e, 'resize-start')}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10"
        onMouseDown={(e) => handleMouseDown(e, 'resize-end')}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Region content */}
      <div className="absolute inset-0 px-2 pt-1 pb-2 flex flex-col text-white">
        <div className="text-xs font-medium truncate">{region.name}</div>
        <div className="flex-1 relative">
          {renderWaveform()}
        </div>
      </div>
    </motion.div>
  );
}