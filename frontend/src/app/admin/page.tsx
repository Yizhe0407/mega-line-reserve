"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Wrench } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { isAdmin, isLoading, error } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>管理後台</CardTitle>
          </CardHeader>
          <CardContent>載入中...</CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>管理後台</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>權限不足</AlertTitle>
              <AlertDescription>此頁面僅提供管理員使用。</AlertDescription>
            </Alert>
            <Button asChild>
              <Link href="/">回首頁</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuItems = [
    {
      title: "服務管理",
      description: "管理服務項目、價格與時長",
      icon: Wrench,
      href: "/admin/services",
      color: "text-blue-500",
    },
    {
      title: "時段管理",
      description: "設定每週可預約時段",
      icon: Calendar,
      href: "/admin/time-slots",
      color: "text-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">管理後台</h1>
          <p className="text-muted-foreground mt-2">選擇要管理的項目</p>
        </div>

        {error && (
          <Alert>
            <AlertTitle>錯誤</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle>{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
