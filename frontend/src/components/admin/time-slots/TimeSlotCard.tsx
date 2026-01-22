import type { TimeSlot } from "@/types/timeSlot";

interface TimeSlotCardProps {
  slot: TimeSlot;
  onClick: () => void;
}

export function TimeSlotCard({ slot, onClick }: TimeSlotCardProps) {
  return (
    <div
      className={`p-2 rounded border text-xs cursor-pointer transition-colors ${
        slot.isActive
          ? "bg-primary/10 border-primary/30 hover:bg-primary/20"
          : "bg-muted border-muted-foreground/30 opacity-60"
      }`}
      onClick={onClick}
    >
      <div className="font-semibold">{slot.startTime}</div>
      <div className="text-muted-foreground">容量: {slot.capacity}</div>
    </div>
  );
}
