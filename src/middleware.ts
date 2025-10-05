import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/admin(.*)",
  "/university(.*)",
  "/account(.*)",
  "/goals(.*)",
  "/api/goals(.*)",
  "/applications(.*)",
  "/networking(.*)",
  "/contacts(.*)",
  "/career-coach(.*)",
  "/resumes(.*)",
  "/cover-letters(.*)",
  "/career-path(.*)",
  "/projects(.*)",
  "/achievements(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // Handle role-based redirects
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Get user role from JWT token
    try {
      const token = await (auth as any).getToken();
      if (token) {
        // Decode the JWT token to get user metadata
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userRole = payload.public_metadata?.role;

        if (userRole) {
          let redirectPath = null;

          // Redirect admins to their respective dashboards
          if (userRole === "super_admin" || userRole === "admin") {
            // If admin is trying to access non-admin routes, redirect to admin
            if (!pathname.startsWith("/admin")) {
              redirectPath = "/admin";
            }
          } else if (userRole === "university_admin") {
            // If university admin is trying to access non-university routes, redirect to university
            if (!pathname.startsWith("/university")) {
              redirectPath = "/university";
            }
          }

          if (redirectPath) {
            return NextResponse.redirect(new URL(redirectPath, req.url));
          }
        }
      }
    } catch (error) {
      // If there's an error parsing the token, continue normally
      console.error("Error parsing user token in middleware:", error);
    }
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/university/:path*",
    "/account/:path*",
    "/goals/:path*",
    "/api/goals/:path*",
    "/applications/:path*",
    "/networking/:path*",
    "/contacts/:path*",
    "/career-coach/:path*",
    "/resumes/:path*",
    "/cover-letters/:path*",
    "/career-path/:path*",
    "/projects/:path*",
    "/achievements/:path*",
    // Ensure Clerk runs for API routes so auth() works in route handlers
    "/api/:path*",
  ],
};
