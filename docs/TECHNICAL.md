# 技術文件

本文件說明 Mega Line Reserve 的環境設定、開發流程與 production 部署方式。

## 技術架構

- Frontend：Next.js，對外提供 TCP `3000`。
- Backend：Express + Node.js 24 LTS，僅在 Docker network 暴露 TCP `3001`。
- Database：MySQL 8.0.46，映像固定 tag 與 multi-platform digest；Production 不發布主機端資料庫 port。
- DB Admin：phpMyAdmin 5.2.3 Apache，映像固定 tag 與 multi-platform digest，且只存在於 `debug` profile；主機端只綁定 `127.0.0.1:8080`。
- Backup：非 root MySQL 備份容器，可選擇透過 rclone crypt 上傳客戶端加密副本。

Production 的瀏覽器請求使用公開 Frontend 的同源 `/api`。Next.js 在伺服器端將 `/api/*` 轉發至 Docker 內網的 `http://backend:3001`；Backend 不發布主機 port，因此外部用戶無法繞過 Frontend 直接連線。Next rewrite 會原樣保留用戶端提供的 `X-Forwarded-For`，Backend 預設不信任轉送標頭，限流也只使用實際 TCP 對端。

## 環境設定

1. 複製範本：

   ```bash
   cp .env.example .env
   ```

2. 編輯 `.env`，至少替換資料庫密碼、LINE Channel ID、LIFF ID、公開網域與備份設定。
3. 依 `backup/README.md` 的安全流程只產生一次備份密碼，以同一值更新最低權限 MySQL 帳號並建立 `0600` Docker secret 檔。不要分開產生兩個密碼，也不要把密碼放在 shell history 或命令列參數。

Production 特別注意：

- `MYSQL_ROOT_PASSWORD`、`MYSQL_DATABASE`、`MYSQL_USER`、`MYSQL_PASSWORD`、`CORS_ORIGIN` 都是必填值；`CORS_ORIGIN` 不可為 `*`，應用程式資料庫帳號也不可使用 root。由於 Compose 會將 `MYSQL_PASSWORD` 組入 Prisma `DATABASE_URL`，應使用 URL-safe 高熵密碼（例如 `openssl rand -hex 32`），避免保留字破壞連線字串解析。
- Production Compose 會在 build args 明確傳入空字串 `NEXT_PUBLIC_API_URL`，瀏覽器因此固定使用相對路徑／同源 `/api`；不要把 localhost 或公開 Backend origin bake 進 bundle。
- 修改 `NEXT_PUBLIC_LIFF_ID` 等其他 `NEXT_PUBLIC_*` 後必須重新建置 Frontend image，單純重啟容器不會更新瀏覽器 bundle。
- `INTERNAL_API_URL` 由 Compose 在 Frontend build args 與 runtime environment 都設定為 `http://backend:3001`，避免 rewrite 在 build-time 固化成 loopback。
- `TRUST_PROXY` 預設必須為 `false`，因為 Next rewrite 會原樣保留用戶端提供的 `X-Forwarded-For`。只有前方代理已明確覆寫／清理轉送標頭，且 Backend 直接接收該代理流量時，才可設定該代理的明確 IP/CIDR；不可使用數字 hop count、`true` 或等同信任所有來源的 `/0` CIDR。
- `BACKUP_MYSQL_USER` 必須是專用最低權限帳號，密碼由 `BACKUP_MYSQL_PASSWORD_FILE` 指向的 Docker secret 檔提供。

## Docker 使用方式

### 開發環境

開發模式會發布 Backend loopback port 並支援前後端熱重載：

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

### Production 設定驗證

正式部署前先檢查 Compose 展開結果：

```bash
docker compose config --quiet
```

若缺少任一 MySQL 必填設定、`CORS_ORIGIN`、`LINE_CHANNEL_ID`、`NEXT_PUBLIC_LIFF_ID`、`BACKUP_MYSQL_USER` 或 `BACKUP_MYSQL_PASSWORD_FILE`，Compose 會直接拒絕設定。不得為了通過驗證而將 CORS 改回 wildcard，或讓應用程式／備份改用 root。`NEXT_PUBLIC_API_URL` 不由 production `.env` 控制，Compose 會固定傳入空字串以保持瀏覽器同源請求。

MySQL 與 phpMyAdmin 的 production image 同時固定 patch tag 與 multi-platform manifest digest。升級時必須先從官方 registry 確認新 tag 存在、記錄新 digest，完成建置與還原演練後再更新 Compose；不要只改回 `8.0` 或 `latest`。phpMyAdmin 不在預設 production 啟動集合內，也不再透過環境變數持有 MySQL root 密碼。

### Production 啟動

先啟動資料庫，再執行 migration，最後啟動全部服務：

```bash
docker compose up -d mysql
docker compose --profile maintenance run --rm migrate
docker compose up -d --build
```

Backend production image 只包含 production dependencies，並以非 root `node` 使用者執行。Prisma CLI 與其他開發依賴只存在於 `tools` build target，供 `migrate` 與 `seed` 維護服務使用。Frontend standalone image 已在完全唯讀 root filesystem、未掛載 `.next/cache` tmpfs 的條件下驗證現有頁面與 `/api` rewrite；未來若加入 ISR、影像最佳化或其他 runtime cache，再只針對必要路徑新增可寫掛載並重新測試。

### 更新資料庫 migration

更新 Prisma schema 後：

```bash
docker compose build migrate
docker compose --profile maintenance run --rm migrate
```

### 更新 seed 資料

正式環境不會自動 seed。確認內容可安全重複執行後，再明確執行：

```bash
docker compose build seed
docker compose --profile maintenance run --rm seed
```

開發環境仍可在 backend dev 容器內執行：

```bash
docker compose -f docker-compose.dev.yml exec backend pnpm prisma db seed
```

## Production 網路與健康檢查

- Frontend：僅綁定主機 loopback `127.0.0.1:3000`，由同主機 TLS reverse proxy 對外提供 `443`。若 reverse proxy 也在 Docker 內，應改為加入 `mega-network` 並直接連線 `frontend:3000`，不發布主機 port。
- Backend：只使用 Docker network 的 `backend:3001`，沒有主機 port mapping。
- Backend 與登入端點的限流不採信 `X-Forwarded-For`，而以實際 TCP 對端作為總量 circuit breaker；登入另以 Authorization 憑證雜湊限制重複嘗試。
- MySQL：不發布主機 port；需要維護時請使用 `docker compose exec mysql ...` 或明確啟用 `debug`／`maintenance` profile。
- phpMyAdmin：預設不啟動；明確啟用 `debug` profile 後才綁定 `127.0.0.1:8080`，且只建議透過 SSH tunnel 使用。

Backend 健康狀態：

```bash
docker compose ps backend
docker compose exec backend node -e \
  "fetch('http://127.0.0.1:3001/health').then(async r => console.log(r.status, await r.text()))"
```

臨時啟動 phpMyAdmin；登入畫面請使用操作者輸入的專用管理帳號，不要把 root 密碼放回 Compose：

```bash
docker compose --profile debug up -d phpmyadmin
```

若舊版部署曾讓 phpMyAdmin 預設常駐，新增 profile 不會替操作者自動移除已存在的容器。升級時請先執行：

```bash
docker compose --profile debug stop phpmyadmin
docker compose --profile debug rm -f phpmyadmin
```

需要維護時再執行上一個啟動命令。phpMyAdmin SSH tunnel 範例：

```bash
ssh -L 8080:127.0.0.1:8080 user@production-host
```

連線後只在本機開啟 `http://localhost:8080`。

維護完成後立即停止並移除管理介面：

```bash
docker compose --profile debug stop phpmyadmin
docker compose --profile debug rm -f phpmyadmin
```

## 加密備份

備份服務的完整設定、最低權限 SQL、rclone crypt 設定與還原演練請參考 `backup/README.md`。

重點要求：

- 不得把 MySQL root 密碼傳給備份容器。
- 啟用遠端上傳時，`RCLONE_CRYPT_REMOTE` 必須指向 `type=crypt` remote。
- `rclone_config` named volume 由 UID/GID `10001` 的維護服務初始化；目錄與 `rclone.conf` 必須分別維持 `0700`、`0600`。因 OAuth token 可能更新，正式掛載需可寫，但啟動腳本會 fail closed 驗證 owner 與 mode。
- 本地 `.sql.gz` 仍是壓縮明文，主機與 Docker volume 應使用磁碟加密。
- 必須保存 rclone crypt 密碼、salt、OAuth 設定與資料庫 restore operator 憑證。

## 專案結構

```text
mega-line-reserve/
├── frontend/               # Next.js 前端應用程式
├── backend/                # Express API、Prisma schema 與排程腳本
├── backup/                 # 最低權限、rclone crypt 備份映像與文件
├── docs/TECHNICAL.md       # 部署與維護說明
├── docker-compose.yml      # Production
├── docker-compose.dev.yml  # 開發環境
└── .env.example            # 不含真實 secret 的設定範本
```
