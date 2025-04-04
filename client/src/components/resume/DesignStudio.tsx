import React, { useEffect, useRef, useState } from 'react';
import { 
  Plus,
  Type, 
  Square, 
  Image as ImageIcon, 
  Layout, 
  Wand2, 
  Save, 
  FileDown, 
  Layers, 
  History,
  Circle,
  Triangle,
  ArrowDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Define fabric type for TypeScript
declare global {
  interface Window {
    fabric: any;
  }
}

export default function DesignStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [fontSize, setFontSize] = useState<string>("24");
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [textColor, setTextColor] = useState<string>("#000000");
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
  const [textAlign, setTextAlign] = useState<string>("left");
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize Fabric canvas
    if (canvasRef.current && window.fabric && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new window.fabric.Canvas(canvasRef.current, {
        width: 595,
        height: 842,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
      });

      // Setup object selection event
      fabricCanvasRef.current.on('selection:created', handleObjectSelected);
      fabricCanvasRef.current.on('selection:updated', handleObjectSelected);
      fabricCanvasRef.current.on('selection:cleared', () => {
        setSelectedObject(null);
        resetPropertyControls();
      });
    }

    return () => {
      // Cleanup on component unmount
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, []);

  const handleObjectSelected = (e: any) => {
    const selectedObject = e.selected[0];
    setSelectedObject(selectedObject);
    
    // Update property controls based on selected object
    if (selectedObject) {
      if (selectedObject.type === 'textbox' || selectedObject.type === 'i-text') {
        setFontSize(selectedObject.fontSize.toString());
        setFontFamily(selectedObject.fontFamily);
        setTextColor(selectedObject.fill);
        setTextAlign(selectedObject.textAlign);
        setIsBold(selectedObject.fontWeight === 'bold');
        setIsItalic(selectedObject.fontStyle === 'italic');
        setIsUnderline(selectedObject.underline);
      }
      
      if (selectedObject.fill && selectedObject.type !== 'textbox' && selectedObject.type !== 'i-text') {
        setBackgroundColor(selectedObject.fill);
      }
    }
  };

  const resetPropertyControls = () => {
    setFontSize("24");
    setFontFamily("Arial");
    setTextColor("#000000");
    setBackgroundColor("#ffffff");
    setTextAlign("left");
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
  };

  const addText = () => {
    if (!fabricCanvasRef.current) return;

    const text = new window.fabric.IText('Edit text', {
      left: 100,
      top: 100,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
    });
    
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    text.enterEditing();
    fabricCanvasRef.current.renderAll();
  };

  const addHeading = () => {
    if (!fabricCanvasRef.current) return;

    const heading = new window.fabric.IText('Heading', {
      left: 100,
      top: 50,
      fontSize: 32,
      fontFamily: 'Arial',
      fill: '#000000',
      fontWeight: 'bold',
    });
    
    fabricCanvasRef.current.add(heading);
    fabricCanvasRef.current.setActiveObject(heading);
    fabricCanvasRef.current.renderAll();
  };

  const addParagraph = () => {
    if (!fabricCanvasRef.current) return;

    const paragraph = new window.fabric.Textbox(
      'This is a paragraph of text. Click to edit and resize this text box. You can add multiple lines of text in this box.',
      {
        left: 100,
        top: 150,
        width: 300,
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#000000',
        lineHeight: 1.5,
        textAlign: 'left'
      }
    );
    
    fabricCanvasRef.current.add(paragraph);
    fabricCanvasRef.current.setActiveObject(paragraph);
    fabricCanvasRef.current.renderAll();
  };

  const addRectangle = () => {
    if (!fabricCanvasRef.current) return;

    const rect = new window.fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: '#cccccc',
      stroke: '#000000',
      strokeWidth: 1,
    });
    
    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.renderAll();
  };

  const addCircle = () => {
    if (!fabricCanvasRef.current) return;

    const circle = new window.fabric.Circle({
      left: 150,
      top: 150,
      radius: 50,
      fill: '#cccccc',
      stroke: '#000000',
      strokeWidth: 1,
    });
    
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.renderAll();
  };

  const addTriangle = () => {
    if (!fabricCanvasRef.current) return;

    const triangle = new window.fabric.Triangle({
      left: 200,
      top: 200,
      width: 100,
      height: 100,
      fill: '#cccccc',
      stroke: '#000000',
      strokeWidth: 1,
    });
    
    fabricCanvasRef.current.add(triangle);
    fabricCanvasRef.current.renderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target || !event.target.result) return;
      
      const imgObj = new Image();
      imgObj.src = event.target.result as string;
      
      imgObj.onload = () => {
        if (!fabricCanvasRef.current) return;
        
        const fabricImage = new window.fabric.Image(imgObj);
        
        // Scale down if the image is too large
        if (fabricImage.width > 300 || fabricImage.height > 300) {
          const scale = Math.min(300 / fabricImage.width, 300 / fabricImage.height);
          fabricImage.scale(scale);
        }
        
        fabricCanvasRef.current.add(fabricImage);
        fabricCanvasRef.current.renderAll();
      };
    };
    
    reader.readAsDataURL(e.target.files[0]);
    
    // Reset the file input so the same image can be uploaded again
    e.target.value = '';
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const saveDesign = () => {
    if (!fabricCanvasRef.current) return;
    
    try {
      // Get the JSON representation of the canvas
      const json = JSON.stringify(fabricCanvasRef.current.toJSON(['selectable', 'hasControls']));
      
      // Get the current date for naming
      const date = new Date();
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      
      // Store in localStorage
      localStorage.setItem('resumeDesign', json);
      
      // Store name of design and date
      const savedDesigns = JSON.parse(localStorage.getItem('savedDesignsList') || '[]');
      const designInfo = {
        id: Date.now().toString(),
        name: `Resume Design - ${formattedDate}`,
        date: date.toISOString(),
        previewData: fabricCanvasRef.current.toDataURL({
          format: 'png',
          quality: 0.1,
          multiplier: 0.1
        })
      };
      
      savedDesigns.push(designInfo);
      localStorage.setItem('savedDesignsList', JSON.stringify(savedDesigns));
      
      toast({
        title: "Design Saved Successfully",
        description: `Your design "${designInfo.name}" has been saved to browser storage`,
      });
    } catch (error) {
      toast({
        title: "Error Saving Design",
        description: "There was a problem saving your design. Please try again.",
        variant: "destructive",
      });
      console.error("Save design error:", error);
    }
  };

  const loadDesign = () => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const savedDesign = localStorage.getItem('resumeDesign');
      if (savedDesign) {
        // Clear the current canvas before loading
        fabricCanvasRef.current.clear();
        
        // Load the saved design
        fabricCanvasRef.current.loadFromJSON(savedDesign, () => {
          fabricCanvasRef.current.renderAll();
          
          // Make sure all objects are selectable
          fabricCanvasRef.current.forEachObject((obj) => {
            obj.selectable = true;
            obj.hasControls = true;
          });
          
          toast({
            title: "Design Loaded Successfully",
            description: "Your saved design has been loaded to the canvas",
          });
        });
      } else {
        toast({
          title: "No Saved Design Found",
          description: "No previously saved design was found in browser storage",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error Loading Design",
        description: "There was a problem loading your design. The file might be corrupted.",
        variant: "destructive",
      });
      console.error("Load design error:", error);
    }
  };

  const exportToPDF = () => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2 // Higher resolution for better quality PDF
      });
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Export Failed",
          description: "Unable to open print window. Check if pop-ups are allowed.",
          variant: "destructive",
        });
        return;
      }
      
      // A4 page specifics
      const a4Width = 595;
      const a4Height = 842;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Resume PDF Export</title>
            <style>
              body { 
                margin: 0; 
                padding: 0;
                background-color: #f5f5f5;
              }
              .container {
                display: flex;
                justify-content: center;
                padding: 20px;
              }
              .page {
                width: ${a4Width}px;
                height: ${a4Height}px;
                background-color: white;
                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                overflow: hidden;
              }
              img { 
                width: 100%; 
                height: 100%;
                object-fit: contain;
              }
              @media print {
                body { 
                  margin: 0; 
                  padding: 0;
                  background-color: white;
                }
                .container {
                  padding: 0;
                }
                .page {
                  width: 100%;
                  height: 100%;
                  box-shadow: none;
                  page-break-after: always;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="page">
                <img src="${dataURL}" alt="Resume" />
              </div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  // Show success message after printing
                  window.onfocus = function() { 
                    window.opener.postMessage('pdf-exported', '*');
                    window.close(); 
                  }
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Listen for the success message from the print window
      window.addEventListener('message', (event) => {
        if (event.data === 'pdf-exported') {
          toast({
            title: "Export Successful",
            description: "Your resume has been exported to PDF",
          });
        }
      }, { once: true });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was a problem exporting your design to PDF",
        variant: "destructive",
      });
    }
  };

  const deleteSelectedObject = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    
    fabricCanvasRef.current.remove(selectedObject);
    setSelectedObject(null);
    resetPropertyControls();
    fabricCanvasRef.current.renderAll();
  };

  const applyTextStyle = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    
    if (selectedObject.type === 'textbox' || selectedObject.type === 'i-text') {
      selectedObject.set({
        fontSize: parseInt(fontSize),
        fontFamily: fontFamily,
        fill: textColor,
        textAlign: textAlign,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: isItalic ? 'italic' : 'normal',
        underline: isUnderline
      });
      
      fabricCanvasRef.current.renderAll();
    }
  };

  const applyShapeStyle = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    
    if (selectedObject.type !== 'textbox' && selectedObject.type !== 'i-text') {
      selectedObject.set({
        fill: backgroundColor
      });
      
      fabricCanvasRef.current.renderAll();
    }
  };

  // Apply text styling when the controls change
  useEffect(() => {
    applyTextStyle();
  }, [fontSize, fontFamily, textColor, textAlign, isBold, isItalic, isUnderline]);

  // Apply shape styling when the controls change
  useEffect(() => {
    applyShapeStyle();
  }, [backgroundColor]);

  const toggleBold = () => {
    setIsBold(!isBold);
  };

  const toggleItalic = () => {
    setIsItalic(!isItalic);
  };

  const toggleUnderline = () => {
    setIsUnderline(!isUnderline);
  };

  const setAlignment = (align: string) => {
    setTextAlign(align);
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-100">
      {/* Top Toolbar */}
      <div className="bg-white border-b p-2 flex items-center justify-between">
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" className="flex items-center" onClick={addText}>
            <Type className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Add Text</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center" onClick={addRectangle}>
            <Square className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Add Shape</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center" onClick={triggerImageUpload}>
            <ImageIcon className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Upload Image</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center">
            <Layout className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Templates</span>
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*" 
            onChange={handleImageUpload}
          />
        </div>
        <div className="flex space-x-1">
          <Button variant="outline" size="sm" className="flex items-center" onClick={saveDesign}>
            <Save className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Save</span>
          </Button>
          <Button variant="default" size="sm" className="flex items-center" onClick={exportToPDF}>
            <FileDown className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Export</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-60 border-r bg-white hidden md:block">
          <Tabs defaultValue="elements">
            <TabsList className="w-full">
              <TabsTrigger value="elements" className="flex-1">Elements</TabsTrigger>
              <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="elements" className="p-2">
              <ScrollArea className="h-[calc(100vh-10rem)]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Text Elements</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div 
                        className="bg-neutral-50 border rounded p-2 text-center cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={addHeading}
                      >
                        <p className="text-sm">Heading</p>
                      </div>
                      <div 
                        className="bg-neutral-50 border rounded p-2 text-center cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={addParagraph}
                      >
                        <p className="text-sm">Paragraph</p>
                      </div>
                      <div 
                        className="bg-neutral-50 border rounded p-2 text-center cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={addText}
                      >
                        <p className="text-sm">Single Line</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Shapes</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div 
                        className="bg-neutral-50 border rounded p-2 flex justify-center items-center cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={addCircle}
                      >
                        <div className="w-6 h-6 rounded-full border border-neutral-300"></div>
                      </div>
                      <div 
                        className="bg-neutral-50 border rounded p-2 flex justify-center items-center cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={addRectangle}
                      >
                        <div className="w-6 h-6 border border-neutral-300"></div>
                      </div>
                      <div 
                        className="bg-neutral-50 border rounded p-2 flex justify-center items-center cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={addTriangle}
                      >
                        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[16px] border-b-neutral-300 border-r-[10px] border-r-transparent"></div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Templates</h3>
                    <div className="space-y-2">
                      <div className="bg-neutral-50 border rounded p-2 cursor-pointer hover:bg-neutral-100 transition-colors" onClick={loadDesign}>
                        <p className="text-sm">Load Saved Design</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="templates" className="p-2">
              <ScrollArea className="h-[calc(100vh-10rem)]">
                <div className="grid grid-cols-1 gap-4">
                  <div className="border rounded cursor-pointer hover:border-primary transition-colors">
                    <div className="h-40 bg-neutral-100 flex justify-center items-center">
                      <p className="text-neutral-500">Modern</p>
                    </div>
                    <div className="p-2 bg-white border-t">
                      <p className="text-sm font-medium">Modern Template</p>
                    </div>
                  </div>
                  <div className="border rounded cursor-pointer hover:border-primary transition-colors">
                    <div className="h-40 bg-neutral-100 flex justify-center items-center">
                      <p className="text-neutral-500">Professional</p>
                    </div>
                    <div className="p-2 bg-white border-t">
                      <p className="text-sm font-medium">Professional Template</p>
                    </div>
                  </div>
                  <div className="border rounded cursor-pointer hover:border-primary transition-colors">
                    <div className="h-40 bg-neutral-100 flex justify-center items-center">
                      <p className="text-neutral-500">Creative</p>
                    </div>
                    <div className="p-2 bg-white border-t">
                      <p className="text-sm font-medium">Creative Template</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center Canvas Area */}
        <div className="flex-1 overflow-auto bg-neutral-200">
          <div className="min-h-full flex items-start justify-center p-10">
            <div className="w-[595px] h-[842px] bg-white shadow-lg">
              {/* A4 Canvas (595px x 842px) */}
              <canvas ref={canvasRef} width="595" height="842" className="border border-neutral-300"></canvas>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-60 border-l bg-white hidden md:block">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-4">Properties</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 block mb-1">Element</label>
                <p className="text-sm">{selectedObject ? selectedObject.type : 'No selection'}</p>
                {selectedObject && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full flex items-center justify-center"
                    onClick={deleteSelectedObject}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Delete Element</span>
                  </Button>
                )}
              </div>
              <Separator />
              
              {/* Text Properties */}
              {selectedObject && (selectedObject.type === 'textbox' || selectedObject.type === 'i-text') && (
                <>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 block mb-1">Font</label>
                    <select 
                      className="w-full text-sm p-1 border rounded" 
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 block mb-1">Size</label>
                    <input 
                      type="number" 
                      className="w-full text-sm p-1 border rounded"
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      min="8"
                      max="72"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 block mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-8 h-8 p-0 border-0"
                      />
                      <input 
                        type="text" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)}
                        className="text-sm border rounded px-2 py-1 w-full" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 block mb-1">Text Style</label>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant={isBold ? "default" : "outline"} 
                        className="flex-1"
                        onClick={toggleBold}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={isItalic ? "default" : "outline"} 
                        className="flex-1"
                        onClick={toggleItalic}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={isUnderline ? "default" : "outline"} 
                        className="flex-1"
                        onClick={toggleUnderline}
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 block mb-1">Alignment</label>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant={textAlign === 'left' ? "default" : "outline"} 
                        className="flex-1"
                        onClick={() => setAlignment('left')}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={textAlign === 'center' ? "default" : "outline"} 
                        className="flex-1"
                        onClick={() => setAlignment('center')}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={textAlign === 'right' ? "default" : "outline"} 
                        className="flex-1"
                        onClick={() => setAlignment('right')}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              
              {/* Shape Properties */}
              {selectedObject && selectedObject.type !== 'textbox' && selectedObject.type !== 'i-text' && (
                <div>
                  <label className="text-xs font-medium text-neutral-500 block mb-1">Fill Color</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={backgroundColor} 
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-8 h-8 p-0 border-0"
                    />
                    <input 
                      type="text" 
                      value={backgroundColor} 
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="text-sm border rounded px-2 py-1 w-full" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-white border-t p-2 flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={loadDesign}>
            <Layers className="h-4 w-4 mr-1" />
            <span className="text-sm">Load Design</span>
          </Button>
        </div>
        <div>
          <Button variant="ghost" size="sm" onClick={saveDesign}>
            <Save className="h-4 w-4 mr-1" />
            <span className="text-sm">Save Design</span>
          </Button>
        </div>
      </div>
    </div>
  );
}