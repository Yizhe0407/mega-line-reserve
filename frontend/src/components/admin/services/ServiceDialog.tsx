import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import type { Service } from "@/types/service";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingService ? "編輯服務" : "新增服務"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">服務名稱 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="例：四輪定位"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">服務描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="詳細說明服務內容..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">價格 (NT$)</Label>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">時長 (分鐘)</Label>
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
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onSubmit} className="flex-1">
              {editingService ? "儲存" : "新增"}
            </Button>
            {editingService && (
              <>
                <Button variant="outline" onClick={onToggleActive}>
                  {editingService.isActive ? "停用" : "啟用"}
                </Button>
                <Button variant="destructive" onClick={onDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
