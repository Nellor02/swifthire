import Link from "next/link";

export const metadata = {
  title: "Terms of Service | SwiftHire",
  description: "Terms of Service for SwiftHire.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-900 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Home
        </Link>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-blue-400">
            Legal
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-100">
            Terms of Service
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Last updated: May 2026
          </p>

          <div className="mt-8 space-y-8 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                1. Acceptance of Terms
              </h2>

              <p className="mt-3 leading-7">
                By accessing or using SwiftHire, you agree to these Terms of
                Service. If you do not agree with these terms, you should not
                use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                2. Platform Purpose
              </h2>

              <p className="mt-3 leading-7">
                SwiftHire is a platform that connects employers and job seekers.
                We provide tools for posting jobs, creating talent profiles,
                applications, and messaging. SwiftHire does not guarantee
                employment, hiring outcomes, interviews, or candidate quality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                3. User Accounts
              </h2>

              <p className="mt-3 leading-7">
                Users are responsible for maintaining the security of their
                accounts and login credentials. You are responsible for all
                activity conducted under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                4. Employer Responsibilities
              </h2>

              <p className="mt-3 leading-7">
                Employers are responsible for ensuring job posts are legitimate,
                accurate, lawful, and non-discriminatory. Fraudulent, misleading,
                or scam-related listings are strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                5. Job Seeker Responsibilities
              </h2>

              <p className="mt-3 leading-7">
                Job seekers are responsible for the accuracy of the information
                they provide, including resumes, profiles, qualifications, and
                communications with employers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                6. Prohibited Activities
              </h2>

              <p className="mt-3 leading-7">
                Users may not use SwiftHire for unlawful activities, spam,
                harassment, impersonation, scams, malware distribution, or any
                activity that harms the platform or its users.
              </p>

              <p className="mt-3 leading-7">
                SwiftHire reserves the right to suspend or permanently remove
                accounts that violate these rules.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                7. User Content
              </h2>

              <p className="mt-3 leading-7">
                Users retain ownership of content they upload or submit,
                including resumes, logos, profile images, and job listings.
                However, by uploading content, you grant SwiftHire permission to
                display and process that content as necessary to operate the
                platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                8. Platform Availability
              </h2>

              <p className="mt-3 leading-7">
                SwiftHire is provided on an “as is” and “as available” basis.
                We do not guarantee uninterrupted availability, error-free
                functionality, or permanent storage of content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                9. Limitation of Liability
              </h2>

              <p className="mt-3 leading-7">
                SwiftHire and its operators are not liable for hiring decisions,
                employment disputes, financial losses, scams, data loss, or any
                indirect damages resulting from use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                10. Account Suspension or Termination
              </h2>

              <p className="mt-3 leading-7">
                We reserve the right to suspend, restrict, or terminate accounts
                at our discretion if users violate these terms or engage in
                harmful behavior.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                11. Changes to These Terms
              </h2>

              <p className="mt-3 leading-7">
                SwiftHire may update these Terms of Service at any time.
                Continued use of the platform after updates means you accept the
                revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                12. Contact
              </h2>

              <p className="mt-3 leading-7">
                Questions about these terms can be sent to{" "}
                <a
                  href="mailto:support@useswifthire.com"
                  className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  support@useswifthire.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}