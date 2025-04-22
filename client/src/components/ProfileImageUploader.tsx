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
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
  children: React.ReactNode;
}

export default function ProfileImageUploader({ 
  onImageUploaded, 
  currentImage, 
  children 
}: ProfileImageUploaderProps) {
  const [image, setImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setImage(null);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        
        // Reset zoom and position
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        
        // Center the image after it loads
        setTimeout(() => {
          if (imageContainerRef.current) {
            const container = imageContainerRef.current;
            const rect = container.getBoundingClientRect();
            setPosition({ 
              x: (rect.width - rect.width * zoom) / 2, 
              y: (rect.height - rect.height * zoom) / 2 
            });
          }
        }, 100);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Apply boundaries to prevent dragging the image completely out of view
      const container = imageContainerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // Limit the position so the image can't be dragged completely out of view
        const imageWidth = containerWidth * zoom;
        const imageHeight = containerHeight * zoom;
        
        // Calculate boundaries to keep image within view
        const minX = containerWidth - imageWidth;
        const minY = containerHeight - imageHeight;
        
        // Apply boundaries
        const boundedX = Math.min(Math.max(newX, minX), 0);
        const boundedY = Math.min(Math.max(newY, minY), 0);
        
        setPosition({
          x: boundedX,
          y: boundedY,
        });
      }
    }
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0];
    const oldZoom = zoom;
    
    // Adjust position after zoom to keep the image centered
    if (imageContainerRef.current) {
      const container = imageContainerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Get the center point of the container
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate the scaling factor between old and new zoom
      const scale = newZoom / oldZoom;
      
      // Calculate new position to keep center point the same
      const newX = centerX - (centerX - position.x) * scale;
      const newY = centerY - (centerY - position.y) * scale;
      
      // Apply bounds to prevent excessive panning
      const imageSize = rect.width * newZoom;
      const minX = rect.width - imageSize;
      const minY = rect.height - imageSize;
      
      const boundedX = Math.min(Math.max(newX, minX), 0);
      const boundedY = Math.min(Math.max(newY, minY), 0);
      
      setPosition({ x: boundedX, y: boundedY });
    }
    
    setZoom(newZoom);
  };
  
  const getImageStyle = () => {
    return {
      width: `${zoom * 100}%`,
      height: `${zoom * 100}%`,
      transform: `translate(${position.x}px, ${position.y}px)`,
      cursor: isDragging ? 'grabbing' : 'grab',
      objectFit: 'cover' as const,
      objectPosition: 'center',
    };
  };
  
  const handleSave = async () => {
    if (!image) return;
    
    try {
      setIsLoading(true);
      console.log('Starting profile image save process...');
      
      // Instead of recalculating the crop, we'll capture exactly what's showing in the container
      const container = imageContainerRef.current;
      if (!container) return;
      
      // Create a canvas that exactly matches the preview
      const canvas = document.createElement('canvas');
      
      // Set high resolution for better quality (600x600)
      const outputSize = 600;
      canvas.width = outputSize;
      canvas.height = outputSize;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Create a new image element with the current source
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = image;
      
      // Wait for the image to load
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      // Get the container dimensions and image styling
      const containerRect = container.getBoundingClientRect();
      const containerSize = containerRect.width; // This is our cropping window
      
      // Calculate how the image is displayed in the container
      const scale = zoom;
      const imgWidth = img.width * scale;
      const imgHeight = img.height * scale;
      
      // Account for centering if image is smaller than container
      const offsetX = position.x;
      const offsetY = position.y;
      
      // The exact rendering logic that the browser uses in the preview
      ctx.fillStyle = '#FFFFFF'; // White background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Scale and position context exactly as the image appears in the preview
      const previewToOutputRatio = outputSize / containerSize;
      
      // Save state before transformations
      ctx.save();
      
      // Apply same transformations that are applied to the preview image
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(previewToOutputRatio, previewToOutputRatio);
      ctx.translate(-containerSize / 2, -containerSize / 2);
      ctx.translate(offsetX, offsetY);
      
      // Draw the image with the exact same position and scale as shown in the preview
      ctx.drawImage(
        img,
        0, 0, img.width, img.height, 
        0, 0, imgWidth, imgHeight
      );
      
      // Restore context
      ctx.restore();
      
      console.log('Image cropped exactly as preview, converting to data URL...');
      
      // Convert canvas to data URL with high quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // Use the callback to upload the image and update the user profile
      // This will be handled by the useUserData context's uploadProfileImage function
      const updatedUser = await onImageUploaded(dataUrl);
      console.log('Image uploaded and profile updated successfully:', updatedUser);
      
      // Close the dialog
      setIsOpen(false);
      
      // Add a delay before reloading to ensure the server has processed the image
      setTimeout(() => {
        console.log("Reloading page to refresh all components with new image");
        window.location.reload();
      }, 800);
      
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
              >
                <img 
                  src={image} 
                  alt="Profile Preview" 
                  style={getImageStyle()}
                  draggable={false}
                  className="absolute top-0 left-0"
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