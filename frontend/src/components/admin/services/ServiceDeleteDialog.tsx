import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type { Service } from "@/types";
import { Button } from "@/components/ui/button";

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
      <div className="space-y-6 py-4">
        {service && (
          <div className="text-sm text-center text-muted-foreground">
            確定要刪除服務{" "}
            <span className="font-semibold text-foreground">{service.name}</span> 嗎？
          </div>
        )}
        <div className="flex gap-2.5">
          <Button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-10 bg-destructive text-destructive-foreground rounded-xl font-semibold hover:bg-destructive/90 transition-all flex items-center justify-center text-sm"
          >
            確認刪除
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 bg-secondary rounded-xl font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center text-sm"
          >
            取消
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
