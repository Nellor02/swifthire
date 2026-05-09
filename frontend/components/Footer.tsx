import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            SwiftHire
          </p>
          <p className="mt-1 text-sm text-slate-400">
            © {currentYear} SwiftHire. All rights reserved.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Contact:{" "}
            <a
              href="mailto:support@useswifthire.com"
              className="text-blue-400 hover:text-blue-300 hover:underline"
            >
              support@useswifthire.com
            </a>
          </p>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm">
          <Link href="/about" className="text-slate-300 hover:text-blue-400">
            About
          </Link>
          <Link href="/contact" className="text-slate-300 hover:text-blue-400">
            Contact
          </Link>
          <Link href="/privacy" className="text-slate-300 hover:text-blue-400">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-slate-300 hover:text-blue-400">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}