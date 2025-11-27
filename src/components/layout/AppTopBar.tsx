"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, HelpCircle, MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuickActionChips } from "@/components/dashboard/QuickActionChips";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  hasUnread?: boolean;
  isActive?: boolean;
};

function IconButton({ hasUnread, isActive, className = "", children, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-slate-500 transition-colors",
        isActive ? "ring-2 ring-primary-500/30 text-slate-700" : "hover:bg-slate-50 hover:text-slate-700",
        className
      )}
    >
      {children}
      {hasUnread && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
      )}
    </button>
  );
}

export default function AppTopBar() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [openPanel, setOpenPanel] = useState<null | "search" | "messages" | "notifications">(null);
  const [unreadMessages, setUnreadMessages] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("Other");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hide quick action chips for super_admin
  const isSuperAdmin = user?.role === "super_admin";

  // Fetch notification count from Convex
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user ? {} : "skip"
  );

  // Fetch notifications
  const notifications = useQuery(
    api.notifications.getNotifications,
    openPanel === "notifications" && user
      ? { unreadOnly: false }
      : "skip"
  );

  // Mark notification as read mutation
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const hasUnreadNotifications = (unreadCount ?? 0) > 0;

  const togglePanel = (panel: "search" | "messages" | "notifications") => {
    setOpenPanel((prev) => {
      const next = prev === panel ? null : panel;
      if (next === "messages") {
        setUnreadMessages(false);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!openPanel) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [openPanel]);

  const handleSupportSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          description,
          issueType,
          source: "topbar",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit support ticket");
      }
      
      toast({
        title: "Support ticket submitted",
        description: "We'll get back to you soon.",
      });
      
      setSupportOpen(false);
      setSubject("");
      setDescription("");
      setIssueType("Other");
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast({
        title: "Failed to submit ticket",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="relative z-20 bg-app-bg/70 backdrop-blur">
      <div className="relative flex w-full items-center justify-between gap-3 px-4 md:px-6" style={{ minHeight: "56px" }}>
        {!isSuperAdmin && (
          <div className="hidden md:flex items-center gap-2.5 flex-nowrap">
            <QuickActionChips />
          </div>
        )}

        <div className="flex flex-1 items-center justify-end gap-2.5" ref={panelRef}>
          {openPanel === "search" && (
            <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search across apps..."
                className="h-8 border-0 bg-transparent p-0 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 focus-visible:ring-offset-0"
                autoFocus
              />
            </div>
          )}
          <IconButton
            aria-label="Search"
            isActive={openPanel === "search"}
            onClick={() => togglePanel("search")}
          >
            <Search className="h-4 w-4" />
          </IconButton>
          <IconButton
            aria-label="Messages"
            hasUnread={unreadMessages}
            isActive={openPanel === "messages"}
            onClick={() => togglePanel("messages")}
          >
            <MessageCircle className="h-4 w-4" />
          </IconButton>
          <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                aria-label="Support"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contact Support</DialogTitle>
                <DialogDescription>
                  Describe your issue and we'll help you resolve it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Issue Type</label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bug">Bug Report</SelectItem>
                      <SelectItem value="Feature">Feature Request</SelectItem>
                      <SelectItem value="Account">Account Issue</SelectItem>
                      <SelectItem value="Billing">Billing Question</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide details about your issue"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSupportSubmit}
                  disabled={isSubmitting || !subject.trim() || !description.trim()}
                >
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <IconButton
            aria-label="Notifications"
            hasUnread={hasUnreadNotifications}
            isActive={openPanel === "notifications"}
            onClick={() => togglePanel("notifications")}
          >
            <Bell className="h-4 w-4" />
          </IconButton>
        </div>

        {openPanel === "messages" && (
          <div className="absolute right-4 top-[calc(100%+8px)] w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <p className="mb-2 text-xs font-semibold text-slate-500">Messages</p>
            <p className="text-sm text-slate-600">No new messages.</p>
          </div>
        )}

        {openPanel === "notifications" && (
          <div className="absolute right-4 top-[calc(100%+8px)] w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              {hasUnreadNotifications && (
                <button
                  onClick={() => {
                    markAllAsRead({})
                      .catch((err) => console.error("Failed to mark all notifications as read:", err));
                  }}
                  className="text-xs text-[#4257FF] hover:text-[#3f5dde] transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-slate-600">You are all caught up.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={cn(
                        "p-3 hover:bg-slate-50 transition-colors cursor-pointer",
                        !notification.read && "bg-blue-50/50"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead({ notificationId: notification._id })
                            .catch((err) => console.error("Failed to mark notification as read:", err));
                        }
                        if (notification.link) {
                          router.push(notification.link);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
