"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Wrench, Settings, ArrowRight, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { isAdmin, isLoading, error } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <div className="w-12 h-12 bg-muted rounded-xl" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive">權限不足</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
             <p className="text-muted-foreground">此頁面僅提供管理員使用。</p>
            <Link 
              href="/" 
              className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-8 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              回首頁
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuItems = [
    {
      title: "服務管理",
      description: "設定服務項目、價格與時長說明",
      icon: Wrench,
      href: "/admin/services",
    },
    {
      title: "時段管理",
      description: "規劃每週營業時間與預約空檔",
      icon: Calendar,
      href: "/admin/time-slots",
    },
  ];

  return (
    <div className="pb-20">
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">功能總覽</h2>
          <p className="text-muted-foreground mt-1">
            選擇下方項目以開始管理您的預約系統
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <AlertTitle>錯誤</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-foreground/20 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl bg-secondary group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
                
                <div className="mt-5 space-y-2">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
