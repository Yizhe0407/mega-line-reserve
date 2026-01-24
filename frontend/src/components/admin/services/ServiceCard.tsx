import type { Service } from "@/types";
import { Clock, CircleDollarSign, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ServiceCardProps {
  service: Service;
  onClick: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "group w-full h-auto text-left p-5 rounded-2xl border transition-all duration-200 justify-start items-start whitespace-normal hover:bg-transparent",
        service.isActive
          ? "bg-card border-border hover:border-foreground/20 hover:shadow-sm"
          : "bg-muted/30 border-border/50 opacity-70 hover:opacity-100"
      )}
    >
      <div className="space-y-3 w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 w-full">
          <h3 className={cn(
            "font-semibold text-lg tracking-tight",
            !service.isActive && "text-muted-foreground"
          )}>
            {service.name}
          </h3>
          {service.isActive ? (
             <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
          ) : (
            <span className="shrink-0 text-[10px] font-medium bg-muted text-muted-foreground px-2 py-1 rounded-md">
              已停用
            </span>
          )}
        </div>

        {/* Description */}
        {service.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {service.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic min-h-[2.5rem] flex items-center">
            無描述
          </p>
        )}

        {/* Footer Details */}
        <div className="flex items-center gap-4 pt-2 mt-2 border-t border-border/50 w-full">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CircleDollarSign className="w-4 h-4" />
            {service.price !== null && service.price !== undefined ? (
              <span className="font-medium text-foreground tabular-nums">
                {service.price}
              </span>
            ) : (
              <span>-</span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {service.duration !== null && service.duration !== undefined ? (
              <span className="font-medium text-foreground tabular-nums">
                {service.duration} 分
              </span>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>
      </div>
    </Button>
  );
}
