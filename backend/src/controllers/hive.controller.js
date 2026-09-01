import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler, toISODate } from '../utils/helpers.js';
import { HIVE_STATUSES } from '../utils/constants.js';

export const list = asyncHandler(async (req, res) => {
  if (!req.workspaceId) return fail(res, 400, 'No active workspace');
  const { apiaryId, status, strength, q } = req.query;
  const where = { workspaceId: req.workspaceId };

  if (apiaryId) where.apiaryId = apiaryId;
  if (status) where.status = status;
  if (strength) where.strength = strength;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { number: { equals: isNaN(parseInt(q)) ? undefined : parseInt(q) } },
    ];
  }

  let hives = await prisma.hive.findMany({
    where,
    orderBy: { number: 'asc' },
    include: {
      apiary: true,
      user: { select: { id: true, name: true } },
      _count: { select: { inspections: true } },
    },
  });

  if (q && where.OR) {
    hives = hives.filter(
      (h) =>
        (h.name && h.name.toLowerCase().includes(q.toLowerCase())) ||
        h.number === parseInt(q)
    );
  }

  return ok(res, hives);
});

export const get = asyncHandler(async (req, res) => {
  const hive = await prisma.hive.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
    include: {
      apiary: true,
      user: { select: { id: true, name: true } },
      inspections: { orderBy: { date: 'desc' }, take: 5 },
      queens: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!hive) return fail(res, 404, 'Hive not found');
  return ok(res, hive);
});

export const create = asyncHandler(async (req, res) => {
  if (!req.workspaceId) return fail(res, 400, 'No active workspace');
  const {
    number, name, origin, type, beeRace, status, strength, queenPresent,
    queenAge, queenIntroDate, notes, photo, apiaryId,
  } = req.body;

  if (!apiaryId) return fail(res, 400, 'Apiary is required');
  const apiary = await prisma.apiary.findFirst({
    where: { id: apiaryId, workspaceId: req.workspaceId },
  });
  if (!apiary) return fail(res, 404, 'Apiary not found');

  let n = number;
  if (!n) {
    const last = await prisma.hive.findFirst({
      where: { workspaceId: req.workspaceId },
      orderBy: { number: 'desc' },
    });
    n = last ? last.number + 1 : 1;
  }

  const candidates = n;
  let finalNumber = n;
  while (await prisma.hive.findFirst({ where: { workspaceId: req.workspaceId, number: finalNumber } })) {
    finalNumber += 1;
  }
  if (finalNumber !== candidates) {
    const last = await prisma.hive.findFirst({ where: { workspaceId: req.workspaceId }, orderBy: { number: 'desc' } });
    finalNumber = last ? last.number + 1 : 1;
  }

  const statusVal = HIVE_STATUSES.includes(status) ? status : 'ACTIVE';

  const hive = await prisma.hive.create({
    data: {
      number: finalNumber,
      name, origin, type, beeRace,
      status: statusVal,
      strength: strength || 'MEDIUM',
      queenPresent: queenPresent !== undefined ? queenPresent : true,
      queenAge,
      queenIntroDate: toISODate(queenIntroDate),
      notes, photo,
      apiaryId,
      userId: req.user.id,
      workspaceId: req.workspaceId,
    },
  });
  return ok(res, hive);
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.hive.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Hive not found');

  const {
    number, name, origin, type, beeRace, status, strength, queenPresent,
    queenAge, queenIntroDate, notes, photo, apiaryId,
  } = req.body;

  const data = {};
  if (number !== undefined) data.number = parseInt(number);
  if (name !== undefined) data.name = name;
  if (origin !== undefined) data.origin = origin;
  if (type !== undefined) data.type = type;
  if (beeRace !== undefined) data.beeRace = beeRace;
  if (status !== undefined && HIVE_STATUSES.includes(status)) data.status = status;
  if (strength !== undefined) data.strength = strength;
  if (queenPresent !== undefined) data.queenPresent = queenPresent;
  if (queenAge !== undefined) data.queenAge = queenAge === '' ? null : parseInt(queenAge);
  if (queenIntroDate !== undefined) data.queenIntroDate = toISODate(queenIntroDate);
  if (notes !== undefined) data.notes = notes;
  if (photo !== undefined) data.photo = photo;
  if (apiaryId !== undefined) {
    const apiary = await prisma.apiary.findFirst({ where: { id: apiaryId, workspaceId: req.workspaceId } });
    if (!apiary) return fail(res, 404, 'Apiary not found');
    data.apiaryId = apiaryId;
  }

  const hive = await prisma.hive.update({ where: { id: req.params.id }, data });
  return ok(res, hive);
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.hive.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Hive not found');
  await prisma.hive.delete({ where: { id: req.params.id } });
  return ok(res, { id: req.params.id });
});
