"use client";

import Link from "next/link";
import { useState } from "react";
import StatusCard from "../../components/StatusCard";
import { useRouter } from "next/navigation";


type AccountType = "seeker" | "employer";

type SeekerForm = {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
};

type EmployerForm = {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  company_registration_number: string;
  company_address: string;
  business_description: string;
  contact_person_name: string;
  contact_person_position: string;
  supporting_note: string;
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
    return "Something went wrong.";
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  const messages: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === "error") continue;

    if (Array.isArray(value)) {
      const joined = value
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
        .join(" ");
      messages.push(`${key}: ${joined}`);
    } else if (typeof value === "string") {
      messages.push(`${key}: ${value}`);
    }
  }

  return messages.length > 0 ? messages.join(" | ") : "Something went wrong.";
}

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>("seeker");
  const router = useRouter();

  const [seekerForm, setSeekerForm] = useState<SeekerForm>({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [employerForm, setEmployerForm] = useState<EmployerForm>({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    company_name: "",
    company_email: "",
    company_phone: "",
    company_website: "",
    company_registration_number: "",
    company_address: "",
    business_description: "",
    contact_person_name: "",
    contact_person_position: "",
    supporting_note: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSeekerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setSeekerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEmployerChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setEmployerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSeekerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (seekerForm.password !== seekerForm.confirm_password) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/accounts/register/seeker/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(seekerForm),
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(extractErrorMessage(data as Record<string, unknown>));
      }

      setSuccess(data?.message || "Account created successfully.");

      setSeekerForm({
        username: "",
        email: "",
        password: "",
        confirm_password: "",
      });

      setTimeout(() => {
        router.push(data?.redirect_to || "/login?registered=1");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmployerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (employerForm.password !== employerForm.confirm_password) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/accounts/register/employer/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employerForm),
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(extractErrorMessage(data as Record<string, unknown>));
      }

      setSuccess(data?.message || "Employer application submitted successfully.");

      setEmployerForm({
        username: "",
        email: "",
        password: "",
        confirm_password: "",
        company_name: "",
        company_email: "",
        company_phone: "",
        company_website: "",
        company_registration_number: "",
        company_address: "",
        business_description: "",
        contact_person_name: "",
        contact_person_position: "",
        supporting_note: "",
      });

      setTimeout(() => {
        router.push(data?.redirect_to || "/login?employer_pending=1");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Employer application failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex flex-col items-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
              SH
            </div>
            <span className="mt-2 text-lg font-semibold text-slate-100">
              SwiftHire
            </span>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
              SwiftHire is a modern hiring platform built to connect job seekers
              with their next opportunity and employers with their next valuable
              employee: quickly, clearly, and with less friction.
            </p>
          </div>

          <h1 className="text-4xl font-bold text-slate-100">Join SwiftHire</h1>

          <p className="mt-2 text-slate-300">
            Find your next job. Hire your next star. One click closer with SwiftHire.
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => {
                setAccountType("seeker");
                setError("");
                setSuccess("");
              }}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                accountType === "seeker"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              Job Seeker
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountType("employer");
                setError("");
                setSuccess("");
              }}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                accountType === "employer"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              Employer
            </button>
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

        {accountType === "seeker" ? (
          <form
            onSubmit={handleSeekerSubmit}
            className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
          >
            <div>
              <h2 className="text-2xl font-semibold text-slate-100">
                Job Seeker Sign Up
              </h2>
              <p className="mt-1 text-slate-300">
                Create your account and start applying for jobs.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={seekerForm.username}
                onChange={handleSeekerChange}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={seekerForm.email}
                onChange={handleSeekerChange}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={seekerForm.password}
                onChange={handleSeekerChange}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirm_password"
                value={seekerForm.confirm_password}
                onChange={handleSeekerChange}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Seeker Account"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleEmployerSubmit}
            className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
          >
            <div>
              <h2 className="text-2xl font-semibold text-slate-100">
                Employer Account Application
              </h2>
              <p className="mt-1 text-slate-300">
                Submit your company details for admin review and approval.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={employerForm.username}
                  onChange={handleEmployerChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={employerForm.email}
                  onChange={handleEmployerChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={employerForm.password}
                  onChange={handleEmployerChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={employerForm.confirm_password}
                  onChange={handleEmployerChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={employerForm.company_name}
                  onChange={handleEmployerChange}
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
                  name="company_email"
                  value={employerForm.company_email}
                  onChange={handleEmployerChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Company email"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Company Phone
                </label>
                <input
                  type="text"
                  name="company_phone"
                  value={employerForm.company_phone}
                  onChange={handleEmployerChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Company phone"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Company Website
                </label>
                <input
                  type="url"
                  name="company_website"
                  value={employerForm.company_website}
                  onChange={handleEmployerChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Company Registration Number
              </label>
              <input
                type="text"
                name="company_registration_number"
                value={employerForm.company_registration_number}
                onChange={handleEmployerChange}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Registration number"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Company Address
              </label>
              <textarea
                name="company_address"
                value={employerForm.company_address}
                onChange={handleEmployerChange}
                required
                rows={3}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Company address"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Business Description
              </label>
              <textarea
                name="business_description"
                value={employerForm.business_description}
                onChange={handleEmployerChange}
                required
                rows={4}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Describe the company and what it does"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  name="contact_person_name"
                  value={employerForm.contact_person_name}
                  onChange={handleEmployerChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Contact Person Position
                </label>
                <input
                  type="text"
                  name="contact_person_position"
                  value={employerForm.contact_person_position}
                  onChange={handleEmployerChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="e.g. HR Manager"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Supporting Note
              </label>
              <textarea
                name="supporting_note"
                value={employerForm.supporting_note}
                onChange={handleEmployerChange}
                rows={4}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Any additional details for admin review"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Submitting Application..." : "Submit Employer Application"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-300">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-400 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}