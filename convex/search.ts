import { v } from 'convex/values';

import { query } from './_generated/server';

/**
 * Global search across user's data objects
 * Searches: applications, goals, resumes, cover letters, contacts, projects
 */
export const globalSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { results: [] };
    }

    const clerkId = identity.subject;
    const searchQuery = args.query.toLowerCase().trim();
    const limit = args.limit ?? 20;

    if (searchQuery.length < 2) {
      return { results: [] };
    }

    // Get user
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
      .unique();

    if (!user) {
      return { results: [] };
    }

    const results: Array<{
      id: string;
      type: 'application' | 'goal' | 'resume' | 'cover_letter' | 'contact' | 'project';
      title: string;
      subtitle?: string;
      href: string;
      matchedField?: string;
    }> = [];

    // Search Applications
    const applications = await ctx.db
      .query('applications')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .take(100);

    for (const app of applications) {
      const companyMatch = app.company?.toLowerCase().includes(searchQuery);
      const titleMatch = app.job_title?.toLowerCase().includes(searchQuery);
      const notesMatch = app.notes?.toLowerCase().includes(searchQuery);

      if (companyMatch || titleMatch || notesMatch) {
        results.push({
          id: app._id,
          type: 'application',
          title: `${app.company} - ${app.job_title}`,
          subtitle: app.stage || app.status || 'Saved',
          href: `/applications/${app._id}`,
          matchedField: companyMatch ? 'company' : titleMatch ? 'job title' : 'notes',
        });
      }
    }

    // Search Goals
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .take(100);

    for (const goal of goals) {
      const titleMatch = goal.title?.toLowerCase().includes(searchQuery);
      const descMatch = goal.description?.toLowerCase().includes(searchQuery);
      const categoryMatch = goal.category?.toLowerCase().includes(searchQuery);

      if (titleMatch || descMatch || categoryMatch) {
        results.push({
          id: goal._id,
          type: 'goal',
          title: goal.title,
          subtitle: goal.status || 'Active',
          href: `/goals`,
          matchedField: titleMatch ? 'title' : descMatch ? 'description' : 'category',
        });
      }
    }

    // Search Resumes
    const resumes = await ctx.db
      .query('resumes')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .take(50);

    for (const resume of resumes) {
      const titleMatch = resume.title?.toLowerCase().includes(searchQuery);
      const extractedMatch = resume.extracted_text?.toLowerCase().includes(searchQuery);

      if (titleMatch || extractedMatch) {
        results.push({
          id: resume._id,
          type: 'resume',
          title: resume.title || 'Untitled Resume',
          subtitle: resume.source || 'Manual',
          href: `/resumes/${resume._id}`,
          matchedField: titleMatch ? 'title' : 'content',
        });
      }
    }

    // Search Cover Letters
    const coverLetters = await ctx.db
      .query('cover_letters')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .take(50);

    for (const letter of coverLetters) {
      const nameMatch = letter.name?.toLowerCase().includes(searchQuery);
      const contentMatch = letter.content?.toLowerCase().includes(searchQuery);
      const companyMatch = letter.company_name?.toLowerCase().includes(searchQuery);
      const jobTitleMatch = letter.job_title?.toLowerCase().includes(searchQuery);

      if (nameMatch || contentMatch || companyMatch || jobTitleMatch) {
        results.push({
          id: letter._id,
          type: 'cover_letter',
          title: letter.name || 'Untitled Cover Letter',
          subtitle: letter.company_name
            ? `${letter.job_title} at ${letter.company_name}`
            : letter.job_title,
          href: `/cover-letters/${letter._id}`,
          matchedField: nameMatch
            ? 'name'
            : companyMatch
              ? 'company'
              : jobTitleMatch
                ? 'job title'
                : 'content',
        });
      }
    }

    // Search Contacts
    const contacts = await ctx.db
      .query('networking_contacts')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .take(100);

    for (const contact of contacts) {
      const nameMatch = contact.name?.toLowerCase().includes(searchQuery);
      const companyMatch = contact.company?.toLowerCase().includes(searchQuery);
      const positionMatch = contact.position?.toLowerCase().includes(searchQuery);
      const notesMatch = contact.notes?.toLowerCase().includes(searchQuery);

      if (nameMatch || companyMatch || positionMatch || notesMatch) {
        results.push({
          id: contact._id,
          type: 'contact',
          title: contact.name,
          subtitle: contact.company
            ? `${contact.position || ''} at ${contact.company}`.trim()
            : contact.position,
          href: `/contacts/${contact._id}`,
          matchedField: nameMatch
            ? 'name'
            : companyMatch
              ? 'company'
              : positionMatch
                ? 'position'
                : 'notes',
        });
      }
    }

    // Search Projects
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .take(50);

    for (const project of projects) {
      const titleMatch = project.title?.toLowerCase().includes(searchQuery);
      const descMatch = project.description?.toLowerCase().includes(searchQuery);
      const techMatch = project.technologies?.some((t: string) =>
        t.toLowerCase().includes(searchQuery),
      );
      const companyMatch = project.company?.toLowerCase().includes(searchQuery);

      if (titleMatch || descMatch || techMatch || companyMatch) {
        results.push({
          id: project._id,
          type: 'project',
          title: project.title,
          subtitle: project.type || 'Personal',
          href: `/projects/${project._id}`,
          matchedField: titleMatch
            ? 'title'
            : descMatch
              ? 'description'
              : companyMatch
                ? 'company'
                : 'technologies',
        });
      }
    }

    // Sort results by relevance (title matches first, then by type priority)
    const typePriority: Record<string, number> = {
      application: 1,
      goal: 2,
      contact: 3,
      resume: 4,
      cover_letter: 5,
      project: 6,
    };

    results.sort((a, b) => {
      // Title matches come first
      const aIsTitle =
        a.matchedField === 'title' || a.matchedField === 'name' || a.matchedField === 'company';
      const bIsTitle =
        b.matchedField === 'title' || b.matchedField === 'name' || b.matchedField === 'company';

      if (aIsTitle && !bIsTitle) return -1;
      if (!aIsTitle && bIsTitle) return 1;

      // Then sort by type priority
      return (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
    });

    return { results: results.slice(0, limit) };
  },
});

/**
 * Quick actions for search command palette
 */
export const getQuickActions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { actions: [] };
    }

    // Return static quick actions
    return {
      actions: [
        {
          id: 'new-application',
          label: 'Add new application',
          href: '/applications/new',
          shortcut: 'A',
        },
        { id: 'new-goal', label: 'Create new goal', href: '/goals/new', shortcut: 'G' },
        { id: 'new-resume', label: 'Create new resume', href: '/resumes/new', shortcut: 'R' },
        { id: 'new-contact', label: 'Add new contact', href: '/contacts/new', shortcut: 'C' },
        { id: 'dashboard', label: 'Go to dashboard', href: '/dashboard', shortcut: 'D' },
        {
          id: 'applications',
          label: 'View all applications',
          href: '/applications',
          shortcut: '1',
        },
        { id: 'goals', label: 'View all goals', href: '/goals', shortcut: '2' },
        { id: 'resumes', label: 'View all resumes', href: '/resumes', shortcut: '3' },
        { id: 'contacts', label: 'View all contacts', href: '/contacts', shortcut: '4' },
      ],
    };
  },
});
