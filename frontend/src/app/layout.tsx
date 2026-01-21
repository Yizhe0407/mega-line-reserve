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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <VerifyLIFF />
          <main className="pb-16">{children}</main>
          <Navigation />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
