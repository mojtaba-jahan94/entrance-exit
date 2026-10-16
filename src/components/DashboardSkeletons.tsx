import React from 'react';
import { LiquidGlassCard } from './LiquidGlassCard';

export const ClockCardSkeleton: React.FC = () => {
  return (
    <LiquidGlassCard className="rounded-[32px] p-5 sm:p-7 shadow-2xl animate-pulse">
      <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
        <div className="w-full md:w-auto flex-1 space-y-3.5 text-center md:text-right">
          {/* Badge skeletons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className="h-6 w-36 rounded-full bg-[var(--surface-2)]" />
            <div className="h-6 w-44 rounded-full bg-[var(--surface-2)]/80" />
          </div>
          {/* Title & subtitle skeletons */}
          <div className="space-y-2">
            <div className="h-8 w-56 rounded-2xl bg-[var(--surface-2)] mx-auto md:mx-0" />
            <div className="h-4 w-72 max-w-full rounded-xl bg-[var(--surface-2)]/70 mx-auto md:mx-0" />
          </div>
          {/* Metric chips skeleton */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
            <div className="h-7 w-24 rounded-full bg-[var(--surface-2)]/80" />
            <div className="h-7 w-24 rounded-full bg-[var(--surface-2)]/80" />
            <div className="h-7 w-28 rounded-full bg-[var(--surface-2)]/80" />
          </div>
        </div>
        {/* Action card skeleton */}
        <div className="w-full md:w-72 h-36 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)]" />
      </div>
    </LiquidGlassCard>
  );
};

export const StatsCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <LiquidGlassCard
          key={i}
          className="rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 rounded-lg bg-[var(--surface-2)]" />
            <div className="h-7 w-7 rounded-xl bg-[var(--surface-2)]" />
          </div>
          <div className="space-y-1.5 my-2">
            <div className="h-7 w-16 rounded-xl bg-[var(--surface-2)]" />
            <div className="h-3 w-24 rounded-lg bg-[var(--surface-2)]/70" />
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--surface-2)]" />
        </LiquidGlassCard>
      ))}
    </div>
  );
};
