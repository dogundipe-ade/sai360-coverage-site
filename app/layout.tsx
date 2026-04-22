import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAI360 · Regulatory Coverage",
  description:
    "Explore the regulators, rulebooks, and exchanges in the SAI360 regulatory content universe.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
