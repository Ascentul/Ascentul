'use client';

import { useUser } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { BookOpen, Building, GraduationCap, Search, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

export function UniversitySearchCommand() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search results
  const searchResults = useQuery(
    api.university_admin.universitySearch,
    clerkUser?.id && debouncedQuery.length >= 2
      ? { clerkId: clerkUser.id, query: debouncedQuery, limit: 5 }
      : 'skip',
  );

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback(
    (type: string, id: string, clerkId?: string) => {
      setOpen(false);
      setSearchQuery('');

      switch (type) {
        case 'student':
          if (clerkId) {
            router.push(`/university/students?profile=${clerkId}`);
          } else {
            router.push('/university/students');
          }
          break;
        case 'advisor':
          router.push('/university/students?tab=advisors');
          break;
        case 'department':
          router.push(`/university/departments?id=${id}`);
          break;
        case 'course':
          router.push(`/university/courses/${id}`);
          break;
        default:
          break;
      }
    },
    [router],
  );

  const hasResults =
    searchResults &&
    (searchResults.students.length > 0 ||
      searchResults.advisors.length > 0 ||
      searchResults.departments.length > 0 ||
      searchResults.courses.length > 0);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-lg bg-white/80 text-sm font-normal text-muted-foreground shadow-sm sm:pr-12 md:w-64 lg:w-80"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search students, advisors, departments...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.4rem] top-[0.4rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search students, advisors, departments, courses..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {debouncedQuery.length < 2 && (
            <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
          )}

          {debouncedQuery.length >= 2 && !searchResults && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}

          {debouncedQuery.length >= 2 && searchResults && !hasResults && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {searchResults && searchResults.students.length > 0 && (
            <CommandGroup heading="Students">
              {searchResults.students.map((student) => (
                <CommandItem
                  key={String(student._id)}
                  value={`student-${student.email}`}
                  onSelect={() => handleSelect('student', String(student._id), student.clerkId)}
                  className="cursor-pointer"
                >
                  <GraduationCap className="mr-2 h-4 w-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-xs text-muted-foreground">{student.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchResults && searchResults.advisors.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Advisors">
                {searchResults.advisors.map((advisor) => (
                  <CommandItem
                    key={String(advisor._id)}
                    value={`advisor-${advisor.email}`}
                    onSelect={() => handleSelect('advisor', String(advisor._id))}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4 text-purple-500" />
                    <div className="flex flex-col">
                      <span className="font-medium">{advisor.name}</span>
                      <span className="text-xs text-muted-foreground">{advisor.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {searchResults && searchResults.departments.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Departments">
                {searchResults.departments.map((dept) => (
                  <CommandItem
                    key={String(dept._id)}
                    value={`department-${dept.name}`}
                    onSelect={() => handleSelect('department', String(dept._id))}
                    className="cursor-pointer"
                  >
                    <Building className="mr-2 h-4 w-4 text-green-500" />
                    <div className="flex flex-col">
                      <span className="font-medium">{dept.name}</span>
                      {dept.code && (
                        <span className="text-xs text-muted-foreground">Code: {dept.code}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {searchResults && searchResults.courses.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Courses">
                {searchResults.courses.map((course) => (
                  <CommandItem
                    key={String(course._id)}
                    value={`course-${course.title}`}
                    onSelect={() => handleSelect('course', String(course._id))}
                    className="cursor-pointer"
                  >
                    <BookOpen className="mr-2 h-4 w-4 text-orange-500" />
                    <div className="flex flex-col">
                      <span className="font-medium">{course.title}</span>
                      {course.category && (
                        <span className="text-xs text-muted-foreground">{course.category}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Quick Actions */}
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                setOpen(false);
                router.push('/university/students');
              }}
              className="cursor-pointer"
            >
              <Users className="mr-2 h-4 w-4" />
              <span>View All Students</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                router.push('/university/departments');
              }}
              className="cursor-pointer"
            >
              <Building className="mr-2 h-4 w-4" />
              <span>View All Departments</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                router.push('/university/courses');
              }}
              className="cursor-pointer"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>View All Courses</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                router.push('/university/invite');
              }}
              className="cursor-pointer"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              <span>Invite Students</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
