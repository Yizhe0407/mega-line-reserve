import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function page() {
  return (
    <div className="min-h-screen flex flex-col items-center px-6 pt-16 pb-12 bg-background">
      <div className="w-[76px] h-[76px] rounded-full border border-success/25 flex items-center justify-center mb-8">
        <div className="w-[58px] h-[58px] rounded-full bg-success flex items-center justify-center shadow-[0_4px_14px_-4px_rgba(74,122,82,0.5)]">
          <Check size={28} strokeWidth={3} className="text-white" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">
        感謝您的預約！
      </h1>

      <p className="text-muted-foreground text-center text-sm leading-relaxed mb-9 max-w-[280px]">
        我們已收到您的預約，將會盡快與您聯繫確認詳細資訊。
      </p>

      <div className="w-full max-w-[400px] flex flex-col gap-2.5">
        <Button asChild className="w-full h-12 text-base font-bold group">
          <Link href="/history">
            預約紀錄
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
        <Button asChild variant="ghost" className="w-full h-11 text-sm font-medium text-muted-foreground">
          <Link href="/">回首頁</Link>
        </Button>
      </div>
    </div>
  );
}
