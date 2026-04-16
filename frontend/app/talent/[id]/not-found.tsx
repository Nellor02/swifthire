import StatusCard from "../../../components/StatusCard";

export default function TalentProfileNotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-3xl">
        <StatusCard
          title="Talent Profile Not Found"
          message="This talent profile does not exist or is no longer available."
          variant="neutral"
          actionHref="/talent"
          actionLabel="Back to Talent Search"
        />
      </div>
    </main>
  );
}