<#
  Configuration en une fois de la sauvegarde BDD -> Google Drive.

  Ce script fait tout ce qui peut etre automatise :
    - installe rclone si besoin (via winget ou choco)
    - lance l'autorisation Google Drive (rclone config) si le remote n'existe pas
    - verifie la connexion GitHub CLI (gh auth login si besoin)
    - cree les secrets GitHub  DATABASE_URL  et  RCLONE_CONF
    - declenche le workflow de sauvegarde et affiche le resultat

  Il te reste seulement a :
    - te connecter a Google dans la fenetre qui s'ouvre
    - te connecter a GitHub si demande
    - coller l'External Database URL de Render quand il est demande

  Lancer depuis la racine du projet :
    powershell -ExecutionPolicy Bypass -File scripts\setup-backup.ps1
#>

$ErrorActionPreference = 'Stop'
$RemoteName = 'gdrive'
$DrivePath  = 'rucher-backups'

function Have($name) { [bool](Get-Command $name -ErrorAction SilentlyContinue) }

Write-Host "== Sauvegarde BDD -> Google Drive : configuration ==" -ForegroundColor Cyan

# --- 1. rclone -------------------------------------------------------------
if (-not (Have rclone)) {
  Write-Host "-> Installation de rclone..." -ForegroundColor Yellow
  if (Have winget) {
    winget install --id Rclone.Rclone -e --accept-source-agreements --accept-package-agreements
  } elseif (Have choco) {
    choco install rclone -y
  } else {
    throw "Ni winget ni choco disponibles. Installe rclone manuellement : https://rclone.org/downloads/ puis relance ce script."
  }
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
              [System.Environment]::GetEnvironmentVariable('Path','User')
  if (-not (Have rclone)) { throw "rclone installe mais introuvable dans le PATH. Ouvre un nouveau terminal et relance." }
}
Write-Host "   rclone OK ($(rclone version | Select-Object -First 1))" -ForegroundColor Green

# --- 2. Autorisation Google Drive ---------------------------------------------
$remotes = (rclone listremotes) -replace ':',''
$hasToken = $false
if ($remotes -contains $RemoteName) {
  $hasToken = ((rclone config show $RemoteName) -join "`n") -match 'token\s*='
}
if ($hasToken) {
  Write-Host "   Remote rclone '$RemoteName' deja autorise." -ForegroundColor Green
} else {
  Write-Host "-> Autorisation de Google Drive : une fenetre de navigateur va s'ouvrir." -ForegroundColor Yellow
  Write-Host "   Choisis TON compte Google et accepte l'acces (scope limite : fichiers crees par l'app)." -ForegroundColor Yellow
  if ($remotes -contains $RemoteName) {
    rclone config reconnect "${RemoteName}:"
  } else {
    rclone config create $RemoteName drive scope drive.file
  }
  if (-not ((((rclone config show $RemoteName) -join "`n")) -match 'token\s*=')) {
    throw "L'autorisation Google n'a pas abouti (pas de token). Relance le script, ou fais 'rclone config' manuellement."
  }
}
rclone mkdir "${RemoteName}:${DrivePath}"
Write-Host "   Dossier Drive '${DrivePath}' pret." -ForegroundColor Green

# --- 3. GitHub CLI ----------------------------------------------------------
if (-not (Have gh)) { throw "GitHub CLI (gh) introuvable. Installe-le : https://cli.github.com/ puis relance." }
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "-> Connexion a GitHub (suis les instructions, choisis HTTPS + navigateur)..." -ForegroundColor Yellow
  gh auth login
}
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) { throw "Connexion GitHub non aboutie." }
Write-Host "   GitHub CLI OK." -ForegroundColor Green

# --- 4. Secret DATABASE_URL ----------------------------------------------------
Write-Host ""
Write-Host "-> Colle l'External Database URL de Render" -ForegroundColor Yellow
Write-Host "   (Dashboard Render > base rucher-db > Connect > External Database URL," -ForegroundColor DarkGray
Write-Host "    commence par postgresql:// et contient un hote ...render.com)" -ForegroundColor DarkGray
$dbUrl = Read-Host "   DATABASE_URL"
if ($dbUrl -notmatch '^postgres(ql)?://') { throw "Ca ne ressemble pas a une URL PostgreSQL." }
$dbUrl | gh secret set DATABASE_URL --body -  2>$null
if ($LASTEXITCODE -ne 0) { $dbUrl | gh secret set DATABASE_URL }
Write-Host "   Secret DATABASE_URL cree." -ForegroundColor Green

# --- 5. Secret RCLONE_CONF ---------------------------------------------------
$confPath = (rclone config file) -split "`n" | Select-Object -Last 1
$confPath = $confPath.Trim()
if (-not (Test-Path $confPath)) { throw "Fichier de config rclone introuvable : $confPath" }
Get-Content -Raw $confPath | gh secret set RCLONE_CONF
Write-Host "   Secret RCLONE_CONF cree (depuis $confPath)." -ForegroundColor Green

# --- 6. Lancer le workflow --------------------------------------------------
Write-Host ""
Write-Host "-> Declenchement du workflow de sauvegarde..." -ForegroundColor Yellow
gh workflow run "backup-to-drive.yml"
Start-Sleep -Seconds 6
gh run list --workflow "backup-to-drive.yml" --limit 1

Write-Host ""
Write-Host "Termine. Suis l'execution avec :" -ForegroundColor Cyan
Write-Host "   gh run watch --workflow backup-to-drive.yml" -ForegroundColor White
Write-Host "Ensuite la sauvegarde tourne toute seule chaque nuit (02:00 UTC)." -ForegroundColor Cyan
Write-Host "Les fichiers arrivent dans Google Drive > $DrivePath" -ForegroundColor Cyan
