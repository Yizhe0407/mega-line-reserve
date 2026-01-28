"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import liff from "@line/liff";
import { ArrowLeft, Settings, Wrench, ShieldCheck, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const handleUnauthorized = () => {
      // 收到 401 事件時，強制登出並重新整理
      try {
        if (liff.isLoggedIn()) {
          liff.logout();
        }
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        window.location.reload();
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const getHeaderConfig = () => {
    switch (pathname) {
      case "/admin/services":
        return {
          title: "服務管理",
          icon: Wrench,
          showBack: true,
          maxWidth: "max-w-7xl",
        };
      case "/admin/time-slots":
        return {
          title: "時段管理",
          icon: Calendar,
          showBack: true,
          maxWidth: "max-w-7xl",
          extra: (
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
              <span className="font-medium">設定每週固定可預約時段</span>
            </div>
          ),
        };
      default:
        // Default to dashboard
        return {
          title: "管理後台",
          icon: Settings,
          showBack: false,
          maxWidth: "max-w-5xl",
          extra: (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-medium">管理員已登入</span>
            </div>
          ),
        };
    }
  };

  const config = getHeaderConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className={cn("mx-auto px-4 md:px-6", config.maxWidth)}>
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {config.showBack ? (
                <Link
                  href="/admin"
                  className="w-8 h-8 -ml-2 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="返回"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              ) : null}
              
              <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center shadow-sm">
                <Icon className="w-4.5 h-4.5 text-background" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">{config.title}</h1>
            </div>
            {config.extra}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
