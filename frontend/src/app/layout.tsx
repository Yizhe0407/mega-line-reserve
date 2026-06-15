import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New, Noto_Sans_TC, M_PLUS_1 } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import VerifyLIFF from "@/components/VerifyLIFF";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/components/theme-provider";
import SWRProvider from "@/components/SWRProvider";

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-zen-kaku",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-noto-sans-tc",
});

const mPlus1 = M_PLUS_1({
  subsets: ["latin"],
  variable: "--font-mplus1",
});

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
      <body className={`${zenKaku.variable} ${notoSansTC.variable} ${mPlus1.variable}`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SWRProvider>
            <VerifyLIFF />
            <main id="main-content" className="pb-16">
              {children}
            </main>
            <Navigation />
            <Toaster />
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
