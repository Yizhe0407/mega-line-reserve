import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Service } from "@/types/service";

interface ServiceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onConfirm: () => void;
}

export function ServiceDeleteDialog({
  open,
  onOpenChange,
  service,
  onConfirm,
}: ServiceDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>確認刪除</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {service && (
            <div className="text-sm">
              確定要刪除服務{" "}
              <span className="font-semibold">{service.name}</span> 嗎？
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
