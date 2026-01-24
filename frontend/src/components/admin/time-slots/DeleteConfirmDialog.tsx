import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type { TimeSlot } from "@/types";
import { Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: TimeSlot | null;
  weekdays: string[];
  isLoading?: boolean;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  slot,
  weekdays,
  isLoading = false,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="確認刪除"
    >
      <div className="space-y-6 py-4">
        {slot && (
          <div className="text-sm text-center text-muted-foreground">
            確定要刪除 <span className="font-semibold text-foreground">{weekdays[slot.dayOfWeek]}</span> 的{" "}
            <span className="font-semibold text-foreground">{slot.startTime}</span> 時段嗎？
          </div>
        )}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-10 bg-destructive text-destructive-foreground rounded-xl font-semibold hover:bg-destructive/90 transition-all flex items-center justify-center disabled:opacity-50 text-sm"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            確認刪除
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 bg-secondary rounded-xl font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center justify-center text-sm"
            disabled={isLoading}
          >
            取消
          </button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
