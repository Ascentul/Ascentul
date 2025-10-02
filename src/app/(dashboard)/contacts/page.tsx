'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Loader2, Plus, Eye, Pencil, Trash2, Search, Users, Bookmark } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Contact {
  _id: string
  name: string
  company?: string
  position?: string
  email?: string
  phone?: string
  saved?: boolean
  notes?: string
  tags?: string[]
  updated_at: number
  created_at?: number
}

export default function ContactsPage() {
  const { user: clerkUser } = useUser()
  const { toast } = useToast()
  const contactsData = useQuery(
    api.contacts.getUserContacts,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  ) as Contact[] | undefined
  const createContactMutation = useMutation(api.contacts.createContact)
  const updateContactMutation = useMutation(api.contacts.updateContact)
  const deleteContactMutation = useMutation(api.contacts.deleteContact)

  const [creating, setCreating] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ full_name: '', company: '', position: '', email: '', phone: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Detail view state
  const [detailContact, setDetailContact] = useState<Contact | null>(null)
  const [detailNotes, setDetailNotes] = useState('')
  const [detailTags, setDetailTags] = useState('')

  const createContact = async () => {
    if (!form.full_name.trim()) return
    setCreating(true)
    try {
      if (!clerkUser?.id) return
      await createContactMutation({
        clerkId: clerkUser.id,
        name: form.full_name,
        company: form.company || undefined,
        position: form.position || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
      })
      setForm({ full_name: '', company: '', position: '', email: '', phone: '' })
      setShowAdd(false)
      toast({
        title: "Contact added",
        description: "Your contact has been added successfully.",
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to add contact. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const deleteContact = async () => {
    if (!clerkUser?.id || !deleteId) return
    try {
      await deleteContactMutation({ clerkId: clerkUser.id, contactId: deleteId as any })
      toast({
        title: "Contact deleted",
        description: "Your contact has been deleted successfully.",
        variant: "success",
      })
      setDeleteId(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete contact. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleSaved = async (contact: Contact) => {
    if (!clerkUser?.id) return
    try {
      await updateContactMutation({
        clerkId: clerkUser.id,
        contactId: contact._id as any,
        updates: {
          saved: !contact.saved,
        },
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update contact.",
        variant: "destructive",
      })
    }
  }

  const saveDetailNotes = async () => {
    if (!clerkUser?.id || !detailContact) return
    try {
      await updateContactMutation({
        clerkId: clerkUser.id,
        contactId: detailContact._id as any,
        updates: {
          notes: detailNotes,
        },
      })
      toast({ title: "Notes saved", variant: "success" })
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save notes.", variant: "destructive" })
    }
  }

  const saveDetailTags = async () => {
    if (!clerkUser?.id || !detailContact) return
    const tagsArray = detailTags.split(',').map(t => t.trim()).filter(Boolean)
    try {
      await updateContactMutation({
        clerkId: clerkUser.id,
        contactId: detailContact._id as any,
        updates: {
          tags: tagsArray,
        },
      })
      toast({ title: "Tags saved", variant: "success" })
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save tags.", variant: "destructive" })
    }
  }

  const openDetail = (contact: Contact) => {
    setDetailContact(contact)
    setDetailNotes(contact.notes || '')
    setDetailTags((contact.tags || []).join(', '))
  }

  // Filter contacts
  const filteredContacts = useMemo(() => {
    let filtered = contactsData || []

    // Filter by tab
    if (activeTab === 'saved') {
      filtered = filtered.filter(c => c.saved)
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [contactsData, activeTab, searchTerm])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB]">Network Hub</h1>
            <p className="text-muted-foreground">Manage your professional contacts and connections</p>
          </div>
          <Button onClick={() => setShowAdd(true)} disabled={creating}>
            <Plus className="h-4 w-4 mr-2" /> Add Contact
          </Button>
        </div>

        {/* Search and Toggle */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveTab('all')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            All Contacts
          </Button>
          <Button
            variant={activeTab === 'saved' ? 'default' : 'outline'}
            onClick={() => setActiveTab('saved')}
            className="flex items-center gap-2"
          >
            <Bookmark className="h-4 w-4" />
            Saved Contacts
          </Button>
        </div>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={createContact} disabled={creating || !form.full_name.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Detail Dialog */}
      <Dialog open={!!detailContact} onOpenChange={(open) => !open && setDetailContact(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailContact?.name}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="info">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="info">Contact Info</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-3 mt-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <div className="mt-1">{detailContact?.name}</div>
              </div>
              {detailContact?.company && (
                <div>
                  <Label className="text-xs text-muted-foreground">Company</Label>
                  <div className="mt-1">{detailContact.company}</div>
                </div>
              )}
              {detailContact?.position && (
                <div>
                  <Label className="text-xs text-muted-foreground">Position</Label>
                  <div className="mt-1">{detailContact.position}</div>
                </div>
              )}
              {detailContact?.email && (
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="mt-1">{detailContact.email}</div>
                </div>
              )}
              {detailContact?.phone && (
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <div className="mt-1">{detailContact.phone}</div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <div className="text-sm text-muted-foreground">
                No activity recorded yet.
              </div>
            </TabsContent>
            <TabsContent value="notes" className="space-y-3 mt-4">
              <Textarea
                placeholder="Add notes about this contact..."
                value={detailNotes}
                onChange={(e) => setDetailNotes(e.target.value)}
                rows={8}
              />
              <div className="flex justify-end">
                <Button onClick={saveDetailNotes}>Save Notes</Button>
              </div>
            </TabsContent>
            <TabsContent value="tags" className="space-y-3 mt-4">
              <Input
                placeholder="Enter tags, separated by commas (e.g., recruiter, engineer, mentor)"
                value={detailTags}
                onChange={(e) => setDetailTags(e.target.value)}
              />
              {detailContact?.tags && detailContact.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {detailContact.tags.map((tag, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={saveDetailTags}>Save Tags</Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteContact} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contacts Table */}
      {contactsData === undefined ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {contactsData?.length === 0 ? 'No contacts yet. Add your first contact to start building your network.' : 'No contacts found matching your search.'}
          </p>
          {contactsData?.length === 0 && (
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Contact
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact._id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.company || '—'}</TableCell>
                  <TableCell>{contact.position || '—'}</TableCell>
                  <TableCell className="text-sm">{contact.email || '—'}</TableCell>
                  <TableCell className="text-sm">{contact.phone || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openDetail(contact)} title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleSaved(contact)}
                        title={contact.saved ? "Remove from saved" : "Add to saved"}
                      >
                        <Bookmark className={`h-4 w-4 ${contact.saved ? 'fill-current text-blue-600' : ''}`} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(contact._id)} title="Delete">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
