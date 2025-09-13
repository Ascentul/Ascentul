import express, { Request, Response } from "express";
import { storage } from "../storage";

// Interface for academic programs
export interface AcademicProgram {
  id: number;
  programName: string;
  degreeType: string;
  departmentName: string;
  description?: string;
  duration?: number;
  active: boolean;
}

// Sample programs - in a real app, these would be in the database
let academicPrograms: AcademicProgram[] = [
  {
    id: 1,
    programName: 'Computer Science',
    degreeType: 'Bachelor',
    departmentName: 'School of Engineering',
    description: 'Foundation in computing theory, programming, and applications.',
    duration: 4,
    active: true,
  },
  {
    id: 2,
    programName: 'Business Administration',
    degreeType: 'Master',
    departmentName: 'Business School',
    description: 'Advanced management and leadership principles for modern business environments.',
    duration: 2,
    active: true,
  },
  {
    id: 3,
    programName: 'Psychology',
    degreeType: 'Bachelor',
    departmentName: 'School of Social Sciences',
    description: 'Study of human behavior, mental processes, and their applications.',
    duration: 4,
    active: true,
  }
];

// Create router
const router = express.Router();

// Middleware to check if user is a university admin
async function requireUniversityAdmin(req: Request, res: Response, next: () => void) {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(req.userId);
  if (!user || user.userType !== 'university_admin') {

    return res.status(403).json({ message: "Access denied. University Admin privileges required." });
  }
  
  next();
}

// GET all academic programs
router.get('/', requireUniversityAdmin, async (req: Request, res: Response) => {
  try {
    res.json(academicPrograms);
  } catch (error) {
    console.error('Error fetching academic programs:', error);
    res.status(500).json({ message: 'Failed to retrieve academic programs' });
  }
});

// GET a single academic program by ID
router.get('/:id', requireUniversityAdmin, async (req: Request, res: Response) => {
  try {
    const programId = parseInt(req.params.id);
    const program = academicPrograms.find(p => p.id === programId);
    
    if (!program) {
      return res.status(404).json({ message: 'Academic program not found' });
    }
    
    res.json(program);
  } catch (error) {
    console.error('Error fetching academic program:', error);
    res.status(500).json({ message: 'Failed to retrieve academic program' });
  }
});

// POST create a new academic program
router.post('/', requireUniversityAdmin, async (req: Request, res: Response) => {
  try {
    const { programName, degreeType, departmentName, description, duration, active } = req.body;
    
    if (!programName || !degreeType || !departmentName) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    const newProgram: AcademicProgram = {
      id: Date.now(), // Using timestamp as ID
      programName,
      degreeType,
      departmentName,
      description,
      duration,
      active: active ?? true
    };
    
    academicPrograms.push(newProgram);
    res.status(201).json(newProgram);
  } catch (error) {
    console.error('Error creating academic program:', error);
    res.status(500).json({ message: 'Failed to create academic program' });
  }
});

// PUT update an existing academic program
router.put('/:id', requireUniversityAdmin, async (req: Request, res: Response) => {
  try {
    const programId = parseInt(req.params.id);
    const programIndex = academicPrograms.findIndex(p => p.id === programId);
    
    if (programIndex === -1) {
      return res.status(404).json({ message: 'Academic program not found' });
    }
    
    const { programName, degreeType, departmentName, description, duration, active } = req.body;
    
    if (!programName || !degreeType || !departmentName) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    const updatedProgram: AcademicProgram = {
      id: programId,
      programName,
      degreeType,
      departmentName,
      description,
      duration,
      active: active ?? academicPrograms[programIndex].active
    };
    
    academicPrograms[programIndex] = updatedProgram;
    res.json(updatedProgram);
  } catch (error) {
    console.error('Error updating academic program:', error);
    res.status(500).json({ message: 'Failed to update academic program' });
  }
});

// DELETE an academic program
router.delete('/:id', requireUniversityAdmin, async (req: Request, res: Response) => {
  try {
    const programId = parseInt(req.params.id);
    const programIndex = academicPrograms.findIndex(p => p.id === programId);
    
    if (programIndex === -1) {
      return res.status(404).json({ message: 'Academic program not found' });
    }
    
    academicPrograms.splice(programIndex, 1);
    res.json({ message: 'Academic program deleted successfully' });
  } catch (error) {
    console.error('Error deleting academic program:', error);
    res.status(500).json({ message: 'Failed to delete academic program' });
  }
});

export default router;