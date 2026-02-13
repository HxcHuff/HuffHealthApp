import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HuffHealth CRM",
  description: "CRM & Client Portal for HuffHealth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
