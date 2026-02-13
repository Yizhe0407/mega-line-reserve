#!/bin/bash
set -euo pipefail

# cron 觸發時可能不會帶入 docker compose 的環境變數，
# 從 PID 1 環境補回必要變數（僅限 backup 相關前綴）
if [ -r "/proc/1/environ" ]; then
  while IFS= read -r -d '' ENV_ENTRY; do
    case "${ENV_ENTRY}" in
      MYSQL_*=*|BACKUP_*=*|ENABLE_GDRIVE_UPLOAD=*|GDRIVE_BACKUP_PATH=*|RUN_ON_STARTUP=*|TZ=*)
        export "${ENV_ENTRY}"
        ;;
    esac
  done < /proc/1/environ
fi

# 環境變數
MYSQL_HOST=${MYSQL_HOST:-mysql}
MYSQL_PORT=${MYSQL_PORT:-3306}
MYSQL_USER=${MYSQL_USER:-root}
MYSQL_PASSWORD=${MYSQL_ROOT_PASSWORD:-}
MYSQL_DATABASE=${MYSQL_DATABASE:-}
BACKUP_DIR=${BACKUP_DIR:-/backup}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

if [ -z "${MYSQL_PASSWORD}" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 錯誤: MYSQL_ROOT_PASSWORD 未設定"
  exit 1
fi

if [ -z "${MYSQL_DATABASE}" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 錯誤: MYSQL_DATABASE 未設定"
  exit 1
fi

# 建立備份目錄
mkdir -p ${BACKUP_DIR}

# 生成備份檔名（包含時間戳）
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/mysql_backup_${MYSQL_DATABASE}_${TIMESTAMP}.sql.gz"
TEMP_BACKUP_FILE="${BACKUP_FILE}.tmp"

cleanup() {
  rm -f "${TEMP_BACKUP_FILE}"
}

trap cleanup EXIT

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 開始備份資料庫: ${MYSQL_DATABASE}"

# 執行 mysqldump 並壓縮
mysqldump -h "${MYSQL_HOST}" \
  -P "${MYSQL_PORT}" \
  -u "${MYSQL_USER}" \
  -p"${MYSQL_PASSWORD}" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  "${MYSQL_DATABASE}" | gzip > "${TEMP_BACKUP_FILE}"

# 檢查備份是否成功
if gzip -t "${TEMP_BACKUP_FILE}" && [ -s "${TEMP_BACKUP_FILE}" ]; then
  mv "${TEMP_BACKUP_FILE}" "${BACKUP_FILE}"
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 備份成功: ${BACKUP_FILE} (大小: ${BACKUP_SIZE})"
  
  # 上傳到 Google Drive（使用 rclone）
  if [ "${ENABLE_GDRIVE_UPLOAD}" = "true" ] && command -v rclone &> /dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 開始上傳到 Google Drive..."
    
    # 上傳到 Google Drive 的指定資料夾
    if rclone copy "${BACKUP_FILE}" "gdrive:${GDRIVE_BACKUP_PATH:-mysql-backups}" --progress; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] 成功上傳到 Google Drive"
    else
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] 上傳到 Google Drive 失敗"
    fi
  fi
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 備份失敗"
  exit 1
fi

# 刪除舊備份（保留指定天數）
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 清理 ${BACKUP_RETENTION_DAYS} 天前的舊備份..."
find ${BACKUP_DIR} -name "mysql_backup_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 備份流程完成"
