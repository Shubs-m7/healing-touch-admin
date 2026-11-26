import type { Metadata } from "next";
import AdminShell from "@/components/Admin/AdminShell";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Admin Portal",
  robots: NOINDEX_ROBOTS,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
