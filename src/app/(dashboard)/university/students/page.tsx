"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  User as UserIcon,
  Upload,
  UserPlus,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";

export default function UniversityStudentsPage() {
  const { user, isAdmin } = useAuth();
  const { user: clerkUser } = useUser();
  const { toast } = useToast();

  const canAccess =
    !!user &&
    (isAdmin ||
      user.subscription_plan === "university" ||
      user.role === "university_admin");

  const students = useQuery(
    api.university_admin.listStudents,
    clerkUser?.id ? { clerkId: clerkUser.id, limit: 1000 } : "skip",
  ) as any[] | undefined;
  // TODO: Implement inviteStudent and bulkInviteStudents mutations
  // const inviteStudentMutation = useMutation(api.university_admin.inviteStudent)
  // const bulkInviteStudentsMutation = useMutation(api.university_admin.bulkInviteStudents)

  // State
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [singleInviteForm, setSingleInviteForm] = useState({
    name: "",
    email: "",
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<{ name: string; email: string }[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have access to University Student Management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!students) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Parse CSV file
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.split("\n").filter((line) => line.trim());

        // Check if first line is header
        const hasHeader =
          lines[0].toLowerCase().includes("name") ||
          lines[0].toLowerCase().includes("email");
        const dataLines = hasHeader ? lines.slice(1) : lines;

        const parsed = dataLines.map((line, index) => {
          const [name, email] = line.split(",").map((s) => s.trim());
          if (!name || !email) {
            throw new Error(`Invalid data at line ${index + 1}`);
          }
          if (!email.includes("@")) {
            throw new Error(`Invalid email at line ${index + 1}: ${email}`);
          }
          return { name, email };
        });

        setCsvData(parsed);
        toast({
          title: "CSV Parsed",
          description: `Successfully parsed ${parsed.length} student records`,
          variant: "success",
        });
      } catch (error: any) {
        setParseError(error.message);
        setCsvData([]);
        toast({
          title: "Parse Error",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template =
      "Name,Email\nJohn Doe,john.doe@university.edu\nJane Smith,jane.smith@university.edu";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Single invite
  const handleSingleInvite = async () => {
    if (
      !singleInviteForm.name.trim() ||
      !singleInviteForm.email.trim() ||
      !clerkUser?.id
    )
      return;

    setInviting(true);
    try {
      // TODO: Implement inviteStudent mutation
      // await inviteStudentMutation({
      //   clerkId: clerkUser.id,
      //   name: singleInviteForm.name.trim(),
      //   email: singleInviteForm.email.trim()
      // })
      toast({
        title: "Feature Not Available",
        description: "Student invitation feature is not yet implemented",
        variant: "destructive",
      });
      setInviteDialogOpen(false);
      setSingleInviteForm({ name: "", email: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  // Bulk invite from CSV
  const handleBulkInvite = async () => {
    if (csvData.length === 0 || !clerkUser?.id) return;

    setInviting(true);
    try {
      // TODO: Implement bulkInviteStudents mutation
      // await bulkInviteStudentsMutation({
      //   clerkId: clerkUser.id,
      //   students: csvData
      // })
      toast({
        title: "Feature Not Available",
        description: "Bulk student invitation feature is not yet implemented",
        variant: "destructive",
      });
      setCsvDialogOpen(false);
      setCsvFile(null);
      setCsvData([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send bulk invitations",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (accountStatus?: string) => {
    switch (accountStatus) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "pending_activation":
        return (
          <Badge variant="secondary">
            <Mail className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB] flex items-center gap-2">
            <UserIcon className="h-7 w-7" /> Student Management
          </h1>
          <p className="text-muted-foreground">
            Invite and manage student accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Student
          </Button>
          <Button onClick={() => setCsvDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {students.filter((s) => s.account_status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {
                students.filter(
                  (s) => s.account_status === "pending_activation",
                ).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {students.filter((s) => s.account_status === "suspended").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            Manage student accounts and track activation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No students found.</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start by inviting students individually or via CSV import
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Student
                </Button>
                <Button onClick={() => setCsvDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s: any) => (
                  <TableRow key={String(s._id)}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {s.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(s.account_status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/profile?userId=${s.clerkId}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Single Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Student</DialogTitle>
            <DialogDescription>
              Send an invitation email to a student to create their account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-name">Student Name *</Label>
              <Input
                id="student-name"
                placeholder="John Doe"
                value={singleInviteForm.name}
                onChange={(e) =>
                  setSingleInviteForm({
                    ...singleInviteForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="student-email">Email Address *</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="john.doe@university.edu"
                value={singleInviteForm.email}
                onChange={(e) =>
                  setSingleInviteForm({
                    ...singleInviteForm,
                    email: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSingleInvite}
              disabled={
                inviting ||
                !singleInviteForm.name.trim() ||
                !singleInviteForm.email.trim()
              }
            >
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Bulk Import Dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Students</DialogTitle>
            <DialogDescription>
              Upload a CSV file to invite multiple students at once
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="upload">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="upload">Upload CSV</TabsTrigger>
              <TabsTrigger value="preview">
                Preview ({csvData.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4">
              <div>
                <Label>CSV Format</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Your CSV file should have two columns: Name and Email
                </p>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-3 w-3 mr-2" />
                  Download Template
                </Button>
              </div>
              <div>
                <Label htmlFor="csv-file">Upload CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                />
                {parseError && (
                  <p className="text-sm text-red-600 mt-2">{parseError}</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="preview">
              {csvData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No data to preview. Upload a CSV file first.</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkInvite}
              disabled={inviting || csvData.length === 0}
            >
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send {csvData.length} Invitations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
