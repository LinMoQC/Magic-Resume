import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardSkeleton() {
  return (
    <main className="flex-1 flex flex-col px-12 py-10">
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 flex flex-col">
            <Skeleton className="flex-1 w-full" />
            <div className="mt-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
} 