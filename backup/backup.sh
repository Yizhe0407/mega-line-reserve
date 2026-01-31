#!/bin/bash
set -e

# 環境變數
MYSQL_HOST=${MYSQL_HOST:-mysql}
MYSQL_PORT=${MYSQL_PORT:-3306}
MYSQL_USER=${MYSQL_USER:-root}
MYSQL_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_DATABASE=${MYSQL_DATABASE}
BACKUP_DIR=${BACKUP_DIR:-/backup}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# 建立備份目錄
mkdir -p ${BACKUP_DIR}

# 生成備份檔名（包含時間戳）
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/mysql_backup_${MYSQL_DATABASE}_${TIMESTAMP}.sql.gz"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 開始備份資料庫: ${MYSQL_DATABASE}"

# 執行 mysqldump 並壓縮
mysqldump -h ${MYSQL_HOST} \
  -P ${MYSQL_PORT} \
  -u ${MYSQL_USER} \
  -p${MYSQL_PASSWORD} \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  ${MYSQL_DATABASE} | gzip > ${BACKUP_FILE}

# 檢查備份是否成功
if [ -f "${BACKUP_FILE}" ]; then
  BACKUP_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 備份成功: ${BACKUP_FILE} (大小: ${BACKUP_SIZE})"
  
  # 上傳到 Google Drive（使用 rclone）
  if [ "${ENABLE_GDRIVE_UPLOAD}" = "true" ] && command -v rclone &> /dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 開始上傳到 Google Drive..."
    
    # 上傳到 Google Drive 的指定資料夾
    rclone copy ${BACKUP_FILE} gdrive:${GDRIVE_BACKUP_PATH:-mysql-backups} --progress
    
    if [ $? -eq 0 ]; then
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
