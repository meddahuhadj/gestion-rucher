import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler, toISODate } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const { hiveId, from, to } = req.query;
  const where = { workspaceId: req.workspaceId };
  if (hiveId) where.hiveId = hiveId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = toISODate(from);
    if (to) where.date.lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }
  const harvests = await prisma.harvest.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { hive: { select: { number: true, name: true } } },
  });
  return ok(res, harvests);
});

export const get = asyncHandler(async (req, res) => {
  const harvest = await prisma.harvest.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
    include: { hive: true },
  });
  if (!harvest) return fail(res, 404, 'Harvest not found');
  return ok(res, harvest);
});

export const create = asyncHandler(async (req, res) => {
  const { hiveId, date, honeyType, quantity, weight, jars, unitPrice, totalPrice, lot, notes, photos } = req.body;
  if (!hiveId) return fail(res, 400, 'Hive is required');
  const hive = await prisma.hive.findFirst({ where: { id: hiveId, workspaceId: req.workspaceId } });
  if (!hive) return fail(res, 404, 'Hive not found');

  const qty = quantity !== undefined && quantity !== '' ? parseInt(quantity) : null;
  const unitP = unitPrice !== undefined && unitPrice !== '' ? parseFloat(unitPrice) : null;
  const total = totalPrice !== undefined && totalPrice !== ''
    ? parseFloat(totalPrice)
    : (qty && unitP ? qty * unitP : (weight && unitP ? weight * unitP : null));

  const harvest = await prisma.harvest.create({
    data: {
      hiveId,
      date: toISODate(date) || new Date(),
      honeyType,
      quantity: qty,
      weight: weight !== undefined && weight !== '' ? parseFloat(weight) : null,
      jars: jars !== undefined && jars !== '' ? parseInt(jars) : null,
      unitPrice: unitP,
      totalPrice: total,
      lot, notes,
      photos: photos ? JSON.stringify(photos) : null,
      userId: req.user.id,
      workspaceId: req.workspaceId,
    },
  });
  return ok(res, harvest);
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.harvest.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Harvest not found');

  const { date, honeyType, quantity, weight, jars, unitPrice, totalPrice, lot, notes, photos } = req.body;
  const data = {};
  if (date !== undefined) data.date = toISODate(date) || existing.date;
  if (honeyType !== undefined) data.honeyType = honeyType;
  if (quantity !== undefined) data.quantity = quantity === '' ? null : parseInt(quantity);
  if (weight !== undefined) data.weight = weight === '' ? null : parseFloat(weight);
  if (jars !== undefined) data.jars = jars === '' ? null : parseInt(jars);
  if (unitPrice !== undefined) data.unitPrice = unitPrice === '' ? null : parseFloat(unitPrice);
  if (totalPrice !== undefined) data.totalPrice = totalPrice === '' ? null : parseFloat(totalPrice);
  if (lot !== undefined) data.lot = lot;
  if (notes !== undefined) data.notes = notes;
  if (photos !== undefined) data.photos = photos ? JSON.stringify(photos) : null;

  const harvest = await prisma.harvest.update({ where: { id: req.params.id }, data });
  return ok(res, harvest);
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.harvest.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Harvest not found');
  await prisma.harvest.delete({ where: { id: req.params.id } });
  return ok(res, { id: req.params.id });
});
