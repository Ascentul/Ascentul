import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Edit, 
  Plus, 
  Trash, 
  X,
  Calendar,
  MapPin,
  Users,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NewInterviewStageForm } from "./NewInterviewStageForm";
import { NewFollowupActionForm } from "./NewFollowupActionForm";

interface InterviewStage {
  id: number;
  type: string;
  scheduledDate: Date | null;
  completedDate: Date | null;
  location: string | null;
  interviewers: string[] | null;
  feedback: string | null;
  outcome: string | null;
  nextSteps: string | null;
  notes: string | null;
}

interface FollowupAction {
  id: number;
  type: string;
  description: string;
  dueDate: Date | null;
  completed: boolean;
  completedDate: Date | null;
  stageId: number | null;
  notes: string | null;
}

interface InterviewProcess {
  id: number;
  companyName: string;
  position: string;
  status: string;
  jobDescription: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  stages?: InterviewStage[];
  followups?: FollowupAction[];
}

interface InterviewProcessDetailsProps {
  process: InterviewProcess;
  open: boolean;
  onClose: () => void;
}

export function InterviewProcessDetails({ process, open, onClose }: InterviewProcessDetailsProps) {
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [isAddingFollowup, setIsAddingFollowup] = useState(false);
  const [selectedStage, setSelectedStage] = useState<InterviewStage | null>(null);
  const [selectedFollowup, setSelectedFollowup] = useState<FollowupAction | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(process.notes || "");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update interview process notes
  const updateProcessNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return apiRequest("PATCH", `/api/interview/processes/${id}`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interview/processes"] });
      toast({
        title: "Success",
        description: "Notes have been updated",
      });
      setEditingNotes(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update notes: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Complete/uncomplete followup action
  const toggleFollowupActionMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      if (completed) {
        return apiRequest("PUT", `/api/interview/followup-actions/${id}/complete`, {});
      } else {
        return apiRequest("PATCH", `/api/interview/followup-actions/${id}`, { completed });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interview/processes"] });
      toast({
        title: "Success",
        description: "Follow-up action status updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update follow-up status: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Mark stage as completed
  const completeInterviewStageMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      return apiRequest("PATCH", `/api/interview/stages/${id}`, { 
        completedDate: new Date().toISOString() 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interview/processes"] });
      toast({
        title: "Success",
        description: "Interview stage marked as completed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update stage: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveNotes = () => {
    updateProcessNotesMutation.mutate({ id: process.id, notes: notesValue });
  };

  const handleToggleFollowup = (followup: FollowupAction) => {
    toggleFollowupActionMutation.mutate({ 
      id: followup.id, 
      completed: !followup.completed 
    });
  };

  const handleCompleteStage = (stage: InterviewStage) => {
    if (!stage.completedDate) {
      completeInterviewStageMutation.mutate({ id: stage.id });
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Pending":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "Rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Sort stages by scheduled date
  const sortedStages = process.stages 
    ? [...process.stages].sort((a, b) => {
        // If both have scheduled dates, sort by date
        if (a.scheduledDate && b.scheduledDate) {
          return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        }
        // If only one has a scheduled date, prioritize the one with a date
        if (a.scheduledDate) return -1;
        if (b.scheduledDate) return 1;
        // If neither has a scheduled date, sort by ID (creation order)
        return a.id - b.id;
      })
    : [];

  // Filter followups for pending and completed
  const pendingFollowups = process.followups
    ? process.followups.filter(f => !f.completed)
      .sort((a, b) => {
        // Sort by due date if available
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.id - b.id;
      })
    : [];

  const completedFollowups = process.followups
    ? process.followups.filter(f => f.completed)
      .sort((a, b) => {
        // Sort by completed date if available, most recent first
        if (a.completedDate && b.completedDate) {
          return new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime();
        }
        return b.id - a.id;
      })
    : [];

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center mb-1">
              <DialogTitle className="text-2xl">{process.companyName}</DialogTitle>
              <Badge className={getStatusColor(process.status)}>
                {process.status}
              </Badge>
            </div>
            <div className="text-base font-medium text-neutral-700">{process.position}</div>
            <div className="text-sm text-neutral-500">
              Started {formatDistanceToNow(new Date(process.createdAt), { addSuffix: true })}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Company & Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    {process.contactName && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500">Contact Person</dt>
                        <dd className="text-sm">{process.contactName}</dd>
                      </div>
                    )}
                    {process.contactEmail && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500">Email</dt>
                        <dd className="text-sm">
                          <a href={`mailto:${process.contactEmail}`} className="text-primary hover:underline">
                            {process.contactEmail}
                          </a>
                        </dd>
                      </div>
                    )}
                    {process.contactPhone && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500">Phone</dt>
                        <dd className="text-sm">
                          <a href={`tel:${process.contactPhone}`} className="text-primary hover:underline">
                            {process.contactPhone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {!process.contactName && !process.contactEmail && !process.contactPhone && (
                      <div className="text-sm text-neutral-500">No contact information</div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[150px] overflow-y-auto text-sm text-neutral-700">
                    {process.jobDescription 
                      ? process.jobDescription 
                      : <span className="text-neutral-500">No job description provided</span>
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interview Stages */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Interview Stages</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setIsAddingStage(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sortedStages.length > 0 ? (
                  <div className="space-y-4">
                    {sortedStages.map((stage) => (
                      <div 
                        key={stage.id} 
                        className={`p-3 rounded-md border ${
                          stage.completedDate 
                            ? "bg-green-50 border-green-100" 
                            : "bg-white border-neutral-200"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {stage.completedDate ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-neutral-300" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-neutral-900">{stage.type}</h3>
                              <div className="mt-1 space-y-1">
                                {stage.scheduledDate && (
                                  <div className="flex items-center text-sm text-neutral-500">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(stage.scheduledDate).toLocaleDateString(undefined, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                    {stage.completedDate && (
                                      <span className="ml-2 text-green-600 text-xs font-medium">
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                )}
                                {stage.location && (
                                  <div className="flex items-center text-sm text-neutral-500">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {stage.location}
                                  </div>
                                )}
                                {stage.interviewers && stage.interviewers.length > 0 && (
                                  <div className="flex items-center text-sm text-neutral-500">
                                    <Users className="h-4 w-4 mr-1" />
                                    {stage.interviewers.join(", ")}
                                  </div>
                                )}
                                {stage.notes && (
                                  <div className="flex items-start text-sm text-neutral-500 mt-2">
                                    <MessageCircle className="h-4 w-4 mr-1 mt-0.5" />
                                    <div className="flex-1">{stage.notes}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {!stage.completedDate && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleCompleteStage(stage)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-neutral-500">
                    <p>No interview stages added yet</p>
                    <p className="text-sm mt-1">
                      Click "Add Stage" to start tracking your interview steps
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Follow-up Actions */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Follow-up Actions</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setIsAddingFollowup(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Action
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={["pending"]} className="w-full">
                  <AccordionItem value="pending" className="border-b">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <span className="font-medium">Pending Actions ({pendingFollowups.length})</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      {pendingFollowups.length > 0 ? (
                        <div className="space-y-3">
                          {pendingFollowups.map((followup) => (
                            <div 
                              key={followup.id} 
                              className="p-3 rounded-md border border-neutral-200 bg-white"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-start gap-3">
                                  <button 
                                    onClick={() => handleToggleFollowup(followup)}
                                    className="mt-0.5 h-5 w-5 border border-neutral-300 rounded-full flex items-center justify-center hover:bg-neutral-100"
                                  >
                                    <span className="sr-only">Mark as complete</span>
                                  </button>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-neutral-900">{followup.description}</h3>
                                      <Badge variant="outline" className="font-normal">
                                        {followup.type}
                                      </Badge>
                                    </div>
                                    <div className="mt-1 space-y-1">
                                      {followup.dueDate && (
                                        <div className="flex items-center text-sm text-neutral-500">
                                          <Clock className="h-4 w-4 mr-1" />
                                          Due {new Date(followup.dueDate).toLocaleDateString()}
                                        </div>
                                      )}
                                      {followup.notes && (
                                        <div className="text-sm text-neutral-600 mt-1">
                                          {followup.notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleToggleFollowup(followup)}
                                >
                                  Complete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-neutral-500">
                          <p>No pending actions</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="completed" className="border-b-0">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <span className="font-medium">Completed Actions ({completedFollowups.length})</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      {completedFollowups.length > 0 ? (
                        <div className="space-y-3">
                          {completedFollowups.map((followup) => (
                            <div 
                              key={followup.id} 
                              className="p-3 rounded-md border border-neutral-200 bg-green-50"
                            >
                              <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-neutral-900 line-through opacity-70">
                                      {followup.description}
                                    </h3>
                                    <Badge variant="outline" className="font-normal">
                                      {followup.type}
                                    </Badge>
                                  </div>
                                  <div className="mt-1 space-y-1">
                                    {followup.completedDate && (
                                      <div className="flex items-center text-sm text-green-600">
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Completed {new Date(followup.completedDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-neutral-500">
                          <p>No completed actions</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Notes</CardTitle>
                  {!editingNotes && (
                    <Button size="sm" variant="ghost" onClick={() => setEditingNotes(true)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingNotes ? (
                  <div className="space-y-4">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      className="min-h-[150px]"
                      placeholder="Add notes about this interview process..."
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setNotesValue(process.notes || "");
                          setEditingNotes(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSaveNotes}
                      >
                        Save Notes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-neutral-700 min-h-[50px]">
                    {process.notes ? (
                      <p>{process.notes}</p>
                    ) : (
                      <p className="text-neutral-500">No notes added yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      {isAddingStage && (
        <NewInterviewStageForm
          open={isAddingStage}
          onClose={() => setIsAddingStage(false)}
          processId={process.id}
        />
      )}

      {/* Add Followup Dialog */}
      {isAddingFollowup && (
        <NewFollowupActionForm
          open={isAddingFollowup}
          onClose={() => setIsAddingFollowup(false)}
          processId={process.id}
          stages={sortedStages}
        />
      )}
    </>
  );
}