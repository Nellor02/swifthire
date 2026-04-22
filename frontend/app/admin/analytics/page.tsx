"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "../../../components/AuthGuard";
import StatusCard from "../../../components/StatusCard";
import { authFetch } from "../../../lib/api";

type TopCompany = {
  company_name: string;
  job_count: number;
};

type AnalyticsResponse = {
  users: {
    total: number;
    seekers: number;
    employers: number;
    admins: number;
    last_7_days: number;
    last_30_days: number;
  };
  jobs: {
    total: number;
    active: number;
    closed: number;
    draft: number;
    last_7_days: number;
    last_30_days: number;
  };
  applications: {
    total: number;
    pending: number;
    reviewed: number;
    accepted: number;
    rejected: number;
    last_7_days: number;
    last_30_days: number;
  };
  employer_applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  top_companies: TopCompany[];
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h2 className="mt-1 text-2xl font-bold text-white">{value}</h2>
      {helper ? <p className="mt-2 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch("/api/accounts/admin/analytics/overview/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load analytics.");
        }

        return data;
      })
      .then((data: AnalyticsResponse) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load analytics.");
        setLoading(false);
      });
  }, []);

  return (
    <AuthGuard
      allowedRoles={["admin"]}
      unauthorizedTitle="Admin Only"
      unauthorizedMessage="Only administrators can access analytics."
    >
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Admin Analytics</h1>
              <p className="mt-1 text-slate-300">
                Monitor users, jobs, applications, and employer onboarding.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/employer-applications"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Employer Reviews
              </Link>
              <Link
                href="/"
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
              >
                Back to Home
              </Link>
            </div>
          </div>

          {loading ? (
            <StatusCard
              title="Loading Analytics"
              message="Please wait while analytics are being loaded."
              variant="info"
            />
          ) : error ? (
            <StatusCard title="Error" message={error} variant="error" />
          ) : !data ? (
            <StatusCard
              title="No Data"
              message="Analytics data is not available right now."
              variant="neutral"
            />
          ) : (
            <div className="space-y-6">
              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-100">Users</h2>
                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                  <MetricCard label="Total Users" value={data.users.total} />
                  <MetricCard label="Seekers" value={data.users.seekers} />
                  <MetricCard label="Employers" value={data.users.employers} />
                  <MetricCard label="Admins" value={data.users.admins} />
                  <MetricCard
                    label="New Users"
                    value={data.users.last_7_days}
                    helper={`Last 7 days • ${data.users.last_30_days} in 30 days`}
                  />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-100">Jobs</h2>
                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                  <MetricCard label="Total Jobs" value={data.jobs.total} />
                  <MetricCard label="Active Jobs" value={data.jobs.active} />
                  <MetricCard label="Closed Jobs" value={data.jobs.closed} />
                  <MetricCard label="Draft Jobs" value={data.jobs.draft} />
                  <MetricCard
                    label="New Jobs"
                    value={data.jobs.last_7_days}
                    helper={`Last 7 days • ${data.jobs.last_30_days} in 30 days`}
                  />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-100">Applications</h2>
                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                  <MetricCard label="Total Applications" value={data.applications.total} />
                  <MetricCard label="Pending" value={data.applications.pending} />
                  <MetricCard label="Reviewed" value={data.applications.reviewed} />
                  <MetricCard label="Accepted" value={data.applications.accepted} />
                  <MetricCard label="Rejected" value={data.applications.rejected} />
                  <MetricCard
                    label="New Applications"
                    value={data.applications.last_7_days}
                    helper={`Last 7 days • ${data.applications.last_30_days} in 30 days`}
                  />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-100">
                  Employer Onboarding
                </h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Employer Applications"
                    value={data.employer_applications.total}
                  />
                  <MetricCard label="Pending Review" value={data.employer_applications.pending} />
                  <MetricCard label="Approved" value={data.employer_applications.approved} />
                  <MetricCard label="Rejected" value={data.employer_applications.rejected} />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-100">Top Companies</h2>

                {data.top_companies.length === 0 ? (
                  <StatusCard
                    title="No Company Data"
                    message="No company job statistics are available yet."
                    variant="neutral"
                  />
                ) : (
                  <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                    <div className="space-y-3">
                      {data.top_companies.map((company) => (
                        <div
                          key={`${company.company_name}-${company.job_count}`}
                          className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
                        >
                          <span className="font-medium text-slate-100">
                            {company.company_name}
                          </span>
                          <span className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white">
                            {company.job_count} job{company.job_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}