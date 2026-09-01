import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler, toISODate } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const { category, hiveId, from, to } = req.query;
  const where = { workspaceId: req.workspaceId };
  if (category) where.category = category;
  if (hiveId) where.hiveId = hiveId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = toISODate(from);
    if (to) where.date.lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }
  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { hive: { select: { number: true, name: true } } },
  });
  return ok(res, expenses);
});

export const get = asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
    include: { hive: true },
  });
  if (!expense) return fail(res, 404, 'Expense not found');
  return ok(res, expense);
});

export const create = asyncHandler(async (req, res) => {
  const { date, amount, category, hiveId, description, reason, photo } = req.body;
  if (!amount) return fail(res, 400, 'Amount is required');
  if (!category) return fail(res, 400, 'Category is required');

  let hiveData = {};
  if (hiveId) {
    const hive = await prisma.hive.findFirst({ where: { id: hiveId, workspaceId: req.workspaceId } });
    if (hive) hiveData.hiveId = hiveId;
  }

  const expense = await prisma.expense.create({
    data: {
      date: toISODate(date) || new Date(),
      amount: parseFloat(amount),
      category,
      ...hiveData,
      description, reason, photo,
      userId: req.user.id,
      workspaceId: req.workspaceId,
    },
  });
  return ok(res, expense);
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.expense.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Expense not found');

  const { date, amount, category, hiveId, description, reason, photo } = req.body;
  const data = {};
  if (date !== undefined) data.date = toISODate(date) || existing.date;
  if (amount !== undefined) data.amount = parseFloat(amount);
  if (category !== undefined) data.category = category;
  if (description !== undefined) data.description = description;
  if (reason !== undefined) data.reason = reason;
  if (photo !== undefined) data.photo = photo;
  if (hiveId !== undefined) {
    if (hiveId) {
      const hive = await prisma.hive.findFirst({ where: { id: hiveId, workspaceId: req.workspaceId } });
      data.hiveId = hive ? hiveId : null;
    } else {
      data.hiveId = null;
    }
  }

  const expense = await prisma.expense.update({ where: { id: req.params.id }, data });
  return ok(res, expense);
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.expense.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Expense not found');
  await prisma.expense.delete({ where: { id: req.params.id } });
  return ok(res, { id: req.params.id });
});
