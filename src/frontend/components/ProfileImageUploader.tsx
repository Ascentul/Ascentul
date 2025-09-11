import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";

interface ProfileImageUploaderProps {
  onImageUploaded: (imageDataUrl: string) => Promise<any>;
  currentImage?: string;
  children: React.ReactNode;
}

export default function ProfileImageUploader({ 
  onImageUploaded, 
  currentImage, 
  children 
}: ProfileImageUploaderProps) {
  const [image, setImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1); // Start at cover size
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Natural image size and computed base (object-fit: cover) size within the container at zoom=1
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [baseSize, setBaseSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 256, h: 256 });
  
  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setImage(null);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setNaturalSize(null);
      setBaseSize({ w: 0, h: 0 });
      // Measure container size when dialog opens
      setTimeout(() => {
        if (imageContainerRef.current) {
          const rect = imageContainerRef.current.getBoundingClientRect();
          setContainerSize({ w: rect.width, h: rect.height });
        }
      }, 0);
    }
  }, [isOpen]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImage(dataUrl);
      setZoom(1);
      // Load the image to get natural dimensions
      const img = new Image();
      img.onload = () => {
        const nat = { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height };
        setNaturalSize(nat);
        // Measure container and compute base cover size
        setTimeout(() => {
          if (!imageContainerRef.current) return;
          const rect = imageContainerRef.current.getBoundingClientRect();
          const containerW = rect.width;
          const containerH = rect.height;
          setContainerSize({ w: containerW, h: containerH });
          const scale = Math.max(containerW / nat.w, containerH / nat.h);
          const baseW = nat.w * scale;
          const baseH = nat.h * scale;
          setBaseSize({ w: baseW, h: baseH });
          // Center image
          setPosition({ x: (containerW - baseW) / 2, y: (containerH - baseH) / 2 });
        }, 0);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };
  
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  // Touch support for mobile dragging
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
  };
  
  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const displayW = baseSize.w * zoom;
      const displayH = baseSize.h * zoom;
      const minX = containerSize.w - displayW;
      const minY = containerSize.h - displayH;
      const boundedX = Math.min(Math.max(newX, minX), 0);
      const boundedY = Math.min(Math.max(newY, minY), 0);
      setPosition({ x: boundedX, y: boundedY });
    }
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging) {
      const t = e.touches[0];
      const newX = t.clientX - dragStart.x;
      const newY = t.clientY - dragStart.y;
      const displayW = baseSize.w * zoom;
      const displayH = baseSize.h * zoom;
      const minX = containerSize.w - displayW;
      const minY = containerSize.h - displayH;
      const boundedX = Math.min(Math.max(newX, minX), 0);
      const boundedY = Math.min(Math.max(newY, minY), 0);
      setPosition({ x: boundedX, y: boundedY });
    }
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0];
    const oldZoom = zoom;

    // Keep the container center stable while zooming
    const centerX = containerSize.w / 2;
    const centerY = containerSize.h / 2;
    const scale = newZoom / oldZoom;
    const newX = centerX - (centerX - position.x) * scale;
    const newY = centerY - (centerY - position.y) * scale;

    const displayW = baseSize.w * newZoom;
    const displayH = baseSize.h * newZoom;
    const minX = containerSize.w - displayW;
    const minY = containerSize.h - displayH;
    const boundedX = Math.min(Math.max(newX, minX), 0);
    const boundedY = Math.min(Math.max(newY, minY), 0);

    setPosition({ x: boundedX, y: boundedY });
    setZoom(newZoom);

  };
  
  const getImageStyle = () => {
    const displayW = baseSize.w * zoom;
    const displayH = baseSize.h * zoom;
    return {
      width: `${displayW}px`,
      height: `${displayH}px`,
      top: `${position.y}px`,
      left: `${position.x}px`,
      cursor: isDragging ? 'grabbing' : 'grab',
      objectFit: 'cover' as const,
      objectPosition: 'center',
      position: 'absolute' as const,
    };
  };
  
  const handleSave = async () => {
    if (!image || !naturalSize) return;

    try {
      setIsLoading(true);

      // Prepare the final square canvas
      const outputSize = 800; // High-res output
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = outputSize;
      finalCanvas.height = outputSize;
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) return;

      // Fill background and clip to circle
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, outputSize, outputSize);
      ctx.save();
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = image;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });

      // Draw the same rectangle visible in the editor, scaled up to output size
      const scaleOut = outputSize / containerSize.w;
      const destX = position.x * scaleOut;
      const destY = position.y * scaleOut;
      const destW = baseSize.w * zoom * scaleOut;
      const destH = baseSize.h * zoom * scaleOut;
      ctx.drawImage(img, 0, 0, naturalSize.w, naturalSize.h, destX, destY, destW, destH);

      ctx.restore();

      // Convert to data URL and upload

      const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
      const updatedUser = await onImageUploaded(dataUrl);

      // Close the dialog; rely on state/cache update to reflect UI without full reload
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving image:', error);
      alert('Failed to save profile image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Photo</DialogTitle>
          <DialogDescription>
            Upload a new profile photo. You can zoom and position the image before saving.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!image ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png"
                className="hidden"
              />
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Select an image from your device
                </p>
                <Button onClick={triggerFileInput}>
                  Choose Image
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div 
                className="w-64 h-64 overflow-hidden rounded-full relative border mx-auto"
                ref={imageContainerRef}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img 
                  ref={imgRef}
                  src={image} 
                  alt="Profile Preview" 
                  style={getImageStyle()}
                  draggable={false}
                  className="absolute"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Zoom</span>
                  <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
                </div>
                <Slider
                  defaultValue={[1]}
                  min={1}
                  max={3}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={handleZoomChange}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Drag to reposition • Use slider to zoom
                </p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setImage(null);
              setZoom(1);
            }}
            disabled={!image || isLoading}
          >
            Reset
          </Button>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!image || isLoading}
            >
              {isLoading ? 'Uploading...' : 'Save Photo'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}