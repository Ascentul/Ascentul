import express from "express";
import { storage } from "../storage";
const router = express.Router();
// Development-only route for testing
if (process.env.NODE_ENV === "development") {
    router.post("/setup-test-admin", async (req, res) => {
        try {
            const testUser = await storage.createUser({
                username: "testadmin",
                email: "testadmin@university.edu",
                password: "Test123!",
                name: "Test Admin",
                userType: "university_admin"
            });
            res.json({
                message: "Test admin account created",
                credentials: {
                    username: "testadmin",
                    password: "Test123!"
                }
            });
        }
        catch (error) {
            console.error("Error creating test admin:", error);
            res.status(500).json({ message: "Failed to create test admin" });
        }
    });
}
// Set the user's role to university_admin
router.post("/set-university-admin", async (req, res) => {
    // Check if user is authenticated via session
    if (!req.userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    // Convert userId to number for database compatibility
    const userIdNum = req.userId ? parseInt(req.userId) : undefined;
    if (!userIdNum) {
        return res.status(401).json({ message: "Invalid user ID" });
    }
    try {
        const updatedUser = await storage.updateUser(userIdNum, {
            userType: "university_admin"
        });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // Return user data without password
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Failed to update user role" });
    }
});
export default router;
