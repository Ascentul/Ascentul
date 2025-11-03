"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// Removed framer-motion import to fix build issues
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  DollarSign,
  ExternalLink,
  GraduationCap,
  Layers,
  Lightbulb,
  LineChart,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  CareerPathApiResponse,
  isCareerPathResponse,
  isProfileGuidanceResponse,
  ProfileTask,
} from "@/lib/career-path/types";

// Removed framer-motion animations to fix build issues

// Types
interface CareerSkill {
  name: string;
  level: "basic" | "intermediate" | "advanced";
}
interface CareerNode {
  id: string;
  title: string;
  level: "entry" | "mid" | "senior" | "lead" | "executive";
  salaryRange: string;
  yearsExperience: string;
  skills: CareerSkill[];
  description: string;
  growthPotential: "low" | "medium" | "high";
  icon: JSX.Element;
}
interface CareerPath {
  id: string;
  name: string;
  nodes: CareerNode[];
}

// Helpers
const LevelBadgeColors: Record<string, string> = {
  entry: "bg-blue-100 text-blue-800",
  mid: "bg-green-100 text-green-800",
  senior: "bg-purple-100 text-purple-800",
  lead: "bg-yellow-100 text-yellow-800",
  executive: "bg-red-100 text-red-800",
};

const GrowthIndicators: Record<
  string,
  { icon: JSX.Element; text: string; color: string }
> = {
  low: {
    icon: <Sparkles className="h-4 w-4" />,
    text: "Low Growth",
    color: "text-amber-500",
  },
  medium: {
    icon: <Sparkles className="h-4 w-4" />,
    text: "Medium Growth",
    color: "text-blue-500",
  },
  high: {
    icon: <Sparkles className="h-4 w-4" />,
    text: "High Growth",
    color: "text-green-500",
  },
  stable: {
    icon: <Sparkles className="h-4 w-4" />,
    text: "Stable Growth",
    color: "text-gray-500",
  },
};

const iconSize = "h-6 w-6 text-primary";
function getIconComponent(name?: string): JSX.Element {
  switch ((name || "").toLowerCase()) {
    case "braces":
      return <BriefcaseBusiness className={iconSize} />;
    case "cpu":
      return <Cpu className={iconSize} />;
    case "database":
      return <Database className={iconSize} />;
    case "briefcase":
      return <BriefcaseBusiness className={iconSize} />;
    case "user":
      return <User className={iconSize} />;
    case "award":
      return <Award className={iconSize} />;
    case "linechart":
      return <LineChart className={iconSize} />;
    case "layers":
      return <Layers className={iconSize} />;
    case "graduation":
      return <GraduationCap className={iconSize} />;
    case "lightbulb":
      return <Lightbulb className={iconSize} />;
    case "book":
      return <BookOpen className={iconSize} />;
    default:
      return <BriefcaseBusiness className={iconSize} />;
  }
}

// Local storage keys for persistence
const LS_KEYS = {
  path: "careerPathExplorer_saved_path",
  source: "careerPathExplorer_source",
  jobTitle: "careerPathExplorer_job_title",
} as const;

// Convert a raw path (with icon string) into a UI path (with icon JSX)
function hydratePath(raw: any): CareerPath | null {
  if (!raw || !Array.isArray(raw.nodes)) return null;
  return {
    id: String(raw.id || "path"),
    name: String(raw.name || "Path"),
    nodes: raw.nodes.map((n: any) => ({
      id: String(n.id),
      title: String(n.title),
      level: n.level,
      salaryRange: String(n.salaryRange || ""),
      yearsExperience: String(n.yearsExperience || ""),
      skills: Array.isArray(n.skills)
        ? n.skills.map((skill: any) =>
            // Handle both string skills (from agent) and object skills (from manual generation)
            typeof skill === 'string'
              ? { name: skill, level: 'intermediate' as const }
              : skill
          )
        : [],
      description: String(n.description || ""),
      growthPotential: n.growthPotential,
      icon: getIconComponent(n.icon),
    })),
  };
}

// Certification UI pieces
type CertificationRecommendation = {
  name: string;
  provider: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTimeToComplete: string;
  relevance: "highly relevant" | "relevant" | "somewhat relevant";
};

// ProfileTaskCard component for guidance mode
function ProfileTaskCard({
  task,
  onAction,
}: {
  task: ProfileTask;
  onAction: (url?: string) => void;
}) {
  const iconMap: Record<string, JSX.Element> = {
    book: <BookOpen className="h-5 w-5 text-primary" />,
    layers: <Layers className="h-5 w-5 text-primary" />,
    linechart: <LineChart className="h-5 w-5 text-primary" />,
    briefcase: <BriefcaseBusiness className="h-5 w-5 text-primary" />,
    lightbulb: <Lightbulb className="h-5 w-5 text-primary" />,
    award: <Award className="h-5 w-5 text-primary" />,
  };

  const priorityColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {iconMap[task.icon || "book"] || iconMap.book}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2 gap-3">
              <h4 className="font-semibold text-lg">{task.title}</h4>
              <Badge className={cn("border", priorityColors[task.priority])}>
                {task.priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {task.category}
            </p>
            <p className="text-sm text-foreground mb-4">{task.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>~{task.estimated_duration_minutes} minutes</span>
              </div>
              {task.action_url && (
                <Button
                  size="sm"
                  onClick={() => onAction(task.action_url)}
                  className="gap-1"
                >
                  Take Action
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CertificationCard({
  cert,
  onAdd,
  loading,
}: {
  cert: CertificationRecommendation;
  onAdd: () => void;
  loading: boolean;
}) {
  return (
    <div className="border rounded-lg p-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{cert.name}</h4>
          <p className="text-sm text-muted-foreground">
            Provider: {cert.provider}
          </p>
        </div>
        <Badge
          className={
            (
              cert.relevance === "highly relevant"
                ? "bg-green-100 text-green-800"
                : cert.relevance === "relevant"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
            ) + " rounded-md whitespace-nowrap px-2 py-0 text-xs leading-5"
          }
        >
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
          <span className="text-muted-foreground">
            {cert.estimatedTimeToComplete}
          </span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={onAdd}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Adding as
              Goal...
            </>
          ) : (
            <>
              <Plus className="mr-1 h-3 w-3" />
              Add as Career Goal
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function CareerPathPage() {
  const { toast } = useToast();
  const { user: authUser, hasPremium } = useAuth();
  const isFreeUser = !hasPremium; // Use Clerk Billing subscription check
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Track if we're loading an agent-generated path to prevent conflicts
  const hasAgentPath = useRef(false);

  const [explorationMode, setExplorationMode] = useState<
    "target" | "profile" | "saved"
  >(() => {
    try {
      const saved = localStorage.getItem("careerExplorationMode");
      return saved === "profile" || saved === "target" || saved === "saved"
        ? (saved as any)
        : "target";
    } catch {
      return "target";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("careerExplorationMode", explorationMode);
    } catch {}
  }, [explorationMode]);

  // Handle incoming career path from agent chat
  useEffect(() => {
    try {
      const agentDataStr = localStorage.getItem('agent_career_path');
      if (!agentDataStr) return;

      console.log('[CareerPath] Processing agent career path from localStorage');
      hasAgentPath.current = true; // Mark that we have an agent path

      const agentData = JSON.parse(agentDataStr);
      const { careerPath, selectedNodeIndex } = agentData;

      // Validate the data
      if (!careerPath?.nodes || !Array.isArray(careerPath.nodes)) {
        console.log('[CareerPath] Invalid career path data');
        hasAgentPath.current = false;
        return;
      }

      // Ensure nodes have IDs before hydrating
      const pathWithIds = {
        ...careerPath,
        id: careerPath.id || 'agent-path',
        nodes: careerPath.nodes.map((node: any, idx: number) => ({
          ...node,
          id: node.id || `agent-node-${idx}`,
        })),
      };

      // Hydrate the career path (convert icon strings to JSX)
      const hydratedPath = hydratePath(pathWithIds);
      if (!hydratedPath) {
        console.log('[CareerPath] Failed to hydrate path');
        hasAgentPath.current = false;
        return;
      }

      console.log('[CareerPath] Setting active path and selected node:', {
        pathName: hydratedPath.name,
        nodeCount: hydratedPath.nodes.length,
        selectedNodeIndex,
      });

      // Set the active path
      setActivePath(hydratedPath);
      setGeneratedPath(hydratedPath);

      // Select the specific node that was clicked
      // Use setTimeout to ensure state updates are processed
      if (typeof selectedNodeIndex === 'number' && hydratedPath.nodes[selectedNodeIndex]) {
        const selectedNode = hydratedPath.nodes[selectedNodeIndex];
        console.log('[CareerPath] Selecting node:', selectedNode.id, selectedNode.title);

        setTimeout(async () => {
          setSelectedNodeId(selectedNode.id);
          setDrawerOpen(true);
          console.log('[CareerPath] Drawer should be open now');

          // Fetch certifications for this node
          try {
            setIsLoadingCerts(true);
            const res = await apiRequest("POST", "/api/career-certifications", {
              role: selectedNode.title,
              level: selectedNode.level,
              skills: selectedNode.skills,
            });
            const data = await res.json();
            if (Array.isArray(data?.certifications)) {
              setRoleCerts((prev) => ({ ...prev, [selectedNode.id]: data.certifications }));
            }
          } catch (e) {
            console.error('[CareerPath] Failed to load certifications:', e);
          } finally {
            setIsLoadingCerts(false);
          }
        }, 100);
      }

      // Clean up localStorage after processing
      localStorage.removeItem('agent_career_path');
    } catch (error) {
      console.error('Failed to process agent career path:', error);
      hasAgentPath.current = false;
    }
  }, []); // Run once on mount

  // Profile data (for profile-based generation)
  const { data: careerProfileData } = useQuery<any>({
    queryKey: ["/api/career-data/profile"],
    enabled: explorationMode === "profile",
    queryFn: async () =>
      (await apiRequest("GET", "/api/career-data/profile")).json(),
  });

  // Job title generator
  const [jobTitle, setJobTitle] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Paths and node selection
  const [activePath, setActivePath] = useState<CareerPath | null>(null);
  const [generatedPath, setGeneratedPath] = useState<CareerPath | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Guidance mode state (when profile prep is needed)
  const [showGuidanceBanner, setShowGuidanceBanner] = useState(false);
  const [guidanceMessage, setGuidanceMessage] = useState("");
  const [guidanceTasks, setGuidanceTasks] = useState<ProfileTask[]>([]);

  const selectedNode = useMemo(
    () => activePath?.nodes.find((n) => n.id === selectedNodeId) || null,
    [activePath, selectedNodeId],
  );

  // Certifications state per node
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);
  const [roleCerts, setRoleCerts] = useState<
    Record<string, CertificationRecommendation[]>
  >({});

  // Saved Paths management (rename/delete dialogs)
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<{
    id: string;
    docId: string;
    name: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  // Inline editing controls
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Restore previously generated path and job title on initial load
  // NOTE: This runs AFTER the agent career path useEffect, and only sets the path if
  // the agent didn't already set one (to avoid overriding agent-generated paths)
  useEffect(() => {
    try {
      // Skip if we loaded an agent path
      if (hasAgentPath.current) {
        console.log('[CareerPath] Skipping path restoration - agent path loaded');
        return;
      }

      const raw = localStorage.getItem(LS_KEYS.path);
      if (raw) {
        console.log('[CareerPath] Restoring previous path from localStorage');
        const parsed = JSON.parse(raw);
        const hydrated = hydratePath(parsed);
        if (hydrated) {
          setGeneratedPath(hydrated);
          setActivePath(hydrated);
        }
      }
      const savedTitle = localStorage.getItem(LS_KEYS.jobTitle);
      if (savedTitle) setJobTitle(savedTitle);
    } catch {}
  }, []);

  // Load previously saved paths from Convex with sort + pagination
  const [savedSort, setSavedSort] = useState<"desc" | "asc">(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("careerPathExplorer_saved_sort") as any) || "desc"
      : "desc",
  );
  const [savedCursor, setSavedCursor] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { data: savedPage, refetch: refetchSaved } = useQuery<any>({
    queryKey: ["/api/career-paths", savedSort, savedCursor],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("sort", savedSort);
      if (savedCursor) qs.set("cursor", savedCursor);
      qs.set("limit", "10");
      const res = await apiRequest("GET", `/api/career-paths?${qs.toString()}`);
      return res.json();
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!savedPage) return;
    const arr = Array.isArray(savedPage.paths) ? savedPage.paths : [];
    if (savedCursor) setSavedList((prev) => [...prev, ...arr]);
    else setSavedList(arr);
    setNextCursor(savedPage.nextCursor ?? null);
  }, [savedPage, savedCursor]);

  const savedPaths: CareerPath[] = useMemo(() => {
    try {
      return savedList
        .map((p: any) => hydratePath(p))
        .filter(Boolean) as CareerPath[];
    } catch {
      return [];
    }
  }, [savedList]);

  const handleChangeSort = async (order: "asc" | "desc") => {
    setSavedSort(order);
    try {
      localStorage.setItem("careerPathExplorer_saved_sort", order);
    } catch {}
    setSavedCursor(null);
    setNextCursor(null);
    // refetch will run due to queryKey change
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setSavedCursor(nextCursor);
  };

  // Select a saved path from Convex history
  const handleSelectSavedPath = (id: string) => {
    if (!Array.isArray(savedPaths) || savedPaths.length === 0) return;
    const ui = savedPaths.find((p) => String(p.id) === String(id));
    if (!ui) return;
    setGeneratedPath(ui);
    setActivePath(ui);
    // Find the raw path in the aggregated server data to persist
    try {
      const raw = savedList.find(
        (p: any) => String(p?.id ?? p?._id) === String(id),
      );
      if (raw) {
        localStorage.setItem(LS_KEYS.path, JSON.stringify(raw));
        localStorage.setItem(LS_KEYS.source, "history");
        if (raw?.name) localStorage.setItem(LS_KEYS.jobTitle, String(raw.name));
      }
    } catch {}
  };

  // Open rename dialog for a saved path
  const openRenameFor = (raw: any) => {
    const p = hydratePath(raw);
    if (!p) return;
    const id = String(p.id);
    const docId = String(raw?.docId ?? raw?._id);
    setModalTarget({ id, docId, name: p.name });
    setRenameValue(p.name);
    setRenameOpen(true);
  };

  // Open delete dialog for a saved path
  const openDeleteFor = (raw: any) => {
    const p = hydratePath(raw);
    if (!p) return;
    const id = String(p.id);
    const docId = String(raw?.docId ?? raw?._id);
    setModalTarget({ id, docId, name: p.name });
    setDeleteOpen(true);
  };

  const fetchCertifications = async (nodeId: string) => {
    const node = activePath?.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    try {
      setIsLoadingCerts(true);
      const res = await apiRequest("POST", "/api/career-certifications", {
        role: node.title,
        level: node.level,
        skills: node.skills,
      });
      const data = await res.json();
      if (Array.isArray(data?.certifications)) {
        setRoleCerts((prev) => ({ ...prev, [nodeId]: data.certifications }));
      }
    } catch (e) {
      toast({
        title: "Failed to load certifications",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCerts(false);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const alreadySelected = selectedNodeId === nodeId;
    setSelectedNodeId(nodeId);
    if (!alreadySelected) {
      setDrawerOpen(true);
      fetchCertifications(nodeId);
    } else {
      setDrawerOpen(!drawerOpen);
    }
  };

  const generateFromJob = async () => {
    if (!jobTitle.trim()) {
      toast({
        title: "Job title required",
        description: "Enter a job title to generate a career path.",
        variant: "destructive",
      });
      return;
    }

    // Check free user limit (1 career path max in database)
    // Skip limit check in development for testing
    if (process.env.NODE_ENV !== 'development' && isFreeUser && savedPaths.length >= 1) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      setIsSearching(true);

      // Clear previous guidance state
      setShowGuidanceBanner(false);
      setGuidanceMessage("");
      setGuidanceTasks([]);

      const res = await apiRequest(
        "POST",
        "/api/career-path/generate-from-job",
        { jobTitle: jobTitle.trim() },
      );
      const data: CareerPathApiResponse = await res.json();

      // Handle profile guidance response
      if (isProfileGuidanceResponse(data)) {
        setShowGuidanceBanner(true);
        setGuidanceMessage(data.message);
        setGuidanceTasks(data.tasks);

        // Clear any active career path
        setActivePath(null);
        setGeneratedPath(null);

        // Clear stale path persistence to prevent rehydration on reload
        try {
          localStorage.removeItem(LS_KEYS.path);
          localStorage.removeItem(LS_KEYS.source);
          localStorage.removeItem(LS_KEYS.jobTitle);
        } catch {}

        toast({
          title: "Profile Guidance",
          description: "Complete the suggested profile improvements to generate a detailed career path.",
          variant: "default",
        });
        return;
      }

      // Handle career path response
      if (isCareerPathResponse(data)) {
        const processed: CareerPath = {
          id: data.id,
          name: data.name,
          nodes: data.nodes.map((n) => ({
            ...n,
            icon: getIconComponent(n.icon),
          })),
        };

        setGeneratedPath(processed);
        setActivePath(processed);

        // Clear guidance state on success
        setShowGuidanceBanner(false);
        setGuidanceMessage("");
        setGuidanceTasks([]);

        // Refresh saved list from server (reset pagination)
        setSavedCursor(null);
        setNextCursor(null);
        try {
          await refetchSaved();
        } catch {}

        // Persist raw path JSON and job title for future sessions
        try {
          localStorage.setItem(LS_KEYS.path, JSON.stringify(data));
          localStorage.setItem(LS_KEYS.source, "job");
          localStorage.setItem(LS_KEYS.jobTitle, jobTitle.trim());
        } catch {}

        toast({
          title: "Career Path Generated",
          description: `Career path for "${jobTitle}" is ready.`,
        });
        return;
      }

      // Fallback for unexpected response format
      throw new Error("Unexpected response format from server");
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to generate career path.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const generateFromProfile = async () => {
    // Check free user limit (1 career path max in database)
    // Skip limit check in development for testing
    if (process.env.NODE_ENV !== 'development' && isFreeUser && savedPaths.length >= 1) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      setIsSearching(true);
      const res = await apiRequest("POST", "/api/career-paths/generate", {
        profileData: careerProfileData || {},
      });
      const data = await res.json();
      if (Array.isArray(data?.paths) && data.paths.length) {
        const processed = data.paths.map((p: any) => ({
          ...p,
          nodes: (p.nodes || []).map((n: any) => ({
            ...n,
            icon: getIconComponent(n.icon),
          })),
        }));
        // Show first path
        setGeneratedPath(processed[0]);
        setActivePath(processed[0]);
        // Refresh saved list from server
        try {
          await refetchSaved();
        } catch {}
        // Persist the first raw path
        try {
          localStorage.setItem(LS_KEYS.path, JSON.stringify(data.paths[0]));
          localStorage.setItem(LS_KEYS.source, "profile");
        } catch {}
        toast({
          title: "Paths Generated",
          description: "We created personalized paths from your profile.",
        });
      } else {
        toast({
          title: "No paths generated",
          description: "Please enrich your profile and try again.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Generation failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleScroll = (dir: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = 300;
    el.scrollTo({
      left: dir === "left" ? el.scrollLeft - amount : el.scrollLeft + amount,
      behavior: "smooth",
    });
  };

  const addRoleAsGoal = async (title: string, description: string) => {
    try {
      // Fetch existing goals to prevent duplicates (robust UX)
      const existingRes = await apiRequest("GET", "/api/goals");
      const existing = await existingRes.json().catch(() => ({ goals: [] }));
      const goals: any[] = Array.isArray(existing?.goals) ? existing.goals : [];
      const dup = goals.some(
        (g) => String(g.title).toLowerCase() === title.toLowerCase(),
      );
      if (dup) {
        toast({
          title: "Goal already exists",
          description: "This goal is already in your tracker.",
        });
        return;
      }

      const res = await apiRequest("POST", "/api/goals", {
        title,
        description,
        status: "not_started",
        checklist: [
          {
            id: crypto.randomUUID(),
            text: "Research required skills",
            completed: false,
          },
          {
            id: crypto.randomUUID(),
            text: "Identify training/certifications",
            completed: false,
          },
          {
            id: crypto.randomUUID(),
            text: "Update resume for this role",
            completed: false,
          },
        ],
      });
      if (res.ok) {
        toast({
          title: "Career Goal Created",
          description: "Added to your career goals.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create goal.",
        variant: "destructive",
      });
    }
  };

  // Removed animation objects

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[#0C29AB]">
            Career Path Explorer
          </h1>
          <p className="text-neutral-500">
            Visualize potential progressions and explore roles.
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <Tabs
          value={explorationMode}
          onValueChange={(v) => setExplorationMode(v as any)}
        >
          <TabsList className="mb-2 bg-gray-100 rounded-md p-1">
            <TabsTrigger
              value="target"
              className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Search Target Role
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Suggested Paths for Me
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Saved Paths
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {explorationMode === "profile" && (
          <Button
            className="bg-[#1333c2] hover:bg-[#0f2aae] text-white"
            onClick={generateFromProfile}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Paths
              </>
            )}
          </Button>
        )}
      </div>

      {/* Saved Paths Tab Content */}
      {explorationMode === "saved" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Saved Paths</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <Button
                variant={savedSort === "desc" ? "default" : "outline"}
                size="sm"
                onClick={() => handleChangeSort("desc")}
              >
                Newest first
              </Button>
              <Button
                variant={savedSort === "asc" ? "default" : "outline"}
                size="sm"
                onClick={() => handleChangeSort("asc")}
              >
                Oldest first
              </Button>
            </div>
          </div>
          {savedPaths.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-medium mb-2">No saved paths yet</h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                Generate a career path and it will be automatically saved here
                for future reference.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {Array.isArray(savedList) &&
                savedList.map((raw: any) => {
                  const p = hydratePath(raw);
                  if (!p) return null;
                  const id = String(p.id);
                  const docId = String(raw?.docId ?? raw?._id);
                  return (
                    <Card
                      key={docId}
                      className="p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between gap-4">
                        {editingId === docId ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              className="h-8 flex-1"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                            />
                            <Button
                              size="sm"
                              onClick={async () => {
                                if (!editingValue.trim()) return;
                                try {
                                  await apiRequest(
                                    "PATCH",
                                    `/api/career-paths/${encodeURIComponent(docId)}/name`,
                                    { name: editingValue.trim() },
                                  );
                                  setSavedCursor(null);
                                  setNextCursor(null);
                                  await refetchSaved();
                                  setActivePath((prev) =>
                                    prev && String(prev.id) === id
                                      ? ({
                                          ...prev,
                                          name: editingValue.trim(),
                                        } as any)
                                      : prev,
                                  );
                                  setEditingId(null);
                                } catch {
                                  toast({
                                    title: "Rename failed",
                                    description: "Please try again later.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingId(null);
                                setEditingValue("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <h4 className="font-medium">{p.name}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {p.nodes.length} roles • Saved{" "}
                                {raw?.savedAt
                                  ? formatDistanceToNow(new Date(raw.savedAt), {
                                      addSuffix: true,
                                    })
                                  : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleSelectSavedPath(id);
                                  setExplorationMode("target");
                                }}
                              >
                                View Path
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(docId);
                                  setEditingValue(p.name);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDeleteFor(raw)}
                              >
                                Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              {nextCursor && (
                <div className="pt-2 text-center">
                  <Button variant="outline" onClick={handleLoadMore}>
                    Load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {explorationMode === "target" && (
        <div className="mb-6 space-y-2">
          <Label htmlFor="job-title-search">Quick Career Path Generator</Label>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="flex-1 w-full">
              <Input
                id="job-title-search"
                placeholder="Enter a job title (e.g., Software Engineer)"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <Button
              onClick={generateFromJob}
              disabled={isSearching || !jobTitle.trim()}
              className="min-w-[120px] bg-[#1333c2] hover:bg-[#0f2aae] text-white"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>Generate</>
              )}
            </Button>
          </div>
          {!generatedPath && (
            <p className="text-sm text-muted-foreground">
              Quickly generate a career path based on a specific job title
            </p>
          )}
        </div>
      )}

      {/* Guidance Banner */}
      {showGuidanceBanner && explorationMode === "target" && (
        <div className="mb-6 p-5 bg-amber-50 border-2 border-amber-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 text-lg mb-2">
                Profile Improvements Needed
              </h3>
              <p className="text-sm text-amber-800 mb-4">{guidanceMessage}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuidanceBanner(false)}
                className="gap-1 border-amber-300 hover:bg-amber-100"
              >
                <X className="h-3.5 w-3.5" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Guidance Tasks */}
      {guidanceTasks.length > 0 && explorationMode === "target" && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recommended Profile Updates</h2>
            <Badge variant="outline" className="text-sm">
              {guidanceTasks.length} {guidanceTasks.length === 1 ? "task" : "tasks"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Complete these profile improvements to unlock a detailed career path for "{jobTitle}"
          </p>
          {guidanceTasks.map((task) => (
            <ProfileTaskCard
              key={task.id}
              task={task}
              onAction={(url) => {
                if (url) window.location.href = url;
              }}
            />
          ))}
        </div>
      )}

      {/* Path selector (when generated) */}
      {explorationMode === "target" && generatedPath && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            className="bg-[#1333c2] hover:bg-[#0f2aae] text-white"
            onClick={() => {
              setActivePath(generatedPath);
              setSelectedNodeId(null);
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generatedPath.name || `${jobTitle} Path`}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {explorationMode === "target" && !generatedPath && !guidanceTasks.length && (
        <div className="text-center py-12 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-md border">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <MapPin className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">
            You haven't generated any career paths yet
          </h3>
          <p className="text-neutral-500 max-w-md mx-auto">
            Enter a job title above and click "Generate" to explore a
            personalized path.
          </p>
        </div>
      )}

      {/* Career Path visualization */}
      {activePath && explorationMode !== "saved" && (
        <div className="relative mt-6">
          <h2 className="text-2xl font-bold mb-4">Career Path Progression</h2>

          {/* Mobile stacked cards */}
          <div className="sm:hidden space-y-4 pb-10">
            {activePath.nodes.map((node, idx) => (
              <div
                key={node.id}
                className={cn(
                  "cursor-pointer transition-all relative",
                  selectedNodeId === node.id
                    ? "scale-[1.02]"
                    : "hover:scale-[1.02]",
                )}
                onClick={() => handleNodeClick(node.id)}
              >
                <Card
                  className={cn(
                    "shadow-md h-full",
                    selectedNodeId === node.id
                      ? "border-primary ring-1 ring-primary"
                      : "",
                  )}
                >
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2">
                      <div className="mt-1">{node.icon}</div>
                      <Badge className={LevelBadgeColors[node.level]}>
                        {node.level[0].toUpperCase() + node.level.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg mb-1 truncate">
                        {node.title}
                      </h3>
                      <div className="text-sm text-muted-foreground mb-2">
                        {node.salaryRange}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Experience: {node.yearsExperience}
                      </div>
                    </div>
                    {node.growthPotential && GrowthIndicators[node.growthPotential] && (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs mt-3",
                          GrowthIndicators[node.growthPotential].color,
                        )}
                      >
                        {GrowthIndicators[node.growthPotential].icon}
                        {GrowthIndicators[node.growthPotential].text}
                      </div>
                    )}
                  </CardContent>
                </Card>
                {idx < activePath.nodes.length - 1 && (
                  <div className="flex justify-center my-2">
                    <div className="rotate-90 text-gray-400">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop horizontal scroll */}
          <div className="relative mx-4 sm:mx-14 hidden sm:block">
            <div className="absolute left-[-30px] sm:left-[-40px] top-1/2 -translate-y-1/2 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleScroll("left")}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-md hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
              </Button>
            </div>
            <div
              ref={scrollContainerRef}
              className="pb-6 px-2 overflow-x-auto scrollbar-hide relative flex items-start gap-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="absolute top-20 left-0 right-10 h-1 bg-gray-200" />
              {activePath.nodes.map((node, idx) => (
                <div
                  key={node.id}
                  className="flex flex-col items-center min-w-[230px] sm:min-w-[250px] first:pl-4"
                >
                  <div
                    className={cn(
                      "cursor-pointer transition-all relative mt-4",
                      selectedNodeId === node.id
                        ? "scale-105"
                        : "hover:scale-105",
                    )}
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <Card
                      className={cn(
                        "w-[230px] sm:w-60 shadow-md h-full",
                        selectedNodeId === node.id
                          ? "border-primary ring-1 ring-primary"
                          : "",
                      )}
                    >
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                          <div className="mt-1">{node.icon}</div>
                          <Badge className={LevelBadgeColors[node.level]}>
                            {node.level[0].toUpperCase() + node.level.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-bold text-base sm:text-lg mb-1 truncate">
                            {node.title}
                          </h3>
                          <div className="text-sm text-muted-foreground mb-2">
                            {node.salaryRange}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Experience: {node.yearsExperience}
                          </div>
                        </div>
                        {node.growthPotential && GrowthIndicators[node.growthPotential] && (
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs mt-3",
                              GrowthIndicators[node.growthPotential].color,
                            )}
                          >
                            {GrowthIndicators[node.growthPotential].icon}
                            {GrowthIndicators[node.growthPotential].text}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    {idx < activePath.nodes.length - 1 && (
                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute right-[-30px] sm:right-[-40px] top-1/2 -translate-y-1/2 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleScroll("right")}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-md hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Role detail dialog */}
      <Dialog open={drawerOpen && !!selectedNode} onOpenChange={setDrawerOpen}>
        {selectedNode && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                {selectedNode.icon}
                <DialogTitle className="text-xl sm:text-2xl">
                  {selectedNode.title}
                </DialogTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className={LevelBadgeColors[selectedNode.level]}>
                  {selectedNode.level[0].toUpperCase() +
                    selectedNode.level.slice(1)}{" "}
                  Level
                </Badge>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {selectedNode.salaryRange}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {selectedNode.yearsExperience} experience
                </span>
              </div>
              <DialogDescription>
                Explore this role's requirements, growth potential, and
                recommended certifications
              </DialogDescription>
            </DialogHeader>

            <div className="px-4 sm:px-6 pb-6">
              <Tabs
                className="w-full"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="skills">Skills & Reqs</TabsTrigger>
                  <TabsTrigger value="certifications">
                    Certifications
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Role Description
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedNode.description}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Growth Outlook
                    </h3>
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        GrowthIndicators[selectedNode.growthPotential].color,
                      )}
                    >
                      {GrowthIndicators[selectedNode.growthPotential].icon}
                      <span className="font-medium">
                        {GrowthIndicators[selectedNode.growthPotential].text}{" "}
                        Potential
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Compensation Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span>Salary range: {selectedNode.salaryRange}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Experience: {selectedNode.yearsExperience}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                      className="bg-[#1333c2] hover:bg-[#0f2aae] text-white px-4"
                      size="sm"
                      onClick={() =>
                        addRoleAsGoal(
                          `Become a ${selectedNode.title}`,
                          `Career goal to become a ${selectedNode.title} in the ${activePath?.name} path. Salary range: ${selectedNode.salaryRange}.`,
                        )
                      }
                    >
                      Set as Career Goal
                    </Button>
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        Close
                      </Button>
                    </DialogClose>
                  </div>
                </TabsContent>
                <TabsContent value="skills" className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.skills.map((s) => (
                        <Badge key={s.name} className="py-1.5 px-3">
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="certifications" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Recommended Certifications
                    </h3>
                    {isLoadingCerts && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(roleCerts[selectedNode.id] || []).map((c) => (
                      <CertificationCard
                        key={`${c.name}-${c.provider}`}
                        cert={c}
                        loading={false}
                        onAdd={() =>
                          addRoleAsGoal(
                            `Earn ${c.name} Certification`,
                            `Complete the ${c.name} certification from ${c.provider}. This is a ${c.difficulty} certification that typically takes ${c.estimatedTimeToComplete}.`,
                          )
                        }
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Rename Saved Path Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Saved Path</DialogTitle>
            <DialogDescription>
              Give this saved path a new name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-input">Name</Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="e.g., Software Engineer Leadership"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!modalTarget || !renameValue.trim()) return;
                try {
                  await apiRequest(
                    "PATCH",
                    `/api/career-paths/${encodeURIComponent(modalTarget.docId)}/name`,
                    { name: renameValue.trim() },
                  );
                  // update active path name if it's the same UI id
                  setActivePath((prev) =>
                    prev && String(prev.id) === modalTarget.id
                      ? ({ ...prev, name: renameValue.trim() } as any)
                      : prev,
                  );
                  await refetchSaved();
                  setRenameOpen(false);
                } catch {
                  toast({
                    title: "Rename failed",
                    description: "Please try again later.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Saved Path Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Saved Path</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            {modalTarget ? (
              <>
                Are you sure you want to delete{" "}
                <span className="font-medium">{modalTarget.name}</span>?
              </>
            ) : null}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!modalTarget) return;
                try {
                  await apiRequest(
                    "DELETE",
                    `/api/career-paths/${encodeURIComponent(modalTarget.docId)}`,
                  );
                  await refetchSaved();
                  setDeleteOpen(false);
                } catch {
                  toast({
                    title: "Delete failed",
                    description: "Please try again later.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal for Free User Limits */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="careerPath"
      />
    </div>
  );
}
