import { Skeleton } from "@/components/ui/Skeleton";

const DashboardSkeleton = () => {
    return (
        <div className="flex-1 flex flex-col px-12 py-10">
            <div className="flex items-center justify-between mb-8">
                <Skeleton className="h-10 w-48 rounded" />
            </div>
            <div className="grid grid-cols-4 gap-8">
                {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-64 bg-neutral-900/50 rounded-lg p-4 flex flex-col justify-center items-center">
                        <Skeleton className="h-16 w-16 rounded-full mb-4" />
                        <Skeleton className="h-4 w-3/4 rounded-md mb-2" />
                        <Skeleton className="h-3 w-1/2 rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardSkeleton; 