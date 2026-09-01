import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  if (!req.workspaceId) return fail(res, 400, 'No active workspace');
  const apiaries = await prisma.apiary.findMany({
    where: { workspaceId: req.workspaceId },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { hives: true } },
      hives: {
        orderBy: { number: 'asc' },
        select: { id: true, number: true, status: true, strength: true, name: true },
      },
    },
  });
  return ok(res, apiaries);
});

export const get = asyncHandler(async (req, res) => {
  if (!req.workspaceId) return fail(res, 400, 'No active workspace');
  const apiary = await prisma.apiary.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
    include: {
      hives: {
        orderBy: { number: 'asc' },
        include: { _count: { select: { inspections: true } } },
      },
    },
  });
  if (!apiary) return fail(res, 404, 'Apiary not found');
  return ok(res, apiary);
});

export const create = asyncHandler(async (req, res) => {
  if (!req.workspaceId) return fail(res, 400, 'No active workspace');
  const { name, location, description } = req.body;
  if (!name) return fail(res, 400, 'Name is required');
  const apiary = await prisma.apiary.create({
    data: {
      name: name.trim(),
      location,
      description,
      userId: req.user.id,
      workspaceId: req.workspaceId,
    },
  });
  return ok(res, apiary);
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.apiary.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Apiary not found');

  const { name, location, description } = req.body;
  const apiary = await prisma.apiary.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(location !== undefined && { location }),
      ...(description !== undefined && { description }),
    },
  });
  return ok(res, apiary);
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.apiary.findFirst({
    where: { id: req.params.id, workspaceId: req.workspaceId },
  });
  if (!existing) return fail(res, 404, 'Apiary not found');
  await prisma.apiary.delete({ where: { id: req.params.id } });
  return ok(res, { id: req.params.id });
});
