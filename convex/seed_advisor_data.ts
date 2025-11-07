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
import { v } from "convex/values";

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

    const students = [student1, student2].filter((s) => s !== null);

    if (students.length === 0) {
      console.log("⚠️  No student users found. Please sign in with test.student1@ascentful.io and test.student2@ascentful.io first.");
      return { success: false, message: "No student users found. Sign in first." };
    }

    // Update students' university_id and ensure role is student
    for (const student of students) {
      if (student) {
        await ctx.db.patch(student._id, {
          university_id: university._id,
          role: "student",
          subscription_plan: "university",
          subscription_status: "active",
          major: student === student1 ? "Computer Science" : "Business Administration",
          graduation_year: "2025",
          updated_at: now,
        });
        console.log(`✓ Updated student: ${student.email}`);
      }
    }

    // 4. Create student-advisor relationships
    for (const student of students) {
      if (!student) continue;

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

    // 5. Create sample data for testing

    // Create a sample advisor session for student1
    if (student1) {
      const sessionId = await ctx.db.insert("advisor_sessions", {
        student_id: student1._id,
        advisor_id: advisorUser._id,
        university_id: university._id,
        title: "Initial Career Planning Session",
        scheduled_at: now + 24 * 60 * 60 * 1000, // Tomorrow
        start_at: now + 24 * 60 * 60 * 1000,
        session_type: "career_planning",
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

    // Create a sample follow-up for student2
    if (student2) {
      const followUpId = await ctx.db.insert("advisor_follow_ups", {
        student_id: student2._id,
        advisor_id: advisorUser._id,
        university_id: university._id,
        related_type: "general",
        title: "Update resume with latest internship experience",
        description: "Add details about summer 2024 internship at TechCorp",
        due_at: now + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        priority: "medium",
        owner_id: student2._id,
        status: "open",
        created_at: now,
        updated_at: now,
      });
      console.log(`✓ Created sample follow-up: ${followUpId}`);
    }

    console.log("\n✅ Advisor test data setup complete!");
    console.log("\nTest credentials:");
    console.log("  Advisor: test.advisor@ascentful.io / V3ry$Strong!Pa55-2025#");
    console.log("  Student 1: test.student1@ascentful.io / V3ry$Strong!Pa55-2025#");
    console.log("  Student 2: test.student2@ascentful.io / V3ry$Strong!Pa55-2025#");
    console.log("\nUniversity:", university.name);
    console.log("Students assigned:", students.length);

    return {
      success: true,
      universityId: university._id,
      advisorId: advisorUser._id,
      studentIds: students.map((s) => s!._id),
    };
  },
});
