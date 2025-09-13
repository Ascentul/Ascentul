import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useUser, useIsAdminUser, useIsUniversityUser } from '@/lib/useUserData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import ProfileImageUploader from './ProfileImageUploader';
import { motion, AnimatePresence } from 'framer-motion';
import ascentulLogo from '@/assets/ascentul-logo.png';
import { LayoutDashboard, Target, FileText, Mail, UserRound, Briefcase, Bot, Settings, LogOut, GraduationCap, BookOpen, School, ShieldCheck, GitBranch, FolderGit2, Search, ChevronRight, LineChart, PanelLeft, PanelRight, ChevronsLeft, HelpCircle, Bell, Zap } from 'lucide-react';
export default function Sidebar({ isOpen, onToggle } = {}) {
    const [location] = useLocation();
    const { user, logout, updateUser, updateProfile, uploadProfileImage } = useUser();
    const isUnivUser = useIsUniversityUser();
    const isAdmin = useIsAdminUser();
    // Check if user is on free plan and not a university admin
    const isFreeUser = user?.subscriptionPlan === 'free' && user?.role !== 'university_admin';
    const sidebarRef = useRef(null);
    const [activeSection, setActiveSection] = useState(null);
    const [hoverSection, setHoverSection] = useState(null);
    const [expanded, setExpanded] = useState(localStorage.getItem('sidebarExpanded') !== 'false');
    const [menuPositions, setMenuPositions] = useState({});
    // Support ticket related state
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [issueType, setIssueType] = useState('Other'); // Default issue type
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Notifications related state
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    // Update menu positions when active section changes
    useEffect(() => {
        if (!expanded && activeSection) {
            const element = document.querySelector(`[data-section-id="${activeSection}"]`);
            if (element) {
                setMenuPositions(prev => ({
                    ...prev,
                    [activeSection]: element.getBoundingClientRect().top
                }));
            }
        }
    }, [activeSection, expanded]);
    // Handle click outside for collapsed sidebar popup menus
    useEffect(() => {
        if (!expanded && activeSection) {
            const handleClickOutside = (event) => {
                // Check if the click is outside the sidebar and the active popup
                const sidebar = sidebarRef.current;
                const popup = document.querySelector(`.popup-menu-${activeSection}`);
                if (sidebar && popup &&
                    !sidebar.contains(event.target) &&
                    !popup.contains(event.target)) {
                    setActiveSection(null);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [expanded, activeSection]);
    // Auto-detect the current section based on location
    useEffect(() => {
        if (location.startsWith('/application-tracker') || location.startsWith('/apply')) {
            setActiveSection('job-search');
        }
        else if (location.startsWith('/goals') || location.startsWith('/career-path') || location.startsWith('/contacts')) {
            setActiveSection('career-growth');
        }
        else if (location.startsWith('/projects') || location.startsWith('/resume') || location.startsWith('/cover-letter')) {
            setActiveSection('portfolio');
        }
        else if (location.startsWith('/ai-coach')) {
            setActiveSection('ai-coach');
        }
        else if (location.startsWith('/exit-plan') || location.startsWith('/momentum-coach') || location.startsWith('/weekly-recap')) {
            setActiveSection('planning');
        }
        else {
            setActiveSection(null);
        }
    }, [location]);
    // Toggle sidebar expanded state
    const toggleSidebar = () => {
        const newState = !expanded;
        setExpanded(newState);
        localStorage.setItem('sidebarExpanded', newState.toString());
        if (!newState) {
            setActiveSection(null);
        }
    };
    // Fetch notifications when modal opens
    useEffect(() => {
        if (showNotifications) {
            fetchNotifications();
        }
    }, [showNotifications]);
    // Fetch notifications function
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            setNotifications(data.notifications || []);
            // Optionally mark them as read
            await fetch('/api/notifications/mark-read', { method: 'POST' });
        }
        catch (error) {
            console.error('Error fetching notifications:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Handle support ticket submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject || !description) {
            alert('Please fill out all required fields');
            return;
        }
        if (!user) {
            alert('You must be logged in to submit a support ticket');
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/support-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject,
                    description,
                    userId: user?.id,
                    userEmail: user?.email,
                    source: 'in-app',
                    issueType: issueType,
                    timestamp: new Date().toISOString(),
                }),
            });
            if (response.ok) {
                alert('Support ticket submitted successfully!');
                setShowSupportModal(false);
                setSubject('');
                setDescription('');
                setIssueType('Other');
            }
            else {
                alert('There was an issue submitting your ticket. Please try again.');
            }
        }
        catch (error) {
            console.error('Error submitting support ticket:', error);
            alert('An error occurred while submitting your ticket. Please try again later.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (!user)
        return null;
    // Calculate XP progress percentage - only for university users
    let progressPercentage = 0;
    if (isUnivUser && user.xp !== undefined && user.level !== undefined) {
        const xpToNextLevel = 1000; // For simplicity, each level requires 1000 XP
        const currentLevelBaseXP = ((user.level || 1) - 1) * xpToNextLevel;
        const xpInCurrentLevel = (user.xp || 0) - currentLevelBaseXP;
        progressPercentage = Math.min(100, (xpInCurrentLevel / xpToNextLevel) * 100);
    }
    // The main navigation items
    const sidebarSections = [
        {
            id: 'job-search',
            title: 'Job Search',
            icon: _jsx(Search, { className: "w-5 h-5" }),
            items: [
                { href: '/application-tracker', icon: _jsx(Briefcase, { className: "w-5 h-5 mr-3" }), label: 'Application Tracker' },
            ]
        },
        {
            id: 'career-growth',
            title: 'Career Growth',
            icon: _jsx(LineChart, { className: "w-5 h-5" }),
            items: [
                { href: '/goals', icon: _jsx(Target, { className: "w-5 h-5 mr-3" }), label: 'Career Goal Tracker' },
                { href: '/career-path-explorer', icon: _jsx(GitBranch, { className: "w-5 h-5 mr-3" }), label: 'Career Path Explorer' },
                { href: '/contacts', icon: _jsx(UserRound, { className: "w-5 h-5 mr-3" }), label: 'Network Hub' },
            ]
        },
        // Removed Career Profile button - now integrated into Account page
        {
            id: 'portfolio',
            title: 'Portfolio & Assets',
            icon: _jsx(FolderGit2, { className: "w-5 h-5" }),
            items: [
                { href: '/projects', icon: _jsx(FolderGit2, { className: "w-5 h-5 mr-3" }), label: 'Project Portfolio' },
                { href: '/resume', icon: _jsx(FileText, { className: "w-5 h-5 mr-3" }), label: 'Resume Studio' },
                { href: '/cover-letter', icon: _jsx(Mail, { className: "w-5 h-5 mr-3" }), label: 'Cover Letter Coach' },
            ]
        },
        {
            id: 'ai-coach',
            title: 'AI Career Coach',
            icon: _jsx(Bot, { className: "w-5 h-5" }),
            href: '/ai-coach',
        },
    ];
    // Dashboard link - always visible
    const dashboardLink = {
        href: '/career-dashboard',
        icon: _jsx(LayoutDashboard, { className: "w-5 h-5 mr-3" }),
        label: 'Dashboard'
    };
    return (_jsxs("div", { ref: sidebarRef, className: `flex-col overflow-hidden transition-all duration-300 ease-in-out bg-white shadow-md z-30 
        ${expanded ? 'w-64' : 'w-16'} 
        ${isOpen ? 'flex fixed inset-y-0 left-0 md:relative' : 'hidden md:flex'}`, "data-expanded": expanded ? 'true' : 'false', children: [_jsxs("div", { className: "flex items-center justify-between h-16 border-b px-3", children: [expanded && (_jsx("img", { src: ascentulLogo, alt: "Ascentul", className: "h-6 ml-2" })), _jsx(Button, { variant: "ghost", size: "sm", onClick: toggleSidebar, className: "ml-auto hidden md:flex", "aria-label": expanded ? "Collapse sidebar" : "Expand sidebar", children: expanded ? _jsx(PanelLeft, { size: 18 }) : _jsx(PanelRight, { size: 18 }) }), isOpen && (_jsx(Button, { variant: "ghost", size: "sm", onClick: onToggle, className: "ml-auto md:hidden", "aria-label": "Close sidebar", children: _jsx(ChevronsLeft, { className: "h-6 w-6" }) }))] }), _jsxs("div", { className: "flex flex-col items-center py-6 border-b", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "inline-block", children: _jsx(ProfileImageUploader, { onImageUploaded: async (imageDataUrl) => {

                                        try {
                                            // Use the centralized uploadProfileImage function from useUserData context
                                            const updatedUser = await uploadProfileImage(imageDataUrl);

                                            return updatedUser;
                                        }
                                        catch (error) {
                                            console.error("Error updating profile with image:", error);
                                            alert("Failed to update your profile image. Please try again or contact support.");
                                            throw error;
                                        }
                                    }, currentImage: user.profileImage, children: _jsx("div", { children: _jsx(Avatar, { className: `border-2 border-primary cursor-pointer hover:opacity-90 transition-opacity ${expanded ? 'w-16 h-16' : 'w-10 h-10'}`, children: user.profileImage ? (_jsx(AvatarImage, { src: user.profileImage || '', alt: user.name, onError: (e) => {

                                                    // Hide the broken image icon
                                                    e.currentTarget.style.display = 'none';
                                                }, className: "object-cover", style: { objectPosition: 'center' } })) : (_jsx(AvatarFallback, { className: "bg-primary/10 text-primary text-xl", children: user.name.charAt(0) })) }) }) }) }), isUnivUser && user.level !== undefined && expanded && (_jsx("div", { className: "absolute -top-1 -right-1 bg-[#8bc34a] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold", children: user.level }))] }), expanded && (_jsxs(_Fragment, { children: [_jsx("h2", { className: "mt-3 font-medium text-lg", children: user.name }), isUnivUser && user.rank && (_jsx("div", { className: "mt-1 text-sm text-neutral-400", children: user.rank })), isUnivUser && user.xp !== undefined && user.level !== undefined && (_jsxs("div", { className: "mt-3 w-full px-6", children: [_jsxs("div", { className: "flex justify-between text-xs mb-1", children: [_jsxs("span", { children: ["Level ", user.level] }), _jsxs("span", { children: [user.xp, " XP"] })] }), _jsx(Progress, { value: progressPercentage, className: "h-2" })] })), isUnivUser && (_jsxs("div", { className: "mt-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center", children: [_jsx(GraduationCap, { className: "w-3 h-3 mr-1" }), "University User"] }))] }))] }), _jsxs("nav", { className: "flex-1 overflow-hidden py-4 flex flex-col", children: [_jsxs(Link, { href: dashboardLink.href, className: `flex items-center ${expanded ? 'px-6' : 'px-3 justify-center'} py-3 text-sm transition-colors hover:bg-primary/5
            ${location === dashboardLink.href ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`, title: !expanded ? dashboardLink.label : undefined, children: [_jsx("div", { className: expanded ? 'mr-3' : '', children: dashboardLink.icon }), expanded && dashboardLink.label] }), _jsxs("div", { className: `mt-3 ${expanded ? 'px-3' : 'px-0'}`, children: [expanded && (_jsx("div", { className: "text-xs font-medium text-neutral-400 uppercase mb-2 px-3", children: "Features" })), _jsx("div", { className: "space-y-1", children: sidebarSections.map((section) => (_jsxs("div", { className: "relative", children: [section.href ? (_jsxs(Link, { href: section.href, "data-section-id": section.id, className: `w-full flex items-center ${expanded ? 'justify-between' : 'justify-center'} rounded-md ${expanded ? 'px-3' : 'px-2'} py-2 text-sm transition-colors
                      ${location === section.href ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-primary/5'}`, onMouseEnter: () => setHoverSection(section.id), onMouseLeave: () => setHoverSection(null), title: !expanded ? section.title : undefined, children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: expanded ? 'mr-3' : '', children: section.icon }), expanded && _jsx("span", { children: section.title })] }), expanded && section.items && section.items.length > 0 && (_jsx(ChevronRight, { className: "w-4 h-4" }))] })) : (_jsxs("button", { "data-section-id": section.id, className: `w-full flex items-center ${expanded ? 'justify-between' : 'justify-center'} rounded-md ${expanded ? 'px-3' : 'px-2'} py-2 text-sm transition-colors
                      ${activeSection === section.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-primary/5'}`, onClick: () => setActiveSection(activeSection === section.id ? null : section.id), onMouseEnter: () => setHoverSection(section.id), onMouseLeave: () => setHoverSection(null), title: !expanded ? section.title : undefined, children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: expanded ? 'mr-3' : '', children: section.icon }), expanded && _jsx("span", { children: section.title })] }), expanded && (_jsx(motion.div, { animate: { rotate: activeSection === section.id ? 0 : 0 }, transition: { duration: 0.2 }, children: activeSection === section.id ?
                                                        _jsx(ChevronRight, { className: "w-4 h-4 transform rotate-90" }) :
                                                        _jsx(ChevronRight, { className: "w-4 h-4" }) }))] })), _jsxs(AnimatePresence, { children: [activeSection === section.id && expanded && (_jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, transition: { duration: 0.25, ease: 'easeInOut' }, className: "overflow-hidden", children: _jsx("div", { className: "pt-1 pl-7 pb-1", children: section.items && section.items.map((item) => (_jsxs(Link, { href: item.href, className: `flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors my-1
                              ${location === item.href ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5'}`, children: [_jsxs("div", { className: "flex items-center", children: [item.icon, _jsx("span", { children: item.label })] }), item.pro && (_jsx("span", { className: "text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-medium", children: "PRO" }))] }, item.href))) }) })), !expanded && activeSection === section.id && (_jsx("div", { className: `popup-menu-${section.id} fixed left-16 top-auto mt-0 bg-white rounded-md shadow-md z-50 min-w-64 border overflow-hidden`, style: { top: `${menuPositions[section.id] || 0}px` }, children: _jsxs("div", { className: "py-1", children: [_jsxs("div", { className: "px-4 py-2 font-medium border-b mb-1 flex items-center", children: [section.icon, _jsx("span", { className: "ml-2", children: section.title })] }), section.items && section.items.map((item) => (_jsxs(Link, { href: item.href, className: `flex items-center justify-between px-4 py-2 text-sm hover:bg-primary/5
                              ${location === item.href ? 'bg-primary/10 text-primary' : ''}`, children: [_jsxs("div", { className: "flex items-center", children: [item.icon, _jsx("span", { children: item.label })] }), item.pro && (_jsx("span", { className: "text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-medium ml-2", children: "PRO" }))] }, item.href)))] }) }))] })] }, section.id))) })] }), isUnivUser && (_jsxs("div", { className: `mt-4 ${expanded ? 'px-6' : 'px-2'}`, children: [expanded && (_jsx("div", { className: "text-xs font-medium text-neutral-400 uppercase mb-2", children: "University Resources" })), _jsxs(Link, { href: "/university-dashboard", className: `flex items-center ${expanded ? 'px-3' : 'px-2 justify-center'} py-2 text-sm transition-colors hover:bg-primary/5 rounded-md
                ${location === "/university-dashboard" || location === "/university" ? 'text-primary bg-primary/10' : ''}`, title: !expanded ? 'University Dashboard' : undefined, children: [_jsx(School, { className: `w-5 h-5 ${expanded ? 'mr-3' : ''}` }), expanded && 'University Dashboard'] }), _jsxs(Link, { href: "/university/study-plan", className: `flex items-center ${expanded ? 'px-3' : 'px-2 justify-center'} py-2 text-sm transition-colors hover:bg-primary/5 rounded-md
                ${location === "/university/study-plan" ? 'text-primary bg-primary/10' : ''}`, title: !expanded ? 'Study Plan' : undefined, children: [_jsx(Target, { className: `w-5 h-5 ${expanded ? 'mr-3' : ''}` }), expanded && 'Study Plan'] }), _jsxs(Link, { href: "/university/learning", className: `flex items-center ${expanded ? 'px-3' : 'px-2 justify-center'} py-2 text-sm transition-colors hover:bg-primary/5 rounded-md
                ${location === "/university/learning" ? 'text-primary bg-primary/10' : ''}`, title: !expanded ? 'Learning Modules' : undefined, children: [_jsx(BookOpen, { className: `w-5 h-5 ${expanded ? 'mr-3' : ''}` }), expanded && 'Learning Modules'] })] })), _jsx("div", { className: "flex-1" })] }), isAdmin && user?.role !== "super_admin" && (_jsxs("div", { className: "border-t py-2", children: [expanded && (_jsx("div", { className: "px-6 py-2 text-xs font-medium text-neutral-400 uppercase", children: "Administration" })), _jsxs(Link, { href: "/admin", className: `flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm transition-colors hover:bg-primary/5 rounded-md ${expanded ? 'mx-3' : 'mx-1'}
              ${location.startsWith("/admin") ? 'text-primary bg-primary/10' : ''}`, title: !expanded ? 'Admin Dashboard' : undefined, children: [_jsx(ShieldCheck, { className: `w-5 h-5 ${expanded ? 'mr-3' : ''}` }), expanded && 'Admin Dashboard'] })] })), _jsxs("div", { className: "border-t py-4", children: [isFreeUser && (_jsxs(Link, { href: "/upgrade", className: `flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm mb-2 bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer rounded-md ${expanded ? 'mx-3' : 'mx-1'} w-full text-left`, title: !expanded ? 'Upgrade' : undefined, children: [_jsx(Zap, { className: `w-5 h-5 ${expanded ? 'mr-3' : ''}` }), expanded && 'Upgrade'] })), _jsxs("button", { onClick: () => setShowNotifications(true), className: `flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm hover:bg-primary/5 transition-colors cursor-pointer rounded-md ${expanded ? 'mx-3' : 'mx-1'} w-full text-left`, title: !expanded ? 'Notifications' : undefined, children: [_jsx(Bell, { className: `w-5 h-5 ${expanded ? 'mr-3' : ''}` }), expanded && 'Notifications'] }), _jsxs("button", { onClick: () => setShowSupportModal(true), className: `flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm hover:bg-primary/5 transition-colors cursor-pointer rounded-md ${expanded ? 'mx-3' : 'mx-1'} w-full text-left`, title: !expanded ? 'Support' : undefined, children: [_jsx(HelpCircle, { className: `w-5 h-5 ${expanded ? 'mr-3' : ''}` }), expanded && 'Support'] }), _jsxs("a", { href: "/account", className: `flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm hover:bg-primary/5 transition-colors cursor-pointer rounded-md ${expanded ? 'mx-3' : 'mx-1'}`, title: !expanded ? 'Account Settings' : undefined, children: [_jsx(Settings, { className: `w-5 h-5 ${expanded ? 'mr-3' : ''}` }), expanded && 'Account Settings'] }), _jsxs("button", { className: `flex items-center ${expanded ? 'px-6 text-left' : 'px-2 justify-center'} py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full rounded-md ${expanded ? 'mx-3' : 'mx-1'}`, onClick: () => logout(), title: !expanded ? 'Logout' : undefined, children: [_jsx(LogOut, { className: `w-5 h-5 ${expanded ? 'mr-3' : ''}` }), expanded && 'Logout'] })] }), _jsx(Dialog, { open: showSupportModal, onOpenChange: setShowSupportModal, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Submit a Support Ticket" }), _jsx(DialogDescription, { children: "Need help with something? Send us a message and we'll get back to you as soon as possible." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 mt-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "subject", className: "text-sm font-medium", children: "Subject" }), _jsx(Input, { id: "subject", value: subject, onChange: (e) => setSubject(e.target.value), placeholder: "Briefly describe your issue", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "issueType", className: "text-sm font-medium", children: "Issue Type" }), _jsxs(Select, { value: issueType, onValueChange: setIssueType, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select issue type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "account_access", children: "Account Access" }), _jsx(SelectItem, { value: "technical", children: "Technical Issue" }), _jsx(SelectItem, { value: "billing", children: "Billing" }), _jsx(SelectItem, { value: "feature_request", children: "Feature Request" }), _jsx(SelectItem, { value: "Bug", children: "Bug Report" }), _jsx(SelectItem, { value: "Feedback", children: "Feedback" }), _jsx(SelectItem, { value: "Other", children: "Other" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "description", className: "text-sm font-medium", children: "Description" }), _jsx(Textarea, { id: "description", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Please provide details about your issue or question", rows: 5, required: true })] }), _jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [_jsx(DialogClose, { asChild: true, children: _jsx(Button, { type: "button", variant: "outline", children: "Cancel" }) }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? 'Submitting...' : 'Submit Ticket' })] })] })] }) }), _jsx(Dialog, { open: showNotifications, onOpenChange: setShowNotifications, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Notifications" }), _jsx(DialogDescription, { children: "Your latest updates and alerts" })] }), _jsx("div", { className: "py-4", children: loading ? (_jsx("div", { className: "flex justify-center items-center py-8", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" }) })) : notifications.length === 0 ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: _jsx("p", { children: "No new notifications" }) })) : (_jsx("ul", { className: "space-y-4", children: notifications.map((notif) => (_jsxs("li", { className: "border rounded-lg p-4 hover:bg-muted/50 transition-colors", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("h4", { className: "font-medium", children: notif.title }), _jsx("span", { className: "text-xs text-muted-foreground", children: new Date(notif.timestamp).toLocaleString() })] }), _jsx("p", { className: "mt-2 text-sm", children: notif.body })] }, notif.id))) })) }), _jsx(DialogFooter, { children: _jsx(DialogClose, { asChild: true, children: _jsx(Button, { variant: "outline", children: "Close" }) }) })] }) })] }));
}
