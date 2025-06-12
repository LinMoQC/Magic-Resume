import { Skeleton } from "Skeleton";

const DashboardSkeleton = () => {
    return (
        <div className="flex h-screen bg-black text-white">
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">
            <Skeleton className="h-10 w-48" />
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="aspect-square w-full" />
          </div>
        </div>
      </div>
    );
};

export default DashboardSkeleton; 