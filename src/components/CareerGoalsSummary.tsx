"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Target,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

interface Goal {
  id: string | number;
  title: string;
  description: string;
  progress: number;
  status: string;
  dueDate?: string;
  checklist?: any[];
}

export function CareerGoalsSummary() {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/goals");
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.goals)) return data.goals;
        return [];
      } catch (error) {
        console.error("Error fetching goals:", error);
        return [];
      }
    },
  });

  // Ensure goals is an array and filter to show only active goals (not completed)
  const goalsArray = Array.isArray(goals) ? goals : [];
  const allActiveGoals = goalsArray.filter(
    (goal) => goal.status !== "completed" && goal.status !== "cancelled",
  );
  const activeGoals = allActiveGoals.slice(0, 3); // Show top 3
  const shouldStretch =
    activeGoals.length > 0 &&
    activeGoals.some(
      (goal) => Array.isArray(goal.checklist) && goal.checklist.length > 0,
    );

  const completedGoals = goalsArray.filter(
    (goal) => goal.status === "completed",
  ).length;
  const inProgressGoals = goalsArray.filter(
    (goal) => goal.status === "in_progress",
  ).length;

  const getStatusColor = (status: string, progress: number) => {
    if (status === "completed") {
      return "text-green-600";
    } else if (progress > 0) {
      return "text-blue-600";
    } else {
      return "text-muted-foreground";
    }
  };

  const isOverdue = (dueDate: string) => {
    return dueDate && isBefore(new Date(dueDate), new Date());
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      }}
      className="mb-6 h-full"
    >
      <Card
        className="h-full flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-sm"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-3">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">
              Career Goals
            </CardTitle>
            <p className="text-xs text-slate-500">
              {completedGoals} completed • {inProgressGoals} in progress
            </p>
          </div>
          <Link href="/goals">
            <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 text-xs font-medium text-slate-700 hover:bg-slate-100">
              <ExternalLink className="mr-2 h-4 w-4" />
              View All
            </Button>
          </Link>
        </CardHeader>

        <div className="border-t border-slate-200/70" />

        <CardContent className="flex-1 px-5 pb-4 pt-3 text-sm text-slate-600">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 rounded-xl bg-slate-50 p-3 shadow-sm">
                  <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-slate-100 animate-pulse" />
                  </div>
                  <div className="h-6 w-16 rounded bg-slate-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : activeGoals.length === 0 ? (
            <section className="flex flex-col items-center justify-center rounded-2xl bg-[#EEF2FF] border border-transparent py-8 text-center">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <Target className="h-5 w-5 text-[#5371FF]" />
              </div>
              <p className="text-sm font-medium text-slate-900">No active goals</p>
              <p className="text-xs text-slate-600 mt-1">
                Create your first goal to start tracking progress.
              </p>
              <Link href="/goals" className="mt-3 inline-flex">
                <Button className="rounded-lg bg-[#5371FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4863e0]">
                  Create goal
                </Button>
              </Link>
            </section>
          ) : (
            <div className="divide-y divide-slate-200">
              {activeGoals.map((goal, idx) => (
                <div
                  key={goal.id}
                  className={cn("py-3", idx === 0 ? "pt-0" : "", idx === activeGoals.length - 1 ? "pb-0" : "")}
                >
                  <div className="flex min-h-[90px] flex-col rounded-xl bg-white border border-slate-200 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                    <div className="min-w-0 max-w-full flex-1 overflow-hidden">
                      <div className="mb-1 flex items-start gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 truncate flex-1 min-w-0">
                          {goal.title}
                        </h3>
                        {goal.dueDate && isOverdue(goal.dueDate) && (
                          <AlertCircle className="flex-shrink-0 h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>

                    <div className="mt-auto -mt-2 min-w-0">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Progress
                        </span>
                        <span
                          className={getStatusColor(
                            goal.status,
                            goal.progress,
                          )}
                        >
                          {goal.progress}%
                        </span>
                      </div>
                      <Progress value={goal.progress} className="h-1.5 w-full" />
                      {goal.dueDate && (() => {
                        const date = new Date(goal.dueDate);
                        return !isNaN(date.getTime()) && (
                          <p className="mt-1 text-xs text-slate-500 truncate">
                            Due: {format(date, "MMM dd, yyyy")}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}

              {allActiveGoals.length > 3 && (
                <div className="py-2 text-center text-xs text-slate-500">
                  +{allActiveGoals.length - 3} more goals
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
