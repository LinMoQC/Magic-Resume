import metaConfig from "@/lib/constants/metaConfig";
import { Metadata } from "next";

export const metadata: Metadata = metaConfig.Edit;

export default function EditLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-desk text-white overflow-hidden">
            {children}
        </div>
    );
}