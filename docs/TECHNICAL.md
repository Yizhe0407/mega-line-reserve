# 技術文件 (Technical Documentation)

本文件詳細說明了 Mega Line Reserve 系統的環境設定、開發流程與部署方式。

## 技術架構

| 服務     | 技術          | Port |
| -------- | ------------- | ---- |
| Frontend | Next.js       | 3000 |
| Backend  | Hono.js + Bun | 3001 |
| Database | MySQL 8.0     | 3306 |
| DB Admin | phpMyAdmin    | 8080 |

## 環境設定

1. 複製環境變數範本：
   ```bash
   cp .env.example .env
   ```
2. 編輯 `.env` 檔案，設定資料庫密碼與其他必要參數。

## Docker 使用方式

### 開發環境（支援熱重載）

使用開發模式啟動，`frontend/` 或 `backend/` 的程式碼變更將自動觸發熱重載。

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

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

# 停止並清除資料 (磁碟卷)
docker compose down -v
```

### 資料庫初始化 (Database Initialization)

在正式環境部署時，系統不會自動執行資料庫遷移。首次部署或更新 schema 時請執行：

```bash
# 1. 進入後端容器
docker exec -it mega-line-reserve-backend sh

# 2. 執行 Migration (建立資料表)
npx prisma migrate deploy

# 3. 執行 Seed (填充預設資料)
npx prisma db seed
```

## 服務存取

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **phpMyAdmin**: [http://localhost:8080](http://localhost:8080) (預設帳號：`root` / 密碼：`rootpassword`)

## 專案結構

本專案將前後端程式碼整合於單一儲存庫中進行管理，後端採用 **MVC + Repository** 架構以確保職責分離：

```text
mega-line-reserve/
├── frontend/               # Next.js 前端應用程式 (React)
│   ├── src/
│   │   ├── app/           # Next.js App Router (Pages, Layouts)
│   │   ├── components/    # 視覺元件 (Shadcn/UI + Radix UI)
│   │   ├── hooks/         # 自訂 React Hooks (狀態邏輯)
│   │   ├── lib/           # API Client, 工具函式
│   │   ├── store/         # 全域狀態管理 (Zustand)
│   │   └── types/         # TypeScript 型別定義
│   ├── Dockerfile
│   └── package.json
├── backend/                # Hono.js 後端 API (Bun 執行環境)
│   ├── src/
│   │   ├── controllers/   # Controller 層：處理 HTTP 請求與回應
│   │   ├── services/      # Service 層：處理核心業務邏輯與流程
│   │   ├── model/         # Model (Repository) 層：Prisma 資料庫操作
│   │   ├── routes/        # Route 層：定義 API 端點結構
│   │   ├── middleware/    # Auth, Error Handling, Validation
│   │   ├── config/        # 環境變數與常數設定
│   │   ├── utils/         # 通用工具函式
│   │   └── types/         # 型別定義
│   ├── prisma/
│   │   ├── schema.prisma # 資料庫模型定義
│   │   ├── migrations/   # 資料庫遷移紀錄
│   │   └── seed.ts       # 初始開發資料
│   ├── Dockerfile
│   └── package.json
├── docs/                   # 專案文件
│   └── TECHNICAL.md        # 技術細節與使用說明
├── docker-compose.yml      # 生產環境配置
├── docker-compose.dev.yml  # 開發環境配置
└── .env.example            # 環境變數範本
```
