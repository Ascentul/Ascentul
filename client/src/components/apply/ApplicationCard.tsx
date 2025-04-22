import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { CalendarDays, Building, MapPin, Link as LinkIcon } from 'lucide-react';
import { type JobApplication } from '@shared/schema';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ApplicationCardProps {
  application: JobApplication;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

export const ApplicationCard = ({ 
  application, 
  onClick,
  isSelected = false,
  className
}: ApplicationCardProps) => {
  // Determine background based on status
  const getStatusBackground = () => {
    switch (application.status) {
      case 'Offer':
        return 'bg-green-50';
      case 'Rejected':
        return 'bg-red-50';
      default:
        return '';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-colors hover:bg-accent/50",
          isSelected ? "border-primary" : "",
          getStatusBackground(),
          className
        )}
        onClick={onClick}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4 text-muted-foreground" />
                {application.companyName}
              </div>
            </CardTitle>
            <ApplicationStatusBadge status={application.status} />
          </div>
          <CardDescription>{application.jobTitle}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          {application.jobLocation && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              {application.jobLocation}
            </div>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="h-3 w-3 mr-1" />
            {application.applicationDate 
              ? new Date(application.applicationDate).toLocaleDateString() 
              : new Date(application.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ApplicationCard;