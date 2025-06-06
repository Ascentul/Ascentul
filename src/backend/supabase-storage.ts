import { IStorage } from "./storage"
import { supabase, supabaseHelpers, supabaseAdmin } from "./supabase"
// Express session imports removed in Supabase auth migration
import { ENV } from "../config/env"
import {
  User,
  InsertUser,
  Skill,
  InsertSkill,
  Language,
  InsertLanguage
} from "../utils/schema"

// SupabaseStore class removed in Supabase auth migration

export class SupabaseStorage implements IStorage {
  constructor() {
    // Session store removed in Supabase auth migration
  }

  // ============ User Operations ============
  async getUser(id: string): Promise<User | undefined> {
    console.log(`🔍 Looking up user with ID: "${id}" (type: ${typeof id})`)

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error(`❌ Error fetching user ${id}:`, error)
        console.error(`❌ Error code: ${error.code}, message: ${error.message}`)
        return undefined
      }

      if (!data) {
        console.log(`⚠️ No user found with ID: ${id}`)
        return undefined
      }

      console.log(
        `✅ Found user ${id}: ${
          data.email || data.username || "no email/username"
        }`
      )
      return data as unknown as User
    } catch (exception) {
      console.error(`❌ Exception in getUser for ${id}:`, exception)
      return undefined
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single()

    if (error) {
      console.error("Error fetching user by username:", error)
      return undefined
    }

    return data as unknown as User
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (error) {
      console.error("Error fetching user by email:", error)
      return undefined
    }

    return data as unknown as User
  }

  async createUser(user: InsertUser): Promise<User> {
    console.log(
      `🔨 Creating user with data:`,
      JSON.stringify(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName
        },
        null,
        2
      )
    )

    try {
      const { data, error } = await supabase
        .from("users")
        .insert(user)
        .select()
        .single()

      if (error) {
        console.error(`❌ Error creating user:`, error)
        console.error(`❌ Error code: ${error.code}, message: ${error.message}`)
        throw new Error(`Failed to create user: ${error.message}`)
      }

      if (!data) {
        console.error(`❌ No data returned after user creation`)
        throw new Error("No data returned after user creation")
      }

      console.log(`✅ User created successfully: ${data.id}`)
      return data as unknown as User
    } catch (exception) {
      console.error(`❌ Exception in createUser:`, exception)
      throw exception
    }
  }

  async updateUser(
    id: string,
    userData: Partial<User>
  ): Promise<User | undefined> {
    console.log(
      `⭐️ Updating user ${id} with data:`,
      JSON.stringify(userData, null, 2)
    )

    try {
      // First, check if user exists
      const existingUser = await this.getUser(id)
      if (!existingUser) {
        console.warn(
          `⚠️ User ${id} not found in database, attempting to create basic user record...`
        )

        // Create a basic user record with minimal required fields
        const basicUserData = {
          id: id,
          email: `user-${id}@temp.local`, // Temporary email - should be updated later
          username: `user-${id.substring(0, 8)}`, // Short username from ID
          displayName: `User ${id.substring(0, 8)}`,
          emailVerified: false,
          subscriptionPlan: "free" as const,
          subscriptionStatus: "active" as const,
          xp: 0,
          createdAt: new Date(),
          ...userData // Include the update data
        }

        try {
          const newUser = await this.createUser(basicUserData)
          console.log(`✅ Created new user ${id} in database`)
          return newUser
        } catch (createError) {
          console.error(`❌ Failed to create user ${id}:`, createError)
          // If we can't create the user, we can't update them either
          return undefined
        }
      }

      // Map camelCase fields to snake_case for database columns
      const mappedUserData = { ...userData }
      if ("linkedInUrl" in mappedUserData) {
        mappedUserData.linkedin_url = mappedUserData.linkedInUrl
        delete mappedUserData.linkedInUrl
      }
      if ("careerSummary" in mappedUserData) {
        mappedUserData.career_summary = mappedUserData.careerSummary
        delete mappedUserData.careerSummary
      }

      // User exists, proceed with update
      const { data, error } = await supabase
        .from("users")
        .update(mappedUserData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Error updating user:", error)
        throw new Error(`Failed to update user: ${error.message}`)
      }

      if (!data) {
        console.error("❌ No data returned after user update")
        return undefined
      }

      console.log(
        `✅ User ${id} updated successfully with fields:`,
        Object.keys(userData).join(", ")
      )
      return data as unknown as User
    } catch (error) {
      console.error("❌ Exception in updateUser:", error)
      throw error
    }
  }

  // ============ Skill Operations ============
  // Updated to handle two-table structure: skills + user_skills
  async createSkill(skillData: any): Promise<Skill> {
    console.log(
      "🚀 NEW CREATESKILL METHOD EXECUTED - UNIQUE MARKER 2024-06-06-11:20AM"
    )
    try {
      const { userId, name, proficiencyLevel, category } = skillData

      console.log(
        "🔍 Creating skill with data:",
        JSON.stringify(
          {
            userId,
            name,
            proficiencyLevel,
            category
          },
          null,
          2
        )
      )

      // Step 1: Check if the skill already exists in the master skills table
      const { data: existingSkill, error: searchError } = await supabase
        .from("skills")
        .select("*")
        .eq("name", name)
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        // PGRST116 is "not found"
        console.error("Error searching for existing skill:", searchError)
        throw new Error(
          `Failed to search for existing skill: ${searchError.message}`
        )
      }

      let skillId: number

      if (existingSkill) {
        console.log("🔍 Found existing skill:", existingSkill)
        skillId = existingSkill.id
      } else {
        // Step 2: Create the skill in the master skills table if it doesn't exist
        console.log("🔍 Creating new skill in master skills table")
        const { data: newSkill, error: createSkillError } = await supabase
          .from("skills")
          .insert({
            name,
            category: category || "Technical",
            description: null,
            icon: "code",
            popularity: 0,
            is_technical: true
          })
          .select()
          .single()

        if (createSkillError) {
          console.error("Error creating skill:", createSkillError)
          throw new Error(`Failed to create skill: ${createSkillError.message}`)
        }

        console.log("✅ Created new skill:", newSkill)
        skillId = newSkill.id
      }

      // Step 3: Check if user already has this skill
      const { data: existingUserSkill, error: userSkillSearchError } =
        await supabase
          .from("user_skills")
          .select("*")
          .eq("user_id", userId)
          .eq("skill_id", skillId)
          .single()

      if (userSkillSearchError && userSkillSearchError.code !== "PGRST116") {
        console.error(
          "Error searching for existing user skill:",
          userSkillSearchError
        )
        throw new Error(
          `Failed to search for existing user skill: ${userSkillSearchError.message}`
        )
      }

      if (existingUserSkill) {
        console.log(
          "✅ User already has this skill, returning existing:",
          existingUserSkill
        )
        // Return the existing skill with user-specific data
        return {
          id: skillId,
          name,
          proficiencyLevel: existingUserSkill.proficiency,
          category: category || "Technical",
          userId,
          yearOfExperience: existingUserSkill.years_experience,
          tags: [],
          createdAt: new Date(existingUserSkill.created_at),
          updatedAt: new Date(existingUserSkill.created_at)
        } as any
      }

      // Step 4: Create the user_skills record
      console.log("🔍 Creating user_skills record")
      const { data: userSkill, error: userSkillError } = await supabase
        .from("user_skills")
        .insert({
          user_id: userId,
          skill_id: skillId,
          proficiency: parseInt(proficiencyLevel || "1"), // Map proficiencyLevel to proficiency
          years_experience: 0,
          is_highlighted: false
        })
        .select()
        .single()

      if (userSkillError) {
        console.error("Error creating user skill:", userSkillError)
        throw new Error(
          `Failed to create user skill: ${userSkillError.message}`
        )
      }

      console.log("✅ Created user skill:", userSkill)

      // Step 5: Return the skill in the expected format
      const result = {
        id: skillId,
        name,
        proficiencyLevel: userSkill.proficiency,
        category: category || "Technical",
        userId,
        yearOfExperience: userSkill.years_experience,
        tags: [],
        createdAt: new Date(userSkill.created_at),
        updatedAt: new Date(userSkill.created_at)
      }

      console.log("✅ Returning skill result:", result)
      return result as any
    } catch (error) {
      console.error("❌ Exception in createSkill:", error)
      throw error
    }
  }

  async updateSkill(
    id: number,
    data: Partial<Skill>
  ): Promise<Skill | undefined> {
    const { data: updatedSkill, error } = await supabase
      .from("skills")
      .update(data)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating skill:", error)
      return undefined
    }

    return updatedSkill as unknown as Skill
  }

  async deleteSkill(id: number): Promise<boolean> {
    const { error } = await supabase.from("skills").delete().eq("id", id)

    if (error) {
      console.error("Error deleting skill:", error)
      return false
    }

    return true
  }

  async getUserSkills(userId: string): Promise<Skill[]> {
    const { data, error } = await supabase
      .from("user_skills")
      .select(
        `
        *,
        skills (*)
      `
      )
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching user skills:", error)
      return []
    }

    // Map the joined data to return skills with user-specific data in the expected format
    return (data || []).map((userSkill: any) => ({
      id: userSkill.skills.id,
      name: userSkill.skills.name,
      proficiencyLevel: userSkill.proficiency, // Map proficiency to proficiencyLevel
      category: userSkill.skills.category,
      userId,
      yearOfExperience: userSkill.years_experience,
      tags: [],
      createdAt: new Date(userSkill.created_at),
      updatedAt: new Date(userSkill.created_at),
      user_skill_id: userSkill.id,
      is_highlighted: userSkill.is_highlighted
    })) as unknown as Skill[]
  }

  async getSkill(id: number): Promise<Skill | undefined> {
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching skill:", error)
      return undefined
    }

    return data as unknown as Skill
  }

  // ============ Language Operations ============
  async createLanguage(language: InsertLanguage | any): Promise<Language> {
    const { data, error } = await supabase
      .from("languages")
      .insert(language)
      .select()
      .single()

    if (error) {
      console.error("Error creating language:", error)
      throw new Error(`Failed to create language: ${error.message}`)
    }

    return data as unknown as Language
  }

  async updateLanguage(
    id: number,
    data: Partial<Language>
  ): Promise<Language | undefined> {
    const { data: updatedLanguage, error } = await supabase
      .from("languages")
      .update(data)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating language:", error)
      return undefined
    }

    return updatedLanguage as unknown as Language
  }

  async deleteLanguage(id: number): Promise<boolean> {
    const { error } = await supabase.from("languages").delete().eq("id", id)

    if (error) {
      console.error("Error deleting language:", error)
      return false
    }

    return true
  }

  async getUserLanguages(userId: string): Promise<Language[]> {
    const { data, error } = await supabase
      .from("user_languages")
      .select(
        `
        *,
        languages (*)
      `
      )
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching user languages:", error)
      return []
    }

    // Map the joined data to return languages with user-specific data
    return (data || []).map((userLanguage: any) => ({
      ...userLanguage.languages,
      proficiency: userLanguage.proficiency,
      is_native: userLanguage.is_native,
      user_language_id: userLanguage.id
    })) as unknown as Language[]
  }

  async getLanguage(id: number): Promise<Language | undefined> {
    const { data, error } = await supabase
      .from("languages")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching language:", error)
      return undefined
    }

    return data as unknown as Language
  }

  // ============ System Operations ============
  async getSystemMetrics(): Promise<{
    status: string
    uptime: number
    lastIncident: string
    lastChecked: string
  }> {
    return {
      status: "operational",
      uptime: 99.9,
      lastIncident: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      lastChecked: new Date().toISOString()
    }
  }

  // Implement other methods as needed for your application
  // This is a minimal implementation focused on skills and languages

  // Helper method to check database connection
  async testDatabaseConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("count(*)", { count: "exact" })
      return !error
    } catch (error) {
      console.error("Database connection test failed:", error)
      return false
    }
  }

  // ============ Job Applications Operations ============
  async getJobApplications(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching job applications:", error)
        return []
      }

      return data || []
    } catch (exception) {
      console.error("❌ Exception in getJobApplications:", exception)
      return []
    }
  }

  async getJobApplication(id: number): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("❌ Error fetching job application:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in getJobApplication:", exception)
      return undefined
    }
  }

  async createJobApplication(userId: string, application: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .insert({
          ...application,
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating job application:", error)
        throw new Error(`Failed to create job application: ${error.message}`)
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in createJobApplication:", exception)
      throw exception
    }
  }

  async updateJobApplication(
    id: number,
    applicationData: any
  ): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .update({
          ...applicationData,
          updated_at: new Date()
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Error updating job application:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in updateJobApplication:", exception)
      return undefined
    }
  }

  async submitJobApplication(
    id: number,
    applied?: boolean
  ): Promise<any | undefined> {
    return this.updateJobApplication(id, {
      submitted: true,
      applied: applied !== false
    })
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("❌ Error deleting job application:", error)
        return false
      }

      return true
    } catch (exception) {
      console.error("❌ Exception in deleteJobApplication:", exception)
      return false
    }
  }

  // ============ Work History Operations ============
  async getWorkHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("work_history")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })

      if (error) {
        console.error("❌ Error fetching work history:", error)
        return []
      }

      return data || []
    } catch (exception) {
      console.error("❌ Exception in getWorkHistory:", exception)
      return []
    }
  }

  async getWorkHistoryItem(id: number): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("work_history")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("❌ Error fetching work history item:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in getWorkHistoryItem:", exception)
      return undefined
    }
  }

  async createWorkHistoryItem(userId: string, item: any): Promise<any> {
    try {
      // Map frontend field names to database column names
      const mappedItem = {
        user_id: userId,
        company: item.company,
        position: item.position,
        start_date: item.startDate,
        end_date: item.endDate,
        current_job: item.currentJob, // Map currentJob to current_job
        location: item.location,
        description: item.description,
        achievements: item.achievements // This might be a JSON array
        // Let Supabase handle created_at and updated_at automatically
      }

      console.log(
        "🔍 UPDATED CODE - Mapped work history item for Supabase:",
        mappedItem
      )

      const { data, error } = await supabase
        .from("work_history")
        .insert(mappedItem)
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating work history item:", error)
        throw new Error(`Failed to create work history item: ${error.message}`)
      }

      console.log("✅ Successfully created work history item:", data)
      return data
    } catch (exception) {
      console.error("❌ Exception in createWorkHistoryItem:", exception)
      throw exception
    }
  }

  async updateWorkHistoryItem(
    id: number,
    itemData: any
  ): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("work_history")
        .update({
          ...itemData
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Error updating work history item:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in updateWorkHistoryItem:", exception)
      return undefined
    }
  }

  async deleteWorkHistoryItem(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("work_history")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("❌ Error deleting work history item:", error)
        return false
      }

      return true
    } catch (exception) {
      console.error("❌ Exception in deleteWorkHistoryItem:", exception)
      return false
    }
  }

  // ============ Education History Operations ============
  async getEducationHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("education_history")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })

      if (error) {
        console.error("❌ Error fetching education history:", error)
        return []
      }

      return data || []
    } catch (exception) {
      console.error("❌ Exception in getEducationHistory:", exception)
      return []
    }
  }

  async getEducationHistoryItem(id: number): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("education_history")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("❌ Error fetching education history item:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in getEducationHistoryItem:", exception)
      return undefined
    }
  }

  async createEducationHistoryItem(userId: string, item: any): Promise<any> {
    try {
      // Map frontend field names to database column names
      const mappedItem = {
        user_id: userId,
        institution: item.institution,
        degree: item.degree,
        field_of_study: item.fieldOfStudy, // Map fieldOfStudy to field_of_study
        start_date: item.startDate, // Map startDate to start_date
        end_date: item.endDate, // Map endDate to end_date
        current_study: item.current, // Map current to current_study
        location: item.location,
        gpa: item.gpa,
        description: item.description,
        achievements: item.achievements
        // Let Supabase handle created_at automatically
      }

      console.log("🔍 Mapped education history item for Supabase:", mappedItem)

      const { data, error } = await supabase
        .from("education_history")
        .insert(mappedItem)
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating education history item:", error)
        throw new Error(
          `Failed to create education history item: ${error.message}`
        )
      }

      console.log("✅ Successfully created education history item:", data)
      return data
    } catch (exception) {
      console.error("❌ Exception in createEducationHistoryItem:", exception)
      throw exception
    }
  }

  async updateEducationHistoryItem(
    id: number,
    itemData: any
  ): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("education_history")
        .update({
          ...itemData
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Error updating education history item:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in updateEducationHistoryItem:", exception)
      return undefined
    }
  }

  async deleteEducationHistoryItem(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("education_history")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("❌ Error deleting education history item:", error)
        return false
      }

      return true
    } catch (exception) {
      console.error("❌ Exception in deleteEducationHistoryItem:", exception)
      return false
    }
  }

  // ============ Resume Operations ============
  async getResumes(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching resumes:", error)
        return []
      }

      return data || []
    } catch (exception) {
      console.error("❌ Exception in getResumes:", exception)
      return []
    }
  }

  async getResumesByUserId(userId: string): Promise<any[]> {
    return this.getResumes(userId)
  }

  async getResume(id: number): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("❌ Error fetching resume:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in getResume:", exception)
      return undefined
    }
  }

  async createResume(userId: string, resume: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          ...resume,
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating resume:", error)
        throw new Error(`Failed to create resume: ${error.message}`)
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in createResume:", exception)
      throw exception
    }
  }

  async updateResume(id: number, resumeData: any): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .update({
          ...resumeData,
          updated_at: new Date()
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Error updating resume:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in updateResume:", exception)
      return undefined
    }
  }

  async deleteResume(id: number): Promise<boolean> {
    try {
      const { error } = await supabase.from("resumes").delete().eq("id", id)

      if (error) {
        console.error("❌ Error deleting resume:", error)
        return false
      }

      return true
    } catch (exception) {
      console.error("❌ Exception in deleteResume:", exception)
      return false
    }
  }

  // ============ Cover Letter Operations ============
  async getCoverLetters(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("cover_letters")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching cover letters:", error)
        return []
      }

      return data || []
    } catch (exception) {
      console.error("❌ Exception in getCoverLetters:", exception)
      return []
    }
  }

  async getCoverLetter(id: number): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("cover_letters")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("❌ Error fetching cover letter:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in getCoverLetter:", exception)
      return undefined
    }
  }

  async createCoverLetter(userId: string, coverLetter: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("cover_letters")
        .insert({
          ...coverLetter,
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating cover letter:", error)
        throw new Error(`Failed to create cover letter: ${error.message}`)
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in createCoverLetter:", exception)
      throw exception
    }
  }

  async updateCoverLetter(
    id: number,
    coverLetterData: any
  ): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("cover_letters")
        .update({
          ...coverLetterData,
          updated_at: new Date()
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Error updating cover letter:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in updateCoverLetter:", exception)
      return undefined
    }
  }

  async deleteCoverLetter(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("cover_letters")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("❌ Error deleting cover letter:", error)
        return false
      }

      return true
    } catch (exception) {
      console.error("❌ Exception in deleteCoverLetter:", exception)
      return false
    }
  }

  // ============ Interview Operations ============
  async getInterviewQuestions(category?: string): Promise<any[]> {
    try {
      let query = supabase.from("interview_questions").select("*")

      if (category) {
        query = query.eq("category", category)
      }

      const { data, error } = await query.order("createdAt", {
        ascending: false
      })

      if (error) {
        console.error("❌ Error fetching interview questions:", error)
        return []
      }

      return data || []
    } catch (exception) {
      console.error("❌ Exception in getInterviewQuestions:", exception)
      return []
    }
  }

  async getInterviewQuestion(id: number): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("interview_questions")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("❌ Error fetching interview question:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in getInterviewQuestion:", exception)
      return undefined
    }
  }

  async createInterviewQuestion(question: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("interview_questions")
        .insert({
          ...question,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating interview question:", error)
        throw new Error(`Failed to create interview question: ${error.message}`)
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in createInterviewQuestion:", exception)
      throw exception
    }
  }

  async saveInterviewPractice(userId: string, practice: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("interview_practice")
        .insert({
          ...practice,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Error saving interview practice:", error)
        throw new Error(`Failed to save interview practice: ${error.message}`)
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in saveInterviewPractice:", exception)
      throw exception
    }
  }

  async getUserInterviewPractice(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("interview_practice")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false })

      if (error) {
        console.error("❌ Error fetching user interview practice:", error)
        return []
      }

      return data || []
    } catch (exception) {
      console.error("❌ Exception in getUserInterviewPractice:", exception)
      return []
    }
  }

  // Insert these methods before the existing getAllActiveUsers method

  async getAllActiveUsers(): Promise<User[]> {
    return []
  }
  async getUserDailyRecommendations(
    userId: string,
    date?: Date
  ): Promise<any[]> {
    // Implementation would go here for daily recommendations
    return []
  }
  async getRecommendation(id: number): Promise<any | undefined> {
    // Implementation would go here for getting specific recommendations
    return undefined
  }
  async completeRecommendation(id: number): Promise<any | undefined> {
    // Implementation would go here for completing recommendations
    return undefined
  }
  async clearTodaysRecommendations(userId: string): Promise<boolean | void> {
    try {
      const today = new Date().toISOString().split("T")[0]
      const { error } = await supabase
        .from("daily_recommendations")
        .delete()
        .eq("user_id", userId)
        .eq("date", today)

      if (error) {
        console.error("Error clearing today's recommendations:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Error clearing today's recommendations:", error)
      return false
    }
  }
  async updateContactInteraction(
    id: number,
    data: any
  ): Promise<any | undefined> {
    return undefined
  }
  async deleteContactInteraction(id: number): Promise<boolean> {
    return true
  }
  async createUserReview(userId: string, reviewData: any): Promise<any> {
    throw new Error("Not implemented")
  }
  async saveCareerPath(
    userId: string,
    name: string,
    pathData: any
  ): Promise<any> {
    throw new Error("Not implemented")
  }
  async getUserCareerPaths(userId: string): Promise<any[]> {
    return []
  }
  async getCareerPath(id: number): Promise<any | undefined> {
    return undefined
  }
  async deleteCareerPath(id: number): Promise<boolean> {
    return true
  }
  async getComponentStatus(): Promise<any[]> {
    return []
  }
  async getRecentAlerts(): Promise<any[]> {
    return []
  }
  async setCachedData(
    key: string,
    data: any,
    expirationMs?: number
  ): Promise<void> {}
  async getCachedData(key: string): Promise<any | null> {
    return null
  }
  async deleteCachedData(key: string): Promise<boolean> {
    return true
  }
  async getUserByStripeSubscriptionId(
    subscriptionId: string
  ): Promise<User | undefined> {
    return undefined
  }
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return undefined
  }
  async getUserByPendingEmailToken(token: string): Promise<User | undefined> {
    return undefined
  }
  async updateUserStripeInfo(
    userId: string,
    stripeInfo: any
  ): Promise<User | undefined> {
    return undefined
  }
  async updateUserVerificationInfo(
    userId: string,
    verificationInfo: any
  ): Promise<User | undefined> {
    return undefined
  }
  async updateUserPassword(
    userId: string,
    newPassword: string
  ): Promise<User | undefined> {
    return undefined
  }
  async updateUserCareerSummary(
    userId: string,
    careerSummary: string
  ): Promise<User | undefined> {
    console.log(`⭐️ Updating career summary for user ${userId}`)
    console.log(
      `📝 Career summary content length: ${careerSummary.length} characters`
    )

    try {
      const result = await this.updateUser(userId, { careerSummary })

      if (!result) {
        console.error("❌ Failed to update career summary - no user returned")
      } else {
        console.log(`✅ Career summary updated successfully for user ${userId}`)
        // Verify the update was applied
        if (result.careerSummary !== careerSummary) {
          console.warn(
            `⚠️ Updated career summary doesn't match input - expected length ${
              careerSummary.length
            }, got ${result.careerSummary?.length || 0}`
          )
        }
      }

      return result
    } catch (error) {
      console.error("❌ Error in updateUserCareerSummary:", error)
      throw error
    }
  }
  async updateUserLinkedInUrl(
    userId: string,
    linkedInUrl: string
  ): Promise<User | undefined> {
    return this.updateUser(userId, { linkedInUrl })
  }
  async addUserXP(
    userId: string,
    amount: number,
    source: string,
    description?: string
  ): Promise<number> {
    return 0
  }
  async getGoals(userId: string): Promise<any[]> {
    return []
  }
  async getGoal(id: number): Promise<any | undefined> {
    return undefined
  }
  async createGoal(userId: string, goal: any): Promise<any> {
    throw new Error("Not implemented")
  }
  async updateGoal(id: number, goalData: any): Promise<any | undefined> {
    return undefined
  }
  async deleteGoal(id: number): Promise<boolean> {
    return true
  }
  async getSkillStackerPlan(id: number): Promise<any | undefined> {
    return undefined
  }
  async getSkillStackerPlanByGoalAndWeek(
    goalId: number,
    week: number
  ): Promise<any | undefined> {
    return undefined
  }
  async getAllSkillStackerPlans(userId: string): Promise<any[]> {
    return []
  }
  async getSkillStackerPlansByGoal(goalId: number): Promise<any[]> {
    return []
  }
  async createSkillStackerPlan(userId: string, plan: any): Promise<any> {
    throw new Error("Not implemented")
  }
  async updateSkillStackerPlan(
    id: number,
    planData: any
  ): Promise<any | undefined> {
    return undefined
  }
  async updateSkillStackerTaskStatus(
    planId: number,
    taskId: string,
    status: any,
    rating?: number
  ): Promise<any | undefined> {
    return undefined
  }
  async completeSkillStackerWeek(planId: number): Promise<any | undefined> {
    return undefined
  }
  async deleteSkillStackerPlan(id: number): Promise<boolean> {
    return true
  }
  async generateDailyRecommendations(userId: string): Promise<any[]> {
    return []
  }

  // ============ Certifications Operations ============
  async getCertifications(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("user_id", userId)
        .order("issue_date", { ascending: false })

      if (error) {
        console.error("❌ Error fetching certifications:", error)
        return []
      }

      return data || []
    } catch (exception) {
      console.error("❌ Exception in getCertifications:", exception)
      return []
    }
  }

  async createCertification(userId: string, certification: any): Promise<any> {
    try {
      console.log("🚀 CERTIFICATION FIX - UNIQUE MARKER 2024-06-06-11:20AM")
      console.log(
        "📝 Raw certification data:",
        JSON.stringify(certification, null, 2)
      )

      // Map frontend field names to database column names and handle required fields
      const mappedItem = {
        user_id: userId,
        name: certification.name || "Unnamed Certification",
        issuing_organization:
          certification.issuer ||
          certification.issuingOrganization ||
          "Unknown Organization", // Handle NOT NULL constraint
        issue_date: certification.issueDate, // Map issueDate to issue_date
        expiration_date: certification.expirationDate, // Map expirationDate to expiration_date
        credential_id: certification.credentialId, // Map credentialId to credential_id
        credential_url: certification.credentialUrl, // Map credentialUrl to credential_url
        description: certification.description
        // Let Supabase handle created_at and updated_at automatically
      }

      console.log("🔍 Mapped certification item for Supabase:", mappedItem)

      const { data, error } = await supabase
        .from("certifications")
        .insert(mappedItem)
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating certification:", error)
        throw new Error(`Failed to create certification: ${error.message}`)
      }

      console.log("✅ Successfully created certification:", data)
      return data
    } catch (exception) {
      console.error("❌ Exception in createCertification:", exception)
      throw exception
    }
  }

  async updateCertification(
    id: number,
    certificationData: any
  ): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("certifications")
        .update({
          ...certificationData,
          updated_at: new Date()
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Error updating certification:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in updateCertification:", exception)
      return undefined
    }
  }

  async deleteCertification(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("certifications")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("❌ Error deleting certification:", error)
        return false
      }

      return true
    } catch (exception) {
      console.error("❌ Exception in deleteCertification:", exception)
      return false
    }
  }

  // ============ Networking Contacts Operations ============
  async getNetworkingContacts(
    userId: string,
    filters?: { query?: string; relationshipType?: string }
  ): Promise<any[]> {
    try {
      console.log(`🔍 Getting networking contacts for user: ${userId}`)

      let query = supabase
        .from("networking_contacts")
        .select("*")
        .eq("user_id", userId)

      // Apply filters if provided
      if (filters?.query) {
        query = query.or(
          `full_name.ilike.%${filters.query}%,company.ilike.%${filters.query}%,email.ilike.%${filters.query}%`
        )
      }

      if (filters?.relationshipType) {
        query = query.eq("relationship_type", filters.relationshipType)
      }

      const { data, error } = await query.order("created_at", {
        ascending: false
      })

      if (error) {
        console.error("❌ Error fetching networking contacts:", error)
        return []
      }

      console.log(
        `✅ Found ${data?.length || 0} networking contacts for user ${userId}`
      )
      return data || []
    } catch (exception) {
      console.error("❌ Exception in getNetworkingContacts:", exception)
      return []
    }
  }

  async getNetworkingContact(id: number): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("networking_contacts")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("❌ Error fetching networking contact:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in getNetworkingContact:", exception)
      return undefined
    }
  }

  async createNetworkingContact(userId: string, contact: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("networking_contacts")
        .insert({
          ...contact,
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating networking contact:", error)
        throw new Error(`Failed to create networking contact: ${error.message}`)
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in createNetworkingContact:", exception)
      throw exception
    }
  }

  async updateNetworkingContact(
    id: number,
    contactData: any
  ): Promise<any | undefined> {
    try {
      const { data, error } = await supabase
        .from("networking_contacts")
        .update({
          ...contactData,
          updated_at: new Date()
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Error updating networking contact:", error)
        return undefined
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in updateNetworkingContact:", exception)
      return undefined
    }
  }

  async deleteNetworkingContact(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("networking_contacts")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("❌ Error deleting networking contact:", error)
        return false
      }

      return true
    } catch (exception) {
      console.error("❌ Exception in deleteNetworkingContact:", exception)
      return false
    }
  }

  // ============ Contact Follow-up Operations ============
  async getContactsNeedingFollowup(userId: string): Promise<any[]> {
    try {
      console.log(`🔍 Getting contacts needing follow-up for user: ${userId}`)

      // Get contacts that have pending follow-ups with due dates
      const { data, error } = await supabase
        .from("networking_contacts")
        .select(
          `
          *,
          followup_actions!inner (
            id,
            title,
            description,
            due_date,
            completed
          )
        `
        )
        .eq("user_id", userId)
        .eq("followup_actions.completed", false)
        .gte("followup_actions.due_date", new Date().toISOString())
        .order("followup_actions.due_date", { ascending: true })

      if (error) {
        console.error("❌ Error fetching contacts needing follow-up:", error)
        return []
      }

      console.log(
        `✅ Found ${
          data?.length || 0
        } contacts needing follow-up for user ${userId}`
      )
      return data || []
    } catch (exception) {
      console.error("❌ Exception in getContactsNeedingFollowup:", exception)
      return []
    }
  }

  async getContactFollowUps(contactId: number): Promise<any[]> {
    try {
      console.log(`🔍 Getting follow-ups for contact: ${contactId}`)

      const { data, error } = await supabase
        .from("followup_actions")
        .select("*")
        .eq("contact_id", contactId)
        .order("due_date", { ascending: true })

      if (error) {
        console.error("❌ Error fetching contact follow-ups:", error)
        return []
      }

      console.log(
        `✅ Found ${data?.length || 0} follow-ups for contact ${contactId}`
      )
      return data || []
    } catch (exception) {
      console.error("❌ Exception in getContactFollowUps:", exception)
      return []
    }
  }

  async createContactFollowUp(
    userId: string,
    contactId: number,
    followUp: any
  ): Promise<any> {
    try {
      console.log(
        `🔍 Creating follow-up for contact ${contactId} by user ${userId}`
      )

      const { data, error } = await supabase
        .from("followup_actions")
        .insert({
          ...followUp,
          user_id: userId,
          contact_id: contactId,
          completed: false,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating contact follow-up:", error)
        throw new Error(`Failed to create contact follow-up: ${error.message}`)
      }

      console.log(`✅ Created follow-up ${data.id} for contact ${contactId}`)
      return data
    } catch (exception) {
      console.error("❌ Exception in createContactFollowUp:", exception)
      throw exception
    }
  }

  async completeContactFollowUp(id: number): Promise<any | undefined> {
    try {
      console.log(`🔍 Completing follow-up: ${id}`)

      const { data, error } = await supabase
        .from("followup_actions")
        .update({
          completed: true,
          completed_at: new Date(),
          updated_at: new Date()
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Error completing contact follow-up:", error)
        return undefined
      }

      console.log(`✅ Completed follow-up ${id}`)
      return data
    } catch (exception) {
      console.error("❌ Exception in completeContactFollowUp:", exception)
      return undefined
    }
  }

  async deleteContactFollowUp(id: number): Promise<boolean> {
    try {
      console.log(`🔍 Deleting follow-up: ${id}`)

      const { error } = await supabase
        .from("followup_actions")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("❌ Error deleting contact follow-up:", error)
        return false
      }

      console.log(`✅ Deleted follow-up ${id}`)
      return true
    } catch (exception) {
      console.error("❌ Exception in deleteContactFollowUp:", exception)
      return false
    }
  }

  // ============ Contact Interactions Operations ============
  async getContactInteractions(contactId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("contact_interactions")
        .select("*")
        .eq("contact_id", contactId)
        .order("interaction_date", { ascending: false })

      if (error) {
        console.error("❌ Error fetching contact interactions:", error)
        return []
      }

      return data || []
    } catch (exception) {
      console.error("❌ Exception in getContactInteractions:", exception)
      return []
    }
  }

  async createContactInteraction(
    userId: string,
    contactId: number,
    interaction: any
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("contact_interactions")
        .insert({
          ...interaction,
          user_id: userId,
          contact_id: contactId,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating contact interaction:", error)
        throw new Error(
          `Failed to create contact interaction: ${error.message}`
        )
      }

      return data
    } catch (exception) {
      console.error("❌ Exception in createContactInteraction:", exception)
      throw exception
    }
  }
}
