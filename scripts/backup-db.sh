#!/usr/bin/env bash
#
# Sauvegarde complete de la base PostgreSQL (dump SQL compresse) + envoi vers
# Google Drive via rclone. Utilisable en local ou dans GitHub Actions.
#
# Variables d'environnement :
#   DATABASE_URL   (obligatoire) chaine de connexion PostgreSQL a sauvegarder
#   UPLOAD         (defaut 1)    1 = envoyer vers Drive, 0 = garder le fichier en local seulement
#   RCLONE_REMOTE  (defaut gdrive)        nom du remote rclone
#   RCLONE_PATH    (defaut rucher-backups) dossier cible dans Drive
#   BACKUP_DIR     (defaut ./backups)     dossier local ou ecrire le dump
#   KEEP           (defaut 30)            nombre de sauvegardes a conserver dans Drive
#
# Exemples :
#   # dump local uniquement
#   DATABASE_URL="postgresql://..." UPLOAD=0 bash scripts/backup-db.sh
#
#   # dump + upload Drive
#   DATABASE_URL="postgresql://..." bash scripts/backup-db.sh

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL est obligatoire}"

STAMP="$(date -u +%Y-%m-%d_%H%M%S)"
OUT_DIR="${BACKUP_DIR:-./backups}"
KEEP="${KEEP:-30}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/rucher-${STAMP}.sql.gz"

echo "-> Dump de la base en cours..."
pg_dump "$DATABASE_URL" \
  --no-owner --no-privileges \
  --clean --if-exists \
  | gzip -9 > "$FILE"

echo "-> Sauvegarde ecrite : $FILE ($(du -h "$FILE" | cut -f1))"

if [ "${UPLOAD:-1}" != "1" ]; then
  echo "OK (upload desactive)"
  exit 0
fi

REMOTE="${RCLONE_REMOTE:-gdrive}:${RCLONE_PATH:-rucher-backups}"

echo "-> Envoi vers ${REMOTE}"
rclone copy "$FILE" "$REMOTE"

echo "-> Nettoyage : on garde les ${KEEP} sauvegardes les plus recentes"
rclone lsf "$REMOTE" --files-only --format p 2>/dev/null \
  | grep -E '^rucher-.*\.sql\.gz$' \
  | sort -r \
  | tail -n "+$((KEEP + 1))" \
  | while read -r old; do
      echo "   suppression de $old"
      rclone deletefile "${REMOTE}/${old}"
    done

echo "OK"
