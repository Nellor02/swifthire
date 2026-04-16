"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StoredUser = {
  username: string;
  role: string;
};

export default function ApplyNowButton({ jobId }: { jobId: number }) {
  const [checked, setChecked] = useState(false);
  const [showApply, setShowApply] = useState(true);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");

      if (rawUser) {
        const user: StoredUser = JSON.parse(rawUser);

        if (user.role === "employer" || user.role === "admin") {
          setShowApply(false);
        }
      }
    } catch {
      setShowApply(true);
    } finally {
      setChecked(true);
    }
  }, []);

  if (!checked) {
    return <div className="min-h-[48px]" />;
  }

  if (!showApply) {
    return <div className="min-h-[48px]" />;
  }

  return (
    <Link
      href={`/jobs/${jobId}/apply`}
      className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
    >
      Apply Now
    </Link>
  );
}