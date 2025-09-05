import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/admin';
import { generateGridVariants, GridVariant, getTemplateLayout } from '@/utils/gridVariantGenerator';
import { VariantRenderer } from './VariantRenderer';
import { CenterVariantsGallery } from './CenterVariantsGallery';
import { toast } from 'sonner';

interface CenterVariantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  preloadedVariants?: GridVariant[];
}

export const CenterVariantsModal: React.FC<CenterVariantsModalProps> = ({
  open,
  onOpenChange,
  order,
  preloadedVariants = [],
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [variants, setVariants] = useState<GridVariant[]>([]);
  const [renderedImages, setRenderedImages] = useState<Record<string, string>>({});
  const [currentRenderIndex, setCurrentRenderIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load cached images on mount
  useEffect(() => {
    if (open) {
      const cachedImages: Record<string, string> = {};
      let hasCache = false;
      
      // If we have preloaded variants, check for cached images
      if (preloadedVariants.length > 0) {
        console.log('Using preloaded variants:', preloadedVariants.length);
        
        // Try to load cached images
        for (const variant of preloadedVariants) {
          try {
            const cachedImage = localStorage.getItem(`variant-image-${variant.id}`);
            if (cachedImage) {
              cachedImages[variant.id] = cachedImage;
              hasCache = true;
            }
          } catch (e) {}
        }
        
        // Set variants from preloaded data
        setVariants(preloadedVariants);
        
        // If we have cached images, use them
        if (hasCache) {
          console.log('Using cached images for', Object.keys(cachedImages).length, 'variants');
          setRenderedImages(cachedImages);
          setProgress(Object.keys(cachedImages).length / preloadedVariants.length * 100);
          
          // If all images are cached, we're done
          if (Object.keys(cachedImages).length === preloadedVariants.length) {
            setIsGenerating(false);
            toast.success(`Loaded ${preloadedVariants.length} center variants from cache`);
          } else {
            // Start rendering from the first non-cached variant
            setCurrentRenderIndex(Object.keys(cachedImages).length);
            setIsGenerating(true);
          }
        } else {
          // No cached images, start rendering from the beginning
          setCurrentRenderIndex(0);
          setIsGenerating(true);
        }
      } else if (variants.length === 0) {
        generateVariants();
      }
    }
  }, [open, preloadedVariants]);

  const generateVariants = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setRenderedImages({});
    setCurrentRenderIndex(0);
    
    try {
      console.log('Generating variants for order:', order.id, 'Members:', order.members.length);
      
      // Use preloaded variants if available
      let generatedVariants = preloadedVariants;
      
      // Generate variants if none were preloaded
      if (generatedVariants.length === 0) {
        generatedVariants = await generateGridVariants(order);
      }
      
      console.log('Generated variants:', generatedVariants.length, generatedVariants.map(v => v.centerMember.name));
      setVariants(generatedVariants);
      setCurrentRenderIndex(0);
      
      if (generatedVariants.length === 0) {
        setIsGenerating(false);
        setError('No variants could be generated');
        toast.error('No variants could be generated');
      } else {
        console.log('Starting to render variants...');
      }
    } catch (error) {
      console.error('Error generating variants:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate variants');
      toast.error('Failed to generate variants');
      setIsGenerating(false);
    }
  };

  const handleVariantRendered = (variantId: string, dataUrl: string) => {
    // Cache rendered images in localStorage for future use
    try {
      localStorage.setItem(`variant-image-${variantId}`, dataUrl);
    } catch (e) {
      console.warn('Failed to cache variant image in localStorage:', e);
    }
    console.log('Variant rendered successfully:', variantId);
    setRenderedImages(prev => ({ ...prev, [variantId]: dataUrl }));
    
    setCurrentRenderIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      const progressPercentage = Math.min((newIndex / variants.length) * 100, 100);
      setProgress(progressPercentage);
      
      console.log(`Progress: ${newIndex}/${variants.length} (${progressPercentage.toFixed(1)}%)`);
      
      if (newIndex >= variants.length) {
        console.log('All variants rendered successfully!');
        setIsGenerating(false);
        toast.success(`Generated ${variants.length} center variants successfully`);
      }
      
      return newIndex;
    });
  };

  // Add timeout to handle stuck rendering
  useEffect(() => {
    if (isGenerating && variants.length > 0) {
      const timeout = setTimeout(() => {
        if (currentRenderIndex < variants.length) {
          console.log('Rendering timeout, moving to next variant or finishing');
          setCurrentRenderIndex(prev => {
            const newIndex = prev + 1;
            if (newIndex >= variants.length) {
              setIsGenerating(false);
              const renderedCount = Object.keys(renderedImages).length;
              if (renderedCount > 0) {
                toast.success(`Generated ${renderedCount} of ${variants.length} center variants`);
              } else {
                setError('Failed to render any variants');
                toast.error('Failed to render variants');
              }
            }
            return newIndex;
          });
        }
      }, 10000); // 10 second timeout per variant

      return () => clearTimeout(timeout);
    }
  }, [isGenerating, currentRenderIndex, variants.length, renderedImages]);

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
    setProgress(0);
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
            {/* <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button> */}
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
              Rendered {Object.keys(renderedImages).length} of {variants.length} variants
            </p>
            {variants.length > 0 && currentRenderIndex < variants.length && (
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
        {(() => {
          const layout = getTemplateLayout(order.gridTemplate, order.members.length);
          // Map known layouts to our template keys used by VariantRenderer
          // 33 template (34/35 total cells including center) => '33'
          // 45 template (75 total cells including center)   => '45'
          const templateKey = layout && (layout.totalCells === 34 || layout.totalCells === 35)
            ? '33'
            : layout && layout.totalCells === 75
            ? '45'
            : '45';

          return variants.map((variant, index) => (
            index === currentRenderIndex && (
              <VariantRenderer
                key={variant.id}
                order={order}
                variant={variant}
                onRendered={handleVariantRendered}
                templateKey={templateKey}
              />
            )
          ));
        })()}
      </DialogContent>
    </Dialog>
  );
};
