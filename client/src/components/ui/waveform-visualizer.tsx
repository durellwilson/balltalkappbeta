import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import audioProcessor from '@/lib/audioProcessor';

// Helper function to format time in MM:SS format
const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface WaveformVisualizerProps extends React.HTMLAttributes<HTMLDivElement> {
  trackId?: number;
  buffer?: AudioBuffer | null;  // For backward compatibility
  audioBuffer?: AudioBuffer | null | undefined; // Preferred naming
  waveform?: number[];  // Raw waveform data
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
  buffer,
  audioBuffer,
  waveform,
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
    
    // First check if we have direct waveform data
    if (waveform && waveform.length > 0) {
      // Use the directly provided waveform data
      waveformData = waveform;
    } else {
      // Check if we have an audio buffer provided directly
      const bufferToUse = audioBuffer || buffer;
      
      if (bufferToUse) {
        // Extract waveform data from the provided AudioBuffer
        const channelData = bufferToUse.getChannelData(0); // Use first channel
        
        // Downsample the data if it's too large
        const maxPoints = Math.min(canvas.width * 2, channelData.length);
        const samplingRate = Math.floor(channelData.length / maxPoints);
        
        waveformData = [];
        for (let i = 0; i < channelData.length; i += samplingRate) {
          // Get peak value in each segment 
          let maxVal = 0;
          const end = Math.min(i + samplingRate, channelData.length);
          for (let j = i; j < end; j++) {
            maxVal = Math.max(maxVal, Math.abs(channelData[j]));
          }
          waveformData.push(maxVal);
        }
      } else if (isMaster) {
        // Full master waveform is a Float32Array, convert to numbers
        const masterData = audioProcessor.getWaveform();
        waveformData = Array.from(masterData).map(v => Math.abs(v));
      } else if (trackId !== undefined) {
        const track = audioProcessor.getTrack(trackId);
        if (track) {
          waveformData = track.getFullWaveform();
        }
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

  }, [trackId, color, gradientColors, height, width, gain, showTimeMarkers, duration, isMaster, buffer, audioBuffer, waveform]);

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
      let waveformData: Float32Array | number[];
      
      // Use the directly provided waveform data if available
      if (waveform && waveform.length > 0) {
        waveformData = waveform;
      } else if (isMaster) {
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
      if (Array.isArray(waveformData)) {
        // If it's a number[] array, use it directly
        drawAnimatedWaveform(ctx, waveformData, canvas.width, canvas.height, color, gradientColors, gain);
      } else {
        // If it's a Float32Array, convert it to an array first
        drawAnimatedWaveform(ctx, Array.from(waveformData), canvas.width, canvas.height, color, gradientColors, gain);
      }
      
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
  }, [animated, trackId, color, gradientColors, gain, isMaster, waveform]);

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
  
  // For high-resolution waveforms, use a more detailed drawing approach
  if (data.length > width) {
    // For higher resolution data, we need to downsample
    const step = Math.max(1, Math.floor(data.length / width));
    
    // Draw the waveform as a series of vertical bars
    for (let x = 0; x < width; x++) {
      // Find the maximum value in this step range
      let maxValue = 0;
      const startIdx = Math.floor(x * step);
      const endIdx = Math.min(data.length, startIdx + step);
      
      for (let i = startIdx; i < endIdx; i++) {
        maxValue = Math.max(maxValue, data[i]);
      }
      
      // Apply gain and ensure we have a reasonable value
      const value = Math.min(1, maxValue * gain);
      
      // Calculate bar height, ensure it's at least 1px
      const barHeight = Math.max(1, Math.min(height, value * height));
      
      // Draw symmetric from center
      const top = centerY - barHeight / 2;
      
      ctx.fillRect(x, top, 1, barHeight);
    }
  } else {
    // For low-resolution data, interpolate between points for a smoother look
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    // Map each data point to the display width
    const widthStep = width / Math.max(1, data.length - 1);
    
    // Top half of the waveform
    for (let i = 0; i < data.length; i++) {
      const x = i * widthStep;
      const value = Math.min(1, data[i] * gain);
      const y = centerY - (value * height / 2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Bottom half of the waveform (mirror image)
    for (let i = data.length - 1; i >= 0; i--) {
      const x = i * widthStep;
      const value = Math.min(1, data[i] * gain);
      const y = centerY + (value * height / 2);
      
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();
  }
};

// Helper function to draw time markers
const drawTimeMarkers = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  duration: number
) => {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  
  // Draw markers every 15 seconds, or more frequent for short clips
  const interval = duration > 120 ? 30 : (duration > 60 ? 15 : 5);
  const markers = Math.floor(duration / interval);
  
  for (let i = 0; i <= markers; i++) {
    const time = i * interval;
    const x = (time / duration) * width;
    
    // Draw vertical line
    ctx.fillRect(x, height - 12, 1, 8);
    
    // Draw time text below
    if (i % 2 === 0 || duration < 30) { // Skip some labels on longer tracks
      ctx.fillText(formatTime(time), x, height - 2);
    }
  }
};

// Helper function to draw an animated waveform
const drawAnimatedWaveform = (
  ctx: CanvasRenderingContext2D, 
  data: number[], 
  width: number, 
  height: number,
  color: string,
  gradientColors?: string[],
  gain: number = 1.0
) => {
  const centerY = height / 2;
  
  // Apply time-based animation effect
  const now = Date.now() / 1000;
  const animationFactor = Math.sin(now * 5) * 0.15 + 0.85; // Pulse between 0.7-1.0
  
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
  
  // Create a secondary gradient for peak highlights - more vibrant for animation
  let highlightStyle: string | CanvasGradient = 'rgba(255, 255, 255, 0.5)';
  if (gradientColors && gradientColors.length >= 2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(200, 200, 255, 0.3)');
    highlightStyle = gradient;
  } else {
    // Create a more vibrant highlight if no gradient colors specified
    const highlightGradient = ctx.createLinearGradient(0, 0, 0, height);
    
    // Extract base color components for highlight calculation
    let r = 255, g = 255, b = 255;
    if (color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (match) {
        r = parseInt(match[1], 10);
        g = parseInt(match[2], 10);
        b = parseInt(match[3], 10);
      }
    }
    
    // Create shimmer effect highlights
    highlightGradient.addColorStop(0, `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 80)}, 0.7)`);
    highlightGradient.addColorStop(1, `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 50)}, 0.3)`);
    highlightStyle = highlightGradient;
  }
  
  ctx.fillStyle = fillStyle;
  
  // Draw waveform with smoothing between points and mirrored about center
  const sliceWidth = width / data.length;
  
  // Apply slight vibration based on animation factor
  const vibration = animationFactor * 0.5;
  
  // Draw path from center out with a smoother approach
  ctx.beginPath();
  
  // Start at the center on the left side
  ctx.moveTo(0, centerY);
  
  // Enhanced drawing approach for cleaner visualization
  // For high-resolution waveform (more data points than pixels)
  if (data.length > width) {
    // Use the peak values for each pixel column
    const step = Math.max(1, Math.floor(data.length / width));
    
    let prevY = centerY;
    
    for (let x = 0; x < width; x++) {
      // Find peak amplitudes in this segment
      let maxVal = 0;
      const startIdx = Math.floor(x * step);
      const endIdx = Math.min(data.length, startIdx + step);
      
      for (let i = startIdx; i < endIdx; i++) {
        maxVal = Math.max(maxVal, Math.abs(data[i]));
      }
      
      // Apply gain and clamp value
      const value = Math.min(1, maxVal * gain * 1.2); // Slightly boost for visibility
      
      // Use a smoothed approach with previous point
      const y = centerY + (centerY * value * 0.9);
      
      // Smoothly interpolate for more pleasing curves
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        const cpx = x - sliceWidth / 2;
        const cpy = (prevY + y) / 2;
        ctx.quadraticCurveTo(cpx, cpy, x, y);
      }
      
      prevY = y;
    }
    
    // Mirror for the bottom half with the same smooth approach
    for (let x = width - 1; x >= 0; x--) {
      const startIdx = Math.floor(x * step);
      const endIdx = Math.min(data.length, startIdx + step);
      let maxVal = 0;
      
      for (let i = startIdx; i < endIdx; i++) {
        maxVal = Math.max(maxVal, Math.abs(data[i]));
      }
      
      const value = Math.min(1, maxVal * gain * 1.2);
      const y = centerY - (centerY * value * 0.9);
      
      ctx.lineTo(x, y);
    }
  } else {
    // For lower-resolution data, draw a smoother curve
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
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Add a highlight/glow effect for better visual impact
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  
  // Draw a subtle highlight line for peak detection
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  
  // Get peak values for a highlight line
  let prevX = 0;
  let prevY = centerY;
  const peakStep = Math.max(1, Math.floor(data.length / (width / 3)));
  
  for (let i = 0; i < data.length; i += peakStep) {
    const x = (i / data.length) * width;
    const value = Math.min(1, Math.abs(data[i]) * gain * 1.2);
    const y = centerY - (value * height * 0.4);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      // Use a bezier curve for smoother highlights
      const cx = (prevX + x) / 2;
      ctx.quadraticCurveTo(cx, prevY, x, y);
    }
    
    prevX = x;
    prevY = y;
  }
  
  ctx.stroke();
  
  // Add some brighter peak markers for key points
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  const markerStep = Math.floor(data.length / 8);
  
  for (let i = 0; i < data.length; i += markerStep) {
    const value = Math.abs(data[i]) * gain;
    if (value > 0.7) { // Only show for significant peaks
      const x = (i / data.length) * width;
      const markerSize = Math.min(4, value * 5);
      ctx.beginPath();
      ctx.arc(x, centerY - (value * height * 0.4), markerSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};



export { WaveformVisualizer };
export type { WaveformVisualizerProps };