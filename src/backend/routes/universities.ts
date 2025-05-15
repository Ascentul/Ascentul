import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { db } from '../db';
import { users, universities, insertUniversitySchema } from '@shared/schema';
import { eq, isNotNull, and, isNull } from 'drizzle-orm';

const router = express.Router();

// Schema for creating or updating a university
const universitySchema = z.object({
  name: z.string().min(3, "University name must be at least 3 characters"),
  licensePlan: z.enum(["Starter", "Basic", "Pro", "Enterprise"]),
  licenseSeats: z.number().min(1, "Seat limit must be at least 1"),
  licenseStart: z.string().refine(val => !isNaN(new Date(val).getTime()), {
    message: "Please enter a valid start date",
  }),
  licenseEnd: z.string().refine(val => !isNaN(new Date(val).getTime()), {
    message: "Please enter a valid end date",
  }),
  status: z.string().default("Active"),
  adminEmail: z.string().email("Please enter a valid email").optional(),
});

// Get all universities
router.get('/', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    // Get all universities from the universities table
    const universityList = await db.select()
      .from(universities)
      .where(
        // Exclude deleted universities
        eq(universities.status, "Active")
      );
    
    // Get all users who have a universityId to count students and admins
    const universityUsers = await db.select({
      universityId: users.universityId,
      userType: users.userType
    })
    .from(users)
    .where(
      isNotNull(users.universityId)
    );
    
    // Process the results to get university information with counts
    const universitiesWithCounts = universityList.map(university => {
      const studentCount = universityUsers.filter(
        user => user.universityId === university.id && user.userType === 'university_student'
      ).length;
      
      const adminCount = universityUsers.filter(
        user => user.universityId === university.id && user.userType === 'university_admin'
      ).length;
      
      return {
        ...university,
        studentCount,
        adminCount
      };
    });
    
    res.json(universitiesWithCounts);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// Create a university
router.post('/', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    // Validate input
    const validatedData = universitySchema.parse(req.body);
    
    // Generate a slug from the university name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Create the university with the updated schema
    const university = await db.insert(universities)
      .values({
        name: validatedData.name,
        slug: slug,
        licensePlan: validatedData.licensePlan,
        licenseSeats: validatedData.licenseSeats,
        licenseUsed: 0, // Start with 0 used seats
        licenseStart: new Date(validatedData.licenseStart),
        licenseEnd: new Date(validatedData.licenseEnd),
        status: validatedData.status,
        createdById: req.session.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // If admin email is provided, send an invitation
    if (validatedData.adminEmail) {
      // This would be handled by the university-invites router
      // For now, just log it
      console.log(`Will send invitation to ${validatedData.adminEmail} for university ${university[0].id}`);
    }
    
    res.status(201).json({
      ...university[0],
      studentCount: 0,
      adminCount: 0
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating university:', error);
    res.status(500).json({ error: 'Failed to create university' });
  }
});

// Get a specific university
router.get('/:id', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const universityId = parseInt(req.params.id);
    if (isNaN(universityId)) {
      return res.status(400).json({ error: 'Invalid university ID' });
    }
    
    // Get the university from the universities table
    const [university] = await db.select()
      .from(universities)
      .where(eq(universities.id, universityId));
    
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    // Get count of students and admins
    const universityUsers = await db.select({
      userType: users.userType
    })
    .from(users)
    .where(
      eq(users.universityId, universityId)
    );
    
    let studentCount = 0;
    let adminCount = 0;
    
    universityUsers.forEach(user => {
      if (user.userType === 'university_student') {
        studentCount++;
      } else if (user.userType === 'university_admin') {
        adminCount++;
      }
    });
    
    res.json({
      ...university,
      studentCount,
      adminCount
    });
  } catch (error) {
    console.error('Error fetching university:', error);
    res.status(500).json({ error: 'Failed to fetch university' });
  }
});

// Update a university
router.patch('/:id', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const universityId = parseInt(req.params.id);
    if (isNaN(universityId)) {
      return res.status(400).json({ error: 'Invalid university ID' });
    }
    
    // Validate input
    const validatedData = universitySchema.parse(req.body);
    
    // Get the university
    const [university] = await db.select()
      .from(universities)
      .where(eq(universities.id, universityId));
    
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    // Generate a slug from the university name (if name was updated)
    const slug = validatedData.name !== university.name
      ? validatedData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      : university.slug;
    
    // Update the university
    await db.update(universities)
      .set({
        name: validatedData.name,
        slug: slug,
        licensePlan: validatedData.licensePlan,
        licenseSeats: validatedData.licenseSeats,
        licenseStart: new Date(validatedData.licenseStart),
        licenseEnd: new Date(validatedData.licenseEnd),
        status: validatedData.status,
        updatedAt: new Date()
      })
      .where(eq(universities.id, universityId));
    
    // Get count of students and admins (for the response)
    const universityUsers = await db.select({
      userType: users.userType
    })
    .from(users)
    .where(
      eq(users.universityId, universityId)
    );
    
    let studentCount = 0;
    let adminCount = 0;
    
    universityUsers.forEach(user => {
      if (user.userType === 'university_student') {
        studentCount++;
      } else if (user.userType === 'university_admin') {
        adminCount++;
      }
    });
    
    // Get the updated university
    const [updatedUniversity] = await db.select()
      .from(universities)
      .where(eq(universities.id, universityId));
    
    res.json({
      ...updatedUniversity,
      studentCount,
      adminCount
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating university:', error);
    res.status(500).json({ error: 'Failed to update university' });
  }
});

// Delete a university
router.delete('/:id', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const universityId = parseInt(req.params.id);
    if (isNaN(universityId)) {
      return res.status(400).json({ error: 'Invalid university ID' });
    }
    
    // Get the university
    const [university] = await db.select()
      .from(universities)
      .where(eq(universities.id, universityId));
    
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    // In a production app, we would first remove all university associations
    // and then soft delete the university record
    
    // For simplicity, we'll just remove university associations
    await db.update(users)
      .set({ 
        universityId: null,
        universityName: null,
      })
      .where(eq(users.universityId, universityId));
    
    // "Delete" the university by updating its status
    await db.update(universities)
      .set({ 
        status: "Deleted",
        updatedAt: new Date()
      })
      .where(eq(universities.id, universityId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting university:', error);
    res.status(500).json({ error: 'Failed to delete university' });
  }
});

// Get all students for a university
router.get('/:id/students', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const universityId = parseInt(req.params.id);
    if (isNaN(universityId)) {
      return res.status(400).json({ error: 'Invalid university ID' });
    }
    
    // Get the university
    const university = await db.query.users.findFirst({
      where: eq(users.id, universityId)
    });
    
    if (!university || university.userType !== 'university') {
      return res.status(404).json({ error: 'University not found' });
    }
    
    // Get all students for this university
    const studentsData = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt
    })
    .from(users)
    .where(
      and(
        eq(users.universityId, universityId),
        eq(users.userType, 'university_student')
      )
    );
    
    const students = studentsData.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      enrollmentDate: student.createdAt
    }));
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching university students:', error);
    res.status(500).json({ error: 'Failed to fetch university students' });
  }
});

// Get all admins for a university
router.get('/:id/admins', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const universityId = parseInt(req.params.id);
    if (isNaN(universityId)) {
      return res.status(400).json({ error: 'Invalid university ID' });
    }
    
    // Get the university
    const university = await db.query.users.findFirst({
      where: eq(users.id, universityId)
    });
    
    if (!university || university.userType !== 'university') {
      return res.status(404).json({ error: 'University not found' });
    }
    
    // Get all admins for this university
    const adminsData = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt
    })
    .from(users)
    .where(
      and(
        eq(users.universityId, universityId),
        eq(users.userType, 'university_admin')
      )
    );
    
    const admins = adminsData.map(admin => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      addedDate: admin.createdAt
    }));
    
    res.json(admins);
  } catch (error) {
    console.error('Error fetching university admins:', error);
    res.status(500).json({ error: 'Failed to fetch university admins' });
  }
});

export default router;