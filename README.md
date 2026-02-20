# Mega Line Reserve

一個基於 LINE LIFF 的現代化預約與管理系統。專為提升商家預約效率與顧客體驗而設計。

## 專案概述 (Overview)

Mega Line Reserve 提供完整的預約解決方案，整合 LINE 訊息通知與直覺的後端管理介面。

### 核心功能

- **LINE 預約整合**：顧客可直接透過 LINE 進行預約，接收即時通知。
- **直覺管理後台**：商戶可輕鬆管理服務項目、營業時段與預約狀態。
- **響應式設計**：完美支援桌機與行動裝置，隨時隨地管理預約。

## 技術棧 (Technologies)

本專案採用現代化的技術開發，確保系統的高效能與高擴展性：

- **Frontend**: [Next.js](https://nextjs.org/) (React), Tailwind CSS, Shadcn UI
- **Backend**: [Hono.js](https://hono.dev/) via Bun (採用 MVC + Repository 架構)
- **Database**: [MySQL](https://www.mysql.com/) (Managed by Prisma ORM)
- **Containerization**: [Docker](https://www.docker.com/)

## 快速開始 (Quick Start)

想要快速部署或參與開發？請參考我們的技術文件：

👉 [**技術說明文件 (TECHNICAL.md)**](file:///home/yizhe/mega-line-reserve/docs/TECHNICAL.md)

### 快速預覽

1. 複製環境變數範本並設定。
2. 使用 Docker 啟動服務：`docker compose up -d`
3. 存取 [http://localhost:3000](http://localhost:3000)

## 專案結構 (Project Structure)

```text
mega-line-reserve/
├── frontend/           # Next.js 前端應用程式
│   ├── src/
│   │   ├── app/       # App Router 頁面與路由
│   │   ├── components/# 可重用 UI 元件
│   │   ├── hooks/     # 自訂 React Hooks
│   │   └── lib/       # 工具函式與 API 呼叫
│   └── ...
├── backend/            # Hono.js/Bun 後端 API 服務
│   ├── src/
│   │   ├── controllers/# 請求處理邏輯
│   │   ├── services/  # 業務邏輯層
│   │   ├── model/     # 資料存取層
│   │   └── routes/    # API 路由定義
│   ├── prisma/        # 資料庫 Schema 與遷移腳本
│   └── ...
├── docs/               # 專案說明文件
└── ...
```

---

_Made with ❤️ for better reservation experience._
