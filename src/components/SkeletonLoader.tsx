import React from "react";

export const CitationCardSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading citation item..."
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse motion-reduce:animate-none"
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-slate-800" />
        <div className="h-5 w-16 rounded-full bg-slate-800" />
      </div>
      <div className="mt-3 h-3 w-48 rounded bg-slate-800/80" />
      <div className="mt-2 h-3 w-full rounded bg-slate-800/60" />
      <div className="mt-1 h-3 w-3/4 rounded bg-slate-800/60" />
      <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3">
        <div className="h-3 w-20 rounded bg-slate-800" />
        <div className="h-3 w-24 rounded bg-slate-800" />
      </div>
      <span className="sr-only">Loading citation item...</span>
    </div>
  );
};

export const CitationDetailSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading citation details..."
      className="space-y-6 animate-pulse motion-reduce:animate-none"
    >
      {/* Title & Badge */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-6 w-64 rounded bg-slate-800" />
            <div className="h-4 w-40 rounded bg-slate-800/80" />
          </div>
          <div className="h-8 w-24 rounded-xl bg-slate-800" />
        </div>

        {/* Quote Block Placeholder */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-2.5">
          <div className="h-3.5 w-full rounded bg-slate-800/90" />
          <div className="h-3.5 w-11/12 rounded bg-slate-800/90" />
          <div className="h-3.5 w-4/5 rounded bg-slate-800/90" />
        </div>

        {/* Metadata Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-16 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3" />
          <div className="h-16 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3" />
          <div className="h-16 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3" />
        </div>
      </div>

      {/* Audit History Placeholder */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <div className="h-5 w-36 rounded bg-slate-800" />
        <div className="h-12 w-full rounded-xl bg-slate-950/50" />
        <div className="h-12 w-full rounded-xl bg-slate-950/50" />
      </div>
      <span className="sr-only">Loading citation details...</span>
    </div>
  );
};

export const ClaimCardSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading claim badge..."
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse motion-reduce:animate-none space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-slate-800" />
        <div className="h-5 w-20 rounded-full bg-slate-800" />
      </div>
      <div className="h-3.5 w-5/6 rounded bg-slate-800/80" />
      <div className="h-3 w-1/2 rounded bg-slate-800/60" />
      <span className="sr-only">Loading claim badge...</span>
    </div>
  );
};
