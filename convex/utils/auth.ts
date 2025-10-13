/**
 * Authentication utilities for Convex functions
 */
import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { DataModel } from "../_generated/dataModel";

type ConvexContext = GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>;

/**
 * Get the authenticated user ID from the context
 * Throws an error if the user is not authenticated
 */
export async function getUserIdFromAuth(ctx: ConvexContext): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // Return the Clerk user ID (subject from JWT)
  return identity.subject;
}

/**
 * Get the authenticated user ID from the context or return null if not authenticated
 */
export async function getUserIdFromAuthOrNull(ctx: ConvexContext): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return identity.subject;
}
