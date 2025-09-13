import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
export default function ResumeTemplate({ resume, style, scale = 1 }) {
    if (!resume || !resume.content) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("p", { className: "text-neutral-500", children: "No resume data available to preview" }) }));
    }
    // Apply scaling to the template container
    const containerStyle = {
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        width: scale === 1 ? '100%' : `${100 / scale}%`,
        maxWidth: '860px',
    };
    // Helper function to format dates (MM/DD/YY to Month Year)
    const formatDate = (dateString) => {
        if (!dateString)
            return '';
        // Different potential date formats
        const formats = [
            'MM/dd/yy', 'MM/dd/yyyy', 'M/d/yy', 'M/d/yyyy',
            'yyyy-MM-dd', 'dd/MM/yyyy', 'MMM yyyy', 'MMMM yyyy'
        ];
        // Try to parse with different formats
        for (const formatStr of formats) {
            try {
                const date = parse(dateString, formatStr, new Date());
                if (!isNaN(date.getTime())) {
                    return format(date, 'MMM yyyy');
                }
            }
            catch (e) {
                // Continue with next format if parsing fails
            }
        }
        // If no format works, return the original string
        return dateString;
    };
    // Get template-specific classes based on selected style
    const templateClasses = getTemplateClasses(style);
    return (_jsxs("div", { className: cn("resume-template bg-white shadow-md mx-auto transition-all duration-200 print:shadow-none", `${style}-template`, style === 'modern' ? 'p-6 border-t-4 border-primary' :
            style === 'classic' ? 'p-8 border' :
                style === 'minimal' ? 'p-6' :
                    style === 'professional' ? 'p-6 border-l-4 border-primary' : 'p-6'), style: containerStyle, children: [_jsxs("div", { className: cn("mb-4", templateClasses.header), children: [_jsx("h1", { className: cn("font-bold", templateClasses.name), children: resume.content.personalInfo.fullName || 'Full Name' }), _jsxs("div", { className: cn("flex flex-wrap mt-2", templateClasses.contactInfo), children: [resume.content.personalInfo.location && (_jsx("span", { className: templateClasses.contactItem, children: resume.content.personalInfo.location })), resume.content.personalInfo.email && (_jsxs("span", { className: templateClasses.contactItem, children: [resume.content.personalInfo.location ? ' • ' : '', resume.content.personalInfo.email] })), resume.content.personalInfo.phone && (_jsxs("span", { className: templateClasses.contactItem, children: [(resume.content.personalInfo.location || resume.content.personalInfo.email) ? ' • ' : '', resume.content.personalInfo.phone] }))] }), _jsxs("div", { className: cn("flex flex-wrap mt-1", templateClasses.links), children: [resume.content.personalInfo.linkedIn && (_jsx("a", { href: resume.content.personalInfo.linkedIn, target: "_blank", rel: "noopener noreferrer", className: templateClasses.link, children: "LinkedIn" })), resume.content.personalInfo.portfolio && (_jsxs("span", { children: [resume.content.personalInfo.linkedIn ? ' • ' : '', _jsx("a", { href: resume.content.personalInfo.portfolio, target: "_blank", rel: "noopener noreferrer", className: templateClasses.link, children: "Portfolio" })] }))] })] }), resume.content.summary && (_jsxs("div", { className: cn("mb-5", templateClasses.section), children: [_jsx("h2", { className: cn(templateClasses.sectionTitle), children: style === 'minimal' ? 'professional summary' : 'Professional Summary' }), _jsx("p", { className: templateClasses.summary, children: resume.content.summary })] })), resume.content.skills && resume.content.skills.length > 0 && (_jsxs("div", { className: cn("mb-5", templateClasses.section), children: [_jsx("h2", { className: cn(templateClasses.sectionTitle), children: style === 'minimal' ? 'skills' : 'Skills' }), _jsx("div", { className: cn("flex flex-wrap gap-1.5", templateClasses.skillsContainer), children: resume.content.skills.map((skill, index) => (_jsx("span", { className: cn(templateClasses.skill), children: skill }, index))) })] })), resume.content.experience && resume.content.experience.length > 0 && (_jsxs("div", { className: cn("mb-5", templateClasses.section), children: [_jsx("h2", { className: cn(templateClasses.sectionTitle), children: style === 'minimal' ? 'experience' : 'Experience' }), _jsx("div", { className: cn("space-y-3", templateClasses.experienceContainer), children: resume.content.experience.map((exp, index) => (_jsxs("div", { className: templateClasses.experienceItem, children: [_jsxs("div", { className: cn("flex justify-between flex-wrap", templateClasses.expHeader), children: [_jsx("h3", { className: templateClasses.jobTitle, children: exp.position }), _jsxs("div", { className: templateClasses.dates, children: [formatDate(exp.startDate), " \u2013 ", exp.currentJob ? 'Present' : formatDate(exp.endDate)] })] }), _jsx("div", { className: templateClasses.company, children: exp.company }), exp.description && _jsx("p", { className: templateClasses.description, children: exp.description }), exp.achievements && exp.achievements.length > 0 && (_jsx("ul", { className: cn("list-disc pl-5 mt-1 space-y-1", templateClasses.achievementsList), children: exp.achievements.map((achievement, i) => (_jsx("li", { className: templateClasses.achievementItem, children: achievement }, i))) }))] }, index))) })] })), resume.content.education && resume.content.education.length > 0 && (_jsxs("div", { className: cn("mb-5", templateClasses.section), children: [_jsx("h2", { className: cn(templateClasses.sectionTitle), children: style === 'minimal' ? 'education' : 'Education' }), _jsx("div", { className: cn("space-y-3", templateClasses.educationContainer), children: resume.content.education.map((edu, index) => (_jsxs("div", { className: templateClasses.educationItem, children: [_jsxs("div", { className: cn("flex justify-between flex-wrap", templateClasses.eduHeader), children: [_jsxs("h3", { className: templateClasses.degree, children: [edu.degree, edu.field ? ` in ${edu.field}` : ''] }), _jsxs("div", { className: templateClasses.dates, children: [formatDate(edu.startDate), " \u2013 ", edu.endDate ? formatDate(edu.endDate) : 'Present'] })] }), _jsx("div", { className: templateClasses.institution, children: edu.institution }), edu.description && _jsx("p", { className: templateClasses.description, children: edu.description })] }, index))) })] })), resume.content.projects && resume.content.projects.length > 0 && (_jsxs("div", { className: cn("mb-5", templateClasses.section), children: [_jsx("h2", { className: cn(templateClasses.sectionTitle), children: style === 'minimal' ? 'projects' : 'Projects' }), _jsx("div", { className: cn("space-y-3", templateClasses.projectsContainer), children: resume.content.projects.map((project, index) => (_jsxs("div", { className: templateClasses.projectItem, children: [_jsxs("h3", { className: templateClasses.projectTitle, children: [project.name, project.url && (_jsx("a", { href: project.url, target: "_blank", rel: "noopener noreferrer", className: cn("ml-1.5", templateClasses.projectLink), children: "(Link)" }))] }), project.description && _jsx("p", { className: templateClasses.description, children: project.description })] }, index))) })] }))] }));
}
// Helper function to get template-specific classes
function getTemplateClasses(style) {
    const baseClasses = {
        header: "pb-3",
        name: "text-2xl",
        contactInfo: "text-sm text-neutral-600",
        contactItem: "",
        links: "text-sm",
        link: "text-primary hover:underline",
        section: "",
        sectionTitle: "text-lg font-semibold pb-1 mb-2",
        summary: "text-sm",
        skillsContainer: "mt-2",
        skill: "bg-primary/10 text-primary px-2 py-1 rounded text-sm",
        experienceContainer: "mt-2",
        experienceItem: "mb-3",
        expHeader: "",
        jobTitle: "font-medium",
        company: "text-sm font-medium text-primary",
        dates: "text-sm text-neutral-600",
        description: "text-sm mt-1.5",
        achievementsList: "",
        achievementItem: "text-sm",
        educationContainer: "mt-2",
        educationItem: "mb-3",
        eduHeader: "",
        degree: "font-medium",
        institution: "text-sm font-medium text-primary",
        projectsContainer: "mt-2",
        projectItem: "mb-3",
        projectTitle: "font-medium",
        projectLink: "text-sm text-primary hover:underline",
    };
    // Customize based on template style
    switch (style) {
        case 'modern':
            return {
                ...baseClasses,
                header: "pb-5 text-center",
                name: "text-3xl font-bold text-primary",
                contactInfo: "text-sm text-neutral-600 flex justify-center",
                sectionTitle: "text-lg font-bold text-primary uppercase tracking-wide mb-2.5 pb-0",
                skill: "bg-primary/5 text-neutral-800 border border-primary/20 px-3 py-1 rounded-full text-xs",
                skillsContainer: "gap-1.5 mt-2",
                company: "text-sm font-semibold text-primary/90",
                jobTitle: "font-semibold text-neutral-800",
                dates: "text-xs text-neutral-500 font-medium bg-neutral-100 px-2 py-1 rounded",
                description: "text-sm mt-1.5 leading-snug",
                section: "mt-4 relative",
            };
        case 'classic':
            return {
                ...baseClasses,
                header: "border-b-2 border-neutral-800 pb-4",
                name: "text-2xl font-bold text-neutral-800 uppercase tracking-wide",
                contactInfo: "text-sm text-neutral-700",
                sectionTitle: "text-lg font-semibold text-neutral-800 border-b border-neutral-300 pb-1 mb-3 uppercase",
                skill: "bg-neutral-100 text-neutral-800 px-2 py-1 rounded-sm text-sm border border-neutral-200",
                skillsContainer: "gap-1.5 mt-2",
                description: "text-sm mt-1.5 leading-snug",
                dates: "text-sm text-neutral-700 font-medium",
                section: "mb-5 mt-4",
                jobTitle: "font-bold text-neutral-800",
                company: "text-sm font-semibold text-neutral-700",
            };
        case 'minimal':
            return {
                ...baseClasses,
                header: "pb-5",
                name: "text-2xl font-light",
                contactInfo: "text-sm text-neutral-500",
                sectionTitle: "text-base lowercase tracking-wider font-normal text-neutral-400 pb-1 mb-2",
                skill: "bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-sm text-xs",
                skillsContainer: "gap-1 mt-2",
                jobTitle: "font-medium text-neutral-700",
                company: "text-sm text-neutral-500",
                dates: "text-sm text-neutral-400",
                description: "text-sm mt-1.5 text-neutral-600 leading-snug",
                section: "mb-5 mt-4",
            };
        case 'professional':
            return {
                ...baseClasses,
                header: "border-b border-neutral-300 pb-4",
                name: "text-2xl font-bold text-neutral-800",
                contactInfo: "text-sm text-neutral-700",
                sectionTitle: "text-lg font-semibold text-primary border-b border-neutral-200 pb-1 mb-3 uppercase tracking-wide",
                skill: "bg-neutral-50 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded-sm text-xs",
                skillsContainer: "gap-1.5 mt-2",
                jobTitle: "font-semibold",
                company: "text-sm font-medium text-primary/90",
                description: "text-sm mt-1.5 leading-snug",
                dates: "text-sm text-neutral-700 font-medium",
                section: "mb-5 mt-4",
            };
        default:
            return baseClasses;
    }
}
