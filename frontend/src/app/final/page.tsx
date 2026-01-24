import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function page() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[400px] bg-white rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] px-8 py-16 flex flex-col items-center">
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-100 rounded-full blur-2xl scale-[1.4] opacity-80" />
            <div className="relative w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-700" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-neutral-900 mb-6 tracking-tight">
          感謝您的預約！
        </h1>
        
        <p className="text-neutral-500 text-center leading-relaxed mb-12 text-lg">
          我們已收到您的預約，將會盡快與您聯繫確認詳細資訊。
        </p>
        
        <Button asChild className="w-full h-16 rounded-2xl bg-emerald-50 hover:bg-emerald-50/90 text-emerald-800 text-xl font-bold group select-none transition-all active:scale-[0.98]">
          <Link href="/history">
            預約紀錄
            <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
      
      <p className="mt-10 text-neutral-400 text-sm font-medium">
        如有任何問題，請聯繫我們的官方帳號
      </p>
    </div>
  );
}