import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function InterviewDebugTools() {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const clearAllInterviewData = () => {
    setIsClearing(true);
    
    try {
      console.log("Starting complete cleanup of all interview data");
      
      // Get all localStorage keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      
      // Find all interview-related keys
      const interviewKeys = keys.filter(key => 
        key.startsWith('mockStages_') || 
        key.startsWith('mockInterviewStages_') || 
        key.startsWith('mockFollowups_') ||
        (key.startsWith('application_') && key.endsWith('_data')) ||
        key === 'upcomingInterviewCount'
      );
      
      console.log(`Found ${interviewKeys.length} interview-related keys to delete`);
      
      // Delete all these keys
      interviewKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`Deleted key: ${key}`);
        } catch (e) {
          console.error(`Error deleting ${key}:`, e);
        }
      });
      
      // Dispatch events to update UI
      try {
        window.dispatchEvent(new Event('interviewStageChange'));
        window.dispatchEvent(new Event('applicationStatusChange'));
      } catch (e) {
        console.error('Error dispatching update events:', e);
      }
      
      // Show success toast
      toast({
        title: "Complete Cleanup Done",
        description: `Successfully deleted ${interviewKeys.length} interview-related items from local storage.`,
        variant: "default"
      });
      
      // Force a page reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 800);
      
    } catch (error) {
      console.error("Error during complete cleanup:", error);
      toast({
        title: "Cleanup Error",
        description: "There was an error cleaning up the data. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="my-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Debug Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Use this button to completely clear all interview data. 
              This will remove all interview stages, followups, and other related data.
            </p>
            <Button 
              variant="destructive" 
              onClick={clearAllInterviewData} 
              disabled={isClearing}
              className="w-full"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing Data...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Clear All Interview Data
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}