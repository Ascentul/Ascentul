'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Loader2, Plus, Pencil, Trash2, Search, Grid3X3, List, Mail, Phone, Building, User } from 'lucide-react'
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'

interface Contact {
  _id: string
  name: string
  company?: string
  position?: string
  email?: string
  phone?: string
  updated_at: number
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
  const [editing, setEditing] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', company: '', position: '', email: '', phone: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleting, setDeleting] = useState(false)


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
      // Clear the form and close dialog
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

  const startEdit = (c: Contact) => {
    setEditId(c._id)
    setEditForm({
      name: c.name || '',
      company: c.company || '',
      position: c.position || '',
      email: c.email || '',
      phone: c.phone || '',
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!editId || !clerkUser?.id || !editForm.name.trim()) return
    setCreating(true)
    try {
      await updateContactMutation({
        clerkId: clerkUser.id,
        contactId: editId as any,
        updates: {
          name: editForm.name,
          company: editForm.company || undefined,
          position: editForm.position || undefined,
          email: editForm.email || undefined,
          phone: editForm.phone || undefined,
        },
      })
      setEditing(false)
      setEditId(null)
      toast({
        title: "Contact updated",
        description: "Your contact has been updated successfully.",
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update contact. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const deleteContact = async (id: string) => {
    if (!clerkUser?.id) return
    setDeleting(true)
    try {
      await deleteContactMutation({ clerkId: clerkUser.id, contactId: id as any })
      toast({
        title: "Contact deleted",
        description: "Your contact has been deleted successfully.",
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete contact. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Filter contacts based on search term
  const filteredContacts = contactsData?.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Network Hub</h1>
            <p className="text-muted-foreground">Manage your professional contacts and connections.</p>
          </div>
          <Button onClick={() => setShowAdd(true)} disabled={creating}>
            <Plus className="h-4 w-4 mr-2" /> Add Contact
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Button
              onClick={createContact}
              disabled={creating || !form.full_name.trim()}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={editing} onOpenChange={(open) => { if (!open) { setEditing(false); setEditId(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Full Name *</Label>
              <Input
                id="edit_name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_company">Company</Label>
                <Input
                  id="edit_company"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <Label htmlFor="edit_position">Position</Label>
                <Input
                  id="edit_position"
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={saveEdit}
              disabled={creating || !editForm.name.trim()}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {contactsData === undefined ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{contactsData?.length === 0 ? 'No contacts yet' : 'No contacts found'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {contactsData?.length === 0
                ? 'Add your first contact to start building your network.'
                : 'Try adjusting your search terms.'}
            </p>
            {contactsData?.length === 0 && (
              <Button onClick={() => setShowAdd(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
          {filteredContacts.map((c) => (
            <Card key={c._id} className={viewMode === 'grid' ? '' : ''}>
              <CardContent className={viewMode === 'grid' ? 'p-4' : 'py-4 flex items-center justify-between'}>
                {viewMode === 'grid' ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{c.name}</h3>
                          {c.position && (
                            <p className="text-xs text-muted-foreground">{c.position}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(c)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{c.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteContact(c._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {c.company && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building className="h-3 w-3" />
                        {c.company}
                      </div>
                    )}

                    <div className="space-y-2">
                      {c.email && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 h-8 text-xs"
                          >
                            <a href={`mailto:${c.email}`}>
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </a>
                          </Button>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 h-8 text-xs"
                          >
                            <a href={`tel:${c.phone}`}>
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Updated {new Date(c.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {[c.position, c.company].filter(Boolean).join(' @ ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.email && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`mailto:${c.email}`} title="Send email">
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {c.phone && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`tel:${c.phone}`} title="Call">
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => startEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{c.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteContact(c._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
  )
}
