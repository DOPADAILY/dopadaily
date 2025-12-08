'use client'

// Reusable skeleton primitives
export function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-linear-to-r from-border via-backplate to-border bg-size-[200%_100%] rounded ${className}`} />
  )
}

// Page header skeleton (consistent across all pages)
export function PageHeaderSkeleton() {
  return (
    <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
      <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
        {/* Mobile menu button placeholder */}
        <div className="lg:hidden">
          <SkeletonPulse className="h-9 w-9 rounded-lg" />
        </div>
        {/* Title area */}
        <div className="flex-1 space-y-1">
          <SkeletonPulse className="h-5 w-32" />
          <SkeletonPulse className="h-3 w-48 hidden sm:block" />
        </div>
        {/* User menu */}
        <SkeletonPulse className="h-9 w-9 rounded-full" />
      </div>
    </header>
  )
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* <PageHeaderSkeleton /> */}
      <div className="">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-3 mb-3">
                <SkeletonPulse className="h-10 w-10 rounded-lg" />
                <SkeletonPulse className="h-4 w-20" />
              </div>
              <SkeletonPulse className="h-8 w-16 mb-1" />
              <SkeletonPulse className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick actions */}
            <div className="card">
              <SkeletonPulse className="h-5 w-32 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <SkeletonPulse key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            </div>
            {/* Activity */}
            <div className="card">
              <SkeletonPulse className="h-5 w-40 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonPulse className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <SkeletonPulse className="h-4 w-3/4" />
                      <SkeletonPulse className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="card">
              <SkeletonPulse className="h-5 w-28 mb-4" />
              <SkeletonPulse className="h-32 rounded-lg mb-4" />
              <SkeletonPulse className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Notes skeleton
export function NotesSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* <PageHeaderSkeleton /> */}
      <div className="">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <SkeletonPulse className="flex-1 h-10 rounded-lg w-full sm:w-auto" />
          <div className="flex gap-3 w-full sm:w-auto">
            <SkeletonPulse className="h-10 w-40 rounded-lg" />
            <SkeletonPulse className="h-10 w-28 rounded-lg" />
          </div>
        </div>

        {/* Notes grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border-2 border-border p-4 bg-surface-elevated">
              <div className="flex items-center gap-2 mb-3">
                <SkeletonPulse className="h-5 w-16 rounded-full" />
              </div>
              <SkeletonPulse className="h-5 w-3/4 mb-2" />
              <div className="space-y-1">
                <SkeletonPulse className="h-3 w-full" />
                <SkeletonPulse className="h-3 w-5/6" />
                <SkeletonPulse className="h-3 w-4/6" />
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <SkeletonPulse className="h-3 w-16" />
                <div className="flex gap-1">
                  <SkeletonPulse className="h-6 w-6 rounded" />
                  <SkeletonPulse className="h-6 w-6 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Focus Timer skeleton
export function FocusSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* <PageHeaderSkeleton /> */}
      <div className="flex flex-col items-center justify-center py-12 px-4">
        {/* Mode toggles */}
        <SkeletonPulse className="h-14 w-full max-w-md rounded-xl mb-10" />

        {/* Timer circle */}
        <div className="relative w-[340px] h-[340px] flex items-center justify-center mb-10">
          <div className="absolute inset-0 rounded-full border-12 border-border" />
          <div className="text-center">
            <SkeletonPulse className="h-16 w-40 mx-auto mb-2" />
            <SkeletonPulse className="h-4 w-24 mx-auto" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 items-center mb-10">
          <SkeletonPulse className="h-16 w-16 rounded-full" />
          <SkeletonPulse className="h-12 w-12 rounded-full" />
        </div>

        {/* Session info */}
        <div className="text-center">
          <SkeletonPulse className="h-3 w-24 mx-auto mb-2" />
          <SkeletonPulse className="h-6 w-20 mx-auto" />
        </div>
      </div>
    </div>
  )
}

// Sounds skeleton
export function SoundsSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* <PageHeaderSkeleton /> */}
      <div className="">
        {/* Filter */}
        <div className="flex justify-between items-center mb-6">
          <SkeletonPulse className="h-5 w-32" />
          <SkeletonPulse className="h-10 w-40 rounded-lg" />
        </div>

        {/* Sounds grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card group">
              <div className="flex items-center gap-4">
                <SkeletonPulse className="h-14 w-14 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <SkeletonPulse className="h-4 w-3/4" />
                  <SkeletonPulse className="h-3 w-1/2" />
                </div>
                <SkeletonPulse className="h-10 w-10 rounded-full shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Achievements skeleton
export function AchievementsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* <PageHeaderSkeleton /> */}
      <div className="">
        {/* Progress header */}
        <div className="card mb-8">
          <div className="flex items-center gap-4 mb-4">
            <SkeletonPulse className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-5 w-48" />
              <SkeletonPulse className="h-3 w-32" />
            </div>
          </div>
          <SkeletonPulse className="h-3 w-full rounded-full" />
        </div>

        {/* Achievements grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-start gap-4">
                <SkeletonPulse className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="h-4 w-3/4" />
                  <SkeletonPulse className="h-3 w-full" />
                  <SkeletonPulse className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Forum skeleton
export function ForumSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* <PageHeaderSkeleton /> */}
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search bar */}
            <SkeletonPulse className="h-10 w-full rounded-lg mb-4" />

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <SkeletonPulse key={i} className="h-9 w-24 rounded-lg shrink-0" />
              ))}
            </div>

            {/* Posts */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card">
                <div className="flex items-start gap-3">
                  <SkeletonPulse className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonPulse className="h-5 w-3/4" />
                    <SkeletonPulse className="h-3 w-full" />
                    <SkeletonPulse className="h-3 w-5/6" />
                    <div className="flex items-center gap-4 mt-3">
                      <SkeletonPulse className="h-3 w-16" />
                      <SkeletonPulse className="h-3 w-20" />
                      <SkeletonPulse className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <SkeletonPulse className="h-5 w-32 mb-4" />
              <SkeletonPulse className="h-10 w-full rounded-lg" />
            </div>
            <div className="card">
              <SkeletonPulse className="h-5 w-28 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <SkeletonPulse className="h-6 w-6 rounded" />
                    <SkeletonPulse className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reminders skeleton
export function RemindersSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* <PageHeaderSkeleton /> */}
      <div className="">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Reminders list */}
          <div className="xl:col-span-2 space-y-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SkeletonPulse className="h-5 w-5 rounded" />
                <SkeletonPulse className="h-5 w-24" />
                <SkeletonPulse className="h-5 w-6 rounded-full" />
              </div>
              <SkeletonPulse className="h-9 w-20 rounded-lg xl:hidden" />
            </div>

            {/* Reminder cards */}
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <SkeletonPulse className="h-5 w-16 rounded" />
                      </div>
                      <SkeletonPulse className="h-5 w-3/4" />
                      <SkeletonPulse className="h-3 w-full" />
                      <SkeletonPulse className="h-3 w-32" />
                    </div>
                    <div className="flex gap-1">
                      <SkeletonPulse className="h-8 w-8 rounded-lg" />
                      <SkeletonPulse className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create form sidebar */}
          <div className="hidden xl:block">
            <div className="card h-fit">
              <div className="flex items-center gap-3 mb-6">
                <SkeletonPulse className="h-10 w-10 rounded-lg" />
                <SkeletonPulse className="h-6 w-36" />
              </div>
              <div className="space-y-5">
                <div>
                  <SkeletonPulse className="h-4 w-12 mb-2" />
                  <SkeletonPulse className="h-10 w-full rounded-lg" />
                </div>
                <div>
                  <SkeletonPulse className="h-4 w-20 mb-2" />
                  <SkeletonPulse className="h-20 w-full rounded-lg" />
                </div>
                <div>
                  <SkeletonPulse className="h-4 w-24 mb-2" />
                  <SkeletonPulse className="h-10 w-full rounded-lg" />
                </div>
                <SkeletonPulse className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings skeleton
export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* <PageHeaderSkeleton /> */}
      <div className="max-w-4xl">
        {/* Profile section */}
        <div className="card mb-6">
          <SkeletonPulse className="h-6 w-24 mb-6" />
          <div className="flex items-center gap-4 mb-6">
            <SkeletonPulse className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <SkeletonPulse className="h-5 w-32" />
              <SkeletonPulse className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <SkeletonPulse className="h-4 w-20 mb-2" />
              <SkeletonPulse className="h-10 w-full rounded-lg" />
            </div>
            <div>
              <SkeletonPulse className="h-4 w-16 mb-2" />
              <SkeletonPulse className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Preferences section */}
        <div className="card mb-6">
          <SkeletonPulse className="h-6 w-28 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="space-y-1">
                  <SkeletonPulse className="h-4 w-32" />
                  <SkeletonPulse className="h-3 w-48" />
                </div>
                <SkeletonPulse className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Timer settings */}
        <div className="card">
          <SkeletonPulse className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <SkeletonPulse className="h-4 w-28 mb-2" />
              <SkeletonPulse className="h-10 w-full rounded-lg" />
            </div>
            <div>
              <SkeletonPulse className="h-4 w-24 mb-2" />
              <SkeletonPulse className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Admin skeleton
export function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* <PageHeaderSkeleton /> */}
      <div className="">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <SkeletonPulse className="h-4 w-20 mb-2" />
              <SkeletonPulse className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <SkeletonPulse className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <SkeletonPulse className="h-8 w-8 rounded-full" />
                  <SkeletonPulse className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <SkeletonPulse className="h-5 w-28 mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <SkeletonPulse key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Generic card skeleton (for backwards compatibility)
export default function SkeletonLoader({ type = 'card' }: { type?: 'card' | 'list' | 'table' | 'stat' }) {
  if (type === 'card') {
    return (
      <div className="card space-y-4">
        <SkeletonPulse className="h-4 w-3/4" />
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-5/6" />
        <SkeletonPulse className="h-10 w-32 mt-4" />
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-surface-elevated border border-border rounded-lg">
            <SkeletonPulse className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-3/4" />
              <SkeletonPulse className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'stat') {
    return (
      <div className="card">
        <SkeletonPulse className="h-4 w-24 mb-4" />
        <div className="h-px bg-border mb-6" />
        <SkeletonPulse className="h-12 w-20" />
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="bg-backplate px-4 py-3 border-b border-border">
          <div className="flex gap-4">
            <SkeletonPulse className="h-3 w-32" />
            <SkeletonPulse className="h-3 w-32" />
            <SkeletonPulse className="h-3 w-32" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <SkeletonPulse className="h-4 w-40" />
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  return null
}
