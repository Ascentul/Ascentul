import express from "express";
import { storage } from "../storage";

const router = express.Router();

// Set the user's role to university_admin
router.post("/set-university-admin", async (req, res) => {
  // Check if user is authenticated via session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const userId = req.session.userId;
  
  try {
    const updatedUser = await storage.updateUser(userId, { userType: "university_admin" });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return user data without password
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Failed to update user role" });
  }
});

export default router;