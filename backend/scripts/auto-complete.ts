
import { PrismaClient, ReserveStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running auto-complete script for past reservations...');

  const now = new Date();
  console.log(`Current Time: ${now.toLocaleString()}`);

  const activeReservations = await prisma.reserve.findMany({
    where: {
      status: {
        in: [ReserveStatus.PENDING, ReserveStatus.CONFIRMED]
      }
    },
    include: {
      timeSlot: true
    }
  });

  const updates = [];

  for (const reserve of activeReservations) {
    if (!reserve.date || !reserve.timeSlot) continue;

    const reserveDate = new Date(reserve.date); 
    const [hours, minutes] = reserve.timeSlot.startTime.split(':').map(Number);
    
    // Set hours on the reservation date object
    // Note: reserve.date is usually midnight UTC if @db.Date using basic Prisma defaults
    // If we want to be precise about "Time passed", we need to know the timezone strategy.
    // However, if we assume the server time matches the business context (or both UTC), 
    // simple comparison works for "is it obviously past".
    const reservationTime = new Date(reserveDate);
    reservationTime.setHours(hours, minutes, 0, 0);

    // If 'now' is greater than reservation time, mark as completed
    if (now > reservationTime) {
      updates.push(
        prisma.reserve.update({
          where: { id: reserve.id },
          data: { status: ReserveStatus.COMPLETED }
        })
      );
    }
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
    console.log(`Updated ${updates.length} reservations to COMPLETED.`);
  } else {
    console.log('No past reservations found to update.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
