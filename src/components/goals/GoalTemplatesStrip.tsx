"use client";

import * as React from "react";
import { goalTemplates } from "./GoalTemplates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GoalTemplatesStripProps {
  onSelectTemplate: (templateId: string) => void;
}

export const GoalTemplatesStrip: React.FC<GoalTemplatesStripProps> = ({
  onSelectTemplate,
}) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Show first 3 templates in the strip
  const primaryTemplates = goalTemplates.slice(0, 3);

  const handleUseTemplate = (templateId: string) => {
    onSelectTemplate(templateId);
    setIsDialogOpen(false);
  };

  return (
    <>
      {/* Compact strip */}
      <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-slate-900">
            Goal templates
          </h3>
          <p className="text-xs text-slate-500">
            Start faster with a prebuilt goal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {primaryTemplates.map((template) => {
            const Icon = template.icon;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleUseTemplate(template.id)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <Icon className="h-4 w-4" />
                <span>{template.title}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="text-xs font-medium text-primary-500 hover:text-primary-700 transition-colors"
          >
            View all
          </button>
        </div>
      </section>

      {/* Full templates dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Goal templates</DialogTitle>
            <DialogDescription>
              Choose a template to prefill a new goal with milestones and guidance.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-2 -mr-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goalTemplates.map((template) => {
                const Icon = template.icon;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleUseTemplate(template.id)}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300 hover:bg-slate-50 hover:shadow-md transition-all"
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">
                          {template.title}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-3">
                      <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                        Use template
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
