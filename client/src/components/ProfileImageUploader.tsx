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
      
      // Instead of recalculating the crop, we'll take a "screenshot" of what's visible in the container
      const container = imageContainerRef.current;
      if (!container) return;
      
      // Create a temporary canvas to render the visible content exactly as seen in the preview
      const tempCanvas = document.createElement('canvas');
      const containerRect = container.getBoundingClientRect();
      
      // First render at actual display size
      tempCanvas.width = containerRect.width;
      tempCanvas.height = containerRect.height;
      
      // Get a context for the temp canvas
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      // Create a final high-resolution canvas for output
      const finalCanvas = document.createElement('canvas');
      const outputSize = 800; // Higher resolution for better quality
      finalCanvas.width = outputSize;
      finalCanvas.height = outputSize;
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return;
      
      // Fill background with white
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Wait for the image to be ready
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = image;
      
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      // Draw with the exact styling from the preview
      tempCtx.save();
      tempCtx.beginPath();
      tempCtx.arc(
        tempCanvas.width / 2,
        tempCanvas.height / 2,
        tempCanvas.width / 2,
        0,
        Math.PI * 2
      );
      tempCtx.clip();
      
      // Apply the same transformations as in the preview
      tempCtx.translate(position.x, position.y);
      tempCtx.drawImage(
        img,
        0, 0, img.width, img.height,
        0, 0, img.width * zoom, img.height * zoom
      );
      
      tempCtx.restore();
      
      // Now draw the temp canvas onto the final high-res canvas
      finalCtx.fillStyle = '#FFFFFF';
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // Draw the circular clipped image
      finalCtx.save();
      finalCtx.beginPath();
      finalCtx.arc(
        finalCanvas.width / 2,
        finalCanvas.height / 2,
        finalCanvas.width / 2,
        0,
        Math.PI * 2
      );
      finalCtx.clip();
      
      // Scale up the temp canvas
      finalCtx.drawImage(
        tempCanvas,
        0, 0, tempCanvas.width, tempCanvas.height,
        0, 0, finalCanvas.width, finalCanvas.height
      );
      
      finalCtx.restore();
      
      console.log('Image cropped exactly as visible in preview, converting to data URL...');
      
      // Convert to data URL with high quality
      const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
      
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