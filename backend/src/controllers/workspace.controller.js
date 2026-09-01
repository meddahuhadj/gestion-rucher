import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';

const generateCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

export const current = asyncHandler(async (req, res) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: req.user.id },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    code: m.workspace.code,
    role: m.role,
    members: m.workspace.members.map((wm) => ({
      id: wm.user.id,
      name: wm.user.name,
      email: wm.user.email,
      role: wm.role,
    })),
  }));

  const activeId = req.user.currentWorkspaceId
    ? workspaces.find((w) => w.id === req.user.currentWorkspaceId)
      ? req.user.currentWorkspaceId
      : (workspaces[0] && workspaces[0].id)
    : (workspaces[0] && workspaces[0].id);

  return ok(res, { workspaces, activeId, active: workspaces.find((w) => w.id === activeId) || null });
});

export const create = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) return fail(res, 400, 'Workspace name is required');

  let code;
  do {
    code = generateCode();
  } while (await prisma.workspace.findUnique({ where: { code } }));

  const workspace = await prisma.workspace.create({
    data: { name: name.trim(), code },
  });

  await prisma.workspaceMember.create({
    data: { userId: req.user.id, workspaceId: workspace.id, role: 'OWNER' },
  });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { currentWorkspaceId: workspace.id },
  });

  return ok(res, {
    id: workspace.id,
    name: workspace.name,
    code: workspace.code,
    role: 'OWNER',
    members: [{ id: req.user.id, name: req.user.name, email: req.user.email, role: 'OWNER' }],
  });
});

export const join = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return fail(res, 400, 'Code is required');

  const normalized = code.trim().toUpperCase();
  const workspace = await prisma.workspace.findUnique({ where: { code: normalized } });
  if (!workspace) return fail(res, 404, 'Workspace not found');

  const existing = await prisma.workspaceMember.findFirst({
    where: { userId: req.user.id, workspaceId: workspace.id },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { currentWorkspaceId: workspace.id },
    });
    return ok(res, { id: workspace.id, name: workspace.name, code: workspace.code, role: existing.role, alreadyMember: true });
  }

  const member = await prisma.workspaceMember.create({
    data: { userId: req.user.id, workspaceId: workspace.id, role: 'MEMBER' },
  });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { currentWorkspaceId: workspace.id },
  });

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return ok(res, {
    id: workspace.id,
    name: workspace.name,
    code: workspace.code,
    role: member.role,
    members: members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email, role: m.role })),
  });
});

export const setActive = asyncHandler(async (req, res) => {
  const { workspaceId } = req.body;
  if (!workspaceId) return fail(res, 400, 'workspaceId is required');

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: req.user.id, workspaceId },
  });
  if (!member) return fail(res, 404, 'Workspace not found');

  await prisma.user.update({
    where: { id: req.user.id },
    data: { currentWorkspaceId: workspaceId },
  });

  return ok(res, { workspaceId });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { workspaceId, userId } = req.params;

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: req.user.id, workspaceId },
  });
  if (!member) return fail(res, 404, 'Workspace not found');
  if (member.role !== 'OWNER') return fail(res, 403, 'Only the owner can remove members');

  const target = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });
  if (!target) return fail(res, 404, 'Member not found');
  if (target.role === 'OWNER') return fail(res, 400, 'Cannot remove the owner');

  await prisma.workspaceMember.delete({ where: { id: target.id } });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.currentWorkspaceId === workspaceId) {
    const other = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: { not: workspaceId } },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { currentWorkspaceId: other ? other.workspaceId : null },
    });
  }

  return ok(res, { workspaceId, userId });
});

export const leave = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: req.user.id, workspaceId },
  });
  if (!member) return fail(res, 404, 'Workspace not found');

  const ownerCount = await prisma.workspaceMember.count({
    where: { workspaceId, role: 'OWNER' },
  });
  if (member.role === 'OWNER' && ownerCount <= 1) {
    return fail(res, 400, 'The owner cannot leave the workspace. Transfer ownership or delete it.');
  }

  await prisma.workspaceMember.delete({ where: { id: member.id } });

  const other = await prisma.workspaceMember.findFirst({
    where: { userId: req.user.id },
  });
  await prisma.user.update({
    where: { id: req.user.id },
    data: { currentWorkspaceId: other ? other.workspaceId : null },
  });

  return ok(res, { workspaceId });
});

export const transferOwner = asyncHandler(async (req, res) => {
  const { workspaceId, userId } = req.params;

  const requester = await prisma.workspaceMember.findFirst({
    where: { userId: req.user.id, workspaceId },
  });
  if (!requester) return fail(res, 404, 'Workspace not found');
  if (requester.role !== 'OWNER') return fail(res, 403, 'Only the owner can transfer ownership');

  const target = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });
  if (!target) return fail(res, 404, 'Member not found');
  if (target.id === requester.id) return fail(res, 400, 'Already the owner');

  await prisma.$transaction([
    prisma.workspaceMember.update({
      where: { id: requester.id },
      data: { role: 'MEMBER' },
    }),
    prisma.workspaceMember.update({
      where: { id: target.id },
      data: { role: 'OWNER' },
    }),
  ]);

  return ok(res, { workspaceId, newOwnerId: userId });
});
