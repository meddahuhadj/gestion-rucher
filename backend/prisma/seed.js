import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

async function main() {
  console.log('🌱 Seeding database...');

  const existing = await prisma.user.findFirst({ where: { email: 'apiculteur@example.com' } });
  if (existing) {
    console.log('Seed data already exists. Skipping.');
    return;
  }

  const hash = await bcrypt.hash('apiculteur123', 10);
  const user = await prisma.user.create({
    data: {
      name: 'أحمد بومدين',
      email: 'apiculteur@example.com',
      password: hash,
      currency: 'DZD',
      language: 'ar',
      reminderDays: 1,
    },
  });

  const workspace = await prisma.workspace.create({
    data: { name: 'منحل العائلة', code: 'BEE1' },
  });
  await prisma.workspaceMember.create({
    data: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { currentWorkspaceId: workspace.id },
  });

  const apiaryA = await prisma.apiary.create({
    data: {
      name: 'المنحل أ',
      location: 'منطقة الجبال',
      description: 'المنحل الرئيسي',
      userId: user.id,
      workspaceId: workspace.id,
    },
  });

  const apiaryB = await prisma.apiary.create({
    data: {
      name: 'المنحل ب',
      location: 'واحة النخيل',
      description: 'منحل ثانوي',
      userId: user.id,
      workspaceId: workspace.id,
    },
  });

  const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'WEAK', 'ACTIVE', 'ACTIVE', 'DEAD', 'ACTIVE', 'ACTIVE', 'MERGED', 'ACTIVE', 'ACTIVE'];
  const strengths = ['STRONG', 'STRONG', 'MEDIUM', 'WEAK', 'MEDIUM', 'VERY_STRONG', 'WEAK', 'STRONG', 'MEDIUM', 'MEDIUM', 'WEAK', 'STRONG'];

  const hives = [];
  for (let i = 1; i <= 12; i++) {
    const hive = await prisma.hive.create({
      data: {
        number: i,
        name: `خلية ${i}`,
        origin: 'إطار محلي',
        type: 'لانغستروث',
        beeRace: i % 2 === 0 ? 'باكفاست' : 'السلالة المحلية',
        status: statuses[i - 1],
        strength: strengths[i - 1],
        queenPresent: statuses[i - 1] !== 'DEAD' && statuses[i - 1] !== 'MERGED',
        queenAge: 6 + (i % 12),
        lastInspection: statuses[i - 1] === 'DEAD' ? daysAgo(60) : daysAgo(i % 5 === 0 ? 20 : i % 3 + 1),
        nextInspection: daysFromNow(i),
        apiaryId: i <= 6 ? apiaryA.id : apiaryB.id,
        userId: user.id,
        workspaceId: workspace.id,
        notes: 'خلية منتجة',
      },
    });
    hives.push(hive);

    await prisma.queen.create({
      data: {
        hiveId: hive.id,
        origin: 'مستوردة',
        race: i % 2 === 0 ? 'باكفاست' : 'السلالة المحلية',
        age: 6 + (i % 12),
        introductionDate: daysAgo(100),
        quality: 'Good',
        broodProduction: 'Good',
        notes: 'ملكة جيدة',
      },
    });
  }

  console.log(`Created ${hives.length} hives`);

  const inspectionTemplates = [
    { strength: 'STRONG', honey: 'Full', laying: 'Good', obs: 'القوة ممتازة، الملكة حاضرة، التبويض طبيعي.' },
    { strength: 'MEDIUM', honey: 'Medium', laying: 'Normal', obs: 'قوة متوسطة، احتياطيات جيدة.' },
    { strength: 'WEAK', honey: 'Low', laying: 'Spotty', obs: 'خلية ضعيفة، تحتاج إلى تعزيز.' },
    { strength: 'VERY_STRONG', honey: 'Full', laying: 'Excellent', obs: 'خلية قوية جداً، جاهزة للتقسيم.' },
  ];

  for (let i = 0; i < hives.length; i++) {
    const hive = hives[i];
    const t = inspectionTemplates[i % inspectionTemplates.length];
    const inspDate = hive.lastInspection || daysAgo(i % 5);
    await prisma.inspection.create({
      data: {
        hiveId: hive.id,
        date: inspDate,
        time: '9:30',
        temperature: 28,
        weather: 'Sunny',
        strength: t.strength,
        queenPresent: true,
        queenSeen: true,
        layingPattern: t.laying,
        broodQuantity: t.strength === 'WEAK' ? 'Little' : 'Lots',
        broodCondition: 'Good',
        honeyStores: t.honey,
        pollenStores: 'Good',
        foodAvailable: true,
        healthStatus: 'Healthy',
        parasites: t.strength === 'WEAK' ? 'Varroa low' : 'None',
        diseases: 'None',
        observations: t.obs,
        userId: user.id,
        workspaceId: workspace.id,
      },
    });
  }

  await prisma.task.create({
    data: {
      type: 'INSPECTION', hiveId: hives[11].id, date: daysFromNow(1), time: '10:00',
      priority: 'URGENT', status: 'TODO', description: 'فحص دوري للخلية 12', userId: user.id, workspaceId: workspace.id,
    },
  });
  await prisma.task.create({
    data: {
      type: 'FEEDING', hiveId: hives[3].id, date: daysFromNow(2), time: '17:00',
      priority: 'HIGH', status: 'TODO', description: 'نوريسمو 1.5 لتر سيروب', userId: user.id, workspaceId: workspace.id,
    },
  });
  await prisma.task.create({
    data: {
      type: 'DIVISION', hiveId: hives[5].id, date: daysFromNow(7), time: '9:00',
      priority: 'NORMAL', status: 'TODO', description: 'تقسيم الخلية القوية', userId: user.id, workspaceId: workspace.id,
    },
  });
  await prisma.task.create({
    data: {
      type: 'QUEEN_CHECK', hiveId: hives[0].id, date: daysFromNow(3), time: '11:00',
      priority: 'HIGH', status: 'TODO', description: 'مراقبة الملكة', userId: user.id, workspaceId: workspace.id,
    },
  });
  await prisma.task.create({
    data: {
      type: 'TREATMENT', hiveId: hives[2].id, date: daysAgo(2), time: '16:00',
      priority: 'URGENT', status: 'DONE', description: 'علاج ضد الفاروا', userId: user.id, workspaceId: workspace.id,
    },
  });

  const expenseData = [
    { amount: 3500, category: 'SUGAR', desc: 'سكر للتغذية', days: 5 },
    { amount: 2500, category: 'MEDICINE', desc: 'شرائط معالجة الفاروا', days: 10 },
    { amount: 12000, category: 'EQUIPMENT', desc: 'إطارات وبدلات', days: 20 },
    { amount: 1800, category: 'SYRUP', desc: 'سيروب تغذية', days: 3 },
    { amount: 4000, category: 'FRAMES', desc: 'أقراص شمعية', days: 15 },
  ];
  for (const e of expenseData) {
    await prisma.expense.create({
      data: {
        amount: e.amount, category: e.category, description: e.desc,
        date: daysAgo(e.days), userId: user.id, workspaceId: workspace.id,
        hiveId: hives[e.days % hives.length].id,
        reason: e.desc,
      },
    });
  }

  await prisma.revenue.create({
    data: {
      amount: 50000, type: 'HONEY', product: 'عسل طبيعي', quantity: 25, unitPrice: 2000,
      totalPrice: 50000, customer: 'سوق المدينة', date: daysAgo(6),
      description: 'بيع 25 كغ عسل', userId: user.id, workspaceId: workspace.id, hiveId: hives[5].id,
    },
  });
  await prisma.revenue.create({
    data: {
      amount: 30000, type: 'HONEY', product: 'عسل جبلي', quantity: 15, unitPrice: 2000,
      totalPrice: 30000, customer: 'متعامل خاص', date: daysAgo(30),
      description: 'بيع عسل جبلي', userId: user.id, workspaceId: workspace.id, hiveId: hives[0].id,
    },
  });

  await prisma.harvest.create({
    data: {
      date: daysAgo(30), honeyType: 'عسل زهور', quantity: 25, weight: 25, jars: 50,
      unitPrice: 2000, totalPrice: 50000, lot: 'LOT-2026-01',
      notes: 'حصاد الخريف', userId: user.id, workspaceId: workspace.id, hiveId: hives[5].id,
    },
  });
  await prisma.harvest.create({
    data: {
      date: daysAgo(45), honeyType: 'عسل جبلي', quantity: 15, weight: 15, jars: 30,
      unitPrice: 2000, totalPrice: 30000, lot: 'LOT-2026-02',
      notes: 'حصاد الربيع', userId: user.id, workspaceId: workspace.id, hiveId: hives[0].id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id, title: 'فحص غداً', type: 'REMINDER',
      message: 'فحص مقرر غداً للخلية رقم 12',
      relatedType: 'task',
    },
  });

  console.log('✅ Seeding complete!');
  console.log('   📧 Email: apiculteur@example.com');
  console.log('   🔑 Password: apiculteur123');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
