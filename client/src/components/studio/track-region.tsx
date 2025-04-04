import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Copy, Scissors, Trash2, Clock, Music, FileMusic, AlignJustify, Wand2 } from 'lucide-react';
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
  
  // Get region type icon based on name or type property
  const getRegionIcon = () => {
    const name = region.name.toLowerCase();
    if (name.includes('drum') || name.includes('beat')) {
      return <AlignJustify size={12} />;
    } else if (name.includes('vocal') || name.includes('voice') || name.includes('vox')) {
      return <Music size={12} />;
    } else if (name.includes('record') || name.includes('take')) {
      return <FileMusic size={12} />;
    } else if (name.includes('ai') || name.includes('gen')) {
      return <Wand2 size={12} />;
    }
    return <Clock size={12} />;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute top-1 rounded-md overflow-hidden cursor-pointer transition-all ${
        selected 
          ? 'z-10 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
          : 'shadow-md hover:shadow-lg'
      } ${region.locked ? 'opacity-80 grayscale-[30%]' : ''}`}
      style={{
        left: `${regionLeft}px`,
        width: `${regionWidth}px`,
        height: `${height}px`,
        backgroundColor: region.color || trackColor,
        boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.8)' : undefined,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(region.id);
      }}
    >
      {/* Pro DAW-style region design with better visual hierarchy */}
      <div className="absolute inset-0">
        {/* Bottom glossy gradient to simulate professional DAW region styling */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-1/2 opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
        
        {/* Grid pattern overlay for visual appeal (subtle) */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{
               backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,.5) 0, rgba(255,255,255,.5) 1px, transparent 1px, transparent ${height/8}px)`,
               backgroundSize: `${pixelsPerSecond * 0.25}px ${height}px`
             }} 
        />
      </div>
      
      {/* Top and bottom edges for a cleaner look */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/40" />
      
      {/* Selected outline effect */}
      {selected && (
        <div className="absolute inset-0 pointer-events-none bg-blue-500/10 z-0" />
      )}
      
      {/* Resize handle (left) with improved appearance */}
      {!region.locked && (
        <div 
          className="absolute left-0 top-0 w-3 h-full cursor-col-resize group hover:bg-white/10 z-10"
          onMouseDown={(e) => onResizeLeftStart(region.id, e)}
        >
          <div className="absolute left-0 inset-y-0 w-[1px] bg-white/30 h-full" />
          <div className="absolute left-[1px] inset-y-0 w-[1px] bg-white/10 h-full group-hover:bg-white/30 transition-colors" />
          <div className="absolute left-[2px] inset-y-0 w-[1px] bg-white/5 h-full" />
        </div>
      )}
      
      {/* Resize handle (right) with improved appearance */}
      {!region.locked && (
        <div 
          className="absolute right-0 top-0 w-3 h-full cursor-col-resize group hover:bg-white/10 z-10"
          onMouseDown={(e) => onResizeRightStart(region.id, e)}
        >
          <div className="absolute right-0 inset-y-0 w-[1px] bg-white/30 h-full" />
          <div className="absolute right-[1px] inset-y-0 w-[1px] bg-white/10 h-full group-hover:bg-white/30 transition-colors" />
          <div className="absolute right-[2px] inset-y-0 w-[1px] bg-white/5 h-full" />
        </div>
      )}
      
      {/* Region content */}
      <div 
        className="h-full px-2 pt-1.5 pb-1 flex flex-col relative z-0"
        onMouseDown={(e) => {
          if (region.locked) return;
          // Use right mouse button for dragging
          if (e.button === 0) {
            onMoveStart(region.id, e);
          }
        }}
        onClick={(e) => {
          // Calculate position within region for time setting
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const percentageIntoRegion = clickX / rect.width;
          const timePointInRegion = region.start + (percentageIntoRegion * (region.end - region.start));
          
          // Dispatch custom event to notify that user clicked on a specific point in time
          window.dispatchEvent(new CustomEvent('region-time-clicked', {
            detail: { time: timePointInRegion }
          }));
        }}
      >
        {/* Pro-style region header with better typography */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-semibold text-white truncate pr-1 flex-1 flex items-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
            <span className="mr-1.5 opacity-80 bg-black/20 p-0.5 rounded-sm">
              {getRegionIcon()}
            </span>
            <span>
              {region.name}
            </span>
          </div>
          
          {/* Lock/unlock toggle with improved styling */}
          {onToggleLock && (
            <button 
              className="text-white opacity-70 hover:opacity-100 p-0.5 rounded-sm bg-black/20 hover:bg-black/40 transition-colors"
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
        
        {/* PRO-style Waveform visualization */}
        <div className="flex-1 relative overflow-hidden rounded-sm bg-black/20">
          {region.waveform ? (
            <>
              {/* Main waveform display */}
              <WaveformDisplay 
                waveform={region.waveform} 
                color="rgba(255, 255, 255, 0.85)" 
                backgroundColor="rgba(0, 0, 0, 0)"
              />
              
              {/* Shadow waveform for pro appearance */}
              <div className="absolute inset-0 opacity-30 scale-y-90 translate-y-[5%]">
                <WaveformDisplay 
                  waveform={region.waveform} 
                  color="rgba(0, 0, 0, 0.5)" 
                  backgroundColor="rgba(0, 0, 0, 0)"
                />
              </div>
              
              {/* Highlight line at the top of the waveform */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1/3 bg-gradient-to-r from-white/10 via-white/30 to-white/10 rounded-sm" />
            </div>
          )}
          
          {/* Playhead indicator when playing inside this region with improved visual */}
          {isPlayheadInside && (
            <div className="absolute top-0 h-full pointer-events-none flex items-center justify-center"
                 style={{ left: `${playheadPosition}px` }}>
              <div className="h-full w-[1px] bg-white/80" />
              <div className="absolute top-0 h-full w-[3px] bg-blue-500/50 blur-[2px]" />
              <div className="absolute top-0 w-1 h-1 bg-white rounded-full -mt-0.5 -ml-0.5" />
              <div className="absolute bottom-0 w-1 h-1 bg-white rounded-full -mb-0.5 -ml-0.5" />
            </div>
          )}
          
          {/* Subtle time divisions for visual reference */}
          {regionWidth > 100 && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: Math.ceil((region.end - region.start) / 0.25) }).map((_, i) => {
                const posX = i * 0.25 * pixelsPerSecond;
                return (
                  <div 
                    key={`tick-${i}`}
                    className={`absolute top-0 h-full w-px ${i % 4 === 0 ? 'bg-white/15' : 'bg-white/5'}`}
                    style={{ left: `${posX}px` }}
                  />
                );
              })}
            </div>
          )}
        </div>
        
        {/* Region information footer with improved layout */}
        <div className="text-[10px] font-medium text-white/90 flex justify-between items-center mt-1 px-0.5">
          <div className="bg-black/30 px-1.5 py-0.5 rounded-sm drop-shadow-sm">
            {formatTime(region.end - region.start)}
          </div>
          
          {/* Quick actions that appear when selected with improved styling */}
          {selected && (
            <div className="flex space-x-1 bg-black/40 backdrop-blur-sm p-0.5 rounded-sm">
              {onSplit && (
                <button 
                  className="text-white/90 hover:text-white p-0.5 rounded-sm hover:bg-blue-500/40 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSplit(region.id);
                  }}
                  title="Split at playhead"
                >
                  <Scissors size={11} />
                </button>
              )}
              
              {onCopy && (
                <button 
                  className="text-white/90 hover:text-white p-0.5 rounded-sm hover:bg-blue-500/40 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(region.id);
                  }}
                  title="Duplicate"
                >
                  <Copy size={11} />
                </button>
              )}
              
              {onDelete && (
                <button 
                  className="text-white/90 hover:text-red-400 p-0.5 rounded-sm hover:bg-red-500/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(region.id);
                  }}
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}