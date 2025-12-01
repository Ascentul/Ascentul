import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Ascentful',
  description: 'Ascentful Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100/50">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-zinc-900 mb-8">Terms of Service</h1>

        <div className="prose prose-zinc max-w-none">
          <p className="text-lg text-zinc-600 mb-6">Last updated: November 2024</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-zinc-600">
              By accessing and using Ascentful, you agree to be bound by these Terms of Service and
              all applicable laws and regulations. If you do not agree with any of these terms, you
              are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">2. Use License</h2>
            <p className="text-zinc-600">
              Permission is granted to temporarily access the materials on Ascentful for personal,
              non-commercial transitory viewing only. This is the grant of a license, not a transfer
              of title.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">
              3. Account Responsibilities
            </h2>
            <p className="text-zinc-600">
              You are responsible for maintaining the confidentiality of your account and password.
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">4. Service Modifications</h2>
            <p className="text-zinc-600">
              Ascentful reserves the right to modify or discontinue, temporarily or permanently, the
              service with or without notice. You agree that Ascentful shall not be liable to you or
              any third party for any modification, suspension, or discontinuance of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4">5. Contact</h2>
            <p className="text-zinc-600">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a
                href="mailto:support@ascentful.io"
                className="text-primary-500 hover:text-primary-700"
              >
                support@ascentful.io
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <Link href="/sign-up" className="text-primary-500 hover:text-primary-700 font-medium">
            &larr; Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
