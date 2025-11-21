'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInClerkPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Sign in with Clerk component (temporary workaround)</p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in-clerk"
          redirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-xl'
            }
          }}
        />
      </div>
    </div>
  )
}
