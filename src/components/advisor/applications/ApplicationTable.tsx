"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Building2, User, Calendar, ExternalLink, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { isValidHttpUrl } from "@/lib/utils";
import { ACTIVE_STAGES, type ApplicationStage } from "@/lib/advisor/stages";

interface Application {
  _id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  company_name: string;
  position_title: string;
  stage: ApplicationStage;
  status?: string;
  application_url?: string;
  applied_date?: number;
  next_step?: string;
  next_step_date?: number;
  notes?: string;
  created_at: number;
  updated_at: number;
}

interface ApplicationTableProps {
  applications: Application[];
  isLoading?: boolean;
}

const STAGE_BADGE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Prospect: "outline",
  Applied: "default",
  Interview: "secondary",
  Offer: "default",
  Accepted: "default",
  Rejected: "destructive",
  Withdrawn: "secondary",
  Archived: "outline",
};

export function ApplicationTable({ applications, isLoading }: ApplicationTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "student" | "company">("date");

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      app.company_name.toLowerCase().includes(search) ||
      app.position_title.toLowerCase().includes(search) ||
      app.student_name.toLowerCase().includes(search);

    const matchesStage = stageFilter === "all" || app.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  // Sort applications
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortBy === "date") {
      // Use ?? instead of || to avoid treating 0 (epoch) as falsy
      return (b.applied_date ?? b.created_at) - (a.applied_date ?? a.created_at);
    } else if (sortBy === "student") {
      return a.student_name.localeCompare(b.student_name);
    } else {
      return a.company_name.localeCompare(b.company_name);
    }
  });

  const now = Date.now();
  const activeStages = ACTIVE_STAGES;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <label htmlFor="application-search" className="sr-only">
            Search applications
          </label>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="application-search"
            placeholder="Search by company, position, or student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={stageFilter} onValueChange={setStageFilter} aria-label="Filter by stage">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="Prospect">Prospect</SelectItem>
            <SelectItem value="Applied">Applied</SelectItem>
            <SelectItem value="Interview">Interview</SelectItem>
            <SelectItem value="Offer">Offer</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Withdrawn">Withdrawn</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(val) => setSortBy(val as "date" | "student" | "company")} aria-label="Sort by">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedApplications.length} of {applications.length} applications
      </div>

      {/* Table */}
      {sortedApplications.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || stageFilter !== "all"
              ? "No applications match your filters"
              : "No applications yet"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Next Step</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedApplications.map((app) => {
                const isActive = activeStages.includes(app.stage);
                const isOverdue =
                  isActive && app.next_step_date && app.next_step_date < now;

                return (
                  <TableRow
                    key={app._id}
                    className={isOverdue ? "bg-orange-50" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{app.company_name}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-xs truncate">
                        {app.position_title}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{app.student_name}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={STAGE_BADGE_VARIANTS[app.stage] || "outline"}>
                        {app.stage}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {app.applied_date ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(app.applied_date), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {app.next_step && isActive ? (
                        <div className="max-w-xs">
                          <div className="text-sm truncate flex items-center gap-1">
                            {isOverdue && (
                              <AlertCircle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                            )}
                            {app.next_step}
                          </div>
                          {app.next_step_date && app.next_step_date > 0 && (
                            <div
                              className={`text-xs ${
                                isOverdue ? "text-orange-600" : "text-muted-foreground"
                              }`}
                            >
                              {format(new Date(app.next_step_date), "MMM d")}
                              {isOverdue && " (Overdue)"}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/advisor/students/${app.user_id}`}>
                          <Button variant="ghost" size="sm">
                            View Student
                          </Button>
                        </Link>
                        {app.application_url && isValidHttpUrl(app.application_url) && (
                          <a
                            href={app.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open application for ${app.company_name} in new tab`}
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
