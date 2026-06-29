import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Route 53",
  description: "Route 53 Clone — DNS Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
