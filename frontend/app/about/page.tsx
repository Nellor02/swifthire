import Link from "next/link";

export const metadata = {
  title: "About | SwiftHire",
  description: "Learn more about SwiftHire and its mission.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-900 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Home
        </Link>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-blue-400">
            About SwiftHire
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-100">
            Building Faster Connections Between Talent and Opportunity
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            SwiftHire is a modern hiring platform designed to help employers
            discover talent faster and help job seekers connect with real
            opportunities more efficiently.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h2 className="text-2xl font-semibold text-slate-100">
                Our Mission
              </h2>

              <p className="mt-4 leading-7 text-slate-300">
                We believe hiring should feel direct, modern, and accessible.
                SwiftHire focuses on reducing friction between employers and job
                seekers through streamlined applications, talent discovery,
                realtime communication, and intuitive user experiences.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h2 className="text-2xl font-semibold text-slate-100">
                What Makes SwiftHire Different
              </h2>

              <ul className="mt-4 space-y-3 text-slate-300">
                <li>• Realtime employer and candidate messaging</li>
                <li>• Modern dark-themed professional interface</li>
                <li>• Talent discovery and profile search</li>
                <li>• Fast job applications and management</li>
                <li>• Employer branding with company profiles</li>
                <li>• Mobile-friendly experience</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-blue-800 bg-blue-950/30 p-8">
            <h2 className="text-2xl font-semibold text-slate-100">
              Why SwiftHire Was Built
            </h2>

            <p className="mt-4 leading-8 text-slate-300">
              SwiftHire was created to provide a cleaner and more modern hiring
              experience focused on communication, discoverability, and speed.
              Many job platforms feel outdated, overly complex, or impersonal.
              SwiftHire aims to make hiring feel more human and efficient.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h2 className="text-2xl font-semibold text-slate-100">
                For Employers
              </h2>

              <p className="mt-4 leading-7 text-slate-300">
                Employers can create branded company profiles, post jobs,
                shortlist talent, and communicate directly with applicants and
                candidates in realtime.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h2 className="text-2xl font-semibold text-slate-100">
                For Job Seekers
              </h2>

              <p className="mt-4 leading-7 text-slate-300">
                Job seekers can build professional profiles, apply to jobs,
                manage applications, and interact directly with employers from a
                single platform.
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-700 pt-8">
            <h2 className="text-2xl font-semibold text-slate-100">
              Contact
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              Questions, feedback, or partnership inquiries?
            </p>

            <div className="mt-4 flex flex-col gap-2 text-slate-300">
              <a
                href="mailto:support@useswifthire.com"
                className="hover:text-blue-400"
              >
                support@useswifthire.com
              </a>

              <a
                href="mailto:nellorchamp@gmail.com"
                className="hover:text-blue-400"
              >
                nellorchamp@gmail.com
              </a>

              <a
                href="tel:+886979165872"
                className="hover:text-blue-400"
              >
                +886 979 165 872
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}