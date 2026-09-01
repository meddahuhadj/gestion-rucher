import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { env } from '../config/env.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';

const signToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES,
  });
};

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  currency: user.currency,
  language: user.language,
  reminderDays: user.reminderDays,
  currentWorkspaceId: user.currentWorkspaceId,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return fail(res, 400, 'Name, email and password are required');
  }
  if (password.length < 6) {
    return fail(res, 400, 'Password must be at least 6 characters');
  }
  const emailLower = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) return fail(res, 409, 'Email already registered');

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: emailLower, password: hashed },
  });
  return ok(res, { token: signToken(user), user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 400, 'Email and password are required');

  const emailLower = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: emailLower } });
  if (!user) return fail(res, 401, 'Invalid credentials');

  const match = await bcrypt.compare(password, user.password);
  if (!match) return fail(res, 401, 'Invalid credentials');

  return ok(res, { token: signToken(user), user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  return ok(res, publicUser(req.user));
});
