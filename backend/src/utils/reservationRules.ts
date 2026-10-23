import { ReserveStatus } from "@prisma/client";

export const RESERVE_INPUT_LIMITS = {
    serviceIds: 50,
    license: 12,
    memo: 191,
} as const;

export const reserveOccupiesCapacity = (status: ReserveStatus): boolean => {
    return status !== ReserveStatus.CANCELLED;
};

export const shouldCheckReserveCapacity = (
    previousStatus: ReserveStatus,
    nextStatus: ReserveStatus,
    scheduleChanged: boolean,
): boolean => {
    return reserveOccupiesCapacity(nextStatus) && (
        !reserveOccupiesCapacity(previousStatus) || scheduleChanged
    );
};
