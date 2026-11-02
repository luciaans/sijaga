import { requireRole } from "@/lib/auth/profile";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireRole();
  return <DashboardShell profile={profile} title="Sistem Kedisiplinan Santri">{children}</DashboardShell>;
}
