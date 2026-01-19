-- 照護排班系統資料庫初始化腳本
-- Database: nursing_schedule

CREATE DATABASE IF NOT EXISTS nursing_schedule
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nursing_schedule;

-- 1. 員工表
CREATE TABLE IF NOT EXISTS employees (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    gender ENUM('M', 'F') NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    password_hash VARCHAR(255),
    can_day BOOLEAN DEFAULT true,
    can_night BOOLEAN DEFAULT true,
    is_leader BOOLEAN DEFAULT false,
    is_deputy BOOLEAN DEFAULT false,
    max_daily_shift INT,
    max_consecutive_days INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    role VARCHAR(50) DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_leader (is_leader, is_deputy),
    INDEX idx_employee_no (employee_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 院區表
CREATE TABLE IF NOT EXISTS hospitals (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    address VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 員工可服務院區
CREATE TABLE IF NOT EXISTS employee_hospitals (
    employee_id CHAR(36) NOT NULL,
    hospital_id CHAR(36) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (employee_id, hospital_id),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 班別需求模板
CREATE TABLE IF NOT EXISTS shift_requirements (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    hospital_id CHAR(36) NOT NULL,
    shift_type ENUM('DAY', 'EVENING', 'NIGHT') NOT NULL,
    required_count INT NOT NULL DEFAULT 1,
    male_max INT,
    female_max INT,
    leader_required INT NOT NULL DEFAULT 1,
    effective_date DATE NOT NULL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    UNIQUE KEY uk_hospital_shift_date (hospital_id, shift_type, effective_date),
    INDEX idx_hospital (hospital_id),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 休假申請
CREATE TABLE IF NOT EXISTS leave_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    leave_date DATE NOT NULL,
    shift_type ENUM('DAY', 'EVENING', 'NIGHT'),
    leave_type ENUM('annual', 'sick', 'personal', 'other') NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by CHAR(36),
    reject_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES employees(id),
    INDEX idx_employee_date (employee_id, leave_date),
    INDEX idx_status (status),
    INDEX idx_leave_date (leave_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 排班結果表
CREATE TABLE IF NOT EXISTS shift_assignments (
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
    INDEX idx_employee_date (employee_id, date),
    INDEX idx_date (date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 排班調整紀錄
CREATE TABLE IF NOT EXISTS shift_adjustment_logs (
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

-- 8. 跨院調度申請
CREATE TABLE IF NOT EXISTS cross_hospital_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    from_hospital_id CHAR(36) NOT NULL,
    to_hospital_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    shift_type ENUM('DAY', 'EVENING', 'NIGHT') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    requested_by CHAR(36) NOT NULL,
    approved_by CHAR(36),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (from_hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (to_hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (requested_by) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES employees(id),
    INDEX idx_date (date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 通知紀錄
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    type ENUM('leader_gap', 'leave_approved', 'leave_rejected', 'cross_hospital_request', 'shift_change', 'shift_reminder') NOT NULL,
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
    INDEX idx_created_at (created_at),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 員工偏好設定
CREATE TABLE IF NOT EXISTS employee_preferences (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    preference_type ENUM('preferred', 'avoid', 'unavailable') NOT NULL,
    shift_type ENUM('DAY', 'EVENING', 'NIGHT'),
    day_of_week TINYINT,
    specific_date DATE,
    effective_from DATE,
    effective_to DATE,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_effective (effective_from, effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 班表範本
CREATE TABLE IF NOT EXISTS shift_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    hospital_id CHAR(36) NOT NULL,
    description TEXT,
    cycle_days INT DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (created_by) REFERENCES employees(id),
    INDEX idx_hospital (hospital_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. 班表範本項目
CREATE TABLE IF NOT EXISTS shift_template_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_id CHAR(36) NOT NULL,
    day_index INT NOT NULL,
    shift_type ENUM('DAY', 'EVENING', 'NIGHT', 'OFF') NOT NULL,
    required_count INT DEFAULT 1,
    leader_required INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES shift_templates(id) ON DELETE CASCADE,
    INDEX idx_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. 換班申請
CREATE TABLE IF NOT EXISTS shift_swap_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    requester_id CHAR(36) NOT NULL,
    requester_assignment_id CHAR(36) NOT NULL,
    target_id CHAR(36) NOT NULL,
    target_assignment_id CHAR(36) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    reason TEXT,
    reject_reason VARCHAR(255),
    approved_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES employees(id),
    FOREIGN KEY (target_id) REFERENCES employees(id),
    FOREIGN KEY (requester_assignment_id) REFERENCES shift_assignments(id),
    FOREIGN KEY (target_assignment_id) REFERENCES shift_assignments(id),
    FOREIGN KEY (approved_by) REFERENCES employees(id),
    INDEX idx_requester (requester_id),
    INDEX idx_target (target_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. 自動排班執行記錄
CREATE TABLE IF NOT EXISTS auto_schedule_runs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    hospital_id CHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    template_id CHAR(36),
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    total_shifts INT DEFAULT 0,
    filled_shifts INT DEFAULT 0,
    conflict_count INT DEFAULT 0,
    result_summary JSON,
    initiated_by CHAR(36),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (template_id) REFERENCES shift_templates(id),
    FOREIGN KEY (initiated_by) REFERENCES employees(id),
    INDEX idx_hospital (hospital_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 插入測試資料
-- =============================================

-- 院區資料
INSERT INTO hospitals (id, code, name, address) VALUES
(UUID(), 'SH', '雙和院區', '新北市中和區中正路291號'),
(UUID(), 'TMU', '北醫院區', '台北市信義區吳興街252號'),
(UUID(), 'WF', '萬芳院區', '台北市文山區興隆路三段111號'),
(UUID(), 'FY', '附醫院區', '台北市中山區吉林路17號');

-- 管理員帳號 (密碼: ADMIN001)
INSERT INTO employees (id, employee_no, name, gender, phone, email, password_hash, is_leader, role, status) VALUES
(UUID(), 'ADMIN001', '系統管理員', 'M', '0912345678', 'admin@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', true, 'admin', 'active');
