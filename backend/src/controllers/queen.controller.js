import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler, toISODate } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const { hiveId } = req.query;
  const where = hiveId ? { hiveId, hive: { workspaceId: req.workspaceId } } : { hive: { workspaceId: req.workspaceId } };
  const queens = await prisma.queen.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { hive: { select: { number: true, name: true } } },
  });
  return ok(res, queens);
});

export const get = asyncHandler(async (req, res) => {
  const queen = await prisma.queen.findFirst({
    where: { id: req.params.id, hive: { workspaceId: req.workspaceId } },
    include: { hive: true },
  });
  if (!queen) return fail(res, 404, 'Queen not found');
  return ok(res, queen);
});

export const create = asyncHandler(async (req, res) => {
  const { hiveId, origin, race, age, introductionDate, quality, broodProduction, notes } = req.body;
  if (!hiveId) return fail(res, 400, 'Hive is required');
  const hive = await prisma.hive.findFirst({ where: { id: hiveId, workspaceId: req.workspaceId } });
  if (!hive) return fail(res, 404, 'Hive not found');

  const queen = await prisma.queen.create({
    data: {
      hiveId,
      origin, race,
      age: age !== undefined && age !== '' ? parseInt(age) : null,
      introductionDate: toISODate(introductionDate),
      quality, broodProduction, notes,
    },
  });

  await prisma.hive.update({
    where: { id: hiveId },
    data: {
      ...(age !== undefined && age !== '' && { queenAge: parseInt(age) }),
      ...(introductionDate && { queenIntroDate: toISODate(introductionDate) }),
      queenPresent: true,
    },
  });

  return ok(res, queen);
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.queen.findFirst({
    where: { id: req.params.id, hive: { workspaceId: req.workspaceId } },
  });
  if (!existing) return fail(res, 404, 'Queen not found');

  const { origin, race, age, introductionDate, quality, broodProduction, notes } = req.body;
  const data = {};
  if (origin !== undefined) data.origin = origin;
  if (race !== undefined) data.race = race;
  if (age !== undefined) data.age = age === '' ? null : parseInt(age);
  if (introductionDate !== undefined) data.introductionDate = toISODate(introductionDate);
  if (quality !== undefined) data.quality = quality;
  if (broodProduction !== undefined) data.broodProduction = broodProduction;
  if (notes !== undefined) data.notes = notes;

  const queen = await prisma.queen.update({ where: { id: req.params.id }, data });
  return ok(res, queen);
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.queen.findFirst({
    where: { id: req.params.id, hive: { workspaceId: req.workspaceId } },
  });
  if (!existing) return fail(res, 404, 'Queen not found');
  await prisma.queen.delete({ where: { id: req.params.id } });
  return ok(res, { id: req.params.id });
});
