import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { 
  Save, FileDown, Undo, Redo, Type, Square, Image as ImageIcon,
  Plus, Trash, Copy, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, PanelLeftClose, PanelLeftOpen,
  Palette, Move, ChevronsUpDown, RotateCcw, ChevronRight,
  Layers, TextCursor, FileText, Download, Lock, Unlock
} from "lucide-react";

// Import the necessary types
declare global {
  interface Window {
    fabric: any;
    saveDesignFunction?: () => void;
    exportToPDFFunction?: () => void;
  }
}

const COLOR_PRESETS = [
  "#000000", "#FFFFFF", "#0C29AB", "#4361EE", "#3A0CA3", 
  "#7209B7", "#F72585", "#4CC9F0", "#F77F00", "#D62828",
  "#006400", "#283618", "#606C38", "#023E8A", "#03045E"
];

const FONT_PRESETS = [
  "Arial", "Times New Roman", "Calibri", "Helvetica", "Georgia",
  "Verdana", "Tahoma", "Trebuchet MS", "Garamond", "Courier New"
];

// Color picker component
function PopoverPicker({ color, onChange }: { color: string, onChange: (color: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-10 h-8 p-1">
          <div 
            className="w-full h-full rounded" 
            style={{ backgroundColor: color || "#000000" }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-2">
          {COLOR_PRESETS.map((presetColor) => (
            <Button
              key={presetColor}
              variant="outline"
              className="w-8 h-8 p-0"
              style={{ backgroundColor: presetColor }}
              onClick={() => onChange(presetColor)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function DesignStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);
  const [activeObject, setActiveObject] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState("elements");
  const [currDesignId, setCurrDesignId] = useState<string | null>(null);
  const [designMetadata, setDesignMetadata] = useState({
    name: "Untitled Design",
    createdAt: new Date().toISOString(),
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [copiedStyle, setCopiedStyle] = useState<any>(null);
  
  // Load fabric.js
  useEffect(() => {
    // Check if fabric is already loaded
    if (window.fabric) {
      initCanvas();
    } else {
      // Load fabric.js from CDN
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
      script.async = true;
      script.onload = () => {
        console.log("Fabric.js loaded");
        initCanvas();
      };
      document.body.appendChild(script);
    }

    // Clean up function to handle component unmounting
    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, []);
  
  // Expose save and export functions to global context
  useEffect(() => {
    if (fabricCanvas) {
      window.saveDesignFunction = saveDesign;
      window.exportToPDFFunction = exportToPDF;
    }
    
    return () => {
      window.saveDesignFunction = undefined;
      window.exportToPDFFunction = undefined;
    };
  }, [fabricCanvas, currDesignId, designMetadata]);

  // Listen for sidebar toggle event from parent component
  useEffect(() => {
    // Listen for the custom sidebar toggle event from Resume.tsx
    const handleToggleSidebar = () => {
      setShowSidebar(prevState => !prevState);
    };
    
    document.addEventListener('toggleDesignSidebar', handleToggleSidebar);
    
    return () => {
      document.removeEventListener('toggleDesignSidebar', handleToggleSidebar);
    };
  }, []);
  
  // Add keyboard shortcuts
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only apply shortcuts when an object is selected
      if (!activeObject) return;
      
      // Copy: Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyObject();
      }
      
      // Copy Style: Ctrl/Cmd + Shift + C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyStyle();
      }
      
      // Paste Style: Ctrl/Cmd + V (only if style is copied)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedStyle) {
        e.preventDefault();
        pasteStyle();
      }
      
      // Duplicate: Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateObject();
      }
      
      // Delete: Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteObject();
      }
      
      // Lock/Unlock: Ctrl/Cmd + Shift + L
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggleLock();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fabricCanvas, activeObject, copiedStyle]);
  
  // Initialize the canvas
  const initCanvas = () => {
    if (canvasRef.current && window.fabric) {
      // Create a fabric canvas with A4 paper dimensions (210 x 297 mm at 72 DPI)
      const canvas = new window.fabric.Canvas(canvasRef.current, {
        width: 595, // A4 width in pixels at 72 DPI
        height: 842, // A4 height in pixels at 72 DPI
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
      });

      // Create a custom rotation handle renderer
      const renderRotationHandle = function(
        this: any, 
        ctx: CanvasRenderingContext2D, 
        left: number, 
        top: number, 
        styleOverride: any, 
        fabricObject: any
      ) {
        // Draw a distinctive rotation control (without connecting line)
        const size = this.cornerSize;
        ctx.save();
        
        // Draw circular background
        ctx.beginPath();
        ctx.arc(left, top, size, 0, 2 * Math.PI);
        ctx.fillStyle = '#0C29AB';
        ctx.fill();
        
        // Draw rotation arrows icon
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // First arrow (semi-circle with arrowhead)
        const radius = size * 0.6;
        ctx.arc(left, top, radius, 0.3 * Math.PI, 1.7 * Math.PI);
        
        // Arrowhead
        const angle = 0.3 * Math.PI;
        const arrowSize = size * 0.4;
        ctx.moveTo(
          left + radius * Math.cos(angle), 
          top + radius * Math.sin(angle)
        );
        ctx.lineTo(
          left + radius * Math.cos(angle) + arrowSize * Math.cos(angle - Math.PI/4), 
          top + radius * Math.sin(angle) + arrowSize * Math.sin(angle - Math.PI/4)
        );
        ctx.moveTo(
          left + radius * Math.cos(angle), 
          top + radius * Math.sin(angle)
        );
        ctx.lineTo(
          left + radius * Math.cos(angle) + arrowSize * Math.cos(angle + Math.PI/4), 
          top + radius * Math.sin(angle) + arrowSize * Math.sin(angle + Math.PI/4)
        );
        
        ctx.stroke();
        ctx.restore();
      };
      
      // Set different offset for different types of elements
      const originalSetControlsVisibility = window.fabric.Object.prototype.setControlsVisibility;
      window.fabric.Object.prototype.setControlsVisibility = function(options) {
        // Call the original method first
        const result = originalSetControlsVisibility.call(this, options);
        
        // Check object type and set appropriate offset for rotation handle
        if (this.type === 'rect' || this.type === 'circle' || this.type === 'polygon' || this.type === 'path') {
          // For shapes, position the rotation handle 60px below
          this.controls.mtr.offsetY = 60;
        } else {
          // For text and other elements, use 48px
          this.controls.mtr.offsetY = 48;
        }
        
        return result;
      };
      
      // Default rotation handle settings
      window.fabric.Object.prototype.controls.mtr.offsetX = 0;
      window.fabric.Object.prototype.controls.mtr.withConnection = false; // No connecting line
      window.fabric.Object.prototype.controls.mtr.render = renderRotationHandle; // Use custom renderer
      window.fabric.Object.prototype.controls.mtr.cornerSize = 12; // Larger than regular control points
      
      // Customize the selection style to use the brand's primary blue color
      canvas.selectionColor = 'rgba(12, 41, 171, 0.1)'; // Very light blue for the background
      canvas.selectionBorderColor = '#0C29AB'; // Dark primary blue for the outline
      canvas.selectionLineWidth = 2; // Make the selection border more visible
      
      // Customize the control points (handles) to be white with thin grey outlines
      const cornerFillColor = '#FFFFFF'; // White fill
      const cornerStrokeColor = '#CCCCCC'; // Light grey outline
      
      // Set corner style to be circles
      window.fabric.Object.prototype.cornerColor = cornerFillColor;
      window.fabric.Object.prototype.cornerStrokeColor = cornerStrokeColor;
      window.fabric.Object.prototype.cornerSize = 8; // Slightly smaller corner points
      window.fabric.Object.prototype.transparentCorners = false; // Solid corners look better
      window.fabric.Object.prototype.cornerStyle = 'circle'; // Make corner controls circular
      window.fabric.Object.prototype.cornerStrokeWidth = 1; // Thin outline
      
      // Create custom control renderers for sides
      const renderSideControl = function(
        this: any, 
        ctx: CanvasRenderingContext2D, 
        left: number, 
        top: number, 
        styleOverride: any, 
        fabricObject: any
      ) {
        const size = this.cornerSize;
        ctx.save();
        ctx.fillStyle = this.cornerColor;
        ctx.strokeStyle = this.cornerStrokeColor;
        
        // Draw slim rounded rectangle
        const width = size * 2.5;
        const height = size * 0.9;
        const radius = height / 2; // Fully rounded ends
        
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(left - width/2 + radius, top - height/2);
        ctx.lineTo(left + width/2 - radius, top - height/2);
        ctx.arcTo(left + width/2, top - height/2, left + width/2, top - height/2 + radius, radius);
        ctx.lineTo(left + width/2, top + height/2 - radius);
        ctx.arcTo(left + width/2, top + height/2, left + width/2 - radius, top + height/2, radius);
        ctx.lineTo(left - width/2 + radius, top + height/2);
        ctx.arcTo(left - width/2, top + height/2, left - width/2, top + height/2 - radius, radius);
        ctx.lineTo(left - width/2, top - height/2 + radius);
        ctx.arcTo(left - width/2, top - height/2, left - width/2 + radius, top - height/2, radius);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      
      // Apply the custom renderer to side controls (middle left, middle right, etc.)
      window.fabric.Object.prototype.controls.ml.render = renderSideControl;
      window.fabric.Object.prototype.controls.mr.render = renderSideControl;
      window.fabric.Object.prototype.controls.mt.render = renderSideControl;
      window.fabric.Object.prototype.controls.mb.render = renderSideControl;
      
      // Set up event listeners
      canvas.on("selection:created", handleSelectionChange);
      canvas.on("selection:updated", handleSelectionChange);
      canvas.on("selection:cleared", () => setActiveObject(null));

      setFabricCanvas(canvas);
      
      // Load saved designs from localStorage
      loadSavedDesigns();
    }
  };
  
  // Handle selection changes
  const handleSelectionChange = (e: any) => {
    setActiveObject(e.selected[0]);
  };
  
  // Add a text object to the canvas
  const addText = () => {
    if (!fabricCanvas) return;
    
    const text = new window.fabric.Textbox("Click to edit text", {
      left: 100,
      top: 100,
      fontFamily: "Arial",
      fontSize: 16,
      fill: "#000000",
      width: 200,
    });
    
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    setActiveObject(text);
    fabricCanvas.renderAll();
  };
  
  // Add a rectangle to the canvas
  const addRectangle = () => {
    if (!fabricCanvas) return;
    
    const rect = new window.fabric.Rect({
      left: 100,
      top: 100,
      fill: "#4361EE",
      width: 100,
      height: 100,
      opacity: 0.7,
    });
    
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    setActiveObject(rect);
    fabricCanvas.renderAll();
  };
  
  // Delete the selected object
  const deleteObject = () => {
    if (!fabricCanvas || !activeObject) return;
    
    fabricCanvas.remove(activeObject);
    setActiveObject(null);
    fabricCanvas.renderAll();
  };
  
  // Copy the selected object
  const copyObject = () => {
    if (!fabricCanvas || !activeObject) return;
    
    // Clone the object
    activeObject.clone((cloned: any) => {
      fabricCanvas.discardActiveObject();
      // Customize cloned object position slightly offset from original
      cloned.set({
        left: cloned.left + 10,
        top: cloned.top + 10,
        evented: true,
      });
      
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      setActiveObject(cloned);
    });
  };
  
  // Duplicate the selected object (similar to copy but keeps in place)
  const duplicateObject = () => {
    if (!fabricCanvas || !activeObject) return;
    
    // Clone the object
    activeObject.clone((cloned: any) => {
      fabricCanvas.discardActiveObject();
      // Position exactly like the original
      cloned.set({
        left: activeObject.left + 15,
        top: activeObject.top + 15,
        evented: true,
      });
      
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      setActiveObject(cloned);
    });
  };
  
  const copyStyle = () => {
    if (!fabricCanvas || !activeObject) return;
    
    // Extract style properties based on object type
    const style: any = {};
    
    if (activeObject.type === 'textbox' || activeObject.type === 'i-text') {
      // Text properties
      ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'underline', 
       'textAlign', 'fill', 'backgroundColor', 'stroke', 'strokeWidth'].forEach(prop => {
        if (activeObject[prop] !== undefined) {
          style[prop] = activeObject[prop];
        }
      });
    } else {
      // Shape properties
      ['fill', 'stroke', 'strokeWidth', 'opacity', 'shadow'].forEach(prop => {
        if (activeObject[prop] !== undefined) {
          style[prop] = activeObject[prop];
        }
      });
    }
    
    setCopiedStyle(style);
  };
  
  // Paste style to selected object
  const pasteStyle = () => {
    if (!fabricCanvas || !activeObject || !copiedStyle) return;
    
    // Apply the copied style to the active object
    Object.keys(copiedStyle).forEach(prop => {
      activeObject.set(prop, copiedStyle[prop]);
    });
    
    fabricCanvas.renderAll();
  };
  
  // Lock/Unlock object
  const toggleLock = () => {
    if (!fabricCanvas || !activeObject) return;
    
    // Toggle the locked status
    const isCurrentlyLocked = activeObject.locked || false;
    const newLockedState = !isCurrentlyLocked;
    
    // Store the locked state on the object for reference
    activeObject.set({
      locked: newLockedState,
      lockMovementX: newLockedState,
      lockMovementY: newLockedState,
      lockRotation: newLockedState,
      lockScalingX: newLockedState,
      lockScalingY: newLockedState,
      // Keep it selectable and evented so we can still click on it
      selectable: true,
      evented: true
    });
    
    fabricCanvas.renderAll();
  };
  
  // Add lock icon to selected locked objects
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Add a handler for object selection to show lock icon if needed
    const handleObjectSelected = (e: any) => {
      const obj = e.selected?.[0];
      if (obj && obj.locked) {
        showLockIcon(obj);
      }
    };
    
    // Function to add a lock icon above a locked object
    const showLockIcon = (obj: any) => {
      // Remove any existing lock icons first
      const existingIcons = fabricCanvas.getObjects().filter((o: any) => o.isLockIcon);
      existingIcons.forEach((icon: any) => fabricCanvas.remove(icon));
      
      // Calculate position for the lock icon (centered above the object)
      const objBounds = obj.getBoundingRect();
      const iconLeft = objBounds.left + objBounds.width / 2;
      const iconTop = objBounds.top - 25; // Position above the object
      
      // Create a more modern button-like lock indicator, but smaller
      const lockButton = new window.fabric.Rect({
        left: iconLeft,
        top: iconTop,
        width: 17, // Half the size (34/2)
        height: 17, // Half the size (34/2)
        rx: 4, // Rounded corners, scaled down
        ry: 4,
        fill: 'rgba(12, 41, 171, 0.1)', // Light blue background with transparency
        stroke: 'rgba(12, 41, 171, 0.3)', // Subtle blue border
        strokeWidth: 1,
        hasControls: false,
        hasBorders: false,
        selectable: true,
        evented: true,
        isLockIcon: true, // Custom property to identify this as a lock icon
        originX: 'center',
        originY: 'center',
        targetObject: obj, // Reference to the locked object
        shadow: new window.fabric.Shadow({
          color: 'rgba(0,0,0,0.1)',
          blur: 2, // Scaled down shadow
          offsetX: 0,
          offsetY: 1
        })
      });
      
      // Create a modern lock icon SVG path
      const lockSvgPath = "M16,0C14.5,0,13.2,0.6,12.3,1.5C11.4,2.5,10.8,3.8,10.8,5.3V8H7.5c-1.4,0-2.5,1.1-2.5,2.5v9c0,1.4,1.1,2.5,2.5,2.5h17c1.4,0,2.5-1.1,2.5-2.5v-9c0-1.4-1.1-2.5-2.5-2.5h-3.3V5.3c0-1.4-0.6-2.8-1.5-3.8C18.8,0.6,17.5,0,16,0L16,0z M16,2.7c0.8,0,1.5,0.3,2,0.8c0.5,0.5,0.8,1.2,0.8,2v2.7h-5.6V5.3c0-0.7,0.3-1.4,0.8-2C14.5,3,15.2,2.7,16,2.7z M16,14c1.1,0,2,0.9,2,2c0,1.1-0.9,2-2,2c-1.1,0-2-0.9-2-2C14,14.9,14.9,14,16,14z";
      const lockIcon = new window.fabric.Path(lockSvgPath, {
        left: iconLeft,
        top: iconTop,
        fill: '#0C29AB',
        scaleX: 0.35, // Half the size (0.7/2)
        scaleY: 0.35, // Half the size (0.7/2)
        hasControls: false,
        hasBorders: false,
        selectable: true, // Make selectable so it can be clicked
        evented: true,  // Enable events
        isLockIcon: true,
        originX: 'center',
        originY: 'center',
        targetObject: obj // Reference to the locked object
      });
      
      // Add the lock icon and button to the canvas
      fabricCanvas.add(lockButton);
      fabricCanvas.add(lockIcon);
      
      // Function to unlock the object
      const unlockObject = () => {
        // Remove the lock
        obj.set({
          locked: false,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false
        });
        
        // Remove the lock icons
        fabricCanvas.remove(lockButton);
        fabricCanvas.remove(lockIcon);
        
        // Re-select the object
        fabricCanvas.setActiveObject(obj);
        fabricCanvas.renderAll();
      };
      
      // Make both the button and the icon clickable to unlock the object
      lockButton.on('mousedown', unlockObject);
      lockIcon.on('mousedown', unlockObject);
    };
    
    // Add event listeners
    fabricCanvas.on('selection:created', handleObjectSelected);
    fabricCanvas.on('selection:updated', handleObjectSelected);
    
    // When selection is cleared, remove all lock icons
    fabricCanvas.on('selection:cleared', () => {
      const lockIcons = fabricCanvas.getObjects().filter((o: any) => o.isLockIcon);
      lockIcons.forEach((icon: any) => fabricCanvas.remove(icon));
      fabricCanvas.renderAll();
    });
    
    return () => {
      // Clean up events
      fabricCanvas.off('selection:created', handleObjectSelected);
      fabricCanvas.off('selection:updated', handleObjectSelected);
    };
  }, [fabricCanvas]);
  
  // Align object to page
  const alignToPage = (position: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!fabricCanvas || !activeObject) return;
    
    const canvas = fabricCanvas;
    const object = activeObject;
    
    switch (position) {
      case 'left':
        object.set({ left: 0 });
        break;
      case 'center':
        object.set({ left: (canvas.width - object.getScaledWidth()) / 2 });
        break;
      case 'right':
        object.set({ left: canvas.width - object.getScaledWidth() });
        break;
      case 'top':
        object.set({ top: 0 });
        break;
      case 'middle':
        object.set({ top: (canvas.height - object.getScaledHeight()) / 2 });
        break;
      case 'bottom':
        object.set({ top: canvas.height - object.getScaledHeight() });
        break;
    }
    
    canvas.renderAll();
  };
  
  // Save the current design
  const saveDesign = () => {
    if (!fabricCanvas) return;
    
    // Generate a unique ID if this is a new design
    const designId = currDesignId || `design_${Date.now()}`;
    
    // Generate a preview image
    const previewDataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 0.8,
    });
    
    // Save the canvas data
    const designData = {
      id: designId,
      name: designMetadata.name,
      createdAt: currDesignId ? designMetadata.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canvasJson: JSON.stringify(fabricCanvas.toJSON()),
      previewImage: previewDataUrl,
    };
    
    // Save to localStorage
    try {
      const existingDesignsStr = localStorage.getItem("resumeDesigns");
      let existingDesigns = existingDesignsStr ? JSON.parse(existingDesignsStr) : [];
      
      // Check if this design already exists
      const existingIndex = existingDesigns.findIndex((d: any) => d.id === designId);
      
      if (existingIndex >= 0) {
        // Update existing design
        existingDesigns[existingIndex] = designData;
      } else {
        // Add new design
        existingDesigns.push(designData);
      }
      
      localStorage.setItem("resumeDesigns", JSON.stringify(existingDesigns));
      
      // Update state
      setCurrDesignId(designId);
      setSavedDesigns(existingDesigns);
      
      console.log("Design saved successfully!");
      
      // Show toast notification (you'll need to implement this)
      // toast({ title: "Design saved" });
      
    } catch (error) {
      console.error("Error saving design:", error);
      // Show error toast
      // toast({ title: "Error saving design", variant: "destructive" });
    }
  };
  
  // Load saved designs from localStorage
  const loadSavedDesigns = () => {
    try {
      const designsStr = localStorage.getItem("resumeDesigns");
      if (designsStr) {
        const designs = JSON.parse(designsStr);
        setSavedDesigns(designs);
      }
    } catch (error) {
      console.error("Error loading saved designs:", error);
    }
  };
  
  // Load a saved design
  const loadDesign = (designId: string) => {
    try {
      const design = savedDesigns.find(d => d.id === designId);
      
      if (design && fabricCanvas) {
        fabricCanvas.loadFromJSON(JSON.parse(design.canvasJson), () => {
          fabricCanvas.renderAll();
          setCurrDesignId(designId);
          setDesignMetadata({
            name: design.name,
            createdAt: design.createdAt,
          });
        });
      }
    } catch (error) {
      console.error("Error loading design:", error);
    }
  };
  
  // Export the design to PDF
  const exportToPDF = () => {
    if (!fabricCanvas) return;
    
    // Create a data URL of the canvas
    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 1.0,
    });
    
    // Create a link to download the image (as PNG for simplicity)
    // In a real app, you'd want to convert this to PDF on the server
    const link = document.createElement("a");
    link.download = `${designMetadata.name.replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="w-full h-[calc(100vh-12rem)] flex flex-col relative">
      {/* Floating Properties Toolbar - Shows when an element is selected */}
      {activeObject && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-3 p-3 bg-white shadow-md rounded-md border overflow-x-auto">
          {/* Element Actions */}
          <div className="flex items-center gap-1 border-r pr-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={deleteObject}
                  >
                    <Trash size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Text Formatting - Only for text elements */}
          {activeObject.type === 'textbox' && (
            <>
              <div className="flex items-center gap-1">
                <Select 
                  defaultValue={activeObject.fontFamily || "Arial"} 
                  onValueChange={(value) => {
                    activeObject.set('fontFamily', value);
                    fabricCanvas.renderAll();
                  }}
                >
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue placeholder="Font Family" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_PRESETS.map((font) => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input 
                  type="number" 
                  className="w-16 h-8" 
                  defaultValue={activeObject.fontSize || "16"}
                  onChange={(e) => {
                    activeObject.set('fontSize', parseInt(e.target.value));
                    fabricCanvas.renderAll();
                  }}
                />
              </div>
              
              <div className="flex items-center gap-1 border-l pl-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={activeObject.fontWeight === 'bold' ? 'secondary' : 'ghost'} 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          activeObject.set('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold');
                          fabricCanvas.renderAll();
                        }}
                      >
                        <Bold size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={activeObject.fontStyle === 'italic' ? 'secondary' : 'ghost'} 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          activeObject.set('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic');
                          fabricCanvas.renderAll();
                        }}
                      >
                        <Italic size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Italic</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={activeObject.underline ? 'secondary' : 'ghost'} 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          activeObject.set('underline', !activeObject.underline);
                          fabricCanvas.renderAll();
                        }}
                      >
                        <Underline size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Underline</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center gap-1 border-l pl-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={activeObject.textAlign === 'left' ? 'secondary' : 'ghost'} 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          activeObject.set('textAlign', 'left');
                          fabricCanvas.renderAll();
                        }}
                      >
                        <AlignLeft size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Left</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={activeObject.textAlign === 'center' ? 'secondary' : 'ghost'} 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          activeObject.set('textAlign', 'center');
                          fabricCanvas.renderAll();
                        }}
                      >
                        <AlignCenter size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Center</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={activeObject.textAlign === 'right' ? 'secondary' : 'ghost'} 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          activeObject.set('textAlign', 'right');
                          fabricCanvas.renderAll();
                        }}
                      >
                        <AlignRight size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Right</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </>
          )}
          
          {/* Color Selector - Works for both text and shapes */}
          <div className="flex items-center gap-1 border-l pl-3">
            <PopoverPicker 
              color={activeObject.fill} 
              onChange={(color) => {
                activeObject.set('fill', color);
                fabricCanvas.renderAll();
              }}
            />
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Side Panel - Now positioned absolutely */}
        {showSidebar && (
          <div className="absolute left-0 top-0 bottom-0 w-64 border-r bg-background overflow-y-auto z-10 shadow-md">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="elements" className="flex-1">Elements</TabsTrigger>
                <TabsTrigger value="properties" className="flex-1">Properties</TabsTrigger>
                <TabsTrigger value="designs" className="flex-1">Designs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="elements" className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Text</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" onClick={addText} className="justify-start">
                      <Type size={16} className="mr-2" />
                      Add Text
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Shapes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={addRectangle} className="justify-start">
                      <Square size={16} className="mr-2" />
                      Rectangle
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Resume Blocks</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="justify-start">
                      <FileText size={16} className="mr-2" />
                      Header Block
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText size={16} className="mr-2" />
                      Experience Block
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText size={16} className="mr-2" />
                      Education Block
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText size={16} className="mr-2" />
                      Skills Block
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="properties" className="p-4 space-y-4">
                {activeObject ? (
                  <div className="space-y-4">
                    {activeObject.type === 'textbox' && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium mb-2">Text</h3>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      activeObject.set('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold');
                                      fabricCanvas.renderAll();
                                    }}
                                  >
                                    <Bold size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Bold</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      activeObject.set('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic');
                                      fabricCanvas.renderAll();
                                    }}
                                  >
                                    <Italic size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Italic</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      activeObject.set('underline', !activeObject.underline);
                                      fabricCanvas.renderAll();
                                    }}
                                  >
                                    <Underline size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Underline</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Alignment</h3>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      activeObject.set('textAlign', 'left');
                                      fabricCanvas.renderAll();
                                    }}
                                  >
                                    <AlignLeft size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Align Left</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      activeObject.set('textAlign', 'center');
                                      fabricCanvas.renderAll();
                                    }}
                                  >
                                    <AlignCenter size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Align Center</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      activeObject.set('textAlign', 'right');
                                      fabricCanvas.renderAll();
                                    }}
                                  >
                                    <AlignRight size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Align Right</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Color</h3>
                      <div className="grid grid-cols-5 gap-1">
                        {COLOR_PRESETS.map((color, index) => (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    if (activeObject.type === 'textbox') {
                                      activeObject.set('fill', color);
                                    } else {
                                      activeObject.set('fill', color);
                                    }
                                    fabricCanvas.renderAll();
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>{color}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                    
                    {activeObject.type === 'textbox' && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Font</h3>
                        <div className="grid grid-cols-1 gap-1">
                          {FONT_PRESETS.map((font, index) => (
                            <button
                              key={index}
                              className="px-2 py-1 text-left text-sm hover:bg-accent rounded"
                              style={{ fontFamily: font }}
                              onClick={() => {
                                activeObject.set('fontFamily', font);
                                fabricCanvas.renderAll();
                              }}
                            >
                              {font}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                    <Layers className="mb-2 h-8 w-8" />
                    <p>Select an element to edit its properties</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="designs" className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Saved Designs</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (fabricCanvas) {
                        fabricCanvas.clear();
                        fabricCanvas.backgroundColor = "#ffffff";
                        fabricCanvas.renderAll();
                        setCurrDesignId(null);
                        setDesignMetadata({
                          name: "Untitled Design",
                          createdAt: new Date().toISOString(),
                        });
                      }
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                
                {savedDesigns.length > 0 ? (
                  <div className="space-y-2">
                    {savedDesigns.map((design) => (
                      <Card key={design.id} className={`p-2 cursor-pointer hover:bg-accent ${design.id === currDesignId ? 'border-primary' : ''}`} onClick={() => loadDesign(design.id)}>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 border rounded bg-white overflow-hidden">
                            <img 
                              src={design.previewImage} 
                              alt={design.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{design.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(design.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                    <Save className="mb-2 h-8 w-8" />
                    <p>No saved designs yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Canvas Area - Takes full width now */}
        <div className="w-full overflow-auto bg-gray-100 p-12 pt-24 flex justify-center">
          <ContextMenu>
            <ContextMenuTrigger disabled={!activeObject}>
              <div className="bg-white shadow-lg">
                <canvas ref={canvasRef} />
              </div>
            </ContextMenuTrigger>
            {activeObject && (
              <ContextMenuContent className="w-64">
                <ContextMenuItem onClick={copyObject}>
                  Copy
                  <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={copyStyle}>
                  Copy style
                  <ContextMenuShortcut>⇧⌘C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={pasteStyle} disabled={!copiedStyle}>
                  Paste
                  <ContextMenuShortcut>⌘V</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={duplicateObject}>
                  Duplicate
                  <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={deleteObject} className="text-red-500">
                  Delete
                  <ContextMenuShortcut>DELETE</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>
                  Align to page
                  <ContextMenuShortcut>→</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem className="pl-6" onClick={() => alignToPage('left')}>
                  Left
                </ContextMenuItem>
                <ContextMenuItem className="pl-6" onClick={() => alignToPage('center')}>
                  Center
                </ContextMenuItem>
                <ContextMenuItem className="pl-6" onClick={() => alignToPage('right')}>
                  Right
                </ContextMenuItem>
                <ContextMenuItem className="pl-6" onClick={() => alignToPage('top')}>
                  Top
                </ContextMenuItem>
                <ContextMenuItem className="pl-6" onClick={() => alignToPage('middle')}>
                  Middle
                </ContextMenuItem>
                <ContextMenuItem className="pl-6" onClick={() => alignToPage('bottom')}>
                  Bottom
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={toggleLock}>
                  {activeObject && activeObject.locked ? 'Unlock' : 'Lock'}
                  <ContextMenuShortcut>⇧⌘L</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuContent>
            )}
          </ContextMenu>
        </div>
      </div>
    </div>
  );
}