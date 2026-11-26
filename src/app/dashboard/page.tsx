import type { Metadata } from "next";
import Dashboard from "@/components/Admin/Dashboard";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: NOINDEX_ROBOTS,
};

export default function Page() {
  return <Dashboard />;
}