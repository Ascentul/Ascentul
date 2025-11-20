"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, HelpCircle, MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuickActionChips } from "@/components/dashboard/QuickActionChips";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  hasUnread?: boolean;
  isActive?: boolean;
};

function IconButton({ hasUnread, isActive, className = "", children, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors",
        isActive ? "ring-2 ring-[#5371FF]/30 text-slate-700" : "hover:bg-slate-50 hover:text-slate-700",
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
  const [openPanel, setOpenPanel] = useState<null | "search" | "messages" | "notifications">(null);
  const [unreadMessages, setUnreadMessages] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("Other");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePanel = (panel: "search" | "messages" | "notifications") => {
    setOpenPanel((prev) => {
      const next = prev === panel ? null : panel;
      if (next === "messages") {
        setUnreadMessages(false);
      }
      if (next === "notifications") {
        setUnreadNotifications(false);
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
      await fetch("/api/support/tickets", {
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
      setSupportOpen(false);
      setSubject("");
      setDescription("");
      setIssueType("Other");
    } catch (error) {
      console.error("Error submitting support ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="relative z-20 bg-app-bg/70 backdrop-blur">
      <div className="relative flex w-full items-center justify-between gap-3 px-4 md:px-6" style={{ minHeight: "56px" }}>
        <div className="hidden md:flex items-center gap-2.5 flex-nowrap">
          <QuickActionChips inline />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2.5" ref={panelRef}>
          {openPanel === "search" && (
            <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search across apps..."
                className="h-8 border-0 bg-transparent p-0 text-sm text-slate-700 focus-visible:ring-0"
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
                className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
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
            hasUnread={unreadNotifications}
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
          <div className="absolute right-4 top-[calc(100%+8px)] w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <p className="mb-2 text-xs font-semibold text-slate-500">Notifications</p>
            <p className="text-sm text-slate-600">You are all caught up.</p>
          </div>
        )}
      </div>
    </header>
  );
}
