import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Loader2 } from "lucide-react";

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
      <div className="space-y-4 py-4">
        <div className="text-sm text-muted-foreground">
          將 {weekdays[sourceDay]} 的 {slotCount} 個時段複製到：
        </div>
        <div className="grid grid-cols-2 gap-2">
          {weekdays.map((day, index) => (
            <Button
              key={index}
              type="button"
              variant={targetDays.includes(index) ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleTargetDay(index)}
              disabled={index === sourceDay}
              className="h-10"
            >
              {day}
            </Button>
          ))}
        </div>
        <div className="text-sm text-amber-600 dark:text-amber-500">
          ⚠️ 目標日期的所有時段將被覆蓋
        </div>
        <div className="flex gap-2 pt-4">
          <Button onClick={onConfirm} className="flex-1" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            確認複製 {targetDays.length > 0 && `到 ${targetDays.length} 天`}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            取消
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
