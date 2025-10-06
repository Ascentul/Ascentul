import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";

function requireAdmin(user: any) {
  const isAdmin = ["admin", "super_admin", "university_admin"].includes(
    user.role,
  );
  if (
    !isAdmin &&
    !(user.subscription_plan === "university" && user.university_id)
  ) {
    throw new Error("Unauthorized");
  }
}

async function getCurrentUser(ctx: any, clerkId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .unique();
  if (!user) throw new Error("User not found");
  return user;
}

export const getOverview = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);

    const uniId = user.university_id;
    if (!uniId) {
      return {
        totalStudents: 0,
        licenseCapacity: 0,
        activeLicenses: 0,
        departments: 0,
        totalCourses: 0,
      };
    }

    const [students, departments, courses] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_university", (q: any) => q.eq("university_id", uniId))
        .collect(),
      ctx.db
        .query("departments")
        .withIndex("by_university", (q: any) => q.eq("university_id", uniId))
        .collect(),
      ctx.db
        .query("courses")
        .withIndex("by_university", (q: any) => q.eq("university_id", uniId))
        .collect(),
    ]);

    // Filter to count only actual students (exclude university_admin)
    const actualStudents = students.filter((s: any) => s.role === "user");

    // Calculate growth from last month
    const now = Date.now();
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    const lastMonthEnd = new Date();
    lastMonthEnd.setDate(0); // Last day of previous month

    const studentsLastMonth = actualStudents.filter(
      (s: any) => s.created_at <= lastMonthEnd.getTime()
    ).length;

    const studentGrowth = studentsLastMonth > 0
      ? ((actualStudents.length - studentsLastMonth) / studentsLastMonth) * 100
      : 0;

    // Use university license seats if available
    const uni = (await ctx.db.get(
      uniId as Id<"universities">,
    )) as Doc<"universities"> | null;
    const licenseCapacity =
      (uni?.license_seats as number | undefined) ?? actualStudents.length;

    return {
      totalStudents: actualStudents.length,
      activeLicenses: actualStudents.length,
      licenseCapacity,
      departments: departments.length,
      totalCourses: courses.length,
      studentGrowthPercent: Math.round(studentGrowth * 10) / 10, // Round to 1 decimal
    };
  },
});

export const getUniversityAnalytics = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);

    const uniId = user.university_id;
    if (!uniId) {
      return {
        studentGrowthData: [],
        activityData: [],
        departmentStats: [],
      };
    }

    const [allUsers, departments, courses] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_university", (q: any) => q.eq("university_id", uniId))
        .collect(),
      ctx.db
        .query("departments")
        .withIndex("by_university", (q: any) => q.eq("university_id", uniId))
        .collect(),
      ctx.db
        .query("courses")
        .withIndex("by_university", (q: any) => q.eq("university_id", uniId))
        .collect(),
    ]);

    // Filter to only actual students (exclude university_admin)
    const students = allUsers.filter((s: any) => s.role === "user");

    // Calculate student growth data (last 6 months)
    const studentGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
      ).getTime();
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
      ).getTime();

      const monthStudents = students.filter(
        (student) =>
          student.role === "user" &&
          student.created_at >= monthStart &&
          student.created_at <= monthEnd,
      ).length;

      studentGrowthData.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        students: monthStudents,
      });
    }

    // Calculate department statistics with real student counts
    const departmentStats = departments.map((dept: any) => {
      // Count students actually assigned to this department
      const deptStudents = students.filter(
        (student) => student.department_id === dept._id,
      );

      const deptCourses = courses.filter(
        (course) => course.department_id === dept._id,
      );

      return {
        name: dept.name,
        students: deptStudents.length,
        courses: deptCourses.length,
      };
    });

    // Calculate activity data (last 7 days)
    // Since we don't have session tracking, we'll use application activity as a proxy
    const activityData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      ).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

      // Get applications created on this day by university students
      const dayApplications = await ctx.db
        .query("applications")
        .filter((q: any) =>
          q.and(
            q.gte(q.field("created_at"), dayStart),
            q.lte(q.field("created_at"), dayEnd),
          ),
        )
        .collect();

      // Filter to only include university students
      const universityApplications = dayApplications.filter((app) =>
        students.some((student) => student._id === app.user_id),
      );

      activityData.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        logins: Math.max(0, universityApplications.length * 2), // Estimate logins based on activity
        assignments: universityApplications.length,
      });
    }

    // Calculate monthly platform usage (last 6 months)
    const platformUsageData = [];
    const [allApplications, allResumes, allCoverLetters, allGoals] = await Promise.all([
      ctx.db.query("applications").collect(),
      ctx.db.query("resumes").collect(),
      ctx.db.query("cover_letters").collect(),
      ctx.db.query("goals").collect(),
    ]);

    const studentIds = students.map((s) => s._id);

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
      ).getTime();
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
      ).getTime();

      const monthGoals = allGoals.filter(
        (g) => studentIds.includes(g.user_id) && g.created_at >= monthStart && g.created_at <= monthEnd
      ).length;
      const monthApplications = allApplications.filter(
        (a) => studentIds.includes(a.user_id) && a.created_at >= monthStart && a.created_at <= monthEnd
      ).length;
      const monthResumes = allResumes.filter(
        (r) => studentIds.includes(r.user_id) && r.created_at >= monthStart && r.created_at <= monthEnd
      ).length;
      const monthCoverLetters = allCoverLetters.filter(
        (cl) => studentIds.includes(cl.user_id) && cl.created_at >= monthStart && cl.created_at <= monthEnd
      ).length;

      platformUsageData.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        goals: monthGoals,
        applications: monthApplications,
        resumes: monthResumes,
        coverLetters: monthCoverLetters,
      });
    }

    return {
      studentGrowthData,
      activityData,
      departmentStats,
      platformUsageData,
    };
  },
});

export const getCourse = query({
  args: { clerkId: v.string(), courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;
    if (user.university_id && course.university_id !== user.university_id) {
      throw new Error("Unauthorized");
    }
    return course;
  },
});

export const assignStudentByEmail = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("staff"))),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(admin);
    if (!admin.university_id) throw new Error("No university assigned");

    // Check if user already exists
    const existingStudent = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();

    if (existingStudent) {
      // Update existing user
      await ctx.db.patch(existingStudent._id, {
        university_id: admin.university_id,
        subscription_plan: "university",
        ...(args.role ? { role: args.role } : {}),
        ...(args.departmentId ? { department_id: args.departmentId } : {}),
        updated_at: Date.now(),
      });
      return { userId: existingStudent._id, isNew: false };
    } else {
      // Create pending user invitation
      // This user will be activated when they click the magic link in their email
      const userId = await ctx.db.insert("users", {
        email: args.email,
        name: "", // Will be filled in when user activates
        clerkId: "", // Will be filled in when user activates via Clerk
        university_id: admin.university_id,
        subscription_plan: "university",
        subscription_status: "active",
        role: args.role || "user",
        account_status: "pending_activation",
        ...(args.departmentId ? { department_id: args.departmentId } : {}),
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      return { userId, isNew: true };
    }
  },
});

export const updateDepartment = mutation({
  args: {
    clerkId: v.string(),
    departmentId: v.id("departments"),
    patch: v.object({
      name: v.optional(v.string()),
      code: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);
    const dept = await ctx.db.get(args.departmentId);
    if (!dept) throw new Error("Department not found");
    if (dept.university_id !== user.university_id)
      throw new Error("Unauthorized");
    await ctx.db.patch(args.departmentId, {
      ...args.patch,
      updated_at: Date.now(),
    });
  },
});

export const deleteDepartment = mutation({
  args: { clerkId: v.string(), departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);
    const dept = await ctx.db.get(args.departmentId);
    if (!dept) return;
    if (dept.university_id !== user.university_id)
      throw new Error("Unauthorized");
    await ctx.db.delete(args.departmentId);
  },
});

export const listStudents = query({
  args: { clerkId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);

    if (!user.university_id) return [];

    const allUsers = await ctx.db
      .query("users")
      .withIndex("by_university", (q) =>
        q.eq("university_id", user.university_id!),
      )
      .collect();

    // Filter to only actual students (exclude university_admin)
    const students = allUsers.filter((s: any) => s.role !== "university_admin");

    const limit = args.limit ?? 200;
    return students.slice(0, limit);
  },
});

export const listDepartments = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);
    if (!user.university_id) return [];
    return await ctx.db
      .query("departments")
      .withIndex("by_university", (q: any) =>
        q.eq("university_id", user.university_id!),
      )
      .collect();
  },
});

export const createDepartment = mutation({
  args: { clerkId: v.string(), name: v.string(), code: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);
    if (!user.university_id) throw new Error("No university assigned");
    const now = Date.now();
    return await ctx.db.insert("departments", {
      university_id: user.university_id!,
      name: args.name,
      code: args.code,
      created_at: now,
      updated_at: now,
    });
  },
});

export const listCourses = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);
    if (!user.university_id) return [];
    return await ctx.db
      .query("courses")
      .withIndex("by_university", (q: any) =>
        q.eq("university_id", user.university_id!),
      )
      .collect();
  },
});

export const createCourse = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    departmentId: v.optional(v.id("departments")),
    category: v.optional(v.string()),
    level: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);
    if (!user.university_id) throw new Error("No university assigned");
    const now = Date.now();
    return await ctx.db.insert("courses", {
      university_id: user.university_id!,
      department_id: args.departmentId,
      title: args.title,
      category: args.category,
      level: args.level,
      published: args.published ?? false,
      enrollments: 0,
      completion_rate: 0,
      created_at: now,
      updated_at: now,
    });
  },
});

export const updateCourse = mutation({
  args: {
    clerkId: v.string(),
    courseId: v.id("courses"),
    patch: v.object({
      title: v.optional(v.string()),
      department_id: v.optional(v.id("departments")),
      category: v.optional(v.string()),
      level: v.optional(v.string()),
      published: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");
    if (course.university_id !== user.university_id)
      throw new Error("Unauthorized");
    await ctx.db.patch(args.courseId, {
      ...args.patch,
      updated_at: Date.now(),
    });
  },
});

export const deleteCourse = mutation({
  args: { clerkId: v.string(), courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);
    const course = await ctx.db.get(args.courseId);
    if (!course) return;
    if (course.university_id !== user.university_id)
      throw new Error("Unauthorized");
    await ctx.db.delete(args.courseId);
  },
});

export const getStudentMetrics = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);

    if (!user.university_id) {
      return {
        totalApplications: 0,
        totalResumes: 0,
        totalCoverLetters: 0,
        totalGoals: 0,
        totalProjects: 0,
        avgCareerCompletion: 0,
      };
    }

    // Get all students for this university
    const allUsers = await ctx.db
      .query("users")
      .withIndex("by_university", (q: any) =>
        q.eq("university_id", user.university_id!),
      )
      .collect();

    const students = allUsers.filter((s: any) => s.role === "user");
    const studentIds = students.map((s) => s._id);

    if (studentIds.length === 0) {
      return {
        totalApplications: 0,
        totalResumes: 0,
        totalCoverLetters: 0,
        totalGoals: 0,
        totalProjects: 0,
        avgCareerCompletion: 0,
      };
    }

    // Get all applications, resumes, cover letters, goals, and projects for these students
    const [applications, resumes, coverLetters, goals, projects] =
      await Promise.all([
        ctx.db.query("applications").collect(),
        ctx.db.query("resumes").collect(),
        ctx.db.query("cover_letters").collect(),
        ctx.db.query("goals").collect(),
        ctx.db.query("projects").collect(),
      ]);

    // Filter to only include items belonging to university students
    const studentApplications = applications.filter((app) =>
      studentIds.includes(app.user_id),
    );
    const studentResumes = resumes.filter((resume) =>
      studentIds.includes(resume.user_id),
    );
    const studentCoverLetters = coverLetters.filter((cl) =>
      studentIds.includes(cl.user_id),
    );
    const studentGoals = goals.filter((goal) =>
      studentIds.includes(goal.user_id),
    );
    const studentProjects = projects.filter((project) =>
      studentIds.includes(project.user_id),
    );

    // Calculate average career completion percentage
    // Based on: resumes (30%), cover letters (20%), applications (30%), goals (10%), projects (10%)
    const careerCompletions = students.map((student) => {
      const hasResume = studentResumes.some((r) => r.user_id === student._id);
      const hasCoverLetter = studentCoverLetters.some(
        (cl) => cl.user_id === student._id,
      );
      const hasApplication = studentApplications.some(
        (app) => app.user_id === student._id,
      );
      const hasGoal = studentGoals.some((g) => g.user_id === student._id);
      const hasProject = studentProjects.some((p) => p.user_id === student._id);

      let completion = 0;
      if (hasResume) completion += 30;
      if (hasCoverLetter) completion += 20;
      if (hasApplication) completion += 30;
      if (hasGoal) completion += 10;
      if (hasProject) completion += 10;

      return completion;
    });

    const avgCareerCompletion =
      careerCompletions.length > 0
        ? Math.round(
            careerCompletions.reduce((a, b) => a + b, 0) /
              careerCompletions.length,
          )
        : 0;

    return {
      totalApplications: studentApplications.length,
      totalResumes: studentResumes.length,
      totalCoverLetters: studentCoverLetters.length,
      totalGoals: studentGoals.length,
      totalProjects: studentProjects.length,
      avgCareerCompletion,
    };
  },
});

export const getStudentProgress = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    requireAdmin(user);

    if (!user.university_id) return [];

    // Get all students for this university
    const allUsers = await ctx.db
      .query("users")
      .withIndex("by_university", (q: any) =>
        q.eq("university_id", user.university_id!),
      )
      .collect();

    const students = allUsers.filter((s: any) => s.role === "user");
    const studentIds = students.map((s) => s._id);

    if (studentIds.length === 0) return [];

    // Get all career-related items
    const [applications, resumes, coverLetters, goals, projects] =
      await Promise.all([
        ctx.db.query("applications").collect(),
        ctx.db.query("resumes").collect(),
        ctx.db.query("cover_letters").collect(),
        ctx.db.query("goals").collect(),
        ctx.db.query("projects").collect(),
      ]);

    // Map student progress
    return students.map((student) => {
      const studentApps = applications.filter(
        (app) => app.user_id === student._id,
      );
      const studentResumes = resumes.filter((r) => r.user_id === student._id);
      const studentCoverLetters = coverLetters.filter(
        (cl) => cl.user_id === student._id,
      );
      const studentGoals = goals.filter((g) => g.user_id === student._id);
      const studentProjects = projects.filter(
        (p) => p.user_id === student._id,
      );

      // Calculate completion percentage
      let completion = 0;
      if (studentResumes.length > 0) completion += 30;
      if (studentCoverLetters.length > 0) completion += 20;
      if (studentApps.length > 0) completion += 30;
      if (studentGoals.length > 0) completion += 10;
      if (studentProjects.length > 0) completion += 10;

      return {
        studentId: student._id,
        name: student.name || student.email,
        email: student.email,
        applications: studentApps.length,
        resumes: studentResumes.length,
        coverLetters: studentCoverLetters.length,
        goals: studentGoals.length,
        projects: studentProjects.length,
        completion,
      };
    });
  },
});
