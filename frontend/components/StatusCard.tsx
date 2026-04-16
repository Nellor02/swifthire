import Link from "next/link";
import { ReactNode } from "react";

type StatusCardProps = {
  title: string;
  message: string;
  variant?: "info" | "warning" | "error" | "success" | "neutral";
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
};

function getVariantClasses(variant: StatusCardProps["variant"] = "neutral") {
  switch (variant) {
    case "info":
      return "border-blue-700 bg-blue-900/40 text-blue-200";
    case "warning":
      return "border-yellow-700 bg-yellow-900/40 text-yellow-200";
    case "error":
      return "border-red-700 bg-red-900/40 text-red-200";
    case "success":
      return "border-green-700 bg-green-900/40 text-green-200";
    case "neutral":
    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

function getButtonClasses(variant: StatusCardProps["variant"] = "neutral") {
  switch (variant) {
    case "info":
      return "bg-blue-600 text-white hover:bg-blue-700";
    case "warning":
      return "bg-yellow-500 text-black hover:bg-yellow-400";
    case "error":
      return "bg-red-600 text-white hover:bg-red-700";
    case "success":
      return "bg-green-600 text-white hover:bg-green-700";
    case "neutral":
    default:
      return "bg-slate-700 text-slate-100 hover:bg-slate-600";
  }
}

export default function StatusCard({
  title,
  message,
  variant = "neutral",
  actionHref,
  actionLabel,
  children,
}: StatusCardProps) {
  return (
    <div className={`rounded-xl border p-6 ${getVariantClasses(variant)}`}>
      <h2 className="text-xl font-semibold">{title}</h2>

      <p className="mt-2 text-sm">
        {message}
      </p>

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className={`mt-4 inline-block rounded-lg px-5 py-3 text-sm font-semibold ${getButtonClasses(
            variant
          )}`}
        >
          {actionLabel}
        </Link>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}