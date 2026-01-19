-- 測試資料腳本
-- 使用已存在的院區 ID

SET @sh_id = '7209d6f5-f53b-11f0-b525-16d1165423d6';
SET @tmu_id = '721002e3-f53b-11f0-b525-16d1165423d6';
SET @wf_id = '72100492-f53b-11f0-b525-16d1165423d6';
SET @fy_id = '721005b6-f53b-11f0-b525-16d1165423d6';

-- 生成員工 UUID
SET @emp1_id = UUID();
SET @emp2_id = UUID();
SET @emp3_id = UUID();
SET @emp4_id = UUID();
SET @emp5_id = UUID();
SET @emp6_id = UUID();
SET @emp7_id = UUID();
SET @emp8_id = UUID();
SET @emp9_id = UUID();
SET @emp10_id = UUID();

-- 添加員工資料 (密碼都是工號)
INSERT INTO employees (id, employee_no, name, gender, phone, email, password_hash, is_leader, is_deputy, can_day, can_night, role, status) VALUES
(@emp1_id, 'SH001', '王小明', 'M', '0912111001', 'sh001@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', true, false, true, true, 'manager', 'active'),
(@emp2_id, 'SH002', '李美玲', 'F', '0912111002', 'sh002@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', false, true, true, true, 'staff', 'active'),
(@emp3_id, 'SH003', '張大偉', 'M', '0912111003', 'sh003@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', false, false, true, false, 'staff', 'active'),
(@emp4_id, 'SH004', '陳雅婷', 'F', '0912111004', 'sh004@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', false, false, false, true, 'staff', 'active'),
(@emp5_id, 'TMU001', '林志強', 'M', '0912222001', 'tmu001@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', true, false, true, true, 'manager', 'active'),
(@emp6_id, 'TMU002', '黃淑芬', 'F', '0912222002', 'tmu002@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', false, true, true, true, 'staff', 'active'),
(@emp7_id, 'TMU003', '劉建國', 'M', '0912222003', 'tmu003@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', false, false, true, true, 'staff', 'active'),
(@emp8_id, 'WF001', '吳秀英', 'F', '0912333001', 'wf001@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', true, false, true, true, 'manager', 'active'),
(@emp9_id, 'WF002', '周明德', 'M', '0912333002', 'wf002@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', false, false, true, true, 'staff', 'active'),
(@emp10_id, 'FY001', '鄭美華', 'F', '0912444001', 'fy001@hospital.com', '$2b$10$89nLVJee7wsnjI6GWQAKHeDhxTXHm7bsS/yWZlJf/NdH9iUZ.MsPe', true, false, true, true, 'manager', 'active');

-- 員工院區關聯
INSERT INTO employee_hospitals (employee_id, hospital_id, is_primary) VALUES
(@emp1_id, @sh_id, true),
(@emp2_id, @sh_id, true),
(@emp3_id, @sh_id, true),
(@emp4_id, @sh_id, true),
(@emp5_id, @tmu_id, true),
(@emp6_id, @tmu_id, true),
(@emp7_id, @tmu_id, true),
(@emp8_id, @wf_id, true),
(@emp9_id, @wf_id, true),
(@emp10_id, @fy_id, true),
-- 跨院支援
(@emp1_id, @tmu_id, false),
(@emp5_id, @sh_id, false);

-- 班別需求設定
INSERT INTO shift_requirements (id, hospital_id, shift_type, required_count, leader_required, effective_date) VALUES
(UUID(), @sh_id, 'DAY', 3, 1, '2026-01-01'),
(UUID(), @sh_id, 'EVENING', 2, 1, '2026-01-01'),
(UUID(), @sh_id, 'NIGHT', 2, 1, '2026-01-01'),
(UUID(), @tmu_id, 'DAY', 3, 1, '2026-01-01'),
(UUID(), @tmu_id, 'EVENING', 2, 1, '2026-01-01'),
(UUID(), @tmu_id, 'NIGHT', 2, 1, '2026-01-01'),
(UUID(), @wf_id, 'DAY', 2, 1, '2026-01-01'),
(UUID(), @wf_id, 'EVENING', 2, 1, '2026-01-01'),
(UUID(), @wf_id, 'NIGHT', 1, 1, '2026-01-01'),
(UUID(), @fy_id, 'DAY', 2, 1, '2026-01-01'),
(UUID(), @fy_id, 'EVENING', 1, 1, '2026-01-01'),
(UUID(), @fy_id, 'NIGHT', 1, 1, '2026-01-01');

-- 班表排班 (今天和未來 7 天)
SET @today = CURDATE();

-- 雙和院區排班
INSERT INTO shift_assignments (id, date, hospital_id, shift_type, employee_id, is_leader_duty, status, created_by) VALUES
-- 今天
(UUID(), @today, @sh_id, 'DAY', @emp1_id, true, 'confirmed', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), @today, @sh_id, 'DAY', @emp2_id, false, 'confirmed', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), @today, @sh_id, 'DAY', @emp3_id, false, 'confirmed', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), @today, @sh_id, 'EVENING', @emp2_id, true, 'scheduled', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), @today, @sh_id, 'NIGHT', @emp4_id, false, 'scheduled', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
-- 明天
(UUID(), DATE_ADD(@today, INTERVAL 1 DAY), @sh_id, 'DAY', @emp1_id, true, 'scheduled', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), DATE_ADD(@today, INTERVAL 1 DAY), @sh_id, 'DAY', @emp3_id, false, 'scheduled', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), DATE_ADD(@today, INTERVAL 1 DAY), @sh_id, 'EVENING', @emp2_id, true, 'scheduled', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), DATE_ADD(@today, INTERVAL 1 DAY), @sh_id, 'NIGHT', @emp4_id, false, 'scheduled', (SELECT id FROM employees WHERE employee_no = 'ADMIN001'));

-- 北醫院區排班
INSERT INTO shift_assignments (id, date, hospital_id, shift_type, employee_id, is_leader_duty, status, created_by) VALUES
(UUID(), @today, @tmu_id, 'DAY', @emp5_id, true, 'confirmed', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), @today, @tmu_id, 'DAY', @emp6_id, false, 'confirmed', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), @today, @tmu_id, 'DAY', @emp7_id, false, 'confirmed', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), @today, @tmu_id, 'EVENING', @emp6_id, true, 'scheduled', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), @today, @tmu_id, 'NIGHT', @emp7_id, false, 'scheduled', (SELECT id FROM employees WHERE employee_no = 'ADMIN001'));

-- 萬芳院區排班
INSERT INTO shift_assignments (id, date, hospital_id, shift_type, employee_id, is_leader_duty, status, created_by) VALUES
(UUID(), @today, @wf_id, 'DAY', @emp8_id, true, 'confirmed', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), @today, @wf_id, 'DAY', @emp9_id, false, 'confirmed', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), @today, @wf_id, 'EVENING', @emp9_id, false, 'scheduled', (SELECT id FROM employees WHERE employee_no = 'ADMIN001'));

-- 附醫院區排班
INSERT INTO shift_assignments (id, date, hospital_id, shift_type, employee_id, is_leader_duty, status, created_by) VALUES
(UUID(), @today, @fy_id, 'DAY', @emp10_id, true, 'confirmed', (SELECT id FROM employees WHERE employee_no = 'ADMIN001')),
(UUID(), DATE_ADD(@today, INTERVAL 1 DAY), @fy_id, 'DAY', @emp10_id, true, 'scheduled', (SELECT id FROM employees WHERE employee_no = 'ADMIN001'));

-- 請假申請
INSERT INTO leave_requests (id, employee_id, leave_date, shift_type, leave_type, reason, status, created_at) VALUES
(UUID(), @emp3_id, DATE_ADD(@today, INTERVAL 2 DAY), 'DAY', 'personal', '家庭因素需請假', 'pending', NOW()),
(UUID(), @emp6_id, DATE_ADD(@today, INTERVAL 3 DAY), NULL, 'annual', '特休', 'pending', NOW()),
(UUID(), @emp2_id, DATE_ADD(@today, INTERVAL 5 DAY), 'EVENING', 'sick', '身體不適', 'approved', NOW());

-- 通知
INSERT INTO notifications (id, type, recipient_id, channel, title, content, status, created_at) VALUES
(UUID(), 'shift_change', (SELECT id FROM employees WHERE employee_no = 'ADMIN001'), 'system', '新請假申請', '張大偉申請 2026/01/21 白班請假，請審核', 'pending', NOW()),
(UUID(), 'shift_change', (SELECT id FROM employees WHERE employee_no = 'ADMIN001'), 'system', '新請假申請', '黃淑芬申請 2026/01/22 全天請假，請審核', 'pending', NOW()),
(UUID(), 'shift_reminder', @emp1_id, 'system', '系統通知', '歡迎使用照護排班系統', 'sent', NOW());
