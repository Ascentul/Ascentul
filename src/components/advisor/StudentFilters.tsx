"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface StudentFiltersProps {
  selectedMajor: string;
  selectedGradYear: string;
  selectedStatus: string;
  onMajorChange: (value: string) => void;
  onGradYearChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
  majors: string[];
  gradYears: string[];
  hasActiveFilters: boolean;
}

export function StudentFilters({
  selectedMajor,
  selectedGradYear,
  selectedStatus,
  onMajorChange,
  onGradYearChange,
  onStatusChange,
  onClearFilters,
  majors,
  gradYears,
  hasActiveFilters,
}: StudentFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedMajor} onValueChange={onMajorChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Majors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Majors</SelectItem>
          {majors?.map((major) => (
            <SelectItem key={major} value={major}>
              {major}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedGradYear} onValueChange={onGradYearChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Grad Years" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Grad Years</SelectItem>
          {gradYears?.map((year) => (
            <SelectItem key={year} value={year}>
              {"Class of " + year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active (has apps)</SelectItem>
          <SelectItem value="at-risk">At Risk (inactive 60+ days)</SelectItem>
          <SelectItem value="has-offer">Has Offer</SelectItem>
          <SelectItem value="inactive">Inactive (no apps)</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-1"
          aria-label="Clear all filters"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
