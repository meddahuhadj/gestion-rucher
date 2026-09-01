import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, email, currency, language, reminderDays, password, newPassword } = req.body;

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (email !== undefined) data.email = email.toLowerCase().trim();
  if (currency !== undefined) data.currency = currency;
  if (language !== undefined) data.language = language;
  if (reminderDays !== undefined) data.reminderDays = parseInt(reminderDays);

  if (newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const match = await bcrypt.compare(password || '', user.password);
    if (!match) return fail(res, 400, 'Current password is incorrect');
    if (newPassword.length < 6) return fail(res, 400, 'New password must be at least 6 characters');
    data.password = await bcrypt.hash(newPassword, 10);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return ok(res, {
    id: user.id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    language: user.language,
    reminderDays: user.reminderDays,
    currentWorkspaceId: user.currentWorkspaceId,
  });
});
