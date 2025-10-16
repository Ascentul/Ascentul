import { query } from "./_generated/server";

/**
 * Debug query to inspect the current user's identity values
 * Useful for diagnosing auth issues and understanding what Convex sees
 */
export const whoami = query({
  args: {},
  handler: async (ctx) => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Debug endpoint disabled in production");
    }

    // Get the authenticated user's identity
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return {
        hasUser: false,
        subject: null,
        tokenIdentifier: null,
        name: null,
        email: null,
      };
    }

    // Return the raw identity values
    return {
      hasUser: true,
      subject: identity.subject || null,
      tokenIdentifier: identity.tokenIdentifier || null,
      name: identity.name || null,
      email: identity.email || null,
    };
  },
});
