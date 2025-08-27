
import React, { useState } from 'react';
import { Download, Eye, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GridVariant } from '@/utils/gridVariantGenerator';
import { toast } from 'sonner';

interface CenterVariantsGalleryProps {
  variants: GridVariant[];
  renderedImages: Record<string, string>;
  onDownloadSelected: (variantIds: string[]) => void;
  onDownloadAll: () => void;
  onPreview: (variant: GridVariant) => void;
}

export const CenterVariantsGallery: React.FC<CenterVariantsGalleryProps> = ({
  variants,
  renderedImages,
  onDownloadSelected,
  onDownloadAll,
  onPreview,
}) => {
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [previewVariant, setPreviewVariant] = useState<GridVariant | null>(null);

  const handleSelectAll = () => {
    if (selectedVariants.length === variants.length) {
      setSelectedVariants([]);
    } else {
      setSelectedVariants(variants.map(v => v.id));
    }
  };

  const handleSelectVariant = (variantId: string) => {
    setSelectedVariants(prev => 
      prev.includes(variantId) 
        ? prev.filter(id => id !== variantId)
        : [...prev, variantId]
    );
  };

  const handleDownloadSingle = (variantId: string) => {
    const imageData = renderedImages[variantId];
    if (!imageData) {
      toast.error('Image not ready for download');
      return;
    }

    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const link = document.createElement('a');
    link.href = imageData;
    link.download = `grid-variant-${variant.centerMember.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Variant downloaded successfully');
  };

  const handlePreviewVariant = (variant: GridVariant) => {
    setPreviewVariant(variant);
    onPreview(variant);
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="flex items-center space-x-2"
          >
            {selectedVariants.length === variants.length ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>Select All ({variants.length})</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedVariants.length} of {variants.length} selected
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => onDownloadSelected(selectedVariants)}
            disabled={selectedVariants.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Selected ({selectedVariants.length})
          </Button>
          <Button onClick={onDownloadAll}>
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {variants.map((variant) => {
          const imageData = renderedImages[variant.id];
          const isSelected = selectedVariants.includes(variant.id);
          
          return (
            <Card key={variant.id} className={`relative overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-2">
                <div className="aspect-square relative">
                  {imageData ? (
                    <img
                      src={imageData}
                      alt={`Variant with ${variant.centerMember.name} in center`}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted animate-pulse rounded flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Rendering...</span>
                    </div>
                  )}
                  
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectVariant(variant.id)}
                      className="bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  {imageData && (
                    <div className="absolute bottom-2 right-2 flex space-x-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePreviewVariant(variant)}
                        className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownloadSingle(variant.id)}
                        className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="mt-2">
                  <p className="text-sm font-medium truncate">{variant.centerMember.name}</p>
                  <p className="text-xs text-muted-foreground">Center Position</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewVariant} onOpenChange={() => setPreviewVariant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Preview: {previewVariant?.centerMember.name} in Center
            </DialogTitle>
          </DialogHeader>
          {previewVariant && renderedImages[previewVariant.id] && (
            <div className="flex justify-center">
              <img
                src={renderedImages[previewVariant.id]}
                alt={`Preview of variant with ${previewVariant.centerMember.name} in center`}
                className="max-w-full max-h-96 object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
