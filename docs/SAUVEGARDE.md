# Sauvegarde de la base vers Google Drive

Objectif : disposer d'un **dump SQL complet** de la base PostgreSQL (Render),
copie automatiquement chaque jour dans **Google Drive**, et pouvoir le
**restaurer sur un autre appareil / une autre base** quand on veut.

La base Render reste la base "vivante". Google Drive ne sert que de coffre de
sauvegarde. Ce n'est pas une base de donnees.

---

## 1. Ce qui a ete ajoute au projet

| Fichier | Role |
|---|---|
| `scripts/backup-db.sh` | Fait le `pg_dump`, compresse en `.sql.gz`, envoie vers Drive via rclone, garde les 30 derniers. |
| `.github/workflows/backup-to-drive.yml` | Lance `backup-db.sh` chaque jour a 02:00 UTC (et sur demande manuelle). |

Aucune cle secrete n'est dans le code : tout passe par des **secrets GitHub**.

---

## 2. Configuration (a faire une seule fois)

### 2.1. Autoriser rclone a acceder a ton Google Drive

Sur ta machine (Windows : installer rclone depuis https://rclone.org/downloads/) :

```bash
rclone config
```

Reponses :

- `n`  -> New remote
- name : **gdrive**
- Storage : **drive** (Google Drive)
- `client_id`     : laisser vide (Entree)
- `client_secret` : laisser vide (Entree)
- `scope`         : **3** (`drive.file` — rclone ne verra que les fichiers qu'il cree, c'est le plus sur)
- `service_account_file` : laisser vide
- `Edit advanced config?` : **n**
- `Use auto config?` : **y** (une fenetre de navigateur s'ouvre pour te connecter a ton compte Google)
- `Configure this as a Shared Drive?` : **n**
- `y` pour confirmer, puis `q` pour quitter

Verifie que ca marche :

```bash
rclone mkdir gdrive:rucher-backups
rclone lsd gdrive:
```

Recupere ensuite le contenu du fichier de config :

```bash
# Linux / macOS
cat ~/.config/rclone/rclone.conf
# Windows (PowerShell)
Get-Content "$env:APPDATA\rclone\rclone.conf"
```

Ca ressemble a :

```ini
[gdrive]
type = drive
scope = drive.file
token = {"access_token":"...","refresh_token":"...","expiry":"..."}
```

### 2.2. Recuperer l'URL de la base Render

Dashboard Render -> base **rucher-db** -> onglet **Connect** -> **External Database URL**
(commence par `postgresql://` et contient un hote en `...render.com`).

### 2.3. Creer les secrets GitHub

Repo GitHub -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret** :

| Nom du secret | Valeur |
|---|---|
| `DATABASE_URL` | l'External Database URL de Render (2.2) |
| `RCLONE_CONF`  | tout le contenu du fichier `rclone.conf` (2.1), bloc `[gdrive]` inclus |

### 2.4. Activer / tester

- Commit + push des nouveaux fichiers sur `main`.
- Onglet **Actions** du repo -> workflow **Sauvegarde BDD vers Google Drive** -> **Run workflow** pour un test immediat.
- Ensuite il tourne tout seul chaque nuit. Le dossier `rucher-backups` de ton Drive se remplit de fichiers `rucher-AAAA-MM-JJ_HHMMSS.sql.gz`.

---

## 3. Faire une sauvegarde manuelle en local

```bash
# dump local seulement (pas d'upload)
DATABASE_URL="postgresql://..." UPLOAD=0 bash scripts/backup-db.sh

# dump + upload Drive
DATABASE_URL="postgresql://..." bash scripts/backup-db.sh
```

Necessite `pg_dump` (client PostgreSQL 16) et `rclone` installes.

---

## 4. Restaurer sur un autre appareil / une autre base

1. **Telecharger** le dernier `rucher-*.sql.gz` depuis Google Drive (dossier `rucher-backups`).

2. **Preparer une base PostgreSQL vide** sur le nouvel environnement. Au choix :
   - locale via Docker :
     ```bash
     docker run -d --name rucher-db -e POSTGRES_USER=rucher -e POSTGRES_PASSWORD=rucher -e POSTGRES_DB=rucher -p 5432:5432 postgres:16
     ```
   - ou un nouveau service PostgreSQL (Render, Supabase, Neon...).

3. **Restaurer le dump** :
   ```bash
   # Linux / macOS
   gunzip -c rucher-2026-09-02_020000.sql.gz | psql "postgresql://rucher:rucher@localhost:5432/rucher"

   # Windows (PowerShell) : decompresser d'abord, puis
   #   7z x rucher-2026-09-02_020000.sql.gz
   #   psql "postgresql://..." -f rucher-2026-09-02_020000.sql
   ```
   Le dump contient des `DROP ... IF EXISTS` puis `CREATE`, donc il remplace
   proprement le contenu existant : il peut etre rejoue sans erreur.

4. **Pointer l'app vers cette base** :
   - en local : mettre la nouvelle valeur dans `backend/.env` -> `DATABASE_URL="..."`
   - en deploiement : mettre `DATABASE_URL` dans les variables d'environnement du service.

5. **Demarrer l'app** :
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm start
   ```
   Pas besoin de `prisma migrate` : la structure des tables vient du dump.

---

## 5. Limites a connaitre

- **Les photos ne sont pas dans la base.** Les fichiers uploades (ruches,
  visites, recoltes) sont sur le disque du service web Render, dossier
  `backend/uploads/`, et ne sont **pas** inclus dans ce dump SQL. Sur Render
  free ce disque est efface a chaque redeploiement. Si les photos comptent,
  il faut un stockage externe (Cloudinary, S3, Render Disk payant) — a traiter
  separement.
- **Base Render free** : supprimee par Render apres ~30 jours. Ces sauvegardes
  te permettent de repartir ailleurs si ca arrive.
- **rclone scope `drive.file`** : rclone ne peut voir/supprimer que les fichiers
  qu'il a lui-meme crees. Le nettoyage des vieux backups (etape "garde les 30
  plus recents") ne fonctionne donc que sur les fichiers deposes par ce script.
