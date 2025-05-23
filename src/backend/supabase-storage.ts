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
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
      return undefined
    }

    return data as unknown as User
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
    const { data, error } = await supabase
      .from("users")
      .insert(user)
      .select()
      .single()

    if (error) {
      console.error("Error creating user:", error)
      throw new Error(`Failed to create user: ${error.message}`)
    }

    return data as unknown as User
  }

  async updateUser(
    id: string,
    userData: Partial<User>
  ): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .update(userData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return undefined
    }

    return data as unknown as User
  }

  // ============ Skill Operations ============
  async createSkill(skill: InsertSkill | any): Promise<Skill> {
    const { data, error } = await supabase
      .from("skills")
      .insert(skill)
      .select()
      .single()

    if (error) {
      console.error("Error creating skill:", error)
      throw new Error(`Failed to create skill: ${error.message}`)
    }

    return data as unknown as Skill
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
      .from("skills")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching user skills:", error)
      return []
    }

    return data as unknown as Skill[]
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
      .from("languages")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching user languages:", error)
      return []
    }

    return data as unknown as Language[]
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

  // Stub methods to satisfy the interface - implement as needed
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
    return undefined
  }
  async updateUserLinkedInUrl(
    userId: string,
    linkedInUrl: string
  ): Promise<User | undefined> {
    return undefined
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
}
