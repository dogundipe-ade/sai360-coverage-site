import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "./components/SiteNav";
import { CartProvider } from "@/lib/cart";

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
      <body>
        <CartProvider>
          <SiteNav />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
