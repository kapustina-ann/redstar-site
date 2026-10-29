#!/usr/bin/env bash
# Выкладка redstar.agency на облачный сервер. Запуск из корня репозитория:
#   bash deploy/deploy.sh
# На Windows — из Git Bash. Нужен вход kapustina@83.217.192.146 по ключу и sudo на сервере.
#
# Уезжает только закоммиченное (git archive HEAD): страницы, robots.txt, sitemap.xml, assets/.
# glass/, _fragments/, integrations/, tests/ и служебные файлы на сервер не попадают.
# Предыдущая версия остаётся рядом, в /var/www/redstar-agency.old, — для отката.
set -euo pipefail

HOST="${DEPLOY_HOST:-kapustina@83.217.192.146}"
DEST=/var/www/redstar-agency
DOMAIN=redstar.agency

cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "Есть незакоммиченные изменения — сначала коммит, потом выкладка." >&2
  exit 1
fi

rev=$(git rev-parse --short HEAD)
archive="redstar-agency-$rev.tar.gz"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

git archive --format=tar.gz -o "$tmp/$archive" HEAD -- ./*.html robots.txt sitemap.xml assets
echo "Заливаю $rev ($(du -h "$tmp/$archive" | cut -f1)) на $HOST…"
scp -q "$tmp/$archive" "$HOST:/tmp/$archive"

# Кавычки у 'REMOTE' обязательны: переменные раскрывает сервер, значения приходят аргументами.
ssh "$HOST" sudo bash -s -- "$archive" "$DEST" "$rev" <<'REMOTE'
set -euo pipefail
archive=$1 dest=$2 rev=$3
new="$dest.new"
rm -rf "$new"
mkdir -p "$new"
tar -xzf "/tmp/$archive" -C "$new"
rm -f "/tmp/$archive"
chown -R www-data:www-data "$new"
find "$new" -type d -exec chmod 755 {} +
find "$new" -type f -exec chmod 644 {} +
# Подмена переименованием: посетитель не застанет сайт залитым наполовину.
rm -rf "$dest.old"
if [ -d "$dest" ]; then mv "$dest" "$dest.old"; fi
mv "$new" "$dest"
echo "$(date '+%F %T') | $rev | ${SUDO_USER:-root}" >> /root/redstar-agency-deploy-version
REMOTE

# Проверяем именно этот сервер, а не то, куда сейчас смотрит DNS.
ip="${HOST#*@}"
scheme=https
curl -sS -o /dev/null --resolve "$DOMAIN:443:$ip" "https://$DOMAIN/" 2>/dev/null || scheme=http
echo "Проверка ($scheme, сервер $ip):"
for path in / /uslugi-podderzhka.html /assets/style.css /sitemap.xml /support; do
  printf '  %-24s ' "$path"
  curl -sS -o /dev/null -w '%{http_code} %{content_type} %{redirect_url}\n' \
    --resolve "$DOMAIN:80:$ip" --resolve "$DOMAIN:443:$ip" "$scheme://$DOMAIN$path" || echo "нет ответа"
done
echo "Ждём: 200 text/html для страниц, 200 text/css, 200 text/xml, 301 для /support."
