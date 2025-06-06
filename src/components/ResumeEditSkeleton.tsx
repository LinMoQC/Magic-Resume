import { Skeleton } from "@/components/ui/Skeleton";

export default function ResumeEditSkeleton() {
  return (
    <div className="flex h-full w-full">
      {/* Left Panel Skeleton */}
      <div className="w-1/3 border-r border-neutral-800 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-24 rounded-md" />
        </div>
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        
        <div className="mt-4 border-t border-neutral-800 pt-4">
            <Skeleton className="h-8 w-full rounded-md mb-3" />
            <Skeleton className="h-8 w-full rounded-md mb-3" />
            <Skeleton className="h-8 w-full rounded-md mb-3" />
        </div>

        <div className="mt-auto flex gap-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Middle Panel Skeleton */}
      <div className="w-1/3 flex items-center justify-center p-8">
        <div className="w-full h-full bg-neutral-800/50 rounded-lg p-8">
            <div className="flex justify-center mb-6">
                <Skeleton className="h-10 w-48 rounded-md" />
            </div>
            <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
            </div>
            <Skeleton className="h-6 w-32 rounded-md my-4" />
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-16 w-full rounded-md" />
            </div>
        </div>
      </div>

      {/* Right Panel Skeleton */}
      <div className="w-1/3 border-l border-neutral-800 p-6">
        <Skeleton className="h-6 w-32 rounded-md mb-6" />
        <div className="grid grid-cols-2 gap-4">
            <Skeleton className="aspect-square w-full rounded-md" />
            <Skeleton className="aspect-square w-full rounded-md" />
            <Skeleton className="aspect-square w-full rounded-md" />
            <Skeleton className="aspect-square w-full rounded-md" />
        </div>
      </div>
    </div>
  );
} 