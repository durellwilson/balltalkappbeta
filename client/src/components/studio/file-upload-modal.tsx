import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileDropZone } from './file-drop-zone';
import { Loader2 } from 'lucide-react';

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<boolean>;
  title?: string;
  description?: string;
  allowMultiple?: boolean;
}

export function FileUploadModal({
  open,
  onOpenChange,
  onUpload,
  title = 'Import Audio Files',
  description = 'Upload audio files to use in your project.',
  allowMultiple = false,
}: FileUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };
  
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      const success = await onUpload(files);
      if (success) {
        // Clear selection and close modal on success
        setFiles([]);
        onOpenChange(false);
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCancel = () => {
    setFiles([]);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            allowMultiple={allowMultiple}
          />
          
          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Selected files:</h4>
              <ul className="text-sm space-y-1 max-h-24 overflow-y-auto">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-gray-500 ml-2">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-row justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-700"
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}