import type { Metadata } from "next";
import "./globals.css";
import { getAppName, getAppTagline } from "@/lib/app-brand";

const appName = getAppName();
const appTagline = getAppTagline();

export const metadata: Metadata = {
  title: `${appName} CRM`,
  description: `${appTagline} for ${appName}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem("huff-theme");
                  var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  var preferDark = stored === "dark" || (stored !== "light" && stored !== "dark" && systemDark);
                  document.documentElement.classList.toggle("dark", preferDark);
                  document.documentElement.style.colorScheme = preferDark ? "dark" : "light";
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
