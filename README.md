# 🐝 Gestion de Rucher — إدارة المنحل

Application web **partagée à deux personnes** pour la gestion d'un rucher : **ruches, inspections, tâches, reines, récoltes et finances**, avec tableaux de bord, notifications et statistiques.

- Frontend : **React 18 + Vite + Tailwind** (trilingue : ar / fr / en, RTL par défaut)
- Backend : **Node.js / Express**
- Base de données : **PostgreSQL** (via Prisma ORM)
- **PWA installable** : ajoutable à l'écran d'accueil, fonctionne sur mobile/desktop
- Déploiement cible : **Render** (un seul service, backend servant aussi le frontend)

---

## ✨ Fonctionnalités

- **Gestion partagée** : un espace de travail commun (`منحل العائلة`, code `BEE1`) accessible par les deux gérants.
- **Rôles** : `OWNER` (admin) et `MEMBER` ; l'admin gère les membres et l'invitation ; transfert de propriété possible.
- **Ruches & ruchers** : suivi complet (force, reine, origine, prochaines inspections, photos).
- **Inspections** : données de terrain détaillées (couvain, réserves, parasites, maladies...).
- **Tâches** : planification, priorités, rappels.
- **Finances** : dépenses, revenus, récoltes.
- **Statistiques & tableau de bord** : graphiques, suivi de la production et des coûts.
- **Notifications partagées** : rappels de travaux et alertes d'inspection générés pour **tous les membres** de l'espace.
- **PWA** : installation sur écran d'accueil, mode hors-ligne partiel, démarrage rapide.

---

## 🚀 Déploiement sur Render

> Architecture **mono-service** : le backend Express sert aussi les fichiers statiques du frontend buildé. Une seule URL, pas de CORS bloquant.

### Option A — via `render.yaml` (recommandé)

Le fichier [`render.yaml`](./render.yaml) déclare le service web `rucher-api` et la base PostgreSQL `rucher-db`.

1. Poussez ce dépôt sur GitHub (le fichier `render.yaml` est à la racine).
2. Sur [Render](https://render.com) : **New → Blueprint** puis sélectionnez le dépôt.
3. Render provisionne automatiquement :
   - Le service web Node.js (`rootDir: backend`),
   - La base **PostgreSQL** (`rucher-db`),
   - La variable `DATABASE_URL` automatiquement câblée.
4. Renseignez manuellement dans le dashboard du service : `JWT_SECRET` (une chaîne longue et aléatoire).
5. Cliquez **Apply** → Render construit (`npm run build`, compile le frontend dans `backend/public`) et démarre (`npm run start:prod`, applique les migrations puis lance l'API).

### Approvisionnement initial de la base (seed du compte admin)

Après le premier déploiement, dans l'onglet **Shell** du service :

```bash
npm run seed
```

Cela crée le compte démo et l'espace partagé :

| Champ    | Valeur                 |
|----------|------------------------|
| Email    | `apiculteur@example.com` |
| Mot de passe | `apiculteur123`      |
| Espace   | `منحل العائلة` (code `BEE1`) |

> ⚠️ **Changez le mot de passe du compte démo avant toute utilisation réelle.**

### Variables d'environnement (service web)

| Variable        | Description                                          | Obligatoire |
|-----------------|------------------------------------------------------|-------------|
| `DATABASE_URL`  | Chaîne PostgreSQL (remplie auto par Render)         | ✅ auto     |
| `JWT_SECRET`    | Clé secrète pour les JWT — à définir                | ✅          |
| `JWT_EXPIRES`   | Durée de validité des sessions (défaut `7d`)        | ❌          |
| `PUBLIC_URL`    | URL publique (remplie auto via `RENDER_EXTERNAL_URL`) | ❌        |

---

## 💻 Développement local

**Prérequis** : Node.js ≥ 18, une instance **PostgreSQL** locale (le schéma cible PostgreSQL, plus SQLite).

1. Configurer la base :
   ```bash
   cd backend
   # éditer .env avec votre DATABASE_URL PostgreSQL, ex :
   # DATABASE_URL="postgresql://rucher:rucher@localhost:5432/rucher?schema=public"
   npx prisma migrate dev
   npm run seed
   ```

2. Lancer le backend (API sur `http://localhost:5000`) :
   ```bash
   cd backend && npm run dev
   ```

3. Lancer le frontend (Vite sur `http://localhost:5173`, proxy `/api` → `:5000`) :
   ```bash
   cd frontend && npm run dev
   ```

> Les hooks d'environnement (`PUBLIC_URL`) sont définis dans [`backend/src/config/env.js`](./backend/src/config/env.js).

---

## 📦 Structure

```
backend/          API Express + Prisma + migrations + seed
  src/
    config/env.js
    controllers/
    middleware/auth.js        # résolution de l'espace de travail (X-Workspace-Id)
    routes/
    services/notification.service.js   # notifications partagées
  prisma/
    schema.prisma
    migrations/               # migration initiale PostgreSQL
    seed.js
frontend/         React + Vite (PWA)
  public/
    manifest.webmanifest
    sw.js                     # service worker
    pwa-icons/                # icônes PWA
  src/context/WorkspaceContext.jsx
render.yaml       Blueprint Render (service + base de données)
```

---

## 🔧 Migration SQLite → PostgreSQL

Le schéma a migré de SQLite vers PostgreSQL. Les migrations sont versionnées dans `backend/prisma/migrations`. Sur une base vierge, `npm run start:prod` applique automatiquement la migration initiale via `prisma migrate deploy`. Aucune base existante n'est migrée — pensez à re-générer les données (seed ou import), car un fichier SQLite ne se met pas à niveau automatiquement.