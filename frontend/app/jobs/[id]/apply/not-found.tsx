import StatusCard from "../../../../components/StatusCard";

export default function ApplyJobNotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-3xl">
        <StatusCard
          title="Job Not Found"
          message="This job does not exist or is no longer available for applications."
          variant="neutral"
          actionHref="/"
          actionLabel="Back to Jobs"
        />
      </div>
    </main>
  );
}