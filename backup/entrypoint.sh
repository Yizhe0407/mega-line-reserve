#!/bin/bash
set -e

echo "=========================================="
echo "MySQL 自動備份服務啟動中..."
echo "=========================================="
echo "備份時間: 每天凌晨 2:00"
echo "備份保留天數: ${BACKUP_RETENTION_DAYS:-7} 天"
echo "Google Drive 上傳: ${ENABLE_GDRIVE_UPLOAD:-false}"
echo "=========================================="

# 如果啟用 Google Drive 上傳，檢查 rclone 配置
if [ "${ENABLE_GDRIVE_UPLOAD}" = "true" ]; then
  if [ ! -f "/root/.config/rclone/rclone.conf" ]; then
    echo "警告: 未找到 rclone 配置檔案"
    echo "請先執行: docker exec -it mega-line-reserve-backup rclone config"
  else
    echo "rclone 配置已找到"
  fi
fi

# 啟動時立即執行一次備份（可選）
if [ "${RUN_ON_STARTUP}" = "true" ]; then
  echo "執行啟動備份..."
  /scripts/backup.sh
fi

# 啟動 cron 服務
echo "啟動 cron 服務..."
cron

# 持續顯示 log
tail -f /var/log/backup.log
