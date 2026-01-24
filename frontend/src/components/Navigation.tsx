'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, User, History, Settings } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useStepStore } from "@/store/step-store";

const navItems = [
  { href: "/", label: "預約", icon: Calendar },
  { href: "/history", label: "紀錄", icon: History },
  { href: "/profile", label: "我的", icon: User },
];

export default function Navigation() {
  const pathname = usePathname();
  const { isAdmin } = useAdminAuth();

  // 如果是管理員，加入後台管理按鈕
  const items = isAdmin 
    ? [...navItems, { href: "/admin", label: "管理", icon: Settings }]
    : navItems;

  return (
    <div className="fixed inset-x-0 bottom-0 border-t bg-background">
      <nav className="mx-auto flex max-w-md">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/admin" && pathname.startsWith("/admin"));
          return (
            <Link
              key={href}
              href={href}
              onClick={(e) => {
                if (useStepStore.getState().isNewUser && href !== "/profile") {
                  e.preventDefault();
                  import("react-hot-toast").then((mod) => {
                     mod.default.error("請先完成基本資料填寫");
                  });
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center h-16 gap-0.5 sm:gap-1 text-[10px] sm:text-xs ${
                active ? "text-primary" : "text-muted-foreground"
              } ${useStepStore.getState().isNewUser && href !== "/profile" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              <span
                className={`h-0.5 w-8 rounded-full transition-colors ${
                  active ? "bg-primary" : "bg-transparent"
                }`}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
