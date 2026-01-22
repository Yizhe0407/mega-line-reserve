import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TimeSlot } from "@/types/timeSlot";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: TimeSlot | null;
  weekdays: string[];
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  slot,
  weekdays,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>確認刪除</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {slot && (
            <div className="text-sm">
              確定要刪除 <span className="font-semibold">{weekdays[slot.dayOfWeek]}</span> 的{" "}
              <span className="font-semibold">{slot.startTime}</span> 時段嗎？
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <Button variant="destructive" onClick={onConfirm} className="flex-1">
              確認刪除
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
