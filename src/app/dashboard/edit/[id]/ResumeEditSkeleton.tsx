import { Skeleton } from '@/components/ui/Skeleton';

export default function ResumeEditSkeleton() {
  return (
    <main className="flex flex-1 h-screen bg-black text-white font-sans">

      {/* Main Form Panel */}
      <div className="w-[300px] p-8 overflow-y-auto flex-shrink-0">
        <div className="mb-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
            <div className="w-full space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-12 w-full rounded-lg border border-dashed border-neutral-700" />
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-end gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Center Preview Panel */}
      <div className="flex-1 min-w-[500px] flex flex-col items-center justify-center p-8 bg-[#101010]">
        <div className="w-full max-w-4xl">
          <Skeleton className="w-full aspect-[210/297] rounded-lg" />
        </div>
        <div className="flex items-center gap-3 mt-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Right Template Panel */}
      <div className="w-80 bg-black border-l border-neutral-800 p-6 flex-shrink-0">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[210/297] rounded-md" />
          ))}
        </div>
      </div>
    </main>
  );
} 