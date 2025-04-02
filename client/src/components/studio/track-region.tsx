import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Copy, Scissors, Trash2 } from 'lucide-react';
import type { AudioRegion } from '../../lib';
import { WaveformDisplay } from './waveform-display';

interface TrackRegionProps {
  region: AudioRegion;
  selected: boolean;
  pixelsPerSecond: number;
  height: number;
  currentTime: number;
  trackColor?: string;
  onSelect: (regionId: string) => void;
  onMoveStart: (regionId: string, e: React.MouseEvent) => void;
  onResizeLeftStart: (regionId: string, e: React.MouseEvent) => void;
  onResizeRightStart: (regionId: string, e: React.MouseEvent) => void;
  onCopy?: (regionId: string) => void;
  onDelete?: (regionId: string) => void;
  onSplit?: (regionId: string) => void;
  onToggleLock?: (regionId: string, locked: boolean) => void;
}

export function TrackRegion({
  region,
  selected,
  pixelsPerSecond,
  height,
  currentTime,
  trackColor = '#3b82f6',
  onSelect,
  onMoveStart,
  onResizeLeftStart,
  onResizeRightStart,
  onCopy,
  onDelete,
  onSplit,
  onToggleLock
}: TrackRegionProps) {
  // Format time as mm:ss.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Calculate region width and position
  const regionWidth = (region.end - region.start) * pixelsPerSecond;
  const regionLeft = region.start * pixelsPerSecond;
  
  // Check if playhead is inside this region
  const isPlayheadInside = currentTime >= region.start && currentTime <= region.end;
  const playheadPosition = (currentTime - region.start) * pixelsPerSecond;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute top-1 rounded cursor-pointer ${
        selected 
          ? 'ring-2 ring-blue-500 z-10' 
          : 'hover:ring-1 hover:ring-gray-400'
      } ${region.locked ? 'opacity-80' : ''}`}
      style={{
        left: `${regionLeft}px`,
        width: `${regionWidth}px`,
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
          className="absolute left-0 top-0 w-2 h-full cursor-col-resize hover:bg-white/10"
          onMouseDown={(e) => onResizeLeftStart(region.id, e)}
        />
      )}
      
      {/* Resize handle (right) */}
      {!region.locked && (
        <div 
          className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-white/10"
          onMouseDown={(e) => onResizeRightStart(region.id, e)}
        />
      )}
      
      {/* Region content */}
      <div 
        className="h-full p-1 flex flex-col relative"
        onMouseDown={(e) => onMoveStart(region.id, e)}
      >
        {/* Region header */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-medium text-white truncate pr-1 flex-1">
            {region.name}
          </div>
          
          {/* Lock/unlock toggle */}
          {onToggleLock && (
            <button 
              className="text-white opacity-70 hover:opacity-100 p-0.5 rounded hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(region.id, !region.locked);
              }}
            >
              {region.locked ? (
                <Lock size={12} />
              ) : (
                <Unlock size={12} />
              )}
            </button>
          )}
        </div>
        
        {/* Waveform visualization */}
        <div className="flex-1 relative overflow-hidden">
          {region.waveform ? (
            <WaveformDisplay 
              waveform={region.waveform} 
              color="rgba(255, 255, 255, 0.6)" 
              backgroundColor="rgba(0, 0, 0, 0.2)"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1/3 bg-white/20 rounded-full" />
            </div>
          )}
          
          {/* Playhead indicator when playing inside this region */}
          {isPlayheadInside && (
            <div 
              className="absolute top-0 h-full w-0.5 bg-white shadow-glow pointer-events-none"
              style={{ left: `${playheadPosition}px` }}
            />
          )}
        </div>
        
        {/* Region duration */}
        <div className="text-[10px] text-white/70 flex justify-between items-center mt-1">
          <div>{formatTime(region.end - region.start)}</div>
          
          {/* Quick actions that appear when selected */}
          {selected && (
            <div className="flex space-x-1">
              {onSplit && (
                <button 
                  className="text-white/70 hover:text-white p-0.5 rounded hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSplit(region.id);
                  }}
                >
                  <Scissors size={10} />
                </button>
              )}
              
              {onCopy && (
                <button 
                  className="text-white/70 hover:text-white p-0.5 rounded hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(region.id);
                  }}
                >
                  <Copy size={10} />
                </button>
              )}
              
              {onDelete && (
                <button 
                  className="text-white/70 hover:text-red-400 p-0.5 rounded hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(region.id);
                  }}
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}