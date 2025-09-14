'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
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
      // Convex will revalidate the query; optimistically clear the form
      setForm({ full_name: '', company: '', position: '', email: '', phone: '' })
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
    } finally {
      setCreating(false)
    }
  }

  const deleteContact = async (id: string) => {
    if (!clerkUser?.id) return
    setCreating(true)
    try {
      await deleteContactMutation({ clerkId: clerkUser.id, contactId: id as any })
    } finally {
      setCreating(false)
    }
  }

  return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Hub</h1>
          <p className="text-muted-foreground">Manage your professional contacts.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} disabled={creating}>
          <Plus className="h-4 w-4 mr-2" /> Add
        </Button>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full name</label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Company</label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Position</label>
                <Input
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Recruiter"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
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
              onClick={async () => { await createContact(); if (form.full_name.trim()) setShowAdd(false) }}
              disabled={creating || !form.full_name.trim()}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
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
              <label className="text-sm font-medium">Full name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Company</label>
                <Input
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Position</label>
                <Input
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  placeholder="Recruiter"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
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
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {contactsData === undefined ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (contactsData?.length ?? 0) === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No contacts yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Add your first contact to start building your network.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {contactsData!.map((c) => (
            <Card key={c._id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}{c.position ? ` — ${c.position}` : ''}{c.company ? ` @ ${c.company}` : ''}</div>
                  <div className="text-xs text-muted-foreground">Updated {new Date(c.updated_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground">
                    {c.email || c.phone ? [c.email, c.phone].filter(Boolean).join(' • ') : ''}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteContact(c._id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
  )
}
