import { MutationCtx, QueryCtx } from "./_generated/server";
import { isServiceRequest } from "./lib/roles";

/**
 * Resolve profile_image storage ID to URL if needed.
 */
export async function resolveProfileImageUrl(ctx: QueryCtx, profileImage: string | undefined): Promise<string | null> {
  if (!profileImage) return null;

  if (profileImage.startsWith("http")) {
    return profileImage;
  }

  try {
    const url = await ctx.storage.getUrl(profileImage);
    return url;
  } catch {
    return null;
  }
}

/**
 * Log role changes to audit_logs when performed by super_admin.
 */
export async function logRoleChange(
  ctx: MutationCtx,
  targetUser: any,
  oldRole: string,
  newRole: string
) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (admin && admin.role === "super_admin") {
      await ctx.db.insert("audit_logs", {
        action: "user_role_changed",
        target_type: "user",
        target_id: targetUser._id,
        target_email: targetUser.email,
        target_name: targetUser.name,
        performed_by_id: admin._id,
        performed_by_email: admin.email,
        performed_by_name: admin.name,
        reason: `Role changed from ${oldRole} to ${newRole}`,
        metadata: {
          old_role: oldRole,
          new_role: newRole,
          target_university_id: targetUser.university_id,
        },
        timestamp: Date.now(),
        created_at: Date.now(),
      });
    }
  } catch (auditError) {
    console.error("Failed to create role change audit log:", auditError);
  }
}

/**
 * Resolve acting user from ctx.auth or service token.
 */
export async function getActingUser(ctx: MutationCtx, serviceToken?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const isService = isServiceRequest(serviceToken);

  if (!identity && !isService) {
    throw new Error("Unauthorized");
  }

  if (isService) {
    return { actingUser: null as any, isService: true };
  }

  const actingUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity!.subject))
    .unique();

  if (!actingUser) {
    throw new Error("Unauthorized");
  }

  return { actingUser, isService: false };
}
