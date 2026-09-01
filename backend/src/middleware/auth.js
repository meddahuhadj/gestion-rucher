import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { env } from '../config/env.js';
import { fail } from '../utils/helpers.js';

export const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return fail(res, 401, 'Unauthorized');

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return fail(res, 401, 'Unauthorized');

    let workspaceId = req.headers['x-workspace-id'] || user.currentWorkspaceId;
    if (workspaceId) {
      const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id, workspaceId },
      });
      if (!member) workspaceId = null;
    }

    req.user = user;
    req.workspaceId = workspaceId;
    next();
  } catch (err) {
    return fail(res, 401, 'Unauthorized');
  }
};
