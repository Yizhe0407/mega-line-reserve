import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type { Service } from "@/types";

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
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="確認刪除"
    >
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
    </ResponsiveDialog>
  );
}
