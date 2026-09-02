import prisma from '../lib/prisma.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';

/**
 * Export / import complet des donnees d'un espace de travail (workspace),
 * sous forme d'un unique fichier JSON. Sert de sauvegarde manuelle
 * telechargeable, restaurable sur un autre appareil / une autre base.
 */

const FORMAT = 'rucher-backup';
const VERSION = 1;

// Champs scalaires exportes/importes par modele (les cles etrangeres id,
// apiaryId, hiveId sont conservees ; userId et workspaceId sont reattribues
// a l'import).
const FIELDS = {
  apiary: ['id', 'name', 'location', 'description', 'createdAt'],
  hive: [
    'id', 'number', 'name', 'origin', 'type', 'beeRace', 'status', 'strength',
    'queenPresent', 'queenAge', 'queenIntroDate', 'lastInspection',
    'nextInspection', 'notes', 'photo', 'createdAt', 'apiaryId',
  ],
  queen: [
    'id', 'origin', 'race', 'age', 'introductionDate', 'quality',
    'broodProduction', 'notes', 'createdAt', 'hiveId',
  ],
  inspection: [
    'id', 'date', 'time', 'temperature', 'weather', 'strength', 'queenPresent',
    'queenSeen', 'layingPattern', 'broodQuantity', 'broodCondition',
    'honeyStores', 'pollenStores', 'foodAvailable', 'healthStatus', 'parasites',
    'diseases', 'observations', 'photos', 'createdAt', 'hiveId',
  ],
  task: [
    'id', 'type', 'date', 'time', 'priority', 'status', 'description',
    'createdAt', 'hiveId',
  ],
  harvest: [
    'id', 'date', 'honeyType', 'quantity', 'weight', 'jars', 'unitPrice',
    'totalPrice', 'lot', 'notes', 'photos', 'createdAt', 'hiveId',
  ],
  expense: [
    'id', 'date', 'amount', 'category', 'description', 'reason', 'photo',
    'createdAt', 'hiveId',
  ],
  revenue: [
    'id', 'date', 'amount', 'type', 'product', 'quantity', 'unitPrice',
    'totalPrice', 'customer', 'description', 'createdAt', 'hiveId',
  ],
};

const DATE_FIELDS = {
  apiary: ['createdAt'],
  hive: ['createdAt', 'queenIntroDate', 'lastInspection', 'nextInspection'],
  queen: ['createdAt', 'introductionDate'],
  inspection: ['createdAt', 'date'],
  task: ['createdAt', 'date'],
  harvest: ['createdAt', 'date'],
  expense: ['createdAt', 'date'],
  revenue: ['createdAt', 'date'],
};

// Collections dans l'ordre ou il faut les inserer (parents avant enfants).
const ORDER = ['apiaries', 'hives', 'queens', 'inspections', 'tasks', 'harvests', 'expenses', 'revenues'];
const COLLECTION_MODEL = {
  apiaries: 'apiary', hives: 'hive', queens: 'queen', inspections: 'inspection',
  tasks: 'task', harvests: 'harvest', expenses: 'expense', revenues: 'revenue',
};

const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
};

const coerceDates = (obj, dateKeys) => {
  for (const k of dateKeys) {
    const v = obj[k];
    if (v === undefined) continue;
    if (v === null || v === '') { obj[k] = null; continue; }
    const d = new Date(v);
    obj[k] = isNaN(d.getTime()) ? null : d;
  }
  return obj;
};

const requireOwner = async (req) => {
  if (!req.workspaceId) return 'No active workspace';
  const member = await prisma.workspaceMember.findFirst({
    where: { userId: req.user.id, workspaceId: req.workspaceId },
  });
  if (!member || member.role !== 'OWNER') return 'Only the workspace owner can do this';
  return null;
};

export const exportData = asyncHandler(async (req, res) => {
  if (!req.workspaceId) return fail(res, 400, 'No active workspace');
  const wsId = req.workspaceId;

  const workspace = await prisma.workspace.findUnique({ where: { id: wsId } });
  if (!workspace) return fail(res, 404, 'Workspace not found');

  const [apiaries, hives, queens, inspections, tasks, harvests, expenses, revenues] = await Promise.all([
    prisma.apiary.findMany({ where: { workspaceId: wsId }, orderBy: { createdAt: 'asc' } }),
    prisma.hive.findMany({ where: { workspaceId: wsId }, orderBy: { number: 'asc' } }),
    prisma.queen.findMany({ where: { hive: { workspaceId: wsId } }, orderBy: { createdAt: 'asc' } }),
    prisma.inspection.findMany({ where: { workspaceId: wsId }, orderBy: { date: 'asc' } }),
    prisma.task.findMany({ where: { workspaceId: wsId }, orderBy: { date: 'asc' } }),
    prisma.harvest.findMany({ where: { workspaceId: wsId }, orderBy: { date: 'asc' } }),
    prisma.expense.findMany({ where: { workspaceId: wsId }, orderBy: { date: 'asc' } }),
    prisma.revenue.findMany({ where: { workspaceId: wsId }, orderBy: { date: 'asc' } }),
  ]);

  const strip = (rows, model) => rows.map((r) => pick(r, FIELDS[model]));

  const payload = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    workspace: { name: workspace.name, code: workspace.code },
    counts: {
      apiaries: apiaries.length, hives: hives.length, queens: queens.length,
      inspections: inspections.length, tasks: tasks.length, harvests: harvests.length,
      expenses: expenses.length, revenues: revenues.length,
    },
    apiaries: strip(apiaries, 'apiary'),
    hives: strip(hives, 'hive'),
    queens: strip(queens, 'queen'),
    inspections: strip(inspections, 'inspection'),
    tasks: strip(tasks, 'task'),
    harvests: strip(harvests, 'harvest'),
    expenses: strip(expenses, 'expense'),
    revenues: strip(revenues, 'revenue'),
  };

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="rucher-${stamp}.json"`);
  return res.send(JSON.stringify(payload, null, 2));
});

export const importData = asyncHandler(async (req, res) => {
  const denied = await requireOwner(req);
  if (denied) return fail(res, denied === 'No active workspace' ? 400 : 403, denied);

  const wsId = req.workspaceId;
  const userId = req.user.id;
  const body = req.body || {};

  if (body.format !== FORMAT) {
    return fail(res, 400, 'Invalid file: not a rucher backup');
  }
  for (const key of ORDER) {
    if (body[key] !== undefined && !Array.isArray(body[key])) {
      return fail(res, 400, `Invalid file: "${key}" must be a list`);
    }
  }

  // Prepare rows per collection (whitelist fields, coerce dates, reassign owner/workspace).
  const prepared = {};
  for (const key of ORDER) {
    const model = COLLECTION_MODEL[key];
    const rows = Array.isArray(body[key]) ? body[key] : [];
    prepared[key] = rows.map((raw) => {
      const row = coerceDates(pick(raw || {}, FIELDS[model]), DATE_FIELDS[model]);
      if (model !== 'queen') { row.workspaceId = wsId; row.userId = userId; }
      return row;
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    // Wipe current workspace content, children first.
    await tx.revenue.deleteMany({ where: { workspaceId: wsId } });
    await tx.expense.deleteMany({ where: { workspaceId: wsId } });
    await tx.harvest.deleteMany({ where: { workspaceId: wsId } });
    await tx.task.deleteMany({ where: { workspaceId: wsId } });
    await tx.inspection.deleteMany({ where: { workspaceId: wsId } });
    await tx.queen.deleteMany({ where: { hive: { workspaceId: wsId } } });
    await tx.hive.deleteMany({ where: { workspaceId: wsId } });
    await tx.apiary.deleteMany({ where: { workspaceId: wsId } });

    const counts = {};
    for (const key of ORDER) {
      const model = COLLECTION_MODEL[key];
      const rows = prepared[key];
      if (rows.length) {
        await tx[model].createMany({ data: rows });
      }
      counts[key] = rows.length;
    }
    return counts;
  }, { timeout: 60000 });

  return ok(res, { imported: result });
});
