import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Convex URL not configured");
  }

  const client = new ConvexHttpClient(convexUrl);
  const token = await auth().getToken({
    template: process.env.CLERK_JWT_TEMPLATE || "convex",
  });

  if (token) {
    client.setAuth(token);
  }

  return client;
}

/**
 * Debug endpoint to inspect profile data fetching
 * GET /api/debug/profile
 *
 * Returns diagnostic information about the user's profile snapshot
 */
export async function GET() {
  try {
    // 1. Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          hasUser: false,
          snapshotEmpty: true,
          keys: [],
          skillsCount: 0,
          sample: null,
        },
        { status: 401 }
      );
    }

    // 2. Initialize Convex client with auth token
    const convex = await getConvexClient();

    // 3. Fetch profile snapshot
    let profile;
    let error = null;
    try {
      profile = await convex.query(api.profiles.getMyProfile, {});
    } catch (err: any) {
      error = err.message || "Unknown error fetching profile";
      console.error("Profile fetch error:", err);
    }

    // 4. Analyze the profile snapshot
    const hasUser = !!profile;
    const snapshotEmpty = !profile || (
      !profile.fullName &&
      (!profile.experience || profile.experience.length === 0) &&
      (!profile.education || profile.education.length === 0) &&
      (!profile.skills?.primary || profile.skills.primary.length === 0)
    );

    // 5. Extract diagnostic keys
    const keys: string[] = [];
    if (profile) {
      if (profile.fullName) keys.push("fullName");
      if (profile.title) keys.push("title");
      if (profile.contact?.email) keys.push("contact.email");
      if (profile.contact?.location) keys.push("contact.location");
      if (profile.contact?.links && profile.contact.links.length > 0) keys.push("contact.links");
      if (profile.experience && profile.experience.length > 0) keys.push("experience");
      if (profile.education && profile.education.length > 0) keys.push("education");
      if (profile.skills?.primary && profile.skills.primary.length > 0) keys.push("skills.primary");
      if (profile.skills?.secondary && profile.skills.secondary && profile.skills.secondary.length > 0) keys.push("skills.secondary");
      if (profile.projects && profile.projects.length > 0) keys.push("projects");
    }

    // 6. Count skills
    const skillsCount =
      (profile?.skills?.primary?.length || 0) +
      (profile?.skills?.secondary?.length || 0);

    // 7. Create sample data structure (obfuscate sensitive info)
    const sample = profile
      ? {
          fullName: profile.fullName ? `${profile.fullName.substring(0, 3)}***` : null,
          title: profile.title || null,
          hasContact: !!profile.contact,
          contactFields: profile.contact
            ? Object.keys(profile.contact).filter((k) => profile.contact![k as keyof typeof profile.contact])
            : [],
          experienceCount: profile.experience?.length || 0,
          experienceCompanies: profile.experience?.map((e) => e.company ? e.company.substring(0, 3) + "***" : "N/A"),
          educationCount: profile.education?.length || 0,
          educationSchools: profile.education?.map((e) => e.school ? e.school.substring(0, 3) + "***" : "N/A"),
          skillsPrimaryCount: profile.skills?.primary?.length || 0,
          skillsSecondaryCount: profile.skills?.secondary?.length || 0,
          skillsSample: profile.skills?.primary?.slice(0, 3) || [],
          projectsCount: profile.projects?.length || 0,
          projectsTitles: profile.projects?.map((p) => p.name ? p.name.substring(0, 5) + "***" : "N/A"),
        }
      : null;

    // 8. Return diagnostic response
    return NextResponse.json({
      success: !error,
      error: error || undefined,
      userId,
      hasUser,
      snapshotEmpty,
      keys,
      skillsCount,
      sample,
      timestamp: new Date().toISOString(),
      // Additional debugging info
      debug: {
        profileNull: profile === null,
        profileUndefined: profile === undefined,
      },
    });
  } catch (error: any) {
    console.error("Debug profile endpoint error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        hasUser: false,
        snapshotEmpty: true,
        keys: [],
        skillsCount: 0,
        sample: null,
      },
      { status: 500 }
    );
  }
}
