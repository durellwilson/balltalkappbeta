import React, { useState, useRef } from 'react';
import { File, Music, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  allowMultiple?: boolean;
  acceptedFileTypes?: string[];
  maxSize?: number; // in MB
}

export function FileDropZone({ 
  onFilesSelected, 
  allowMultiple = false, 
  acceptedFileTypes = ['.mp3', '.wav', '.aiff', '.m4a'], 
  maxSize = 50 // 50MB default max
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const validateFiles = (files: File[]): File[] => {
    return Array.from(files).filter(file => {
      // Check file type
      if (acceptedFileTypes.length > 0) {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedFileTypes.includes(fileExtension)) {
          toast({
            title: "Unsupported File Format",
            description: `${file.name} is not a supported audio format. Please use ${acceptedFileTypes.join(', ')}`,
            variant: "destructive"
          });
          return false;
        }
      }
      
      // Check file size
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the ${maxSize}MB size limit`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(Array.from(e.dataTransfer.files));
      
      if (validFiles.length > 0) {
        // If multiple files aren't allowed, just take the first one
        const filesToUpload = allowMultiple ? validFiles : [validFiles[0]];
        onFilesSelected(filesToUpload);
      }
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(Array.from(e.target.files));
      
      if (validFiles.length > 0) {
        const filesToUpload = allowMultiple ? validFiles : [validFiles[0]];
        onFilesSelected(filesToUpload);
      }
    }
    
    // Reset the input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div 
      className={`
        border-2 border-dashed rounded-lg p-6 text-center transition-colors 
        ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/30'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileInputChange}
        accept={acceptedFileTypes.join(',')}
        multiple={allowMultiple}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        {isDragging ? (
          <Music className="h-12 w-12 text-blue-500 animate-pulse" />
        ) : (
          <Upload className="h-10 w-10 text-gray-400" />
        )}
        
        <div className="space-y-1">
          <h3 className="text-lg font-medium">
            {isDragging ? 'Drop Audio File Now' : 'Import Audio Files'}
          </h3>
          <p className="text-sm text-gray-400">
            Drag &amp; drop audio files here or click below to browse
          </p>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button 
            variant="outline" 
            onClick={handleBrowseClick}
            className="border-gray-700"
          >
            <File className="mr-2 h-4 w-4" />
            Browse Files
          </Button>
          
          <span className="text-xs text-gray-500">
            Supported formats: {acceptedFileTypes.join(', ')} (max {maxSize}MB)
          </span>
        </div>
      </div>
    </div>
  );
}