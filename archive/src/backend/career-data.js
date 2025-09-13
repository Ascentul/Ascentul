import { requireAuth } from "./auth";
/**
 * Registers API routes for retrieving and managing career data
 * (work history, education, skills, certifications, career summary)
 * This powers the Account Settings Profile and other components like the Resume Studio
 */
export function registerCareerDataRoutes(app, storage) {
    // DEBUG ENDPOINT: Get work history data with detailed debugging info
    app.get("/api/debug/work-history", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;
            // Get the raw work history items
            const workHistoryItems = await storage.getWorkHistory(userId);
            // Add debugging info
            const debugItems = workHistoryItems.map((item) => {
                return {
                    ...item,
                    _debug: {
                        startDateType: item.startDate
                            ? typeof item.startDate
                            : "undefined",
                        endDateType: item.endDate ? typeof item.endDate : "undefined",
                        startDateIsDate: item.startDate instanceof Date,
                        endDateIsDate: item.endDate instanceof Date,
                        startDateStr: item.startDate ? item.startDate.toString() : null,
                        endDateStr: item.endDate ? item.endDate.toString() : null,
                        hasCompany: Boolean(item.company),
                        hasPosition: Boolean(item.position),
                        formatExample: item.startDate
                            ? `${new Date(item.startDate).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric"
                            })}`
                            : null
                    }
                };
            });

            res.status(200).json({
                count: workHistoryItems.length,
                items: debugItems
            });
        }
        catch (error) {
            console.error("DEBUG ERROR fetching work history:", error);
            res.status(500).json({
                message: "Error fetching work history for debugging",
                error: String(error)
            });
        }
    });
    // Get all career data for the current user
    app.get("/api/career-data", requireAuth, async (req, res) => {
        try {
            // Ensure we have a valid user session
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;
            // Fetch all career data in parallel
            let workHistory, educationHistory, skills, certifications = [], user;
            try {

                [workHistory, educationHistory, skills, user] = await Promise.all([
                    storage.getWorkHistory(userId),
                    storage.getEducationHistory(userId),
                    storage.getUserSkills(userId),
                    storage.getUser(userId)
                ]);
                // Add debug logs to see what's happening with skills

                // Make sure skills is an array
                if (!skills) {

                    skills = [];
                }
                if (skills.length > 0) {

                }
                // Only try to get certifications if the method exists
                if (typeof storage.getCertifications === "function") {
                    certifications = await storage.getCertifications(userId);
                }
                else {

                    certifications = []; // Empty array as fallback
                }
            }
            catch (error) {
                console.error("Error fetching career data components:", error);
                throw error;
            }
            // Extract career summary from user profile - map snake_case from DB to camelCase for API
            const careerSummary = user?.career_summary || user?.careerSummary || "";
            const linkedInUrl = user?.linkedin_url || user?.linkedInUrl || "";
            // Serialize dates for work history items
            const serializedWorkHistory = workHistory.map((item) => ({
                ...item,
                startDate: item.startDate instanceof Date
                    ? item.startDate.toISOString()
                    : item.startDate,
                endDate: item.endDate instanceof Date
                    ? item.endDate.toISOString()
                    : item.endDate,
                createdAt: item.createdAt instanceof Date
                    ? item.createdAt.toISOString()
                    : item.createdAt
            }));
            // Serialize dates for education history items
            const serializedEducationHistory = educationHistory.map((item) => ({
                ...item,
                startDate: item.startDate instanceof Date
                    ? item.startDate.toISOString()
                    : item.startDate,
                endDate: item.endDate instanceof Date
                    ? item.endDate.toISOString()
                    : item.endDate,
                createdAt: item.createdAt instanceof Date
                    ? item.createdAt.toISOString()
                    : item.createdAt
            }));
            // Serialize dates for certifications
            const serializedCertifications = certifications.map((item) => {
                // Create a shallow copy of the item
                const serialized = { ...item };
                // For safety, wrap date conversion in try/catch blocks
                try {
                    // Only convert if createdAt exists and is a Date
                    if (serialized.createdAt) {
                        // Use Object.prototype.toString to check if it's a Date
                        if (Object.prototype.toString.call(serialized.createdAt) ===
                            "[object Date]") {
                            const dateObj = serialized.createdAt;
                            serialized.createdAt = dateObj.toISOString
                                ? dateObj.toISOString()
                                : new Date(dateObj).toISOString();
                        }
                    }
                    // Check and convert issueDate if present
                    if (serialized.issueDate) {
                        if (Object.prototype.toString.call(serialized.issueDate) ===
                            "[object Date]") {
                            const issueDateObj = serialized.issueDate;
                            serialized.issueDate = issueDateObj.toISOString
                                ? issueDateObj.toISOString()
                                : new Date(issueDateObj).toISOString();
                        }
                    }
                    // Check and convert expirationDate if present
                    if (serialized.expirationDate) {
                        if (Object.prototype.toString.call(serialized.expirationDate) ===
                            "[object Date]") {
                            const expDateObj = serialized.expirationDate;
                            serialized.expirationDate = expDateObj.toISOString
                                ? expDateObj.toISOString()
                                : new Date(expDateObj).toISOString();
                        }
                    }
                }
                catch (err) {
                    console.error("Error serializing certification dates:", err);
                    // Leave the original values on error
                }
                return serialized;
            });
            // Serialize dates for skills with a more robust approach
            const serializedSkills = skills.map((item) => {
                const serialized = { ...item };
                // Use a safer approach with strict type checking
                try {
                    if (serialized.createdAt) {
                        // Check if it's an object that likely has Date properties
                        if (typeof serialized.createdAt === "object" &&
                            serialized.createdAt !== null &&
                            typeof serialized.createdAt.getTime === "function") {
                            // It's a Date-like object, so convert to ISO string
                            const createdAtTime = serialized.createdAt.getTime();
                            serialized.createdAt = new Date(createdAtTime).toISOString();
                        }
                    }
                }
                catch (err) {
                    console.error("Error serializing skill dates:", err);
                    // Keep original value if there's an error
                }
                return serialized;
            });
            // Return all career data in a single response with serialized dates

            res.status(200).json({
                workHistory: serializedWorkHistory,
                educationHistory: serializedEducationHistory,
                skills: serializedSkills,
                certifications: serializedCertifications,
                careerSummary,
                linkedInUrl
            });
        }
        catch (error) {
            console.error("Error fetching career data:", error);
            res.status(500).json({ message: "Error fetching career data" });
        }
    });
    // Get career profile data specifically for path generation
    app.get("/api/career-data/profile", requireAuth, async (req, res) => {
        try {
            // Ensure we have a valid user session
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;
            // Fetch all career data in parallel
            let workHistory, education, skills, certifications = [], user;
            try {
                ;
                [workHistory, education, skills, user] = await Promise.all([
                    storage.getWorkHistory(userId),
                    storage.getEducationHistory(userId),
                    storage.getUserSkills(userId),
                    storage.getUser(userId)
                ]);
                // Only try to get certifications if the method exists
                if (typeof storage.getCertifications === "function") {
                    certifications = await storage.getCertifications(userId);
                }
                else {

                    certifications = []; // Empty array as fallback
                }
            }
            catch (error) {
                console.error("Error fetching career data components:", error);
                throw error;
            }
            // Extract career summary from user profile - map snake_case from DB to camelCase for API
            const careerSummary = user?.career_summary || user?.careerSummary || "";

            // Return all career data in the format expected by the path generator
            return res.json({
                workHistory,
                education,
                skills,
                certifications,
                careerSummary
            });
        }
        catch (error) {
            console.error("Error fetching career profile data:", error);
            res.status(500).json({ message: "Error fetching career profile data" });
        }
    });
    // Work History CRUD endpoints
    app.post("/api/career-data/work-history", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;

            // Process dates to ensure they're Date objects
            const formData = { ...req.body };
            // Convert string dates to Date objects
            if (formData.startDate && typeof formData.startDate === "string") {
                formData.startDate = new Date(formData.startDate);
            }
            if (formData.endDate && typeof formData.endDate === "string") {
                formData.endDate = new Date(formData.endDate);
            }

            // Check storage before creating
            const existingItems = await storage.getWorkHistory(userId);

            const workHistoryItem = await storage.createWorkHistoryItem(userId, formData);
            // Serialize dates to ISO strings in the response
            const serializedItem = {
                ...workHistoryItem,
                startDate: workHistoryItem.startDate instanceof Date
                    ? workHistoryItem.startDate.toISOString()
                    : workHistoryItem.startDate,
                endDate: workHistoryItem.endDate instanceof Date
                    ? workHistoryItem.endDate.toISOString()
                    : workHistoryItem.endDate,
                createdAt: workHistoryItem.createdAt instanceof Date
                    ? workHistoryItem.createdAt.toISOString()
                    : workHistoryItem.createdAt
            };

            // Verify item was saved by retrieving again
            const updatedItems = await storage.getWorkHistory(userId);

            // Debug all work history items to check that the newly created item is there
            updatedItems.forEach((item, index) => {

            });
            res.status(201).json(serializedItem);
        }
        catch (error) {
            console.error("❌ Error creating work history item:", error);
            res.status(500).json({ message: "Error creating work history item" });
        }
    });
    app.put("/api/career-data/work-history/:id", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const id = parseInt(req.params.id);
            // Process dates to ensure they're Date objects
            const formData = { ...req.body };
            // Convert string dates to Date objects
            if (formData.startDate && typeof formData.startDate === "string") {
                formData.startDate = new Date(formData.startDate);
            }
            if (formData.endDate && typeof formData.endDate === "string") {
                formData.endDate = new Date(formData.endDate);
            }

            const updatedItem = await storage.updateWorkHistoryItem(id, formData);
            if (!updatedItem) {
                return res
                    .status(404)
                    .json({ message: "Work history item not found" });
            }
            // Serialize dates to ISO strings in the response
            const serializedItem = {
                ...updatedItem,
                startDate: updatedItem.startDate instanceof Date
                    ? updatedItem.startDate.toISOString()
                    : updatedItem.startDate,
                endDate: updatedItem.endDate instanceof Date
                    ? updatedItem.endDate.toISOString()
                    : updatedItem.endDate,
                createdAt: updatedItem.createdAt instanceof Date
                    ? updatedItem.createdAt.toISOString()
                    : updatedItem.createdAt
            };

            res.status(200).json(serializedItem);
        }
        catch (error) {
            console.error("Error updating work history item:", error);
            res.status(500).json({ message: "Error updating work history item" });
        }
    });
    app.delete("/api/career-data/work-history/:id", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const id = parseInt(req.params.id);
            const success = await storage.deleteWorkHistoryItem(id);
            if (!success) {
                return res
                    .status(404)
                    .json({ message: "Work history item not found" });
            }
            res.status(204).end();
        }
        catch (error) {
            console.error("Error deleting work history item:", error);
            res.status(500).json({ message: "Error deleting work history item" });
        }
    });
    // Education History CRUD endpoints
    app.post("/api/career-data/education", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;

            // Process dates to ensure they're Date objects
            const formData = { ...req.body };

            // Convert string dates to Date objects
            if (formData.startDate && typeof formData.startDate === "string") {
                formData.startDate = new Date(formData.startDate);
            }
            if (formData.endDate && typeof formData.endDate === "string") {
                formData.endDate = new Date(formData.endDate);
            }
            // Ensure achievements is an array
            if (!formData.achievements) {
                formData.achievements = [];
            }
            else if (!Array.isArray(formData.achievements)) {
                formData.achievements = [formData.achievements];
            }

            // Check storage before creating
            const existingItems = await storage.getEducationHistory(userId);

            const educationItem = await storage.createEducationHistoryItem(userId, formData);
            // Serialize dates to ISO strings in the response
            const serializedItem = {
                ...educationItem,
                startDate: educationItem.startDate instanceof Date
                    ? educationItem.startDate.toISOString()
                    : educationItem.startDate,
                endDate: educationItem.endDate instanceof Date
                    ? educationItem.endDate.toISOString()
                    : educationItem.endDate,
                createdAt: educationItem.createdAt instanceof Date
                    ? educationItem.createdAt.toISOString()
                    : educationItem.createdAt
            };

            // Verify item was saved by retrieving again
            const updatedItems = await storage.getEducationHistory(userId);

            res.status(201).json(serializedItem);
        }
        catch (error) {
            console.error("❌ Error creating education item:", error);
            res.status(500).json({
                message: "Error creating education item",
                error: String(error)
            });
        }
    });
    app.put("/api/career-data/education/:id", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const id = parseInt(req.params.id);
            // Process dates to ensure they're Date objects
            const formData = { ...req.body };
            // Convert string dates to Date objects
            if (formData.startDate && typeof formData.startDate === "string") {
                formData.startDate = new Date(formData.startDate);
            }
            if (formData.endDate && typeof formData.endDate === "string") {
                formData.endDate = new Date(formData.endDate);
            }
            const updatedItem = await storage.updateEducationHistoryItem(id, formData);
            if (!updatedItem) {
                return res.status(404).json({ message: "Education item not found" });
            }
            // Serialize dates to ISO strings in the response
            const serializedItem = {
                ...updatedItem,
                startDate: updatedItem.startDate instanceof Date
                    ? updatedItem.startDate.toISOString()
                    : updatedItem.startDate,
                endDate: updatedItem.endDate instanceof Date
                    ? updatedItem.endDate.toISOString()
                    : updatedItem.endDate,
                createdAt: updatedItem.createdAt instanceof Date
                    ? updatedItem.createdAt.toISOString()
                    : updatedItem.createdAt
            };
            res.status(200).json(serializedItem);
        }
        catch (error) {
            console.error("Error updating education item:", error);
            res.status(500).json({ message: "Error updating education item" });
        }
    });
    app.delete("/api/career-data/education/:id", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const id = parseInt(req.params.id);
            const success = await storage.deleteEducationHistoryItem(id);
            if (!success) {
                return res.status(404).json({ message: "Education item not found" });
            }
            res.status(204).end();
        }
        catch (error) {
            console.error("Error deleting education item:", error);
            res.status(500).json({ message: "Error deleting education item" });
        }
    });
    // Skills CRUD endpoints
    // Debug endpoint to get skills directly
    app.get("/api/career-data/skills", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;

            // Fetch skills directly
            const skills = await storage.getUserSkills(userId);

            if (skills.length > 0) {

            }
            res.status(200).json(skills);
        }
        catch (error) {
            console.error("Error fetching skills:", error);
            res.status(500).json({ message: "Error fetching skills" });
        }
    });
    app.post("/api/career-data/skills", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;
            // Add userId to the request body before creating
            const skillData = { ...req.body, userId };

            const skill = await storage.createSkill(skillData);

            res.status(201).json(skill);
        }
        catch (error) {
            console.error("Error creating skill:", error);
            res.status(500).json({ message: "Error creating skill" });
        }
    });
    app.put("/api/career-data/skills/:id", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const id = parseInt(req.params.id);
            const updatedSkill = await storage.updateSkill(id, req.body);
            if (!updatedSkill) {
                return res.status(404).json({ message: "Skill not found" });
            }
            // Serialize dates for the response using a safer approach
            const serializedSkill = { ...updatedSkill };
            // Safely handle createdAt date
            try {
                if (updatedSkill.createdAt) {
                    if (typeof updatedSkill.createdAt === "object" &&
                        updatedSkill.createdAt !== null &&
                        typeof updatedSkill.createdAt.getTime === "function") {
                        serializedSkill.createdAt = new Date(updatedSkill.createdAt.getTime()).toISOString();
                    }
                }
            }
            catch (err) {
                console.error("Error serializing skill dates in update:", err);
                // Keep original value if serialization fails
            }
            res.status(200).json(serializedSkill);
        }
        catch (error) {
            console.error("Error updating skill:", error);
            res.status(500).json({ message: "Error updating skill" });
        }
    });
    app.delete("/api/career-data/skills/:id", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const id = parseInt(req.params.id);
            const success = await storage.deleteSkill(id);
            if (!success) {
                return res.status(404).json({ message: "Skill not found" });
            }
            res.status(204).end();
        }
        catch (error) {
            console.error("Error deleting skill:", error);
            res.status(500).json({ message: "Error deleting skill" });
        }
    });
    // Certifications CRUD endpoints
    app.post("/api/career-data/certifications", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;
            // Process dates to ensure they're Date objects
            const formData = { ...req.body };
            // Convert string dates to Date objects if they exist
            if (formData.issueDate && typeof formData.issueDate === "string") {
                formData.issueDate = new Date(formData.issueDate);
            }
            if (formData.expirationDate &&
                typeof formData.expirationDate === "string") {
                formData.expirationDate = new Date(formData.expirationDate);
            }
            const certification = await storage.createCertification(userId, formData);
            // Serialize dates for the response with error handling
            try {
                const serializedCertification = { ...certification };
                // Safely handle createdAt date
                if (certification.createdAt) {
                    if (typeof certification.createdAt === "object" &&
                        certification.createdAt !== null &&
                        typeof certification.createdAt.getTime === "function") {
                        serializedCertification.createdAt = new Date(certification.createdAt.getTime()).toISOString();
                    }
                }
                // Handle issueDate if it exists - using a safer type checking approach
                if ("issueDate" in certification && certification.issueDate) {
                    if (typeof certification.issueDate === "object" &&
                        certification.issueDate !== null &&
                        typeof certification.issueDate.getTime === "function") {
                        serializedCertification.issueDate = new Date(certification.issueDate.getTime()).toISOString();
                    }
                }
                // Handle expirationDate if it exists - using a safer type checking approach
                if ("expirationDate" in certification &&
                    certification.expirationDate) {
                    if (typeof certification.expirationDate === "object" &&
                        certification.expirationDate !== null &&
                        typeof certification.expirationDate.getTime ===
                            "function") {
                        serializedCertification.expirationDate = new Date(certification.expirationDate.getTime()).toISOString();
                    }
                }
                res.status(201).json(serializedCertification);
            }
            catch (serializationError) {
                console.error("Error serializing certification dates:", serializationError);
                // Fallback to returning the original data if serialization fails
                res.status(201).json(certification);
            }
        }
        catch (error) {
            console.error("Error creating certification:", error);
            res.status(500).json({ message: "Error creating certification" });
        }
    });
    app.put("/api/career-data/certifications/:id", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const id = parseInt(req.params.id);
            // Process dates to ensure they're Date objects
            const formData = { ...req.body };
            // Convert string dates to Date objects if they exist
            if (formData.issueDate && typeof formData.issueDate === "string") {
                formData.issueDate = new Date(formData.issueDate);
            }
            if (formData.expirationDate &&
                typeof formData.expirationDate === "string") {
                formData.expirationDate = new Date(formData.expirationDate);
            }
            const updatedCertification = await storage.updateCertification(id, formData);
            if (!updatedCertification) {
                return res.status(404).json({ message: "Certification not found" });
            }
            // Serialize dates for the response with error handling
            try {
                const serializedCertification = { ...updatedCertification };
                // Safely handle createdAt date
                if (updatedCertification.createdAt) {
                    if (typeof updatedCertification.createdAt === "object" &&
                        updatedCertification.createdAt !== null &&
                        typeof updatedCertification.createdAt.getTime ===
                            "function") {
                        serializedCertification.createdAt = new Date(updatedCertification.createdAt.getTime()).toISOString();
                    }
                }
                // Handle issueDate if it exists - using a safer type checking approach
                if ("issueDate" in updatedCertification &&
                    updatedCertification.issueDate) {
                    if (typeof updatedCertification.issueDate === "object" &&
                        updatedCertification.issueDate !== null &&
                        typeof updatedCertification.issueDate.getTime ===
                            "function") {
                        serializedCertification.issueDate = new Date(updatedCertification.issueDate.getTime()).toISOString();
                    }
                }
                // Handle expirationDate if it exists - using a safer type checking approach
                if ("expirationDate" in updatedCertification &&
                    updatedCertification.expirationDate) {
                    if (typeof updatedCertification.expirationDate === "object" &&
                        updatedCertification.expirationDate !== null &&
                        typeof updatedCertification.expirationDate.getTime ===
                            "function") {
                        serializedCertification.expirationDate = new Date(updatedCertification.expirationDate.getTime()).toISOString();
                    }
                }
                res.status(200).json(serializedCertification);
            }
            catch (serializationError) {
                console.error("Error serializing certification dates:", serializationError);
                // Fallback to returning the original data if serialization fails
                res.status(200).json(updatedCertification);
            }
        }
        catch (error) {
            console.error("Error updating certification:", error);
            res.status(500).json({ message: "Error updating certification" });
        }
    });
    app.delete("/api/career-data/certifications/:id", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const id = parseInt(req.params.id);
            const success = await storage.deleteCertification(id);
            if (!success) {
                return res.status(404).json({ message: "Certification not found" });
            }
            res.status(204).end();
        }
        catch (error) {
            console.error("Error deleting certification:", error);
            res.status(500).json({ message: "Error deleting certification" });
        }
    });
    // Career Summary endpoint (updates the user profile)
    app.put("/api/career-data/career-summary", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                console.error("❌ No userId found in request");
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;
            const { careerSummary } = req.body;

            if (careerSummary === undefined) {
                console.error("❌ Career summary is undefined in request body");
                return res.status(400).json({
                    message: "Career summary is required",
                    error: "Missing careerSummary field"
                });
            }
            try {

                const updatedUser = await storage.updateUser(userId, {
                    careerSummary
                });
                if (!updatedUser) {
                    console.error(`❌ User ${userId} not found or update failed - storage.updateUser returned null/undefined`);
                    return res.status(404).json({ message: "User not found" });
                }

                res.status(200).json({ careerSummary: updatedUser.careerSummary });
            }
            catch (updateError) {
                console.error("❌ Error in storage.updateUser:", updateError);
                console.error("❌ Error stack:", updateError instanceof Error ? updateError.stack : "No stack trace");
                res.status(500).json({
                    message: "Error updating career summary",
                    error: updateError instanceof Error
                        ? updateError.message
                        : "Unknown error"
                });
            }
        }
        catch (error) {
            console.error("❌ Error handling career summary update:", error);
            console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");
            res.status(500).json({
                message: "Error updating career summary",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    // Optimize Career Data endpoint (updates multiple career data elements based on AI analysis)
    // Update LinkedIn URL endpoint
    app.post("/api/career-data/linkedin-url", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;
            const { linkedInUrl } = req.body;
            if (!linkedInUrl) {
                return res.status(400).json({ message: "LinkedIn URL is required" });
            }
            const updatedUser = await storage.updateUserLinkedInUrl(userId, linkedInUrl);
            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json({ linkedInUrl: updatedUser.linkedInUrl });
        }
        catch (error) {
            console.error("Error updating LinkedIn URL:", error);
            res.status(500).json({ message: "Error updating LinkedIn URL" });
        }
    });
    app.post("/api/career-data/optimize", requireAuth, async (req, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const userId = req.userId;
            const { jobDescription, careerData } = req.body;
            if (!jobDescription) {
                return res
                    .status(400)
                    .json({ message: "Job description is required" });
            }
            if (!careerData) {
                return res.status(400).json({ message: "Career data is required" });
            }

            // Import the optimizeCareerData function from openai
            const { optimizeCareerData } = await import("./openai");
            // Call OpenAI to optimize the career data
            const optimizedData = await optimizeCareerData(careerData, jobDescription);
            if (!optimizedData) {
                return res
                    .status(500)
                    .json({ message: "Failed to optimize career data" });
            }
            // Return the optimized data without making any updates to the database yet
            // The client will review the optimizations and then call specific update endpoints
            res.status(200).json(optimizedData);
        }
        catch (error) {
            console.error("Error optimizing career data:", error);
            res.status(500).json({
                message: "Error optimizing career data",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
}
