'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, User, History } from "lucide-react";

const navItems = [
  { href: "/", label: "預約", icon: Calendar },
  { href: "/history", label: "預約紀錄", icon: History },
  { href: "/profile", label: "個人資料", icon: User },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 border-t bg-background">
      <nav className="mx-auto flex max-w-md">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center h-16 gap-1 text-xs ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
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
