import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始填入種子資料...');

  // 創建測試用戶
  const hashedPassword = await bcrypt.hash('demo123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@timetracker.pro' },
    update: {},
    create: {
      email: 'demo@timetracker.pro',
      password: hashedPassword,
      name: '演示用戶',
      plan: 'PRO',
      settings: {
        create: {
          timezone: 'Asia/Taipei',
          currency: 'TWD',
          hourlyRate: 500,
          workingHoursStart: '09:00',
          workingHoursEnd: '18:00',
          notificationBreak: true,
          notificationOvertime: true,
          notificationInvoice: true,
          invoiceCompany: 'TimeTracker Pro 工作室',
          invoiceAddress: '台北市中正區重慶南路一段122號',
          invoiceTax: '12345678'
        }
      }
    },
    include: {
      settings: true
    }
  });

  console.log('✅ 創建演示用戶:', user.email);

  // 創建測試客戶
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client-1' },
      update: {},
      create: {
        id: 'client-1',
        userId: user.id,
        name: '台灣科技公司',
        email: 'contact@techcorp.tw',
        company: '台灣科技股份有限公司',
        phone: '02-1234-5678',
        address: '台北市信義區松仁路100號',
        taxNumber: '12345678'
      }
    }),
    prisma.client.upsert({
      where: { id: 'client-2' },
      update: {},
      create: {
        id: 'client-2',
        userId: user.id,
        name: '創新設計工作室',
        email: 'hello@design.tw',
        company: '創新設計有限公司',
        phone: '02-8765-4321',
        address: '台北市大安區敦化南路200號'
      }
    })
  ]);

  console.log('✅ 創建測試客戶:', clients.length, '個');

  // 創建測試專案
  const projects = await Promise.all([
    prisma.project.upsert({
      where: { id: 'project-1' },
      update: {},
      create: {
        id: 'project-1',
        userId: user.id,
        clientId: clients[0].id,
        name: '企業官網開發',
        description: '響應式企業官網設計與開發',
        hourlyRate: 600,
        color: '#3B82F6',
        status: 'ACTIVE'
      }
    }),
    prisma.project.upsert({
      where: { id: 'project-2' },
      update: {},
      create: {
        id: 'project-2',
        userId: user.id,
        clientId: clients[1].id,
        name: '品牌設計',
        description: '企業品牌形象設計',
        hourlyRate: 500,
        color: '#10B981',
        status: 'ACTIVE'
      }
    }),
    prisma.project.upsert({
      where: { id: 'project-3' },
      update: {},
      create: {
        id: 'project-3',
        userId: user.id,
        clientId: clients[0].id,
        name: '行動應用開發',
        description: 'iOS/Android 應用程式開發',
        hourlyRate: 700,
        color: '#F59E0B',
        status: 'ACTIVE'
      }
    })
  ]);

  console.log('✅ 創建測試專案:', projects.length, '個');

  // 創建測試時間記錄
  const now = new Date();
  const timeEntries = [];

  for (let i = 0; i < 10; i++) {
    const startTime = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000) - (Math.random() * 8 * 60 * 60 * 1000));
    const duration = Math.floor(Math.random() * 4 * 3600) + 1800; // 30分鐘到4小時
    const endTime = new Date(startTime.getTime() + duration * 1000);
    const project = projects[Math.floor(Math.random() * projects.length)];
    const hourlyRate = project.hourlyRate;
    const amount = Math.round((duration / 3600) * hourlyRate * 100) / 100;

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: user.id,
        projectId: project.id,
        description: `工作項目 ${i + 1} - ${project.name}`,
        startTime,
        endTime,
        duration,
        hourlyRate,
        amount,
        isInvoiced: i < 5 // 前5個已開票
      }
    });

    timeEntries.push(timeEntry);
  }

  console.log('✅ 創建測試時間記錄:', timeEntries.length, '個');

  // 創建測試發票
  const invoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: clients[0].id,
      number: 'INV-20230701-001',
      title: '7月份網站開發服務費',
      description: '企業官網開發專案第一階段',
      subtotal: 15000,
      tax: 750,
      total: 15750,
      status: 'SENT',
      issueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            description: '網站設計與開發',
            quantity: 20,
            rate: 600,
            amount: 12000
          },
          {
            description: '系統整合與測試',
            quantity: 6,
            rate: 500,
            amount: 3000
          }
        ]
      }
    }
  });

  console.log('✅ 創建測試發票:', invoice.number);

  console.log('🎉 種子資料填入完成！');
  console.log('');
  console.log('演示帳號資訊：');
  console.log('📧 電子郵件: demo@timetracker.pro');
  console.log('🔑 密碼: demo123');
  console.log('');
  console.log('可以使用以下帳號登入測試系統功能。');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 填入種子資料時發生錯誤:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
