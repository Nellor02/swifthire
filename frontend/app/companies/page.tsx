"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import StatusCard from "../../components/StatusCard";

type Company = {
  id: number;
  owner: number;
  owner_username: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description: string;
  jobs_count: number;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function truncateText(text?: string, maxLength = 220) {
  if (!text) return "No company description provided.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch("http://127.0.0.1:8000/api/companies/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load companies.");
        }

        return data;
      })
      .then((data: Company[]) => {
        setCompanies(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load companies.");
        setLoading(false);
      });
  }, []);

  const filteredCompanies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return companies;

    return companies.filter((company) => {
      const haystack = [
        company.name,
        company.description,
        company.address,
        company.website,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [companies, searchTerm]);

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-100">
              Company Directory
            </h1>
            <p className="mt-2 text-slate-300">
              Explore companies hiring through SwiftHire.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Home
          </Link>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <StatusCard
            title="Loading Companies"
            message="Please wait while companies are loading."
            variant="info"
          />
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : filteredCompanies.length === 0 ? (
          <StatusCard
            title="No Companies Found"
            message={
              searchTerm.trim()
                ? "No companies matched your search."
                : "No companies are available yet."
            }
            variant="neutral"
          />
        ) : (
          <div className="grid gap-4">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/companies/${company.id}`}
                      className="text-2xl font-semibold text-blue-400 hover:underline"
                    >
                      {company.name}
                    </Link>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                      <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                        Jobs: {company.jobs_count}
                      </span>

                      <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                        {company.address || "No address"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                        About
                      </h3>
                      <p className="whitespace-pre-line text-slate-200">
                        {truncateText(company.description)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 md:ml-6">
                    <Link
                      href={`/companies/${company.id}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      View Company
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}