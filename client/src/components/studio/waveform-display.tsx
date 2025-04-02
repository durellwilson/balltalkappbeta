import React, { useEffect, useRef } from 'react';

interface WaveformDisplayProps {
  waveformData?: number[]; // Normalized amplitude data (0-1)
  color?: string;
  height: number;
  width?: number | string;
  barWidth?: number;
  barGap?: number;
  animated?: boolean;
  progress?: number; // 0-1 value for playback progress
  gain?: number; // Amplification factor for better visualization
  onClick?: (position: number) => void; // Returns normalized position (0-1)
  className?: string;
}

export function WaveformDisplay({
  waveformData = [],
  color = '#3b82f6',
  height,
  width = '100%',
  barWidth = 2,
  barGap = 1,
  animated = false,
  progress = 0,
  gain = 1.5,
  onClick,
  className = '',
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Generate random waveform data if none provided
  const data = waveformData.length > 0 
    ? waveformData 
    : Array.from({ length: 100 }, () => Math.random() * 0.5 + 0.1);
    
  // Draw the waveform on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set the canvas size accounting for device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    context.scale(dpr, dpr);
    
    const renderWidth = rect.width;
    const renderHeight = rect.height;
    
    // Clear the canvas
    context.clearRect(0, 0, renderWidth, renderHeight);
    
    // Calculate the number of bars that will fit in the available width
    const totalBars = Math.floor(renderWidth / (barWidth + barGap));
    const step = Math.max(1, Math.floor(data.length / totalBars));
    
    // Draw the waveform
    const drawWaveform = (animOffset = 0) => {
      context.clearRect(0, 0, renderWidth, renderHeight);
      
      // Draw background/progress
      if (progress > 0) {
        context.fillStyle = `${color}20`; // Very transparent background
        context.fillRect(0, 0, renderWidth, renderHeight);
        
        context.fillStyle = `${color}40`; // Progress background
        context.fillRect(0, 0, renderWidth * progress, renderHeight);
      }
      
      // Draw each bar
      for (let i = 0; i < totalBars; i++) {
        // Get data point, using step to sample the data array
        const dataIndex = Math.min(data.length - 1, Math.floor(i * step));
        let amplitude = data[dataIndex] * gain; // Apply gain for better visualization
        if (amplitude > 1) amplitude = 1; // Clamp to 1
        
        // Add a small animation offset if animated
        if (animated) {
          const offset = Math.sin((i * 0.2) + animOffset) * 0.1;
          amplitude = Math.max(0.02, amplitude + offset);
        }
        
        const barHeight = amplitude * renderHeight;
        const x = i * (barWidth + barGap);
        const y = (renderHeight - barHeight) / 2;
        
        // Determine color based on position relative to playback progress
        const barPosition = x / renderWidth;
        if (barPosition <= progress) {
          context.fillStyle = color; // Active part
        } else {
          context.fillStyle = `${color}80`; // Inactive part (semi-transparent)
        }
        
        // Draw the bar
        context.fillRect(x, y, barWidth, barHeight);
      }
    };
    
    // Initial draw
    drawWaveform();
    
    // Animation loop for the waveform
    if (animated) {
      let animOffset = 0;
      const animate = () => {
        animOffset += 0.05;
        drawWaveform(animOffset);
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
      
      // Cleanup animation
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [data, color, height, barWidth, barGap, animated, progress, gain]);
  
  // Handle click on the waveform
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = x / rect.width;
    
    onClick(position);
  };
  
  return (
    <canvas
      ref={canvasRef}
      height={height}
      style={{ width, height, display: 'block' }}
      className={`waveform-display ${className}`}
      onClick={onClick ? handleClick : undefined}
    />
  );
}