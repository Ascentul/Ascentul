import { IStorage } from './storage';
import { supabase, supabaseHelpers, supabaseAdmin } from './supabase';
import session from 'express-session';
import { SessionData } from 'express-session';
import { ENV } from '../config/env';
import {
  User, InsertUser, Skill, InsertSkill, Language, InsertLanguage
} from '../utils/schema';

class SupabaseStore extends session.Store {
  async get(sid: string, callback: (err: any, session?: SessionData | null) => void) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('data')
        .eq('sid', sid)
        .single();
      
      if (error) throw error;
      
      if (!data) {
        return callback(null, null);
      }
      
      callback(null, JSON.parse(data.data));
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, session: SessionData, callback?: (err?: any) => void) {
    try {
      const { error } = await supabase
        .from('sessions')
        .upsert({ 
          sid, 
          data: JSON.stringify(session),
          expires: new Date(Date.now() + (session.cookie.maxAge || 86400000))
        });
      
      if (error) throw error;
      
      if (callback) callback();
    } catch (err) {
      if (callback) callback(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('sid', sid);
      
      if (error) throw error;
      
      if (callback) callback();
    } catch (err) {
      if (callback) callback(err);
    }
  }
}

export class SupabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new SupabaseStore();
  }

  // ============ User Operations ============
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
    
    return data as unknown as User;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
    
    return data as unknown as User;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
    
    return data as unknown as User;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
    
    return data as unknown as User;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
    
    return data as unknown as User;
  }

  // ============ Skill Operations ============
  async createSkill(skill: InsertSkill | any): Promise<Skill> {
    const { data, error } = await supabase
      .from('skills')
      .insert(skill)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating skill:', error);
      throw new Error(`Failed to create skill: ${error.message}`);
    }
    
    return data as unknown as Skill;
  }
  
  async updateSkill(id: number, data: Partial<Skill>): Promise<Skill | undefined> {
    const { data: updatedSkill, error } = await supabase
      .from('skills')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating skill:', error);
      return undefined;
    }
    
    return updatedSkill as unknown as Skill;
  }
  
  async deleteSkill(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting skill:', error);
      return false;
    }
    
    return true;
  }
  
  async getUserSkills(userId: number): Promise<Skill[]> {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user skills:', error);
      return [];
    }
    
    return data as unknown as Skill[];
  }
  
  async getSkill(id: number): Promise<Skill | undefined> {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching skill:', error);
      return undefined;
    }
    
    return data as unknown as Skill;
  }

  // ============ Language Operations ============
  async createLanguage(language: InsertLanguage | any): Promise<Language> {
    const { data, error } = await supabase
      .from('languages')
      .insert(language)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating language:', error);
      throw new Error(`Failed to create language: ${error.message}`);
    }
    
    return data as unknown as Language;
  }
  
  async updateLanguage(id: number, data: Partial<Language>): Promise<Language | undefined> {
    const { data: updatedLanguage, error } = await supabase
      .from('languages')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating language:', error);
      return undefined;
    }
    
    return updatedLanguage as unknown as Language;
  }
  
  async deleteLanguage(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('languages')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting language:', error);
      return false;
    }
    
    return true;
  }
  
  async getUserLanguages(userId: number): Promise<Language[]> {
    const { data, error } = await supabase
      .from('languages')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user languages:', error);
      return [];
    }
    
    return data as unknown as Language[];
  }
  
  async getLanguage(id: number): Promise<Language | undefined> {
    const { data, error } = await supabase
      .from('languages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching language:', error);
      return undefined;
    }
    
    return data as unknown as Language;
  }
  
  // ============ System Operations ============
  async getSystemMetrics(): Promise<{
    status: string;
    uptime: number;
    lastIncident: string;
    lastChecked: string;
  }> {
    return {
      status: 'operational',
      uptime: 99.9,
      lastIncident: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastChecked: new Date().toISOString(),
    };
  }

  // Implement other methods as needed for your application
  // This is a minimal implementation focused on skills and languages

  // Helper method to check database connection
  async testDatabaseConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact' });
      return !error;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Stub methods to satisfy the interface - implement as needed
  async getAllActiveUsers(): Promise<User[]> { return []; }
  async getUserDailyRecommendations(userId: number, date?: Date): Promise<any[]> { return []; }
  async getRecommendation(id: number): Promise<any | undefined> { return undefined; }
  async completeRecommendation(id: number): Promise<any | undefined> { return undefined; }
  async clearTodaysRecommendations(userId: number): Promise<boolean | void> {
    try {
      // Find and delete today's recommendations using Supabase
      console.log(`Clearing today's recommendations for user ${userId}`);
      
      // When implemented properly, we'd delete any records for today
      // For now, just stub returning true for the boolean version
      return true;
    } catch (error) {
      console.error(`Error clearing recommendations for user ${userId}:`, error);
      return false;
    }
  }
  async updateContactInteraction(id: number, data: any): Promise<any | undefined> { return undefined; }
  async deleteContactInteraction(id: number): Promise<boolean> { return true; }
  async createUserReview(userId: number, reviewData: any): Promise<any> { throw new Error('Not implemented'); }
  async saveCareerPath(userId: number, name: string, pathData: any): Promise<any> { throw new Error('Not implemented'); }
  async getUserCareerPaths(userId: number): Promise<any[]> { return []; }
  async getCareerPath(id: number): Promise<any | undefined> { return undefined; }
  async deleteCareerPath(id: number): Promise<boolean> { return true; }
  async getComponentStatus(): Promise<any[]> { return []; }
  async getRecentAlerts(): Promise<any[]> { return []; }
  async setCachedData(key: string, data: any, expirationMs?: number): Promise<void> {}
  async getCachedData(key: string): Promise<any | null> { return null; }
  async deleteCachedData(key: string): Promise<boolean> { return true; }
  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> { return undefined; }
  async getUserByVerificationToken(token: string): Promise<User | undefined> { return undefined; }
  async getUserByPendingEmailToken(token: string): Promise<User | undefined> { return undefined; }
  async updateUserStripeInfo(userId: number, stripeInfo: any): Promise<User | undefined> { return undefined; }
  async updateUserVerificationInfo(userId: number, verificationInfo: any): Promise<User | undefined> { return undefined; }
  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> { return undefined; }
  async updateUserCareerSummary(userId: number, careerSummary: string): Promise<User | undefined> { return undefined; }
  async updateUserLinkedInUrl(userId: number, linkedInUrl: string): Promise<User | undefined> { return undefined; }
  async addUserXP(userId: number, amount: number, source: string, description?: string): Promise<number> { return 0; }
  async getGoals(userId: number): Promise<any[]> { return []; }
  async getGoal(id: number): Promise<any | undefined> { return undefined; }
  async createGoal(userId: number, goal: any): Promise<any> { throw new Error('Not implemented'); }
  async updateGoal(id: number, goalData: any): Promise<any | undefined> { return undefined; }
  async deleteGoal(id: number): Promise<boolean> { return true; }
  async getSkillStackerPlan(id: number): Promise<any | undefined> { return undefined; }
  async getSkillStackerPlanByGoalAndWeek(goalId: number, week: number): Promise<any | undefined> { return undefined; }
  async getAllSkillStackerPlans(userId: number): Promise<any[]> { return []; }
  async getSkillStackerPlansByGoal(goalId: number): Promise<any[]> { return []; }
  async createSkillStackerPlan(userId: number, plan: any): Promise<any> { throw new Error('Not implemented'); }
  async updateSkillStackerPlan(id: number, planData: any): Promise<any | undefined> { return undefined; }
  async updateSkillStackerTaskStatus(planId: number, taskId: string, status: any, rating?: number): Promise<any | undefined> { return undefined; }
  async completeSkillStackerWeek(planId: number): Promise<any | undefined> { return undefined; }
  async deleteSkillStackerPlan(id: number): Promise<boolean> { return true; }
  async generateDailyRecommendations(userId: number): Promise<any[]> { return []; }
} 