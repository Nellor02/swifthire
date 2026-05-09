import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | SwiftHire",
  description: "Privacy Policy for SwiftHire.",
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Last updated: May 2026
          </p>

          <div className="mt-8 space-y-8 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                1. Introduction
              </h2>
              <p className="mt-3 leading-7">
                SwiftHire is a job platform that helps job seekers create
                profiles, apply for jobs, and communicate with employers. This
                Privacy Policy explains how we collect, use, store, and protect
                information when you use SwiftHire.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                2. Information We Collect
              </h2>
              <p className="mt-3 leading-7">
                We may collect information you provide directly, including your
                name, email address, account details, seeker profile information,
                employer/company information, job posts, applications, CVs or
                resumes, profile pictures, company logos, messages, and contact
                form submissions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                3. How We Use Your Information
              </h2>
              <p className="mt-3 leading-7">
                We use your information to create and manage accounts, display
                job listings and talent profiles, process job applications,
                enable messaging between seekers and employers, send
                notifications, improve the platform, prevent misuse, and provide
                support.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                4. Files, CVs, Images, and Media
              </h2>
              <p className="mt-3 leading-7">
                SwiftHire may allow users to upload files such as CVs, profile
                pictures, and company logos. These files may be stored using
                third-party media storage providers such as Cloudinary.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                5. Messages and Notifications
              </h2>
              <p className="mt-3 leading-7">
                Messages exchanged on SwiftHire may be stored so users can view
                conversation history. We may also send email notifications for
                important platform activity, such as applications, messages,
                shortlists, or account updates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                6. Third-Party Services
              </h2>
              <p className="mt-3 leading-7">
                SwiftHire may use third-party services to operate the platform,
                including hosting, databases, media storage, email delivery,
                monitoring, and analytics. These may include services such as
                Render, Vercel, Cloudinary, SendGrid, Sentry, and PostgreSQL
                hosting providers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                7. Cookies and Authentication
              </h2>
              <p className="mt-3 leading-7">
                SwiftHire may use browser storage, cookies, or authentication
                tokens to keep users logged in, protect accounts, and maintain
                secure sessions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                8. Data Security
              </h2>
              <p className="mt-3 leading-7">
                We take reasonable measures to protect user information. However,
                no online platform can guarantee absolute security. Users should
                keep their login credentials private and report suspicious
                activity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                9. User Choices
              </h2>
              <p className="mt-3 leading-7">
                Users may update their account or profile information through
                the platform. If you want to request account deletion or ask
                questions about your data, contact us using the email below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                10. Children&apos;s Privacy
              </h2>
              <p className="mt-3 leading-7">
                SwiftHire is not intended for children under the age required by
                applicable law to use employment-related online services. Users
                should only create accounts if they are legally permitted to do
                so.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                11. Changes to This Policy
              </h2>
              <p className="mt-3 leading-7">
                We may update this Privacy Policy from time to time. Any changes
                will be posted on this page with an updated date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-100">
                12. Contact
              </h2>
              <p className="mt-3 leading-7">
                For privacy questions or data requests, contact us at{" "}
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