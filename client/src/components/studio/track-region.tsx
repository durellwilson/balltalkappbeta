import React from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  MoreHorizontal, 
  Copy, 
  Scissors, 
  Trash2,
  FileSymlink
} from 'lucide-react';
import { AudioRegion } from '../../lib/audio-engine';
import { WaveformDisplay } from './waveform-display';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface TrackRegionProps {
  region: AudioRegion;
  selected: boolean;
  pixelsPerSecond: number;
  height: number;
  onSelect: (regionId: string) => void;
  onMoveStart: (regionId: string, e: React.MouseEvent) => void;
  onResizeLeftStart: (regionId: string, e: React.MouseEvent) => void;
  onResizeRightStart: (regionId: string, e: React.MouseEvent) => void;
  onCopy: (regionId: string) => void;
  onDelete: (regionId: string) => void;
  onSplit: (regionId: string) => void;
  onToggleLock: (regionId: string, locked: boolean) => void;
  currentTime: number;
  trackColor?: string;
}

export function TrackRegion({
  region,
  selected,
  pixelsPerSecond,
  height,
  onSelect,
  onMoveStart,
  onResizeLeftStart,
  onResizeRightStart,
  onCopy,
  onDelete,
  onSplit,
  onToggleLock,
  currentTime,
  trackColor = '#3b82f6'
}: TrackRegionProps) {
  // Calculate width and position based on time values
  const width = (region.end - region.start) * pixelsPerSecond;
  const left = region.start * pixelsPerSecond;
  
  // Calculate progress position within the region
  let progress = 0;
  if (currentTime >= region.start && currentTime <= region.end) {
    progress = (currentTime - region.start) / (region.end - region.start);
  } else if (currentTime > region.end) {
    progress = 1;
  }

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`absolute z-10 rounded-md ${
        selected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-400'
      } ${region.locked ? 'opacity-80' : ''}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: region.color || trackColor
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(region.id);
      }}
    >
      {/* Resize handle (left) */}
      {!region.locked && (
        <div 
          className="absolute left-0 top-0 w-3 h-full cursor-col-resize z-20"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeLeftStart(region.id, e);
          }}
        >
          <div className="absolute left-0 top-0 w-1 h-full bg-white/30 rounded-l" />
        </div>
      )}
      
      {/* Resize handle (right) */}
      {!region.locked && (
        <div 
          className="absolute right-0 top-0 w-3 h-full cursor-col-resize z-20"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeRightStart(region.id, e);
          }}
        >
          <div className="absolute right-0 top-0 w-1 h-full bg-white/30 rounded-r" />
        </div>
      )}
      
      {/* Region content */}
      <div 
        className="absolute inset-0 p-1.5 flex flex-col"
        onMouseDown={(e) => {
          if (region.locked) return;
          e.stopPropagation();
          onMoveStart(region.id, e);
        }}
      >
        {/* Region header */}
        <div className="flex items-center justify-between mb-1 z-20">
          <div className="text-xs font-medium text-white truncate pr-1 flex-1 drop-shadow-md">
            {region.name}
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Lock/Unlock button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-white hover:bg-black/20"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(region.id, !region.locked);
              }}
            >
              {region.locked ? (
                <Lock size={10} className="text-white/80" />
              ) : (
                <Unlock size={10} className="text-white/80" />
              )}
            </Button>
            
            {/* Region options menu */}
            {!region.locked && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-white hover:bg-black/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal size={10} className="text-white/80" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="bg-gray-800 border-gray-700 text-xs w-32" 
                  align="end"
                >
                  <DropdownMenuItem
                    className="py-0.5 cursor-pointer flex items-center"
                    onClick={() => onCopy(region.id)}
                  >
                    <Copy size={11} className="mr-1.5" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="py-0.5 cursor-pointer flex items-center"
                    onClick={() => onSplit(region.id)}
                  >
                    <Scissors size={11} className="mr-1.5" />
                    Split at Playhead
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="py-0.5 cursor-pointer flex items-center text-red-400 hover:text-red-300"
                    onClick={() => onDelete(region.id)}
                  >
                    <Trash2 size={11} className="mr-1.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Waveform visualization */}
        <div className="flex-1 w-full">
          <WaveformDisplay
            waveformData={region.waveform}
            height={height - 35}
            color={region.color || trackColor}
            animated={false}
            progress={progress}
            gain={1.8}
          />
        </div>
        
        {/* Region duration */}
        <div className="text-[9px] text-white/70 text-right z-20 drop-shadow-md">
          {formatDuration(region.end - region.start)}
        </div>
      </div>
    </motion.div>
  );
}