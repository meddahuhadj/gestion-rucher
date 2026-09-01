import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler, toISODate } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const { type, hiveId, from, to } = req.query;
  const where = { workspaceId: req.workspaceId };
  if (type) where.type = type;
  if (hiveId) where.hiveId = hiveId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = toISODate(from);
    if (to) where.date.lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }
  const revenues = await prisma.revenue.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { hive: { select: { number: true, name: true } } },
  });
  return ok(res, revenues);
});

export const get = asyncHandler(async (req, res) => {
  const revenue = await prisma.revenue.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
    include: { hive: true },
  });
  if (!revenue) return fail(res, 404, 'Revenue not found');
  return ok(res, revenue);
});

export const create = asyncHandler(async (req, res) => {
  const { date, amount, type, product, quantity, unitPrice, totalPrice, customer, hiveId, description } = req.body;
  if (amount === undefined && totalPrice === undefined) return fail(res, 400, 'Amount is required');
  if (!type) return fail(res, 400, 'Type is required');

  const qty = quantity !== undefined && quantity !== '' ? parseInt(quantity) : null;
  const unitP = unitPrice !== undefined && unitPrice !== '' ? parseFloat(unitPrice) : null;

  let total;
  if (amount !== undefined && amount !== '') {
    total = parseFloat(amount);
  } else if (totalPrice !== undefined && totalPrice !== '') {
    total = parseFloat(totalPrice);
  } else {
    total = qty && unitP ? qty * unitP : null;
  }

  let hiveData = {};
  if (hiveId) {
    const hive = await prisma.hive.findFirst({ where: { id: hiveId, workspaceId: req.workspaceId } });
    if (hive) hiveData.hiveId = hiveId;
  }

  const revenue = await prisma.revenue.create({
    data: {
      date: toISODate(date) || new Date(),
      amount: total,
      type,
      product,
      quantity: qty,
      unitPrice: unitP,
      totalPrice: total,
      customer,
      ...hiveData,
      description,
      userId: req.user.id,
      workspaceId: req.workspaceId,
    },
  });
  return ok(res, revenue);
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.revenue.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Revenue not found');

  const { date, amount, type, product, quantity, unitPrice, totalPrice, customer, hiveId, description } = req.body;
  const data = {};
  if (date !== undefined) data.date = toISODate(date) || existing.date;
  if (amount !== undefined) data.amount = parseFloat(amount);
  if (type !== undefined) data.type = type;
  if (product !== undefined) data.product = product;
  if (quantity !== undefined) data.quantity = quantity === '' ? null : parseInt(quantity);
  if (unitPrice !== undefined) data.unitPrice = unitPrice === '' ? null : parseFloat(unitPrice);
  if (totalPrice !== undefined) data.totalPrice = totalPrice === '' ? null : parseFloat(totalPrice);
  if (customer !== undefined) data.customer = customer;
  if (description !== undefined) data.description = description;
  if (hiveId !== undefined) {
    if (hiveId) {
      const hive = await prisma.hive.findFirst({ where: { id: hiveId, workspaceId: req.workspaceId } });
      data.hiveId = hive ? hiveId : null;
    } else {
      data.hiveId = null;
    }
  }

  const revenue = await prisma.revenue.update({ where: { id: req.params.id }, data });
  return ok(res, revenue);
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.revenue.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Revenue not found');
  await prisma.revenue.delete({ where: { id: req.params.id } });
  return ok(res, { id: req.params.id });
});
