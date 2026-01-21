# Mega Line Reserve

LINE 預約系統

## 技術架構

| 服務 | 技術 | Port |
|------|------|------|
| Frontend | Next.js | 3000 |
| Backend | Hono.js + Bun | 3001 |
| Database | MySQL 8.0 | 3306 |
| DB Admin | phpMyAdmin | 8080 |

## 環境設定

```bash
# 複製環境變數範本
cp .env.example .env

# 編輯 .env 檔案，設定資料庫密碼等
```

## Docker 使用方式

### 開發環境（支援熱重載）

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d


# 啟動開發環境
docker compose -f docker-compose.dev.yml up -d

# 查看即時 log
docker compose -f docker-compose.dev.yml logs -f frontend backend

# 停止開發環境
docker compose -f docker-compose.dev.yml down
```

> 💡 修改 `frontend/` 或 `backend/` 中的程式碼會自動觸發熱重載，不需要重啟容器！

### 生產環境

```bash
# 建置並啟動所有服務
docker compose up -d --build

# 查看服務狀態
docker compose ps

# 查看 log
docker compose logs -f

# 停止所有服務
docker compose down

# 停止並清除資料
docker compose down -v
```

## 服務存取

| 服務 | URL |
|------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| phpMyAdmin | http://localhost:8080 |

## 專案結構

```
mega-line-reserve/
├── frontend/           # Next.js 前端
│   ├── Dockerfile
│   └── ...
├── backend/            # Hono.js 後端
│   ├── Dockerfile
│   ├── prisma/         # Prisma schema
│   └── src/
├── docker compose.yml      # 生產環境配置
├── docker compose.dev.yml  # 開發環境配置（熱重載）
├── .env.example            # 環境變數範本
└── README.md
```

## 資料庫管理

透過 phpMyAdmin 管理資料庫：

1. 開啟瀏覽器前往 http://localhost:8080
2. 使用 `.env` 中設定的帳號密碼登入
3. 預設帳號：`root` / 密碼：`rootpassword`
