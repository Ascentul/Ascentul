'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type {
  Block,
  BlockData,
  HeaderData,
  SummaryData,
  ExperienceData,
  EducationData,
  SkillsData,
  ProjectsData,
  CustomData,
  ExperienceItem,
  EducationItem,
  ProjectItem,
} from '@/lib/resume-types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';

const addArrayItem = <T,>(items: T[], newItem: T): T[] => [...items, newItem];
const removeArrayItem = <T,>(items: T[], index: number): T[] =>
  items.filter((_, i) => i !== index);
const updateArrayItem = <T,>(
  items: T[],
  index: number,
  updater: (item: T) => T,
): T[] =>
  items.map((item, i) => (i === index ? updater(item) : item));

const appendStringEntry = (list: string[] | undefined, value = ''): string[] => [
  ...(list ?? []),
  value,
];
const updateStringEntry = (
  list: string[] | undefined,
  index: number,
  value: string,
): string[] => {
  const next = [...(list ?? [])];
  next[index] = value;
  return next;
};
const removeStringEntry = (
  list: string[] | undefined,
  index: number,
): string[] => (list ?? []).filter((_, i) => i !== index);

interface BlockInspectorProps {
  block: Block | null;
  clerkId: string;
  resumeUpdatedAt: number;
  onUpdate: (newResumeUpdatedAt: number) => void;
}

export function BlockInspector({ block, clerkId, resumeUpdatedAt, onUpdate }: BlockInspectorProps) {
  const [localData, setLocalData] = useState<BlockData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const updateBlock = useMutation(api.builder_blocks.update);

  // Sync local data when block changes
  useEffect(() => {
    // Clear any pending save when block changes to prevent:
    // 1. Memory leak (timer fires after component switches/unmounts)
    // 2. Stale save indicator (old timer completes on wrong block)
    setDebounceTimer((prevTimer) => {
      if (prevTimer) {
        clearTimeout(prevTimer);
      }
      return null;
    });

    if (block) {
      setLocalData(JSON.parse(JSON.stringify(block.data)));
    } else {
      setLocalData(null);
    }
  }, [block?._id]);

  // Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setDebounceTimer((prevTimer) => {
        if (prevTimer) {
          clearTimeout(prevTimer);
        }
        return null;
      });
    };
  }, []);

  const handleChange = useCallback(
    (newData: BlockData) => {
      setLocalData(newData);

      setDebounceTimer((prevTimer) => {
        // Clear existing timer
        if (prevTimer) {
          clearTimeout(prevTimer);
        }

        // Set new timer
        return setTimeout(async () => {
          if (!block) return;

          setIsSaving(true);
          try {
            const result = await updateBlock({
              id: block._id,
              clerkId,
              data: newData,
              expectedResumeUpdatedAt: resumeUpdatedAt,
            });

            onUpdate(result.resumeUpdatedAt);

            // Show "Saved" briefly
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 2000);
          } catch (error) {
            console.error('Failed to update block:', error);
          } finally {
            setIsSaving(false);
          }
        }, 400);
      });
    },
    [block, clerkId, resumeUpdatedAt, updateBlock, onUpdate]
  );

  if (!block || !localData) {
    return (
      <div className="p-4">
        <div className="text-sm text-muted-foreground text-center py-8">
          Select a block to edit
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Inspector</h3>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          {showSaved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Type assertions are safe here because:
          1. Block is a discriminated union where block.type determines block.data's shape
          2. localData is initialized from block.data (line 83), maintaining type correspondence
          3. Data shape is validated at the persistence layer (Convex schema + validators)
          4. block.type acts as the discriminant, guaranteeing localData matches the expected type */}
      {block.type === 'header' && (
        <HeaderInspector data={localData as HeaderData} onChange={handleChange} />
      )}
      {block.type === 'summary' && (
        <SummaryInspector data={localData as SummaryData} onChange={handleChange} />
      )}
      {block.type === 'experience' && (
        <ExperienceInspector data={localData as ExperienceData} onChange={handleChange} />
      )}
      {block.type === 'education' && (
        <EducationInspector data={localData as EducationData} onChange={handleChange} />
      )}
      {block.type === 'skills' && (
        <SkillsInspector data={localData as SkillsData} onChange={handleChange} />
      )}
      {block.type === 'projects' && (
        <ProjectsInspector data={localData as ProjectsData} onChange={handleChange} />
      )}
      {block.type === 'custom' && (
        <CustomInspector data={localData as CustomData} onChange={handleChange} />
      )}
    </div>
  );
}

// Header Inspector
function HeaderInspector({ data, onChange }: { data: HeaderData; onChange: (data: HeaderData) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName" className="text-xs">Full Name</Label>
        <Input
          id="fullName"
          value={data.fullName || ''}
          onChange={(e) => onChange({ ...data, fullName: e.target.value })}
          placeholder="John Doe"
        />
      </div>
      <div>
        <Label htmlFor="title" className="text-xs">Title</Label>
        <Input
          id="title"
          value={data.title || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="Software Engineer"
        />
      </div>
      <div>
        <Label htmlFor="email" className="text-xs">Email</Label>
        <Input
          id="email"
          type="email"
          value={data.contact?.email || ''}
          onChange={(e) =>
            onChange({
              ...data,
              contact: { ...data.contact, email: e.target.value },
            })
          }
          placeholder="john@example.com"
        />
      </div>
      <div>
        <Label htmlFor="phone" className="text-xs">Phone</Label>
        <Input
          id="phone"
          value={data.contact?.phone || ''}
          onChange={(e) =>
            onChange({
              ...data,
              contact: { ...data.contact, phone: e.target.value },
            })
          }
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <Label htmlFor="location" className="text-xs">Location</Label>
        <Input
          id="location"
          value={data.contact?.location || ''}
          onChange={(e) =>
            onChange({
              ...data,
              contact: { ...data.contact, location: e.target.value },
            })
          }
          placeholder="San Francisco, CA"
        />
      </div>
      <div>
        <Label htmlFor="links" className="text-xs">Links (comma separated)</Label>
        <Input
          id="links"
          value={data.contact?.links?.map(link => link.url).join(', ') || ''}
          onChange={(e) => {
            const urls = e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            const existingLinks = data.contact?.links || [];
            const uniqueUrls = Array.from(new Set(urls));
            const linkObjects = uniqueUrls.map((url) => {
              const existing = existingLinks.find((link) => link.url === url);
              return existing || { label: url, url };
            });
            onChange({
              ...data,
              contact: {
                ...data.contact,
                links: linkObjects,
              },
            });
          }}
          placeholder="linkedin.com/in/johndoe, github.com/johndoe"
        />
      </div>
    </div>
  );
}

// Summary Inspector
function SummaryInspector({ data, onChange }: { data: SummaryData; onChange: (data: SummaryData) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="paragraph" className="text-xs">Summary</Label>
        <Textarea
          id="paragraph"
          value={data.paragraph || ''}
          onChange={(e) => onChange({ ...data, paragraph: e.target.value })}
          placeholder="Write a professional summary..."
          rows={6}
        />
      </div>
    </div>
  );
}

// Experience Inspector
function ExperienceInspector({ data, onChange }: { data: ExperienceData; onChange: (data: ExperienceData) => void }) {
  const items = data.items || [];

  const updateItems = (modifier: (items: ExperienceItem[]) => ExperienceItem[]) => {
    onChange({ ...data, items: modifier(items) });
  };

  const addItem = () => {
    updateItems((current) =>
      addArrayItem(current, {
        company: '',
        role: '',
        location: '',
        start: '',
        end: '',
        bullets: [''],
      }),
    );
  };

  const removeItem = (index: number) => {
    updateItems((current) => removeArrayItem(current, index));
  };

  const updateItem = (index: number, updates: Partial<ExperienceItem>) => {
    updateItems((current) =>
      updateArrayItem(current, index, (item) => ({ ...item, ...updates })),
    );
  };

  const modifyBullets = (
    itemIndex: number,
    modifier: (bullets: string[] | undefined) => string[],
  ) => {
    updateItems((current) =>
      updateArrayItem(current, itemIndex, (item) => ({
        ...item,
        bullets: modifier(item.bullets),
      })),
    );
  };

  const addBullet = (itemIndex: number) => {
    modifyBullets(itemIndex, (bullets) => appendStringEntry(bullets));
  };

  const removeBullet = (itemIndex: number, bulletIndex: number) => {
    modifyBullets(itemIndex, (bullets) => removeStringEntry(bullets, bulletIndex));
  };

  const updateBullet = (itemIndex: number, bulletIndex: number, value: string) => {
    modifyBullets(itemIndex, (bullets) =>
      updateStringEntry(bullets, bulletIndex, value),
    );
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Position {index + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Input
            value={item.company}
            onChange={(e) => updateItem(index, { company: e.target.value })}
            placeholder="Company"
            className="text-sm"
          />
          <Input
            value={item.role}
            onChange={(e) => updateItem(index, { role: e.target.value })}
            placeholder="Role"
            className="text-sm"
          />
          <Input
            value={item.location || ''}
            onChange={(e) => updateItem(index, { location: e.target.value })}
            placeholder="Location (optional)"
            className="text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={item.start}
              onChange={(e) => updateItem(index, { start: e.target.value })}
              placeholder="Start (e.g., Jan 2020)"
              className="text-sm"
            />
            <Input
              value={item.end}
              onChange={(e) => updateItem(index, { end: e.target.value })}
              placeholder="End (e.g., Present)"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Bullets</Label>
            {item.bullets?.map((bullet, bIndex) => (
              <div key={bIndex} className="flex gap-2">
                <Input
                  value={bullet}
                  onChange={(e) => updateBullet(index, bIndex, e.target.value)}
                  placeholder="Achievement or responsibility..."
                  className="text-sm flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBullet(index, bIndex)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBullet(index)}
              className="w-full text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Bullet
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Experience
      </Button>
    </div>
  );
}

// Education Inspector
function EducationInspector({ data, onChange }: { data: EducationData; onChange: (data: EducationData) => void }) {
  const items = data.items || [];

  const updateItems = (modifier: (items: EducationItem[]) => EducationItem[]) => {
    onChange({ ...data, items: modifier(items) });
  };

  const addItem = () => {
    updateItems((current) =>
      addArrayItem(current, {
        school: '',
        degree: '',
        location: '',
        start: '',
        end: '',
        details: [''],
      }),
    );
  };

  const removeItem = (index: number) => {
    updateItems((current) => removeArrayItem(current, index));
  };

  const updateItem = (index: number, updates: Partial<EducationItem>) => {
    updateItems((current) =>
      updateArrayItem(current, index, (item) => ({ ...item, ...updates })),
    );
  };

  const modifyDetails = (
    itemIndex: number,
    modifier: (details: string[] | undefined) => string[],
  ) => {
    updateItems((current) =>
      updateArrayItem(current, itemIndex, (item) => ({
        ...item,
        details: modifier(item.details),
      })),
    );
  };

  const addDetail = (itemIndex: number) => {
    modifyDetails(itemIndex, appendStringEntry);
  };

  const removeDetail = (itemIndex: number, detailIndex: number) => {
    modifyDetails(itemIndex, (details) => removeStringEntry(details, detailIndex));
  };

  const updateDetail = (itemIndex: number, detailIndex: number, value: string) => {
    modifyDetails(itemIndex, (details) =>
      updateStringEntry(details, detailIndex, value),
    );
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Education {index + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Input
            value={item.school}
            onChange={(e) => updateItem(index, { school: e.target.value })}
            placeholder="School"
            className="text-sm"
          />
          <Input
            value={item.degree}
            onChange={(e) => updateItem(index, { degree: e.target.value })}
            placeholder="Degree"
            className="text-sm"
          />
          <Input
            value={item.location || ''}
            onChange={(e) => updateItem(index, { location: e.target.value })}
            placeholder="Location (optional)"
            className="text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={item.start || ''}
              onChange={(e) => updateItem(index, { start: e.target.value })}
              placeholder="Start (e.g., Sep 2016)"
              className="text-sm"
            />
            <Input
              value={item.end || ''}
              onChange={(e) => updateItem(index, { end: e.target.value })}
              placeholder="End (e.g., May 2020)"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Details</Label>
            {item.details?.map((detail, dIndex) => (
              <div key={dIndex} className="flex gap-2">
                <Input
                  value={detail}
                  onChange={(e) => updateDetail(index, dIndex, e.target.value)}
                  placeholder="GPA, honors, relevant coursework..."
                  className="text-sm flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDetail(index, dIndex)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addDetail(index)}
              className="w-full text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Detail
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Education
      </Button>
    </div>
  );
}

// Skills Inspector
function SkillsInspector({ data, onChange }: { data: SkillsData; onChange: (data: SkillsData) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="primary" className="text-xs">Primary Skills (comma separated)</Label>
        <Textarea
          id="primary"
          value={data.primary?.join(', ') || ''}
          onChange={(e) =>
            onChange({
              ...data,
              primary: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="JavaScript, TypeScript, React, Node.js"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="secondary" className="text-xs">Secondary Skills (comma separated)</Label>
        <Textarea
          id="secondary"
          value={data.secondary?.join(', ') || ''}
          onChange={(e) =>
            onChange({
              ...data,
              secondary: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="Git, Docker, AWS, PostgreSQL"
          rows={3}
        />
      </div>
    </div>
  );
}

// Projects Inspector
function ProjectsInspector({ data, onChange }: { data: ProjectsData; onChange: (data: ProjectsData) => void }) {
  const items = data.items || [];

  const updateItems = (modifier: (items: ProjectItem[]) => ProjectItem[]) => {
    onChange({ ...data, items: modifier(items) });
  };

  const addItem = () => {
    updateItems((current) =>
      addArrayItem(current, { name: '', description: '', bullets: [''] }),
    );
  };

  const removeItem = (index: number) => {
    updateItems((current) => removeArrayItem(current, index));
  };

  const updateItem = (index: number, updates: Partial<ProjectItem>) => {
    updateItems((current) =>
      updateArrayItem(current, index, (item) => ({ ...item, ...updates })),
    );
  };

  const addBullet = (itemIndex: number) => {
    updateItems((current) =>
      updateArrayItem(current, itemIndex, (item) => ({
        ...item,
        bullets: appendStringEntry(item.bullets),
      })),
    );
  };

  const removeBullet = (itemIndex: number, bulletIndex: number) => {
    updateItems((current) =>
      updateArrayItem(current, itemIndex, (item) => ({
        ...item,
        bullets: removeStringEntry(item.bullets, bulletIndex),
      })),
    );
  };

  const updateBullet = (itemIndex: number, bulletIndex: number, value: string) => {
    updateItems((current) =>
      updateArrayItem(current, itemIndex, (item) => ({
        ...item,
        bullets: updateStringEntry(item.bullets, bulletIndex, value),
      })),
    );
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Project {index + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Input
            value={item.name}
            onChange={(e) => updateItem(index, { name: e.target.value })}
            placeholder="Project Name"
            className="text-sm"
          />
          <Textarea
            value={item.description}
            onChange={(e) => updateItem(index, { description: e.target.value })}
            placeholder="Brief description"
            className="text-sm"
            rows={2}
          />
          <div className="space-y-2">
            <Label className="text-xs">Highlights</Label>
            {item.bullets?.map((bullet, bIndex) => (
              <div key={bIndex} className="flex gap-2">
                <Input
                  value={bullet}
                  onChange={(e) => updateBullet(index, bIndex, e.target.value)}
                  placeholder="Key feature or achievement..."
                  className="text-sm flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBullet(index, bIndex)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBullet(index)}
              className="w-full text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Highlight
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Project
      </Button>
    </div>
  );
}

// Custom Inspector
function CustomInspector({ data, onChange }: { data: CustomData; onChange: (data: CustomData) => void }) {
  const bullets = data.bullets || [];

  const addBullet = () => {
    onChange({ ...data, bullets: [...bullets, ''] });
  };

  const removeBullet = (index: number) => {
    onChange({
      ...data,
      bullets: bullets.filter((_, i) => i !== index),
    });
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...bullets];
    newBullets[index] = value;
    onChange({ ...data, bullets: newBullets });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="heading" className="text-xs">Section Heading</Label>
        <Input
          id="heading"
          value={data.heading || ''}
          onChange={(e) => onChange({ ...data, heading: e.target.value })}
          placeholder="e.g., Certifications, Awards"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Items</Label>
        {bullets.map((bullet, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={bullet}
              onChange={(e) => updateBullet(index, e.target.value)}
              placeholder="Item..."
              className="text-sm flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeBullet(index)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addBullet}
          className="w-full text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Item
        </Button>
      </div>
    </div>
  );
}
