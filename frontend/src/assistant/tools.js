// Bridges the Gemini Live assistant to the Nahala app data.
// Every tool goes through the existing REST API (`../api`), so it inherits the
// current auth token + active workspace from the axios interceptors.

import {
  apiaryApi, hiveApi, taskApi, inspectionApi, harvestApi, statsApi,
} from '../api';

const TASK_TYPES = [
  'INSPECTION', 'DIVISION', 'RENFORCEMENT', 'FEEDING', 'ADD_SUGAR', 'ADD_SYRUP',
  'ADD_FRAME', 'REMOVE_FRAME', 'ADD_SUPER', 'TREATMENT', 'QUEEN_CHECK',
  'QUEEN_REPLACEMENT', 'HARVEST', 'HIVING_TRANSFER', 'FUSION', 'WINTER_PREP', 'OTHER',
];
const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'POSTPONED', 'CANCELLED'];
const TASK_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const HIVE_STATUSES = ['ACTIVE', 'WEAK', 'DEAD', 'SOLD', 'MERGED', 'ARCHIVED'];
const HIVE_STRENGTHS = ['VERY_STRONG', 'STRONG', 'MEDIUM', 'WEAK', 'VERY_WEAK'];

const shortDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
const norm = (s) => (s || '').toString().trim().toLowerCase();

// --- Function declarations sent to Gemini ---------------------------------

export const functionDeclarations = [
  {
    name: 'list_apiaries',
    description: "Liste les ruchers (emplacements) de l'espace de travail avec leur nombre de ruches.",
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_overview',
    description:
      "Tableau de bord : nombre de ruches par état, finances (dépenses, revenus, bénéfice), nombre de travaux à venir / en retard, ruches à inspecter.",
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'list_hives',
    description: "Liste les ruches, avec filtres optionnels. Renvoie numéro, nom, rucher, état, force, présence de reine et dates d'inspection.",
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', enum: HIVE_STATUSES, description: 'Filtrer par état' },
        strength: { type: 'STRING', enum: HIVE_STRENGTHS, description: 'Filtrer par force' },
        apiaryName: { type: 'STRING', description: 'Nom du rucher (approximatif)' },
        query: { type: 'STRING', description: 'Recherche par nom ou numéro de ruche' },
      },
    },
  },
  {
    name: 'list_tasks',
    description: 'Liste les travaux / tâches. Par défaut seulement ceux à faire (TODO / en cours).',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', enum: TASK_STATUSES, description: 'Filtrer par statut' },
        hiveNumber: { type: 'NUMBER', description: 'Numéro de la ruche concernée' },
        includeDone: { type: 'BOOLEAN', description: 'Inclure aussi les travaux terminés / annulés' },
      },
    },
  },
  {
    name: 'list_inspections',
    description: 'Liste les inspections récentes, éventuellement pour une ruche donnée.',
    parameters: {
      type: 'OBJECT',
      properties: {
        hiveNumber: { type: 'NUMBER', description: 'Numéro de la ruche' },
        limit: { type: 'NUMBER', description: "Nombre d'inspections à renvoyer (défaut 10)" },
      },
    },
  },
  {
    name: 'list_harvests',
    description: 'Liste les récoltes de miel, éventuellement pour une ruche donnée.',
    parameters: {
      type: 'OBJECT',
      properties: {
        hiveNumber: { type: 'NUMBER', description: 'Numéro de la ruche' },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Crée un travail / une tâche. Confirme brièvement avec l\'utilisateur avant d\'appeler cet outil si les informations sont incomplètes.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', enum: TASK_TYPES, description: 'Type de travail' },
        description: { type: 'STRING', description: 'Description libre' },
        priority: { type: 'STRING', enum: TASK_PRIORITIES, description: 'Priorité (défaut NORMAL)' },
        hiveNumber: { type: 'NUMBER', description: 'Numéro de la ruche concernée (optionnel)' },
        date: { type: 'STRING', description: 'Date prévue au format AAAA-MM-JJ (défaut aujourd\'hui)' },
        time: { type: 'STRING', description: 'Heure au format HH:MM (optionnel)' },
      },
      required: ['type'],
    },
  },
  {
    name: 'update_task_status',
    description: "Change le statut d'un travail existant (ex: le marquer comme terminé). Utilise list_tasks d'abord pour obtenir l'identifiant.",
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'Identifiant du travail' },
        status: { type: 'STRING', enum: TASK_STATUSES, description: 'Nouveau statut' },
      },
      required: ['taskId', 'status'],
    },
  },
  {
    name: 'create_inspection',
    description: "Enregistre une inspection pour une ruche. Met aussi à jour la force / le prochain contrôle de la ruche.",
    parameters: {
      type: 'OBJECT',
      properties: {
        hiveNumber: { type: 'NUMBER', description: 'Numéro de la ruche inspectée' },
        strength: { type: 'STRING', enum: HIVE_STRENGTHS, description: 'Force de la colonie' },
        queenSeen: { type: 'BOOLEAN', description: 'La reine a-t-elle été vue ?' },
        queenPresent: { type: 'BOOLEAN', description: 'La reine est-elle présente (ponte / œufs) ?' },
        healthStatus: { type: 'STRING', description: 'État sanitaire' },
        observations: { type: 'STRING', description: 'Observations libres' },
        date: { type: 'STRING', description: 'Date au format AAAA-MM-JJ (défaut aujourd\'hui)' },
      },
      required: ['hiveNumber'],
    },
  },
  {
    name: 'create_harvest',
    description: 'Enregistre une récolte de miel pour une ruche.',
    parameters: {
      type: 'OBJECT',
      properties: {
        hiveNumber: { type: 'NUMBER', description: 'Numéro de la ruche' },
        honeyType: { type: 'STRING', description: 'Type de miel (ex: toutes fleurs, eucalyptus)' },
        weight: { type: 'NUMBER', description: 'Poids récolté en kg' },
        jars: { type: 'NUMBER', description: 'Nombre de pots' },
        unitPrice: { type: 'NUMBER', description: 'Prix unitaire (optionnel)' },
        notes: { type: 'STRING', description: 'Notes (optionnel)' },
        date: { type: 'STRING', description: 'Date au format AAAA-MM-JJ (défaut aujourd\'hui)' },
      },
      required: ['hiveNumber'],
    },
  },
  {
    name: 'create_hive',
    description: 'Ajoute une nouvelle ruche dans un rucher.',
    parameters: {
      type: 'OBJECT',
      properties: {
        apiaryName: { type: 'STRING', description: 'Nom du rucher où placer la ruche' },
        number: { type: 'NUMBER', description: 'Numéro souhaité (optionnel, sinon auto)' },
        name: { type: 'STRING', description: 'Nom / libellé (optionnel)' },
        beeRace: { type: 'STRING', description: 'Race des abeilles (optionnel)' },
        origin: { type: 'STRING', description: 'Origine / essaim (optionnel)' },
        strength: { type: 'STRING', enum: HIVE_STRENGTHS, description: 'Force initiale (optionnel)' },
        notes: { type: 'STRING', description: 'Notes (optionnel)' },
      },
      required: ['apiaryName'],
    },
  },
];

// --- Handler ------------------------------------------------------------------

export function createToolHandler({ onChange } = {}) {
  // small cache to resolve hive numbers / apiary names within a session
  let hivesCache = null;
  let apiariesCache = null;

  const loadHives = async (force) => {
    if (!hivesCache || force) hivesCache = await hiveApi.list();
    return hivesCache;
  };
  const loadApiaries = async (force) => {
    if (!apiariesCache || force) apiariesCache = await apiaryApi.list();
    return apiariesCache;
  };
  const resolveHiveId = async (hiveNumber) => {
    if (hiveNumber == null) return null;
    const hives = await loadHives();
    const hit = hives.find((h) => Number(h.number) === Number(hiveNumber));
    return hit ? hit.id : null;
  };
  const resolveApiaryId = async (apiaryName) => {
    const apiaries = await loadApiaries();
    if (!apiaries.length) return null;
    if (!apiaryName) return apiaries.length === 1 ? apiaries[0].id : null;
    const n = norm(apiaryName);
    const hit =
      apiaries.find((a) => norm(a.name) === n) ||
      apiaries.find((a) => norm(a.name).includes(n) || n.includes(norm(a.name)));
    return hit ? hit.id : null;
  };

  const compactHive = (h) => ({
    number: h.number,
    name: h.name || null,
    apiary: h.apiary?.name || null,
    status: h.status,
    strength: h.strength,
    queenPresent: h.queenPresent,
    lastInspection: shortDate(h.lastInspection),
    nextInspection: shortDate(h.nextInspection),
  });

  async function handle(name, args = {}) {
    switch (name) {
      case 'list_apiaries': {
        const apiaries = await loadApiaries(true);
        return {
          apiaries: apiaries.map((a) => ({
            name: a.name,
            location: a.location || null,
            hives: a._count?.hives ?? a.hives?.length ?? 0,
          })),
        };
      }

      case 'get_overview': {
        const d = await statsApi.dashboard();
        return {
          hives: d.hiveCounts,
          finances: d.finances,
          upcomingTasks: d.upcomingTasks?.length ?? 0,
          overdueTasks: d.overdueTasks?.length ?? 0,
          hivesNeedingInspection: (d.needsInspection || []).map((h) => h.number),
        };
      }

      case 'list_hives': {
        const params = {};
        if (args.status) params.status = args.status;
        if (args.strength) params.strength = args.strength;
        if (args.query) params.q = args.query;
        if (args.apiaryName) {
          const id = await resolveApiaryId(args.apiaryName);
          if (id) params.apiaryId = id;
        }
        const hives = await hiveApi.list(params);
        hivesCache = null; // filtered result, drop cache
        return { count: hives.length, hives: hives.map(compactHive) };
      }

      case 'list_tasks': {
        const params = {};
        if (args.status) params.status = args.status;
        if (args.hiveNumber != null) {
          const id = await resolveHiveId(args.hiveNumber);
          if (id) params.hiveId = id;
        }
        let tasks = await taskApi.list(params);
        if (!args.status && !args.includeDone) {
          tasks = tasks.filter((t) => ['TODO', 'IN_PROGRESS'].includes(t.status));
        }
        return {
          count: tasks.length,
          tasks: tasks.slice(0, 40).map((t) => ({
            id: t.id,
            type: t.type,
            date: shortDate(t.date),
            time: t.time || null,
            priority: t.priority,
            status: t.status,
            description: t.description || null,
            hive: t.hive?.number ?? null,
          })),
        };
      }

      case 'list_inspections': {
        const params = { limit: args.limit || 10 };
        if (args.hiveNumber != null) {
          const id = await resolveHiveId(args.hiveNumber);
          if (id) params.hiveId = id;
        }
        const inspections = await inspectionApi.list(params);
        return {
          count: inspections.length,
          inspections: inspections.map((i) => ({
            date: shortDate(i.date),
            hive: i.hive?.number ?? null,
            strength: i.strength,
            queenSeen: i.queenSeen,
            queenPresent: i.queenPresent,
            healthStatus: i.healthStatus || null,
            observations: i.observations || null,
          })),
        };
      }

      case 'list_harvests': {
        const params = {};
        if (args.hiveNumber != null) {
          const id = await resolveHiveId(args.hiveNumber);
          if (id) params.hiveId = id;
        }
        const harvests = await harvestApi.list(params);
        return {
          count: harvests.length,
          totalKg: harvests.reduce((s, h) => s + (h.weight || 0), 0),
          harvests: harvests.map((h) => ({
            date: shortDate(h.date),
            hive: h.hive?.number ?? null,
            honeyType: h.honeyType || null,
            weight: h.weight,
            jars: h.jars,
            totalPrice: h.totalPrice,
          })),
        };
      }

      case 'create_task': {
        if (!args.type || !TASK_TYPES.includes(args.type)) {
          return { error: `type invalide. Valeurs possibles : ${TASK_TYPES.join(', ')}` };
        }
        let hiveId = null;
        if (args.hiveNumber != null) {
          hiveId = await resolveHiveId(args.hiveNumber);
          if (!hiveId) return { error: `Aucune ruche numéro ${args.hiveNumber}.` };
        }
        const task = await taskApi.create({
          type: args.type,
          description: args.description || null,
          priority: TASK_PRIORITIES.includes(args.priority) ? args.priority : 'NORMAL',
          date: args.date || undefined,
          time: args.time || null,
          hiveId,
        });
        onChange?.('tasks');
        return { ok: true, created: 'task', id: task.id, type: task.type, date: shortDate(task.date) };
      }

      case 'update_task_status': {
        if (!TASK_STATUSES.includes(args.status)) {
          return { error: `statut invalide. Valeurs : ${TASK_STATUSES.join(', ')}` };
        }
        const task = await taskApi.update(args.taskId, { status: args.status });
        onChange?.('tasks');
        return { ok: true, id: task.id, status: task.status };
      }

      case 'create_inspection': {
        const hiveId = await resolveHiveId(args.hiveNumber);
        if (!hiveId) return { error: `Aucune ruche numéro ${args.hiveNumber}.` };
        const insp = await inspectionApi.create({
          hiveId,
          strength: HIVE_STRENGTHS.includes(args.strength) ? args.strength : 'MEDIUM',
          queenSeen: typeof args.queenSeen === 'boolean' ? args.queenSeen : undefined,
          queenPresent: typeof args.queenPresent === 'boolean' ? args.queenPresent : undefined,
          healthStatus: args.healthStatus || null,
          observations: args.observations || null,
          date: args.date || undefined,
        });
        hivesCache = null;
        onChange?.('inspections');
        return { ok: true, created: 'inspection', id: insp.id, hive: args.hiveNumber, date: shortDate(insp.date) };
      }

      case 'create_harvest': {
        const hiveId = await resolveHiveId(args.hiveNumber);
        if (!hiveId) return { error: `Aucune ruche numéro ${args.hiveNumber}.` };
        const harvest = await harvestApi.create({
          hiveId,
          honeyType: args.honeyType || null,
          weight: args.weight ?? null,
          jars: args.jars ?? null,
          unitPrice: args.unitPrice ?? null,
          notes: args.notes || null,
          date: args.date || undefined,
        });
        onChange?.('harvests');
        return { ok: true, created: 'harvest', id: harvest.id, hive: args.hiveNumber, weight: harvest.weight };
      }

      case 'create_hive': {
        const apiaryId = await resolveApiaryId(args.apiaryName);
        if (!apiaryId) {
          const apiaries = await loadApiaries();
          return {
            error: apiaries.length
              ? `Rucher introuvable. Ruchers disponibles : ${apiaries.map((a) => a.name).join(', ')}`
              : "Aucun rucher n'existe encore. Crée d'abord un rucher dans l'application.",
          };
        }
        const hive = await hiveApi.create({
          apiaryId,
          number: args.number ?? undefined,
          name: args.name || null,
          beeRace: args.beeRace || null,
          origin: args.origin || null,
          strength: HIVE_STRENGTHS.includes(args.strength) ? args.strength : undefined,
          notes: args.notes || null,
        });
        hivesCache = null;
        onChange?.('hives');
        return { ok: true, created: 'hive', number: hive.number, id: hive.id };
      }

      default:
        return { error: `Fonction inconnue: ${name}` };
    }
  }

  return { handle };
}
