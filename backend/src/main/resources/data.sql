-- Default Departments
INSERT IGNORE INTO departments (id, department_name, location, phone) VALUES
(1, 'Water Supply', 'Zone A - Main Office', '1800-111-001'),
(2, 'Sanitation & Health', 'Zone D - Health HQ', '1800-111-004'),
(3, 'Electricity & Power', 'Zone B - Power Grid', '1800-111-002'),
(4, 'Roads & Infrastructure', 'Zone C - Works Dept', '1800-111-003'),
(5, 'Public Safety & Transport', 'Zone E - Traffic HQ', '1800-111-005');

-- Sample Complaints Dump
INSERT IGNORE INTO complaints (id, category, citizen_id, department_id, description, location, priority, status, title) VALUES
(1, 'Sanitation', 1, 2, 'Garbage has not been collected for three days.', 'Main Road', 'HIGH', 'RESOLVED', 'Garbage not collected');
