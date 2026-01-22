import type { Service } from "@/types";

interface ServiceCardProps {
  service: Service;
  onClick: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  return (
    <button
      type="button"
      className={`w-full text-left p-4 rounded-lg border cursor-pointer transition-colors ${
        service.isActive
          ? "bg-card hover:bg-accent/50 border-border"
          : "bg-muted border-muted-foreground/30 opacity-60"
      }`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg">{service.name}</h3>
          {!service.isActive && (
            <span className="text-xs bg-muted-foreground/20 px-2 py-1 rounded">
              已停用
            </span>
          )}
        </div>

        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}

        <div className="flex gap-4 text-sm">
          {service.price !== null && service.price !== undefined && (
            <div className="text-muted-foreground">
              價格: <span className="font-medium text-foreground">NT$ {service.price}</span>
            </div>
          )}
          {service.duration !== null && service.duration !== undefined && (
            <div className="text-muted-foreground">
              時長: <span className="font-medium text-foreground">{service.duration} 分鐘</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
