import React, { useState, useCallback, useRef } from 'react';
import { Upload, Download, Package, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { FormatSelector } from './FormatSelector';

interface GeneratedFavicon {
  size: number;
  canvas: HTMLCanvasElement;
  blob: Blob;
}

const FAVICON_SIZES = [16, 32, 48, 64, 128, 256];

export const FaviconGenerator = () => {
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [generatedFavicons, setGeneratedFavicons] = useState<GeneratedFavicon[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [selectedDownload, setSelectedDownload] = useState<{ type: 'single'; favicon: GeneratedFavicon } | { type: 'all' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateFavicon = useCallback(async (img: HTMLImageElement, size: number): Promise<GeneratedFavicon> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    canvas.width = size;
    canvas.height = size;
    
    // Draw image with proper scaling and centering
    const minDimension = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - minDimension) / 2;
    const sy = (img.naturalHeight - minDimension) / 2;
    
    ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, size, size);
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    });
    
    return { size, canvas, blob };
  }, []);

  const processImage = useCallback(async (file: File) => {
    setIsGenerating(true);
    try {
      const img = new Image();
      img.onload = async () => {
        setUploadedImage(img);
        
        const favicons = await Promise.all(
          FAVICON_SIZES.map(size => generateFavicon(img, size))
        );
        
        setGeneratedFavicons(favicons);
        setIsGenerating(false);
        toast.success('Favicons generated successfully!');
      };
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
      setIsGenerating(false);
    }
  }, [generateFavicon]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    processImage(file);
  }, [processImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const downloadSingle = (favicon: GeneratedFavicon, format: 'png' | 'jpg' | 'ico') => {
    const canvas = favicon.canvas;
    const link = document.createElement('a');
    
    if (format === 'ico') {
      // For ICO, we'll use PNG format but with .ico extension
      link.href = canvas.toDataURL('image/png');
      link.download = `favicon-${favicon.size}x${favicon.size}.ico`;
    } else {
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      link.href = canvas.toDataURL(mimeType, 0.9);
      link.download = `favicon-${favicon.size}x${favicon.size}.${format}`;
    }
    
    link.click();
    toast.success(`Downloaded ${favicon.size}x${favicon.size} favicon as ${format.toUpperCase()}`);
  };

  const downloadAll = async (format: 'png' | 'jpg' | 'ico') => {
    const zip = new JSZip();
    
    for (const favicon of generatedFavicons) {
      const canvas = favicon.canvas;
      const extension = format === 'ico' ? 'ico' : format;
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      
      const dataUrl = canvas.toDataURL(mimeType, 0.9);
      const base64Data = dataUrl.split(',')[1];
      
      zip.file(`favicon-${favicon.size}x${favicon.size}.${extension}`, base64Data, { base64: true });
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `favicons-${format}.zip`;
    link.click();
    
    toast.success(`Downloaded all favicons as ${format.toUpperCase()} in ZIP file`);
  };

  const handleDownloadClick = (type: 'single' | 'all', favicon?: GeneratedFavicon) => {
    if (type === 'single' && favicon) {
      setSelectedDownload({ type: 'single', favicon });
    } else {
      setSelectedDownload({ type: 'all' });
    }
    setShowFormatSelector(true);
  };

  const handleFormatSelect = (format: 'png' | 'jpg' | 'ico') => {
    if (selectedDownload?.type === 'single') {
      downloadSingle(selectedDownload.favicon, format);
    } else {
      downloadAll(format);
    }
    setShowFormatSelector(false);
    setSelectedDownload(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Favicon Generator</h1>
          <p className="text-muted-foreground text-lg">Upload any image and convert it to perfect favicons</p>
        </div>

        {/* Upload Area */}
        <Card className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer ${
              isDragOver ? 'drag-over' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Upload Your Image</h3>
                <p className="text-muted-foreground">
                  Drag & drop an image here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PNG, JPG, JPEG, WebP formats
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {isGenerating && (
          <Card className="p-8 fade-in">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center pulse-primary">
                <FileImage className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Generating Favicons...</h3>
              <p className="text-muted-foreground">Creating favicons in multiple sizes</p>
            </div>
          </Card>
        )}

        {/* Generated Favicons */}
        {generatedFavicons.length > 0 && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Generated Favicons</h2>
              <Button 
                onClick={() => handleDownloadClick('all')}
                className="gap-2"
              >
                <Package className="w-4 h-4" />
                Download All
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {generatedFavicons.map((favicon) => (
                <Card key={favicon.size} className="p-4 text-center space-y-3">
                  <div className="bg-muted rounded-lg p-4 flex items-center justify-center">
                    <canvas
                      ref={(canvas) => {
                        if (canvas && favicon.canvas) {
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            canvas.width = favicon.size;
                            canvas.height = favicon.size;
                            ctx.drawImage(favicon.canvas, 0, 0);
                          }
                        }
                      }}
                      className="max-w-full max-h-16"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">{favicon.size}×{favicon.size}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadClick('single', favicon)}
                      className="w-full gap-2"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Format Selector Modal */}
        <FormatSelector
          open={showFormatSelector}
          onOpenChange={setShowFormatSelector}
          onFormatSelect={handleFormatSelect}
        />
      </div>
    </div>
  );
};