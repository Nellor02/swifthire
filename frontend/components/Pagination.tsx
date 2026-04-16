type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <button
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      <p className="text-sm text-slate-300">
        Page {currentPage} of {totalPages}
      </p>

      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}