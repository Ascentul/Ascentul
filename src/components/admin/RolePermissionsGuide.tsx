'use client';

import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import {
  AlertTriangle,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Info,
  School,
  Shield,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RoleInfo {
  role: string;
  displayName: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  permissions: {
    feature: string;
    access: 'full' | 'limited' | 'own' | 'none';
    details?: string;
  }[];
}

const rolePermissions: RoleInfo[] = [
  {
    role: 'super_admin',
    displayName: 'Super Admin',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-red-500',
    description: 'Full platform access with all administrative privileges',
    permissions: [
      { feature: 'Platform Settings', access: 'full', details: 'Configure system-wide settings' },
      { feature: 'User Management', access: 'full', details: 'Create, edit, delete any user' },
      {
        feature: 'University Management',
        access: 'full',
        details: 'Create and manage all universities',
      },
      {
        feature: 'Student Management',
        access: 'full',
        details: 'Manage students across all universities',
      },
      {
        feature: 'Platform Analytics',
        access: 'full',
        details: 'View system-wide metrics and reports',
      },
      { feature: 'University Analytics', access: 'full', details: 'View all university analytics' },
      { feature: 'Audit Logs', access: 'full', details: 'View all system audit logs' },
      { feature: 'Support Tickets', access: 'full', details: 'Manage all support tickets' },
      {
        feature: 'Career Tools',
        access: 'full',
        details: 'Access all career development features',
      },
    ],
  },
  {
    role: 'university_admin',
    displayName: 'University Admin',
    icon: <School className="h-4 w-4" />,
    color: 'bg-blue-500',
    description: 'Administrator for a specific university with scoped management access',
    permissions: [
      { feature: 'Platform Settings', access: 'none' },
      {
        feature: 'User Management',
        access: 'limited',
        details: 'Manage users within own university only',
      },
      {
        feature: 'University Management',
        access: 'own',
        details: 'Manage own university settings',
      },
      {
        feature: 'Student Management',
        access: 'limited',
        details: 'Manage students in own university',
      },
      { feature: 'Platform Analytics', access: 'none' },
      { feature: 'University Analytics', access: 'own', details: 'View own university analytics' },
      { feature: 'Audit Logs', access: 'none' },
      {
        feature: 'Support Tickets',
        access: 'limited',
        details: 'View and manage university tickets',
      },
      {
        feature: 'Career Tools',
        access: 'full',
        details: 'Access all career development features',
      },
    ],
  },
  {
    role: 'advisor',
    displayName: 'Advisor',
    icon: <UserCog className="h-4 w-4" />,
    color: 'bg-purple-500',
    description: 'University advisor with student guidance capabilities',
    permissions: [
      { feature: 'Platform Settings', access: 'none' },
      { feature: 'User Management', access: 'none' },
      { feature: 'University Management', access: 'none' },
      {
        feature: 'Student Management',
        access: 'limited',
        details: 'View and assist assigned students',
      },
      { feature: 'Platform Analytics', access: 'none' },
      { feature: 'University Analytics', access: 'own', details: 'View own university analytics' },
      { feature: 'Audit Logs', access: 'none' },
      { feature: 'Support Tickets', access: 'limited', details: 'View university support tickets' },
      {
        feature: 'Career Tools',
        access: 'full',
        details: 'Access all career development features',
      },
    ],
  },
  {
    role: 'student',
    displayName: 'Student',
    icon: <GraduationCap className="h-4 w-4" />,
    color: 'bg-green-500',
    description: 'University-affiliated student with career development access',
    permissions: [
      { feature: 'Platform Settings', access: 'none' },
      { feature: 'User Management', access: 'none' },
      { feature: 'University Management', access: 'none' },
      { feature: 'Student Management', access: 'none' },
      { feature: 'Platform Analytics', access: 'none' },
      { feature: 'University Analytics', access: 'none' },
      { feature: 'Audit Logs', access: 'none' },
      { feature: 'Support Tickets', access: 'own', details: 'Create and view own support tickets' },
      {
        feature: 'Career Tools',
        access: 'full',
        details: 'Full access with university subscription',
      },
    ],
  },
  {
    role: 'individual',
    displayName: 'Individual',
    icon: <User className="h-4 w-4" />,
    color: 'bg-gray-500',
    description: 'Independent user with free or premium subscription',
    permissions: [
      { feature: 'Platform Settings', access: 'none' },
      { feature: 'User Management', access: 'none' },
      { feature: 'University Management', access: 'none' },
      { feature: 'Student Management', access: 'none' },
      { feature: 'Platform Analytics', access: 'none' },
      { feature: 'University Analytics', access: 'none' },
      { feature: 'Audit Logs', access: 'none' },
      { feature: 'Support Tickets', access: 'own', details: 'Create and view own support tickets' },
      { feature: 'Career Tools', access: 'full', details: 'Access based on subscription tier' },
    ],
  },
  {
    role: 'staff',
    displayName: 'Staff',
    icon: <Briefcase className="h-4 w-4" />,
    color: 'bg-orange-500',
    description: 'Internal staff member with support access',
    permissions: [
      { feature: 'Platform Settings', access: 'none' },
      { feature: 'User Management', access: 'none' },
      { feature: 'University Management', access: 'none' },
      { feature: 'Student Management', access: 'none' },
      { feature: 'Platform Analytics', access: 'none' },
      { feature: 'University Analytics', access: 'none' },
      { feature: 'Audit Logs', access: 'none' },
      { feature: 'Support Tickets', access: 'full', details: 'Manage all support tickets' },
      {
        feature: 'Career Tools',
        access: 'full',
        details: 'Access all career development features',
      },
    ],
  },
  {
    role: 'user',
    displayName: 'User (Legacy)',
    icon: <User className="h-4 w-4" />,
    color: 'bg-gray-400',
    description: 'Legacy individual user role (being migrated to individual)',
    permissions: [
      { feature: 'Platform Settings', access: 'none' },
      { feature: 'User Management', access: 'none' },
      { feature: 'University Management', access: 'none' },
      { feature: 'Student Management', access: 'none' },
      { feature: 'Platform Analytics', access: 'none' },
      { feature: 'University Analytics', access: 'none' },
      { feature: 'Audit Logs', access: 'none' },
      { feature: 'Support Tickets', access: 'own', details: 'Create and view own support tickets' },
      { feature: 'Career Tools', access: 'full', details: 'Access based on subscription tier' },
    ],
  },
];

const accessLevelColors = {
  full: 'text-green-600 bg-green-50',
  limited: 'text-blue-600 bg-blue-50',
  own: 'text-purple-600 bg-purple-50',
  none: 'text-gray-400 bg-gray-50',
};

const accessLevelIcons = {
  full: <Check className="h-4 w-4" />,
  limited: <Check className="h-4 w-4" />,
  own: <Check className="h-4 w-4" />,
  none: <X className="h-4 w-4" />,
};

export function RolePermissionsGuide() {
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  // Fetch route access mappings from backend (single source of truth)
  const roleRoutes = useQuery(api.roleValidation.getAllRoleRoutes);

  // Distinguish between loading (undefined) and error (query failed)
  const isLoadingRoutes = roleRoutes === undefined;

  const toggleRole = (role: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(role)) {
      newExpanded.delete(role);
    } else {
      newExpanded.add(role);
    }
    setExpandedRoles(newExpanded);
  };

  const expandAll = () => {
    setExpandedRoles(new Set(rolePermissions.map((r) => r.role)));
  };

  const collapseAll = () => {
    setExpandedRoles(new Set());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Role Permissions Guide</CardTitle>
            <CardDescription>
              Detailed breakdown of what each role can access and manage
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Roles are managed in Clerk (source of truth). Changes sync
            automatically to the database via webhook. The database role is used for display
            purposes only.
          </AlertDescription>
        </Alert>

        {/* Permission Matrix Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Feature / Route</TableHead>
                {rolePermissions.map((roleInfo) => (
                  <TableHead key={roleInfo.role} className="text-center min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`p-1.5 rounded-full ${roleInfo.color} text-white`}>
                        {roleInfo.icon}
                      </div>
                      <span className="text-xs font-semibold">{roleInfo.displayName}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Create rows for each unique feature */}
              {rolePermissions.length > 0 &&
                Array.from(
                  new Set(rolePermissions.flatMap((r) => r.permissions.map((p) => p.feature))),
                ).map((feature) => (
                  <TableRow key={feature}>
                    <TableCell className="font-medium">{feature}</TableCell>
                    {rolePermissions.map((roleInfo) => {
                      const permission = roleInfo.permissions.find((p) => p.feature === feature);
                      const access = permission?.access || 'none';
                      return (
                        <TableCell key={roleInfo.role} className="text-center">
                          <div className="flex items-center justify-center">
                            <Badge
                              variant="outline"
                              className={`${accessLevelColors[access]} flex items-center gap-1`}
                            >
                              {accessLevelIcons[access]}
                              <span className="capitalize text-xs">
                                {access === 'none' ? '' : access}
                              </span>
                            </Badge>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {/* Detailed Role Breakdowns */}
        <div className="space-y-3 mt-6">
          <h3 className="text-lg font-semibold mb-3">Detailed Role Descriptions</h3>
          {rolePermissions.map((roleInfo) => (
            <Collapsible
              key={roleInfo.role}
              open={expandedRoles.has(roleInfo.role)}
              onOpenChange={() => toggleRole(roleInfo.role)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${roleInfo.color} text-white`}>
                          {roleInfo.icon}
                        </div>
                        <div>
                          <CardTitle className="text-base">{roleInfo.displayName}</CardTitle>
                          <CardDescription>{roleInfo.description}</CardDescription>
                        </div>
                      </div>
                      {expandedRoles.has(roleInfo.role) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {roleInfo.permissions.map((perm) => (
                        <div
                          key={perm.feature}
                          className="flex items-start justify-between p-3 rounded-lg border"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{perm.feature}</div>
                            {perm.details && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {perm.details}
                              </div>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={`${accessLevelColors[perm.access]} ml-4`}
                          >
                            {accessLevelIcons[perm.access]}
                            <span className="ml-1 capitalize">{perm.access}</span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>

        {/* Route Access Information - Dynamic from Backend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Protected Routes by Role</CardTitle>
            <CardDescription>
              Route access control - loaded from backend (single source of truth)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRoutes ? (
              <div className="text-sm text-muted-foreground">Loading route access data...</div>
            ) : !roleRoutes ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load route access data. Please refresh the page or contact support if
                  the issue persists.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {roleRoutes.map(({ role, routes }) => {
                  const roleInfo = rolePermissions.find((r) => r.role === role);

                  // Skip roles with no routes
                  if (!routes || routes.length === 0) return null;

                  return (
                    <div key={role} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {roleInfo?.icon}
                        <span className="font-semibold">{roleInfo?.displayName || role}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {routes.length} {routes.length === 1 ? 'route' : 'routes'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {routes.map((route) => (
                          <div key={route} className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {route}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
