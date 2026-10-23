import { Prisma, PrismaClient, ReserveStatus } from "@prisma/client";
import {
    BUSINESS_TIME_ZONE,
    dateOnlyToUtcDate,
    formatDateOnly,
    getTaipeiDateOnly,
    taipeiDateTimeToUtc,
} from "../src/utils/dateOnly";

const prisma = new PrismaClient();
const BATCH_SIZE = 250;
const ACTIVE_STATUSES = [ReserveStatus.PENDING, ReserveStatus.CONFIRMED];

async function main() {
    const now = new Date();
    const taipeiToday = getTaipeiDateOnly(now);
    const latestCandidateDate = dateOnlyToUtcDate(taipeiToday);
    let lastSeenId = 0;
    let scannedCount = 0;
    let completedCount = 0;
    let concurrentlyChangedCount = 0;

    console.log(`開始自動完成排程，業務時區：${BUSINESS_TIME_ZONE}，日期：${taipeiToday}，目前 UTC：${now.toISOString()}`);

    while (true) {
        const reservations = await prisma.reserve.findMany({
            where: {
                id: { gt: lastSeenId },
                status: { in: ACTIVE_STATUSES },
                date: { lte: latestCandidateDate },
            },
            orderBy: { id: "asc" },
            take: BATCH_SIZE,
            select: {
                id: true,
                timeSlotId: true,
                date: true,
                updatedAt: true,
                timeSlot: {
                    select: {
                        startTime: true,
                    }
                }
            }
        });

        if (reservations.length === 0) {
            break;
        }

        scannedCount += reservations.length;
        lastSeenId = reservations[reservations.length - 1].id;

        const pastReservations = reservations.filter((reserve) => {
            try {
                const reservationDate = formatDateOnly(reserve.date);
                const reservationTime = taipeiDateTimeToUtc(
                    reservationDate,
                    reserve.timeSlot.startTime,
                );
                return reservationTime.getTime() <= now.getTime();
            } catch {
                console.warn(`略過日期或時段格式異常的預約，ID：${reserve.id}`);
                return false;
            }
        });

        if (pastReservations.length > 0) {
            // 帶入讀取時的排程欄位快照，避免預約在判斷後被移到未來卻仍遭標記完成
            const snapshotConditions: Prisma.ReserveWhereInput[] = pastReservations.map((reserve) => ({
                id: reserve.id,
                timeSlotId: reserve.timeSlotId,
                date: reserve.date,
                updatedAt: reserve.updatedAt,
                timeSlot: {
                    is: {
                        startTime: reserve.timeSlot.startTime,
                    }
                }
            }));

            const result = await prisma.reserve.updateMany({
                where: {
                    status: { in: ACTIVE_STATUSES },
                    OR: snapshotConditions,
                },
                data: {
                    status: ReserveStatus.COMPLETED,
                }
            });

            completedCount += result.count;
            concurrentlyChangedCount += pastReservations.length - result.count;
        }

        if (reservations.length < BATCH_SIZE) {
            break;
        }
    }

    console.log(
        `自動完成排程結束：掃描 ${scannedCount} 筆，完成 ${completedCount} 筆，` +
        `因同時異動而保留 ${concurrentlyChangedCount} 筆。`,
    );
}

main()
    .catch((error) => {
        console.error("自動完成排程失敗", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
