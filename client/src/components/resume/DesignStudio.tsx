import React from 'react';
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
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DesignStudio() {
  return (
    <div className="h-screen flex flex-col bg-neutral-100">
      {/* Top Toolbar */}
      <div className="bg-white border-b p-2 flex items-center justify-between">
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" className="flex items-center">
            <Type className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Add Text</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center">
            <Square className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Add Shape</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center">
            <ImageIcon className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Upload Image</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center">
            <Layout className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Templates</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center">
            <Wand2 className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">AI Assist</span>
          </Button>
        </div>
        <div className="flex space-x-1">
          <Button variant="outline" size="sm" className="flex items-center">
            <Save className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">Save</span>
          </Button>
          <Button variant="default" size="sm" className="flex items-center">
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
                      <div className="bg-neutral-50 border rounded p-2 text-center cursor-pointer hover:bg-neutral-100 transition-colors">
                        <p className="text-sm">Heading</p>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 text-center cursor-pointer hover:bg-neutral-100 transition-colors">
                        <p className="text-sm">Paragraph</p>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 text-center cursor-pointer hover:bg-neutral-100 transition-colors">
                        <p className="text-sm">Bullet List</p>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 text-center cursor-pointer hover:bg-neutral-100 transition-colors">
                        <p className="text-sm">Number List</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Shapes</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-neutral-50 border rounded p-2 flex justify-center items-center cursor-pointer hover:bg-neutral-100 transition-colors">
                        <div className="w-6 h-6 rounded-full border border-neutral-300"></div>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 flex justify-center items-center cursor-pointer hover:bg-neutral-100 transition-colors">
                        <div className="w-6 h-6 border border-neutral-300"></div>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 flex justify-center items-center cursor-pointer hover:bg-neutral-100 transition-colors">
                        <div className="w-6 h-6 border border-neutral-300 rotate-45"></div>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 flex justify-center items-center cursor-pointer hover:bg-neutral-100 transition-colors">
                        <div className="w-6 h-6 border border-neutral-300 rounded-lg"></div>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 flex justify-center items-center cursor-pointer hover:bg-neutral-100 transition-colors">
                        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[16px] border-b-neutral-300 border-r-[10px] border-r-transparent"></div>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 flex justify-center items-center cursor-pointer hover:bg-neutral-100 transition-colors">
                        <div className="w-6 h-3 border border-neutral-300 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Sections</h3>
                    <div className="space-y-2">
                      <div className="bg-neutral-50 border rounded p-2 cursor-pointer hover:bg-neutral-100 transition-colors">
                        <p className="text-sm">Header Section</p>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 cursor-pointer hover:bg-neutral-100 transition-colors">
                        <p className="text-sm">Work Experience</p>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 cursor-pointer hover:bg-neutral-100 transition-colors">
                        <p className="text-sm">Education</p>
                      </div>
                      <div className="bg-neutral-50 border rounded p-2 cursor-pointer hover:bg-neutral-100 transition-colors">
                        <p className="text-sm">Skills</p>
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
              <div className="w-full h-full p-8">
                {/* Resume content will go here */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold">Your Name</h1>
                  <p className="text-sm text-neutral-500">Professional Title</p>
                  <div className="flex justify-center gap-2 mt-2 text-xs text-neutral-500">
                    <span>email@example.com</span>
                    <span>•</span>
                    <span>+1 234 567 890</span>
                    <span>•</span>
                    <span>Location</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h2 className="text-sm font-bold uppercase text-primary border-b pb-1 mb-2">Summary</h2>
                  <p className="text-sm">Experienced professional with a track record of success in [industry]. Skilled in [key skills] with a focus on delivering results.</p>
                </div>
                
                <div className="mb-4">
                  <h2 className="text-sm font-bold uppercase text-primary border-b pb-1 mb-2">Experience</h2>
                  <div className="mb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold">Job Title</h3>
                      <span className="text-xs text-neutral-500">Jan 2020 - Present</span>
                    </div>
                    <p className="text-xs font-medium text-neutral-600">Company Name, Location</p>
                    <ul className="text-xs list-disc list-inside mt-1">
                      <li>Accomplishment or responsibility description goes here</li>
                      <li>Another key accomplishment with measurable results</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h2 className="text-sm font-bold uppercase text-primary border-b pb-1 mb-2">Education</h2>
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold">Degree Name</h3>
                      <span className="text-xs text-neutral-500">Graduation Year</span>
                    </div>
                    <p className="text-xs">Institution Name, Location</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h2 className="text-sm font-bold uppercase text-primary border-b pb-1 mb-2">Skills</h2>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs bg-neutral-100 px-2 py-1 rounded">Skill 1</span>
                    <span className="text-xs bg-neutral-100 px-2 py-1 rounded">Skill 2</span>
                    <span className="text-xs bg-neutral-100 px-2 py-1 rounded">Skill 3</span>
                    <span className="text-xs bg-neutral-100 px-2 py-1 rounded">Skill 4</span>
                    <span className="text-xs bg-neutral-100 px-2 py-1 rounded">Skill 5</span>
                  </div>
                </div>
              </div>
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
                <p className="text-sm">No selection</p>
              </div>
              <Separator />
              <div>
                <label className="text-xs font-medium text-neutral-500 block mb-1">Font</label>
                <select className="w-full text-sm p-1 border rounded" disabled>
                  <option>Inter</option>
                  <option>Arial</option>
                  <option>Helvetica</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 block mb-1">Size</label>
                <select className="w-full text-sm p-1 border rounded" disabled>
                  <option>12px</option>
                  <option>14px</option>
                  <option>16px</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 block mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-neutral-300 rounded-full border"></div>
                  <input type="text" value="#333333" disabled className="text-sm border rounded px-2 py-1 w-full" />
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-xs font-medium text-neutral-500 block mb-1">Layer Order</label>
                <div className="bg-neutral-50 border rounded p-2">
                  <p className="text-xs text-neutral-400 text-center">No layers selected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-white border-t p-2 flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm">
            <Layers className="h-4 w-4 mr-1" />
            <span className="text-sm">Layer View</span>
          </Button>
        </div>
        <div>
          <Button variant="ghost" size="sm">
            <History className="h-4 w-4 mr-1" />
            <span className="text-sm">Version History</span>
          </Button>
        </div>
      </div>
    </div>
  );
}