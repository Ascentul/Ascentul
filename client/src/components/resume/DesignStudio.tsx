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
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Grid,
  ListChecks
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
          fabricCanvasRef.current.forEachObject((obj: any) => {
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

  // Smart Resume Blocks - Creation Functions
  const addWorkExperienceBlock = () => {
    if (!fabricCanvasRef.current) return;
    
    // Create the header
    const header = new window.fabric.IText('WORK EXPERIENCE', {
      left: 50,
      top: 50,
      fontSize: 20,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#333333',
    });
    
    // Create job title
    const jobTitle = new window.fabric.IText('Job Title', {
      left: 50,
      top: 80,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
    });
    
    // Create company and date
    const companyDate = new window.fabric.IText('Company Name | Jan 2022 - Present', {
      left: 50,
      top: 105,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#555555',
    });
    
    // Create bullet points
    const bullet1 = new window.fabric.IText('• Accomplishment or responsibility description', {
      left: 50,
      top: 130,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    
    const bullet2 = new window.fabric.IText('• Another key achievement with measurable results', {
      left: 50,
      top: 155,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    
    const bullet3 = new window.fabric.IText('• Additional responsibility or project', {
      left: 50,
      top: 180,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    
    // Group all elements together
    const workExperienceBlock = new window.fabric.Group(
      [header, jobTitle, companyDate, bullet1, bullet2, bullet3],
      {
        left: 50,
        top: 50,
        selectable: true,
        hasControls: true,
        subTargetCheck: true,
      }
    );
    
    // Allow individual editing of texts within the group
    workExperienceBlock.subTargetCheck = true;
    
    fabricCanvasRef.current.add(workExperienceBlock);
    fabricCanvasRef.current.setActiveObject(workExperienceBlock);
    fabricCanvasRef.current.renderAll();
    
    toast({
      title: "Work Experience Block Added",
      description: "Click on text elements to edit them",
    });
  };
  
  const addEducationBlock = () => {
    if (!fabricCanvasRef.current) return;
    
    // Create the header
    const header = new window.fabric.IText('EDUCATION', {
      left: 50,
      top: 50,
      fontSize: 20,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#333333',
    });
    
    // Create degree
    const degree = new window.fabric.IText('Degree Name', {
      left: 50,
      top: 80,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
    });
    
    // Create institution and date
    const institutionDate = new window.fabric.IText('University Name | Graduation Year', {
      left: 50,
      top: 105,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#555555',
    });
    
    // Create details
    const detail1 = new window.fabric.IText('• GPA: 3.8/4.0', {
      left: 50,
      top: 130,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    
    const detail2 = new window.fabric.IText('• Relevant Coursework: Course 1, Course 2', {
      left: 50,
      top: 155,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    
    // Group all elements together
    const educationBlock = new window.fabric.Group(
      [header, degree, institutionDate, detail1, detail2],
      {
        left: 50,
        top: 50,
        selectable: true,
        hasControls: true,
        subTargetCheck: true,
      }
    );
    
    fabricCanvasRef.current.add(educationBlock);
    fabricCanvasRef.current.setActiveObject(educationBlock);
    fabricCanvasRef.current.renderAll();
    
    toast({
      title: "Education Block Added",
      description: "Click on text elements to edit them",
    });
  };
  
  const addSkillsBlock = () => {
    if (!fabricCanvasRef.current) return;
    
    // Create the header
    const header = new window.fabric.IText('SKILLS', {
      left: 50,
      top: 50,
      fontSize: 20,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#333333',
    });
    
    // Create skill categories
    const category1 = new window.fabric.IText('Technical Skills:', {
      left: 50,
      top: 80,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
    });
    
    const skills1 = new window.fabric.IText('HTML, CSS, JavaScript, React, Node.js, Git', {
      left: 50,
      top: 105,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    
    const category2 = new window.fabric.IText('Soft Skills:', {
      left: 50,
      top: 130,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
    });
    
    const skills2 = new window.fabric.IText('Communication, Teamwork, Problem Solving, Time Management', {
      left: 50,
      top: 155,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    
    // Group all elements together
    const skillsBlock = new window.fabric.Group(
      [header, category1, skills1, category2, skills2],
      {
        left: 50,
        top: 50,
        selectable: true,
        hasControls: true,
        subTargetCheck: true,
      }
    );
    
    fabricCanvasRef.current.add(skillsBlock);
    fabricCanvasRef.current.setActiveObject(skillsBlock);
    fabricCanvasRef.current.renderAll();
    
    toast({
      title: "Skills Block Added",
      description: "Click on text elements to edit them",
    });
  };
  
  const addSummaryBlock = () => {
    if (!fabricCanvasRef.current) return;
    
    // Create the header
    const header = new window.fabric.IText('PROFESSIONAL SUMMARY', {
      left: 50,
      top: 50,
      fontSize: 20,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#333333',
    });
    
    // Create summary text
    const summaryText = new window.fabric.Textbox(
      'Experienced professional with X years in [industry/field]. Skilled in [key skills] with a proven track record of [notable achievement]. Seeking to leverage my expertise in [relevant area] to [career goal or target role].',
      {
        left: 50,
        top: 80,
        width: 500,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#333333',
        lineHeight: 1.5,
      }
    );
    
    // Group elements together
    const summaryBlock = new window.fabric.Group(
      [header, summaryText],
      {
        left: 50,
        top: 50,
        selectable: true,
        hasControls: true,
        subTargetCheck: true,
      }
    );
    
    fabricCanvasRef.current.add(summaryBlock);
    fabricCanvasRef.current.setActiveObject(summaryBlock);
    fabricCanvasRef.current.renderAll();
    
    toast({
      title: "Professional Summary Block Added",
      description: "Click on text elements to edit them",
    });
  };
  
  const addContactInfoBlock = () => {
    if (!fabricCanvasRef.current) return;
    
    // Create name
    const name = new window.fabric.IText('YOUR NAME', {
      left: 50,
      top: 50,
      fontSize: 28,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
      textAlign: 'center',
    });
    
    // Create contact details
    const email = new window.fabric.IText('email@example.com', {
      left: 50,
      top: 90,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    
    const phone = new window.fabric.IText('(123) 456-7890', {
      left: 250,
      top: 90,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    
    const location = new window.fabric.IText('City, State', {
      left: 420,
      top: 90,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    
    // Group elements together
    const contactBlock = new window.fabric.Group(
      [name, email, phone, location],
      {
        left: 50,
        top: 50,
        selectable: true,
        hasControls: true,
        subTargetCheck: true,
      }
    );
    
    fabricCanvasRef.current.add(contactBlock);
    fabricCanvasRef.current.setActiveObject(contactBlock);
    fabricCanvasRef.current.renderAll();
    
    toast({
      title: "Contact Information Block Added",
      description: "Click on text elements to edit them",
    });
  };
  
  // Template functions
  const loadModernTemplate = () => {
    if (!fabricCanvasRef.current) return;
    
    // Clear canvas first
    fabricCanvasRef.current.clear();
    
    // Add contact section at top
    addContactInfoBlock();
    
    // Reposition the contact block to the top and make it span the width
    const contactBlock = fabricCanvasRef.current.getObjects()[0];
    contactBlock.set({
      left: 30,
      top: 30,
      scaleX: 0.9,
      scaleY: 0.9
    });
    
    // Add a divider line
    const divider = new window.fabric.Rect({
      left: 30,
      top: 130,
      width: 535,
      height: 2,
      fill: '#0C29AB',
      rx: 1,
      ry: 1,
    });
    fabricCanvasRef.current.add(divider);
    
    // Add summary below the divider
    addSummaryBlock();
    const summaryBlock = fabricCanvasRef.current.getObjects()[2];
    summaryBlock.set({
      left: 30,
      top: 150,
      scaleX: 0.9,
      scaleY: 0.9
    });
    
    // Add experience section
    addWorkExperienceBlock();
    const experienceBlock = fabricCanvasRef.current.getObjects()[3];
    experienceBlock.set({
      left: 30,
      top: 250,
      scaleX: 0.9,
      scaleY: 0.9
    });
    
    // Add education section
    addEducationBlock();
    const educationBlock = fabricCanvasRef.current.getObjects()[4];
    educationBlock.set({
      left: 30,
      top: 450,
      scaleX: 0.9,
      scaleY: 0.9
    });
    
    // Add skills section
    addSkillsBlock();
    const skillsBlock = fabricCanvasRef.current.getObjects()[5];
    skillsBlock.set({
      left: 30,
      top: 600,
      scaleX: 0.9,
      scaleY: 0.9
    });
    
    fabricCanvasRef.current.renderAll();
    
    toast({
      title: "Modern Template Loaded",
      description: "Customize each section to fit your needs",
    });
  };
  
  const loadMinimalistTemplate = () => {
    if (!fabricCanvasRef.current) return;
    
    // Clear canvas first
    fabricCanvasRef.current.clear();
    
    // Add large name at top
    const name = new window.fabric.IText('YOUR NAME', {
      left: 297,
      top: 50,
      fontSize: 36,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
      originX: 'center',
      originY: 'top',
      textAlign: 'center',
    });
    fabricCanvasRef.current.add(name);
    
    // Add contact details in a single line
    const contactInfo = new window.fabric.IText('email@example.com | (123) 456-7890 | City, State', {
      left: 297,
      top: 100,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#555555',
      originX: 'center',
      originY: 'top',
      textAlign: 'center',
    });
    fabricCanvasRef.current.add(contactInfo);
    
    // Add a thin divider line
    const divider = new window.fabric.Rect({
      left: 148,
      top: 130,
      width: 300,
      height: 1,
      fill: '#cccccc',
    });
    fabricCanvasRef.current.add(divider);
    
    // Add sections with cleaner spacing
    
    // Summary section
    const summaryHeader = new window.fabric.IText('SUMMARY', {
      left: 50,
      top: 160,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
    });
    fabricCanvasRef.current.add(summaryHeader);
    
    const summaryText = new window.fabric.Textbox(
      'Concise overview of your skills and experience. Focus on what makes you unique.',
      {
        left: 50,
        top: 185,
        width: 495,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#333333',
        lineHeight: 1.3,
      }
    );
    fabricCanvasRef.current.add(summaryText);
    
    // Experience section
    const expHeader = new window.fabric.IText('EXPERIENCE', {
      left: 50,
      top: 230,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
    });
    fabricCanvasRef.current.add(expHeader);
    
    // Job 1
    const job1Title = new window.fabric.IText('Job Title', {
      left: 50,
      top: 255,
      fontSize: 14,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
    });
    fabricCanvasRef.current.add(job1Title);
    
    const job1Details = new window.fabric.IText('Company | Jan 2022 - Present', {
      left: 50,
      top: 275,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#555555',
    });
    fabricCanvasRef.current.add(job1Details);
    
    const job1Bullet1 = new window.fabric.IText('• Key responsibility or achievement with measurable results', {
      left: 50,
      top: 295,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    fabricCanvasRef.current.add(job1Bullet1);
    
    const job1Bullet2 = new window.fabric.IText('• Another important contribution or accomplishment', {
      left: 50,
      top: 315,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    fabricCanvasRef.current.add(job1Bullet2);
    
    // Education section
    const eduHeader = new window.fabric.IText('EDUCATION', {
      left: 50,
      top: 365,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
    });
    fabricCanvasRef.current.add(eduHeader);
    
    const degree = new window.fabric.IText('Degree Name', {
      left: 50,
      top: 390,
      fontSize: 14,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
    });
    fabricCanvasRef.current.add(degree);
    
    const eduDetails = new window.fabric.IText('University Name | Graduation Year', {
      left: 50,
      top: 410,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#555555',
    });
    fabricCanvasRef.current.add(eduDetails);
    
    // Skills section
    const skillsHeader = new window.fabric.IText('SKILLS', {
      left: 50,
      top: 450,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#000000',
    });
    fabricCanvasRef.current.add(skillsHeader);
    
    const skillsList = new window.fabric.IText('Skill 1 • Skill 2 • Skill 3 • Skill 4 • Skill 5 • Skill 6', {
      left: 50,
      top: 475,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    fabricCanvasRef.current.add(skillsList);
    
    fabricCanvasRef.current.renderAll();
    
    toast({
      title: "Minimalist Template Loaded",
      description: "Clean and simple layout ready for customization",
    });
  };
  
  const loadCreativeTemplate = () => {
    if (!fabricCanvasRef.current) return;
    
    // Clear canvas first
    fabricCanvasRef.current.clear();
    
    // Create sidebar
    const sidebar = new window.fabric.Rect({
      left: 0,
      top: 0,
      width: 200,
      height: 842,
      fill: '#0C29AB',
    });
    fabricCanvasRef.current.add(sidebar);
    
    // Add name in sidebar
    const name = new window.fabric.IText('YOUR\nNAME', {
      left: 100,
      top: 60,
      fontSize: 28,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#FFFFFF',
      textAlign: 'center',
      originX: 'center',
      originY: 'top',
    });
    fabricCanvasRef.current.add(name);
    
    // Add contact info in sidebar
    const contactTitle = new window.fabric.IText('CONTACT', {
      left: 100,
      top: 150,
      fontSize: 18,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#FFFFFF',
      textAlign: 'center',
      originX: 'center',
    });
    fabricCanvasRef.current.add(contactTitle);
    
    const email = new window.fabric.IText('email@example.com', {
      left: 100,
      top: 180,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#FFFFFF',
      textAlign: 'center',
      originX: 'center',
    });
    fabricCanvasRef.current.add(email);
    
    const phone = new window.fabric.IText('(123) 456-7890', {
      left: 100,
      top: 200,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#FFFFFF',
      textAlign: 'center',
      originX: 'center',
    });
    fabricCanvasRef.current.add(phone);
    
    // Add skills in sidebar
    const skillsTitle = new window.fabric.IText('SKILLS', {
      left: 100,
      top: 250,
      fontSize: 18,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#FFFFFF',
      textAlign: 'center',
      originX: 'center',
    });
    fabricCanvasRef.current.add(skillsTitle);
    
    const skills = new window.fabric.Textbox('Skill 1\nSkill 2\nSkill 3\nSkill 4\nSkill 5', {
      left: 100,
      top: 280,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#FFFFFF',
      textAlign: 'center',
      originX: 'center',
      lineHeight: 1.5,
    });
    fabricCanvasRef.current.add(skills);
    
    // Main content area
    
    // Add professional title
    const title = new window.fabric.IText('JOB TITLE / PROFESSION', {
      left: 220,
      top: 50,
      fontSize: 20,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    fabricCanvasRef.current.add(title);
    
    // Add summary
    const profileTitle = new window.fabric.IText('PROFILE', {
      left: 220,
      top: 100,
      fontSize: 18,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#0C29AB',
    });
    fabricCanvasRef.current.add(profileTitle);
    
    const profileText = new window.fabric.Textbox(
      'Creative and passionate professional with a flair for innovation. Bringing fresh perspectives and solutions to [field/industry].',
      {
        left: 220,
        top: 130,
        width: 350,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#333333',
        lineHeight: 1.3,
      }
    );
    fabricCanvasRef.current.add(profileText);
    
    // Add work experience
    const expTitle = new window.fabric.IText('EXPERIENCE', {
      left: 220,
      top: 200,
      fontSize: 18,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#0C29AB',
    });
    fabricCanvasRef.current.add(expTitle);
    
    // Job 1
    const jobTitle = new window.fabric.IText('Job Title', {
      left: 220,
      top: 230,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#333333',
    });
    fabricCanvasRef.current.add(jobTitle);
    
    const companyDate = new window.fabric.IText('Company Name | Jan 2022 - Present', {
      left: 220,
      top: 250,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#555555',
    });
    fabricCanvasRef.current.add(companyDate);
    
    const jobDesc = new window.fabric.Textbox(
      '• Achieved significant results in [specific area]\n• Led projects that resulted in [measurable outcome]\n• Collaborated with teams to deliver [accomplishment]',
      {
        left: 220,
        top: 270,
        width: 350,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#333333',
        lineHeight: 1.3,
      }
    );
    fabricCanvasRef.current.add(jobDesc);
    
    // Add education
    const eduTitle = new window.fabric.IText('EDUCATION', {
      left: 220,
      top: 380,
      fontSize: 18,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#0C29AB',
    });
    fabricCanvasRef.current.add(eduTitle);
    
    const degreeName = new window.fabric.IText('Degree Name', {
      left: 220,
      top: 410,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#333333',
    });
    fabricCanvasRef.current.add(degreeName);
    
    const uniYear = new window.fabric.IText('University Name | Graduation Year', {
      left: 220,
      top: 430,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#555555',
    });
    fabricCanvasRef.current.add(uniYear);
    
    fabricCanvasRef.current.renderAll();
    
    toast({
      title: "Creative Template Loaded",
      description: "Distinctive design with sidebar layout",
    });
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-100">
      {/* Top Toolbar - Main Controls */}
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
          
          {selectedObject && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={deleteSelectedObject}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="text-xs sm:text-sm">Delete</span>
            </Button>
          )}
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
      
      {/* Properties Toolbar - Only shows when an object is selected */}
      {selectedObject && (
        <div className="bg-white border-b py-1 px-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-neutral-500">Element: </p>
            <p className="text-xs font-semibold">{selectedObject.type}</p>
          </div>
          
          {/* Text Properties */}
          {selectedObject && (selectedObject.type === 'textbox' || selectedObject.type === 'i-text') && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-1">
                <select 
                  className="text-xs p-1 border rounded h-8 bg-white" 
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
                
                <input 
                  type="number" 
                  className="text-xs p-1 border rounded w-14 h-8"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  min="8"
                  max="72"
                  placeholder="Size"
                />
                
                <div className="flex items-center h-8 border rounded overflow-hidden">
                  <input 
                    type="color" 
                    value={textColor} 
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-full w-8 p-0 border-0"
                  />
                </div>
                
                <div className="flex border rounded overflow-hidden h-8">
                  <Button 
                    size="sm" 
                    variant={isBold ? "default" : "ghost"} 
                    className="h-full px-2 rounded-none"
                    onClick={toggleBold}
                  >
                    <Bold className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant={isItalic ? "default" : "ghost"} 
                    className="h-full px-2 rounded-none border-l border-r"
                    onClick={toggleItalic}
                  >
                    <Italic className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant={isUnderline ? "default" : "ghost"} 
                    className="h-full px-2 rounded-none"
                    onClick={toggleUnderline}
                  >
                    <Underline className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex border rounded overflow-hidden h-8">
                  <Button 
                    size="sm" 
                    variant={textAlign === 'left' ? "default" : "ghost"} 
                    className="h-full px-2 rounded-none"
                    onClick={() => setAlignment('left')}
                  >
                    <AlignLeft className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant={textAlign === 'center' ? "default" : "ghost"} 
                    className="h-full px-2 rounded-none border-l border-r"
                    onClick={() => setAlignment('center')}
                  >
                    <AlignCenter className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant={textAlign === 'right' ? "default" : "ghost"} 
                    className="h-full px-2 rounded-none"
                    onClick={() => setAlignment('right')}
                  >
                    <AlignRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {/* Shape Properties */}
          {selectedObject && selectedObject.type !== 'textbox' && selectedObject.type !== 'i-text' && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-500">Fill:</span>
                <div className="flex items-center h-8 border rounded overflow-hidden">
                  <input 
                    type="color" 
                    value={backgroundColor} 
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-full w-8 p-0 border-0"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-60 border-r bg-white hidden md:block">
          <Tabs defaultValue="elements">
            <TabsList className="w-full">
              <TabsTrigger value="elements" className="flex-1">Elements</TabsTrigger>
              <TabsTrigger value="smart-blocks" className="flex-1">Smart Blocks</TabsTrigger>
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
            <TabsContent value="smart-blocks" className="p-2">
              <ScrollArea className="h-[calc(100vh-10rem)]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Resume Sections</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div 
                        className="bg-neutral-50 border rounded p-3 cursor-pointer hover:bg-neutral-100 transition-colors flex items-center"
                        onClick={addContactInfoBlock}
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Contact Information</p>
                          <p className="text-xs text-gray-500">Name, email, phone, location</p>
                        </div>
                      </div>
                      
                      <div 
                        className="bg-neutral-50 border rounded p-3 cursor-pointer hover:bg-neutral-100 transition-colors flex items-center"
                        onClick={addSummaryBlock}
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Professional Summary</p>
                          <p className="text-xs text-gray-500">Career overview and key qualifications</p>
                        </div>
                      </div>
                      
                      <div 
                        className="bg-neutral-50 border rounded p-3 cursor-pointer hover:bg-neutral-100 transition-colors flex items-center"
                        onClick={addWorkExperienceBlock}
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <Briefcase className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Work Experience</p>
                          <p className="text-xs text-gray-500">Job positions with accomplishments</p>
                        </div>
                      </div>
                      
                      <div 
                        className="bg-neutral-50 border rounded p-3 cursor-pointer hover:bg-neutral-100 transition-colors flex items-center"
                        onClick={addEducationBlock}
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Education</p>
                          <p className="text-xs text-gray-500">Degrees, certificates, and coursework</p>
                        </div>
                      </div>
                      
                      <div 
                        className="bg-neutral-50 border rounded p-3 cursor-pointer hover:bg-neutral-100 transition-colors flex items-center"
                        onClick={addSkillsBlock}
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <ListChecks className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Skills</p>
                          <p className="text-xs text-gray-500">Technical and soft skills</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Complete Resume Templates</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div 
                        className="border rounded cursor-pointer hover:border-primary transition-colors overflow-hidden"
                        onClick={loadModernTemplate}
                      >
                        <div className="h-40 bg-gradient-to-br from-white to-neutral-100 flex justify-center items-center p-2">
                          <div className="w-full h-full border bg-white rounded shadow-sm p-2">
                            <div className="w-full h-2 bg-primary/20 mb-2 rounded"></div>
                            <div className="w-3/4 h-2 bg-neutral-200 mb-4 rounded"></div>
                            <div className="w-1/4 h-2 bg-neutral-200 mb-1 rounded"></div>
                            <div className="w-full h-1 bg-neutral-100 mb-3 rounded"></div>
                            <div className="w-1/3 h-2 bg-neutral-200 mb-1 rounded"></div>
                            <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                            <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                          </div>
                        </div>
                        <div className="p-2 bg-white border-t">
                          <p className="text-sm font-medium">Modern Template</p>
                          <p className="text-xs text-gray-500">Clean, professional layout</p>
                        </div>
                      </div>
                      
                      <div 
                        className="border rounded cursor-pointer hover:border-primary transition-colors overflow-hidden"
                        onClick={loadMinimalistTemplate}
                      >
                        <div className="h-40 bg-gradient-to-br from-white to-neutral-100 flex justify-center items-center p-2">
                          <div className="w-full h-full border bg-white rounded shadow-sm p-2">
                            <div className="w-1/2 h-2 bg-neutral-300 mx-auto mb-3 rounded"></div>
                            <div className="w-3/4 h-1 bg-neutral-200 mx-auto mb-4 rounded"></div>
                            <div className="w-1/4 h-2 bg-neutral-300 mb-1 rounded"></div>
                            <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                            <div className="w-full h-1 bg-neutral-100 mb-3 rounded"></div>
                            <div className="w-1/4 h-2 bg-neutral-300 mb-1 rounded"></div>
                            <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                          </div>
                        </div>
                        <div className="p-2 bg-white border-t">
                          <p className="text-sm font-medium">Minimalist Template</p>
                          <p className="text-xs text-gray-500">Simple, elegant design</p>
                        </div>
                      </div>
                      
                      <div 
                        className="border rounded cursor-pointer hover:border-primary transition-colors overflow-hidden"
                        onClick={loadCreativeTemplate}
                      >
                        <div className="h-40 bg-gradient-to-br from-white to-neutral-100 flex justify-center items-center p-2">
                          <div className="w-full h-full border bg-white rounded shadow-sm p-2 flex">
                            <div className="w-1/4 h-full bg-primary/20"></div>
                            <div className="flex-1 p-1">
                              <div className="w-3/4 h-2 bg-neutral-200 mb-2 rounded"></div>
                              <div className="w-1/2 h-1 bg-neutral-100 mb-3 rounded"></div>
                              <div className="w-1/4 h-2 bg-neutral-200 mb-1 rounded"></div>
                              <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                              <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                            </div>
                          </div>
                        </div>
                        <div className="p-2 bg-white border-t">
                          <p className="text-sm font-medium">Creative Template</p>
                          <p className="text-xs text-gray-500">Distinctive sidebar design</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="templates" className="p-2">
              <ScrollArea className="h-[calc(100vh-10rem)]">
                <div className="grid grid-cols-1 gap-4">
                  <div 
                    className="border rounded cursor-pointer hover:border-primary transition-colors overflow-hidden"
                    onClick={loadModernTemplate}
                  >
                    <div className="h-40 bg-gradient-to-br from-white to-neutral-100 flex justify-center items-center p-2">
                      <div className="w-full h-full border bg-white rounded shadow-sm p-2">
                        <div className="w-full h-2 bg-primary/20 mb-2 rounded"></div>
                        <div className="w-3/4 h-2 bg-neutral-200 mb-4 rounded"></div>
                        <div className="w-1/4 h-2 bg-neutral-200 mb-1 rounded"></div>
                        <div className="w-full h-1 bg-neutral-100 mb-3 rounded"></div>
                        <div className="w-1/3 h-2 bg-neutral-200 mb-1 rounded"></div>
                        <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                        <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                      </div>
                    </div>
                    <div className="p-2 bg-white border-t">
                      <p className="text-sm font-medium">Modern Template</p>
                      <p className="text-xs text-gray-500">Clean, professional layout</p>
                    </div>
                  </div>
                  
                  <div 
                    className="border rounded cursor-pointer hover:border-primary transition-colors overflow-hidden"
                    onClick={loadMinimalistTemplate}
                  >
                    <div className="h-40 bg-gradient-to-br from-white to-neutral-100 flex justify-center items-center p-2">
                      <div className="w-full h-full border bg-white rounded shadow-sm p-2">
                        <div className="w-1/2 h-2 bg-neutral-300 mx-auto mb-3 rounded"></div>
                        <div className="w-3/4 h-1 bg-neutral-200 mx-auto mb-4 rounded"></div>
                        <div className="w-1/4 h-2 bg-neutral-300 mb-1 rounded"></div>
                        <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                        <div className="w-full h-1 bg-neutral-100 mb-3 rounded"></div>
                        <div className="w-1/4 h-2 bg-neutral-300 mb-1 rounded"></div>
                        <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                      </div>
                    </div>
                    <div className="p-2 bg-white border-t">
                      <p className="text-sm font-medium">Minimalist Template</p>
                      <p className="text-xs text-gray-500">Simple, elegant design</p>
                    </div>
                  </div>
                  
                  <div 
                    className="border rounded cursor-pointer hover:border-primary transition-colors overflow-hidden"
                    onClick={loadCreativeTemplate}
                  >
                    <div className="h-40 bg-gradient-to-br from-white to-neutral-100 flex justify-center items-center p-2">
                      <div className="w-full h-full border bg-white rounded shadow-sm p-2 flex">
                        <div className="w-1/4 h-full bg-primary/20"></div>
                        <div className="flex-1 p-1">
                          <div className="w-3/4 h-2 bg-neutral-200 mb-2 rounded"></div>
                          <div className="w-1/2 h-1 bg-neutral-100 mb-3 rounded"></div>
                          <div className="w-1/4 h-2 bg-neutral-200 mb-1 rounded"></div>
                          <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                          <div className="w-full h-1 bg-neutral-100 mb-1 rounded"></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 bg-white border-t">
                      <p className="text-sm font-medium">Creative Template</p>
                      <p className="text-xs text-gray-500">Distinctive sidebar design</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-3 bg-neutral-50 border rounded">
                  <h3 className="text-sm font-medium mb-2">Important Note</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Loading a template will clear your current design. Save your work before proceeding.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={saveDesign}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    <span className="text-xs">Save Current Design</span>
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center Canvas Area - Maximized workspace */}
        <div className="flex-1 overflow-auto bg-neutral-200">
          <div className="min-h-full flex items-start justify-center p-10">
            <div className="w-[595px] h-[842px] bg-white shadow-lg">
              {/* A4 Canvas (595px x 842px) */}
              <canvas ref={canvasRef} width="595" height="842" className="border border-neutral-300"></canvas>
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