"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  DollarSign,
  GraduationCap,
  Layers,
  Lightbulb,
  LineChart,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/queryClient"
import { cn } from "@/lib/utils"

// Types
interface CareerSkill { name: string; level: "basic" | "intermediate" | "advanced" }
interface CareerNode {
  id: string
  title: string
  level: "entry" | "mid" | "senior" | "lead" | "executive"
  salaryRange: string
  yearsExperience: string
  skills: CareerSkill[]
  description: string
  growthPotential: "low" | "medium" | "high"
  icon: JSX.Element
}
interface CareerPath { id: string; name: string; nodes: CareerNode[] }

// Helpers
const LevelBadgeColors: Record<string, string> = {
  entry: "bg-blue-100 text-blue-800",
  mid: "bg-green-100 text-green-800",
  senior: "bg-purple-100 text-purple-800",
  lead: "bg-yellow-100 text-yellow-800",
  executive: "bg-red-100 text-red-800",
}

const GrowthIndicators: Record<string, { icon: JSX.Element; text: string; color: string }> = {
  low: { icon: <Sparkles className="h-4 w-4" />, text: "Low Growth", color: "text-amber-500" },
  medium: { icon: <Sparkles className="h-4 w-4" />, text: "Medium Growth", color: "text-blue-500" },
  high: { icon: <Sparkles className="h-4 w-4" />, text: "High Growth", color: "text-green-500" },
}

const iconSize = "h-6 w-6 text-primary"
function getIconComponent(name?: string): JSX.Element {
  switch ((name || "").toLowerCase()) {
    case "braces":
      return <BriefcaseBusiness className={iconSize} />
    case "cpu":
      return <Cpu className={iconSize} />
    case "database":
      return <Database className={iconSize} />
    case "briefcase":
      return <BriefcaseBusiness className={iconSize} />
    case "user":
      return <User className={iconSize} />
    case "award":
      return <Award className={iconSize} />
    case "linechart":
      return <LineChart className={iconSize} />
    case "layers":
      return <Layers className={iconSize} />
    case "graduation":
      return <GraduationCap className={iconSize} />
    case "lightbulb":
      return <Lightbulb className={iconSize} />
    case "book":
      return <BookOpen className={iconSize} />
    default:
      return <BriefcaseBusiness className={iconSize} />
  }
}

// Certification UI pieces
type CertificationRecommendation = {
  name: string
  provider: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedTimeToComplete: string
  relevance: "highly relevant" | "relevant" | "somewhat relevant"
}

function CertificationCard({ cert, onAdd, loading }: { cert: CertificationRecommendation; onAdd: () => void; loading: boolean }) {
  return (
    <div className="border rounded-lg p-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{cert.name}</h4>
          <p className="text-sm text-muted-foreground">Provider: {cert.provider}</p>
        </div>
        <Badge className={
          cert.relevance === "highly relevant" ? "bg-green-100 text-green-800" :
          cert.relevance === "relevant" ? "bg-blue-100 text-blue-800" :
          "bg-amber-100 text-amber-800"
        }>
          {cert.relevance}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1">
          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{cert.difficulty} level</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{cert.estimatedTimeToComplete}</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t">
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={onAdd} disabled={loading}>
          {loading ? (<><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Adding as Goal...</>) : (<><Plus className="mr-1 h-3 w-3" />Add as Career Goal</>)}
        </Button>
      </div>
    </div>
  )
}

export default function CareerPathPage() {
  const { toast } = useToast()
  const [explorationMode, setExplorationMode] = useState<"target" | "profile">(() => {
    try {
      const saved = localStorage.getItem("careerExplorationMode")
      return (saved === "profile" || saved === "target") ? (saved as any) : "target"
    } catch { return "target" }
  })
  useEffect(() => { try { localStorage.setItem("careerExplorationMode", explorationMode) } catch {} }, [explorationMode])

  // Profile data (for profile-based generation)
  const { data: careerProfileData } = useQuery<any>({
    queryKey: ["/api/career-data/profile"],
    enabled: explorationMode === "profile",
    queryFn: async () => (await apiRequest("GET", "/api/career-data/profile")).json(),
  })

  // Job title generator
  const [jobTitle, setJobTitle] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Paths and node selection
  const [activePath, setActivePath] = useState<CareerPath | null>(null)
  const [generatedPath, setGeneratedPath] = useState<CareerPath | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const selectedNode = useMemo(() => activePath?.nodes.find(n => n.id === selectedNodeId) || null, [activePath, selectedNodeId])

  // Certifications state per node
  const [isLoadingCerts, setIsLoadingCerts] = useState(false)
  const [roleCerts, setRoleCerts] = useState<Record<string, CertificationRecommendation[]>>({})

  const fetchCertifications = async (nodeId: string) => {
    const node = activePath?.nodes.find(n => n.id === nodeId)
    if (!node) return
    try {
      setIsLoadingCerts(true)
      const res = await apiRequest("POST", "/api/career-certifications", { role: node.title, level: node.level, skills: node.skills })
      const data = await res.json()
      if (Array.isArray(data?.certifications)) {
        setRoleCerts(prev => ({ ...prev, [nodeId]: data.certifications }))
      }
    } catch (e) {
      toast({ title: "Failed to load certifications", description: "Please try again later.", variant: "destructive" })
    } finally {
      setIsLoadingCerts(false)
    }
  }

  const handleNodeClick = (nodeId: string) => {
    const alreadySelected = selectedNodeId === nodeId
    setSelectedNodeId(nodeId)
    if (!alreadySelected) {
      setDrawerOpen(true)
      fetchCertifications(nodeId)
    } else {
      setDrawerOpen(!drawerOpen)
    }
  }

  const generateFromJob = async () => {
    if (!jobTitle.trim()) {
      toast({ title: "Job title required", description: "Enter a job title to generate a career path.", variant: "destructive" })
      return
    }
    try {
      setIsSearching(true)
      const res = await apiRequest("POST", "/api/career-path/generate-from-job", { jobTitle: jobTitle.trim() })
      const data = await res.json()
      if (Array.isArray(data?.paths) && data.paths.length > 0) {
        const mainPath = data.paths[0]
        const processed: CareerPath = {
          ...mainPath,
          nodes: (mainPath.nodes || []).map((n: any) => ({
            ...n,
            icon: getIconComponent(n.icon),
          })),
        }
        setGeneratedPath(processed)
        setActivePath(processed)
        toast({ title: "Career Path Generated", description: `Career path for "${jobTitle}" is ready.` })
      } else {
        throw new Error("No paths returned")
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to generate career path.", variant: "destructive" })
    } finally {
      setIsSearching(false)
    }
  }

  const generateFromProfile = async () => {
    try {
      setIsSearching(true)
      const res = await apiRequest("POST", "/api/career-paths/generate", { profileData: careerProfileData || {} })
      const data = await res.json()
      if (Array.isArray(data?.paths) && data.paths.length) {
        const processed = data.paths.map((p: any) => ({
          ...p,
          nodes: (p.nodes || []).map((n: any) => ({ ...n, icon: getIconComponent(n.icon) })),
        }))
        // Show first path
        setGeneratedPath(processed[0])
        setActivePath(processed[0])
        toast({ title: "Paths Generated", description: "We created personalized paths from your profile." })
      } else {
        toast({ title: "No paths generated", description: "Please enrich your profile and try again.", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Generation failed", description: "Please try again later.", variant: "destructive" })
    } finally {
      setIsSearching(false)
    }
  }

  const handleScroll = (dir: "left" | "right") => {
    const el = scrollContainerRef.current
    if (!el) return
    const amount = 300
    el.scrollTo({ left: dir === "left" ? el.scrollLeft - amount : el.scrollLeft + amount, behavior: "smooth" })
  }

  const addRoleAsGoal = async (title: string, description: string) => {
    try {
      // Fetch existing goals to prevent duplicates (robust UX)
      const existingRes = await apiRequest("GET", "/api/goals")
      const existing = await existingRes.json().catch(() => ({ goals: [] }))
      const goals: any[] = Array.isArray(existing?.goals) ? existing.goals : []
      const dup = goals.some((g) => String(g.title).toLowerCase() === title.toLowerCase())
      if (dup) {
        toast({ title: "Goal already exists", description: "This goal is already in your tracker." })
        return
      }

      const res = await apiRequest("POST", "/api/goals", {
        title,
        description,
        status: "not_started",
        checklist: [
          { id: crypto.randomUUID(), text: "Research required skills", completed: false },
          { id: crypto.randomUUID(), text: "Identify training/certifications", completed: false },
          { id: crypto.randomUUID(), text: "Update resume for this role", completed: false },
        ],
      })
      if (res.ok) {
        toast({ title: "Career Goal Created", description: "Added to your career goals." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to create goal.", variant: "destructive" })
    }
  }

  // Animations
  const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }
  const subtleUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

  return (
    <motion.div className="container mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[#0C29AB]">Career Path Explorer</h1>
          <p className="text-neutral-500">Visualize potential progressions and explore roles.</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <Tabs value={explorationMode} onValueChange={(v) => setExplorationMode(v as any)}>
          <TabsList className="mb-2 bg-gray-100 rounded-md p-1">
            <TabsTrigger value="target" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black">Search Target Role</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black">Suggested Paths for Me</TabsTrigger>
          </TabsList>
        </Tabs>
        {explorationMode === "profile" && (
          <Button className="bg-[#1333c2] hover:bg-[#0f2aae] text-white" onClick={generateFromProfile} disabled={isSearching}>
            {isSearching ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>) : (<><Sparkles className="mr-2 h-4 w-4" />Generate Paths</>)}
          </Button>
        )}
      </div>

      {/* Job title search (target mode) */}
      {explorationMode === "target" && (
        <motion.div variants={subtleUp} className="mb-6 space-y-2">
          <Label htmlFor="job-title-search">Quick Career Path Generator</Label>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="flex-1 w-full">
              <Input id="job-title-search" placeholder="Enter a job title (e.g., Software Engineer)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <Button onClick={generateFromJob} disabled={isSearching || !jobTitle.trim()} className="min-w-[120px] bg-[#1333c2] hover:bg-[#0f2aae] text-white">
              {isSearching ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>) : (<>Generate</>)}
            </Button>
          </div>
          {!generatedPath && (
            <p className="text-sm text-muted-foreground">Quickly generate a career path based on a specific job title</p>
          )}
        </motion.div>
      )}

      {/* Path selector (when generated) */}
      {explorationMode === "target" && generatedPath && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button className="bg-[#1333c2] hover:bg-[#0f2aae] text-white" onClick={() => { setActivePath(generatedPath); setSelectedNodeId(null) }}>
            <Sparkles className="h-4 w-4 mr-2" />{generatedPath.name || `${jobTitle} Path`}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {explorationMode === "target" && !generatedPath && (
        <motion.div className="text-center py-12 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-md border" variants={subtleUp}>
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <MapPin className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">You haven't generated any career paths yet</h3>
          <p className="text-neutral-500 max-w-md mx-auto">Enter a job title above and click "Generate" to explore a personalized path.</p>
        </motion.div>
      )}

      {/* Career Path visualization */}
      {activePath && (
        <div className="relative mt-6">
          <h2 className="text-2xl font-bold mb-4">Career Path Progression</h2>

          {/* Mobile stacked cards */}
          <div className="sm:hidden space-y-4 pb-10">
            {activePath.nodes.map((node, idx) => (
              <motion.div key={node.id} className={cn("cursor-pointer transition-all relative", selectedNodeId === node.id ? "scale-[1.02]" : "hover:scale-[1.02]")} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }} onClick={() => handleNodeClick(node.id)}>
                <Card className={cn("shadow-md h-full", selectedNodeId === node.id ? "border-primary ring-1 ring-primary" : "")}> 
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2">
                      <div className="mt-1">{node.icon}</div>
                      <Badge className={LevelBadgeColors[node.level]}>{node.level[0].toUpperCase() + node.level.slice(1)}</Badge>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg mb-1 truncate">{node.title}</h3>
                      <div className="text-sm text-muted-foreground mb-2">{node.salaryRange}</div>
                      <div className="text-xs text-muted-foreground">Experience: {node.yearsExperience}</div>
                    </div>
                    <div className={cn("flex items-center gap-1 text-xs mt-3", GrowthIndicators[node.growthPotential].color)}>
                      {GrowthIndicators[node.growthPotential].icon}
                      {GrowthIndicators[node.growthPotential].text}
                    </div>
                  </CardContent>
                </Card>
                {idx < activePath.nodes.length - 1 && (
                  <div className="flex justify-center my-2"><div className="rotate-90 text-gray-400"><ArrowRight className="h-5 w-5" /></div></div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Desktop horizontal scroll */}
          <div className="relative mx-4 sm:mx-14 hidden sm:block">
            <div className="absolute left-[-30px] sm:left-[-40px] top-1/2 -translate-y-1/2 z-10">
              <Button variant="ghost" size="icon" onClick={() => handleScroll("left")} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-md hover:bg-gray-100"><ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" /></Button>
            </div>
            <div ref={scrollContainerRef} className="pb-6 px-2 overflow-x-auto scrollbar-hide relative flex items-start gap-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <div className="absolute top-20 left-0 right-10 h-1 bg-gray-200" />
              {activePath.nodes.map((node, idx) => (
                <div key={node.id} className="flex flex-col items-center min-w-[230px] sm:min-w-[250px] first:pl-4">
                  <motion.div className={cn("cursor-pointer transition-all relative mt-4", selectedNodeId === node.id ? "scale-105" : "hover:scale-105")} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }} onClick={() => handleNodeClick(node.id)}>
                    <Card className={cn("w-[230px] sm:w-60 shadow-md h-full", selectedNodeId === node.id ? "border-primary ring-1 ring-primary" : "")}>
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                          <div className="mt-1">{node.icon}</div>
                          <Badge className={LevelBadgeColors[node.level]}>{node.level[0].toUpperCase() + node.level.slice(1)}</Badge>
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-bold text-base sm:text-lg mb-1 truncate">{node.title}</h3>
                          <div className="text-sm text-muted-foreground mb-2">{node.salaryRange}</div>
                          <div className="text-xs text-muted-foreground">Experience: {node.yearsExperience}</div>
                        </div>
                        <div className={cn("flex items-center gap-1 text-xs mt-3", GrowthIndicators[node.growthPotential].color)}>
                          {GrowthIndicators[node.growthPotential].icon}
                          {GrowthIndicators[node.growthPotential].text}
                        </div>
                      </CardContent>
                    </Card>
                    {idx < activePath.nodes.length - 1 && <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-gray-400"><ArrowRight className="h-5 w-5" /></div>}
                  </motion.div>
                </div>
              ))}
            </div>
            <div className="absolute right-[-30px] sm:right-[-40px] top-1/2 -translate-y-1/2 z-10">
              <Button variant="ghost" size="icon" onClick={() => handleScroll("right")} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-md hover:bg-gray-100"><ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* Role detail dialog */}
      <Dialog open={drawerOpen && !!selectedNode} onOpenChange={setDrawerOpen}>
        {selectedNode && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">{selectedNode.icon}<DialogTitle className="text-xl sm:text-2xl">{selectedNode.title}</DialogTitle></div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className={LevelBadgeColors[selectedNode.level]}>{selectedNode.level[0].toUpperCase() + selectedNode.level.slice(1)} Level</Badge>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{selectedNode.salaryRange}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{selectedNode.yearsExperience} experience</span>
              </div>
              <DialogDescription>Explore this role's requirements, growth potential, and recommended certifications</DialogDescription>
            </DialogHeader>

            <div className="px-4 sm:px-6 pb-6">
              <Tabs className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="skills">Skills & Reqs</TabsTrigger>
                  <TabsTrigger value="certifications">Certifications</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Role Description</h3>
                    <p className="text-muted-foreground">{selectedNode.description}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Growth Outlook</h3>
                    <div className={cn("flex items-center gap-2", GrowthIndicators[selectedNode.growthPotential].color)}>
                      {GrowthIndicators[selectedNode.growthPotential].icon}
                      <span className="font-medium">{GrowthIndicators[selectedNode.growthPotential].text} Potential</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Compensation Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /><span>Salary range: {selectedNode.salaryRange}</span></div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><span>Experience: {selectedNode.yearsExperience}</span></div>
                    </div>
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row gap-2">
                    <Button className="bg-[#1333c2] hover:bg-[#0f2aae] text-white px-4" size="sm" onClick={() => addRoleAsGoal(`Become a ${selectedNode.title}`, `Career goal to become a ${selectedNode.title} in the ${activePath?.name} path. Salary range: ${selectedNode.salaryRange}.`)}>
                      Set as Career Goal
                    </Button>
                    <DialogClose asChild><Button variant="outline" size="sm" className="w-full sm:w-auto">Close</Button></DialogClose>
                  </div>
                </TabsContent>
                <TabsContent value="skills" className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.skills.map((s) => (
                        <Badge key={s.name} className="py-1.5 px-3">{s.name} <span className="opacity-70">({s.level})</span></Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="certifications" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Recommended Certifications</h3>
                    {isLoadingCerts && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(roleCerts[selectedNode.id] || []).map((c) => (
                      <CertificationCard key={`${c.name}-${c.provider}`} cert={c} loading={false} onAdd={() => addRoleAsGoal(`Earn ${c.name} Certification`, `Complete the ${c.name} certification from ${c.provider}. This is a ${c.difficulty} certification that typically takes ${c.estimatedTimeToComplete}.`)} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  )
}
