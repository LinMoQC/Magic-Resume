import { Skeleton } from '@/components/ui/Skeleton';

export default function ResumeEditSkeleton() {
  return (
    <main className="flex flex-col lg:flex-row flex-1 h-screen bg-black text-white font-sans overflow-hidden relative">

      {/* Main Form Panel - Desktop Only */}
      <div className="hidden lg:block w-[300px] p-8 overflow-y-auto flex-shrink-0 border-r border-neutral-800">
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

      {/* Center Preview Panel - Visible on both, adopted for Mobile */}
      <div className="flex flex-1 min-w-0 flex-col items-center justify-center p-4 lg:p-8 bg-[#101010] relative">
        
        {/* Mobile Top Floating Buttons Skeleton */}
        <div className="lg:hidden absolute top-4 left-4 z-10">
           <Skeleton className="h-10 w-10 rounded-full bg-neutral-800" />
        </div>
        <div className="lg:hidden absolute top-4 left-1/2 -translate-x-1/2 z-10">
           <Skeleton className="h-10 w-10 rounded-full bg-neutral-800" />
        </div>
        <div className="lg:hidden absolute top-4 right-4 z-10">
           <Skeleton className="h-10 w-10 rounded-full bg-neutral-800" />
        </div>

        {/* Main Resume Paper Skeleton */}
        <div className="w-full max-w-4xl h-full flex items-center justify-center">
          <Skeleton className="w-full lg:w-[210mm] max-w-full aspect-[210/297] rounded-lg shadow-2xl opacity-50 lg:opacity-100" />
        </div>

        {/* Desktop Bottom Toolbar Logic */}
        <div className="hidden lg:flex items-center gap-3 mt-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

         {/* Mobile Bottom Dock Skeleton */}
         <div className="lg:hidden absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-full bg-neutral-900/80 border border-neutral-700 backdrop-blur-sm z-20">
            <Skeleton className="h-8 w-8 rounded-full bg-neutral-700" />
            <Skeleton className="h-8 w-8 rounded-full bg-neutral-700" />
            <Skeleton className="h-8 w-8 rounded-full bg-neutral-700" />
            <Skeleton className="h-8 w-8 rounded-full bg-neutral-700" />
         </div>
      </div>

      {/* Right Template Panel - Desktop Only */}
      <div className="hidden lg:block w-80 bg-black border-l border-neutral-800 p-6 flex-shrink-0 overflow-y-auto">
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