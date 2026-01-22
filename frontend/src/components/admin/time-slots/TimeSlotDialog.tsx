import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Loader2 } from "lucide-react";
import type { TimeSlot } from "@/types";

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
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            時間 {!editingSlot && selectedTimes.length > 0 && `(已選 ${selectedTimes.length} 個)`}
          </label>
          <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-1">
            {timeOptions.map((time) => (
              <Button
                key={time}
                type="button"
                variant={selectedTimes.includes(time) ? "default" : "outline"}
                size="sm"
                onClick={() => onTimeToggle(time)}
                className="h-9"
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">容量</label>
          <Select
            value={String(capacity)}
            onValueChange={(v) => onCapacityChange(Number(v))}
          >
            <SelectTrigger>
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
        <div className="flex gap-2 pt-4">
          <Button onClick={onSubmit} className="flex-1" disabled={isSubmitting || isToggling}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingSlot ? "儲存" : "新增"}
          </Button>
          {editingSlot && (
            <>
              <Button variant="outline" onClick={onToggleActive} disabled={isSubmitting || isToggling}>
                {isToggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSlot.isActive ? "停用" : "啟用"}
              </Button>
              <Button variant="destructive" onClick={onDelete} aria-label="刪除時段" disabled={isSubmitting || isToggling}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
