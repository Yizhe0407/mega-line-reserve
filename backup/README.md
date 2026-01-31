# MySQL 自動備份到 Google Drive

這個方案會自動備份 MySQL 資料庫並上傳到 Google Drive。

## 功能特點

- ✅ 每天自動備份（預設凌晨 2:00）
- ✅ 壓縮備份檔案（使用 gzip）
- ✅ 自動上傳到 Google Drive
- ✅ 自動清理舊備份（預設保留 7 天）
- ✅ 完整的日誌記錄

## 設定步驟

### 1. 更新 docker-compose.yml

在 `docker-compose.yml` 中已經加入了 `backup` 服務。

### 2. 更新環境變數

在專案根目錄的 `.env` 檔案中加入：

```env
# 備份設定
BACKUP_RETENTION_DAYS=7        # 保留幾天的備份
ENABLE_GDRIVE_UPLOAD=true      # 是否上傳到 Google Drive
GDRIVE_BACKUP_PATH=mysql-backups  # Google Drive 資料夾名稱
RUN_ON_STARTUP=false           # 容器啟動時是否立即備份
```

### 3. 配置 Google Drive（rclone）

啟動 backup 服務後，需要設定 rclone 連接到 Google Drive：

```bash
# 進入 backup 容器
docker exec -it mega-line-reserve-backup bash

# 執行 rclone 配置
rclone config

# 按照以下步驟操作：
# 1. 選擇 'n' (New remote)
# 2. 名稱輸入: gdrive
# 3. 選擇 Google Drive (通常是選項 15)
# 4. Client ID 和 Secret 可以留空（使用預設值）
# 5. Scope 選擇 1 (Full access)
# 6. 其他選項可以使用預設值
# 7. 會給你一個 URL，需要在瀏覽器中開啟並授權
# 8. 複製授權碼回到終端機
# 9. 完成設定

# 測試 rclone 連接
rclone lsd gdrive:

# 退出容器
exit
```

### 4. 啟動服務

```bash
# 啟動所有服務（包含 backup）
docker compose up -d

# 查看 backup 服務日誌
docker compose logs -f backup

# 或者只查看備份日誌
docker exec mega-line-reserve-backup tail -f /var/log/backup.log
```

## 手動執行備份

如果需要立即執行備份：

```bash
docker exec mega-line-reserve-backup /scripts/backup.sh
```

## 查看備份檔案

```bash
# 查看本地備份檔案
docker exec mega-line-reserve-backup ls -lh /backup

# 查看 Google Drive 上的備份
docker exec mega-line-reserve-backup rclone ls gdrive:mysql-backups
```

## 還原備份

### 從本地還原

```bash
# 1. 列出可用的備份
docker exec mega-line-reserve-backup ls -lh /backup

# 2. 還原特定備份（替換 BACKUP_FILE_NAME）
docker exec -i mega-line-reserve-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < \
  $(docker exec mega-line-reserve-backup cat /backup/BACKUP_FILE_NAME.sql.gz | gunzip)
```

### 從 Google Drive 還原

```bash
# 1. 從 Google Drive 下載備份
docker exec mega-line-reserve-backup rclone copy gdrive:mysql-backups/BACKUP_FILE_NAME.sql.gz /backup/

# 2. 解壓縮並還原
docker exec mega-line-reserve-backup bash -c \
  "gunzip < /backup/BACKUP_FILE_NAME.sql.gz | mysql -h mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE}"
```

## 自訂備份時間

修改 `backup/Dockerfile` 中的 cron 設定：

```dockerfile
# 預設: 每天凌晨 2:00
RUN echo "0 2 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1" > /etc/cron.d/backup-cron

# 範例: 每 6 小時一次
RUN echo "0 */6 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1" > /etc/cron.d/backup-cron

# 範例: 每天中午 12:00 和晚上 8:00
RUN echo "0 12,20 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1" > /etc/cron.d/backup-cron
```

修改後需要重建容器：

```bash
docker compose up -d --build backup
```

## 疑難排解

### 檢查 cron 是否運行

```bash
docker exec mega-line-reserve-backup ps aux | grep cron
```

### 檢查 rclone 配置

```bash
docker exec mega-line-reserve-backup rclone config show
```

### 查看完整日誌

```bash
docker exec mega-line-reserve-backup cat /var/log/backup.log
```

### 測試 MySQL 連接

```bash
docker exec mega-line-reserve-backup mysql -h mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"
```

## 注意事項

1. **Google Drive 儲存空間**: 確保你的 Google Drive 有足夠空間
2. **備份大小**: 大型資料庫建議增加保留天數或使用增量備份
3. **安全性**: rclone 配置檔包含敏感資訊，請妥善保管
4. **網路連線**: 確保容器可以連接到 Google Drive API
5. **時區**: 容器預設使用 UTC 時間，可在環境變數中設定 `TZ` 來調整

## 備份檔案命名格式

```
mysql_backup_<資料庫名稱>_<年月日>_<時分秒>.sql.gz
例如: mysql_backup_mydb_20260131_020000.sql.gz
```
