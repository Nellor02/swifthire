"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "../../../lib/api";
import { getStoredUser } from "../../../lib/auth";
import StatusCard from "../../../components/StatusCard";

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

type EmployerApplicationStatus = {
  status: string;
  legacy_account?: boolean;
};

type CompanyFormData = {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description: string;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function extractErrorMessage(data: Record<string, unknown>) {
  if (!data || typeof data !== "object") {
    return "Failed to update company profile.";
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  const fieldMessages: string[] = [];

  for (const [field, value] of Object.entries(data)) {
    if (field === "error") continue;

    if (Array.isArray(value)) {
      const joined = value
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
        .join(" ");
      fieldMessages.push(`${field}: ${joined}`);
    } else if (typeof value === "string") {
      fieldMessages.push(`${field}: ${value}`);
    }
  }

  return fieldMessages.length > 0
    ? fieldMessages.join(" | ")
    : "Failed to update company profile.";
}

export default function EmployerCompanyPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);
  const [isApprovedEmployer, setIsApprovedEmployer] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState(true);

  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const user = getStoredUser();

    setUserChecked(true);

    if (!user) {
      setIsLoggedIn(false);
      setIsEmployer(false);
      setLoading(false);
      setApprovalLoading(false);
      return;
    }

    setIsLoggedIn(true);

    if (user.role !== "employer") {
      setIsEmployer(false);
      setLoading(false);
      setApprovalLoading(false);
      return;
    }

    setIsEmployer(true);

    authFetch("http://127.0.0.1:8000/api/accounts/employer-application/me/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          setIsApprovedEmployer(true);
          setApprovalLoading(false);
          return;
        }

        const typed = data as EmployerApplicationStatus;

        if (typed.legacy_account || typed.status === "approved") {
          setIsApprovedEmployer(true);
        } else {
          setIsApprovedEmployer(false);
        }

        setApprovalLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsApprovedEmployer(true);
        setApprovalLoading(false);
      });
  }, []);

  useEffect(() => {
    if (
      !userChecked ||
      !isLoggedIn ||
      !isEmployer ||
      approvalLoading ||
      !isApprovedEmployer
    ) {
      if (!approvalLoading && !isApprovedEmployer) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError("");

    authFetch("http://127.0.0.1:8000/api/companies/me/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load company profile.");
        }

        return data;
      })
      .then((data: Company) => {
        setCompany(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          website: data.website || "",
          address: data.address || "",
          description: data.description || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Could not load company profile."
        );
        setLoading(false);
      });
  }, [userChecked, isLoggedIn, isEmployer, approvalLoading, isApprovedEmployer]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch("http://127.0.0.1:8000/api/companies/me/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(extractErrorMessage(data as Record<string, unknown>));
      }

      const updated = data as Company;

      setCompany(updated);
      setFormData({
        name: updated.name || "",
        email: updated.email || "",
        phone: updated.phone || "",
        website: updated.website || "",
        address: updated.address || "",
        description: updated.description || "",
      });

      setSuccess("Company profile updated successfully.");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to update company profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!userChecked || approvalLoading) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Checking Account Status"
            message="Please wait while we verify your employer account."
            variant="info"
          />
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to manage your company profile."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  if (!isEmployer) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Access Restricted"
            message="Only employers can manage company profiles."
            variant="error"
            actionHref="/"
            actionLabel="Back to Home"
          />
        </div>
      </main>
    );
  }

  if (!isApprovedEmployer) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Employer Access Locked"
            message="Your employer account is pending approval or has been rejected. You cannot manage a company profile until approved."
            variant="warning"
            actionHref="/employer/application-status"
            actionLabel="View Application Status"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Company Profile
            </h1>
            <p className="mt-1 text-slate-300">
              Manage your public company information on SwiftHire.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {company && (
              <Link
                href={`/companies/${company.id}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View Public Profile
              </Link>
            )}

            <Link
              href="/employer/jobs"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Employer Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <StatusCard title="Error" message={error} variant="error" />
          </div>
        )}

        {success && (
          <div className="mb-6">
            <StatusCard title="Success" message={success} variant="success" />
          </div>
        )}

        {loading ? (
          <StatusCard
            title="Loading Company Profile"
            message="Please wait while your company profile is loading."
            variant="info"
          />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Company Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Company Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="company@example.com"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Company phone"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Company address"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Describe your company, culture, and what you do..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Company Profile"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}