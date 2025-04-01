import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import audioProcessor from '@/lib/audioProcessor';

interface SpectrumAnalyzerProps extends React.HTMLAttributes<HTMLDivElement> {
  trackId?: number; 
  height?: number;
  width?: string;
  barCount?: number;
  barWidth?: number;
  barSpacing?: number;
  responsive?: boolean;
  gradientColors?: string[];
  showLabels?: boolean;
  showScale?: boolean;
  showPeaks?: boolean;
  smoothingFactor?: number;
  peakHoldTime?: number;
  isMaster?: boolean;
  style?: 'bars' | 'line' | 'area';
  className?: string;
}

/**
 * SpectrumAnalyzer visualizes frequency data with smooth animations
 * Uses efficient canvas rendering for high performance
 */
const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  trackId,
  height = 120,
  width = '100%',
  barCount = 64,
  barWidth = 3,
  barSpacing = 1,
  responsive = true,
  gradientColors = ['#3b82f6', '#8b5cf6', '#d946ef'],
  showLabels = false,
  showScale = false,
  showPeaks = true,
  smoothingFactor = 0.6,
  peakHoldTime = 1000,
  isMaster = false,
  style = 'bars',
  className,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastDataRef = useRef<Float32Array | null>(null);
  const peaksRef = useRef<number[]>([]);
  const peakTimersRef = useRef<number[]>([]);
  
  useEffect(() => {
    // Initialize the peaks array
    peaksRef.current = new Array(barCount).fill(0);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let isActive = true;
    
    // Animation function to render the spectrum
    const animate = () => {
      if (!isActive || !canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get frequency data (either from track or master)
      let frequencyData: Float32Array;
      
      if (isMaster) {
        // Use master spectral analyzer
        frequencyData = audioProcessor.spectralAnalyzer?.getValue() as Float32Array;
      } else if (trackId !== undefined) {
        const track = audioProcessor.getTrack(trackId);
        if (track) {
          frequencyData = track.getSpectrum?.() || new Float32Array(barCount);
        } else {
          frequencyData = new Float32Array(barCount);
        }
      } else {
        frequencyData = new Float32Array(barCount);
      }
      
      // If we don't have data yet, use a placeholder
      if (!frequencyData || frequencyData.length === 0) {
        frequencyData = new Float32Array(barCount);
        // Add some noise for visual interest in the placeholder
        for (let i = 0; i < barCount; i++) {
          frequencyData[i] = Math.random() * 0.1 - 80;
        }
      }
      
      // Apply smoothing if we have previous data
      if (lastDataRef.current) {
        for (let i = 0; i < frequencyData.length; i++) {
          frequencyData[i] = smoothingFactor * lastDataRef.current[i] + 
            (1 - smoothingFactor) * frequencyData[i];
        }
      }
      
      // Save current data for next frame
      lastDataRef.current = new Float32Array(frequencyData);
      
      // Update peaks
      for (let i = 0; i < Math.min(barCount, frequencyData.length); i++) {
        // Convert to dB scale and normalize (typically -100 to 0 dB)
        const dbValue = Math.max(-100, frequencyData[i]);
        const normalizedValue = 1 - Math.abs(dbValue) / 100;
        
        // Update peak if current value is higher
        if (normalizedValue > peaksRef.current[i]) {
          peaksRef.current[i] = normalizedValue;
          
          // Clear any existing timer for this peak
          if (peakTimersRef.current[i]) {
            window.clearTimeout(peakTimersRef.current[i]);
          }
          
          // Set timer to decay peak
          peakTimersRef.current[i] = window.setTimeout(() => {
            peaksRef.current[i] = 0;
          }, peakHoldTime);
        }
      }
      
      // Draw the spectrum based on the selected style
      switch (style) {
        case 'bars':
          drawBars(ctx, frequencyData, canvas.width, canvas.height, barCount, barWidth, barSpacing, gradientColors, peaksRef.current, showPeaks);
          break;
        case 'line':
          drawLine(ctx, frequencyData, canvas.width, canvas.height, gradientColors);
          break;
        case 'area':
          drawArea(ctx, frequencyData, canvas.width, canvas.height, gradientColors);
          break;
      }
      
      // Draw scale if enabled
      if (showScale) {
        drawScale(ctx, canvas.width, canvas.height);
      }
      
      // Draw labels if enabled
      if (showLabels) {
        drawLabels(ctx, canvas.width, canvas.height);
      }
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup function
    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Clear any peak timers
      peakTimersRef.current.forEach(timer => {
        if (timer) window.clearTimeout(timer);
      });
    };
  }, [trackId, barCount, barWidth, barSpacing, gradientColors, showLabels, showScale, showPeaks, smoothingFactor, peakHoldTime, isMaster, style]);

  // Handle responsive resizing
  useEffect(() => {
    if (!responsive || !containerRef.current || !canvasRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === container) {
          canvas.width = entry.contentRect.width;
          canvas.height = height;
        }
      }
    });
    
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [responsive, height]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden rounded-md bg-black/20', className)}
      style={{ width, height }}
      {...props}
    >
      <canvas
        ref={canvasRef}
        width={typeof width === 'number' ? width : 500}
        height={height}
        className="block w-full h-full"
      />
    </div>
  );
};

// Helper to draw bars style spectrum
const drawBars = (
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  width: number,
  height: number,
  barCount: number,
  barWidth: number,
  barSpacing: number,
  gradientColors: string[],
  peaks: number[],
  showPeaks: boolean
) => {
  // Create gradient
  const gradient = ctx.createLinearGradient(0, height, 0, 0);
  gradientColors.forEach((color, index) => {
    gradient.addColorStop(index / (gradientColors.length - 1), color);
  });
  
  // Calculate available width and adjust bar size if needed
  const totalBarWidth = barCount * (barWidth + barSpacing) - barSpacing;
  const scale = Math.min(1, width / totalBarWidth);
  const scaledBarWidth = barWidth * scale;
  const scaledSpacing = barSpacing * scale;
  
  // Center bars if they don't fill the width
  const startX = (width - (barCount * (scaledBarWidth + scaledSpacing) - scaledSpacing)) / 2;
  
  ctx.fillStyle = gradient;
  
  // Draw each bar
  for (let i = 0; i < Math.min(barCount, data.length); i++) {
    // Convert from dB to a normalized value (typically -100dB to 0dB)
    const dbValue = Math.max(-100, data[i]);
    const normalizedValue = 1 - Math.abs(dbValue) / 100;
    
    // Calculate bar height
    const barHeight = normalizedValue * height;
    
    // Calculate x position
    const x = startX + i * (scaledBarWidth + scaledSpacing);
    
    // Draw bar
    ctx.fillRect(x, height - barHeight, scaledBarWidth, barHeight);
    
    // Draw peak if enabled
    if (showPeaks && peaks[i] > 0) {
      const peakY = height - (peaks[i] * height);
      ctx.fillRect(x, peakY - 1, scaledBarWidth, 2);
    }
  }
};

// Helper to draw line style spectrum
const drawLine = (
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  width: number,
  height: number,
  gradientColors: string[]
) => {
  // Calculate points for the line
  const points: {x: number, y: number}[] = [];
  
  for (let i = 0; i < data.length; i++) {
    // Convert from dB to a normalized value
    const dbValue = Math.max(-100, data[i]);
    const normalizedValue = 1 - Math.abs(dbValue) / 100;
    
    // Calculate x and y coordinates
    const x = (i / (data.length - 1)) * width;
    const y = height - (normalizedValue * height);
    
    points.push({ x, y });
  }
  
  // Draw the line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length; i++) {
    // Use bezier curves for smoother line
    if (i < points.length - 1) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    } else {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  
  // Create gradient for the stroke
  const gradient = ctx.createLinearGradient(0, height, 0, 0);
  gradientColors.forEach((color, index) => {
    gradient.addColorStop(index / (gradientColors.length - 1), color);
  });
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Add glow effect
  ctx.shadowColor = gradientColors[0];
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;
};

// Helper to draw area style spectrum
const drawArea = (
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  width: number,
  height: number,
  gradientColors: string[]
) => {
  // Calculate points for the area
  const points: {x: number, y: number}[] = [];
  
  for (let i = 0; i < data.length; i++) {
    // Convert from dB to a normalized value
    const dbValue = Math.max(-100, data[i]);
    const normalizedValue = 1 - Math.abs(dbValue) / 100;
    
    // Calculate x and y coordinates
    const x = (i / (data.length - 1)) * width;
    const y = height - (normalizedValue * height);
    
    points.push({ x, y });
  }
  
  // Draw the area
  ctx.beginPath();
  ctx.moveTo(points[0].x, height); // Start at the bottom left
  ctx.lineTo(points[0].x, points[0].y); // Move to the first point
  
  for (let i = 1; i < points.length; i++) {
    // Use bezier curves for smoother line
    if (i < points.length - 1) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    } else {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  
  ctx.lineTo(points[points.length - 1].x, height); // Move to the bottom right
  ctx.closePath();
  
  // Create gradient for the fill
  const gradient = ctx.createLinearGradient(0, height, 0, 0);
  gradientColors.forEach((color, index) => {
    const stopColor = index === 0 ? color + '20' : color + 'A0'; // Add transparency
    gradient.addColorStop(index / (gradientColors.length - 1), stopColor);
  });
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add a stroke for the top edge
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length; i++) {
    if (i < points.length - 1) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    } else {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  
  ctx.strokeStyle = gradientColors[gradientColors.length - 1];
  ctx.lineWidth = 1.5;
  ctx.stroke();
};

// Helper to draw frequency scale
const drawScale = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  const logBase = 20;
  const maxLog = Math.log10(20000 / logBase);
  
  ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  
  frequencies.forEach(freq => {
    // Calculate x position using logarithmic scale
    const logPos = Math.log10(freq / logBase) / maxLog;
    const x = logPos * width;
    
    // Draw tick mark
    ctx.fillRect(x, height - 12, 1, 5);
    
    // Draw label
    const label = freq >= 1000 ? `${freq/1000}k` : `${freq}`;
    ctx.fillText(label, x, height - 3);
  });
};

// Helper to draw dB labels
const drawLabels = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const dbLevels = [0, -12, -24, -36, -48, -60];
  
  ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  
  dbLevels.forEach(level => {
    // Calculate y position
    const y = (Math.abs(level) / 100) * height;
    
    // Draw line
    ctx.fillRect(0, y, width, 1);
    
    // Draw label
    ctx.fillText(`${level} dB`, width - 5, y - 3);
  });
};

export { SpectrumAnalyzer };
export type { SpectrumAnalyzerProps };