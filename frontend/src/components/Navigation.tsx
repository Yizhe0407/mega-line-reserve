'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, User, History, Settings } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

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
    <div className="fixed inset-x-0 bottom-0 h-16 bg-background border-t border-border/70 z-30">
      <nav className="mx-auto flex max-w-md h-full items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/admin" && pathname.startsWith("/admin"));
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200 active:opacity-60 ${
                active ? "text-brand-strong" : "text-muted-foreground"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2 : 1.6} />
              <span className={`text-[10px] tracking-[0.12em] transition-all ${active ? "font-semibold" : ""}`}>
                {label}
              </span>
              <span
                className={`absolute bottom-1.5 h-[2px] rounded-full bg-brand-strong transition-all duration-200 ${
                  active ? "w-5 opacity-100" : "w-0 opacity-0"
                }`}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
