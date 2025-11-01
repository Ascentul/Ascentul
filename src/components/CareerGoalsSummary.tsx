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
        className="h-full flex flex-col"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium">
              Career Goals
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {completedGoals} completed • {inProgressGoals} in progress
            </p>
          </div>
          <Link href="/goals">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="flex-1">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : activeGoals.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No active goals</p>
              <p className="text-xs">
                Create your first goal to track your progress
              </p>
              <Link href="/goals">
                <Button variant="link" className="mt-2 text-sm">
                  Create Goal
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-3 rounded-lg border min-h-[90px] flex flex-col"
                >
                  <div className="min-w-0 max-w-full overflow-hidden flex-1">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate flex-1 min-w-0">
                        {goal.title}
                      </h3>
                      {goal.dueDate && isOverdue(goal.dueDate) && (
                        <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  <div className="mt-auto -mt-2 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
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
                    {goal.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Due: {format(new Date(goal.dueDate), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {allActiveGoals.length > 3 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    +{allActiveGoals.length - 3} more goals
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
