import { Skeleton } from '@/components/ui/Skeleton';

export default function ResumeEditSkeleton() {
  return (
    <main className="flex min-h-screen bg-black text-white">
      {/* Sidebar Skeleton */}
      <aside className="w-48 p-4 bg-black border-r border-neutral-800">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-9 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        {/* Form Section Skeleton */}
        <div className="space-y-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-32 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
          
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-8 w-40 mb-4" />
              <div className="border border-neutral-800 rounded-lg p-4">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Preview Panel Skeleton */}
      <div className="w-96 bg-black border-l border-neutral-800 p-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <Skeleton className="w-full aspect-[210/297] rounded-md" />
      </div>

      {/* Right Template Panel Skeleton */}
      <aside className="w-12 bg-black border-l border-neutral-800 p-4">
        <Skeleton className="h-8 w-full" />
      </aside>
    </main>
  );
} 