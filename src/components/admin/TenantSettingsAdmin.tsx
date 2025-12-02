'use client';

/**
 * TenantSettingsAdmin Component
 *
 * Admin UI for managing tenant settings with optimistic locking.
 * Super admins can select any tenant; university admins see only their university.
 */

import { useUser } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  Loader2,
  RefreshCw,
  Save,
  Settings,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/ClerkAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { hasPlatformAdminAccess } from '@/lib/constants/roles';

// Types
type TenantId = Id<'universities'> | 'b2c_default';

interface TenantSetting {
  key: string;
  value: unknown;
  version: number;
  valueType?: string;
  updatedAt?: number;
}

// Setting categories for organized display
const SETTING_CATEGORIES = {
  'Feature Modules': {
    icon: Settings,
    settings: [
      { key: 'features.resume_studio.enabled', label: 'Resume Studio', type: 'boolean' },
      { key: 'features.ai_coach.enabled', label: 'AI Coach', type: 'boolean' },
      {
        key: 'features.career_path_explorer.enabled',
        label: 'Career Path Explorer',
        type: 'boolean',
      },
      { key: 'features.network_hub.enabled', label: 'Network Hub', type: 'boolean' },
      { key: 'features.interview_practice.enabled', label: 'Interview Practice', type: 'boolean' },
    ],
  },
  'SLA Settings': {
    icon: Users,
    settings: [
      { key: 'sla.resume_review_hours', label: 'Resume Review SLA (hours)', type: 'number' },
      {
        key: 'sla.cover_letter_review_hours',
        label: 'Cover Letter Review SLA (hours)',
        type: 'number',
      },
      { key: 'sessions.booking.max_days_ahead', label: 'Max Booking Days Ahead', type: 'number' },
      {
        key: 'sessions.cancellation_cutoff_hours',
        label: 'Cancellation Cutoff (hours)',
        type: 'number',
      },
    ],
  },
  'Notification Defaults': {
    icon: Settings,
    settings: [
      {
        key: 'notifications.session_reminders.default_on',
        label: 'Session Reminders Default',
        type: 'boolean',
      },
      {
        key: 'notifications.application_followups.default_on',
        label: 'Application Follow-ups Default',
        type: 'boolean',
      },
      {
        key: 'notifications.weekly_digest.default_on',
        label: 'Weekly Digest Default',
        type: 'boolean',
      },
    ],
  },
  Branding: {
    icon: Building2,
    settings: [
      { key: 'branding.logo_url', label: 'Logo URL', type: 'string' },
      { key: 'branding.primary_color', label: 'Primary Color', type: 'string' },
      { key: 'branding.campus_display_name', label: 'Campus Display Name', type: 'string' },
    ],
  },
} as const;

export function TenantSettingsAdmin() {
  const { user: clerkUser } = useUser();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [selectedTenant, setSelectedTenant] = useState<TenantId>('b2c_default');
  const [localSettings, setLocalSettings] = useState<
    Record<string, { value: unknown; version: number }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);
  const [versionConflict, setVersionConflict] = useState<{
    key: string;
    currentVersion: number;
  } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Feature Modules']);

  // Authorization
  const isSuperAdmin = hasPlatformAdminAccess(user?.role);
  const isUniversityAdmin = user?.role === 'university_admin';
  const canManageSettings = isSuperAdmin || isUniversityAdmin;

  // Queries
  const universities = useQuery(
    api.universities_admin.getAllUniversities,
    isSuperAdmin ? {} : 'skip',
  );

  const tenantSettings = useQuery(
    api.tenant_settings.getAllSettings,
    canManageSettings ? { tenantId: selectedTenant } : 'skip',
  );

  // Mutations
  const upsertSetting = useMutation(api.tenant_settings.upsertSetting);
  const initializeDefaults = useMutation(api.tenant_settings.initializeTenantDefaults);

  // Set initial tenant based on user role
  useEffect(() => {
    if (isUniversityAdmin && user?.university_id) {
      setSelectedTenant(user.university_id as TenantId);
    }
  }, [isUniversityAdmin, user?.university_id]);

  // Sync server settings to local state
  useEffect(() => {
    if (tenantSettings) {
      const settingsMap: Record<string, { value: unknown; version: number }> = {};
      for (const setting of tenantSettings) {
        settingsMap[setting.key] = { value: setting.value, version: setting.version };
      }
      setLocalSettings(settingsMap);
    }
  }, [tenantSettings]);

  if (!canManageSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Only Super Admins and University Admins can manage tenant settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSettingChange = (key: string, value: unknown) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: { value, version: prev[key]?.version ?? 0 },
    }));
    // Clear any version conflict for this key when user makes changes
    if (versionConflict?.key === key) {
      setVersionConflict(null);
    }
  };

  const handleSaveSetting = async (key: string) => {
    if (!clerkUser) return;

    const setting = localSettings[key];
    if (!setting) return;

    setSaving(key);
    setVersionConflict(null);

    try {
      await upsertSetting({
        tenantId: selectedTenant,
        key,
        value: setting.value,
        expectedVersion: setting.version,
      });

      // Update local version after successful save
      setLocalSettings((prev) => ({
        ...prev,
        [key]: { ...prev[key], version: (prev[key]?.version ?? 0) + 1 },
      }));

      toast({
        title: 'Setting saved',
        description: `${key} has been updated successfully.`,
      });
    } catch (error: unknown) {
      // Check for version conflict
      if (
        error &&
        typeof error === 'object' &&
        'data' in error &&
        (error as any).data?.code === 'VERSION_CONFLICT'
      ) {
        const currentVersion = (error as any).data?.currentVersion;
        setVersionConflict({ key, currentVersion });
        toast({
          title: 'Version conflict',
          description: 'This setting was modified by another user. Please reload and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: `Failed to save setting: ${key}`,
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(null);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!clerkUser) return;

    setSaving('initialize');
    try {
      const result = await initializeDefaults({
        tenantId: selectedTenant,
      });

      toast({
        title: 'Defaults initialized',
        description: `Created ${result.created.length} settings, skipped ${result.skipped.length} existing.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize default settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleReloadSettings = () => {
    setVersionConflict(null);
    // Force refetch by re-mounting the component
    window.location.reload();
  };

  const getSettingValue = (key: string, defaultValue: unknown): unknown => {
    return localSettings[key]?.value ?? defaultValue;
  };

  const renderSettingInput = (setting: { key: string; label: string; type: string }) => {
    const currentValue = getSettingValue(setting.key, setting.type === 'boolean' ? false : '');
    const hasConflict = versionConflict?.key === setting.key;
    const isSaving = saving === setting.key;

    return (
      <div key={setting.key} className="flex items-center justify-between py-3">
        <div className="space-y-0.5 flex-1">
          <Label className={hasConflict ? 'text-destructive' : ''}>{setting.label}</Label>
          <p className="text-xs text-muted-foreground font-mono">{setting.key}</p>
          {localSettings[setting.key]?.version && (
            <p className="text-xs text-muted-foreground">v{localSettings[setting.key].version}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {setting.type === 'boolean' && (
            <Switch
              checked={currentValue as boolean}
              onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
              disabled={isSaving}
            />
          )}
          {setting.type === 'number' && (
            <Input
              type="number"
              value={currentValue as number}
              onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value) || 0)}
              className="w-24"
              disabled={isSaving}
            />
          )}
          {setting.type === 'string' && (
            <Input
              value={currentValue as string}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="w-64"
              disabled={isSaving}
              placeholder={setting.key.includes('color') ? '#5371FF' : undefined}
            />
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSaveSetting(setting.key)}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  return (
    <div className="space-y-6">
      {/* Tenant Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Tenant Settings
          </CardTitle>
          <CardDescription>
            Configure per-tenant settings including feature modules, SLA rules, and branding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Select Tenant</Label>
              <Select
                value={selectedTenant}
                onValueChange={(value: string) => setSelectedTenant(value as TenantId)}
                disabled={isUniversityAdmin}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="b2c_default">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      B2C Default (Individual Users)
                    </div>
                  </SelectItem>
                  {universities?.map((uni) => (
                    <SelectItem key={uni._id} value={uni._id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {uni.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-5">
              <Button variant="outline" size="sm" onClick={handleReloadSettings}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload
              </Button>
              {isSuperAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInitializeDefaults}
                  disabled={saving === 'initialize'}
                >
                  {saving === 'initialize' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Initialize Defaults
                </Button>
              )}
            </div>
          </div>

          {/* Current Tenant Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">
              {selectedTenant === 'b2c_default' ? 'B2C' : 'University'}
            </Badge>
            <span>{tenantSettings?.length ?? 0} settings configured</span>
          </div>
        </CardContent>
      </Card>

      {/* Version Conflict Alert */}
      {versionConflict && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Version Conflict Detected</AlertTitle>
          <AlertDescription>
            The setting &quot;{versionConflict.key}&quot; was modified by another user (now at
            version {versionConflict.currentVersion}). Please reload the page to get the latest
            values.
            <Button variant="outline" size="sm" className="ml-4" onClick={handleReloadSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Settings
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Categories */}
      {Object.entries(SETTING_CATEGORIES).map(([categoryName, category]) => {
        const Icon = category.icon;
        const isExpanded = expandedCategories.includes(categoryName);

        return (
          <Card key={categoryName}>
            <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(categoryName)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {categoryName}
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {category.settings.map((setting) => renderSettingInput(setting))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Raw Settings Debug View (for super admins) */}
      {isSuperAdmin && tenantSettings && tenantSettings.length > 0 && (
        <Card>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Raw Settings Data (Debug)</span>
                  <ChevronDown className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-64">
                  {JSON.stringify(tenantSettings, null, 2)}
                </pre>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}
