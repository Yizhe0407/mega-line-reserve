# MySQL 加密自動備份

此目錄提供 MySQL 定時備份容器。備份會先以 `gzip` 壓縮並以 `0600` 權限保存在本地 volume；啟用遠端上傳時，只允許透過 `rclone crypt` remote 上傳，避免將可直接解壓的資料庫內容送到一般雲端 remote。

## 安全設計

- 備份腳本設定 `umask 077`，備份檔與暫存檔僅允許擁有者讀寫。
- 容器使用 UID/GID `10001` 的非 root 專用服務使用者。
- MySQL 密碼由 Docker secret 掛載，不放在容器環境變數或 `mysqldump` 命令列。
- 腳本會拒絕 MySQL `root` 帳號。
- `mysqldump` 使用 `--single-transaction`、`--skip-lock-tables` 與 `--no-tablespaces`，讓專用帳號不需要 `LOCK TABLES` 或 `PROCESS` 權限。
- 遠端上傳啟用時，腳本會檢查指定 remote 的 `type` 必須是 `crypt`，並拒絕 owner／mode 不安全的 `rclone.conf`；設定錯誤時會 fail closed。
- rclone 固定為 `1.74.4`，Docker build 會依 CPU 架構驗證官方 zip 的 SHA-256 checksum。
- 正式容器使用唯讀 root filesystem，只有 `/backup`、`rclone_config` named volume 與暫存 `/tmp` 可寫入。`rclone_config` 必須可寫，因 OAuth provider 可能需要安全地更新 token。

## 1. 產生一次密碼並建立最低權限帳號

先確認 production `.env` 已有 MySQL root 初始化密碼，並啟動資料庫：

```bash
docker compose up -d mysql
```

接著在專案根目錄執行下列整段。密碼只產生一次並寫入專案外的 `0600` 檔案；建立／更新 MySQL 帳號時會從同一檔案讀取。SQL 透過 stdin 傳入，不會把備份密碼放在命令列參數或 shell history：

```bash
BACKUP_PASSWORD_FILE="${HOME}/.config/mega-line-reserve/backup_mysql_password"
mkdir -p "$(dirname "${BACKUP_PASSWORD_FILE}")"
umask 077
set +x
if [[ -e "${BACKUP_PASSWORD_FILE}" ]]; then
  printf '錯誤：密碼檔已存在，請使用受控輪替流程，不要直接覆寫。\n' >&2
  return 1 2>/dev/null || exit 1
fi

NEW_BACKUP_PASSWORD_FILE=$(mktemp "${BACKUP_PASSWORD_FILE}.new.XXXXXX")
trap 'unset BACKUP_PASSWORD; [[ -n "${NEW_BACKUP_PASSWORD_FILE:-}" ]] && rm -f "${NEW_BACKUP_PASSWORD_FILE}"' EXIT
openssl rand -base64 48 > "${NEW_BACKUP_PASSWORD_FILE}"
chmod 600 "${NEW_BACKUP_PASSWORD_FILE}"

BACKUP_PASSWORD=$(tr -d '\r\n' < "${NEW_BACKUP_PASSWORD_FILE}")
docker compose exec -T mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql --user=root --protocol=socket' <<SQL
CREATE USER IF NOT EXISTS 'mega_backup'@'%';
ALTER USER 'mega_backup'@'%' IDENTIFIED BY '${BACKUP_PASSWORD}';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'mega_backup'@'%';
GRANT SELECT, SHOW VIEW, TRIGGER ON mega_line_reserve.* TO 'mega_backup'@'%';
FLUSH PRIVILEGES;
SQL

mv "${NEW_BACKUP_PASSWORD_FILE}" "${BACKUP_PASSWORD_FILE}"
NEW_BACKUP_PASSWORD_FILE=''
unset BACKUP_PASSWORD
trap - EXIT
```

此流程不會輸出產生的備份密碼。不要改成 `mysql -e "...明文密碼..."`、命令列 `--password=...`，也不要把密碼直接貼進互動式 shell，以免留在 history 或程序參數。若 shell 啟用了 `set -x`／xtrace，請先關閉再執行。

若實際資料庫名稱或帳號不同，請同步調整 SQL 中的 `mega_line_reserve`／`mega_backup`，以及根目錄 `.env`。若名稱含特殊字元，請由資料庫管理員以安全的 MySQL identifier quoting 調整，不要直接把不受信任輸入插入 heredoc。不要授予 `SUPER`、`FILE`、`PROCESS`、`LOCK TABLES` 或全域管理權限。

## 2. 將同一密碼檔掛成 Docker secret

確認根目錄 `.env` 指向上一節建立的同一個檔案：

```env
BACKUP_MYSQL_USER=mega_backup
BACKUP_MYSQL_PASSWORD_FILE=${HOME}/.config/mega-line-reserve/backup_mysql_password
BACKUP_RETENTION_DAYS=7
BACKUP_SCHEDULE_TIME=02:00
RUN_ON_STARTUP=false
TZ=Asia/Taipei
```

不要再次執行 `openssl rand` 覆寫密碼檔，除非同一個變更流程也立刻執行 `ALTER USER`；否則資料庫帳號密碼與 Docker secret 會不一致。輪替時請先產生新的暫存 `0600` 檔、用該值更新 MySQL 帳號、原子替換正式密碼檔，再重新建立 `backup` 容器並立即執行測試備份。

密碼檔預設放在專案目錄外，不可提交至 Git。部署平台若有原生 secret manager，應由部署流程在啟動前建立同等的唯讀密碼檔。

啟動正式排程前，請從容器內確認 file-backed secret 可由 UID `10001` 讀取；此命令只輸出 metadata，不會顯示密碼內容：

```bash
docker compose run --rm --no-deps --entrypoint bash backup -ceu '
  id
  stat -c "%u:%g %a %n" /run/secrets/backup_mysql_password
  test -r /run/secrets/backup_mysql_password
'
```

預期容器使用 UID/GID `10001:10001`，secret 可讀且不得授予 group/other 權限。不同 Docker Compose／主機平台對 file-backed secret 的 ownership 投影可能不同；若原生 Linux 主機仍保留 host owner，請由受控部署流程將主機密碼檔設為 UID/GID `10001:10001`、mode `0600`，再重建容器並重跑上述檢查。不要為了排除權限錯誤改成 `0644`。

## 3. 設定 rclone crypt

若只需要本地備份，保留：

```env
ENABLE_RCLONE_UPLOAD=false
```

若要上傳 Google Drive 或其他 rclone provider，請使用專用的 `rclone-config` 維護服務。此服務與正式備份容器一樣以 UID/GID `10001` 執行，但不掛載資料庫密碼或備份資料：

```bash
docker compose --profile backup-config run --rm --build rclone-config config
```

首次掛載全新的 `rclone_config` named volume 時，Docker 會從映像中的 `/config/rclone` 初始化目錄，因此 owner 會是 `10001:10001`。維護 entrypoint 會套用 `umask 077`，並將目錄與設定檔權限收斂為 `0700` 與 `0600`。

設定時依序建立：

1. 一個實際儲存 provider remote，例如 `gdrive`。
2. 一個 `crypt` remote，例如 `backup-crypt`。
3. `backup-crypt` 的底層 remote 指向專用加密目錄，例如 `gdrive:mega-line-reserve-encrypted`。
4. 為檔名與目錄名稱啟用標準加密，並使用密碼管理器保存 crypt 密碼與 salt。

完成後，以相同的非 root 維護服務驗證 remote 與檔案權限：

```bash
docker compose --profile backup-config run --rm rclone-config config show backup-crypt
docker compose --profile backup-config run --rm rclone-config lsd backup-crypt:
docker compose --profile backup-config run --rm --no-deps \
  --entrypoint bash rclone-config -lc \
  'id; stat -c "%u:%g %a %n" /config/rclone "$RCLONE_CONFIG"'
```

最後一個命令預期顯示容器 UID/GID `10001:10001`，目錄 mode 為 `700`、`rclone.conf` 為 `600`。正式備份啟動時也會再次檢查：

- 設定目錄與檔案都由目前的非 root UID 擁有。
- 目錄不得授予 group/other 權限，且 owner 必須可讀寫與進入。
- `rclone.conf` 必須是非 symlink 的一般檔案、不得授予 group/other 權限，且 owner 必須可讀寫。

`rclone_config` 未掛成唯讀，是因 Google Drive 等 OAuth provider 可能在 token refresh 時更新 `rclone.conf`。若強制唯讀，token 到期後可能造成排程上傳失敗；這裡改以限定掛載範圍、非 root UID 與嚴格 owner/mode 檢查保護設定。

接著在 `.env` 設定：

```env
ENABLE_RCLONE_UPLOAD=true
RCLONE_CRYPT_REMOTE=backup-crypt:mega-line-reserve
```

不要將 `RCLONE_CRYPT_REMOTE` 指向 `gdrive:` 等未加密 remote。rclone 設定保存在 `rclone_config` volume，其中含 OAuth token 與 crypt 設定，必須與資料庫密碼同等保護並納入災難復原保存。

## 4. 啟動與手動驗證

啟動備份服務：

```bash
docker compose up -d --build backup
docker compose logs -f backup
```

立即執行一次備份：

```bash
docker compose exec backup /scripts/backup.sh
```

列出本地檔案：

```bash
docker compose exec backup ls -lh /backup
```

若啟用加密上傳，可列出 crypt remote 內的解密視圖：

```bash
docker compose exec backup rclone ls "${RCLONE_CRYPT_REMOTE}"
```

實際底層 provider 只會看到加密後的內容與檔名。

## 排程與保留策略

- `BACKUP_SCHEDULE_TIME` 使用容器時區的 24 小時制 `HH:MM`，預設為 `02:00`。
- `TZ` 預設為 `Asia/Taipei`。
- `BACKUP_RETENTION_DAYS` 只清理本地 `/backup` volume。
- 遠端 lifecycle／保留政策應在儲存 provider 另外設定。
- `RUN_ON_STARTUP=true` 會在容器啟動時先執行一次備份；若該次失敗，容器會退出以便監控系統偵測。

## 還原注意事項

備份檔格式為：

```text
mysql_backup_<資料庫名稱>_<年月日>_<時分秒>.sql.gz
```

還原前應：

1. 在隔離環境下載並驗證檔案可通過 `gzip -t`。
2. 使用獨立的 restore operator 帳號，而不是讓唯讀 `mega_backup` 帳號取得寫入權限。
3. 先還原到 staging 資料庫並執行應用程式 smoke test。
4. 定期演練 rclone crypt 密碼、salt 與 OAuth 設定的復原流程。

本地 `.sql.gz` 是壓縮後的明文資料，雖然檔案權限為 `0600`，主機磁碟與 Docker volume 仍應使用全碟加密。雲端副本則由 rclone crypt 在客戶端加密後才離開容器。

## 從既有 root 容器升級

舊版 volume 可能由 root 或其他 UID 擁有。請分別修正備份資料與 rclone 設定；下列 root 權限只用於一次性維護，正式排程仍以 UID/GID `10001` 執行。

修正 `/backup`：

```bash
docker compose run --rm --no-deps \
  --user 0:0 --cap-add CHOWN --cap-add FOWNER --cap-add DAC_OVERRIDE \
  --entrypoint bash backup -lc \
  'chown -R 10001:10001 /backup && find /backup -type d -exec chmod 700 {} + && find /backup -type f -exec chmod 600 {} +'
```

修正 `rclone_config`，不要在命令輸出中顯示設定內容：

```bash
docker compose --profile backup-config run --rm --no-deps \
  --user 0:0 --cap-add CHOWN --cap-add FOWNER --cap-add DAC_OVERRIDE \
  --entrypoint bash rclone-config -lc \
  'chown -R 10001:10001 /config/rclone && find /config/rclone -type d -exec chmod 700 {} + && find /config/rclone -type f -exec chmod 600 {} +'
```

完成後重新執行上一節的 `stat` 驗證，再啟動 `backup`。不要讓正式排程長期以 root 執行。

## 疑難排解

### 上傳被拒絕為非 crypt remote

確認 `.env` 的 `RCLONE_CRYPT_REMOTE` 指向 crypt remote，而不是其底層 provider：

```bash
docker compose --profile backup-config run --rm rclone-config config show backup-crypt
```

必須看到 `type = crypt`。

### 備份帳號權限不足

確認專用帳號有該資料庫的 `SELECT`、`SHOW VIEW`、`TRIGGER`，並確認腳本保留 `--no-tablespaces`。不要直接改用 root 排除錯誤。

### 排程時間不正確

檢查：

```bash
docker compose exec backup date
docker compose logs backup
```

確認 `TZ` 與 `BACKUP_SCHEDULE_TIME` 符合預期。
