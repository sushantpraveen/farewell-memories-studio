import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/admin';
import { generateGridVariants, GridVariant } from '@/utils/gridVariantGenerator';
import { VariantRenderer } from './VariantRenderer';
import { CenterVariantsGallery } from './CenterVariantsGallery';
import { toast } from 'sonner';

interface CenterVariantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export const CenterVariantsModal: React.FC<CenterVariantsModalProps> = ({
  open,
  onOpenChange,
  order,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [variants, setVariants] = useState<GridVariant[]>([]);
  const [renderedImages, setRenderedImages] = useState<Record<string, string>>({});
  const [currentRenderIndex, setCurrentRenderIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && variants.length === 0) {
      generateVariants();
    }
  }, [open]);

  const generateVariants = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setRenderedImages({});
    setCurrentRenderIndex(0);
    
    try {
      console.log('Generating variants for order:', order.id);
      const generatedVariants = await generateGridVariants(order);
      console.log('Generated variants:', generatedVariants.length);
      setVariants(generatedVariants);
      setCurrentRenderIndex(0);
      
      if (generatedVariants.length === 0) {
        setIsGenerating(false);
        setError('No variants could be generated');
        toast.error('No variants could be generated');
      }
    } catch (error) {
      console.error('Error generating variants:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate variants');
      toast.error('Failed to generate variants');
      setIsGenerating(false);
    }
  };

  const handleVariantRendered = (variantId: string, dataUrl: string) => {
    console.log('Variant rendered:', variantId);
    setRenderedImages(prev => ({ ...prev, [variantId]: dataUrl }));
    
    setCurrentRenderIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      const progressPercentage = Math.min((newIndex / variants.length) * 100, 100);
      setProgress(progressPercentage);
      
      console.log(`Progress: ${newIndex}/${variants.length} (${progressPercentage.toFixed(1)}%)`);
      
      if (newIndex >= variants.length) {
        setIsGenerating(false);
        toast.success(`Generated ${variants.length} center variants successfully`);
        console.log('All variants rendered successfully');
      }
      
      return newIndex;
    });
  };

  const handleDownloadSelected = async (variantIds: string[]) => {
    if (variantIds.length === 0) {
      toast.error('No variants selected');
      return;
    }

    if (variantIds.length === 1) {
      // Single download
      const variantId = variantIds[0];
      const imageData = renderedImages[variantId];
      const variant = variants.find(v => v.id === variantId);
      
      if (imageData && variant) {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `grid-variant-${variant.centerMember.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Variant downloaded successfully');
      }
    } else {
      // Multiple downloads with delay
      toast.info(`Downloading ${variantIds.length} variants...`);
      
      for (let i = 0; i < variantIds.length; i++) {
        const variantId = variantIds[i];
        const imageData = renderedImages[variantId];
        const variant = variants.find(v => v.id === variantId);
        
        if (imageData && variant) {
          const link = document.createElement('a');
          link.href = imageData;
          link.download = `grid-variant-${variant.centerMember.name.replace(/\s+/g, '-').toLowerCase()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Add delay between downloads to avoid browser blocking
          if (i < variantIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      toast.success(`${variantIds.length} variants downloaded successfully`);
    }
  };

  const handleDownloadAll = () => {
    handleDownloadSelected(variants.map(v => v.id));
  };

  const handlePreview = (variant: GridVariant) => {
    // Preview handled by the gallery component
  };

  const handleRetry = () => {
    setVariants([]);
    setRenderedImages({});
    setCurrentRenderIndex(0);
    generateVariants();
  };

  const handleClose = () => {
    setVariants([]);
    setRenderedImages({});
    setCurrentRenderIndex(0);
    setProgress(0);
    setIsGenerating(false);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Generate Center Variants</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {error ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={handleRetry}>Retry</Button>
          </div>
        ) : isGenerating ? (
          <div className="text-center py-8 space-y-4">
            <h3 className="text-lg font-medium">Generating Center Variants...</h3>
            <Progress value={progress} className="max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground">
              Rendered {currentRenderIndex} of {variants.length} variants
            </p>
            {variants.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Currently rendering: {variants[currentRenderIndex]?.centerMember?.name || 'Unknown'}
              </p>
            )}
          </div>
        ) : variants.length > 0 ? (
          <CenterVariantsGallery
            variants={variants}
            renderedImages={renderedImages}
            onDownloadSelected={handleDownloadSelected}
            onDownloadAll={handleDownloadAll}
            onPreview={handlePreview}
          />
        ) : null}

        {/* Hidden renderers for generating images */}
        {variants.map((variant, index) => (
          index === currentRenderIndex && (
            <VariantRenderer
              key={variant.id}
              order={order}
              variant={variant}
              onRendered={handleVariantRendered}
            />
          )
        ))}
      </DialogContent>
    </Dialog>
  );
};
