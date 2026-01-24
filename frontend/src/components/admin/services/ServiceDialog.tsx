import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2, Tag, FileText, Clock, DollarSign } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type { Service } from "@/types";
import { cn } from "@/lib/utils";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingService: Service | null;
  name: string;
  description: string;
  price: number | undefined;
  duration: number | undefined;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriceChange: (value: number | undefined) => void;
  onDurationChange: (value: number | undefined) => void;
  onSubmit: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
}

export function ServiceDialog({
  open,
  onOpenChange,
  editingService,
  name,
  description,
  price,
  duration,
  onNameChange,
  onDescriptionChange,
  onPriceChange,
  onDurationChange,
  onSubmit,
  onToggleActive,
  onDelete,
}: ServiceDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingService ? "編輯服務" : "新增服務"}
      className="max-w-md"
    >
      <div className="space-y-5 py-4">
        <div className="space-y-2.5">
          <Label htmlFor="name" className="flex items-center gap-1.5 text-muted-foreground">
            <Tag className="w-3.5 h-3.5" />
            服務名稱 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="例：四輪定位"
            className="h-11 rounded-lg bg-secondary/30 focus:bg-background transition-colors border-0 ring-1 ring-border focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="description" className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            服務描述
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="詳細說明服務內容..."
            rows={3}
            className="rounded-lg bg-secondary/30 focus:bg-background transition-colors border-0 ring-1 ring-border focus:ring-2 focus:ring-ring resize-none min-h-[80px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <Label htmlFor="price" className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5" />
              價格 (NT$)
            </Label>
            <Input
              id="price"
              type="number"
              value={price ?? ""}
              onChange={(e) => {
                const val = e.target.value.trim();
                onPriceChange(val === "" ? undefined : Number(val));
              }}
              placeholder="0"
              min="0"
              className="h-11 rounded-lg bg-secondary/30 focus:bg-background transition-colors border-0 ring-1 ring-border focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="duration" className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              時長 (分鐘)
            </Label>
            <Input
              id="duration"
              type="number"
              value={duration ?? ""}
              onChange={(e) => {
                const val = e.target.value.trim();
                onDurationChange(val === "" ? undefined : Number(val));
              }}
              placeholder="0"
              min="0"
              className="h-11 rounded-lg bg-secondary/30 focus:bg-background transition-colors border-0 ring-1 ring-border focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex gap-2.5 pt-4">
          <Button
            type="button"
            onClick={onSubmit}
            className="flex-1 h-10 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center text-sm active:scale-[0.98]"
          >
            {editingService ? "儲存" : "新增"}
          </Button>
          
          {editingService && (
            <>
              <Button
                type="button"
                onClick={onToggleActive}
                className={cn(
                  "h-10 px-5 rounded-xl font-medium transition-colors flex items-center justify-center text-sm",
                  editingService.isActive 
                    ? "bg-secondary hover:bg-secondary/80 text-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {editingService.isActive ? "停用" : "啟用"}
              </Button>
              <Button
                type="button"
                onClick={onDelete}
                className="h-10 w-10 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors flex items-center justify-center shrink-0"
                aria-label="刪除服務"
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
