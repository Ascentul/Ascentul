import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import DesignEditor from "@/components/design/DesignEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Palette, PlusCircle, Trash2, FileDown, Share2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export default function CanvaEditor() {
    const [savedDesigns, setSavedDesigns] = useState([]);
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [newDesignName, setNewDesignName] = useState("");
    const [newDesignCategory, setNewDesignCategory] = useState("personal");
    const [showEditor, setShowEditor] = useState(false);
    const [templateTab, setTemplateTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const thumbnailCanvasRef = useRef(null);
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
        }
        catch (error) {
            console.error("Error loading saved designs:", error);
        }
    };
    // Generate a design thumbnail from the JSON data
    const generateThumbnail = (jsonData) => {
        try {
            if (!jsonData || !thumbnailCanvasRef.current)
                return undefined;
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
        }
        catch (error) {
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
        const newDesign = {
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
    const openDesign = (design) => {
        setSelectedDesign(design);
        setShowEditor(true);
    };
    // Delete a design
    const deleteDesign = (designId, e) => {
        e.stopPropagation();
        try {
            const updatedDesigns = savedDesigns.filter(d => d.id !== designId);
            localStorage.setItem("canvaDesigns", JSON.stringify(updatedDesigns));
            setSavedDesigns(updatedDesigns);
            toast({
                title: "Design deleted",
                description: "The design has been successfully deleted.",
            });
        }
        catch (error) {
            console.error("Error deleting design:", error);
            toast({
                title: "Error deleting design",
                description: "An error occurred while deleting the design.",
                variant: "destructive",
            });
        }
    };
    // Save design when editor saves
    const handleDesignSave = (designData) => {
        try {
            if (!selectedDesign) {
                throw new Error("No design selected");
            }
            // Generate thumbnail if possible
            const thumbnail = generateThumbnail(designData);
            const updatedDesign = {
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
            }
            else {
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
        }
        catch (error) {
            console.error("Error saving design:", error);
            toast({
                title: "Error saving design",
                description: "An error occurred while saving your design.",
                variant: "destructive",
            });
        }
    };
    // Format date for display
    const formatDate = (dateString) => {
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
    const hiddenCanvasElement = (_jsx("canvas", { ref: thumbnailCanvasRef, style: { display: 'none' }, width: 200, height: 150 }));
    return (_jsxs("div", { className: "container mx-auto p-4 min-h-screen max-w-7xl", children: [hiddenCanvasElement, !showEditor ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4", children: [_jsx("h1", { className: "text-3xl font-bold text-primary", children: "Design Studio" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 w-full md:w-auto", children: [_jsx(Input, { value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search designs...", className: "w-full sm:w-64" }), _jsxs(Dialog, { open: isCreateDialogOpen, onOpenChange: setIsCreateDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { className: "flex items-center gap-2", children: [_jsx(PlusCircle, { className: "h-4 w-4" }), "Create New"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create New Design" }), _jsx(DialogDescription, { children: "Give your design a name and select a category to get started." })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "designName", children: "Design Name" }), _jsx(Input, { id: "designName", value: newDesignName, onChange: (e) => setNewDesignName(e.target.value), placeholder: "My awesome design" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "category", children: "Category" }), _jsxs(Select, { value: newDesignCategory, onValueChange: setNewDesignCategory, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a category" }) }), _jsx(SelectContent, { children: categories.filter(cat => cat.id !== 'all').map(category => (_jsx(SelectItem, { value: category.id, children: category.name }, category.id))) })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setIsCreateDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: createNewDesign, children: "Create" })] })] })] })] })] }), _jsxs(Tabs, { value: templateTab, onValueChange: setTemplateTab, className: "mb-8", children: [_jsx(TabsList, { className: "mb-4", children: categories.map(category => (_jsx(TabsTrigger, { value: category.id, children: category.name }, category.id))) }), categories.map(category => (_jsx(TabsContent, { value: category.id, children: filteredDesigns.length === 0 ? (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { children: "No designs found" }), _jsx(CardDescription, { children: category.id === 'all'
                                                        ? searchQuery
                                                            ? "No designs match your search query"
                                                            : "Create your first design by clicking 'Create New'"
                                                        : `Create your first ${category.name} design` })] }), _jsx(CardContent, { className: "flex justify-center", children: _jsxs(Button, { variant: "outline", className: "gap-2", onClick: () => setIsCreateDialogOpen(true), children: [_jsx(PlusCircle, { className: "h-4 w-4" }), "Create New Design"] }) })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredDesigns.map(design => (_jsxs(Card, { className: "group cursor-pointer hover:shadow-md transition-shadow overflow-hidden", onClick: () => openDesign(design), children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsxs(CardTitle, { className: "flex justify-between items-center", children: [_jsx("div", { className: "truncate", children: design.name }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 text-destructive hover:text-destructive/90", onClick: (e) => deleteDesign(design.id, e), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }), _jsxs(CardDescription, { className: "text-xs flex justify-between", children: [_jsxs("span", { children: ["Last updated: ", formatDate(design.updatedAt)] }), design.category && (_jsx("span", { className: "px-2 py-0.5 bg-primary/10 text-primary rounded-full", children: categories.find(c => c.id === design.category)?.name || design.category }))] })] }), _jsx(CardContent, { className: "p-0", children: _jsxs("div", { className: "relative", children: [design.thumbnail ? (_jsx("img", { src: design.thumbnail, alt: design.name, className: "w-full h-40 object-cover" })) : (_jsx("div", { className: "bg-gray-100 h-40 flex items-center justify-center", children: _jsx(Palette, { className: "h-10 w-10 text-gray-300" }) })), _jsx("div", { className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx(Button, { variant: "secondary", size: "sm", className: "gap-1", children: _jsx("span", { children: "Edit Design" }) }) })] }) })] }, design.id))) })) }, category.id)))] })] })) : (_jsxs("div", { className: "h-[calc(100vh-2rem)]", children: [_jsxs("div", { className: "mb-4 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", onClick: handleBackToList, className: "mb-2", children: "\u2190 Back to designs" }), _jsx("h2", { className: "text-xl font-semibold", children: selectedDesign?.name })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "gap-1", children: [_jsx(FileDown, { className: "h-4 w-4" }), "Export"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-1", children: [_jsx(Share2, { className: "h-4 w-4" }), "Share"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-1", children: [_jsx(Copy, { className: "h-4 w-4" }), "Duplicate"] })] })] }), _jsx("div", { className: "h-[calc(100vh-8rem)] border rounded-lg overflow-hidden", children: _jsx(DesignEditor, { initialDesign: selectedDesign?.json, onSave: handleDesignSave }) })] }))] }));
}
