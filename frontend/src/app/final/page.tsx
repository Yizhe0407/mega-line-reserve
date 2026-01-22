import { CheckCircle2 } from "lucide-react";

export default function page() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-xs">
        <CheckCircle2 size={48} className="mb-4 text-primary" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-50 mb-2 text-center">
          感謝您的預約！
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 text-center leading-relaxed">
          我們已收到您的預約。
        </p>
      </div>
    </div>
  );
}