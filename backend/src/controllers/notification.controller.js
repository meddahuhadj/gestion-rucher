import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';
import { generateNotifications } from '../services/notification.service.js';

export const list = asyncHandler(async (req, res) => {
  const { read } = req.query;
  await generateNotifications(req.workspaceId);
  const where = { userId: req.user.id };
  if (read !== undefined) where.read = read === 'true';
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return ok(res, notifications);
});

export const markRead = asyncHandler(async (req, res) => {
  const existing = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!existing) return fail(res, 404, 'Notification not found');
  const notification = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });
  return ok(res, notification);
});

export const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });
  return ok(res, { success: true });
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!existing) return fail(res, 404, 'Notification not found');
  await prisma.notification.delete({ where: { id: req.params.id } });
  return ok(res, { id: req.params.id });
});
