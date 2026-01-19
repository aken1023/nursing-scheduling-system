# 照護排班系統

護理人員排班管理系統，支援多院區排班、跨院調度、請假管理及 Leader 缺口即時通知。

## 系統架構

```
照護系統/
├── backend/          # NestJS 後端 API
├── frontend/         # React 前端應用
├── prd.md           # 產品需求文件
├── sdd.md           # 系統設計文件
├── ui-ux.md         # UI/UX 設計文件
└── .env             # 環境變數設定
```

## 技術棧

### 後端
- Node.js + NestJS
- TypeORM + MySQL
- JWT 認證
- Swagger API 文件

### 前端
- React 18 + TypeScript
- Vite
- TailwindCSS
- React Router
- Zustand (狀態管理)

## 快速開始

### 1. 環境需求
- Node.js >= 18
- MySQL 8.0
- npm 或 yarn

### 2. 資料庫初始化

連線至 MySQL 執行初始化腳本：

```bash
mysql -h 122.100.99.161 -P 43306 -u A999 -p < backend/src/database/init.sql
```

### 3. 啟動後端

```bash
cd backend
npm install
npm run start:dev
```

後端將啟動於 http://localhost:3001
Swagger 文件：http://localhost:3001/api/docs

### 4. 啟動前端

```bash
cd frontend
npm install
npm run dev
```

前端將啟動於 http://localhost:3000

## 主要功能

### 班表管理
- 月曆/週檢視班表
- 拖拉式排班調整
- 衝突檢測與提示
- 調整歷史紀錄

### 請假管理
- 線上請假申請
- 主管審核流程
- 自動檢測 Leader 缺口

### 跨院調度
- 各院區人力總覽
- 發起/審核調度申請
- 自動同步班表

### 監控與通知
- Leader 缺口即時警示
- 系統內推播通知
- 通知升級機制

### 報表匯出
- Excel / PDF 格式
- 週/月班表
- 工時統計

## API 端點

| 模組 | 路徑 | 說明 |
|------|------|------|
| 認證 | /api/v1/auth | 登入、個人資料 |
| 員工 | /api/v1/employees | 員工 CRUD |
| 院區 | /api/v1/hospitals | 院區管理 |
| 班表 | /api/v1/shifts | 排班管理 |
| 請假 | /api/v1/leaves | 請假管理 |
| 跨院 | /api/v1/cross-hospital | 跨院調度 |
| 通知 | /api/v1/notifications | 通知管理 |
| 匯出 | /api/v1/export | 報表匯出 |

## 預設帳號

初始化後可使用以下帳號登入：
- 工號：`ADMIN001`
- 密碼：`ADMIN001`（預設為工號）

## 開發指令

### 後端

```bash
npm run start:dev    # 開發模式
npm run build        # 建置
npm run start:prod   # 生產模式
npm run test         # 測試
```

### 前端

```bash
npm run dev          # 開發模式
npm run build        # 建置
npm run preview      # 預覽建置結果
npm run lint         # 程式碼檢查
```

## 目錄結構

### 後端

```
backend/src/
├── entities/         # TypeORM 實體
├── modules/
│   ├── auth/        # 認證模組
│   ├── employees/   # 員工模組
│   ├── hospitals/   # 院區模組
│   ├── shifts/      # 班表模組
│   ├── leaves/      # 請假模組
│   ├── cross-hospital/  # 跨院調度
│   ├── notifications/   # 通知模組
│   └── export/      # 匯出模組
├── database/        # 資料庫腳本
├── app.module.ts
└── main.ts
```

### 前端

```
frontend/src/
├── components/      # 共用元件
├── pages/          # 頁面元件
├── services/       # API 服務
├── stores/         # 狀態管理
├── App.tsx
├── main.tsx
└── index.css
```
