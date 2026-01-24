import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopySlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekdays: string[];
  sourceDay: number;
  targetDays: number[];
  slotCount: number;
  isLoading?: boolean;
  onToggleTargetDay: (day: number) => void;
  onConfirm: () => void;
}

export function CopySlotDialog({
  open,
  onOpenChange,
  weekdays,
  sourceDay,
  targetDays,
  slotCount,
  isLoading = false,
  onToggleTargetDay,
  onConfirm,
}: CopySlotDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`複製時段 - ${weekdays[sourceDay]}`}
    >
      <div className="space-y-5 py-4">
        <p className="text-sm text-muted-foreground">
          將 {weekdays[sourceDay]} 的 {slotCount} 個時段複製到：
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {weekdays.map((day, index) => {
            if (index === sourceDay) return null;
            return (
              <button
                key={index}
                type="button"
                onClick={() => onToggleTargetDay(index)}
                className={cn(
                  "py-2.5 rounded-xl font-medium transition-all text-sm",
                  targetDays.includes(index)
                    ? "bg-foreground text-background"
                    : "bg-secondary/50 hover:bg-secondary"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-2.5 p-3 bg-secondary/50 rounded-xl">
          <span className="text-muted-foreground text-sm shrink-0">!</span>
          <p className="text-sm text-muted-foreground">
            目標日期的所有時段將被覆蓋
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || targetDays.length === 0}
            className="flex-1 h-10 bg-foreground text-background rounded-xl font-semibold disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center text-sm"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            確認複製
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-6 h-10 bg-secondary rounded-xl font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
