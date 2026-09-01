import prisma from '../lib/prisma.js';
import { ok, asyncHandler, toISODate } from '../utils/helpers.js';
import { generateNotifications } from '../services/notification.service.js';

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const dashboard = asyncHandler(async (req, res) => {
  const ws = req.workspaceId;
  const now = new Date();
  const todayISO = now.toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  generateNotifications(ws);

  const [hives, tasks, expenses, revenues, inspections] = await Promise.all([
    prisma.hive.findMany({ where: { workspaceId: ws } }),
    prisma.task.findMany({ where: { workspaceId: ws, status: { in: ['TODO', 'IN_PROGRESS'] } }, include: { hive: { select: { number: true, name: true } } } }),
    prisma.expense.aggregate({ where: { workspaceId: ws }, _sum: { amount: true } }),
    prisma.revenue.aggregate({ where: { workspaceId: ws }, _sum: { amount: true } }),
    prisma.inspection.findMany({ where: { workspaceId: ws }, include: { hive: { select: { number: true, name: true } } }, orderBy: { date: 'desc' }, take: 30 }),
  ]);

  const totalExpenses = expenses._sum.amount || 0;
  const totalRevenues = revenues._sum.amount || 0;

  const upcomingTasks = tasks
    .filter((t) => new Date(t.date) >= startOfDay(now))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);

  const overdueTasks = tasks.filter((t) => new Date(t.date) < startOfDay(now) && t.date);

  const weakHives = hives.filter((h) => ['WEAK', 'VERY_WEAK'].includes(h.strength) || h.status === 'WEAK');
  const deadHives = hives.filter((h) => h.status === 'DEAD');
  const activeHives = hives.filter((h) => h.status === 'ACTIVE');
  const strongHives = hives.filter((h) => ['VERY_STRONG', 'STRONG'].includes(h.strength));
  const mediumHives = hives.filter((h) => h.strength === 'MEDIUM');

  const needsInspection = hives.filter((h) => {
    if (h.status !== 'ACTIVE' && h.status !== 'WEAK') return false;
    if (!h.lastInspection) return true;
    const days = (now - new Date(h.lastInspection)) / (1000 * 3600 * 24);
    return days >= 15;
  });

  const monthlyExpenses = {};
  const monthlyRevenues = {};
  const allExpenses = await prisma.expense.findMany({ where: { workspaceId: ws }, select: { date: true, amount: true } });
  const allRevenues = await prisma.revenue.findMany({ where: { workspaceId: ws }, select: { date: true, amount: true } });

  for (const e of allExpenses) {
    const k = monthKey(new Date(e.date));
    monthlyExpenses[k] = (monthlyExpenses[k] || 0) + e.amount;
  }
  for (const r of allRevenues) {
    const k = monthKey(new Date(r.date));
    monthlyRevenues[k] = (monthlyRevenues[k] || 0) + r.amount;
  }

  const last6 = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d);
    last6.push({ month: k, expenses: monthlyExpenses[k] || 0, revenues: monthlyRevenues[k] || 0 });
  }

  const monthlyRevenue = allRevenues
    .filter((r) => new Date(r.date) >= startOfMonth)
    .reduce((s, r) => s + r.amount, 0);
  const monthlyExpense = allExpenses
    .filter((e) => new Date(e.date) >= startOfMonth)
    .reduce((s, e) => s + e.amount, 0);

  return ok(res, {
    hiveCounts: {
      total: hives.length,
      active: activeHives.length,
      strong: strongHives.length,
      medium: mediumHives.length,
      weak: weakHives.length,
      dead: deadHives.length,
    },
    finances: {
      totalExpenses,
      totalRevenues,
      netProfit: totalRevenues - totalExpenses,
      monthlyExpense,
      monthlyRevenue,
      monthlyProfit: monthlyRevenue - monthlyExpense,
    },
    upcomingTasks,
    overdueTasks,
    needsInspection,
    recentInspections: inspections.slice(0, 10),
    monthlyTrend: last6,
    todayISO,
  });
});

export const overview = asyncHandler(async (req, res) => {
  const ws = req.workspaceId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [hives, expenses, revenues, harvests, inspections] = await Promise.all([
    prisma.hive.findMany({
      where: { workspaceId: ws },
      include: { harvests: true },
    }),
    prisma.expense.findMany({ where: { workspaceId: ws } }),
    prisma.revenue.findMany({ where: { workspaceId: ws } }),
    prisma.harvest.findMany({ where: { workspaceId: ws }, include: { hive: { select: { number: true, name: true } } } }),
    prisma.inspection.count({ where: { workspaceId: ws } }),
  ]);

  const sum = (arr, fn) => arr.reduce((s, x) => s + (fn(x) || 0), 0);

  const expThisMonth = expenses.filter((e) => new Date(e.date) >= startOfMonth);
  const revThisMonth = revenues.filter((r) => new Date(r.date) >= startOfMonth);
  const expThisYear = expenses.filter((e) => new Date(e.date) >= startOfYear);
  const revThisYear = revenues.filter((r) => new Date(r.date) >= startOfYear);

  const byCategory = {};
  for (const e of expenses) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  const byType = {};
  for (const r of revenues) byType[r.type] = (byType[r.type] || 0) + r.amount;

  const monthlyTrend = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d);
    const ex = expenses.filter((e) => monthKey(new Date(e.date)) === k).reduce((s, e) => s + e.amount, 0);
    const re = revenues.filter((r) => monthKey(new Date(r.date)) === k).reduce((s, r) => s + r.amount, 0);
    monthlyTrend.push({ month: k, expenses: ex, revenues: re });
  }

  const honeyProduction = harvests.reduce((s, h) => s + (h.quantity || 0), 0);
  const producerHives = hives
    .map((h) => ({ number: h.number, name: h.name, total: sum(h.harvests, (x) => x.quantity || 0) }))
    .sort((a, b) => b.total - a.total);

  const statusDist = {};
  for (const h of hives) statusDist[h.status] = (statusDist[h.status] || 0) + 1;
  const strengthDist = {};
  for (const h of hives) strengthDist[h.strength] = (strengthDist[h.strength] || 0) + 1;

  const productivity = activeHives => {
    const actives = hives.filter((h) => h.status === 'ACTIVE' || h.status === 'WEAK');
    return actives.length ? honeyProduction / actives.length : 0;
  };

  return ok(res, {
    totalExpenses: sum(expenses, (e) => e.amount),
    totalRevenues: sum(revenues, (r) => r.amount),
    netProfit: sum(revenues, (r) => r.amount) - sum(expenses, (e) => e.amount),
    monthlyExpense: sum(expThisMonth, (e) => e.amount),
    monthlyRevenue: sum(revThisMonth, (r) => r.amount),
    monthlyProfit: sum(revThisMonth, (r) => r.amount) - sum(expThisMonth, (e) => e.amount),
    annualExpense: sum(expThisYear, (e) => e.amount),
    annualRevenue: sum(revThisYear, (r) => r.amount),
    annualProfit: sum(revThisYear, (r) => r.amount) - sum(expThisYear, (e) => e.amount),
    byCategory,
    byType,
    monthlyTrend,
    hives: hives.length,
    inspections,
    harvestsCount: harvests.length,
    honeyProduction,
    averageProduction: productivity(hives),
    producerHives,
    statusDist,
    strengthDist,
  });
});
