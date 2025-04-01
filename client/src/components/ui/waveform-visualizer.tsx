import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import audioProcessor from '@/lib/audioProcessor';

interface WaveformVisualizerProps extends React.HTMLAttributes<HTMLDivElement> {
  trackId?: number;
  color?: string;
  gradientColors?: string[];
  height?: number;
  width?: string;
  animated?: boolean;
  showPlayhead?: boolean;
  showScale?: boolean;
  showTimeMarkers?: boolean;
  gain?: number;
  responsive?: boolean;
  playbackPosition?: number;
  duration?: number;
  onPositionClick?: (position: number) => void;
  isActive?: boolean;
  isMaster?: boolean;
}

/**
 * WaveformVisualizer renders high-performance audio waveforms with animations and interactions
 * For real-time visualization, use in combination with the AudioProcessor
 */
const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  trackId,
  color = 'rgba(59, 130, 246, 0.8)',
  gradientColors,
  height = 80,
  width = '100%',
  animated = true,
  showPlayhead = true,
  showScale = false,
  showTimeMarkers = false,
  gain = 1.0,
  responsive = true,
  playbackPosition = 0,
  duration = 0,
  onPositionClick,
  isActive = false,
  isMaster = false,
  className,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  // Render static waveform if available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get waveform data from AudioProcessor - use either track-specific or master
    let waveformData: number[] = [];
    
    if (isMaster) {
      // Full master waveform is a Float32Array, convert to numbers
      const masterData = audioProcessor.getWaveform();
      waveformData = Array.from(masterData).map(v => Math.abs(v));
    } else if (trackId !== undefined) {
      const track = audioProcessor.getTrack(trackId);
      if (track) {
        waveformData = track.getFullWaveform();
      }
    }

    if (waveformData.length === 0) {
      // Draw placeholder waveform if no data available
      drawPlaceholderWaveform(ctx, canvas.width, canvas.height);
      return;
    }

    // Draw the waveform
    drawStaticWaveform(ctx, waveformData, canvas.width, canvas.height, color, gradientColors, gain);

    // Draw time markers if requested
    if (showTimeMarkers && duration > 0) {
      drawTimeMarkers(ctx, canvas.width, canvas.height, duration);
    }

  }, [trackId, color, gradientColors, height, width, gain, showTimeMarkers, duration, isMaster]);

  // Render playhead position
  useEffect(() => {
    if (!showPlayhead || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear only the playhead area
    const playheadX = (playbackPosition / duration) * canvas.width;
    
    // Redraw waveform (simplified for performance)
    // In a full implementation, we'd only redraw the changed areas
    
    // Draw playhead
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(playheadX - 1, 0, 2, canvas.height);
    
    // Draw hover position indicator when user hovers
    if (hoverPosition !== null) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(hoverPosition, 0, 1, canvas.height);
    }
    
  }, [playbackPosition, duration, showPlayhead, hoverPosition]);

  // Animated waveform effect
  useEffect(() => {
    if (!animated || !canvasRef.current) return;
    
    let animationActive = true;
    setIsPlaying(true);
    
    const renderFrame = () => {
      if (!animationActive || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get real-time data for animation
      let waveformData: Float32Array;
      
      if (isMaster) {
        waveformData = audioProcessor.getWaveform();
      } else if (trackId !== undefined) {
        const track = audioProcessor.getTrack(trackId);
        if (track) {
          waveformData = track.getWaveform();
        } else {
          // No track available, draw placeholder
          drawPlaceholderWaveform(ctx, canvas.width, canvas.height);
          animationRef.current = requestAnimationFrame(renderFrame);
          return;
        }
      } else {
        // No track specified, draw placeholder
        drawPlaceholderWaveform(ctx, canvas.width, canvas.height);
        animationRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      
      // Draw animated waveform
      drawAnimatedWaveform(ctx, waveformData, canvas.width, canvas.height, color, gradientColors, gain);
      
      // Request next frame
      animationRef.current = requestAnimationFrame(renderFrame);
    };
    
    // Start animation
    renderFrame();
    
    // Cleanup
    return () => {
      animationActive = false;
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animated, trackId, color, gradientColors, gain, isMaster]);

  // Handle responsive resizing
  useEffect(() => {
    if (!responsive || !canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === container) {
          canvas.width = entry.contentRect.width;
          canvas.height = height;
          
          // Force re-render of waveform when size changes
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Force redraw here if needed
          }
        }
      }
    });
    
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [responsive, height]);

  // Handle click on waveform to change position
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPositionClick || !canvasRef.current || duration <= 0) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = (x / canvas.width) * duration;
    
    onPositionClick(position);
  };

  // Handle mouse move to show hover position
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    setHoverPosition(x);
  };

  // Handle mouse leave to hide hover position
  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  return (
    <div 
      ref={containerRef} 
      className={cn(
        'relative overflow-hidden rounded-md',
        isActive ? 'ring-2 ring-blue-500' : '',
        className
      )}
      style={{ width, height }}
      {...props}
    >
      <canvas
        ref={canvasRef}
        width={typeof width === 'number' ? width : 500}
        height={height}
        className="block w-full h-full"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Optional time scale */}
      {showScale && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-4 text-xs flex justify-between px-2 text-gray-400">
          <span>0:00</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
      
      {/* Visual enhancement for active state */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
      )}
      
      {/* Animated playing indicator */}
      {isPlaying && animated && (
        <div className="absolute top-1 right-1 flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></div>
          <span className="text-xs text-gray-400">LIVE</span>
        </div>
      )}
    </div>
  );
};

// Helper function to draw a placeholder waveform
const drawPlaceholderWaveform = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number
) => {
  const centerY = height / 2;
  const amplitude = height / 4;
  
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  
  // Draw a sine-wave like placeholder
  for (let x = 0; x < width; x++) {
    const y = centerY + Math.sin(x / 30) * amplitude * Math.random() * 0.5;
    ctx.lineTo(x, y);
  }
  
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
  ctx.stroke();
};

// Helper function to draw a static waveform
const drawStaticWaveform = (
  ctx: CanvasRenderingContext2D, 
  data: number[], 
  width: number, 
  height: number,
  color: string,
  gradientColors?: string[],
  gain: number = 1.0
) => {
  const centerY = height / 2;
  const step = Math.max(1, Math.floor(data.length / width));
  
  // Create gradient if colors are provided
  let fillStyle: string | CanvasGradient = color;
  if (gradientColors && gradientColors.length >= 2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const step = 1 / (gradientColors.length - 1);
    
    gradientColors.forEach((color, index) => {
      gradient.addColorStop(index * step, color);
    });
    
    fillStyle = gradient;
  }
  
  ctx.fillStyle = fillStyle;
  
  // Draw the waveform as a series of vertical bars
  for (let x = 0; x < width; x++) {
    const index = Math.floor(x * step);
    const dataIndex = Math.min(data.length - 1, index);
    const value = data[dataIndex] * gain;
    
    // Calculate bar height, ensure it's at least 1px
    const barHeight = Math.max(1, Math.min(height, value * height));
    
    // Draw symmetric from center
    const top = centerY - barHeight / 2;
    
    ctx.fillRect(x, top, 1, barHeight);
  }
};

// Helper function to draw an animated waveform
const drawAnimatedWaveform = (
  ctx: CanvasRenderingContext2D, 
  data: Float32Array, 
  width: number, 
  height: number,
  color: string,
  gradientColors?: string[],
  gain: number = 1.0
) => {
  const centerY = height / 2;
  
  // Create gradient if colors are provided
  let fillStyle: string | CanvasGradient = color;
  if (gradientColors && gradientColors.length >= 2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const step = 1 / (gradientColors.length - 1);
    
    gradientColors.forEach((color, index) => {
      gradient.addColorStop(index * step, color);
    });
    
    fillStyle = gradient;
  }
  
  ctx.fillStyle = fillStyle;
  
  // Draw waveform with smoothing between points and mirrored about center
  const sliceWidth = width / data.length;
  
  // Draw path from center out
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  
  for (let i = 0; i < data.length; i++) {
    const x = i * sliceWidth;
    // Apply gain and make sure value is within range
    const value = Math.min(1, Math.abs(data[i]) * gain);
    const y = centerY + (centerY * value * 0.95);
    
    ctx.lineTo(x, y);
  }
  
  // Mirror the path back to the start
  for (let i = data.length - 1; i >= 0; i--) {
    const x = i * sliceWidth;
    const value = Math.min(1, Math.abs(data[i]) * gain);
    const y = centerY - (centerY * value * 0.95);
    
    ctx.lineTo(x, y);
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Add a highlight/glow effect for better visual impact
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  
  for (let i = 0; i < data.length; i++) {
    const x = i * sliceWidth;
    const value = Math.min(1, Math.abs(data[i]) * gain);
    const y = centerY + (centerY * value * 0.85);
    
    ctx.lineTo(x, y);
  }
  
  // Add a subtle glow
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
};

// Helper function to draw time markers
const drawTimeMarkers = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number,
  duration: number
) => {
  const numMarkers = Math.min(10, Math.floor(duration));
  
  ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
  ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  
  for (let i = 1; i < numMarkers; i++) {
    const x = (i / numMarkers) * width;
    
    // Draw marker line
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    
    // Draw time label
    const time = (i / numMarkers) * duration;
    ctx.fillText(formatTime(time), x, 10);
  }
};

// Helper to format time in MM:SS format
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export { WaveformVisualizer };
export type { WaveformVisualizerProps };