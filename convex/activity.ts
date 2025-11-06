import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get current date in YYYY-MM-DD format for a given timezone
 * Defaults to UTC if no timezone provided
 */
function getTodayString(timezone: string = "UTC"): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now); // Returns YYYY-MM-DD
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    const now = new Date();
    return now.toISOString().split("T")[0];
  }
}

/**
 * Mark login for today - creates or updates the daily activity record
 */
export const markLoginForToday = mutation({
  args: {
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { timezone = "UTC" } = args;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const clerkId = identity.subject;

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const today = getTodayString(timezone);
    const now = Date.now();

    // Check if record exists
    const existing = await ctx.db
      .query("user_daily_activity")
      .withIndex("by_clerk_date", (q) => q.eq("clerk_id", clerkId).eq("date", today))
      .unique();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        did_login: true,
        updated_at: now,
      });
      return existing._id;
    } else {
      // Create new record
      return await ctx.db.insert("user_daily_activity", {
        user_id: user._id,
        clerk_id: clerkId,
        date: today,
        did_login: true,
        did_action: false,
        action_count: 0,
        created_at: now,
        updated_at: now,
      });
    }
  },
});

/**
 * Mark action for today - creates or updates the daily activity record
 */
export const markActionForToday = mutation({
  args: {
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { timezone = "UTC" } = args;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const clerkId = identity.subject;

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const today = getTodayString(timezone);
    const now = Date.now();

    // Check if record exists
    const existing = await ctx.db
      .query("user_daily_activity")
      .withIndex("by_clerk_date", (q) => q.eq("clerk_id", clerkId).eq("date", today))
      .unique();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        did_action: true,
        action_count: existing.action_count + 1,
        updated_at: now,
      });
      return existing._id;
    } else {
      // Create new record
      return await ctx.db.insert("user_daily_activity", {
        user_id: user._id,
        clerk_id: clerkId,
        date: today,
        did_login: false,
        did_action: true,
        action_count: 1,
        created_at: now,
        updated_at: now,
      });
    }
  },
});

export type HeatmapDay = {
  date: string; // YYYY-MM-DD
  didLogin: boolean;
  didAction: boolean;
  actionCount: number;
};

/**
 * Get current year's daily activity for heatmap display (Jan 1 - Today)
 */
export const getActivityYear = query({
  args: {
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<HeatmapDay[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;
    const { timezone = "UTC" } = args;

    // Get current year range: Jan 1 to today
    const today = getTodayString(timezone);
    const currentYear = parseInt(today.substring(0, 4), 10);
    const startDate = `${currentYear}-01-01`;

    const activities = await ctx.db
      .query("user_daily_activity")
      .withIndex("by_clerk_date", (q) => q.eq("clerk_id", clerkId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), today)
        )
      )
      .collect();

    // Create a map for quick lookup
    const activityMap = new Map<string, Doc<"user_daily_activity">>();
    activities.forEach((activity) => {
      activityMap.set(activity.date, activity);
    });

    // Generate all days from Jan 1 to today
    const result: HeatmapDay[] = [];
    const currentDate = new Date(`${startDate}T00:00:00Z`);
    const endDate = new Date(today + "T00:00:00Z");

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split("T")[0];
      const activity = activityMap.get(dateString);

      result.push({
        date: dateString,
        didLogin: activity?.did_login ?? false,
        didAction: activity?.did_action ?? false,
        actionCount: activity?.action_count ?? 0,
      });

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return result;
  },
});

export type StreakSummary = {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  firstDate: string | null;
  lastDate: string | null;
};

/**
 * Calculate streak statistics for the authenticated user
 */
export const getStreakSummary = query({
  args: {
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<StreakSummary> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;

    // Get all activity for the user, sorted by date descending
    const activities = await ctx.db
      .query("user_daily_activity")
      .withIndex("by_clerk_date", (q) => q.eq("clerk_id", clerkId))
      .filter((q) => q.eq(q.field("did_action"), true))
      .collect();

    if (activities.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        firstDate: null,
        lastDate: null,
      };
    }

    // Sort by date
    activities.sort((a, b) => a.date.localeCompare(b.date));

    const firstDate = activities[0].date;
    const lastDate = activities[activities.length - 1].date;
    const totalActiveDays = activities.length;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = getTodayString(args.timezone ?? "UTC");
    const todayDate = new Date(today + "T00:00:00Z");
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayString = yesterdayDate.toISOString().split("T")[0];

    // Check if we need to count current streak
    const hasActivityToday = activities.some((a) => a.date === today);
    const hasActivityYesterday = activities.some((a) => a.date === yesterdayString);

    // Calculate current streak working backwards from today/yesterday
    if (hasActivityToday || hasActivityYesterday) {
      let checkDate = hasActivityToday ? today : yesterdayString;
      const checkDateObj = new Date(checkDate + "T00:00:00Z");

      for (let i = activities.length - 1; i >= 0; i--) {
        const activityDate = activities[i].date;
        const checkDateString = checkDateObj.toISOString().split("T")[0];
        if (activityDate === checkDateString) {
          currentStreak++;
          checkDateObj.setUTCDate(checkDateObj.getUTCDate() - 1);
        } else if (activityDate < checkDateString) {
          // Gap found
          break;
        }
      }
    }

    // Calculate longest streak
    let prevDateStr: string | null = null;
    for (const activity of activities) {
      if (prevDateStr === null) {
        tempStreak = 1;
      } else {
        // Calculate day difference using string date arithmetic
        const prevDate = new Date(prevDateStr + 'T00:00:00Z');
        const currentDate = new Date(activity.date + 'T00:00:00Z');
        const diffDays = Math.round(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      prevDateStr = activity.date;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalActiveDays,
      firstDate,
      lastDate,
    };
  },
});
