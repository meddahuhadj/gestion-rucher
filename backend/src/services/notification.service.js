import prisma from '../lib/prisma.js';

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'INFO',
  relatedId = null,
  relatedType = null,
}) => {
  try {
    return await prisma.notification.create({
      data: { userId, title, message, type, relatedId, relatedType },
    });
  } catch (err) {
    console.error('Notification create failed:', err.message);
    return null;
  }
};

export const generateNotifications = async (workspaceId) => {
  if (!workspaceId) return;

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });
  if (members.length === 0) return;

  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: {
      workspaceId,
      status: { in: ['TODO', 'IN_PROGRESS'] },
      date: { gte: now },
    },
    include: { hive: true },
    take: 50,
  });

  const hives = await prisma.hive.findMany({
    where: { workspaceId, status: { in: ['ACTIVE', 'WEAK'] } },
    take: 100,
  });

  const findExisting = async (userId, relatedType, relatedId, title) => {
    return prisma.notification.findFirst({
      where: {
        userId,
        relatedId,
        relatedType,
        title,
        createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
      },
    });
  };

  const notifications = [];

  for (const member of members) {
    const seen = new Set();

    for (const task of tasks) {
      const diff = Math.ceil((task.date - now) / (1000 * 3600 * 24));
      const displayName = task.hive ? `الخلية رقم ${task.hive.number}` : 'المنحل';
      let title = null;
      if (diff === 0) {
        title = 'تذكير: عمل اليوم';
      } else if (diff === 1) {
        title = 'عمل مقرر غداً';
      } else if (diff === 2) {
        title = 'عمل مقرر بعد يومين';
      } else if (diff <= 7) {
        title = 'عمل مقرر هذا الأسبوع';
      }
      if (title && !seen.has(task.id)) {
        seen.add(task.id);
        const existing = await findExisting(member.userId, 'task', task.id, title);
        if (!existing) {
          notifications.push(
            createNotification({
              userId: member.userId,
              title,
              message: `${displayName} — ${task.type}`,
              type: 'TASK_DUE',
              relatedId: task.id,
              relatedType: 'task',
            })
          );
        }
      }
    }

    for (const hive of hives) {
      const last = hive.lastInspection ? new Date(hive.lastInspection) : null;
      if (!last) continue;
      const daysAgo = Math.floor((now - last) / (1000 * 3600 * 24));
      if (daysAgo >= 15) {
        const title = `لم تُفحص منذ ${daysAgo} يوم`;
        const existing = await findExisting(member.userId, 'hive', hive.id, title);
        if (!existing) {
          notifications.push(
            createNotification({
              userId: member.userId,
              title,
              message: `الخلية رقم ${hive.number} لم تُفحص منذ ${daysAgo} يوم`,
              type: 'WARNING',
              relatedId: hive.id,
              relatedType: 'hive',
            })
          );
        }
      }
    }
  }

  await Promise.all(notifications);
};
