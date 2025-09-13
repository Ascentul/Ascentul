import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, MapPin, Briefcase, Building, ExternalLink, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { EmbeddedApplyFrame } from './EmbeddedApplyFrame';
export function JobSearch({ onSelectJob }) {
    // Search state
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [isRemote, setIsRemote] = useState(false);
    const [jobType, setJobType] = useState('');
    const [source, setSource] = useState('');
    const [page, setPage] = useState(1);
    const [selectedJob, setSelectedJob] = useState(null);
    // Apply modal state
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [applyJob, setApplyJob] = useState(null);
    // State for search execution
    const [searchParams, setSearchParams] = useState(null);
    // Get job sources
    const { data: sources, isLoading: isLoadingSources } = useQuery({
        queryKey: ['/api/jobs/sources'],
        queryFn: async () => {
            try {
                const response = await apiRequest({
                    url: '/api/jobs/sources'
                });
                return response.sources || [];
            }
            catch (error) {
                console.error('Error fetching job sources:', error);
                return [];
            }
        },
        enabled: true,
    });
    // Job search query
    const { data: searchResults, isLoading, isError, error } = useQuery({
        queryKey: ['/api/jobs/search', searchParams],
        queryFn: async () => {
            if (!searchParams) {
                return { jobs: [], totalJobs: 0, currentPage: 1, pageCount: 1 };
            }
            try {
                const queryString = new URLSearchParams({
                    query: searchParams.query,
                    ...(searchParams.location && { location: searchParams.location }),
                    ...(searchParams.isRemote && { isRemote: 'true' }),
                    ...(searchParams.jobType && { jobType: searchParams.jobType }),
                    ...(searchParams.source && { source: searchParams.source }),
                    page: searchParams.page.toString(),
                    pageSize: '10',
                }).toString();
                const response = await apiRequest({
                    url: `/api/jobs/search?${queryString}`
                });
                return response;
            }
            catch (error) {
                console.error('Error searching jobs:', error);
                throw error;
            }
        },
        enabled: !!searchParams,
    });
    // Handle search execution
    const handleSearch = () => {
        if (!query)
            return;
        setSearchParams({
            query,
            location,
            isRemote,
            jobType,
            source,
            page: 1,
        });
        setPage(1);
    };
    // Handle job selection
    const handleSelectJob = (job) => {
        setSelectedJob(job);
        if (onSelectJob) {
            onSelectJob(job);
        }
    };
    // Handle pagination
    const handlePageChange = (newPage) => {
        setPage(newPage);
        setSearchParams((prev) => ({ ...prev, page: newPage }));
    };
    // Render job card
    const renderJobCard = (job) => {
        const formattedDate = job.datePosted ? new Date(job.datePosted).toLocaleDateString() : '';
        return (_jsx(Card, { className: `mb-4 cursor-pointer hover:shadow-md transition-shadow ${selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''}`, onClick: () => handleSelectJob(job), children: _jsx(CardContent, { className: "p-5", children: _jsxs("div", { className: "flex items-start gap-4", children: [job.logo ? (_jsx("div", { className: "w-12 h-12 rounded overflow-hidden flex-shrink-0", children: _jsx("img", { src: job.logo, alt: `${job.company} logo`, className: "w-full h-full object-cover" }) })) : (_jsx("div", { className: "w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0", children: _jsx(Building, { className: "h-6 w-6 text-muted-foreground" }) })), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-medium text-lg", children: job.title }), _jsx(Badge, { variant: "outline", children: job.source })] }), _jsxs("div", { className: "text-sm text-muted-foreground flex items-center gap-1", children: [_jsx(Building, { className: "h-3 w-3" }), _jsx("span", { children: job.company })] })] }), _jsxs("div", { className: "flex items-center space-x-3 text-sm", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(MapPin, { className: "h-3 w-3 text-muted-foreground" }), _jsx("span", { children: job.location })] }), job.jobType && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Briefcase, { className: "h-3 w-3 text-muted-foreground" }), _jsx("span", { children: job.jobType })] })), formattedDate && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "h-3 w-3 text-muted-foreground" }), _jsxs("span", { children: ["Posted ", formattedDate] })] }))] }), job.isRemote && (_jsx(Badge, { variant: "secondary", className: "text-xs", children: "Remote" })), _jsx("p", { className: "text-sm line-clamp-2", children: job.description }), job.salary && (_jsx("div", { className: "text-sm font-medium", children: job.salary })), _jsxs("div", { className: "flex justify-between items-center pt-2", children: [_jsx("div", { className: "flex gap-1", children: job.tags?.slice(0, 3).map(tag => (_jsx(Badge, { variant: "outline", className: "text-xs", children: tag }, tag))) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "default", size: "sm", onClick: (e) => {
                                                        e.stopPropagation();
                                                        setApplyJob(job);
                                                        setApplyModalOpen(true);
                                                    }, children: "Apply Now" }), _jsxs("a", { href: job.applyUrl, target: "_blank", rel: "noopener noreferrer", className: "text-sm text-primary flex items-center gap-1 hover:underline", onClick: (e) => e.stopPropagation(), children: [_jsx(ExternalLink, { className: "h-3 w-3" }), "View Original"] })] })] })] })] }) }) }, job.id));
    };
    return (_jsxs("div", { className: "grid grid-cols-1 gap-6", children: [applyJob && (_jsx(EmbeddedApplyFrame, { isOpen: applyModalOpen, onClose: () => setApplyModalOpen(false), jobTitle: applyJob.title, companyName: applyJob.company, applyUrl: applyJob.applyUrl })), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col md:flex-row gap-3", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Job title, keywords, or company", className: "pl-9", value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSearch() })] }), _jsxs("div", { className: "flex-1 relative", children: [_jsx(MapPin, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "City, state, or zip code", className: "pl-9", value: location, onChange: (e) => setLocation(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSearch() })] }), _jsx(Button, { onClick: handleSearch, className: "md:w-auto w-full", children: "Search Jobs" })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs(Select, { value: jobType, onValueChange: setJobType, children: [_jsx(SelectTrigger, { className: "w-[180px]", children: _jsx(SelectValue, { placeholder: "Job Type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "", children: "Any Type" }), _jsx(SelectItem, { value: "full-time", children: "Full-time" }), _jsx(SelectItem, { value: "part-time", children: "Part-time" }), _jsx(SelectItem, { value: "contract", children: "Contract" }), _jsx(SelectItem, { value: "internship", children: "Internship" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "remote-filter", checked: isRemote, onChange: (e) => setIsRemote(e.target.checked), className: "rounded border-gray-300 text-primary focus:ring-primary" }), _jsx("label", { htmlFor: "remote-filter", className: "text-sm", children: "Remote only" })] }), !isLoadingSources && sources && sources.length > 0 && (_jsxs(Select, { value: source, onValueChange: setSource, children: [_jsx(SelectTrigger, { className: "w-[180px]", children: _jsx(SelectValue, { placeholder: "Job Source" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "", children: "All Sources" }), sources.map((src) => (_jsx(SelectItem, { value: src.id, children: src.name }, src.id)))] })] }))] })] }), _jsxs("div", { children: [isLoading && (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-36 w-full rounded-md mb-4" }), _jsx(Skeleton, { className: "h-36 w-full rounded-md mb-4" }), _jsx(Skeleton, { className: "h-36 w-full rounded-md" })] })), isError && (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-red-500 mb-2", children: "Error searching jobs" }), _jsx("p", { className: "text-muted-foreground", children: error?.message || 'An unknown error occurred' })] })), !isLoading && !isError && (!searchResults || !searchResults.jobs || searchResults.jobs.length === 0) && (_jsxs("div", { className: "text-center py-8", children: [_jsx(Search, { className: "h-8 w-8 mx-auto text-muted-foreground mb-2" }), _jsx("p", { className: "text-lg font-medium", children: "No jobs found" }), _jsx("p", { className: "text-muted-foreground", children: "Try different search terms or filters" })] })), !isLoading && !isError && searchResults && searchResults.jobs && searchResults.jobs.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "mb-4", children: _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Found ", searchResults.totalJobs, " jobs matching your search"] }) }), _jsx("div", { children: searchResults.jobs.map(renderJobCard) }), searchResults.pageCount > 1 && (_jsx(Pagination, { className: "mt-6", children: _jsxs(PaginationContent, { children: [_jsx(PaginationItem, { children: _jsx(PaginationPrevious, { href: "#", onClick: (e) => {
                                                    e.preventDefault();
                                                    if (page > 1)
                                                        handlePageChange(page - 1);
                                                }, className: page <= 1 ? 'pointer-events-none opacity-50' : '' }) }), Array.from({ length: Math.min(5, searchResults.pageCount) }, (_, i) => {
                                            const pageNumber = i + 1;
                                            return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { href: "#", isActive: pageNumber === page, onClick: (e) => {
                                                        e.preventDefault();
                                                        handlePageChange(pageNumber);
                                                    }, children: pageNumber }) }, pageNumber));
                                        }), _jsx(PaginationItem, { children: _jsx(PaginationNext, { href: "#", onClick: (e) => {
                                                    e.preventDefault();
                                                    if (page < searchResults.pageCount)
                                                        handlePageChange(page + 1);
                                                }, className: page >= searchResults.pageCount ? 'pointer-events-none opacity-50' : '' }) })] }) }))] }))] })] }));
}
