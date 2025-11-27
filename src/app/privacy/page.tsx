import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Ascentful',
  description: 'Ascentful Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100/50">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-zinc-900 mb-8">Privacy Policy</h1>

        <div className="prose prose-zinc max-w-none">
          <p className="text-lg text-zinc-600 mb-6">
            Last updated: November 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">1. Information We Collect</h2>
            <p className="text-zinc-600">
              We collect information you provide directly to us, such as when you create an account,
              update your profile, use our career tools, or contact us for support. This information
              may include your name, email address, resume data, career goals, and other professional
              information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">2. How We Use Your Information</h2>
            <p className="text-zinc-600">
              We use the information we collect to provide, maintain, and improve our services,
              including personalizing your experience, providing career insights, and communicating
              with you about your account and our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">3. Information Sharing</h2>
            <p className="text-zinc-600">
              We do not sell your personal information. We may share your information with third-party
              service providers who perform services on our behalf, such as payment processing and
              email delivery.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">4. Data Security</h2>
            <p className="text-zinc-600">
              We take reasonable measures to help protect information about you from loss, theft,
              misuse, unauthorized access, disclosure, alteration, and destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">5. Your Rights</h2>
            <p className="text-zinc-600">
              You may access, update, or delete your account information at any time by logging into
              your account settings. You may also contact us to request access to, correction of, or
              deletion of personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">6. Contact</h2>
            <p className="text-zinc-600">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@ascentful.io" className="text-primary-500 hover:text-primary-700">
                privacy@ascentful.io
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <Link
            href="/sign-up"
            className="text-primary-500 hover:text-primary-700 font-medium"
          >
            &larr; Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
