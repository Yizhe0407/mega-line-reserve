import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
  {
    name: '基礎保養',
    description: '引擎機油更換、機油濾芯更換、基本檢查',
    price: 1500,
    duration: 60,
    isActive: true,
  },
  {
    name: '煞車系統檢查',
    description: '煞車皮/來令片檢查、煞車油檢查、煞車碟盤檢查',
    price: 800,
    duration: 45,
    isActive: true,
  },
  {
    name: '輪胎更換',
    description: '四輪輪胎更換、動平衡、定位',
    price: 3200,
    duration: 90,
    isActive: true,
  },
  {
    name: '冷氣系統保養',
    description: '冷氣濾網更換、冷媒檢查補充、系統清潔',
    price: 1200,
    duration: 60,
    isActive: true,
  },
  {
    name: '電瓶檢測更換',
    description: '電瓶壽命檢測、電壓測試、必要時更換',
    price: 2500,
    duration: 30,
    isActive: true,
  },
  {
    name: '全車健檢',
    description: '底盤檢查、引擎檢查、電系檢查、油水檢查',
    price: null,
    duration: null,
    isActive: true,
  },
  {
    name: '變速箱油更換',
    description: '變速箱油更換、濾網清潔、系統檢查',
    price: 3500,
    duration: 90,
    isActive: true,
  },
  {
    name: '火星塞更換',
    description: '火星塞拆裝更換、點火系統檢查',
    price: null,
    duration: 45,
    isActive: true,
  },
];

// 週一到週六，08:00-17:00，每小時一個時段
// 12:00、13:00 為午休交接時段，僅開放 1 個名額
const timeSlots = Array.from({ length: 6 }, (_, i) => i + 1).flatMap((dayOfWeek) =>
  Array.from({ length: 10 }, (_, i) => 8 + i).map((hour) => ({
    dayOfWeek,
    startTime: `${String(hour).padStart(2, '0')}:00`,
    capacity: hour === 12 || hour === 13 ? 1 : 2,
    isActive: true,
  })),
);

async function main() {
  console.log('開始建立 seed 資料...');

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: service,
      create: service,
    });
  }

  console.log(`✅ 已建立 ${services.length} 個服務項目`);

  for (const timeSlot of timeSlots) {
    await prisma.timeSlot.upsert({
      where: { dayOfWeek_startTime: { dayOfWeek: timeSlot.dayOfWeek, startTime: timeSlot.startTime } },
      update: timeSlot,
      create: timeSlot,
    });
  }

  console.log(`✅ 已建立 ${timeSlots.length} 個可預約時段`);
}

main()
  .catch((e) => {
    console.error('❌ Seed 失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
