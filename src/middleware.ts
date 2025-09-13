import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/admin(.*)',
  '/account(.*)',
  '/goals(.*)',
  '/api/goals(.*)',
  '/applications(.*)',
  '/networking(.*)',
  '/resumes(.*)',
  '/cover-letters(.*)',
  '/career-path(.*)',
  '/projects(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth.protect()
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
