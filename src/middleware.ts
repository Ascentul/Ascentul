import { clerkMiddleware, createRouteMatcher, redirectToSignIn } from '@clerk/nextjs/server'

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
    const { userId } = auth()
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }
  }
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/admin/:path*',
    '/account/:path*',
    '/goals/:path*',
    '/api/goals/:path*',
    '/applications/:path*',
    '/networking/:path*',
    '/resumes/:path*',
    '/cover-letters/:path*',
    '/career-path/:path*',
    '/projects/:path*',
  ],
}
