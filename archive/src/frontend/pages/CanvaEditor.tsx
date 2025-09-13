import { useState, useEffect, useRef } from "react";
import DesignEditor from "@/components/design/DesignEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Palette, PlusCircle, X, Trash2, FileDown, Share2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DesignType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  json: string;
  thumbnail?: string;
  category?: string;
}

export default function CanvaEditor() {
  const [savedDesigns, setSavedDesigns] = useState<DesignType[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<DesignType | null>(null);
  const [newDesignName, setNewDesignName] = useState<string>("");
  const [newDesignCategory, setNewDesignCategory] = useState<string>("personal");
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [templateTab, setTemplateTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  // Load saved designs from localStorage on component mount
  useEffect(() => {
    loadSavedDesigns();
  }, []);
  
  // Load saved designs from localStorage
  const loadSavedDesigns = () => {
    try {
      const designsStr = localStorage.getItem("canvaDesigns");
      if (designsStr) {
        const designs = JSON.parse(designsStr);
        setSavedDesigns(designs);
      }
    } catch (error) {
      console.error("Error loading saved designs:", error);
    }
  };
  
  // Generate a design thumbnail from the JSON data
  const generateThumbnail = (jsonData: string): string | undefined => {
    try {
      if (!jsonData || !thumbnailCanvasRef.current) return undefined;
      
      // Create a temporary fabric canvas for thumbnail generation
      const canvas = new window.fabric.Canvas(thumbnailCanvasRef.current);
      canvas.setWidth(200);
      canvas.setHeight(150);
      
      // Load the design
      canvas.loadFromJSON(jsonData, () => {
        canvas.renderAll();
      });
      
      // Get data URL
      const thumbnail = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.7
      });
      
      // Dispose of the temporary canvas
      canvas.dispose();
      
      return thumbnail;
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      return undefined;
    }
  };

  // Create a new design
  const createNewDesign = () => {
    if (!newDesignName.trim()) {
      toast({
        title: "Design name required",
        description: "Please enter a name for your new design.",
        variant: "destructive",
      });
      return;
    }
    
    const newDesign: DesignType = {
      id: `design_${Date.now()}`,
      name: newDesignName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      json: "",
      category: newDesignCategory
    };
    
    setSelectedDesign(newDesign);
    setNewDesignName("");
    setIsCreateDialogOpen(false);
    setShowEditor(true);
    
    // Add the new design to savedDesigns
    const updatedDesigns = [...savedDesigns, newDesign];
    setSavedDesigns(updatedDesigns);
    localStorage.setItem("canvaDesigns", JSON.stringify(updatedDesigns));
  };
  
  // Open an existing design
  const openDesign = (design: DesignType) => {
    setSelectedDesign(design);
    setShowEditor(true);
  };
  
  // Delete a design
  const deleteDesign = (designId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const updatedDesigns = savedDesigns.filter(d => d.id !== designId);
      localStorage.setItem("canvaDesigns", JSON.stringify(updatedDesigns));
      setSavedDesigns(updatedDesigns);
      
      toast({
        title: "Design deleted",
        description: "The design has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting design:", error);
      toast({
        title: "Error deleting design",
        description: "An error occurred while deleting the design.",
        variant: "destructive",
      });
    }
  };
  
  // Save design when editor saves
  const handleDesignSave = (designData: string) => {
    try {
      if (!selectedDesign) {
        throw new Error("No design selected");
      }
      
      // Generate thumbnail if possible
      const thumbnail = generateThumbnail(designData);
      
      const updatedDesign: DesignType = {
        id: selectedDesign.id,
        name: selectedDesign.name,
        createdAt: selectedDesign.createdAt,
        updatedAt: new Date().toISOString(),
        json: designData,
        category: selectedDesign.category,
        thumbnail: thumbnail || selectedDesign.thumbnail
      };
      
      // Update in the savedDesigns array
      const designIndex = savedDesigns.findIndex(d => d.id === selectedDesign.id);
      const updatedDesigns = [...savedDesigns];
      
      if (designIndex >= 0) {
        updatedDesigns[designIndex] = updatedDesign;
      } else {
        updatedDesigns.push(updatedDesign);
      }
      
      // Save to localStorage
      localStorage.setItem("canvaDesigns", JSON.stringify(updatedDesigns));
      setSavedDesigns(updatedDesigns);
      setSelectedDesign(updatedDesign);
      
      toast({
        title: "Design saved",
        description: "Your design has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving design:", error);
      toast({
        title: "Error saving design",
        description: "An error occurred while saving your design.",
        variant: "destructive",
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Close the editor and go back to the design list
  const handleBackToList = () => {
    setShowEditor(false);
    setSelectedDesign(null);
    loadSavedDesigns();
  };
  
  // Filter designs based on category and search
  const filteredDesigns = savedDesigns
    .filter(design => templateTab === 'all' || design.category === templateTab)
    .filter(design => !searchQuery || design.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
  // List of template categories
  const categories = [
    { id: 'all', name: 'All Designs' },
    { id: 'resume', name: 'Resume' },
    { id: 'cover', name: 'Cover Letter' },
    { id: 'business', name: 'Business Card' },
    { id: 'social', name: 'Social Media' },
    { id: 'personal', name: 'Personal' },
    { id: 'other', name: 'Other' }
  ];
  
  // This creates a hidden canvas for thumbnails
  const hiddenCanvasElement = (
    <canvas 
      ref={thumbnailCanvasRef} 
      style={{ display: 'none' }} 
      width={200} 
      height={150}
    />
  );
  
  return (
    <div className="container mx-auto p-4 min-h-screen max-w-7xl">
      {hiddenCanvasElement}
      
      {!showEditor ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-primary">Design Studio</h1>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search designs..."
                className="w-full sm:w-64"
              />
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Design</DialogTitle>
                    <DialogDescription>
                      Give your design a name and select a category to get started.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="designName">Design Name</Label>
                      <Input
                        id="designName"
                        value={newDesignName}
                        onChange={(e) => setNewDesignName(e.target.value)}
                        placeholder="My awesome design"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={newDesignCategory} 
                        onValueChange={setNewDesignCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(cat => cat.id !== 'all').map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createNewDesign}>
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Tabs value={templateTab} onValueChange={setTemplateTab} className="mb-8">
            <TabsList className="mb-4">
              {categories.map(category => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map(category => (
              <TabsContent key={category.id} value={category.id}>
                {filteredDesigns.length === 0 ? (
                  <Card>
                    <CardHeader className="text-center">
                      <CardTitle>No designs found</CardTitle>
                      <CardDescription>
                        {category.id === 'all' 
                          ? searchQuery 
                            ? "No designs match your search query" 
                            : "Create your first design by clicking 'Create New'"
                          : `Create your first ${category.name} design`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => setIsCreateDialogOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Create New Design
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDesigns.map(design => (
                      <Card 
                        key={design.id} 
                        className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                        onClick={() => openDesign(design)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex justify-between items-center">
                            <div className="truncate">{design.name}</div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                              onClick={(e) => deleteDesign(design.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardTitle>
                          <CardDescription className="text-xs flex justify-between">
                            <span>Last updated: {formatDate(design.updatedAt)}</span>
                            {design.category && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                {categories.find(c => c.id === design.category)?.name || design.category}
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="relative">
                            {design.thumbnail ? (
                              <img 
                                src={design.thumbnail} 
                                alt={design.name} 
                                className="w-full h-40 object-cover"
                              />
                            ) : (
                              <div className="bg-gray-100 h-40 flex items-center justify-center">
                                <Palette className="h-10 w-10 text-gray-300" />
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="secondary" size="sm" className="gap-1">
                                <span>Edit Design</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      ) : (
        <div className="h-[calc(100vh-2rem)]">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleBackToList}
                className="mb-2"
              >
                &larr; Back to designs
              </Button>
              <h2 className="text-xl font-semibold">{selectedDesign?.name}</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <FileDown className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
            </div>
          </div>
          
          <div className="h-[calc(100vh-8rem)] border rounded-lg overflow-hidden">
            <DesignEditor 
              initialDesign={selectedDesign?.json} 
              onSave={handleDesignSave} 
            />
          </div>
        </div>
      )}
    </div>
  );
}