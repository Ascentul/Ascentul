import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { NetworkingContact } from '@shared/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, CalendarDays, Users, ChevronRight } from 'lucide-react';

interface CompaniesTableProps {
  contacts: NetworkingContact[];
  onSelectCompany: (companyName: string) => void;
}

interface CompanyData {
  name: string;
  contactCount: number;
  mostRecentContact: Date | null;
  contacts: NetworkingContact[];
}

export default function CompaniesTable({ 
  contacts, 
  onSelectCompany 
}: CompaniesTableProps) {
  
  // Group contacts by company and calculate stats
  const companyData = useMemo<CompanyData[]>(() => {
    const companiesMap = new Map<string, NetworkingContact[]>();
    
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
    const result: CompanyData[] = [];
    companiesMap.forEach((companyContacts, companyName) => {
      // Find the most recent contact date
      let mostRecentDate: Date | null = null;
      
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

  return (
    <div className="border rounded-md shadow-sm bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Company Name</TableHead>
            <TableHead>Number of Contacts</TableHead>
            <TableHead>Most Recent Contact Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companyData.map((company) => (
            <TableRow key={company.name} className="group hover:bg-muted/20">
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium hover:text-primary cursor-pointer" onClick={() => onSelectCompany(company.name)}>
                      {company.name}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span>{company.contactCount} {company.contactCount === 1 ? 'person' : 'people'}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {company.mostRecentContact ? (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-muted-foreground" />
                      <span>{format(new Date(company.mostRecentContact), 'MMM d, yyyy')}</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-transparent px-1.5 py-0 text-xs inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap">
                      Never contacted
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0 mr-2"
                  onClick={() => onSelectCompany(company.name)}
                >
                  <span className="sr-only">View all</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {companyData.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12">
                <Building className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium mt-4">No companies found</h3>
                <p className="text-muted-foreground mt-2">
                  Add contacts with company information to see them here
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}