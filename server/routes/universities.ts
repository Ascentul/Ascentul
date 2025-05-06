import express from 'express';
import { eq, isNotNull } from 'drizzle-orm';
import { storage } from '../storage';
import { db } from '../db';
import { users } from '@shared/schema';

const router = express.Router();

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
      // Filter where universityId is not null
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

export default router;