import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq, isNotNull, and, isNull } from 'drizzle-orm';

const router = express.Router();

// Schema for creating or updating a university
const universitySchema = z.object({
  name: z.string().min(3),
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
    // Get all users who have a universityId or universityName
    // Group them by university to create a list of universities with student counts
    const universityUsers = await db.select({
      id: users.universityId,
      name: users.universityName,
      userType: users.userType
    })
    .from(users)
    .where(
      isNotNull(users.universityId)
    );
    
    // Process the results to get university information
    const universitiesMap = new Map();
    
    universityUsers.forEach(user => {
      if (!user.id || !user.name) return;
      
      if (!universitiesMap.has(user.id)) {
        universitiesMap.set(user.id, {
          id: user.id,
          name: user.name,
          studentCount: 0,
          adminCount: 0
        });
      }
      
      const university = universitiesMap.get(user.id);
      
      if (user.userType === 'university_student') {
        university.studentCount++;
      } else if (user.userType === 'university_admin') {
        university.adminCount++;
      }
    });
    
    const universities = Array.from(universitiesMap.values());
    
    res.json(universities);
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
    
    // In a real application, you would likely have a universities table
    // For this example, we'll create a "university" user with a special type
    // This would be refactored in a production system
    const university = await storage.createUser({
      username: `university_${Date.now()}`,
      name: validatedData.name,
      email: `university_${Date.now()}@example.com`,
      password: Math.random().toString(36).slice(-8),
      userType: 'university',
      role: 'university'
    });
    
    res.status(201).json({
      id: university.id,
      name: university.name,
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
    
    // Get the university
    const university = await db.query.users.findFirst({
      where: eq(users.id, universityId)
    });
    
    if (!university || university.userType !== 'university') {
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
      id: university.id,
      name: university.name,
      studentCount,
      adminCount,
      createdAt: university.createdAt
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
    const university = await db.query.users.findFirst({
      where: eq(users.id, universityId)
    });
    
    if (!university || university.userType !== 'university') {
      return res.status(404).json({ error: 'University not found' });
    }
    
    // Update the university
    await db.update(users)
      .set({ name: validatedData.name })
      .where(eq(users.id, universityId));
    
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
    
    res.json({
      id: universityId,
      name: validatedData.name,
      studentCount,
      adminCount,
      createdAt: university.createdAt
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
    const university = await db.query.users.findFirst({
      where: eq(users.id, universityId)
    });
    
    if (!university || university.userType !== 'university') {
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
    await db.update(users)
      .set({ 
        active: false,
        email: `deleted_${university.email}`,
      })
      .where(eq(users.id, universityId));
    
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