import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Adaptus Clinic — Admin Portal",
    template: "%s | Adaptus Admin",
  },
  description: "Internal clinic administration portal.",
  robots: NOINDEX_ROBOTS,
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
