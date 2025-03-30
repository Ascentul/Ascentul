import {
  users,
  type User,
  type InsertUser,
  goals,
  type Goal,
  type InsertGoal,
  workHistory,
  type WorkHistory,
  type InsertWorkHistory,
  resumes,
  type Resume,
  type InsertResume,
  coverLetters,
  type CoverLetter,
  type InsertCoverLetter,
  interviewQuestions,
  type InterviewQuestion,
  type InsertInterviewQuestion,
  interviewPractice,
  type InterviewPractice,
  type InsertInterviewPractice,
  achievements,
  type Achievement,
  type InsertAchievement,
  userAchievements,
  type UserAchievement,
  type InsertUserAchievement,
  aiCoachConversations,
  type AiCoachConversation,
  type InsertAiCoachConversation,
  aiCoachMessages,
  type AiCoachMessage,
  type InsertAiCoachMessage,
  xpHistory,
  type XpHistory,
  type InsertXpHistory,
  interviewProcesses,
  type InterviewProcess,
  type InsertInterviewProcess,
  interviewStages,
  type InterviewStage,
  type InsertInterviewStage,
  followupActions,
  type FollowupAction,
  type InsertFollowupAction
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPendingEmailToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserStripeInfo(userId: number, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: 'active' | 'inactive' | 'cancelled' | 'past_due';
    subscriptionPlan?: 'free' | 'premium' | 'university';
    subscriptionExpiresAt?: Date;
  }): Promise<User | undefined>;
  updateUserVerificationInfo(userId: number, verificationInfo: {
    emailVerified?: boolean;
    verificationToken?: string | null;
    verificationExpires?: Date | null;
  }): Promise<User | undefined>;
  addUserXP(userId: number, amount: number, source: string, description?: string): Promise<number>;
  
  // Goal operations
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(userId: number, goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Work history operations
  getWorkHistory(userId: number): Promise<WorkHistory[]>;
  getWorkHistoryItem(id: number): Promise<WorkHistory | undefined>;
  createWorkHistoryItem(userId: number, item: InsertWorkHistory): Promise<WorkHistory>;
  updateWorkHistoryItem(id: number, itemData: Partial<WorkHistory>): Promise<WorkHistory | undefined>;
  deleteWorkHistoryItem(id: number): Promise<boolean>;
  
  // Resume operations
  getResumes(userId: number): Promise<Resume[]>;
  getResume(id: number): Promise<Resume | undefined>;
  createResume(userId: number, resume: InsertResume): Promise<Resume>;
  updateResume(id: number, resumeData: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;
  
  // Cover letter operations
  getCoverLetters(userId: number): Promise<CoverLetter[]>;
  getCoverLetter(id: number): Promise<CoverLetter | undefined>;
  createCoverLetter(userId: number, coverLetter: InsertCoverLetter): Promise<CoverLetter>;
  updateCoverLetter(id: number, coverLetterData: Partial<CoverLetter>): Promise<CoverLetter | undefined>;
  deleteCoverLetter(id: number): Promise<boolean>;
  
  // Interview operations
  getInterviewQuestions(category?: string): Promise<InterviewQuestion[]>;
  getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined>;
  createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion>;
  saveInterviewPractice(userId: number, practice: InsertInterviewPractice): Promise<InterviewPractice>;
  getUserInterviewPractice(userId: number): Promise<InterviewPractice[]>;
  
  // Interview Process Tracking operations
  getInterviewProcesses(userId: number): Promise<InterviewProcess[]>;
  getInterviewProcess(id: number): Promise<InterviewProcess | undefined>;
  createInterviewProcess(userId: number, process: InsertInterviewProcess): Promise<InterviewProcess>;
  updateInterviewProcess(id: number, processData: Partial<InterviewProcess>): Promise<InterviewProcess | undefined>;
  deleteInterviewProcess(id: number): Promise<boolean>;
  
  // Interview Stage operations
  getInterviewStages(processId: number): Promise<InterviewStage[]>;
  getInterviewStage(id: number): Promise<InterviewStage | undefined>;
  createInterviewStage(processId: number, stage: InsertInterviewStage): Promise<InterviewStage>;
  updateInterviewStage(id: number, stageData: Partial<InterviewStage>): Promise<InterviewStage | undefined>;
  deleteInterviewStage(id: number): Promise<boolean>;
  
  // Followup Action operations
  getFollowupActions(processId: number, stageId?: number): Promise<FollowupAction[]>;
  getFollowupAction(id: number): Promise<FollowupAction | undefined>;
  createFollowupAction(processId: number, action: InsertFollowupAction): Promise<FollowupAction>;
  updateFollowupAction(id: number, actionData: Partial<FollowupAction>): Promise<FollowupAction | undefined>;
  deleteFollowupAction(id: number): Promise<boolean>;
  completeFollowupAction(id: number): Promise<FollowupAction | undefined>;
  
  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(Achievement & { earnedAt: Date })[]>;
  checkAndAwardAchievements(userId: number): Promise<Achievement[]>;
  
  // AI Coach operations
  getAiCoachConversations(userId: number): Promise<AiCoachConversation[]>;
  getAiCoachConversation(id: number): Promise<AiCoachConversation | undefined>;
  createAiCoachConversation(userId: number, conversation: InsertAiCoachConversation): Promise<AiCoachConversation>;
  getAiCoachMessages(conversationId: number): Promise<AiCoachMessage[]>;
  addAiCoachMessage(message: InsertAiCoachMessage): Promise<AiCoachMessage>;
  
  // XP History operations
  getXpHistory(userId: number): Promise<XpHistory[]>;
  
  // Stats operations
  getUserStatistics(userId: number): Promise<{
    activeGoals: number;
    achievementsCount: number;
    resumesCount: number;
    pendingTasks: number;
    monthlyXp: { month: string; xp: number }[];
  }>;
  
  // Subscription and verification operations
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: number, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: 'active' | 'inactive' | 'cancelled' | 'past_due';
    subscriptionPlan?: 'free' | 'premium' | 'university';
    subscriptionExpiresAt?: Date;
  }): Promise<User | undefined>;
  updateUserVerificationInfo(userId: number, verificationInfo: {
    emailVerified?: boolean;
    verificationToken?: string | null;
    verificationExpires?: Date | null;
  }): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private goals: Map<number, Goal>;
  private workHistory: Map<number, WorkHistory>;
  private resumes: Map<number, Resume>;
  private coverLetters: Map<number, CoverLetter>;
  private interviewQuestions: Map<number, InterviewQuestion>;
  private interviewPractice: Map<number, InterviewPractice>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  private aiCoachConversations: Map<number, AiCoachConversation>;
  private aiCoachMessages: Map<number, AiCoachMessage>;
  private xpHistory: Map<number, XpHistory>;
  private interviewProcesses: Map<number, InterviewProcess>;
  private interviewStages: Map<number, InterviewStage>;
  private followupActions: Map<number, FollowupAction>;
  
  private userIdCounter: number;
  private goalIdCounter: number;
  private workHistoryIdCounter: number;
  private resumeIdCounter: number;
  private coverLetterIdCounter: number;
  private interviewQuestionIdCounter: number;
  private interviewPracticeIdCounter: number;
  private achievementIdCounter: number;
  private userAchievementIdCounter: number;
  private aiCoachConversationIdCounter: number;
  private aiCoachMessageIdCounter: number;
  private xpHistoryIdCounter: number;
  private interviewProcessIdCounter: number;
  private interviewStageIdCounter: number;
  private followupActionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.goals = new Map();
    this.workHistory = new Map();
    this.resumes = new Map();
    this.coverLetters = new Map();
    this.interviewQuestions = new Map();
    this.interviewPractice = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.aiCoachConversations = new Map();
    this.aiCoachMessages = new Map();
    this.xpHistory = new Map();
    this.interviewProcesses = new Map();
    this.interviewStages = new Map();
    this.followupActions = new Map();
    
    this.userIdCounter = 1;
    this.goalIdCounter = 1;
    this.workHistoryIdCounter = 1;
    this.resumeIdCounter = 1;
    this.coverLetterIdCounter = 1;
    this.interviewQuestionIdCounter = 1;
    this.interviewPracticeIdCounter = 1;
    this.achievementIdCounter = 1;
    this.userAchievementIdCounter = 1;
    this.aiCoachConversationIdCounter = 1;
    this.aiCoachMessageIdCounter = 1;
    this.xpHistoryIdCounter = 1;
    this.interviewProcessIdCounter = 1;
    this.interviewStageIdCounter = 1;
    this.followupActionIdCounter = 1;
    
    // Initialize with sample data for testing
    this.initializeData();
  }
  
  private initializeData() {
    // Sample interview process data for testing
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Initialize sample achievements
    const sampleAchievements: InsertAchievement[] = [
      {
        name: "First Resume",
        description: "Created your first resume",
        icon: "rocket",
        xpReward: 100,
        requiredAction: "resumes_created",
        requiredValue: 1
      },
      {
        name: "Goal Setter",
        description: "Set 5 career goals",
        icon: "bullseye",
        xpReward: 150,
        requiredAction: "goals_created",
        requiredValue: 5
      },
      {
        name: "Skill Builder",
        description: "Added 10+ skills",
        icon: "graduation-cap",
        xpReward: 200,
        requiredAction: "skills_added",
        requiredValue: 10
      },
      {
        name: "Job Master",
        description: "Apply to 10 jobs",
        icon: "briefcase",
        xpReward: 300,
        requiredAction: "jobs_applied",
        requiredValue: 10
      }
    ];
    
    sampleAchievements.forEach(achievement => {
      this.achievements.set(this.achievementIdCounter, {
        ...achievement,
        id: this.achievementIdCounter++
      });
    });
    
    // Create a sample interview process
    const sampleProcess: InterviewProcess = {
      id: this.interviewProcessIdCounter++,
      userId: 1, // For the sample user (alex)
      position: "Senior Software Engineer",
      companyName: "TechCorp Inc.",
      jobDescription: "Senior role focused on full-stack development with React and Node.js",
      contactName: "Jane Recruiter",
      contactEmail: "jane@techcorp.example",
      contactPhone: "+1-555-123-4567",
      notes: "Initial screening was positive. Team seems collaborative and focused on product quality.",
      status: "in_progress",
      createdAt: twoDaysAgo,
      updatedAt: now
    };
    this.interviewProcesses.set(sampleProcess.id, sampleProcess);
    
    // Create sample interview stages
    const phoneScreening: InterviewStage = {
      id: this.interviewStageIdCounter++,
      processId: sampleProcess.id,
      type: "Phone Screening",
      location: "Phone call",
      scheduledDate: twoDaysAgo,
      completedDate: twoDaysAgo,
      interviewers: ["Jane Recruiter", "John HR"],
      feedback: "Positive initial conversation. Technical background is strong. Moving to technical assessment.",
      outcome: "passed",
      notes: "Asked about team structure and development process.",
      nextSteps: "Technical assessment to be scheduled",
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo
    };
    this.interviewStages.set(phoneScreening.id, phoneScreening);
    
    const technicalAssessment: InterviewStage = {
      id: this.interviewStageIdCounter++,
      processId: sampleProcess.id,
      type: "Technical Assessment",
      location: "Online coding platform",
      scheduledDate: now,
      completedDate: now,
      interviewers: ["Senior Developer"],
      feedback: "Completed coding task efficiently. Good approach to problem-solving. Clean code.",
      outcome: "passed",
      notes: "Completed a task building a React component with data fetching.",
      nextSteps: "Technical interview with team lead",
      createdAt: now,
      updatedAt: now
    };
    this.interviewStages.set(technicalAssessment.id, technicalAssessment);
    
    const technicalInterview: InterviewStage = {
      id: this.interviewStageIdCounter++,
      processId: sampleProcess.id,
      type: "Technical Interview",
      location: "Video call",
      scheduledDate: tomorrow,
      completedDate: null,
      interviewers: ["Team Lead", "Senior Architect"],
      feedback: null,
      outcome: null,
      notes: "Will focus on system design and architecture discussions.",
      nextSteps: null,
      createdAt: now,
      updatedAt: now
    };
    this.interviewStages.set(technicalInterview.id, technicalInterview);
    
    // Create sample followup actions
    const thankYouEmail: FollowupAction = {
      id: this.followupActionIdCounter++,
      processId: sampleProcess.id,
      stageId: phoneScreening.id,
      type: "Thank You Email",
      description: "Send a thank you email to Jane for the phone screening",
      dueDate: new Date(twoDaysAgo.getTime() + 24 * 60 * 60 * 1000),
      notes: "Mention interest in the collaborative culture",
      completed: true,
      completedDate: new Date(twoDaysAgo.getTime() + 22 * 60 * 60 * 1000),
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo
    };
    this.followupActions.set(thankYouEmail.id, thankYouEmail);
    
    const prepareQuestions: FollowupAction = {
      id: this.followupActionIdCounter++,
      processId: sampleProcess.id,
      stageId: technicalInterview.id,
      type: "Prepare Questions",
      description: "Prepare questions about the tech stack and team structure",
      dueDate: tomorrow,
      notes: "Research company products thoroughly",
      completed: false,
      completedDate: null,
      createdAt: now,
      updatedAt: now
    };
    this.followupActions.set(prepareQuestions.id, prepareQuestions);
    
    const reviewTechnology: FollowupAction = {
      id: this.followupActionIdCounter++,
      processId: sampleProcess.id,
      stageId: technicalInterview.id,
      type: "Review Technology",
      description: "Brush up on system design patterns and React optimization techniques",
      dueDate: tomorrow,
      notes: "Focus on recent projects for examples",
      completed: false,
      completedDate: null,
      createdAt: now,
      updatedAt: now
    };
    this.followupActions.set(reviewTechnology.id, reviewTechnology);
    
    // Initialize sample interview questions
    const sampleQuestions: InsertInterviewQuestion[] = [
      {
        category: "behavioral",
        question: "Tell me about a challenging project you worked on.",
        suggestedAnswer: "Use the STAR method to describe a specific challenging project, focusing on your role, the actions you took, and the positive outcome achieved.",
        difficultyLevel: 2
      },
      {
        category: "technical",
        question: "How do you approach debugging a complex issue?",
        suggestedAnswer: "Describe your systematic approach: reproduce the issue, isolate variables, use debugging tools, collaborate when needed, and document the solution.",
        difficultyLevel: 3
      },
      {
        category: "behavioral",
        question: "How do you handle disagreements with team members?",
        suggestedAnswer: "Emphasize active listening, seeking to understand different perspectives, finding common ground, and focusing on the best solution for the project rather than personal preferences.",
        difficultyLevel: 2
      },
      {
        category: "technical",
        question: "Explain your experience with a specific technology relevant to this role.",
        suggestedAnswer: "Describe your hands-on experience with the technology, specific projects where you've applied it, challenges you've overcome, and how you stay updated with its developments.",
        difficultyLevel: 3
      },
      {
        category: "behavioral",
        question: "Where do you see yourself in 5 years?",
        suggestedAnswer: "Focus on professional growth, skills you want to develop, and how you aim to contribute to the company's success. Show ambition while being realistic.",
        difficultyLevel: 1
      }
    ];
    
    sampleQuestions.forEach(question => {
      this.interviewQuestions.set(this.interviewQuestionIdCounter, {
        ...question,
        id: this.interviewQuestionIdCounter++
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      xp: 0, 
      level: 1, 
      rank: "Career Explorer", 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async addUserXP(userId: number, amount: number, source: string, description?: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Add XP history record
    const xpHistoryId = this.xpHistoryIdCounter++;
    const xpRecord: XpHistory = {
      id: xpHistoryId,
      userId,
      amount,
      source,
      description,
      earnedAt: new Date()
    };
    this.xpHistory.set(xpHistoryId, xpRecord);
    
    // Update user XP
    const newXp = user.xp + amount;
    
    // Check for level up (simple level calculation - can be refined)
    let newLevel = user.level;
    let newRank = user.rank;
    
    // Level up logic: 1000 XP per level
    const calculatedLevel = Math.floor(newXp / 1000) + 1;
    
    if (calculatedLevel > user.level) {
      newLevel = calculatedLevel;
      
      // Update rank based on level
      if (newLevel >= 15) newRank = "Career Master";
      else if (newLevel >= 10) newRank = "Career Navigator";
      else if (newLevel >= 5) newRank = "Career Adventurer";
      else newRank = "Career Explorer";
    }
    
    await this.updateUser(userId, { xp: newXp, level: newLevel, rank: newRank });
    
    // Check and award achievements
    await this.checkAndAwardAchievements(userId);
    
    return newXp;
  }
  
  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(userId: number, goalData: InsertGoal): Promise<Goal> {
    const id = this.goalIdCounter++;
    const now = new Date();
    const goal: Goal = {
      ...goalData,
      id,
      userId,
      progress: 0,
      completed: false,
      completedAt: null,
      createdAt: now
    };
    this.goals.set(id, goal);
    
    // Award XP for creating a goal
    await this.addUserXP(userId, 50, "goals_created", "Created a new career goal");
    
    return goal;
  }

  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    // Check if the goal is being completed
    const completingGoal = !goal.completed && goalData.completed === true;
    
    const updatedGoal = { ...goal, ...goalData };
    
    // If completing the goal, set completedAt
    if (completingGoal) {
      updatedGoal.completedAt = new Date();
      updatedGoal.progress = 100;
      
      // Award XP for completing a goal
      await this.addUserXP(goal.userId, goal.xpReward, "goals_completed", `Completed goal: ${goal.title}`);
    }
    
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }
  
  // Work history operations
  async getWorkHistory(userId: number): Promise<WorkHistory[]> {
    return Array.from(this.workHistory.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  async getWorkHistoryItem(id: number): Promise<WorkHistory | undefined> {
    return this.workHistory.get(id);
  }

  async createWorkHistoryItem(userId: number, item: InsertWorkHistory): Promise<WorkHistory> {
    const id = this.workHistoryIdCounter++;
    const now = new Date();
    const workHistoryItem: WorkHistory = {
      ...item,
      id,
      userId,
      createdAt: now
    };
    this.workHistory.set(id, workHistoryItem);
    
    // Award XP for adding work history
    await this.addUserXP(userId, 75, "work_history_added", "Added work experience");
    
    return workHistoryItem;
  }

  async updateWorkHistoryItem(id: number, itemData: Partial<WorkHistory>): Promise<WorkHistory | undefined> {
    const item = this.workHistory.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.workHistory.set(id, updatedItem);
    return updatedItem;
  }

  async deleteWorkHistoryItem(id: number): Promise<boolean> {
    return this.workHistory.delete(id);
  }
  
  // Resume operations
  async getResumes(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values())
      .filter(resume => resume.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async createResume(userId: number, resumeData: InsertResume): Promise<Resume> {
    const id = this.resumeIdCounter++;
    const now = new Date();
    const resume: Resume = {
      ...resumeData,
      id,
      userId,
      createdAt: now,
      updatedAt: now
    };
    this.resumes.set(id, resume);
    
    // Check if this is the first resume for the user
    const userResumes = await this.getResumes(userId);
    if (userResumes.length === 1) {
      // Award XP for creating first resume
      await this.addUserXP(userId, 100, "first_resume", "Created your first resume");
    } else {
      // Award XP for creating additional resume
      await this.addUserXP(userId, 50, "resume_created", "Created a new resume");
    }
    
    return resume;
  }

  async updateResume(id: number, resumeData: Partial<Resume>): Promise<Resume | undefined> {
    const resume = this.resumes.get(id);
    if (!resume) return undefined;
    
    const updatedResume = { 
      ...resume, 
      ...resumeData,
      updatedAt: new Date() 
    };
    this.resumes.set(id, updatedResume);
    return updatedResume;
  }

  async deleteResume(id: number): Promise<boolean> {
    return this.resumes.delete(id);
  }
  
  // Cover letter operations
  async getCoverLetters(userId: number): Promise<CoverLetter[]> {
    return Array.from(this.coverLetters.values())
      .filter(letter => letter.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getCoverLetter(id: number): Promise<CoverLetter | undefined> {
    return this.coverLetters.get(id);
  }

  async createCoverLetter(userId: number, letterData: InsertCoverLetter): Promise<CoverLetter> {
    const id = this.coverLetterIdCounter++;
    const now = new Date();
    const coverLetter: CoverLetter = {
      ...letterData,
      id,
      userId,
      createdAt: now,
      updatedAt: now
    };
    this.coverLetters.set(id, coverLetter);
    
    // Award XP for creating a cover letter
    await this.addUserXP(userId, 75, "cover_letter_created", "Created a new cover letter");
    
    return coverLetter;
  }

  async updateCoverLetter(id: number, letterData: Partial<CoverLetter>): Promise<CoverLetter | undefined> {
    const letter = this.coverLetters.get(id);
    if (!letter) return undefined;
    
    const updatedLetter = { 
      ...letter, 
      ...letterData,
      updatedAt: new Date() 
    };
    this.coverLetters.set(id, updatedLetter);
    return updatedLetter;
  }

  async deleteCoverLetter(id: number): Promise<boolean> {
    return this.coverLetters.delete(id);
  }
  
  // Interview operations
  async getInterviewQuestions(category?: string): Promise<InterviewQuestion[]> {
    const questions = Array.from(this.interviewQuestions.values());
    if (category) {
      return questions.filter(q => q.category === category);
    }
    return questions;
  }

  async getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined> {
    return this.interviewQuestions.get(id);
  }

  async createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion> {
    const id = this.interviewQuestionIdCounter++;
    const interviewQuestion: InterviewQuestion = {
      ...question,
      id
    };
    this.interviewQuestions.set(id, interviewQuestion);
    return interviewQuestion;
  }

  async saveInterviewPractice(userId: number, practice: InsertInterviewPractice): Promise<InterviewPractice> {
    const id = this.interviewPracticeIdCounter++;
    const now = new Date();
    const interviewPractice: InterviewPractice = {
      ...practice,
      id,
      userId,
      practiceDate: now
    };
    this.interviewPractice.set(id, interviewPractice);
    
    // Award XP for practicing interview questions
    await this.addUserXP(userId, 25, "interview_practice", "Practiced an interview question");
    
    return interviewPractice;
  }

  async getUserInterviewPractice(userId: number): Promise<InterviewPractice[]> {
    return Array.from(this.interviewPractice.values())
      .filter(practice => practice.userId === userId)
      .sort((a, b) => new Date(b.practiceDate).getTime() - new Date(a.practiceDate).getTime());
  }
  
  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async getUserAchievements(userId: number): Promise<(Achievement & { earnedAt: Date })[]> {
    const userAchievementRecords = Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId);
    
    return userAchievementRecords.map(record => {
      const achievement = this.achievements.get(record.achievementId);
      return {
        ...achievement!,
        earnedAt: record.earnedAt
      };
    });
  }

  async checkAndAwardAchievements(userId: number): Promise<Achievement[]> {
    const allAchievements = await this.getAchievements();
    const userAchievements = await this.getUserAchievements(userId);
    const earnedAchievementIds = userAchievements.map(a => a.id);
    const newlyEarnedAchievements: Achievement[] = [];
    
    // Check each achievement that hasn't been earned yet
    for (const achievement of allAchievements) {
      if (earnedAchievementIds.includes(achievement.id)) continue;
      
      // Check if user meets the requirements
      let meetsRequirements = false;
      
      switch (achievement.requiredAction) {
        case "resumes_created":
          const resumes = await this.getResumes(userId);
          meetsRequirements = resumes.length >= achievement.requiredValue;
          break;
        case "goals_created":
          const goals = await this.getGoals(userId);
          meetsRequirements = goals.length >= achievement.requiredValue;
          break;
        case "goals_completed":
          const completedGoals = (await this.getGoals(userId)).filter(g => g.completed);
          meetsRequirements = completedGoals.length >= achievement.requiredValue;
          break;
        // Add more achievement checks as needed
      }
      
      if (meetsRequirements) {
        // Award the achievement
        const userAchievementId = this.userAchievementIdCounter++;
        const now = new Date();
        const userAchievement: UserAchievement = {
          id: userAchievementId,
          userId,
          achievementId: achievement.id,
          earnedAt: now
        };
        this.userAchievements.set(userAchievementId, userAchievement);
        
        // Award XP for earning an achievement
        await this.addUserXP(userId, achievement.xpReward, "achievement_earned", `Earned achievement: ${achievement.name}`);
        
        newlyEarnedAchievements.push(achievement);
      }
    }
    
    return newlyEarnedAchievements;
  }
  
  // AI Coach operations
  async getAiCoachConversations(userId: number): Promise<AiCoachConversation[]> {
    return Array.from(this.aiCoachConversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAiCoachConversation(id: number): Promise<AiCoachConversation | undefined> {
    return this.aiCoachConversations.get(id);
  }

  async createAiCoachConversation(userId: number, conversation: InsertAiCoachConversation): Promise<AiCoachConversation> {
    const id = this.aiCoachConversationIdCounter++;
    const now = new Date();
    const aiCoachConversation: AiCoachConversation = {
      ...conversation,
      id,
      userId,
      createdAt: now
    };
    this.aiCoachConversations.set(id, aiCoachConversation);
    return aiCoachConversation;
  }

  async getAiCoachMessages(conversationId: number): Promise<AiCoachMessage[]> {
    return Array.from(this.aiCoachMessages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async addAiCoachMessage(message: InsertAiCoachMessage): Promise<AiCoachMessage> {
    const id = this.aiCoachMessageIdCounter++;
    const now = new Date();
    const aiCoachMessage: AiCoachMessage = {
      ...message,
      id,
      timestamp: now
    };
    this.aiCoachMessages.set(id, aiCoachMessage);
    
    // If it's a user message, add a small XP reward
    if (message.isUser) {
      const conversation = await this.getAiCoachConversation(message.conversationId);
      if (conversation) {
        await this.addUserXP(conversation.userId, 10, "ai_coach_interaction", "Interacted with AI Coach");
      }
    }
    
    return aiCoachMessage;
  }
  
  // XP History operations
  async getXpHistory(userId: number): Promise<XpHistory[]> {
    return Array.from(this.xpHistory.values())
      .filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
  }
  
  // Stats operations
  async getUserStatistics(userId: number): Promise<{
    activeGoals: number;
    achievementsCount: number;
    resumesCount: number;
    pendingTasks: number;
    monthlyXp: { month: string; xp: number }[];
  }> {
    const goals = await this.getGoals(userId);
    const activeGoals = goals.filter(g => !g.completed).length;
    
    const achievements = await this.getUserAchievements(userId);
    const achievementsCount = achievements.length;
    
    const resumes = await this.getResumes(userId);
    const resumesCount = resumes.length;
    
    // Count pending tasks (active goals with due date in the next week)
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);
    
    const pendingTasks = goals.filter(g => {
      if (g.completed) return false;
      if (!g.dueDate) return false;
      const dueDate = new Date(g.dueDate);
      return dueDate <= oneWeekFromNow;
    }).length;
    
    // Calculate monthly XP for the past 6 months
    const xpHistory = await this.getXpHistory(userId);
    const monthlyXp: { [key: string]: number } = {};
    
    // Get the month names for the past 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      months.push(monthName);
      monthlyXp[monthName] = 0;
    }
    
    // Calculate XP for each month
    xpHistory.forEach(record => {
      const recordMonth = new Date(record.earnedAt).toLocaleString('default', { month: 'short' });
      if (months.includes(recordMonth)) {
        monthlyXp[recordMonth] = (monthlyXp[recordMonth] || 0) + record.amount;
      }
    });
    
    // Convert to array format
    const monthlyXpArray = months.map(month => ({
      month,
      xp: monthlyXp[month] || 0
    }));
    
    return {
      activeGoals,
      achievementsCount,
      resumesCount,
      pendingTasks,
      monthlyXp: monthlyXpArray
    };
  }
  // Interview Process Tracking operations
  async getInterviewProcesses(userId: number): Promise<InterviewProcess[]> {
    return Array.from(this.interviewProcesses.values())
      .filter(process => process.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getInterviewProcess(id: number): Promise<InterviewProcess | undefined> {
    return this.interviewProcesses.get(id);
  }

  async createInterviewProcess(userId: number, processData: InsertInterviewProcess): Promise<InterviewProcess> {
    const id = this.interviewProcessIdCounter++;
    const now = new Date();
    const interviewProcess: InterviewProcess = {
      ...processData,
      id,
      userId,
      status: processData.status || "applied",
      createdAt: now,
      updatedAt: now
    };
    this.interviewProcesses.set(id, interviewProcess);
    
    // Award XP for creating a new interview process
    await this.addUserXP(userId, 50, "interview_process_created", "Started tracking a new interview process");
    
    return interviewProcess;
  }

  async updateInterviewProcess(id: number, processData: Partial<InterviewProcess>): Promise<InterviewProcess | undefined> {
    const process = this.interviewProcesses.get(id);
    if (!process) return undefined;
    
    const now = new Date();
    const updatedProcess = { 
      ...process, 
      ...processData,
      updatedAt: now 
    };
    this.interviewProcesses.set(id, updatedProcess);
    
    // Award XP for updating job status if status changed
    if (processData.status && processData.status !== process.status) {
      await this.addUserXP(process.userId, 25, "interview_status_updated", `Updated job status to ${processData.status}`);
    }
    
    return updatedProcess;
  }

  async deleteInterviewProcess(id: number): Promise<boolean> {
    // Also delete all related stages and followup actions
    const process = this.interviewProcesses.get(id);
    if (!process) return false;
    
    const stages = await this.getInterviewStages(id);
    for (const stage of stages) {
      await this.deleteInterviewStage(stage.id);
    }
    
    const followupActions = await this.getFollowupActions(id);
    for (const action of followupActions) {
      await this.deleteFollowupAction(action.id);
    }
    
    return this.interviewProcesses.delete(id);
  }

  // Interview Stage operations
  async getInterviewStages(processId: number): Promise<InterviewStage[]> {
    return Array.from(this.interviewStages.values())
      .filter(stage => stage.processId === processId)
      .sort((a, b) => {
        // Sort by scheduled date if available, otherwise by creation date
        const aDate = a.scheduledDate || a.createdAt;
        const bDate = b.scheduledDate || b.createdAt;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      });
  }

  async getInterviewStage(id: number): Promise<InterviewStage | undefined> {
    return this.interviewStages.get(id);
  }

  async createInterviewStage(processId: number, stageData: InsertInterviewStage): Promise<InterviewStage> {
    const id = this.interviewStageIdCounter++;
    const now = new Date();
    const interviewStage: InterviewStage = {
      ...stageData,
      id,
      processId,
      createdAt: now,
      updatedAt: now
    };
    this.interviewStages.set(id, interviewStage);
    
    // Get the process to award XP to the user
    const process = await this.getInterviewProcess(processId);
    if (process) {
      await this.addUserXP(process.userId, 40, "interview_stage_added", `Added interview stage: ${stageData.type}`);
    }
    
    return interviewStage;
  }

  async updateInterviewStage(id: number, stageData: Partial<InterviewStage>): Promise<InterviewStage | undefined> {
    const stage = this.interviewStages.get(id);
    if (!stage) return undefined;
    
    const now = new Date();
    const updatedStage = { 
      ...stage, 
      ...stageData,
      updatedAt: now 
    };
    
    // If marking as completed and wasn't completed before
    if (stageData.completedDate && !stage.completedDate) {
      // Get the process to award XP to the user
      const process = await this.getInterviewProcess(stage.processId);
      if (process) {
        await this.addUserXP(process.userId, 75, "interview_stage_completed", `Completed interview stage: ${stage.type}`);
      }
    }
    
    this.interviewStages.set(id, updatedStage);
    return updatedStage;
  }

  async deleteInterviewStage(id: number): Promise<boolean> {
    // Also delete related followup actions
    const stage = this.interviewStages.get(id);
    if (!stage) return false;
    
    const followupActions = Array.from(this.followupActions.values())
      .filter(action => action.stageId === id);
    
    for (const action of followupActions) {
      await this.deleteFollowupAction(action.id);
    }
    
    return this.interviewStages.delete(id);
  }

  // Followup Action operations
  async getFollowupActions(processId: number, stageId?: number): Promise<FollowupAction[]> {
    let actions = Array.from(this.followupActions.values())
      .filter(action => action.processId === processId);
    
    if (stageId !== undefined) {
      actions = actions.filter(action => action.stageId === stageId);
    }
    
    return actions.sort((a, b) => {
      // Sort by due date if available, otherwise by creation date
      const aDate = a.dueDate || a.createdAt;
      const bDate = b.dueDate || b.createdAt;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }

  async getFollowupAction(id: number): Promise<FollowupAction | undefined> {
    return this.followupActions.get(id);
  }

  async createFollowupAction(processId: number, actionData: InsertFollowupAction): Promise<FollowupAction> {
    const id = this.followupActionIdCounter++;
    const now = new Date();
    const followupAction: FollowupAction = {
      ...actionData,
      id,
      processId,
      completed: false,
      completedDate: null,
      createdAt: now,
      updatedAt: now
    };
    this.followupActions.set(id, followupAction);
    
    // Get the process to award XP to the user
    const process = await this.getInterviewProcess(processId);
    if (process) {
      await this.addUserXP(process.userId, 25, "followup_action_created", `Added followup action: ${actionData.type}`);
    }
    
    return followupAction;
  }

  async updateFollowupAction(id: number, actionData: Partial<FollowupAction>): Promise<FollowupAction | undefined> {
    const action = this.followupActions.get(id);
    if (!action) return undefined;
    
    const now = new Date();
    const updatedAction = { 
      ...action, 
      ...actionData,
      updatedAt: now 
    };
    this.followupActions.set(id, updatedAction);
    return updatedAction;
  }

  async completeFollowupAction(id: number): Promise<FollowupAction | undefined> {
    const action = this.followupActions.get(id);
    if (!action) return undefined;
    
    if (action.completed) {
      // Already completed
      return action;
    }
    
    const now = new Date();
    const updatedAction = {
      ...action,
      completed: true,
      completedDate: now,
      updatedAt: now
    };
    this.followupActions.set(id, updatedAction);
    
    // Get the process to award XP to the user
    const process = await this.getInterviewProcess(action.processId);
    if (process) {
      await this.addUserXP(process.userId, 50, "followup_action_completed", `Completed followup action: ${action.type}`);
    }
    
    return updatedAction;
  }

  async deleteFollowupAction(id: number): Promise<boolean> {
    return this.followupActions.delete(id);
  }

  // Subscription and verification methods
  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.stripeSubscriptionId === subscriptionId
    );
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token
    );
  }
  
  async getUserByPendingEmailToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.pendingEmailToken === token
    );
  }

  async updateUserStripeInfo(userId: number, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: 'active' | 'inactive' | 'cancelled' | 'past_due';
    subscriptionPlan?: 'free' | 'premium' | 'university';
    subscriptionCycle?: 'monthly' | 'quarterly' | 'annual';
    subscriptionExpiresAt?: Date;
  }): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, ...stripeInfo };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserVerificationInfo(userId: number, verificationInfo: {
    emailVerified?: boolean;
    verificationToken?: string | null;
    verificationExpires?: Date | null;
  }): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Handle null values properly
    const updatedUser = { 
      ...user,
      emailVerified: verificationInfo.emailVerified !== undefined ? verificationInfo.emailVerified : user.emailVerified,
      verificationToken: verificationInfo.verificationToken === null ? undefined : verificationInfo.verificationToken || user.verificationToken,
      verificationExpires: verificationInfo.verificationExpires === null ? undefined : verificationInfo.verificationExpires || user.verificationExpires,
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();
