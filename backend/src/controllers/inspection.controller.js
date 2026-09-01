import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler, toISODate } from '../utils/helpers.js';
import { HIVE_STRENGTHS } from '../utils/constants.js';

const DEFAULT_INSPECTION_INTERVAL_DAYS = 21;

export const list = asyncHandler(async (req, res) => {
  const { hiveId, from, to, limit } = req.query;
  const where = { workspaceId: req.workspaceId };
  if (hiveId) where.hiveId = hiveId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = toISODate(from);
    if (to) where.date.lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  let take = parseInt(limit);
  if (isNaN(take)) take = null;

  const inspections = await prisma.inspection.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { hive: { select: { number: true, name: true, status: true } } },
    ...(take ? { take } : {}),
  });
  return ok(res, inspections);
});

export const get = asyncHandler(async (req, res) => {
  const inspection = await prisma.inspection.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
    include: { hive: true },
  });
  if (!inspection) return fail(res, 404, 'Inspection not found');
  return ok(res, inspection);
});

export const create = asyncHandler(async (req, res) => {
  const { hiveId, date, time, temperature, weather, strength, queenPresent, queenSeen,
    layingPattern, broodQuantity, broodCondition, honeyStores, pollenStores,
    foodAvailable, healthStatus, parasites, diseases, observations, photos } = req.body;

  if (!hiveId) return fail(res, 400, 'Hive is required');
  const hive = await prisma.hive.findFirst({ where: { id: hiveId, workspaceId: req.workspaceId } });
  if (!hive) return fail(res, 404, 'Hive not found');

  const strengthVal = HIVE_STRENGTHS.includes(strength) ? strength : 'MEDIUM';

  const inspection = await prisma.inspection.create({
    data: {
      hiveId,
      date: toISODate(date) || new Date(),
      time, temperature: temperature !== undefined && temperature !== '' ? parseFloat(temperature) : null,
      weather,
      strength: strengthVal,
      queenPresent: queenPresent !== undefined ? queenPresent : null,
      queenSeen: queenSeen !== undefined ? queenSeen : null,
      layingPattern, broodQuantity, broodCondition, honeyStores, pollenStores,
      foodAvailable: foodAvailable !== undefined ? foodAvailable : null,
      healthStatus, parasites, diseases, observations,
      photos: photos ? JSON.stringify(photos) : null,
      userId: req.user.id,
      workspaceId: req.workspaceId,
    },
  });

  const today = toISODate(date) || new Date();
  const nextInspection = new Date(today);
  nextInspection.setDate(nextInspection.getDate() + DEFAULT_INSPECTION_INTERVAL_DAYS);

  const status = strengthVal === 'VERY_WEAK' || strengthVal === 'WEAK'
    ? 'WEAK' : 'ACTIVE';

  await prisma.hive.update({
    where: { id: hiveId },
    data: {
      lastInspection: today,
      nextInspection,
      strength: strengthVal,
      status,
      ...(queenPresent === false ? { queenPresent: false } : {}),
    },
  });

  return ok(res, inspection);
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.inspection.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Inspection not found');

  const { date, time, temperature, weather, strength, queenPresent, queenSeen,
    layingPattern, broodQuantity, broodCondition, honeyStores, pollenStores,
    foodAvailable, healthStatus, parasites, diseases, observations, photos } = req.body;

  const data = {};
  if (date !== undefined) data.date = toISODate(date) || existing.date;
  if (time !== undefined) data.time = time;
  if (temperature !== undefined) data.temperature = temperature === '' ? null : parseFloat(temperature);
  if (weather !== undefined) data.weather = weather;
  if (strength !== undefined && HIVE_STRENGTHS.includes(strength)) data.strength = strength;
  if (queenPresent !== undefined) data.queenPresent = queenPresent;
  if (queenSeen !== undefined) data.queenSeen = queenSeen;
  if (layingPattern !== undefined) data.layingPattern = layingPattern;
  if (broodQuantity !== undefined) data.broodQuantity = broodQuantity;
  if (broodCondition !== undefined) data.broodCondition = broodCondition;
  if (honeyStores !== undefined) data.honeyStores = honeyStores;
  if (pollenStores !== undefined) data.pollenStores = pollenStores;
  if (foodAvailable !== undefined) data.foodAvailable = foodAvailable;
  if (healthStatus !== undefined) data.healthStatus = healthStatus;
  if (parasites !== undefined) data.parasites = parasites;
  if (diseases !== undefined) data.diseases = diseases;
  if (observations !== undefined) data.observations = observations;
  if (photos !== undefined) data.photos = photos ? JSON.stringify(photos) : null;

  const inspection = await prisma.inspection.update({ where: { id: req.params.id }, data });
  return ok(res, inspection);
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.inspection.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Inspection not found');
  await prisma.inspection.delete({ where: { id: req.params.id } });
  return ok(res, { id: req.params.id });
});
