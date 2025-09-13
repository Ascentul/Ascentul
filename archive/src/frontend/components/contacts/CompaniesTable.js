import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, CalendarDays, Users, ChevronRight } from 'lucide-react';
export default function CompaniesTable({ contacts, onSelectCompany }) {
    // Group contacts by company and calculate stats
    const companyData = useMemo(() => {
        const companiesMap = new Map();
        // Group contacts by company
        contacts.forEach(contact => {
            if (contact.company) {
                const companyName = contact.company;
                if (!companiesMap.has(companyName)) {
                    companiesMap.set(companyName, []);
                }
                companiesMap.get(companyName)?.push(contact);
            }
        });
        // Calculate stats for each company
        const result = [];
        companiesMap.forEach((companyContacts, companyName) => {
            // Find the most recent contact date
            let mostRecentDate = null;
            companyContacts.forEach(contact => {
                if (contact.lastContactedDate) {
                    const contactDate = new Date(contact.lastContactedDate);
                    if (!mostRecentDate || contactDate > mostRecentDate) {
                        mostRecentDate = contactDate;
                    }
                }
            });
            result.push({
                name: companyName,
                contactCount: companyContacts.length,
                mostRecentContact: mostRecentDate,
                contacts: companyContacts
            });
        });
        // Sort by company name (alphabetically)
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [contacts]);
    return (_jsx("div", { className: "border rounded-md shadow-sm bg-white", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-[250px]", children: "Company Name" }), _jsx(TableHead, { children: "Number of Contacts" }), _jsx(TableHead, { children: "Most Recent Contact Date" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsxs(TableBody, { children: [companyData.map((company) => (_jsxs(TableRow, { className: "group hover:bg-muted/20", children: [_jsx(TableCell, { className: "font-medium", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0", children: _jsx(Building, { className: "h-5 w-5" }) }), _jsx("div", { children: _jsx("div", { className: "font-medium hover:text-primary cursor-pointer", onClick: () => onSelectCompany(company.name), children: company.name }) })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Users, { className: "w-3 h-3 text-muted-foreground" }), _jsxs("span", { children: [company.contactCount, " ", company.contactCount === 1 ? 'person' : 'people'] })] }) }), _jsx(TableCell, { children: _jsx("div", { className: "flex flex-col", children: company.mostRecentContact ? (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(CalendarDays, { className: "w-3 h-3 text-muted-foreground" }), _jsx("span", { children: format(new Date(company.mostRecentContact), 'MMM d, yyyy') })] })) : (_jsx(Badge, { variant: "secondary", className: "text-gray-700 bg-gray-100 hover:bg-gray-100 text-xs px-[0.625rem] py-0.5", children: "Never contacted" })) }) }), _jsx(TableCell, { className: "text-right", children: _jsxs(Button, { variant: "ghost", className: "h-8 w-8 p-0 mr-2", onClick: () => onSelectCompany(company.name), children: [_jsx("span", { className: "sr-only", children: "View all" }), _jsx(ChevronRight, { className: "h-4 w-4" })] }) })] }, company.name))), companyData.length === 0 && (_jsx(TableRow, { children: _jsxs(TableCell, { colSpan: 4, className: "text-center py-12", children: [_jsx(Building, { className: "w-12 h-12 mx-auto text-muted-foreground" }), _jsx("h3", { className: "text-lg font-medium mt-4", children: "No companies found" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Add contacts with company information to see them here" })] }) }))] })] }) }));
}
