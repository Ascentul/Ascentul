/**
 * Seed Advisor Test Data
 *
 * Run via Convex dashboard or CLI:
 * npx convex run seed_advisor_data:setupAdvisorTestData
 *
 * Creates:
 * - Test university (if doesn't exist)
 * - Links advisor and students to university
 * - Creates student-advisor relationships
 */

import { internalMutation } from "./_generated/server";

export const setupAdvisorTestData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Find or create test university
    let university = await ctx.db
      .query("universities")
      .filter((q) => q.eq(q.field("name"), "Test University - Advisor Demo"))
      .first();

    if (!university) {
      const uniId = await ctx.db.insert("universities", {
        name: "Test University - Advisor Demo",
        slug: "test-advisor-demo",
        description: "Test university for advisor feature development",
        license_plan: "Pro",
        license_seats: 100,
        license_used: 0,
        max_students: 100,
        license_start: now,
        status: "active",
        is_test: true,
        created_at: now,
        updated_at: now,
      });
      university = await ctx.db.get(uniId);
      console.log(`✓ Created test university: ${uniId}`);
    } else {
      console.log(`✓ Using existing university: ${university._id}`);
    }

    if (!university) {
      throw new Error("Failed to create/find university");
    }

    // 2. Find advisor user by email pattern
    const advisorUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "test.advisor@ascentful.io"))
      .first();

    if (!advisorUser) {
      console.log("⚠️  Advisor user not found. Please sign in with test.advisor@ascentful.io first to create profile.");
      return { success: false, message: "Advisor user not found. Sign in first." };
    }

    // Update advisor's university_id
    await ctx.db.patch(advisorUser._id, {
      university_id: university._id,
      role: "advisor",
      subscription_plan: "university",
      subscription_status: "active",
      updated_at: now,
    });
    console.log(`✓ Updated advisor: ${advisorUser.email}`);

    // 3. Find student users
    const student1 = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "test.student1@ascentful.io"))
      .first();

    const student2 = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "test.student2@ascentful.io"))
      .first();

    const students = [student1, student2].filter((s): s is NonNullable<typeof s> => s != null);

    if (students.length === 0) {
      console.log("⚠️  No student users found. Please sign in with test.student1@ascentful.io and test.student2@ascentful.io first.");
      return { success: false, message: "No student users found. Sign in first." };
    }

    // Update students' university_id and ensure role is student
    for (const student of students) {
      await ctx.db.patch(student._id, {
        university_id: university._id,
        role: "student",
        subscription_plan: "university",
        subscription_status: "active",
        major: student.email === "test.student1@ascentful.io" ? "Computer Science" : "Business Administration",
        graduation_year: "2025",
        updated_at: now,
      });
      console.log(`✓ Updated student: ${student.email}`);
    }

    // 4. Create student-advisor relationships
    for (const student of students) {
      // Check if relationship already exists
      const existing = await ctx.db
        .query("student_advisors")
        .filter((q) =>
          q.and(
            q.eq(q.field("student_id"), student._id),
            q.eq(q.field("advisor_id"), advisorUser._id),
          ),
        )
        .first();

      if (existing) {
        console.log(`✓ Student-advisor relationship already exists for ${student.email}`);
        continue;
      }

      const assignmentId = await ctx.db.insert("student_advisors", {
        student_id: student._id,
        advisor_id: advisorUser._id,
        university_id: university._id,
        is_owner: true, // Advisor is primary owner
        assigned_at: now,
        assigned_by: advisorUser._id, // Self-assigned for testing
        notes: "Test assignment for advisor feature development",
        created_at: now,
        updated_at: now,
      });

      console.log(`✓ Assigned ${student.email} to advisor (${assignmentId})`);
    }

    // Create a sample advisor session for student1
    if (student1) {
      // Check if session already exists
      const existingSession = await ctx.db
        .query("advisor_sessions")
        .filter((q) =>
          q.and(
            q.eq(q.field("student_id"), student1._id),
            q.eq(q.field("advisor_id"), advisorUser._id),
            q.eq(q.field("title"), "Initial Career Planning Session"),
          ),
        )
        .first();

      if (existingSession) {
        console.log(`✓ Sample session already exists`);
      } else {
        const sessionId = await ctx.db.insert("advisor_sessions", {
          student_id: student1._id,
          advisor_id: advisorUser._id,
          university_id: university._id,
          title: "Initial Career Planning Session",
          scheduled_at: now + 24 * 60 * 60 * 1000, // Tomorrow
          start_at: now + 24 * 60 * 60 * 1000,
          duration_minutes: 60, // Default duration
          session_type: "career_planning",
          status: "scheduled",
          outcomes: [],
          notes: "First session to discuss career goals and create development plan.",
          visibility: "shared",
          tasks: [],
          attachments: [],
          version: 1,
          created_at: now,
          updated_at: now,
        });
        console.log(`✓ Created sample session: ${sessionId}`);
      }
    }

    // Create a sample follow-up for student2
    if (student2) {
      // Check if follow-up already exists
      const existingFollowUp = await ctx.db
        .query("follow_ups")
        .filter((q) =>
          q.and(
            q.eq(q.field("user_id"), student2._id),
            q.eq(q.field("created_by_id"), advisorUser._id),
            q.eq(q.field("title"), "Update resume with latest internship experience"),
          ),
        )
        .first();

      if (existingFollowUp) {
        console.log(`✓ Sample follow-up already exists`);
      } else {
        const followUpId = await ctx.db.insert("follow_ups", {
          // Core task fields
          title: "Update resume with latest internship experience",
          description: "Add details about summer 2024 internship at TechCorp",
          type: "follow_up",
          notes: undefined,

          // Ownership & creation tracking
          user_id: student2._id, // student the task relates to
          owner_id: student2._id, // student is responsible to complete
          created_by_id: advisorUser._id,
          created_by_type: "advisor",

          // Multi-tenancy
          university_id: university._id,

          // Relationships (generic "general" follow-up)
          related_type: "general",
          related_id: undefined,
          application_id: undefined,
          contact_id: undefined,

          // Task management
          due_at: now + 7 * 24 * 60 * 60 * 1000, // 7 days from now
          priority: "medium",
          status: "open",

          // Completion audit trail
          completed_at: undefined,
          completed_by: undefined,
          version: 0,

          // Timestamps
          created_at: now,
          updated_at: now,
        });
        console.log(`✓ Created sample follow-up: ${followUpId}`);
      }
    }

    console.log("\n✅ Advisor test data setup complete!");
    console.log("\nTest accounts configured - see documentation for credentials.");
    console.log("\nUniversity:", university.name);
    console.log("Students assigned:", students.length);

    return {
      success: true,
      universityId: university._id,
      advisorId: advisorUser._id,
      studentIds: students.map((s) => s._id),
    };
  },
});
