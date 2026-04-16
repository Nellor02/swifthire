const SAVED_JOBS_KEY = "saved_jobs";

export function getSavedJobs(): number[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(SAVED_JOBS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isJobSaved(jobId: number): boolean {
  return getSavedJobs().includes(jobId);
}

export function saveJob(jobId: number) {
  const current = getSavedJobs();

  if (!current.includes(jobId)) {
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify([...current, jobId]));
  }
}

export function unsaveJob(jobId: number) {
  const current = getSavedJobs();
  const updated = current.filter((id) => id !== jobId);
  localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(updated));
}

export function toggleSavedJob(jobId: number) {
  if (isJobSaved(jobId)) {
    unsaveJob(jobId);
  } else {
    saveJob(jobId);
  }
}