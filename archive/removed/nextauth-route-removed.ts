// @ts-nocheck
import NextAuth from 'next-auth'
import { SupabaseAdapter } from '@next-auth/supabase-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@/lib/supabase/server'

const handler = NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const supabase = createClient()
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error || !data.user) {
          return null
        }

        // Fetch user profile from your users table
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        return {
          id: data.user.id,
          email: data.user.email!,
          name: userProfile?.name || data.user.email!,
          ...userProfile
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.userType = user.userType
        token.subscriptionPlan = user.subscriptionPlan
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.userType = token.userType as string
        session.user.subscriptionPlan = token.subscriptionPlan as string
      }
      return session
    }
  },
  pages: {
    signIn: '/sign-in',
    signUp: '/sign-up',
  }
})

export { handler as GET, handler as POST }