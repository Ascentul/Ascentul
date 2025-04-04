import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { 
  Save, FileDown, Undo, Redo, Type, Square, Image as ImageIcon,
  Plus, Trash, Copy, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, PanelLeftClose, PanelLeftOpen,
  Palette, Move, ChevronsUpDown, RotateCcw, ChevronRight,
  Layers, TextCursor, FileText, Download
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
    <div className="w-full h-[calc(100vh-12rem)] flex flex-col">
      {/* Top Control Bar */}
      <div className="flex justify-between items-center p-2 border-b">
        <div className="flex items-center gap-2">
          <Separator orientation="vertical" className="h-6" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={addText}
                >
                  <TextCursor size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Text</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={addRectangle}
                >
                  <Square size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Shape</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={!activeObject}
                  onClick={deleteObject}
                >
                  <Trash size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={saveDesign}
                >
                  <Save size={16} className="mr-1" />
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Design</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={exportToPDF}
                >
                  <FileDown size={16} className="mr-1" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as PDF</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Side Panel */}
        {showSidebar && (
          <div className="w-64 border-r bg-background overflow-y-auto">
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

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
          <div className="bg-white shadow-lg">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
}