import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler, toISODate } from '../utils/helpers.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../utils/constants.js';

export const list = asyncHandler(async (req, res) => {
  const { hiveId, status, from, to, priority } = req.query;
  const where = { workspaceId: req.workspaceId };
  if (hiveId) where.hiveId = hiveId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = toISODate(from);
    if (to) where.date.lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    include: { hive: { select: { number: true, name: true } } },
  });
  return ok(res, tasks);
});

export const get = asyncHandler(async (req, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
    include: { hive: true },
  });
  if (!task) return fail(res, 404, 'Task not found');
  return ok(res, task);
});

export const create = asyncHandler(async (req, res) => {
  const { hiveId, type, date, time, priority, status, description } = req.body;
  if (!type) return fail(res, 400, 'Type is required');

  let hiveData = {};
  if (hiveId) {
    const hive = await prisma.hive.findFirst({ where: { id: hiveId, workspaceId: req.workspaceId } });
    if (hive) hiveData.hiveId = hiveId;
  }

  const task = await prisma.task.create({
    data: {
      ...hiveData,
      type,
      date: toISODate(date) || new Date(),
      time,
      priority: TASK_PRIORITIES.includes(priority) ? priority : 'NORMAL',
      status: TASK_STATUSES.includes(status) ? status : 'TODO',
      description,
      userId: req.user.id,
      workspaceId: req.workspaceId,
    },
  });
  return ok(res, task);
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Task not found');

  const { hiveId, type, date, time, priority, status, description } = req.body;
  const data = {};
  if (type !== undefined) data.type = type;
  if (date !== undefined) data.date = toISODate(date) || existing.date;
  if (time !== undefined) data.time = time;
  if (priority !== undefined && TASK_PRIORITIES.includes(priority)) data.priority = priority;
  if (status !== undefined && TASK_STATUSES.includes(status)) data.status = status;
  if (description !== undefined) data.description = description;
  if (hiveId !== undefined) {
    if (hiveId) {
      const hive = await prisma.hive.findFirst({ where: { id: hiveId, workspaceId: req.workspaceId } });
      data.hiveId = hive ? hiveId : null;
    } else {
      data.hiveId = null;
    }
  }

  const task = await prisma.task.update({ where: { id: req.params.id }, data });
  return ok(res, task);
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Task not found');
  await prisma.task.delete({ where: { id: req.params.id } });
  return ok(res, { id: req.params.id });
});
