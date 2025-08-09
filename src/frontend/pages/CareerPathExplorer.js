import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, ArrowRight, TrendingUp, Sparkles, BriefcaseBusiness, Award, Braces, Cpu, LineChart, User, Database, Layers, Lightbulb, GraduationCap, DollarSign, Calendar, BookOpen, Loader2, MapPin, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Individual certification card component
const CertificationCard = ({ cert, onAddAsGoal, isLoading }) => {
    return (_jsxs("div", { className: "border rounded-lg p-4 transition-all hover:shadow-md", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: cert.name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Provider: ", cert.provider] })] }), _jsx(Badge, { className: cert.relevance === 'highly relevant' ? 'bg-green-100 text-green-800' :
                            cert.relevance === 'relevant' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800', children: cert.relevance })] }), _jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(GraduationCap, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsxs("span", { className: "text-muted-foreground", children: [cert.difficulty, " level"] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx("span", { className: "text-muted-foreground", children: cert.estimatedTimeToComplete })] })] }), _jsx("div", { className: "mt-3 pt-2 border-t", children: _jsx(Button, { variant: "outline", size: "sm", className: "w-full text-xs", onClick: () => onAddAsGoal(cert), disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-1 h-3 w-3 animate-spin" }), "Adding as Goal..."] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "mr-1 h-3 w-3" }), "Add as Career Goal"] })) }) })] }));
};
// Main certification list component
const CertificationList = ({ certifications }) => {
    const { toast } = useToast();
    const [isLoadingMap, setIsLoadingMap] = useState({});
    const navigate = (path) => window.location.href = path;
    // Create certification goal handler
    const handleAddAsGoal = async (cert) => {
        // Create a unique key for this certification
        const certKey = `${cert.name}-${cert.provider}`;
        try {
            // Set loading state for this specific certification
            setIsLoadingMap(prev => ({
                ...prev,
                [certKey]: true
            }));
            // Get existing goals
            const goalsResponse = await apiRequest('GET', '/api/goals');
            const existingGoals = await goalsResponse.json();
            // Check if this certification goal already exists (by title)
            const goalTitle = `Earn ${cert.name} Certification`;
            const isDuplicate = existingGoals.some((goal) => goal.title.toLowerCase() === goalTitle.toLowerCase());
            if (isDuplicate) {
                toast({
                    title: "Goal Already Exists",
                    description: "You already have this certification in your goals.",
                    variant: "default"
                });
                return;
            }
            // Create certification goal
            const goalData = {
                title: goalTitle,
                description: `Complete the ${cert.name} certification from ${cert.provider}. This is a ${cert.difficulty} level certification that typically takes ${cert.estimatedTimeToComplete} to complete.`,
                status: "not_started",
                checklist: [
                    {
                        id: crypto.randomUUID(),
                        text: `Research ${cert.name} certification details and requirements`,
                        completed: false
                    },
                    {
                        id: crypto.randomUUID(),
                        text: `Find and register for preparation courses or materials`,
                        completed: false
                    },
                    {
                        id: crypto.randomUUID(),
                        text: `Schedule study time for certification preparation`,
                        completed: false
                    },
                    {
                        id: crypto.randomUUID(),
                        text: `Register for the certification exam`,
                        completed: false
                    },
                    {
                        id: crypto.randomUUID(),
                        text: `Complete the certification exam`,
                        completed: false
                    }
                ]
            };
            // Save the goal
            const response = await apiRequest('POST', '/api/goals', goalData);
            if (response.ok) {
                toast({
                    title: "Certification Goal Created",
                    description: `"${goalTitle}" has been added to your career goals.`,
                    action: (_jsx(Button, { variant: "outline", size: "sm", onClick: () => navigate('/goals'), children: "View Goal" })),
                });
            }
            else {
                throw new Error("Failed to create goal");
            }
        }
        catch (error) {
            console.error("Error creating certification goal:", error);
            toast({
                title: "Error Creating Goal",
                description: "There was a problem adding this certification as a goal.",
                variant: "destructive"
            });
        }
        finally {
            // Clear loading state
            setIsLoadingMap(prev => ({
                ...prev,
                [certKey]: false
            }));
        }
    };
    return (_jsx(_Fragment, { children: certifications.map((cert, index) => {
            // Create a unique key for this certification
            const certKey = `${cert.name}-${cert.provider}`;
            return (_jsx(CertificationCard, { cert: cert, onAddAsGoal: handleAddAsGoal, isLoading: isLoadingMap[certKey] || false }, `${cert.name}-${index}`));
        }) }));
};
const LevelBadgeColors = {
    'entry': 'bg-blue-100 text-blue-800',
    'mid': 'bg-green-100 text-green-800',
    'senior': 'bg-purple-100 text-purple-800',
    'lead': 'bg-yellow-100 text-yellow-800',
    'executive': 'bg-red-100 text-red-800',
};
const SkillLevelColors = {
    'basic': 'bg-slate-100 text-slate-800',
    'intermediate': 'bg-amber-100 text-amber-800',
    'advanced': 'bg-emerald-100 text-emerald-800',
};
const GrowthIndicators = {
    'low': {
        icon: _jsx(TrendingUp, { className: "h-4 w-4" }),
        text: 'Low Growth',
        color: 'text-amber-500'
    },
    'medium': {
        icon: _jsx(TrendingUp, { className: "h-4 w-4" }),
        text: 'Medium Growth',
        color: 'text-blue-500'
    },
    'high': {
        icon: _jsx(Sparkles, { className: "h-4 w-4" }),
        text: 'High Growth',
        color: 'text-green-500'
    }
};
// Sample data for career paths
const softwareEngineeringPath = {
    id: 'software-engineering',
    name: 'Software Engineering',
    nodes: [
        {
            id: 'junior-developer',
            title: 'Junior Developer',
            level: 'entry',
            salaryRange: '$60,000 - $85,000',
            yearsExperience: '0-2 years',
            skills: [
                { name: 'JavaScript', level: 'intermediate' },
                { name: 'HTML/CSS', level: 'intermediate' },
                { name: 'Git', level: 'basic' },
                { name: 'React', level: 'basic' }
            ],
            growthPotential: 'high',
            description: 'Builds and maintains web applications under supervision. Focuses on learning coding standards and processes.',
            icon: _jsx(Braces, { className: "h-6 w-6 text-primary" })
        },
        {
            id: 'mid-level-developer',
            title: 'Mid-Level Developer',
            level: 'mid',
            salaryRange: '$85,000 - $120,000',
            yearsExperience: '2-5 years',
            skills: [
                { name: 'JavaScript', level: 'advanced' },
                { name: 'TypeScript', level: 'intermediate' },
                { name: 'React', level: 'intermediate' },
                { name: 'Node.js', level: 'intermediate' },
                { name: 'SQL', level: 'basic' }
            ],
            growthPotential: 'high',
            description: 'Works independently on features and resolves complex bugs. Mentors junior developers and contributes to technical decisions.',
            icon: _jsx(Cpu, { className: "h-6 w-6 text-primary" })
        },
        {
            id: 'senior-developer',
            title: 'Senior Developer',
            level: 'senior',
            salaryRange: '$120,000 - $160,000',
            yearsExperience: '5-8 years',
            skills: [
                { name: 'JavaScript/TypeScript', level: 'advanced' },
                { name: 'System Design', level: 'intermediate' },
                { name: 'Cloud Services', level: 'intermediate' },
                { name: 'Performance Optimization', level: 'intermediate' },
                { name: 'CI/CD', level: 'intermediate' }
            ],
            growthPotential: 'medium',
            description: 'Leads development of complex features and architecture. Mentors team members and influences technical strategy.',
            icon: _jsx(Database, { className: "h-6 w-6 text-primary" })
        },
        {
            id: 'lead-developer',
            title: 'Lead Developer',
            level: 'lead',
            salaryRange: '$150,000 - $190,000',
            yearsExperience: '8-12 years',
            skills: [
                { name: 'Architecture Design', level: 'advanced' },
                { name: 'Team Leadership', level: 'intermediate' },
                { name: 'Project Planning', level: 'intermediate' },
                { name: 'Cross-team Collaboration', level: 'intermediate' }
            ],
            growthPotential: 'medium',
            description: 'Oversees multiple teams or complex projects. Responsible for technical excellence, mentorship, and delivery.',
            icon: _jsx(BriefcaseBusiness, { className: "h-6 w-6 text-primary" })
        },
        {
            id: 'engineering-manager',
            title: 'Engineering Manager',
            level: 'lead',
            salaryRange: '$170,000 - $210,000',
            yearsExperience: '10+ years',
            skills: [
                { name: 'Team Management', level: 'advanced' },
                { name: 'Project Management', level: 'advanced' },
                { name: 'Strategic Planning', level: 'intermediate' },
                { name: 'Budget Management', level: 'intermediate' }
            ],
            growthPotential: 'medium',
            description: 'Manages teams of developers, focusing on people development, process improvement, and project delivery.',
            icon: _jsx(User, { className: "h-6 w-6 text-primary" })
        },
        {
            id: 'cto',
            title: 'Chief Technology Officer',
            level: 'executive',
            salaryRange: '$200,000 - $300,000+',
            yearsExperience: '15+ years',
            skills: [
                { name: 'Technology Strategy', level: 'advanced' },
                { name: 'Executive Leadership', level: 'advanced' },
                { name: 'Business Acumen', level: 'advanced' },
                { name: 'Innovation Management', level: 'advanced' }
            ],
            growthPotential: 'low',
            description: 'Sets technical vision and strategy. Responsible for all aspects of technology and engineering across the organization.',
            icon: _jsx(Award, { className: "h-6 w-6 text-primary" })
        }
    ]
};
const dataAnalyticsPath = {
    id: 'data-analytics',
    name: 'Data Analytics',
    nodes: [
        {
            id: 'data-analyst',
            title: 'Data Analyst',
            level: 'entry',
            salaryRange: '$55,000 - $80,000',
            yearsExperience: '0-2 years',
            skills: [
                { name: 'SQL', level: 'intermediate' },
                { name: 'Excel', level: 'intermediate' },
                { name: 'Data Visualization', level: 'basic' },
                { name: 'Statistical Analysis', level: 'basic' }
            ],
            growthPotential: 'high',
            description: 'Collects, processes, and performs statistical analyses of data. Creates reports and visualizations to communicate insights.',
            icon: _jsx(LineChart, { className: "h-6 w-6 text-primary" })
        },
        {
            id: 'senior-data-analyst',
            title: 'Senior Data Analyst',
            level: 'mid',
            salaryRange: '$80,000 - $110,000',
            yearsExperience: '3-5 years',
            skills: [
                { name: 'SQL', level: 'advanced' },
                { name: 'Python/R', level: 'intermediate' },
                { name: 'Advanced Statistics', level: 'intermediate' },
                { name: 'Data Modeling', level: 'intermediate' }
            ],
            growthPotential: 'high',
            description: 'Leads complex data analysis projects and develops advanced reporting solutions. Mentors junior analysts.',
            icon: _jsx(LineChart, { className: "h-6 w-6 text-primary" })
        },
        {
            id: 'data-scientist',
            title: 'Data Scientist',
            level: 'senior',
            salaryRange: '$110,000 - $150,000',
            yearsExperience: '5-8 years',
            skills: [
                { name: 'Machine Learning', level: 'intermediate' },
                { name: 'Python', level: 'advanced' },
                { name: 'Statistical Modeling', level: 'advanced' },
                { name: 'Big Data Technologies', level: 'intermediate' }
            ],
            growthPotential: 'medium',
            description: 'Develops predictive models and algorithms. Extracts insights from complex datasets to solve business problems.',
            icon: _jsx(Cpu, { className: "h-6 w-6 text-primary" })
        },
        {
            id: 'lead-data-scientist',
            title: 'Lead Data Scientist',
            level: 'lead',
            salaryRange: '$140,000 - $180,000',
            yearsExperience: '8-12 years',
            skills: [
                { name: 'Advanced ML Algorithms', level: 'advanced' },
                { name: 'Team Leadership', level: 'intermediate' },
                { name: 'Research Methods', level: 'advanced' },
                { name: 'Strategy Development', level: 'intermediate' }
            ],
            growthPotential: 'medium',
            description: 'Leads data science teams and initiatives. Translates business problems into data science solutions and oversees implementation.',
            icon: _jsx(Database, { className: "h-6 w-6 text-primary" })
        },
        {
            id: 'chief-data-officer',
            title: 'Chief Data Officer',
            level: 'executive',
            salaryRange: '$180,000 - $250,000+',
            yearsExperience: '12+ years',
            skills: [
                { name: 'Data Strategy', level: 'advanced' },
                { name: 'Executive Leadership', level: 'advanced' },
                { name: 'Data Governance', level: 'advanced' },
                { name: 'Business Acumen', level: 'advanced' }
            ],
            growthPotential: 'low',
            description: 'Oversees all data-related activities and strategy. Responsible for data quality, governance, and leveraging data as a strategic asset.',
            icon: _jsx(Award, { className: "h-6 w-6 text-primary" })
        }
    ]
};
// Array of all career paths
const careerPaths = [softwareEngineeringPath, dataAnalyticsPath];
const roleCertifications = {
    'junior-developer': [
        {
            name: 'Web Development Fundamentals',
            provider: 'Codecademy',
            difficulty: 'beginner',
            estimatedTimeToComplete: '2-3 months',
            relevance: 'highly relevant'
        },
        {
            name: 'JavaScript Algorithms and Data Structures',
            provider: 'freeCodeCamp',
            difficulty: 'intermediate',
            estimatedTimeToComplete: '3 months',
            relevance: 'relevant'
        }
    ],
    'mid-level-developer': [
        {
            name: 'React Developer Certification',
            provider: 'Meta',
            difficulty: 'intermediate',
            estimatedTimeToComplete: '2-3 months',
            relevance: 'highly relevant'
        },
        {
            name: 'AWS Certified Developer',
            provider: 'Amazon Web Services',
            difficulty: 'intermediate',
            estimatedTimeToComplete: '3-6 months',
            relevance: 'relevant'
        }
    ],
    'senior-developer': [
        {
            name: 'Certified Kubernetes Application Developer',
            provider: 'Cloud Native Computing Foundation',
            difficulty: 'advanced',
            estimatedTimeToComplete: '3-6 months',
            relevance: 'relevant'
        },
        {
            name: 'AWS Solutions Architect Professional',
            provider: 'Amazon Web Services',
            difficulty: 'advanced',
            estimatedTimeToComplete: '6 months',
            relevance: 'relevant'
        }
    ],
    'lead-developer': [
        {
            name: 'Google Cloud Professional Cloud Architect',
            provider: 'Google Cloud',
            difficulty: 'advanced',
            estimatedTimeToComplete: '6 months',
            relevance: 'relevant'
        },
        {
            name: 'Certified Scrum Master',
            provider: 'Scrum Alliance',
            difficulty: 'intermediate',
            estimatedTimeToComplete: '1-2 months',
            relevance: 'highly relevant'
        }
    ],
    'engineering-manager': [
        {
            name: 'Project Management Professional (PMP)',
            provider: 'Project Management Institute',
            difficulty: 'advanced',
            estimatedTimeToComplete: '6 months',
            relevance: 'highly relevant'
        },
        {
            name: 'Certified ScrumMaster',
            provider: 'Scrum Alliance',
            difficulty: 'intermediate',
            estimatedTimeToComplete: '1 month',
            relevance: 'highly relevant'
        }
    ],
    'cto': [
        {
            name: 'TOGAF Enterprise Architecture Certification',
            provider: 'The Open Group',
            difficulty: 'advanced',
            estimatedTimeToComplete: '3-6 months',
            relevance: 'highly relevant'
        },
        {
            name: 'Certified Information Security Manager (CISM)',
            provider: 'ISACA',
            difficulty: 'advanced',
            estimatedTimeToComplete: '6 months',
            relevance: 'relevant'
        }
    ],
    'data-analyst': [
        {
            name: 'Google Data Analytics Professional Certificate',
            provider: 'Google',
            difficulty: 'beginner',
            estimatedTimeToComplete: '6 months',
            relevance: 'highly relevant'
        },
        {
            name: 'Microsoft Power BI Data Analyst',
            provider: 'Microsoft',
            difficulty: 'intermediate',
            estimatedTimeToComplete: '2-3 months',
            relevance: 'highly relevant'
        }
    ],
    'senior-data-analyst': [
        {
            name: 'Tableau Desktop Specialist',
            provider: 'Tableau',
            difficulty: 'intermediate',
            estimatedTimeToComplete: '2-3 months',
            relevance: 'highly relevant'
        },
        {
            name: 'SAS Certified Data Scientist',
            provider: 'SAS',
            difficulty: 'advanced',
            estimatedTimeToComplete: '6 months',
            relevance: 'relevant'
        }
    ],
    'data-scientist': [
        {
            name: 'IBM Data Science Professional Certificate',
            provider: 'IBM',
            difficulty: 'intermediate',
            estimatedTimeToComplete: '3-6 months',
            relevance: 'highly relevant'
        },
        {
            name: 'Azure Data Scientist Associate',
            provider: 'Microsoft',
            difficulty: 'advanced',
            estimatedTimeToComplete: '3-6 months',
            relevance: 'relevant'
        }
    ],
    'lead-data-scientist': [
        {
            name: 'Certified Machine Learning Engineer',
            provider: 'MLOps Foundation',
            difficulty: 'advanced',
            estimatedTimeToComplete: '6 months',
            relevance: 'highly relevant'
        },
        {
            name: 'TensorFlow Developer Certificate',
            provider: 'Google',
            difficulty: 'advanced',
            estimatedTimeToComplete: '3 months',
            relevance: 'relevant'
        }
    ],
    'chief-data-officer': [
        {
            name: 'DAMA Certified Data Management Professional',
            provider: 'DAMA International',
            difficulty: 'advanced',
            estimatedTimeToComplete: '6 months',
            relevance: 'highly relevant'
        },
        {
            name: 'Certified Chief Data Officer',
            provider: 'MIT CDOIQ Program',
            difficulty: 'advanced',
            estimatedTimeToComplete: '6-12 months',
            relevance: 'highly relevant'
        }
    ]
};
// Function to map icon string to JSX component
const getIconComponent = (iconName) => {
    // Default to Briefcase if not matched
    const iconSize = "h-6 w-6 text-primary";
    switch (iconName?.toLowerCase()) {
        case 'braces':
            return _jsx(Braces, { className: iconSize });
        case 'cpu':
            return _jsx(Cpu, { className: iconSize });
        case 'database':
            return _jsx(Database, { className: iconSize });
        case 'briefcase':
            return _jsx(BriefcaseBusiness, { className: iconSize });
        case 'user':
            return _jsx(User, { className: iconSize });
        case 'award':
            return _jsx(Award, { className: iconSize });
        case 'linechart':
            return _jsx(LineChart, { className: iconSize });
        case 'layers':
            return _jsx(Layers, { className: iconSize });
        case 'graduation':
            return _jsx(GraduationCap, { className: iconSize });
        case 'lightbulb':
            return _jsx(Lightbulb, { className: iconSize });
        case 'book':
            return _jsx(BookOpen, { className: iconSize });
        default:
            // If the icon name is not recognized or null/undefined, use a default icon
            return _jsx(BriefcaseBusiness, { className: iconSize });
    }
};
// Starter career paths removed as no longer needed
export default function CareerPathExplorer() {
    // We'll use the router for navigation instead of direct window.location
    const navigate = (path) => {
        // This is a safe way to navigate programmatically
        const link = document.createElement('a');
        link.href = path;
        link.setAttribute('data-navigation', 'true');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const { toast } = useToast();
    const [activePath, setActivePath] = useState(careerPaths[0]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isCreatingGoal, setIsCreatingGoal] = useState(false);
    const [roleCertifications, setRoleCertifications] = useState({});
    const [isLoadingCertifications, setIsLoadingCertifications] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const scrollContainerRef = useRef(null);
    // Job title search
    const [jobTitle, setJobTitle] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [generatedPath, setGeneratedPath] = useState(null);
    // 2-Mode exploration state
    const [explorationMode, setExplorationMode] = useState(() => {
        // Try to get from localStorage first
        const savedMode = localStorage.getItem('careerExplorationMode');
        if (savedMode && ['target', 'profile'].includes(savedMode)) {
            return savedMode;
        }
        // Default to 'profile' if user has required data, otherwise 'target'
        const hasRequiredData = true; // Will be set based on profile data check
        return hasRequiredData ? 'profile' : 'target';
    });
    // Query user profile data if in profile mode
    const { data: careerProfileData, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['/api/career-data/profile'],
        enabled: explorationMode === 'profile'
    });
    // Update local storage when mode changes
    useEffect(() => {
        localStorage.setItem('careerExplorationMode', explorationMode);
    }, [explorationMode]);
    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300; // Adjust as needed
            const newScrollLeft = direction === 'left'
                ? scrollContainerRef.current.scrollLeft - scrollAmount
                : scrollContainerRef.current.scrollLeft + scrollAmount;
            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };
    const selectedNode = selectedNodeId
        ? activePath.nodes.find(node => node.id === selectedNodeId)
        : null;
    const handleNodeClick = (nodeId) => {
        const isCurrentlySelected = selectedNodeId === nodeId;
        setSelectedNodeId(nodeId);
        if (!isCurrentlySelected) {
            setDrawerOpen(true);
            // Fetch AI-generated certification recommendations when a node is clicked
            fetchCertificationRecommendations(nodeId);
        }
        else {
            setDrawerOpen(!drawerOpen);
        }
    };
    // Function to fetch AI-generated certification recommendations
    const fetchCertificationRecommendations = async (nodeId) => {
        // Always attempt to fetch recommendations when a node is clicked
        // We may already have them cached, but we'll always try to get fresh data
        const node = activePath.nodes.find(n => n.id === nodeId);
        if (!node)
            return;
        try {
            setIsLoadingCertifications(true);
            // Log the API request details for debugging
            console.log(`Fetching certifications for ${node.title} (${node.level}) with ${node.skills.length} skills`);
            const response = await apiRequest('POST', '/api/career-certifications', {
                role: node.title,
                level: node.level,
                skills: node.skills
            });
            if (!response.ok) {
                throw new Error('Failed to fetch certification recommendations');
            }
            const data = await response.json();
            console.log('API Response:', data);
            // Check if we have certifications array in the response
            if (data.certifications && Array.isArray(data.certifications)) {
                // Update the certifications state with the new recommendations
                setRoleCertifications(prev => ({
                    ...prev,
                    [nodeId]: data.certifications
                }));
                console.log(`Stored ${data.certifications.length} certifications for node ${nodeId}`);
            }
            else {
                console.error('API response missing certifications array:', data);
                toast({
                    title: "Invalid Response Format",
                    description: "The server returned data in an unexpected format.",
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('Error fetching certification recommendations:', error);
            toast({
                title: "Failed to load certifications",
                description: "There was a problem retrieving AI certification recommendations.",
                variant: "destructive"
            });
        }
        finally {
            setIsLoadingCertifications(false);
        }
    };
    // Helper function for starter paths removed
    // State for path generation
    const [isGeneratingPaths, setIsGeneratingPaths] = useState(false);
    const [generatedProfilePaths, setGeneratedProfilePaths] = useState(null);
    // Function to generate AI-based career paths for the user
    const generateCareerPathsFromProfile = async () => {
        if (!careerProfileData) {
            toast({
                title: "Profile data required",
                description: "Please complete your profile information first to generate customized paths.",
                variant: "destructive"
            });
            return;
        }
        try {
            setIsGeneratingPaths(true);
            console.log("Sending profile data to API:", careerProfileData);
            // Make the API call to our new endpoint
            const response = await apiRequest("POST", "/api/career-paths/generate", {
                profileData: careerProfileData
            });
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const data = await response.json();
            console.log("API Response:", data);
            // Check if the data has paths array from the AI-generated response
            if (data.paths && data.paths.length > 0) {
                // Process the paths to ensure they have proper icon components
                const processedPaths = data.paths.map((path) => ({
                    ...path,
                    nodes: path.nodes.map((node) => ({
                        ...node,
                        icon: getIconComponent(node.icon) // Convert string icon names to React components
                    }))
                }));
                setGeneratedProfilePaths(processedPaths);
                toast({
                    title: "Paths Generated",
                    description: "We've analyzed your profile and generated personalized career paths.",
                    variant: "default"
                });
            }
            else {
                // If no paths were generated, show a toast but don't use default paths
                toast({
                    title: "Path Generation Failed",
                    description: "We couldn't generate personalized paths. Please complete more of your profile and try again.",
                    variant: "destructive"
                });
                // Don't set any placeholder paths
                setGeneratedProfilePaths(null);
            }
        }
        catch (error) {
            console.error("Error generating career paths:", error);
            toast({
                title: "Generation Failed",
                description: "An error occurred while generating your personalized career paths.",
                variant: "destructive"
            });
            // Set generatedProfilePaths to null to ensure no placeholder paths are shown
            setGeneratedProfilePaths(null);
        }
        finally {
            setIsGeneratingPaths(false);
        }
    };
    // Helper function to render the Profile-based Paths view
    const renderProfileBasedPaths = () => {
        if (isLoadingProfile) {
            return (_jsxs("div", { className: "flex items-center justify-center py-12 mt-6 border border-dashed rounded-lg border-gray-300 bg-gray-50/50", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }), _jsx("span", { className: "ml-3", children: "Loading your career profile data..." })] }));
        }
        // Force hasCompleteProfile to true for testing
        const hasCompleteProfile = true;
        if (!hasCompleteProfile) {
            return (_jsxs("div", { className: "text-center py-16 px-6 mt-6 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-md shadow-gray-200 border border-gray-100 w-full", children: [_jsx("div", { className: "bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm", children: _jsx(User, { className: "h-10 w-10 text-blue-500" }) }), _jsx("h3", { className: "text-2xl font-medium mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent", children: "Complete Your Profile" }), _jsx("p", { className: "text-neutral-500 mb-6 max-w-md mx-auto", children: "Add your work history, education, and skills in Account Settings to get personalized career path suggestions." }), _jsx(Button, { size: "lg", className: "bg-[#1333c2] hover:bg-[#0f2aae] text-white shadow-sm hover:shadow-lg transition-all", asChild: true, children: _jsx("a", { href: "/account/career", children: "Complete Your Profile" }) })] }));
        }
        return (_jsxs("div", { className: "mt-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-semibold", children: "Career Paths Based on Your Profile" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "These paths are suggested based on your current role, skills, and experience." })] }), _jsx(Button, { className: "bg-[#1333c2] hover:bg-[#0f2aae] text-white mt-4 sm:mt-0 w-full sm:w-auto", onClick: generateCareerPathsFromProfile, disabled: isGeneratingPaths, children: isGeneratingPaths ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Generating Paths..."] })) : (_jsxs(_Fragment, { children: [_jsx(Sparkles, { className: "mr-2 h-4 w-4" }), "Generate Paths"] })) })] }), isGeneratingPaths ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-16 px-6 mt-6 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-md shadow-gray-200 border border-gray-100 w-full", children: [_jsx(Loader2, { className: "h-10 w-10 text-primary animate-spin mb-4" }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "Analyzing Your Profile" }), _jsx("p", { className: "text-muted-foreground text-center max-w-md", children: "We're using AI to analyze your skills, experience, and education to generate personalized career path recommendations." })] })) : generatedProfilePaths ? (_jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: generatedProfilePaths.map((path) => (_jsx(Card, { className: "overflow-hidden h-full", children: _jsxs(CardContent, { className: "p-6 flex flex-col h-full", children: [_jsx("h3", { className: "text-xl font-medium mb-4", children: path.name }), _jsx("div", { className: "space-y-4 flex-grow", children: path.nodes.slice(0, 3).map((node, index) => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "rounded-full p-2 bg-primary/10 shrink-0", children: node.icon }), _jsxs("div", { className: "min-w-0 flex-grow", children: [" ", _jsx("h4", { className: "font-medium truncate", children: node.title }), _jsx("p", { className: "text-sm text-muted-foreground mt-1 line-clamp-2", children: node.description }), _jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: _jsx(Badge, { variant: "outline", className: `${LevelBadgeColors[node.level]} text-xs`, children: node.level.charAt(0).toUpperCase() + node.level.slice(1) }) })] })] }, node.id))) }), _jsx(Button, { variant: "outline", className: "w-full mt-4", onClick: () => {
                                        // Set this path as active path
                                        setActivePath(path);
                                        // Switch to target role mode to show the full path view
                                        setExplorationMode('target');
                                        // Clear any selected node
                                        setSelectedNodeId(null);
                                        // Save this path as the generated path so it shows in target mode
                                        setGeneratedPath(path);
                                        // Scroll to the top of the page to show the full path
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        // Notify the user
                                        toast({
                                            title: "Path Loaded",
                                            description: `Now viewing the complete "${path.name}" career path.`,
                                        });
                                    }, children: "View Full Path" })] }) }, path.id))) })) : (_jsxs("div", { className: "flex flex-col items-center justify-center py-16 px-6 mt-6 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-md shadow-gray-200 border border-gray-100 w-full", children: [_jsx("div", { className: "bg-white w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm", children: _jsx(Sparkles, { className: "h-8 w-8 sm:h-10 sm:w-10 text-blue-500" }) }), _jsx("h3", { className: "text-xl sm:text-2xl font-medium mb-2 sm:mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent", children: "Generate Personalized Career Paths" }), _jsx("p", { className: "text-neutral-500 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base text-center", children: "Click the \"Generate Paths\" button above to create AI-powered career path recommendations based on your profile data." })] }))] }));
    };
    return (_jsxs("div", { className: "space-y-6 px-2 sm:px-4 md:px-6", children: [_jsx("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold mb-2 text-[#0C29AB]", children: "Career Path Explorer" }), _jsx("p", { className: "text-muted-foreground mt-1 text-sm sm:text-base", children: "Visualize potential career progressions and explore different roles." })] }) }), _jsx("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6", children: _jsx(Tabs, { value: explorationMode, onValueChange: (value) => setExplorationMode(value), className: "w-auto", children: _jsxs(TabsList, { className: "mb-4 bg-gray-100 rounded-md p-1", role: "tablist", children: [_jsx(TabsTrigger, { value: "target", className: "rounded-md transition-all duration-200 ease-in-out flex items-center justify-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm", role: "tab", "aria-selected": explorationMode === 'target', tabIndex: explorationMode === 'target' ? 0 : -1, children: _jsx("span", { children: "Search Target Role" }) }), _jsx(TabsTrigger, { value: "profile", className: "rounded-md transition-all duration-200 ease-in-out flex items-center justify-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm", role: "tab", "aria-selected": explorationMode === 'profile', tabIndex: explorationMode === 'profile' ? 0 : -1, children: _jsx("span", { children: "Suggested Paths for Me" }) })] }) }) }), explorationMode === 'profile' && renderProfileBasedPaths(), explorationMode === 'target' && (_jsxs("div", { className: "mb-6 mt-6 space-y-2", children: [_jsx(Label, { htmlFor: "job-title-search", className: "text-sm sm:text-base", children: "Quick Career Path Generator" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2 items-start sm:items-center", children: [_jsx("div", { className: "flex-1 w-full", children: _jsx(Input, { id: "job-title-search", placeholder: "Enter a job title (e.g., Software Engineer, Data Scientist)", value: jobTitle, onChange: (e) => setJobTitle(e.target.value), className: "text-sm sm:text-base" }) }), _jsx(Button, { onClick: () => {
                                    if (!jobTitle.trim()) {
                                        toast({
                                            title: "Job title required",
                                            description: "Please enter a job title to generate a career path.",
                                            variant: "destructive"
                                        });
                                        return;
                                    }
                                    setIsSearching(true);
                                    apiRequest('POST', '/api/career-path/generate-from-job', {
                                        jobTitle: jobTitle.trim()
                                    })
                                        .then(res => res.json())
                                        .then(data => {
                                        console.log('API Response:', data);
                                        // Check if the data has a 'paths' array (from the OpenAI response)
                                        if (data.paths && data.paths.length > 0) {
                                            // The first path in the paths array is the main career path
                                            const mainPath = data.paths[0];
                                            // Make sure it has the required format
                                            if (mainPath && mainPath.nodes && mainPath.nodes.length > 0) {
                                                // Process the nodes to add proper icon components
                                                const processedPath = {
                                                    ...mainPath,
                                                    nodes: mainPath.nodes.map((node) => {
                                                        // Map the icon string to an actual React component
                                                        const iconComponent = getIconComponent(node.icon);
                                                        return {
                                                            ...node,
                                                            icon: iconComponent
                                                        };
                                                    })
                                                };
                                                // Set this as the generated path
                                                setGeneratedPath(processedPath);
                                                setActivePath(processedPath);
                                                toast({
                                                    title: "Career Path Generated",
                                                    description: `Career path for "${jobTitle}" has been generated successfully.`,
                                                });
                                            }
                                            else {
                                                throw new Error('Invalid path structure returned');
                                            }
                                        }
                                        else {
                                            throw new Error('No valid career paths found in response');
                                        }
                                        setIsSearching(false);
                                    })
                                        .catch(err => {
                                        console.error('Error generating career path:', err);
                                        setIsSearching(false);
                                        toast({
                                            title: "Error",
                                            description: `Failed to generate career path: ${err.message || 'Unknown error'}`,
                                            variant: "destructive"
                                        });
                                    });
                                }, disabled: isSearching || !jobTitle.trim(), className: "min-w-[120px] bg-[#1333c2] hover:bg-[#0f2aae] text-white", children: isSearching ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Generating..."] })) : (_jsx(_Fragment, { children: "Generate" })) })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Quickly generate a career path based on a specific job title" })] })), explorationMode === 'target' && generatedPath && (_jsx("div", { className: "flex flex-wrap gap-2 mb-6", children: _jsxs(Button, { onClick: () => {
                        setActivePath(generatedPath);
                        setSelectedNodeId(null);
                    }, className: "bg-[#1333c2] hover:bg-[#0f2aae] text-white shadow-sm hover:shadow-lg transition-all", children: [_jsx(Sparkles, { className: "h-4 w-4 mr-2" }), generatedPath.name || `${jobTitle} Path`] }) })), explorationMode === 'target' && generatedPath && (_jsxs("div", { className: "relative mt-8", children: [_jsx("h2", { className: "text-xl sm:text-2xl font-bold mb-4 sm:mb-6", children: "Career Path Progression" }), _jsx("div", { className: "sm:hidden space-y-4 pb-10", children: activePath.nodes.map((node, index) => (_jsxs(motion.div, { className: cn("cursor-pointer transition-all relative", selectedNodeId === node.id ? "scale-[1.02]" : "hover:scale-[1.02]"), initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.1 }, onClick: () => handleNodeClick(node.id), children: [_jsx(Card, { className: cn("shadow-md h-full", selectedNodeId === node.id ? "border-primary ring-1 ring-primary" : ""), children: _jsxs(CardContent, { className: "p-4 flex flex-col h-full", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("div", { className: "mt-1", children: node.icon }), _jsx(Badge, { className: LevelBadgeColors[node.level], children: node.level.charAt(0).toUpperCase() + node.level.slice(1) })] }), _jsxs("div", { className: "flex-grow", children: [_jsx("h3", { className: "font-bold text-lg mb-1 truncate", children: node.title }), _jsx("div", { className: "text-sm text-muted-foreground mb-2", children: node.salaryRange }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Experience: ", node.yearsExperience] })] }), _jsxs("div", { className: cn("flex items-center gap-1 text-xs mt-3", GrowthIndicators[node.growthPotential].color), children: [GrowthIndicators[node.growthPotential].icon, GrowthIndicators[node.growthPotential].text] })] }) }), index < activePath.nodes.length - 1 && (_jsx("div", { className: "flex justify-center my-2", children: _jsx("div", { className: "rotate-90 text-gray-400", children: _jsx(ArrowRight, { className: "h-5 w-5" }) }) }))] }, node.id))) }), _jsxs("div", { className: "relative mx-4 sm:mx-14 hidden sm:block", children: [_jsx("div", { className: "absolute left-[-30px] sm:left-[-40px] top-1/2 -translate-y-1/2 z-10", children: _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleScroll('left'), className: "h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-md hover:bg-gray-100", children: _jsx(ChevronLeft, { className: "h-4 w-4 sm:h-6 sm:w-6" }) }) }), _jsxs("div", { ref: scrollContainerRef, className: "pb-6 px-2 overflow-x-auto scrollbar-hide relative flex items-start gap-4", style: {
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                }, children: [_jsx("div", { className: "absolute top-20 left-0 right-10 h-1 bg-gray-200" }), activePath.nodes.map((node, index) => (_jsx("div", { className: "flex flex-col items-center min-w-[230px] sm:min-w-[250px] first:pl-4", children: _jsxs(motion.div, { className: cn("cursor-pointer transition-all relative mt-4", selectedNodeId === node.id ? "scale-105" : "hover:scale-105"), initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.1 }, onClick: () => handleNodeClick(node.id), children: [_jsx(Card, { className: cn("w-[230px] sm:w-60 shadow-md h-full", selectedNodeId === node.id ? "border-primary ring-1 ring-primary" : ""), children: _jsxs(CardContent, { className: "p-4 flex flex-col h-full", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("div", { className: "mt-1", children: node.icon }), _jsx(Badge, { className: LevelBadgeColors[node.level], children: node.level.charAt(0).toUpperCase() + node.level.slice(1) })] }), _jsxs("div", { className: "flex-grow", children: [_jsx("h3", { className: "font-bold text-base sm:text-lg mb-1 truncate", children: node.title }), _jsx("div", { className: "text-sm text-muted-foreground mb-2", children: node.salaryRange }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Experience: ", node.yearsExperience] })] }), _jsxs("div", { className: cn("flex items-center gap-1 text-xs mt-3", GrowthIndicators[node.growthPotential].color), children: [GrowthIndicators[node.growthPotential].icon, GrowthIndicators[node.growthPotential].text] })] }) }), index < activePath.nodes.length - 1 && (_jsx("div", { className: "absolute -right-6 top-1/2 transform -translate-y-1/2 text-gray-400", children: _jsx(ArrowRight, { className: "h-5 w-5" }) }))] }) }, node.id)))] }), _jsx("div", { className: "absolute right-[-30px] sm:right-[-40px] top-1/2 -translate-y-1/2 z-10", children: _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleScroll('right'), className: "h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-md hover:bg-gray-100", children: _jsx(ChevronRight, { className: "h-4 w-4 sm:h-6 sm:w-6" }) }) })] })] })), explorationMode === 'target' && !generatedPath && (_jsxs(motion.div, { className: "text-center py-10 sm:py-16 px-4 sm:px-6 mt-6 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-md shadow-gray-200 border border-gray-100 w-full", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, children: [_jsx("div", { className: "bg-white w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm", children: _jsx(MapPin, { className: "h-8 w-8 sm:h-10 sm:w-10 text-blue-500" }) }), _jsx("h3", { className: "text-xl sm:text-2xl font-medium mb-2 sm:mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent", children: "You haven't generated any career paths yet" }), _jsx("p", { className: "text-neutral-500 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base", children: "Enter a job title above and click \"Generate\" to explore a personalized career progression path." })] })), _jsx(Dialog, { open: drawerOpen && selectedNode !== null, onOpenChange: setDrawerOpen, children: selectedNode && (_jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { className: "px-4 sm:px-6", children: [_jsxs("div", { className: "flex items-center gap-2 sm:gap-3 mb-1", children: [selectedNode.icon, _jsx(DialogTitle, { className: "text-xl sm:text-2xl", children: selectedNode.title })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [_jsxs(Badge, { className: LevelBadgeColors[selectedNode.level], children: [selectedNode.level.charAt(0).toUpperCase() + selectedNode.level.slice(1), " Level"] }), _jsx("span", { className: "text-muted-foreground hidden sm:inline", children: "\u00B7" }), _jsx("span", { className: "text-muted-foreground", children: selectedNode.salaryRange }), _jsx("span", { className: "text-muted-foreground hidden sm:inline", children: "\u00B7" }), _jsxs("span", { className: "text-muted-foreground", children: [selectedNode.yearsExperience, " experience"] })] }), _jsx(DialogDescription, { className: "text-sm sm:text-base", children: "Explore this role's requirements, growth potential, and recommended certifications" })] }), _jsx("div", { className: "px-4 sm:px-6 pb-6", children: _jsxs(Tabs, { defaultValue: "overview", className: "w-full", value: activeTab, 
                                // When tab changes, update state and ensure we have up-to-date data
                                onValueChange: (value) => {
                                    setActiveTab(value);
                                    if (value === "certifications" && selectedNode) {
                                        // If we don't have certifications yet for this node, fetch them
                                        if (!roleCertifications[selectedNode.id] || roleCertifications[selectedNode.id].length === 0) {
                                            fetchCertificationRecommendations(selectedNode.id);
                                        }
                                    }
                                }, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "overview", className: "text-xs sm:text-sm", children: "Overview" }), _jsx(TabsTrigger, { value: "skills", className: "text-xs sm:text-sm", children: "Skills & Reqs" }), _jsx(TabsTrigger, { value: "certifications", className: "text-xs sm:text-sm", children: "Certifications" })] }), _jsxs(TabsContent, { value: "overview", className: "mt-4 space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Role Description" }), _jsx("p", { className: "text-muted-foreground", children: selectedNode.description })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Growth Outlook" }), _jsx("div", { className: "flex items-center gap-2", children: _jsxs("div", { className: cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md", GrowthIndicators[selectedNode.growthPotential].color, "bg-opacity-10"), children: [GrowthIndicators[selectedNode.growthPotential].icon, _jsxs("span", { className: "font-medium", children: [GrowthIndicators[selectedNode.growthPotential].text, " Potential"] })] }) }), _jsxs("p", { className: "text-muted-foreground mt-2", children: [selectedNode.growthPotential === 'high' && "This role has excellent growth prospects with many advancement opportunities.", selectedNode.growthPotential === 'medium' && "This role offers good growth opportunities with moderate advancement potential.", selectedNode.growthPotential === 'low' && "This role has reached a senior level with specialized growth focused on expertise rather than title progression."] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Compensation Details" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(DollarSign, { className: "h-4 w-4 text-primary" }), _jsxs("span", { children: ["Salary range: ", selectedNode.salaryRange] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-primary" }), _jsxs("span", { children: ["Experience: ", selectedNode.yearsExperience] })] })] })] }), _jsxs("div", { className: "pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 pb-4", children: [_jsx(Button, { className: "bg-[#1333c2] hover:bg-[#0f2aae] text-white px-4 w-full sm:w-auto", size: "sm", disabled: isCreatingGoal, onClick: async () => {
                                                            // Check if we have existing goals to avoid duplicates
                                                            try {
                                                                // Show loading state
                                                                setIsCreatingGoal(true);
                                                                // Get existing goals
                                                                const goalsResponse = await apiRequest('GET', '/api/goals');
                                                                const existingGoals = await goalsResponse.json();
                                                                // Check if this goal already exists (by title)
                                                                const goalTitle = `Become a ${selectedNode.title}`;
                                                                const isDuplicate = existingGoals.some((goal) => goal.title.toLowerCase() === goalTitle.toLowerCase());
                                                                if (isDuplicate) {
                                                                    toast({
                                                                        title: "Goal Already Exists",
                                                                        description: "You already have this career goal in your tracker.",
                                                                        variant: "default"
                                                                    });
                                                                    setIsCreatingGoal(false);
                                                                    return;
                                                                }
                                                                // Create the goal
                                                                const goalData = {
                                                                    title: goalTitle,
                                                                    description: `Career goal to become a ${selectedNode.title} in the ${activePath.name} industry. Salary range: ${selectedNode.salaryRange}.`,
                                                                    status: "not_started",
                                                                    checklist: [
                                                                        {
                                                                            id: crypto.randomUUID(),
                                                                            text: `Research required skills for ${selectedNode.title} role`,
                                                                            completed: false
                                                                        },
                                                                        {
                                                                            id: crypto.randomUUID(),
                                                                            text: `Identify training or certification needs`,
                                                                            completed: false
                                                                        },
                                                                        {
                                                                            id: crypto.randomUUID(),
                                                                            text: `Update resume to target this role`,
                                                                            completed: false
                                                                        },
                                                                        {
                                                                            id: crypto.randomUUID(),
                                                                            text: `Network with professionals in this field`,
                                                                            completed: false
                                                                        }
                                                                    ]
                                                                };
                                                                // Save the goal
                                                                const response = await apiRequest('POST', '/api/goals', goalData);
                                                                if (response.ok) {
                                                                    // Close the dialog
                                                                    setDrawerOpen(false);
                                                                    toast({
                                                                        title: "Career Goal Created",
                                                                        description: `"${goalTitle}" has been added to your career goals tracker. You can view it in the Career Goals section.`,
                                                                        action: (_jsx(Button, { variant: "outline", size: "sm", onClick: () => navigate('/goals'), children: "View Goal" })),
                                                                    });
                                                                }
                                                                else {
                                                                    throw new Error("Failed to create goal");
                                                                }
                                                            }
                                                            catch (error) {
                                                                console.error("Error creating career goal:", error);
                                                                toast({
                                                                    title: "Error Creating Goal",
                                                                    description: "There was a problem creating your career goal. Please try again.",
                                                                    variant: "destructive"
                                                                });
                                                            }
                                                            finally {
                                                                setIsCreatingGoal(false);
                                                            }
                                                        }, children: isCreatingGoal ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Creating Goal..."] })) : (_jsx(_Fragment, { children: "Set as Career Goal" })) }), _jsx(DialogClose, { asChild: true, children: _jsx(Button, { variant: "outline", size: "sm", className: "w-full sm:w-auto", children: "Close" }) })] })] }), _jsxs(TabsContent, { value: "skills", className: "mt-4 space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Key Skills" }), _jsx("div", { className: "flex flex-wrap gap-2 mb-6", children: selectedNode.skills.map(skill => (_jsxs(Badge, { className: cn("py-1.5 px-3", SkillLevelColors[skill.level]), children: [skill.name, " ", _jsxs("span", { className: "opacity-80", children: ["(", skill.level, ")"] })] }, skill.name))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Typical Requirements" }), _jsxs("ul", { className: "space-y-1 text-muted-foreground list-disc pl-5", children: [_jsxs("li", { children: ["Education: ", selectedNode.level === 'entry' ? 'Bachelor\'s degree or equivalent experience' : 'Bachelor\'s or Master\'s degree in relevant field'] }), _jsxs("li", { children: ["Experience: ", selectedNode.yearsExperience] }), selectedNode.level === 'executive' && _jsx("li", { children: "Leadership: 5+ years in senior leadership roles" }), selectedNode.level === 'lead' && _jsx("li", { children: "Leadership: Experience managing teams or technical projects" }), _jsxs("li", { children: ["Communication: ", selectedNode.level === 'entry' ? 'Basic' : selectedNode.level === 'mid' ? 'Intermediate' : 'Advanced', " communication skills"] })] })] })] }), _jsx(TabsContent, { value: "certifications", className: "mt-4 space-y-4", children: _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "AI Recommended Certifications" }), isLoadingCertifications && (_jsxs("div", { className: "flex items-center", children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin mr-2 text-muted-foreground" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "Loading recommendations..." })] }))] }), isLoadingCertifications ? (_jsxs("div", { className: "py-8 flex flex-col items-center justify-center", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary mb-2" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Generating personalized AI certification recommendations..." })] })) : roleCertifications[selectedNode.id] && roleCertifications[selectedNode.id].length > 0 ? (_jsx("div", { className: "space-y-4", children: _jsx(CertificationList, { certifications: roleCertifications[selectedNode.id] }) })) : (_jsxs("div", { className: "text-center py-8 border border-dashed rounded-lg", children: [_jsx(GraduationCap, { className: "h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" }), _jsx("p", { className: "text-muted-foreground", children: "No certification recommendations available for this role yet." }), _jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "We're searching for relevant certifications. Please check back in a moment." })] })), _jsx("div", { className: "mt-6 pt-3 border-t text-xs text-muted-foreground", children: _jsx("p", { children: "Certification recommendations are AI-generated based on current industry trends and role requirements. Always verify the relevance and accreditation status before enrolling." }) })] }) })] }) })] })) })] }));
}
