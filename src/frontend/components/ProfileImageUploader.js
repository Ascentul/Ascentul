import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
export default function ProfileImageUploader({ onImageUploaded, currentImage, children }) {
    const [image, setImage] = useState(null);
    const [zoom, setZoom] = useState(1); // Start at cover size
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const imageContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const imgRef = useRef(null);

    // Natural and base sizes to compute correct drag/zoom math
    const [naturalSize, setNaturalSize] = useState(null); // { w, h }
    const [baseSize, setBaseSize] = useState({ w: 0, h: 0 }); // cover size at zoom=1
    const [containerSize, setContainerSize] = useState({ w: 256, h: 256 });

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setImage(null);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setNaturalSize(null);
            setBaseSize({ w: 0, h: 0 });
            // Measure container when dialog opens
            setTimeout(() => {
                if (imageContainerRef.current) {
                    const rect = imageContainerRef.current.getBoundingClientRect();
                    setContainerSize({ w: rect.width, h: rect.height });
                }
            }, 0);
        }
    }, [isOpen]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result;
            setImage(dataUrl);
            setZoom(1);
            // Measure natural image and compute base cover size
            const img = new Image();
            img.onload = () => {
                const nat = { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height };
                setNaturalSize(nat);
                setTimeout(() => {
                    if (!imageContainerRef.current) return;
                    const rect = imageContainerRef.current.getBoundingClientRect();
                    const cW = rect.width, cH = rect.height;
                    setContainerSize({ w: cW, h: cH });
                    const scale = Math.max(cW / nat.w, cH / nat.h);
                    const bW = nat.w * scale, bH = nat.h * scale;
                    setBaseSize({ w: bW, h: bH });
                    setPosition({ x: (cW - bW) / 2, y: (cH - bH) / 2 });
                }, 0);
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    const handleDragStart = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleDragMove = (e) => {
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

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleZoomChange = (value) => {
        const newZoom = value[0];
        const oldZoom = zoom;
        // Keep container center stable while zooming
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
            objectFit: 'cover',
            objectPosition: 'center',
            position: 'absolute',
        };
    };

    const handleSave = async () => {
        if (!image || !naturalSize)
            return;
        try {
            setIsLoading(true);
            console.log('Starting profile image save process...');
            // Final high-resolution canvas
            const outputSize = 800;
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = outputSize;
            finalCanvas.height = outputSize;
            const ctx = finalCanvas.getContext('2d');
            if (!ctx) return;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, outputSize, outputSize);
            ctx.save();
            ctx.beginPath();
            ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
            ctx.clip();
            // Load image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = image;
            await new Promise((resolve) => { img.onload = () => resolve(); });
            // Draw same rectangle as preview scaled up
            const scaleOut = outputSize / containerSize.w;
            const destX = position.x * scaleOut;
            const destY = position.y * scaleOut;
            const destW = baseSize.w * zoom * scaleOut;
            const destH = baseSize.h * zoom * scaleOut;
            ctx.drawImage(img, 0, 0, naturalSize.w, naturalSize.h, destX, destY, destW, destH);
            ctx.restore();
            console.log('Image cropped exactly as visible in preview, converting to data URL...');
            // Convert to data URL with high quality
            const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
            // Use the callback to upload the image and update the user profile
            // This will be handled by the useUserData context's uploadProfileImage function
            const updatedUser = await onImageUploaded(dataUrl);
            console.log('Image uploaded and profile updated successfully:', updatedUser);
            // Close the dialog; rely on state/cache update to reflect UI without hard reload
            setIsOpen(false);
        }
        catch (error) {
            console.error('Error saving image:', error);
            alert('Failed to save profile image. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (_jsxs(Dialog, { open: isOpen, onOpenChange: setIsOpen, children: [_jsx(DialogTrigger, { asChild: true, children: children }), _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Update Profile Photo" }), _jsx(DialogDescription, { children: "Upload a new profile photo. You can zoom and position the image before saving." })] }), _jsx("div", { className: "space-y-4 py-4", children: !image ? (_jsxs("div", { className: "flex flex-col items-center justify-center gap-4", children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, accept: "image/jpeg,image/png", className: "hidden" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-gray-500 mb-4", children: "Select an image from your device" }), _jsx(Button, { onClick: triggerFileInput, children: "Choose Image" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-64 h-64 overflow-hidden rounded-full relative border mx-auto", ref: imageContainerRef, onMouseDown: handleDragStart, onMouseMove: handleDragMove, onMouseUp: handleDragEnd, onMouseLeave: handleDragEnd, children: _jsx("img", { ref: imgRef, src: image, alt: "Profile Preview", style: getImageStyle(), draggable: false, className: "absolute" }) }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Zoom" }), _jsxs("span", { className: "text-sm text-gray-500", children: [Math.round(zoom * 100), "%"] })] }), _jsx(Slider, { defaultValue: [1], min: 1, max: 3, step: 0.1, value: [zoom], onValueChange: handleZoomChange }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Drag to reposition \u2022 Use slider to zoom" })] })] })) }), _jsxs(DialogFooter, { className: "flex justify-between sm:justify-between", children: [_jsx(Button, { variant: "outline", onClick: () => {
        setImage(null);
        setZoom(1);
    }, disabled: !image || isLoading, children: "Reset" }), _jsxs("div", { className: "space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => setIsOpen(false), disabled: isLoading, children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: !image || isLoading, children: isLoading ? 'Uploading...' : 'Save Photo' })] })] })] })] }));
}
