import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useCareerData } from '@/hooks/use-career-data';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Briefcase, GraduationCap, Tag as LucideTag, XCircle, Award, AlignJustify, RefreshCw, Info as InfoIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { queryClient } from '@/lib/queryClient';
// @ts-ignore - Import debug utilities (TypeScript ignore to prevent declaration file errors)
import { debugCompareWorkHistorySources } from '../debugCareerData';
export function CareerDataImport({ form }) {
    const { toast } = useToast();
    const { careerData, isLoading, error, refetch } = useCareerData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    // Track selected items in each category
    const [selectedWorkItems, setSelectedWorkItems] = useState([]);
    const [selectedEducationItems, setSelectedEducationItems] = useState([]);
    const [selectedSkillItems, setSelectedSkillItems] = useState([]);
    const [selectedCertificationItems, setSelectedCertificationItems] = useState([]);
    const [summarySelected, setSummarySelected] = useState(false);
    // Force a refresh of career data when the dialog opens
    useEffect(() => {
        const refreshCareerData = async () => {
            if (isDialogOpen) {
                console.log('CareerDataImport: Dialog opened, refreshing career data...');
                try {
                    // First, run our comprehensive debugging function to trace the data flow
                    await debugCompareWorkHistorySources();
                    // Hard invalidate the cache completely to ensure we get fresh data
                    queryClient.removeQueries({ queryKey: ['/api/career-data'] });
                    // Add a timestamp to bust any potential server-side caching
                    const timestamp = new Date().getTime();
                    const cacheHeaders = {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    };
                    // Directly perform a fetch to verify what's coming from the API
                    console.log('Performing direct API call to fetch career data...');
                    const response = await fetch(`/api/career-data?t=${timestamp}`, {
                        credentials: 'include',
                        headers: cacheHeaders
                    });
                    if (!response.ok) {
                        throw new Error(`Direct API call failed with status: ${response.status}`);
                    }
                    const directData = await response.json();
                    console.log('DIRECT API CALL - Career data received:', directData);
                    console.log('DIRECT API CALL - Work history count:', directData?.workHistory?.length || 0);
                    if (directData?.workHistory?.length > 0) {
                        console.log('DIRECT API CALL - First work history item:', directData.workHistory[0]);
                        // Verify all work history dates are correctly formatted
                        const sampleJob = directData.workHistory[0];
                        console.log('DIRECT API CALL - Date format verification:');
                        console.log(`  startDate (${typeof sampleJob.startDate}):`, sampleJob.startDate);
                        console.log(`  endDate (${typeof sampleJob.endDate}):`, sampleJob.endDate);
                        console.log(`  createdAt (${typeof sampleJob.createdAt}):`, sampleJob.createdAt);
                        // Test parsing dates
                        if (sampleJob.startDate) {
                            const testDate = new Date(sampleJob.startDate);
                            console.log('  Parsed startDate:', testDate.toISOString());
                        }
                    }
                    else {
                        console.log('DIRECT API CALL - No work history items found!');
                    }
                    // Now perform the React Query refetch to update the UI
                    // Pass the same cache-busting timestamp to the refetch function
                    console.log('Now refetching data via React Query...');
                    const result = await refetch();
                    if (result.isSuccess && result.data) {
                        console.log('RQ - Career data successfully refreshed:', result.data);
                        console.log('RQ - Work history items:', result.data.workHistory?.length || 0);
                        if (result.data.workHistory?.length === 0) {
                            console.log('RQ - No work history items found in response');
                        }
                        else {
                            console.log('RQ - Work history sample:', result.data.workHistory[0]);
                        }
                    }
                    else if (result.isError) {
                        console.error('RQ - Error refreshing career data:', result.error);
                    }
                }
                catch (error) {
                    console.error('Error during career data refresh:', error);
                    toast({
                        title: "Error refreshing data",
                        description: "We encountered an issue refreshing your career data. Please try again.",
                        variant: "destructive"
                    });
                }
            }
        };
        refreshCareerData();
    }, [isDialogOpen, refetch, toast]);
    // Format work history for display
    const workItems = careerData?.workHistory.map(job => ({
        id: job.id,
        title: job.position,
        subtitle: job.company,
        description: job.description,
        date: job.startDate && job.endDate
            ? `${format(new Date(job.startDate), 'MMM yyyy')} – ${format(new Date(job.endDate), 'MMM yyyy')}`
            : job.startDate
                ? `${format(new Date(job.startDate), 'MMM yyyy')} – Present`
                : '',
        selected: selectedWorkItems.includes(job.id)
    })) || [];
    // Format education history for display
    const educationItems = careerData?.educationHistory.map(edu => ({
        id: edu.id,
        title: edu.degree,
        subtitle: edu.institution,
        description: edu.description,
        date: edu.startDate && edu.endDate
            ? `${format(new Date(edu.startDate), 'MMM yyyy')} – ${format(new Date(edu.endDate), 'MMM yyyy')}`
            : edu.startDate
                ? `${format(new Date(edu.startDate), 'MMM yyyy')} – Present`
                : '',
        selected: selectedEducationItems.includes(edu.id)
    })) || [];
    // Format skills for display
    const skillItems = careerData?.skills.map(skill => ({
        id: skill.id,
        title: skill.name,
        subtitle: skill.category,
        description: skill.proficiencyLevel ? `Proficiency: ${skill.proficiencyLevel}` : undefined,
        selected: selectedSkillItems.includes(skill.id)
    })) || [];
    // Format certifications for display
    const certificationItems = careerData?.certifications.map(cert => ({
        id: cert.id,
        title: cert.name,
        subtitle: cert.issuingOrganization,
        date: cert.issueDate
            ? cert.expiryDate
                ? `${format(new Date(cert.issueDate), 'MMM yyyy')} – ${format(new Date(cert.expiryDate), 'MMM yyyy')}`
                : `${format(new Date(cert.issueDate), 'MMM yyyy')}${cert.noExpiration ? ' – No Expiration' : ''}`
            : '',
        description: cert.credentialID ? `ID: ${cert.credentialID}` : undefined,
        selected: selectedCertificationItems.includes(cert.id)
    })) || [];
    // Toggle selection of a work history item
    const toggleWorkItem = (id) => {
        setSelectedWorkItems(prev => prev.includes(id)
            ? prev.filter(itemId => itemId !== id)
            : [...prev, id]);
    };
    // Toggle selection of an education history item
    const toggleEducationItem = (id) => {
        setSelectedEducationItems(prev => prev.includes(id)
            ? prev.filter(itemId => itemId !== id)
            : [...prev, id]);
    };
    // Toggle selection of a skill item
    const toggleSkillItem = (id) => {
        setSelectedSkillItems(prev => prev.includes(id)
            ? prev.filter(itemId => itemId !== id)
            : [...prev, id]);
    };
    // Toggle selection of a certification item
    const toggleCertificationItem = (id) => {
        setSelectedCertificationItems(prev => prev.includes(id)
            ? prev.filter(itemId => itemId !== id)
            : [...prev, id]);
    };
    // Toggle selection of career summary
    const toggleSummary = () => {
        setSummarySelected(prev => !prev);
    };
    // Import the selected items into the resume form with bidirectional sync
    const importSelectedItems = async () => {
        try {
            // Check if any items are selected
            const hasSelectedItems = summarySelected ||
                selectedWorkItems.length > 0 ||
                selectedEducationItems.length > 0 ||
                selectedSkillItems.length > 0 ||
                selectedCertificationItems.length > 0;
            // If nothing is selected, show message and keep dialog open
            if (!hasSelectedItems) {
                toast({
                    title: 'No items selected',
                    description: 'Please select at least one item to import.',
                    variant: 'destructive'
                });
                return;
            }
            // Track all mutations we'll need to perform for bidirectional sync
            const syncPromises = [];
            // Import career summary
            if (summarySelected && careerData?.careerSummary) {
                form.setValue('content.summary', careerData.careerSummary);
            }
            // Import work history
            if (selectedWorkItems.length > 0) {
                const currentExperience = form.getValues('content.experience') || [];
                const selectedJobs = careerData?.workHistory.filter(job => selectedWorkItems.includes(job.id)) || [];
                const newExperience = [
                    ...currentExperience,
                    ...selectedJobs.map(job => ({
                        company: job.company,
                        position: job.position,
                        startDate: job.startDate ? format(new Date(job.startDate), 'yyyy-MM-dd') : '',
                        endDate: job.endDate ? format(new Date(job.endDate), 'yyyy-MM-dd') : '',
                        currentJob: !job.endDate || job.currentJob,
                        description: job.description || '',
                        location: job.location || '',
                        achievements: job.achievements || []
                    }))
                ];
                form.setValue('content.experience', newExperience);
                // For newly created items, sync them back to career storage
                const resumeItems = form.getValues('content.experience') || [];
                for (const item of resumeItems) {
                    // Skip items that already exist in career data
                    const existsInCareerData = careerData?.workHistory.some(job => job.company === item.company && job.position === item.position);
                    if (!existsInCareerData && item.company && item.position) {
                        console.log('Creating new work history item from resume data:', item);
                        const startDate = item.startDate ? new Date(item.startDate) : new Date();
                        const endDate = item.currentJob ? null : (item.endDate ? new Date(item.endDate) : null);
                        // Create a mutation to save this item to career data
                        syncPromises.push(fetch('/api/career-data/work-history', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                company: item.company,
                                position: item.position,
                                startDate: startDate.toISOString(),
                                endDate: endDate?.toISOString() || null,
                                currentJob: item.currentJob || false,
                                location: item.location || null,
                                description: item.description || null,
                                achievements: item.achievements || []
                            })
                        }));
                    }
                }
            }
            // Import education history
            if (selectedEducationItems.length > 0) {
                const currentEducation = form.getValues('content.education') || [];
                const selectedEducation = careerData?.educationHistory.filter(edu => selectedEducationItems.includes(edu.id)) || [];
                const newEducation = [
                    ...currentEducation,
                    ...selectedEducation.map(edu => ({
                        institution: edu.institution,
                        degree: edu.degree,
                        field: edu.fieldOfStudy || '',
                        startDate: edu.startDate ? format(new Date(edu.startDate), 'yyyy-MM-dd') : '',
                        endDate: edu.endDate ? format(new Date(edu.endDate), 'yyyy-MM-dd') : '',
                        description: edu.description || '',
                        location: edu.location || '',
                        gpa: edu.gpa || '',
                        achievements: edu.achievements || []
                    }))
                ];
                form.setValue('content.education', newEducation);
                // For newly created items, sync them back to career storage
                const resumeItems = form.getValues('content.education') || [];
                for (const item of resumeItems) {
                    // Skip items that already exist in career data
                    const existsInCareerData = careerData?.educationHistory.some(edu => edu.institution === item.institution && edu.degree === item.degree);
                    if (!existsInCareerData && item.institution && item.degree) {
                        console.log('Creating new education history item from resume data:', item);
                        const startDate = item.startDate ? new Date(item.startDate) : new Date();
                        const endDate = item.current ? null : (item.endDate ? new Date(item.endDate) : null);
                        // Create a mutation to save this item to career data
                        syncPromises.push(fetch('/api/career-data/education', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                institution: item.institution,
                                degree: item.degree,
                                fieldOfStudy: item.field || '',
                                startDate: startDate.toISOString(),
                                endDate: endDate?.toISOString() || null,
                                current: !item.endDate || false,
                                location: item.location || null,
                                description: item.description || null,
                                achievements: item.achievements || [],
                                gpa: item.gpa || null
                            })
                        }));
                    }
                }
            }
            // Import skills
            if (selectedSkillItems.length > 0) {
                const currentSkills = form.getValues('content.skills') || [];
                const selectedSkills = careerData?.skills.filter(skill => selectedSkillItems.includes(skill.id)) || [];
                const newSkills = [
                    ...currentSkills,
                    ...selectedSkills.map(skill => skill.name)
                ];
                // Remove duplicates using a more compatible approach
                const uniqueSkills = Array.from(new Set(newSkills));
                form.setValue('content.skills', uniqueSkills);
                // For newly created items, sync them back to career storage
                const resumeSkills = form.getValues('content.skills') || [];
                for (const skillName of resumeSkills) {
                    // Skip items that already exist in career data
                    const existsInCareerData = careerData?.skills.some(skill => skill.name.toLowerCase() === skillName.toLowerCase());
                    if (!existsInCareerData && skillName) {
                        console.log('Creating new skill from resume data:', skillName);
                        // Create a mutation to save this item to career data
                        syncPromises.push(fetch('/api/career-data/skills', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                name: skillName,
                                proficiencyLevel: null,
                                category: null
                            })
                        }));
                    }
                }
            }
            // Import certifications
            if (selectedCertificationItems.length > 0) {
                const currentCertifications = form.getValues('content.certifications') || [];
                const selectedCertifications = careerData?.certifications.filter(cert => selectedCertificationItems.includes(cert.id)) || [];
                const newCertifications = [
                    ...currentCertifications,
                    ...selectedCertifications.map(cert => ({
                        name: cert.name,
                        issuer: cert.issuingOrganization,
                        date: cert.issueDate ? format(new Date(cert.issueDate), 'yyyy-MM-dd') : '',
                        url: cert.credentialURL || '',
                        id: cert.credentialID || ''
                    }))
                ];
                form.setValue('content.certifications', newCertifications);
                // For newly created items, sync them back to career storage
                const resumeCerts = form.getValues('content.certifications') || [];
                for (const item of resumeCerts) {
                    // Skip items that already exist in career data
                    const existsInCareerData = careerData?.certifications.some(cert => cert.name === item.name && cert.issuingOrganization === item.issuer);
                    if (!existsInCareerData && item.name && item.issuer) {
                        console.log('Creating new certification from resume data:', item);
                        const issueDate = item.date ? new Date(item.date) : new Date();
                        // Create a mutation to save this item to career data
                        syncPromises.push(fetch('/api/career-data/certifications', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                name: item.name,
                                issuingOrganization: item.issuer,
                                issueDate: issueDate.toISOString(),
                                expiryDate: null,
                                noExpiration: true,
                                credentialID: item.id || null,
                                credentialURL: item.url || null
                            })
                        }));
                    }
                }
            }
            // If we have any sync operations to perform, wait for them to complete
            if (syncPromises.length > 0) {
                console.log(`Performing ${syncPromises.length} sync operations...`);
                await Promise.all(syncPromises);
                console.log('All sync operations completed successfully!');
                // After syncing, force a refresh of the career data
                queryClient.removeQueries({ queryKey: ['/api/career-data'] });
                await refetch();
                // Also clear other related queries to ensure consistent data across the app
                queryClient.invalidateQueries({ queryKey: ['resumes'] });
            }
            // Close dialog and show success message
            setIsDialogOpen(false);
            toast({
                title: 'Career Data Imported',
                description: syncPromises.length > 0
                    ? 'Your selected items have been added to the resume and synchronized with your career profile.'
                    : 'Your selected items have been added to the resume.',
                variant: syncPromises.length > 0 ? 'default' : 'default',
            });
            // Reset selections
            setSummarySelected(false);
            setSelectedWorkItems([]);
            setSelectedEducationItems([]);
            setSelectedSkillItems([]);
            setSelectedCertificationItems([]);
        }
        catch (error) {
            console.error('Error importing career data:', error);
            toast({
                title: 'Import Error',
                description: 'There was a problem importing your career data. Please try again.',
                variant: 'destructive'
            });
        }
    };
    return (_jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", type: "button", className: "w-full", children: [_jsx(Download, { className: "mr-2 h-4 w-4" }), "Import Career Data"] }) }), _jsxs(DialogContent, { className: "sm:max-w-[725px]", children: [_jsxs(DialogHeader, { className: "relative", children: [_jsx(DialogTitle, { children: "Import Your Career Data" }), _jsx(DialogDescription, { children: "Select items from your career profile to add to this resume. You can choose from your summary, work experience, education, skills, and certifications." }), _jsxs("div", { className: "absolute right-0 top-0 flex flex-col items-end gap-2", children: [_jsxs("div", { className: "flex items-center text-xs", children: [_jsx("div", { className: `w-2 h-2 rounded-full mr-1 ${careerData ? 'bg-green-500' : 'bg-yellow-500'}` }), _jsx("span", { className: "text-muted-foreground", children: careerData ? 'Data Synced' : 'Waiting for Data' })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                            // Force a complete refresh by completely removing the query from cache
                                            queryClient.removeQueries({ queryKey: ['/api/career-data'] });
                                            // Run our debugging utilities
                                            debugCompareWorkHistorySources();
                                            // Then trigger a refetch
                                            refetch().then(() => {
                                                toast({
                                                    title: "Data refreshed",
                                                    description: "Your career data has been refreshed from the server."
                                                });
                                            });
                                        }, children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Refresh Data"] })] })] }), careerData && !isLoading && !error && (_jsxs("div", { className: "bg-muted/50 p-3 rounded-lg text-xs mb-4", children: [_jsxs("h4", { className: "font-medium mb-1 flex items-center", children: [_jsx(InfoIcon, { className: "h-3 w-3 mr-1" }), " Available Career Data"] }), _jsxs("ul", { className: "grid grid-cols-2 gap-x-2 gap-y-1", children: [_jsxs("li", { className: "flex items-center", children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full mr-1 ${careerData.careerSummary ? 'bg-green-500' : 'bg-gray-300'}` }), "Career Summary: ", careerData.careerSummary ? 'Available' : 'Not Set'] }), _jsxs("li", { className: "flex items-center", children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full mr-1 ${(careerData.workHistory?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}` }), "Work History: ", careerData.workHistory?.length || 0, " items"] }), _jsxs("li", { className: "flex items-center", children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full mr-1 ${(careerData.educationHistory?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}` }), "Education: ", careerData.educationHistory?.length || 0, " items"] }), _jsxs("li", { className: "flex items-center", children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full mr-1 ${(careerData.skills?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}` }), "Skills: ", careerData.skills?.length || 0, " items"] }), _jsxs("li", { className: "flex items-center", children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full mr-1 ${(careerData.certifications?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}` }), "Certifications: ", careerData.certifications?.length || 0, " items"] }), _jsx("li", { className: "flex items-center", children: _jsxs("span", { className: "text-muted-foreground text-[10px]", children: ["Last updated: ", new Date().toLocaleTimeString()] }) })] })] })), isLoading ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4 space-y-4", children: [_jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-medium", children: "Loading your career data..." }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "We're retrieving your complete career profile." })] })] })) : error ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-destructive/30 rounded-lg text-center", children: [_jsx(XCircle, { className: "h-12 w-12 text-destructive mb-2 opacity-80" }), _jsx("p", { className: "text-destructive font-medium", children: "Error loading career data" }), _jsx("p", { className: "text-muted-foreground text-sm mt-1 mb-4", children: "We couldn't retrieve your career data. Please try again later." }), _jsx(Button, { variant: "outline", onClick: () => setIsDialogOpen(false), children: "Close" })] })) : (_jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "flex flex-wrap w-full", children: [_jsxs(TabsTrigger, { value: "summary", className: "flex items-center", children: [_jsx(AlignJustify, { className: "mr-2 h-4 w-4" }), "Summary"] }), _jsxs(TabsTrigger, { value: "experience", className: "flex items-center", children: [_jsx(Briefcase, { className: "mr-2 h-4 w-4" }), "Work History"] }), _jsxs(TabsTrigger, { value: "education", className: "flex items-center", children: [_jsx(GraduationCap, { className: "mr-2 h-4 w-4" }), "Education"] }), _jsxs(TabsTrigger, { value: "skills", className: "flex items-center", children: [_jsx(LucideTag, { className: "mr-2 h-4 w-4" }), "Skills"] }), _jsxs(TabsTrigger, { value: "certifications", className: "flex items-center", children: [_jsx(Award, { className: "mr-2 h-4 w-4" }), "Certifications"] })] }), _jsx(TabsContent, { value: "summary", className: "max-h-[400px] overflow-y-auto", children: careerData?.careerSummary ? (_jsxs(Card, { className: `mb-3 cursor-pointer border-2 transition-all ${summarySelected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-transparent hover:border-gray-200'}`, onClick: toggleSummary, children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: "Career Summary" }), _jsx(CardDescription, { children: "Professional overview" })] }), _jsx(Checkbox, { id: "summary", checked: summarySelected, onCheckedChange: () => toggleSummary(), onClick: (e) => e.stopPropagation() })] }) }), _jsx(CardContent, { className: "pb-4 pt-0", children: _jsx("p", { className: "text-sm line-clamp-4", children: careerData.careerSummary }) })] })) : (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg", children: [_jsx(AlignJustify, { className: "h-12 w-12 text-muted-foreground mb-2 opacity-50" }), _jsx("p", { className: "text-muted-foreground text-center font-medium", children: "No career summary found" }), _jsx("p", { className: "text-muted-foreground text-center text-sm mt-1", children: "Add one in your Career Profile first." })] })) }), _jsx(TabsContent, { value: "experience", className: "max-h-[400px] overflow-y-auto", children: workItems.length > 0 ? (workItems.map(job => (_jsxs(Card, { className: `mb-3 cursor-pointer border-2 transition-all ${selectedWorkItems.includes(job.id)
                                        ? 'border-primary bg-primary/5'
                                        : 'border-transparent hover:border-gray-200'}`, onClick: () => toggleWorkItem(job.id), children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: job.title }), _jsx(CardDescription, { children: job.subtitle })] }), _jsx(Checkbox, { id: `work-${job.id}`, checked: selectedWorkItems.includes(job.id), onCheckedChange: () => toggleWorkItem(job.id), onClick: (e) => e.stopPropagation() })] }) }), (job.description || job.date) && (_jsxs(CardContent, { className: "pb-4 pt-0", children: [job.date && _jsx("p", { className: "text-sm text-muted-foreground mb-1", children: job.date }), job.description && _jsx("p", { className: "text-sm line-clamp-3", children: job.description })] }))] }, job.id)))) : (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg", children: [_jsx(Briefcase, { className: "h-12 w-12 text-muted-foreground mb-2 opacity-50" }), _jsx("p", { className: "text-muted-foreground text-center font-medium", children: "No work experience found" }), _jsx("p", { className: "text-muted-foreground text-center text-sm mt-1", children: "Add some in your Career Profile first." })] })) }), _jsx(TabsContent, { value: "education", className: "max-h-[400px] overflow-y-auto", children: educationItems.length > 0 ? (educationItems.map(edu => (_jsxs(Card, { className: `mb-3 cursor-pointer border-2 transition-all ${selectedEducationItems.includes(edu.id)
                                        ? 'border-primary bg-primary/5'
                                        : 'border-transparent hover:border-gray-200'}`, onClick: () => toggleEducationItem(edu.id), children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: edu.title }), _jsx(CardDescription, { children: edu.subtitle })] }), _jsx(Checkbox, { id: `edu-${edu.id}`, checked: selectedEducationItems.includes(edu.id), onCheckedChange: () => toggleEducationItem(edu.id), onClick: (e) => e.stopPropagation() })] }) }), (edu.description || edu.date) && (_jsxs(CardContent, { className: "pb-4 pt-0", children: [edu.date && _jsx("p", { className: "text-sm text-muted-foreground mb-1", children: edu.date }), edu.description && _jsx("p", { className: "text-sm line-clamp-3", children: edu.description })] }))] }, edu.id)))) : (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg", children: [_jsx(GraduationCap, { className: "h-12 w-12 text-muted-foreground mb-2 opacity-50" }), _jsx("p", { className: "text-muted-foreground text-center font-medium", children: "No education history found" }), _jsx("p", { className: "text-muted-foreground text-center text-sm mt-1", children: "Add some in your Career Profile first." })] })) }), _jsx(TabsContent, { value: "skills", className: "max-h-[400px] overflow-y-auto", children: skillItems.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: skillItems.map(skill => (_jsxs(Card, { className: `mb-2 cursor-pointer border-2 transition-all ${selectedSkillItems.includes(skill.id)
                                            ? 'border-primary bg-primary/5'
                                            : 'border-transparent hover:border-gray-200'}`, onClick: () => toggleSkillItem(skill.id), children: [_jsx(CardHeader, { className: "py-3", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: skill.title }), skill.subtitle && (_jsx(CardDescription, { children: skill.subtitle }))] }), _jsx(Checkbox, { id: `skill-${skill.id}`, checked: selectedSkillItems.includes(skill.id), onCheckedChange: () => toggleSkillItem(skill.id), onClick: (e) => e.stopPropagation() })] }) }), skill.description && (_jsx(CardContent, { className: "py-0", children: _jsx("p", { className: "text-xs text-muted-foreground", children: skill.description }) }))] }, skill.id))) })) : (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg", children: [_jsx(LucideTag, { className: "h-12 w-12 text-muted-foreground mb-2 opacity-50" }), _jsx("p", { className: "text-muted-foreground text-center font-medium", children: "No skills found" }), _jsx("p", { className: "text-muted-foreground text-center text-sm mt-1", children: "Add some in your Career Profile first." })] })) }), _jsx(TabsContent, { value: "certifications", className: "max-h-[400px] overflow-y-auto", children: certificationItems.length > 0 ? (certificationItems.map(cert => (_jsxs(Card, { className: `mb-3 cursor-pointer border-2 transition-all ${selectedCertificationItems.includes(cert.id)
                                        ? 'border-primary bg-primary/5'
                                        : 'border-transparent hover:border-gray-200'}`, onClick: () => toggleCertificationItem(cert.id), children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: cert.title }), _jsx(CardDescription, { children: cert.subtitle })] }), _jsx(Checkbox, { id: `cert-${cert.id}`, checked: selectedCertificationItems.includes(cert.id), onCheckedChange: () => toggleCertificationItem(cert.id), onClick: (e) => e.stopPropagation() })] }) }), (cert.description || cert.date) && (_jsxs(CardContent, { className: "pb-4 pt-0", children: [cert.date && _jsx("p", { className: "text-sm text-muted-foreground mb-1", children: cert.date }), cert.description && _jsx("p", { className: "text-sm line-clamp-3", children: cert.description })] }))] }, cert.id)))) : (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg", children: [_jsx(Award, { className: "h-12 w-12 text-muted-foreground mb-2 opacity-50" }), _jsx("p", { className: "text-muted-foreground text-center font-medium", children: "No certifications found" }), _jsx("p", { className: "text-muted-foreground text-center text-sm mt-1", children: "Add some in your Career Profile first." })] })) })] })), _jsx(DialogFooter, { children: _jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsxs("span", { className: "text-sm text-muted-foreground", children: [summarySelected && 'Career Summary', summarySelected && (selectedWorkItems.length > 0 || selectedEducationItems.length > 0 || selectedSkillItems.length > 0 || selectedCertificationItems.length > 0) && ', ', selectedWorkItems.length > 0 && `${selectedWorkItems.length} work items`, selectedWorkItems.length > 0 && (selectedEducationItems.length > 0 || selectedSkillItems.length > 0 || selectedCertificationItems.length > 0) && ', ', selectedEducationItems.length > 0 && `${selectedEducationItems.length} education items`, selectedEducationItems.length > 0 && (selectedSkillItems.length > 0 || selectedCertificationItems.length > 0) && ', ', selectedSkillItems.length > 0 && `${selectedSkillItems.length} skills`, selectedSkillItems.length > 0 && selectedCertificationItems.length > 0 && ', ', selectedCertificationItems.length > 0 && `${selectedCertificationItems.length} certifications`, !summarySelected && selectedWorkItems.length === 0 && selectedEducationItems.length === 0 &&
                                            selectedSkillItems.length === 0 && selectedCertificationItems.length === 0 && 'No items selected'] }), _jsxs("div", { children: [_jsx(Button, { variant: "outline", onClick: () => setIsDialogOpen(false), className: "mr-2", children: "Cancel" }), _jsx(Button, { onClick: importSelectedItems, disabled: isLoading ||
                                                Boolean(error) ||
                                                (!summarySelected &&
                                                    selectedWorkItems.length === 0 &&
                                                    selectedEducationItems.length === 0 &&
                                                    selectedSkillItems.length === 0 &&
                                                    selectedCertificationItems.length === 0), children: "Import Selected" })] })] }) })] })] }));
}
