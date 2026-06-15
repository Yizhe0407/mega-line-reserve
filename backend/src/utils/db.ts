import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 50;

// Serializable 交易在高併發下可能因寫入衝突拋出 P2034，重試數次降低使用者感受到的失敗率
export const runSerializableTransaction = async <T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error) {
            const isRetryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
            if (!isRetryable || attempt === MAX_RETRIES) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
    }
    throw new Error("unreachable");
};
