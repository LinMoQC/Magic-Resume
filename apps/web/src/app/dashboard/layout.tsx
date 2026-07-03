import { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardSidebar from "./_components/DashboardSidebar";
import AccountUiHost from "@/components/providers/AccountUiHost";
import metaConfig from "@/lib/constants/metaConfig";
import { isCloudMode } from "@/lib/config/app";
import { hasBetaAccess } from "@/lib/auth/betaAccess";

export const metadata: Metadata = metaConfig.Dashboard;

// Beta gate for the whole app: signed-in-but-not-whitelisted users are sent to
// the coming-soon page. Middleware still handles "signed-out → Clerk"; this
// single server-component guard covers all of /dashboard/*.
export default async function DashboardLayout({
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  if (isCloudMode && !(await hasBetaAccess())) redirect("/coming-soon");
  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
        {modal}
      </div>
      {/* Global settings + account overlays (cover dashboard and editor) */}
      <AccountUiHost />
    </div>
  );
}
