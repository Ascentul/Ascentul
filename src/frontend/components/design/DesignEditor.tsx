import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getFabric } from "@/lib/fabric-loader";
import { 
  Square, 
  Circle, 
  Triangle, 
  Type, 
  Image as ImageIcon,
  Grid,
  Layers,
  Move,
  Trash,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Loader2
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define canvas dimensions
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

// Grid settings
const GRID_SIZE = 20; // pixels between grid lines
const SNAP_THRESHOLD = 5; // pixels to trigger snapping

// Colors
const BRAND_COLOR = '#0C29AB';
const GUIDE_COLOR = '#9333EA'; // Purple for alignment guides

// Font options
const FONT_PRESETS = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Helvetica",
  "Tahoma",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
  "Poppins",
  "Inter",
];

interface DesignEditorProps {
  initialDesign?: string;
  onSave?: (data: string) => void;
}

export default function DesignEditor({ initialDesign, onSave }: DesignEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);
  const [activeObject, setActiveObject] = useState<any>(null);
  const [gridEnabled, setGridEnabled] = useState<boolean>(true);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState<boolean>(true);
  const [snapToObjectsEnabled, setSnapToObjectsEnabled] = useState<boolean>(true);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [guides, setGuides] = useState<any[]>([]);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  
  const { toast } = useToast();
  
  // Initialize Fabric.js canvas
  useEffect(() => {
    // Flag to track if the effect is still mounted
    let isMounted = true;
    
    const initCanvas = async () => {
      if (!canvasRef.current) {
        console.warn("Canvas reference is not available");
        return;
      }
      
      try {
        console.log("Starting canvas initialization...");
        
        // Load Fabric.js using our loader
        const fabric = await getFabric().catch(err => {
          console.error("Error loading Fabric.js:", err);
          throw new Error("Failed to load Fabric.js library. Please refresh the page.");
        });
        
        if (!isMounted) return;
        
        console.log("Fabric.js loaded successfully, creating canvas...");
        
        // Create canvas instance with error handling
        let canvas;
        try {
          canvas = new fabric.Canvas(canvasRef.current, {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: '#FFFFFF',
            preserveObjectStacking: true,
            selection: true, // Allow multiple selection with mouse
          });
        } catch (canvasError) {
          console.error("Error creating canvas:", canvasError);
          throw new Error("Failed to create canvas element");
        }
        
        if (!canvas) {
          throw new Error("Canvas initialization failed");
        }
        
        console.log("Canvas created, setting up configurations...");
        
        // Set up canvas configurations
        await setupCanvas(canvas);
        
        if (!isMounted) {
          // Safely dispose if component unmounted during async operations
          canvas.dispose();
          return;
        }
        
        console.log("Canvas setup complete");
        
        // Save canvas instance
        setFabricCanvas(canvas);
        setIsCanvasReady(true);
        
        // Load initial design if provided
        if (initialDesign) {
          await loadDesign(canvas, initialDesign);
        }
        
        console.log("Canvas initialization complete");
      } catch (error: any) {
        console.error("Failed to initialize canvas:", error);
        if (isMounted) {
          setIsCanvasReady(false);
          toast({
            title: "Error",
            description: error?.message || "Failed to initialize the design editor. Please refresh the page.",
            variant: "destructive"
          });
        }
      }
    };
    
    // Start initialization
    initCanvas();
    
    // Clean up canvas on unmount
    return () => {
      isMounted = false;
      if (fabricCanvas) {
        try {
          fabricCanvas.dispose();
        } catch (error) {
          console.error("Error disposing canvas:", error);
        }
      }
    };
  }, [initialDesign]);
  
  // Setup canvas with configurations and event handlers
  const setupCanvas = async (canvas: any) => {
    try {
      if (!canvas) {
        console.error("setupCanvas: canvas is null");
        throw new Error("Invalid canvas object");
      }
      
      // Set canvas appearance
      canvas.selection = true;
      canvas.selectionColor = 'rgba(12, 41, 171, 0.1)'; // Light brand blue
      canvas.selectionBorderColor = BRAND_COLOR;
      canvas.selectionLineWidth = 1;
      
      // Get fabric instance
      const fabric = await getFabric().catch(err => {
        console.error("Error loading Fabric in setupCanvas:", err);
        throw new Error("Failed to load Fabric.js library");
      });
      
      // Configure default object settings
      if (fabric.Object && fabric.Object.prototype) {
        fabric.Object.prototype.transparentCorners = false;
        fabric.Object.prototype.cornerColor = '#FFFFFF';
        fabric.Object.prototype.cornerStrokeColor = '#CCCCCC';
        fabric.Object.prototype.borderColor = BRAND_COLOR;
        fabric.Object.prototype.cornerSize = 10;
        fabric.Object.prototype.padding = 0; // Default zero padding for shape elements
      } else {
        console.warn("Fabric.Object.prototype not available, skipping default settings");
      }
      
      // Add canvas event listeners safely
      try {
        canvas.on('object:moving', handleObjectMoving);
        canvas.on('object:scaling', handleObjectScaling);
        canvas.on('object:rotating', handleObjectRotating);
        canvas.on('mouse:up', clearGuides);
        canvas.on('selection:created', handleSelectionChange);
        canvas.on('selection:updated', handleSelectionChange);
        canvas.on('selection:cleared', () => setActiveObject(null));
      } catch (eventError) {
        console.error("Error attaching canvas event listeners:", eventError);
        throw new Error("Failed to set up canvas event handlers");
      }
      
      // Draw grid initially if enabled
      if (gridEnabled) {
        try {
          await drawGrid(canvas);
        } catch (gridError) {
          console.warn("Failed to draw initial grid:", gridError);
          // Continue without grid rather than failing completely
        }
      }
      
      console.log("Canvas setup completed successfully");
    } catch (error: any) {
      console.error("Error in setupCanvas:", error);
      throw new Error(error?.message || "Error in canvas setup"); // Re-throw with better error handling
    }
  };
  
  // Draw grid lines on the canvas
  const drawGrid = async (canvas: any) => {
    // Remove any existing grid
    const existingGrid = canvas.getObjects().filter((o: any) => o.isGrid);
    existingGrid.forEach((grid: any) => canvas.remove(grid));
    
    // Get fabric instance
    const fabric = await getFabric();
    
    // Create new grid
    const gridColor = 'rgba(200, 200, 200, 0.4)';
    const gridGroup = new fabric.Group([], { selectable: false, evented: false, isGrid: true });
    
    // Add vertical grid lines
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      const line = new fabric.Line([i, 0, i, CANVAS_HEIGHT], {
        stroke: gridColor,
        selectable: false,
        evented: false,
        strokeWidth: 1
      });
      gridGroup.addWithUpdate(line);
    }
    
    // Add horizontal grid lines
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      const line = new fabric.Line([0, i, CANVAS_WIDTH, i], {
        stroke: gridColor,
        selectable: false,
        evented: false,
        strokeWidth: 1
      });
      gridGroup.addWithUpdate(line);
    }
    
    // Add grid to canvas
    canvas.add(gridGroup);
    canvas.sendToBack(gridGroup);
    canvas.renderAll();
  };
  
  // Toggle grid visibility
  const toggleGrid = () => {
    if (!fabricCanvas) return;
    
    const newGridState = !gridEnabled;
    setGridEnabled(newGridState);
    
    if (newGridState) {
      drawGrid(fabricCanvas);
    } else {
      // Remove existing grid
      const existingGrid = fabricCanvas.getObjects().filter((o: any) => o.isGrid);
      existingGrid.forEach((grid: any) => fabricCanvas.remove(grid));
      fabricCanvas.renderAll();
    }
  };
  
  // Handle object moving - implement snap to grid and snap to objects
  const handleObjectMoving = (e: any) => {
    const obj = e.target;
    const canvas = fabricCanvas;
    let snapped = false;
    
    // Remove existing guides
    clearGuides();
    
    if (!obj) return;
    
    // Get object coordinates and dimensions
    const objBounds = {
      left: obj.left,
      top: obj.top,
      right: obj.left + obj.getScaledWidth(),
      bottom: obj.top + obj.getScaledHeight(),
      centerX: obj.left + obj.getScaledWidth() / 2,
      centerY: obj.top + obj.getScaledHeight() / 2
    };
    
    // Create arrays to store closest snaps for each edge/center
    const snaps = {
      left: { distance: SNAP_THRESHOLD, position: null as number | null },
      centerX: { distance: SNAP_THRESHOLD, position: null as number | null },
      right: { distance: SNAP_THRESHOLD, position: null as number | null },
      top: { distance: SNAP_THRESHOLD, position: null as number | null },
      centerY: { distance: SNAP_THRESHOLD, position: null as number | null },
      bottom: { distance: SNAP_THRESHOLD, position: null as number | null }
    };
    
    // 1. Snap to Grid if enabled
    if (snapToGridEnabled) {
      // Snap left edge to grid
      const leftMod = objBounds.left % GRID_SIZE;
      if (leftMod < SNAP_THRESHOLD) {
        snaps.left.distance = leftMod;
        snaps.left.position = objBounds.left - leftMod;
      } else if (GRID_SIZE - leftMod < SNAP_THRESHOLD) {
        snaps.left.distance = GRID_SIZE - leftMod;
        snaps.left.position = objBounds.left + (GRID_SIZE - leftMod);
      }
      
      // Snap top edge to grid
      const topMod = objBounds.top % GRID_SIZE;
      if (topMod < SNAP_THRESHOLD) {
        snaps.top.distance = topMod;
        snaps.top.position = objBounds.top - topMod;
      } else if (GRID_SIZE - topMod < SNAP_THRESHOLD) {
        snaps.top.distance = GRID_SIZE - topMod;
        snaps.top.position = objBounds.top + (GRID_SIZE - topMod);
      }
      
      // Snap center X to grid
      const centerXMod = objBounds.centerX % GRID_SIZE;
      if (centerXMod < SNAP_THRESHOLD) {
        snaps.centerX.distance = centerXMod;
        snaps.centerX.position = objBounds.centerX - centerXMod;
      } else if (GRID_SIZE - centerXMod < SNAP_THRESHOLD) {
        snaps.centerX.distance = GRID_SIZE - centerXMod;
        snaps.centerX.position = objBounds.centerX + (GRID_SIZE - centerXMod);
      }
      
      // Snap center Y to grid
      const centerYMod = objBounds.centerY % GRID_SIZE;
      if (centerYMod < SNAP_THRESHOLD) {
        snaps.centerY.distance = centerYMod;
        snaps.centerY.position = objBounds.centerY - centerYMod;
      } else if (GRID_SIZE - centerYMod < SNAP_THRESHOLD) {
        snaps.centerY.distance = GRID_SIZE - centerYMod;
        snaps.centerY.position = objBounds.centerY + (GRID_SIZE - centerYMod);
      }
    }
    
    // 2. Snap to other objects if enabled
    if (snapToObjectsEnabled) {
      const otherObjects = canvas.getObjects().filter((o: any) => 
        o !== obj && !o.isGrid && !o.isGuideLine && o.selectable !== false
      );
      
      otherObjects.forEach((other: any) => {
        const otherBounds = {
          left: other.left,
          top: other.top,
          right: other.left + other.getScaledWidth(),
          bottom: other.top + other.getScaledHeight(),
          centerX: other.left + other.getScaledWidth() / 2,
          centerY: other.top + other.getScaledHeight() / 2
        };
        
        // Check for horizontal alignments (left, center, right)
        checkAndUpdateSnap(snaps.left, objBounds.left, otherBounds.left, 'vertical', 0);
        checkAndUpdateSnap(snaps.left, objBounds.left, otherBounds.right, 'vertical', 0);
        checkAndUpdateSnap(snaps.centerX, objBounds.centerX, otherBounds.centerX, 'vertical', CANVAS_HEIGHT);
        checkAndUpdateSnap(snaps.right, objBounds.right, otherBounds.left, 'vertical', 0);
        checkAndUpdateSnap(snaps.right, objBounds.right, otherBounds.right, 'vertical', 0);
        
        // Check for vertical alignments (top, center, bottom)
        checkAndUpdateSnap(snaps.top, objBounds.top, otherBounds.top, 'horizontal', 0);
        checkAndUpdateSnap(snaps.top, objBounds.top, otherBounds.bottom, 'horizontal', 0);
        checkAndUpdateSnap(snaps.centerY, objBounds.centerY, otherBounds.centerY, 'horizontal', CANVAS_WIDTH);
        checkAndUpdateSnap(snaps.bottom, objBounds.bottom, otherBounds.top, 'horizontal', 0);
        checkAndUpdateSnap(snaps.bottom, objBounds.bottom, otherBounds.bottom, 'horizontal', 0);
        
        // Equal spacing between objects (future implementation)
        // This would be more complex and require tracking multiple objects
      });
    }
    
    // Apply the closest snaps
    const newGuides = [];
    let newLeft = obj.left;
    let newTop = obj.top;
    
    // Apply horizontal snaps (left, centerX, right)
    if (snaps.left.position !== null && snaps.left.distance === Math.min(snaps.left.distance, snaps.centerX.distance, snaps.right.distance)) {
      newLeft = snaps.left.position;
      snapped = true;
      if (showGuides) {
        newGuides.push(createGuideLine(snaps.left.position, 0, snaps.left.position, CANVAS_HEIGHT, 'vertical'));
      }
    } else if (snaps.centerX.position !== null && snaps.centerX.distance === Math.min(snaps.left.distance, snaps.centerX.distance, snaps.right.distance)) {
      newLeft = snaps.centerX.position - obj.getScaledWidth() / 2;
      snapped = true;
      if (showGuides) {
        newGuides.push(createGuideLine(snaps.centerX.position, 0, snaps.centerX.position, CANVAS_HEIGHT, 'vertical'));
      }
    } else if (snaps.right.position !== null && snaps.right.distance === Math.min(snaps.left.distance, snaps.centerX.distance, snaps.right.distance)) {
      newLeft = snaps.right.position - obj.getScaledWidth();
      snapped = true;
      if (showGuides) {
        newGuides.push(createGuideLine(snaps.right.position, 0, snaps.right.position, CANVAS_HEIGHT, 'vertical'));
      }
    }
    
    // Apply vertical snaps (top, centerY, bottom)
    if (snaps.top.position !== null && snaps.top.distance === Math.min(snaps.top.distance, snaps.centerY.distance, snaps.bottom.distance)) {
      newTop = snaps.top.position;
      snapped = true;
      if (showGuides) {
        newGuides.push(createGuideLine(0, snaps.top.position, CANVAS_WIDTH, snaps.top.position, 'horizontal'));
      }
    } else if (snaps.centerY.position !== null && snaps.centerY.distance === Math.min(snaps.top.distance, snaps.centerY.distance, snaps.bottom.distance)) {
      newTop = snaps.centerY.position - obj.getScaledHeight() / 2;
      snapped = true;
      if (showGuides) {
        newGuides.push(createGuideLine(0, snaps.centerY.position, CANVAS_WIDTH, snaps.centerY.position, 'horizontal'));
      }
    } else if (snaps.bottom.position !== null && snaps.bottom.distance === Math.min(snaps.top.distance, snaps.centerY.distance, snaps.bottom.distance)) {
      newTop = snaps.bottom.position - obj.getScaledHeight();
      snapped = true;
      if (showGuides) {
        newGuides.push(createGuideLine(0, snaps.bottom.position, CANVAS_WIDTH, snaps.bottom.position, 'horizontal'));
      }
    }
    
    // If snapped, update object position with animation effect
    if (snapped) {
      // Get fabric instance for animation
      getFabric().then(fabric => {
        // Animate the snapping for a smooth feeling
        obj.animate({
          left: newLeft,
          top: newTop
        }, {
          duration: 100,
          onChange: canvas.renderAll.bind(canvas),
          easing: fabric.util.ease.easeOutElastic
        });
      });
      
      // Add guides to canvas
      newGuides.forEach(guide => canvas.add(guide));
      setGuides(newGuides);
      
      // Update object position
      obj.setCoords();
    }
  };
  
  // Helper function to check and update snap distances
  const checkAndUpdateSnap = (
    snapObj: { distance: number, position: number | null },
    objPosition: number,
    targetPosition: number,
    orientation: 'horizontal' | 'vertical',
    length: number
  ) => {
    const distance = Math.abs(objPosition - targetPosition);
    if (distance < snapObj.distance) {
      snapObj.distance = distance;
      snapObj.position = targetPosition;
    }
  };
  
  // Create a guide line with animation effect
  const createGuideLine = async (x1: number, y1: number, x2: number, y2: number, type: string) => {
    // Get fabric instance
    const fabric = await getFabric();
    
    const guideLine = new fabric.Line([x1, y1, x2, y2], {
      stroke: GUIDE_COLOR,
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      isGuideLine: true,
      opacity: 0
    });
    
    // Animate guide line appearance
    guideLine.animate('opacity', 1, {
      duration: 200,
      onChange: fabricCanvas.renderAll.bind(fabricCanvas),
      easing: fabric.util.ease.easeInOutQuad
    });
    
    return guideLine;
  };
  
  // Clear all guide lines
  const clearGuides = async () => {
    // Ensure canvas exists before proceeding
    if (!fabricCanvas) {
      console.log("Cannot clear guides - canvas not initialized");
      return;
    }
    
    try {
      // Get fabric instance
      const fabric = await getFabric();
      
      // Safely get objects and filter them
      const canvasObjects = fabricCanvas.getObjects ? fabricCanvas.getObjects() : [];
      const existingGuides = canvasObjects.filter((o: any) => o && o.isGuideLine);
      
      existingGuides.forEach((guide: any) => {
        try {
          // Fade out animation
          guide.animate('opacity', 0, {
            duration: 200,
            onChange: fabricCanvas.renderAll.bind(fabricCanvas),
            onComplete: () => {
              if (fabricCanvas) {
                fabricCanvas.remove(guide);
                fabricCanvas.renderAll();
              }
            },
            easing: fabric.util.ease.easeInOutQuad
          });
        } catch (error) {
          console.error("Error animating guide removal:", error);
          // Fallback - try to remove directly
          if (fabricCanvas) {
            fabricCanvas.remove(guide);
            fabricCanvas.renderAll();
          }
        }
      });
      
      setGuides([]);
    } catch (error) {
      console.error("Error in clearGuides:", error);
    }
  };
  
  // Handle object scaling with snapping
  const handleObjectScaling = (e: any) => {
    // Implement snap-to-grid for scaling if needed
    // Similar logic to moving but for width/height
  };
  
  // Handle object rotation
  const handleObjectRotating = (e: any) => {
    const obj = e.target;
    
    // Snap rotation to 15-degree increments
    const angle = obj.angle;
    const snapAngle = 15;
    
    const remainder = angle % snapAngle;
    if (remainder < snapAngle / 2) {
      obj.set({ angle: angle - remainder });
    } else {
      obj.set({ angle: angle + (snapAngle - remainder) });
    }
  };
  
  // Handle selection changes
  const handleSelectionChange = (e: any) => {
    if (e.selected && e.selected.length > 0) {
      setActiveObject(e.selected[0]);
    }
  };
  
  // Add a rectangle to the canvas
  const addRectangle = async () => {
    if (!fabricCanvas) return;
    
    try {
      // Get fabric instance
      const fabric = await getFabric();
      
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: '#4361EE',
        width: 100,
        height: 100,
        opacity: 0.7,
        padding: 0,
      });
      
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      setActiveObject(rect);
      fabricCanvas.renderAll();
    } catch (error) {
      console.error("Error adding rectangle:", error);
      toast({
        title: "Error",
        description: "Failed to add rectangle to canvas",
        variant: "destructive"
      });
    }
  };
  
  // Add a circle to the canvas
  const addCircle = async () => {
    if (!fabricCanvas) return;
    
    try {
      // Get fabric instance
      const fabric = await getFabric();
      
      const circle = new fabric.Circle({
        left: 100,
        top: 100,
        fill: '#F72585',
        radius: 50,
        opacity: 0.7,
        padding: 0,
      });
      
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
      setActiveObject(circle);
      fabricCanvas.renderAll();
    } catch (error) {
      console.error("Error adding circle:", error);
      toast({
        title: "Error",
        description: "Failed to add circle to canvas",
        variant: "destructive"
      });
    }
  };
  
  // Add a triangle to the canvas
  const addTriangle = async () => {
    if (!fabricCanvas) return;
    
    try {
      // Get fabric instance
      const fabric = await getFabric();
      
      const triangle = new fabric.Triangle({
        left: 100,
        top: 100,
        fill: '#7209B7',
        width: 100,
        height: 100,
        opacity: 0.7,
        padding: 0,
      });
      
      fabricCanvas.add(triangle);
      fabricCanvas.setActiveObject(triangle);
      setActiveObject(triangle);
      fabricCanvas.renderAll();
    } catch (error) {
      console.error("Error adding triangle:", error);
      toast({
        title: "Error",
        description: "Failed to add triangle to canvas",
        variant: "destructive"
      });
    }
  };
  
  // Add a text object to the canvas
  const addText = async () => {
    if (!fabricCanvas) return;
    
    try {
      // Get fabric instance
      const fabric = await getFabric();
      
      const text = new fabric.Textbox("Click to edit text", {
        left: 100,
        top: 100,
        fontFamily: "Inter",
        fontSize: 24,
        fill: "#000000",
        width: 300,
        padding: 5,
      });
      
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      setActiveObject(text);
      fabricCanvas.renderAll();
    } catch (error) {
      console.error("Error adding text:", error);
      toast({
        title: "Error",
        description: "Failed to add text to canvas",
        variant: "destructive"
      });
    }
  };
  
  // Delete the selected object
  const deleteObject = () => {
    if (!fabricCanvas || !activeObject) return;
    
    fabricCanvas.remove(activeObject);
    setActiveObject(null);
    fabricCanvas.renderAll();
  };
  
  // Clone the selected object
  const cloneObject = async () => {
    if (!fabricCanvas || !activeObject) return;
    
    try {
      activeObject.clone((cloned: any) => {
        fabricCanvas.discardActiveObject();
        
        // Position the clone slightly offset from the original
        cloned.set({
          left: activeObject.left + 20,
          top: activeObject.top + 20,
          evented: true,
        });
        
        // Add to canvas & select
        fabricCanvas.add(cloned);
        fabricCanvas.setActiveObject(cloned);
        fabricCanvas.renderAll();
        setActiveObject(cloned);
      });
    } catch (error) {
      console.error("Error cloning object:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate object",
        variant: "destructive"
      });
    }
  };
  
  // Center the selected object horizontally
  const centerHorizontally = () => {
    if (!fabricCanvas || !activeObject) return;
    
    const center = fabricCanvas.getWidth() / 2;
    const objectCenter = activeObject.getScaledWidth() / 2;
    
    activeObject.set({ left: center - objectCenter });
    activeObject.setCoords();
    fabricCanvas.renderAll();
  };
  
  // Center the selected object vertically
  const centerVertically = () => {
    if (!fabricCanvas || !activeObject) return;
    
    const center = fabricCanvas.getHeight() / 2;
    const objectCenter = activeObject.getScaledHeight() / 2;
    
    activeObject.set({ top: center - objectCenter });
    activeObject.setCoords();
    fabricCanvas.renderAll();
  };
  
  // Load a design from JSON string
  const loadDesign = async (canvas: any, jsonData: string) => {
    try {
      canvas.loadFromJSON(jsonData, () => {
        canvas.renderAll();
      });
    } catch (error) {
      console.error("Error loading design:", error);
      toast({
        title: "Error",
        description: "Failed to load design",
        variant: "destructive"
      });
    }
  };
  
  // Save the current design to JSON string
  const saveDesign = () => {
    if (!fabricCanvas) return;
    
    try {
      const json = JSON.stringify(fabricCanvas.toJSON());
      if (onSave) {
        onSave(json);
      }
      return json;
    } catch (error) {
      console.error("Error saving design:", error);
      return null;
    }
  };
  
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div className="bg-white border-b p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-medium">Design Editor</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={saveDesign}
          >
            Save
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={gridEnabled ? "secondary" : "outline"} 
                  size="sm"
                  onClick={toggleGrid}
                >
                  <Grid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle grid visibility</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={snapToGridEnabled ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setSnapToGridEnabled(!snapToGridEnabled)}
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Snap to Grid
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle snap to grid</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={snapToObjectsEnabled ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setSnapToObjectsEnabled(!snapToObjectsEnabled)}
                >
                  <Move className="h-4 w-4 mr-1" />
                  Smart Guides
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle snap to objects</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* Left toolbar */}
        <div className="w-12 bg-white border-r flex flex-col items-center py-2 space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={addRectangle}>
                  <Square className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Add Rectangle</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={addCircle}>
                  <Circle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Add Circle</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={addTriangle}>
                  <Triangle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Add Triangle</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={addText}>
                  <Type className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Add Text</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="border-t my-2 w-8"></div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={deleteObject}
                  disabled={!activeObject}
                >
                  <Trash className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={cloneObject}
                  disabled={!activeObject}
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Duplicate</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Canvas container */}
        <div className="flex-1 bg-gray-100 overflow-auto p-4 flex items-center justify-center">
          <div className="relative bg-white shadow-lg">
            <canvas ref={canvasRef} />
            
            {!isCanvasReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Properties panel - only shown when an object is selected */}
        {activeObject && (
          <div className="w-64 bg-white border-l p-4 overflow-y-auto">
            <h3 className="text-sm font-medium mb-4">Properties</h3>
            
            <div className="space-y-4">
              {/* Position controls */}
              <div>
                <h4 className="text-xs font-medium mb-2">Position</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="posX" className="text-xs">X</Label>
                    <Input 
                      id="posX" 
                      type="number" 
                      value={Math.round(activeObject.left)}
                      onChange={(e) => {
                        activeObject.set({ left: parseInt(e.target.value) });
                        fabricCanvas.renderAll();
                      }}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="posY" className="text-xs">Y</Label>
                    <Input 
                      id="posY" 
                      type="number" 
                      value={Math.round(activeObject.top)}
                      onChange={(e) => {
                        activeObject.set({ top: parseInt(e.target.value) });
                        fabricCanvas.renderAll();
                      }}
                      className="h-8"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs" 
                    onClick={centerHorizontally}
                  >
                    Center H
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs" 
                    onClick={centerVertically}
                  >
                    Center V
                  </Button>
                </div>
              </div>
              
              {/* Size controls */}
              <div>
                <h4 className="text-xs font-medium mb-2">Size</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="width" className="text-xs">Width</Label>
                    <Input 
                      id="width" 
                      type="number" 
                      value={Math.round(activeObject.getScaledWidth())}
                      onChange={(e) => {
                        activeObject.set({ width: parseInt(e.target.value) / activeObject.scaleX });
                        fabricCanvas.renderAll();
                      }}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-xs">Height</Label>
                    <Input 
                      id="height" 
                      type="number" 
                      value={Math.round(activeObject.getScaledHeight())}
                      onChange={(e) => {
                        activeObject.set({ height: parseInt(e.target.value) / activeObject.scaleY });
                        fabricCanvas.renderAll();
                      }}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
              
              {/* Style controls */}
              <div>
                <h4 className="text-xs font-medium mb-2">Style</h4>
                
                {/* Color picker */}
                <div className="mb-2">
                  <Label htmlFor="fill" className="text-xs">Fill Color</Label>
                  <div className="flex items-center mt-1">
                    <input 
                      type="color" 
                      id="fill" 
                      value={activeObject.fill || '#000000'} 
                      onChange={(e) => {
                        activeObject.set({ fill: e.target.value });
                        fabricCanvas.renderAll();
                      }}
                      className="w-8 h-8 mr-2"
                    />
                    <Input
                      value={activeObject.fill || '#000000'}
                      onChange={(e) => {
                        activeObject.set({ fill: e.target.value });
                        fabricCanvas.renderAll();
                      }}
                      className="h-8 font-mono text-sm"
                    />
                  </div>
                </div>
                
                {/* Opacity slider */}
                <div className="mb-2">
                  <Label htmlFor="opacity" className="text-xs flex justify-between">
                    <span>Opacity</span>
                    <span>{Math.round(activeObject.opacity * 100)}%</span>
                  </Label>
                  <Slider
                    id="opacity"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[activeObject.opacity]}
                    onValueChange={(value) => {
                      activeObject.set({ opacity: value[0] });
                      fabricCanvas.renderAll();
                    }}
                    className="mt-1.5"
                  />
                </div>
              </div>
              
              {/* Text-specific controls */}
              {activeObject.type === 'textbox' && (
                <div>
                  <h4 className="text-xs font-medium mb-2">Text</h4>
                  
                  {/* Text content */}
                  <div className="mb-2">
                    <Label htmlFor="text" className="text-xs">Content</Label>
                    <Input 
                      id="text" 
                      value={activeObject.text}
                      onChange={(e) => {
                        activeObject.set({ text: e.target.value });
                        fabricCanvas.renderAll();
                      }}
                      className="h-8 mt-1"
                    />
                  </div>
                  
                  {/* Text formatting */}
                  <div className="flex items-center space-x-1 mb-2">
                    <Button 
                      variant={activeObject.fontWeight === 'bold' ? 'secondary' : 'outline'} 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        activeObject.set({ fontWeight: activeObject.fontWeight === 'bold' ? 'normal' : 'bold' });
                        fabricCanvas.renderAll();
                      }}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={activeObject.fontStyle === 'italic' ? 'secondary' : 'outline'} 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        activeObject.set({ fontStyle: activeObject.fontStyle === 'italic' ? 'normal' : 'italic' });
                        fabricCanvas.renderAll();
                      }}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={activeObject.underline ? 'secondary' : 'outline'} 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        activeObject.set({ underline: !activeObject.underline });
                        fabricCanvas.renderAll();
                      }}
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Text alignment */}
                  <div className="flex items-center space-x-1 mb-2">
                    <Button 
                      variant={activeObject.textAlign === 'left' ? 'secondary' : 'outline'} 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        activeObject.set({ textAlign: 'left' });
                        fabricCanvas.renderAll();
                      }}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={activeObject.textAlign === 'center' ? 'secondary' : 'outline'} 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        activeObject.set({ textAlign: 'center' });
                        fabricCanvas.renderAll();
                      }}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={activeObject.textAlign === 'right' ? 'secondary' : 'outline'} 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        activeObject.set({ textAlign: 'right' });
                        fabricCanvas.renderAll();
                      }}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={activeObject.textAlign === 'justify' ? 'secondary' : 'outline'} 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        activeObject.set({ textAlign: 'justify' });
                        fabricCanvas.renderAll();
                      }}
                    >
                      <AlignJustify className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Font size */}
                  <div className="mb-2">
                    <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
                    <Input 
                      id="fontSize" 
                      type="number" 
                      value={activeObject.fontSize}
                      onChange={(e) => {
                        activeObject.set({ fontSize: parseInt(e.target.value) });
                        fabricCanvas.renderAll();
                      }}
                      className="h-8 mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}