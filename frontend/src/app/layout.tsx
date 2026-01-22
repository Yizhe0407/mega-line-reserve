import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import VerifyLIFF from "@/components/VerifyLIFF";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "兆豐預約",
  description: "兆豐預約系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <VerifyLIFF />
          <main id="main-content" className="pb-16">
            {children}
          </main>
          <Navigation />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
