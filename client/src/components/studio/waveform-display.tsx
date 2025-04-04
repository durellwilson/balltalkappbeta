import React, { useRef, useEffect } from 'react';

interface WaveformDisplayProps {
  waveform: Float32Array | number[];
  color?: string;
  backgroundColor?: string;
  width?: number;
  height?: number;
  lineWidth?: number;
  animated?: boolean;
}

export function WaveformDisplay({
  waveform,
  color = 'rgba(59, 130, 246, 0.8)',
  backgroundColor = 'rgba(0, 0, 0, 0.1)',
  width,
  height,
  lineWidth = 3, // Increased for better visibility
  animated = false
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  
  // Draw the waveform on the canvas
  const drawWaveform = (ctx: CanvasContext, time = 0) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const { width: canvasWidth, height: canvasHeight } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw background
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    // Calculate animation phase if animated
    let animPhase = 0;
    if (animated) {
      animPhase = (time % 2000) / 2000; // 2 second cycle
    }
    
    // Set line style
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    
    // Start drawing path
    ctx.beginPath();
    
    // Calculate step size to skip samples if needed
    const step = Math.max(1, Math.floor(waveform.length / canvasWidth));
    
    // Draw waveform
    for (let i = 0; i < canvasWidth; i++) {
      const index = Math.min(Math.floor(i * step), waveform.length - 1);
      let value = waveform[index] || 0;
      
      // Apply subtle animation if animated
      if (animated) {
        const oscillation = Math.sin(i / 10 + animPhase * Math.PI * 2) * 0.1;
        value = Math.max(-1, Math.min(1, value * (1 + oscillation)));
      }
      
      // Convert value to Y coordinate (centered in the middle)
      // Amplify the values slightly to make waveforms more visible
      value = Math.min(1, value * 1.5); // Amplify by 1.5x but cap at 1.0
      const y = (0.5 + value / -2) * canvasHeight;
      
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    
    // Draw the path
    ctx.stroke();
    
    // Request next animation frame if animated
    if (animated) {
      animationRef.current = requestAnimationFrame((timestamp) => drawWaveform(ctx, timestamp - startTimeRef.current));
    }
  };
  
  // Initialize and update canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions to match container if not explicitly provided
    if (!width || !height) {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    }
    
    // Start animation or draw static waveform
    if (animated) {
      startTimeRef.current = Date.now();
      animationRef.current = requestAnimationFrame((timestamp) => 
        drawWaveform(ctx, timestamp - startTimeRef.current)
      );
    } else {
      drawWaveform(ctx);
    }
    
    // Clean up animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveform, color, backgroundColor, width, height, lineWidth, animated]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full"
    />
  );
}

type CanvasContext = CanvasRenderingContext2D;