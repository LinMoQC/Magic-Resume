import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isCloudMode } from "@/lib/config/app";
import { hasBetaAccess } from "@/lib/auth/betaAccess";
import { getRolloutConfig } from "@/lib/config/rollout";
import ComingSoon from "./ComingSoon";

export const metadata: Metadata = {
  title: "Coming Soon · Magic Resume",
  robots: { index: false, follow: false },
};

// Requires a signed-in user (middleware also enforces this). Self-hosted has no
// gate, and whitelisted/admin users belong in the app → bounce to /dashboard.
// Only signed-in, non-whitelisted cloud users see the countdown.
export default async function ComingSoonPage() {
  if (!isCloudMode) redirect("/dashboard");

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (await hasBetaAccess()) redirect("/dashboard");

  const { launchAt, waitlistUrl, contactEmail } = await getRolloutConfig();
  return (
    <ComingSoon
      launchAt={launchAt}
      waitlistUrl={waitlistUrl}
      contactEmail={contactEmail}
    />
  );
}
