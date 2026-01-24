import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import type { TimeSlot } from "@/types";
import { cn } from "@/lib/utils";

interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekdays: string[];
  timeOptions: string[];
  selectedDayOfWeek: number;
  selectedTimes: string[];
  capacity: number;
  editingSlot: TimeSlot | null;
  isSubmitting?: boolean;
  isToggling?: boolean;
  onTimeToggle: (time: string) => void;
  onCapacityChange: (capacity: number) => void;
  onSubmit: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
}

export function TimeSlotDialog({
  open,
  onOpenChange,
  weekdays,
  timeOptions,
  selectedDayOfWeek,
  selectedTimes,
  capacity,
  editingSlot,
  isSubmitting = false,
  isToggling = false,
  onTimeToggle,
  onCapacityChange,
  onSubmit,
  onToggleActive,
  onDelete,
}: TimeSlotDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${editingSlot ? "編輯時段" : "新增時段"} - ${weekdays[selectedDayOfWeek]}`}
    >
      <div className="space-y-6 py-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-3 block">
            時間 {!editingSlot && selectedTimes.length > 0 && `(已選 ${selectedTimes.length} 個)`}
          </label>
          <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-1 scrollbar-thin">
            {timeOptions.map((time) => (
              <Button
                key={time}
                type="button"
                variant="ghost"
                onClick={() => onTimeToggle(time)}
                className={cn(
                  "py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.96] h-auto",
                  selectedTimes.includes(time)
                    ? "bg-foreground text-background shadow-sm hover:bg-foreground/90"
                    : "bg-muted text-foreground hover:bg-muted/70"
                )}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-3 block">容量</label>
          <Select
            value={String(capacity)}
            onValueChange={(v) => onCapacityChange(Number(v))}
          >
            <SelectTrigger className="w-full h-11 rounded-md bg-secondary/50 border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={String(num)}>
                  {num} 人
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2.5">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || isToggling || (!editingSlot && selectedTimes.length === 0)}
            className="flex-1 h-10 bg-foreground text-background rounded-xl font-semibold disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center hover:opacity-90 px-4 text-sm"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingSlot ? "儲存" : "新增"}
          </Button>
          
          {editingSlot && (
            <>
              <Button
                type="button"
                onClick={onToggleActive}
                disabled={isSubmitting || isToggling}
                className="h-10 px-5 bg-secondary rounded-xl font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center text-sm text-secondary-foreground"
              >
                {isToggling ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingSlot.isActive ? "停用" : "啟用")}
              </Button>
              <Button
                type="button"
                onClick={onDelete}
                disabled={isSubmitting || isToggling}
                className="h-10 w-10 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors flex items-center justify-center shrink-0"
                aria-label="刪除"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
