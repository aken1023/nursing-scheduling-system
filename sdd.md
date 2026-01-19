# 照護排班系統 SDD (System Design Document)

## 1. 系統整體架構

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Web App   │    │ Mobile App  │    │  LINE Bot   │     │
│  │   (React)   │    │  (Flutter)  │    │             │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Nginx / Kong / AWS ALB                  │   │
│  │         (Rate Limit / Auth / Load Balance)          │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   API Server                         │   │
│  │              (Node.js / NestJS)                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ 員工    │ │ 班表    │ │ 請假    │ │ 報表    │   │   │
│  │  │ Module  │ │ Module  │ │ Module  │ │ Module  │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │   排班引擎        │    │   監控服務        │              │
│  │   Scheduling     │    │   Monitor        │              │
│  │   Engine         │    │   Service        │              │
│  │                  │    │                  │              │
│  │  • 自動排班演算法  │    │  • Leader 缺口檢核│              │
│  │  • 衝突檢測       │    │  • 即時告警觸發   │              │
│  │  • 跨院調度邏輯   │    │  • 排程檢查任務   │              │
│  └────────┬─────────┘    └────────┬─────────┘              │
└───────────┼───────────────────────┼─────────────────────────┘
            │                       │
            ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │      MySQL       │    │      Redis       │              │
│  │   (122.100.99.161:43306)                │              │
│  │  • 員工資料       │    │  • Session       │              │
│  │  • 班表資料       │    │  • 快取          │              │
│  │  • 請假紀錄       │    │  • 任務佇列      │              │
│  └──────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                External Services                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ LINE    │  │ SMS     │  │ Email   │  │ Firebase│       │
│  │ Notify  │  │ Gateway │  │ (SES)   │  │ FCM     │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 資料表設計（核心 ER 結構）

### 2.1 員工表 `employees`

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 員工 ID (PK) |
| employee_no | VARCHAR(20) | 工號 (UNIQUE) |
| name | VARCHAR(50) | 姓名 |
| gender | ENUM('M', 'F') | 性別 |
| phone | VARCHAR(20) | 手機號碼 |
| email | VARCHAR(100) | 電子郵件 |
| can_day | BOOLEAN | 可上白班 |
| can_night | BOOLEAN | 可上夜班 |
| is_leader | BOOLEAN | 是否 Leader |
| is_deputy | BOOLEAN | 是否代理 Leader |
| max_daily_shift | INT | 每日班次上限 (nullable) |
| max_consecutive_days | INT | 連續工作天數上限 (nullable) |
| status | ENUM('active', 'inactive') | 在職狀態 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

```sql
CREATE TABLE employees (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    gender ENUM('M', 'F') NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    can_day BOOLEAN DEFAULT true,
    can_night BOOLEAN DEFAULT true,
    is_leader BOOLEAN DEFAULT false,
    is_deputy BOOLEAN DEFAULT false,
    max_daily_shift INT,
    max_consecutive_days INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_leader (is_leader, is_deputy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2.2 院區表 `hospitals`

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 院區 ID (PK) |
| code | VARCHAR(10) | 院區代碼 |
| name | VARCHAR(50) | 院區名稱 |
| address | VARCHAR(200) | 地址 |
| created_at | TIMESTAMP | 建立時間 |

```sql
CREATE TABLE hospitals (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    address VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2.3 員工可服務院區 `employee_hospitals`

| 欄位 | 型別 | 說明 |
|------|------|------|
| employee_id | UUID | 員工 ID (FK) |
| hospital_id | UUID | 院區 ID (FK) |
| is_primary | BOOLEAN | 是否為主要院區 |

```sql
CREATE TABLE employee_hospitals (
    employee_id CHAR(36) NOT NULL,
    hospital_id CHAR(36) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (employee_id, hospital_id),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2.4 班別需求模板 `shift_requirements`

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 需求 ID (PK) |
| hospital_id | UUID | 院區 ID (FK) |
| shift_type | ENUM | 班別類型 |
| required_count | INT | 需求人數 |
| male_max | INT | 男性上限 |
| female_max | INT | 女性上限 |
| leader_required | INT | Leader 需求數 |
| effective_date | DATE | 生效日期 |

```sql
CREATE TABLE shift_requirements (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    hospital_id CHAR(36) NOT NULL,
    shift_type ENUM('DAY', 'EVENING', 'NIGHT') NOT NULL,
    required_count INT NOT NULL DEFAULT 1,
    male_max INT,
    female_max INT,
    leader_required INT NOT NULL DEFAULT 1,
    effective_date DATE NOT NULL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    UNIQUE KEY uk_hospital_shift_date (hospital_id, shift_type, effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2.5 休假申請 `leave_requests`

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 申請 ID (PK) |
| employee_id | UUID | 員工 ID (FK) |
| leave_date | DATE | 請假日期 |
| shift_type | ENUM | 請假班別 (nullable=全天) |
| leave_type | ENUM | 假別 |
| reason | TEXT | 請假原因 |
| status | ENUM | 審核狀態 |
| approved_by | UUID | 審核人 (FK) |
| created_at | TIMESTAMP | 申請時間 |
| updated_at | TIMESTAMP | 更新時間 |

```sql
CREATE TABLE leave_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    leave_date DATE NOT NULL,
    shift_type ENUM('DAY', 'EVENING', 'NIGHT'),
    leave_type ENUM('annual', 'sick', 'personal', 'other') NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES employees(id),
    INDEX idx_employee_date (employee_id, leave_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2.6 排班結果表 `shift_assignments`

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 排班 ID (PK) |
| date | DATE | 排班日期 |
| hospital_id | UUID | 院區 ID (FK) |
| shift_type | ENUM | 班別 |
| employee_id | UUID | 員工 ID (FK) |
| is_leader_duty | BOOLEAN | 是否擔任 Leader |
| is_cross_hospital | BOOLEAN | 是否跨院支援 |
| source_hospital_id | UUID | 原屬院區 (跨院時) |
| status | ENUM | 狀態 |
| created_by | UUID | 建立者 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

```sql
CREATE TABLE shift_assignments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    date DATE NOT NULL,
    hospital_id CHAR(36) NOT NULL,
    shift_type ENUM('DAY', 'EVENING', 'NIGHT') NOT NULL,
    employee_id CHAR(36) NOT NULL,
    is_leader_duty BOOLEAN DEFAULT false,
    is_cross_hospital BOOLEAN DEFAULT false,
    source_hospital_id CHAR(36),
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (source_hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (created_by) REFERENCES employees(id),
    UNIQUE KEY uk_date_hospital_shift_employee (date, hospital_id, shift_type, employee_id),
    INDEX idx_date_hospital (date, hospital_id),
    INDEX idx_employee_date (employee_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2.7 排班調整紀錄 `shift_adjustment_logs`

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 紀錄 ID (PK) |
| assignment_id | UUID | 排班 ID (FK) |
| action | ENUM | 異動類型 |
| old_value | JSONB | 異動前資料 |
| new_value | JSONB | 異動後資料 |
| reason | TEXT | 調整原因 |
| operated_by | UUID | 操作人員 |
| created_at | TIMESTAMP | 操作時間 |

```sql
CREATE TABLE shift_adjustment_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    assignment_id CHAR(36) NOT NULL,
    action ENUM('create', 'update', 'delete', 'swap') NOT NULL,
    old_value JSON,
    new_value JSON,
    reason TEXT,
    operated_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES shift_assignments(id),
    FOREIGN KEY (operated_by) REFERENCES employees(id),
    INDEX idx_assignment (assignment_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2.8 跨院調度申請 `cross_hospital_requests`

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 申請 ID (PK) |
| employee_id | UUID | 被調度員工 |
| from_hospital_id | UUID | 原院區 |
| to_hospital_id | UUID | 目標院區 |
| date | DATE | 支援日期 |
| shift_type | ENUM | 支援班別 |
| status | ENUM | 審核狀態 |
| requested_by | UUID | 申請人 |
| approved_by | UUID | 審核人 |
| created_at | TIMESTAMP | 申請時間 |

```sql
CREATE TABLE cross_hospital_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    from_hospital_id CHAR(36) NOT NULL,
    to_hospital_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    shift_type ENUM('DAY', 'EVENING', 'NIGHT') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    requested_by CHAR(36) NOT NULL,
    approved_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (from_hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (to_hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (requested_by) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES employees(id),
    INDEX idx_date (date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2.9 通知紀錄 `notifications`

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 通知 ID (PK) |
| type | ENUM | 通知類型 |
| recipient_id | UUID | 接收人 |
| channel | ENUM | 發送管道 |
| title | VARCHAR | 標題 |
| content | TEXT | 內容 |
| payload | JSONB | 附加資料 |
| status | ENUM | 發送狀態 |
| sent_at | TIMESTAMP | 發送時間 |
| read_at | TIMESTAMP | 已讀時間 |

```sql
CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    type ENUM('leader_gap', 'leave_approved', 'leave_rejected', 'cross_hospital_request', 'shift_change') NOT NULL,
    recipient_id CHAR(36) NOT NULL,
    channel ENUM('system', 'line', 'email', 'sms', 'push') NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    payload JSON,
    status ENUM('pending', 'sent', 'failed', 'read') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES employees(id),
    INDEX idx_recipient_status (recipient_id, status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. ER Diagram

```
┌──────────────┐       ┌──────────────────────┐       ┌──────────────┐
│  hospitals   │       │  employee_hospitals  │       │  employees   │
├──────────────┤       ├──────────────────────┤       ├──────────────┤
│ id (PK)      │◄──┐   │ employee_id (FK)     │───────►│ id (PK)      │
│ code         │   │   │ hospital_id (FK)     │   ┌───│ employee_no  │
│ name         │   │   │ is_primary           │   │   │ name         │
│ address      │   │   └──────────────────────┘   │   │ is_leader    │
└──────────────┘   │                              │   │ is_deputy    │
       │           └──────────────────────────────┘   │ status       │
       │                                              └──────────────┘
       │                                                     │
       ▼                                                     │
┌──────────────────────┐                                     │
│  shift_requirements  │                                     │
├──────────────────────┤                                     │
│ id (PK)              │                                     │
│ hospital_id (FK)     │                                     │
│ shift_type           │                                     │
│ required_count       │                                     │
│ leader_required      │                                     │
└──────────────────────┘                                     │
                                                             │
       ┌─────────────────────────────────────────────────────┤
       │                                                     │
       ▼                                                     ▼
┌──────────────────────┐                          ┌──────────────────┐
│  shift_assignments   │                          │  leave_requests  │
├──────────────────────┤                          ├──────────────────┤
│ id (PK)              │                          │ id (PK)          │
│ date                 │                          │ employee_id (FK) │
│ hospital_id (FK)     │                          │ leave_date       │
│ shift_type           │                          │ leave_type       │
│ employee_id (FK)     │                          │ status           │
│ is_leader_duty       │                          └──────────────────┘
│ is_cross_hospital    │
└──────────────────────┘
           │
           ▼
┌──────────────────────────┐
│  shift_adjustment_logs   │
├──────────────────────────┤
│ id (PK)                  │
│ assignment_id (FK)       │
│ action                   │
│ old_value                │
│ new_value                │
│ operated_by (FK)         │
└──────────────────────────┘
```

---

## 4. API 設計

### 4.1 RESTful API 端點

#### 員工管理
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | /api/v1/employees | 取得員工列表 |
| GET | /api/v1/employees/:id | 取得員工詳情 |
| POST | /api/v1/employees | 新增員工 |
| PUT | /api/v1/employees/:id | 更新員工 |
| DELETE | /api/v1/employees/:id | 刪除員工 |

#### 班表管理
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | /api/v1/shifts | 取得班表 (支援日期區間、院區篩選) |
| POST | /api/v1/shifts | 新增排班 |
| PUT | /api/v1/shifts/:id | 修改排班 |
| DELETE | /api/v1/shifts/:id | 刪除排班 |
| POST | /api/v1/shifts/batch | 批次調整班表 |
| POST | /api/v1/shifts/swap | 換班 |

#### 請假管理
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | /api/v1/leaves | 取得請假列表 |
| POST | /api/v1/leaves | 提交請假申請 |
| PUT | /api/v1/leaves/:id/approve | 核准請假 |
| PUT | /api/v1/leaves/:id/reject | 駁回請假 |

#### 跨院調度
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | /api/v1/cross-hospital | 取得調度申請列表 |
| POST | /api/v1/cross-hospital | 發起調度申請 |
| PUT | /api/v1/cross-hospital/:id/approve | 核准調度 |
| PUT | /api/v1/cross-hospital/:id/reject | 駁回調度 |

#### 匯出
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | /api/v1/export/excel | 匯出 Excel |
| GET | /api/v1/export/pdf | 匯出 PDF |

#### 監控
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | /api/v1/monitor/leader-gaps | 取得 Leader 缺口 |
| GET | /api/v1/monitor/dashboard | 取得監控儀表板資料 |

---

### 4.2 Query 參數範例

```
GET /api/v1/shifts?hospital_id=xxx&start_date=2024-01-01&end_date=2024-01-31
GET /api/v1/export/excel?hospital_id=xxx&month=2024-01&format=weekly
```

---

## 5. 核心服務設計

### 5.1 排班引擎 (Scheduling Engine)

```typescript
interface SchedulingEngine {
  // 自動排班
  generateSchedule(params: {
    hospitalId: string;
    startDate: Date;
    endDate: Date;
    requirements: ShiftRequirement[];
  }): Promise<ShiftAssignment[]>;

  // 衝突檢測
  validateAssignment(assignment: ShiftAssignment): ValidationResult;

  // 檢查 Leader 配置
  checkLeaderCoverage(hospitalId: string, date: Date): LeaderGap[];
}
```

### 5.2 監控服務 (Monitor Service)

```typescript
interface MonitorService {
  // 檢查所有院區 Leader 缺口
  checkAllLeaderGaps(): Promise<LeaderGap[]>;

  // 請假觸發檢查
  onLeaveApproved(leaveRequest: LeaveRequest): Promise<void>;

  // 發送告警
  sendAlert(alert: Alert): Promise<void>;
}
```

---

## 6. 通知流程

### 6.1 Leader 缺口即時通知流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  請假核准    │────►│  觸發檢查    │────►│  發現缺口    │────►│  發送通知    │
│  事件       │     │  Leader     │     │  記錄       │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                    ┌──────────────────────────────────────────────┘
                    ▼
              ┌─────────────┐
              │  通知管道    │
              │  • LINE     │
              │  • Email    │
              │  • SMS      │
              │  • Push     │
              └─────────────┘
```

### 6.2 通知升級機制

| 時間 | 動作 |
|------|------|
| T+0 | 通知單位主管 |
| T+30min | 未處理 → 通知院區主管 |
| T+60min | 未處理 → 通知系統管理員 + SMS |

---

## 7. 排程任務 (Cron Jobs)

| 任務 | 排程 | 說明 |
|------|------|------|
| Leader 缺口檢查 | 每 5 分鐘 | 檢查未來 7 天班表 |
| 班表提醒 | 每日 08:00 | 提醒明日班表 |
| 資料備份 | 每日 02:00 | 備份資料庫 |
| 過期通知清理 | 每週日 03:00 | 清理 90 天前通知 |

---

## 8. 技術選型

| 層級 | 技術 | 說明 |
|------|------|------|
| Frontend | React + TypeScript | Web 應用 |
| Mobile | Flutter | 跨平台 App |
| Backend | Node.js + NestJS | API Server |
| Database | MySQL 8.0 | 主資料庫 (122.100.99.161:43306) |
| Cache | Redis | 快取 + 任務佇列 |
| Message Queue | Bull (Redis-based) | 非同步任務 |
| Notification | LINE Notify, AWS SES, Twilio | 多管道通知 |
| Export | ExcelJS, PDFKit | 報表匯出 |
| Deployment | Docker + Kubernetes | 容器化部署 |

### 8.1 資料庫連線設定

```
Host: 122.100.99.161
Port: 43306
Database: nursing_schedule
Charset: utf8mb4
Collation: utf8mb4_unicode_ci
```

> 注意：實際連線資訊請參考 `.env` 檔案

---

## 9. 安全性設計

### 9.1 認證授權
- JWT Token 認證
- RBAC 角色權限控制
- API Rate Limiting

### 9.2 資料保護
- 敏感資料加密儲存
- HTTPS 傳輸加密
- SQL Injection 防護
- 操作日誌紀錄

---

## 10. 待確認事項

- [ ] 是否需要支援多租戶架構
- [ ] 通知服務供應商選擇（LINE / 簡訊商）
- [ ] 資料保留政策（多久清理歷史資料）
- [ ] 是否需要離線模式支援
