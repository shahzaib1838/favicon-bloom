import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileImage, FileType } from 'lucide-react';

interface FormatSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormatSelect: (format: 'png' | 'jpg' | 'ico') => void;
}

export const FormatSelector = ({ open, onOpenChange, onFormatSelect }: FormatSelectorProps) => {
  const formats = [
    {
      format: 'png' as const,
      name: 'PNG',
      description: 'Best for web use with transparency',
      icon: FileImage
    },
    {
      format: 'jpg' as const,
      name: 'JPG',
      description: 'Smaller file size, no transparency',
      icon: FileImage
    },
    {
      format: 'ico' as const,
      name: 'ICO',
      description: 'Traditional favicon format',
      icon: FileType
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Download Format</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {formats.map(({ format, name, description, icon: Icon }) => (
            <Button
              key={format}
              variant="outline"
              className="w-full h-auto p-4 flex items-center justify-start gap-4 hover:bg-primary/5"
              onClick={() => onFormatSelect(format)}
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{name}</div>
                <div className="text-sm text-muted-foreground">{description}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};