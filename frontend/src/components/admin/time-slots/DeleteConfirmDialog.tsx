import { Button } from "@/components/ui/button";
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
      <div className="space-y-4 py-4">
        {slot && (
          <div className="text-sm">
            確定要刪除 <span className="font-semibold">{weekdays[slot.dayOfWeek]}</span> 的{" "}
            <span className="font-semibold">{slot.startTime}</span> 時段嗎？
          </div>
        )}
        <div className="flex gap-2 pt-4">
          <Button variant="destructive" onClick={onConfirm} className="flex-1" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            確認刪除
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            取消
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
