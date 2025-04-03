import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'destructive' | 'warning' | 'default';
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'destructive'
}: ConfirmationDialogProps) {
  // Determine variant styles
  const getVariantIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  const getHeaderBg = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-900/20';
      case 'warning':
        return 'bg-yellow-900/20';
      default:
        return 'bg-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 text-white border-gray-800 sm:max-w-md">
        <DialogHeader className={`${getHeaderBg()} p-4 rounded-lg flex flex-row items-center gap-4 -mt-2 -mx-2`}>
          {getVariantIcon()}
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="text-gray-400 mt-1">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="sm:justify-between mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button 
            variant={getButtonVariant()} 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}