-- PostgreSQL Schema for Budget Management System
-- Converted from MySQL for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS amendment_attachments CASCADE;
DROP TABLE IF EXISTS budget_amendment_entries CASCADE;
DROP TABLE IF EXISTS budget_amendments CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS dept_lookup CASCADE;
DROP TABLE IF EXISTS approval_progress CASCADE;
DROP TABLE IF EXISTS approval_workflow CASCADE;
DROP TABLE IF EXISTS history CASCADE;
DROP TABLE IF EXISTS budget_entries CASCADE;
DROP TABLE IF EXISTS budget_request CASCADE;
DROP TABLE IF EXISTS project_account CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS division CASCADE;
DROP TABLE IF EXISTS cluster CASCADE;
DROP TABLE IF EXISTS group_table CASCADE;

DROP TABLE IF EXISTS campus CASCADE;
DROP TABLE IF EXISTS gl_account CASCADE;
DROP TABLE IF EXISTS budget_category CASCADE;
DROP TABLE IF EXISTS fund_type CASCADE;
DROP TABLE IF EXISTS nature CASCADE;

-- Create all tables
CREATE TABLE group_table (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE cluster (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100),
    group_code VARCHAR(10),
    FOREIGN KEY (group_code) REFERENCES group_table(code)
);

CREATE TABLE division (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100),
    cluster_code VARCHAR(10),
    FOREIGN KEY (cluster_code) REFERENCES cluster(code)
);

CREATE TABLE campus (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE department (
    code VARCHAR(10) PRIMARY KEY,
    college VARCHAR(100),
    budget_deck VARCHAR(100),
    division_code VARCHAR(10),
    campus_code VARCHAR(10),
    FOREIGN KEY (division_code) REFERENCES division(code),
    FOREIGN KEY (campus_code) REFERENCES campus(code)
);

CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    username_email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    department_code VARCHAR(10),
    role VARCHAR(100),
    FOREIGN KEY (department_code) REFERENCES department(code)
);

CREATE TABLE gl_account (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255),
    bpr_line_item VARCHAR(100),
    bpr_sub_item VARCHAR(100)
);

CREATE TABLE budget_category (
    code VARCHAR(20) PRIMARY KEY,
    expenditure_type VARCHAR(100)
);

CREATE TABLE fund_type (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE nature (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE budget_request (
    request_id VARCHAR(20) PRIMARY KEY,
    account_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    department_code VARCHAR(10),
    campus_code VARCHAR(10),
    fund_account VARCHAR(100),
    fund_name VARCHAR(255),
    duration VARCHAR(50),
    budget_title VARCHAR(255),
    description TEXT,
    proposed_budget DECIMAL(12, 2),
    approved_budget DECIMAL(15, 2) DEFAULT NULL,
    status VARCHAR(50),
    academic_year VARCHAR(10),
    current_approval_level INTEGER DEFAULT 1,
    total_approval_levels INTEGER DEFAULT 3,
    workflow_complete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (account_id) REFERENCES account(id),
    FOREIGN KEY (department_code) REFERENCES department(code),
    FOREIGN KEY (campus_code) REFERENCES campus(code)
);

CREATE TABLE budget_entries (
    request_id VARCHAR(20),
    row_num INTEGER,
    month_year DATE,
    gl_code VARCHAR(20),
    budget_category_code VARCHAR(20),
    budget_description TEXT,
    remarks TEXT,
    amount DECIMAL(12, 2),
    approved_amount DECIMAL(15, 2) DEFAULT NULL,
    monthly_upload BOOLEAN,
    manual_adjustment BOOLEAN,
    upload_multiplier DECIMAL(5, 2),
    fund_type_code VARCHAR(10),
    nature_code VARCHAR(10),
    fund_account VARCHAR(100),
    fund_name VARCHAR(100),
    PRIMARY KEY (request_id, row_num),
    FOREIGN KEY (request_id) REFERENCES budget_request(request_id),
    FOREIGN KEY (gl_code) REFERENCES gl_account(code),
    FOREIGN KEY (budget_category_code) REFERENCES budget_category(code),
    FOREIGN KEY (fund_type_code) REFERENCES fund_type(code),
    FOREIGN KEY (nature_code) REFERENCES nature(code)
);

CREATE TABLE history (
    history_id SERIAL PRIMARY KEY,
    request_id VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action TEXT,
    account_id INTEGER,
    FOREIGN KEY (request_id) REFERENCES budget_request(request_id),
    FOREIGN KEY (account_id) REFERENCES account(id)
);

CREATE TABLE approval_workflow (
    id SERIAL PRIMARY KEY,
    department_code VARCHAR(10),
    amount_threshold DECIMAL(12, 2),
    approval_level INTEGER,
    approver_role VARCHAR(50),
    approver_id INTEGER,
    is_required BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (department_code) REFERENCES department(code),
    FOREIGN KEY (approver_id) REFERENCES account(id)
);

CREATE TABLE approval_progress (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(20),
    approval_level INTEGER,
    approver_id INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped', 'waiting')),
    comments TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES budget_request(request_id),
    FOREIGN KEY (approver_id) REFERENCES account(id)
);

CREATE TABLE project_account (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE dept_lookup (
    id SERIAL PRIMARY KEY,
    account_id INTEGER,
    department_code VARCHAR(10),
    FOREIGN KEY (account_id) REFERENCES account(id),
    FOREIGN KEY (department_code) REFERENCES department(code)
);

CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(20),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER,
    FOREIGN KEY (request_id) REFERENCES budget_request(request_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES account(id)
);

-- Amendment System Tables
CREATE TABLE budget_amendments (
    amendment_id SERIAL PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL,
    amendment_number INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amendment_type VARCHAR(50) DEFAULT 'general_modification' CHECK (amendment_type IN ('budget_change', 'description_change', 'timeline_change', 'general_modification')),
    amendment_title VARCHAR(255) NOT NULL,
    amendment_reason TEXT NOT NULL,
    original_total_budget DECIMAL(15, 2),
    amended_total_budget DECIMAL(15, 2),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    approved_by INTEGER NULL,
    approved_timestamp TIMESTAMP NULL,
    approval_comments TEXT NULL,
    amendment_data JSONB DEFAULT NULL,
    FOREIGN KEY (request_id) REFERENCES budget_request(request_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES account(id),
    FOREIGN KEY (approved_by) REFERENCES account(id),
    UNIQUE (request_id, amendment_number)
);

CREATE TABLE budget_amendment_entries (
    amendment_id INTEGER NOT NULL,
    row_num INTEGER NOT NULL,
    gl_code VARCHAR(20) NOT NULL,
    budget_description TEXT NOT NULL,
    original_amount DECIMAL(12, 2) NOT NULL,
    amended_amount DECIMAL(12, 2) NOT NULL,
    PRIMARY KEY (amendment_id, row_num),
    FOREIGN KEY (amendment_id) REFERENCES budget_amendments(amendment_id) ON DELETE CASCADE
);

CREATE TABLE amendment_attachments (
    id SERIAL PRIMARY KEY,
    amendment_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER,
    FOREIGN KEY (amendment_id) REFERENCES budget_amendments(amendment_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES account(id)
);

-- Insert sample data
INSERT INTO group_table (code, name) VALUES ('GRP01', 'Admin Group');
INSERT INTO cluster (code, name, group_code) VALUES ('CL01', 'Cluster A', 'GRP01');
INSERT INTO division (code, name, cluster_code) VALUES ('DIV01', 'Division X', 'CL01');

INSERT INTO campus (code, name) VALUES 
('11', 'Manila'), ('12', 'Makati'), ('13', 'McKinley'), ('21', 'Laguna'), ('31', 'BGC');

INSERT INTO department (code, college, budget_deck, division_code, campus_code) VALUES 
('999', 'Test College', 'Test Deck', 'DIV01', '11'),
('CCS', 'College of Computer Studies', 'CCS Deck', 'DIV01', '11'),
('CLA', 'College of Liberal Arts', 'CLA Deck', 'DIV01', '11'),
('COB', 'Ramon V. del Rosario College of Business', 'COB Deck', 'DIV01', '11'),
('GCOE', 'Gokongwei College of Engineering', 'GCOE Deck', 'DIV01', '11'),
('COS', 'College of Science', 'COS Deck', 'DIV01', '11'),
('SOE', 'School of Economics', 'SOE Deck', 'DIV01', '11'),
('BAGCED', 'Br. Andrew Gonzalez College of Education', 'BAGCED Deck', 'DIV01', '11'),
('COL', 'College of Law', 'COL Deck', 'DIV01', '11'),
('JMRIG', 'Jesse M. Robredo Institute of Governance', 'JMRIG Deck', 'DIV01', '11'),
('GSB', 'Graduate School of Business', 'GSB Deck', 'DIV01', '11'),
('IGSP', 'La Salle Institute for Governance and Strategic Policy', 'IGSP Deck', 'DIV01', '11');

-- Insert test accounts
INSERT INTO account (username_email, password, name, department_code, role) VALUES
('testuser@example.com', 'testpass', 'Test User', '999', 'requester'),
('dept.head@example.com', 'testpass', 'Department Head', '999', 'department_head'),
('dean@example.com', 'testpass', 'College Dean', '999', 'dean'),
('vp.finance@example.com', 'testpass', 'VP Finance', '999', 'vp_finance'),
('approver@example.com', 'testpass', 'General Approver', '999', 'approver');

-- Insert GL accounts
INSERT INTO gl_account (code, name, bpr_line_item, bpr_sub_item) VALUES 
-- SALARIES (1-10)
('210304001', 'FHIT - SALARIES - 1', 'Salaries', 'Regular'),
('210304002', 'FHIT - SALARIES - 2', 'Salaries', 'Regular'),
('210304003', 'FHIT - SALARIES - 3', 'Salaries', 'Regular'),
('210304004', 'FHIT - SALARIES - 4', 'Salaries', 'Regular'),
('210304005', 'FHIT - SALARIES - 5', 'Salaries', 'Regular'),
('210304006', 'FHIT - SALARIES - 6', 'Salaries', 'Regular'),
('210304007', 'FHIT - SALARIES - 7', 'Salaries', 'Regular'),
('210304008', 'FHIT - SALARIES - 8', 'Salaries', 'Regular'),
('210304009', 'FHIT - SALARIES - 9', 'Salaries', 'Regular'),
('210304010', 'FHIT - SALARIES - 10', 'Salaries', 'Regular'),

-- HONORARIA (1-10)
('210305001', 'FHIT - HONORARIA - 1', 'Honoraria', 'Professional'),
('210305002', 'FHIT - HONORARIA - 2', 'Honoraria', 'Professional'),
('210305003', 'FHIT - HONORARIA - 3', 'Honoraria', 'Professional'),
('210305004', 'FHIT - HONORARIA - 4', 'Honoraria', 'Professional'),
('210305005', 'FHIT - HONORARIA - 5', 'Honoraria', 'Professional'),
('210305006', 'FHIT - HONORARIA - 6', 'Honoraria', 'Professional'),
('210305007', 'FHIT - HONORARIA - 7', 'Honoraria', 'Professional'),
('210305008', 'FHIT - HONORARIA - 8', 'Honoraria', 'Professional'),
('210305009', 'FHIT - HONORARIA - 9', 'Honoraria', 'Professional'),
('210305010', 'FHIT - HONORARIA - 10', 'Honoraria', 'Professional'),

-- PROFESSIONAL FEE (1-10)
('210306001', 'FHIT - PROFESSIONAL FEE - 1', 'Professional Fee', 'Services'),
('210306002', 'FHIT - PROFESSIONAL FEE - 2', 'Professional Fee', 'Services'),
('210306003', 'FHIT - PROFESSIONAL FEE - 3', 'Professional Fee', 'Services'),
('210306004', 'FHIT - PROFESSIONAL FEE - 4', 'Professional Fee', 'Services'),
('210306005', 'FHIT - PROFESSIONAL FEE - 5', 'Professional Fee', 'Services'),
('210306006', 'FHIT - PROFESSIONAL FEE - 6', 'Professional Fee', 'Services'),
('210306007', 'FHIT - PROFESSIONAL FEE - 7', 'Professional Fee', 'Services'),
('210306008', 'FHIT - PROFESSIONAL FEE - 8', 'Professional Fee', 'Services'),
('210306009', 'FHIT - PROFESSIONAL FEE - 9', 'Professional Fee', 'Services'),
('210306010', 'FHIT - PROFESSIONAL FEE - 10', 'Professional Fee', 'Services'),

-- OTHER FHIT EXPENSES
('210303007', 'FHIT - TRANSPORTATION AND DELIVERY EXPENSES', 'Transportation', 'Delivery'),
('210303028', 'FHIT - TRAVEL (LOCAL)', 'Travel', 'Local'),
('210303029', 'FHIT - TRAVEL (FOREIGN)', 'Travel', 'Foreign'),
('210303025', 'FHIT - ACCOMMODATION AND VENUE', 'Accommodation', 'Venue'),
('210303003', 'FHIT - TRAVEL ALLOWANCE / PER DIEM', 'Travel Allowance', 'Per Diem'),
('210303026', 'FHIT - FOOD AND MEALS', 'Food', 'Meals'),
('210303018', 'FHIT - REPRESENTATION EXPENSES', 'Representation', 'Expenses'),
('210303005', 'FHIT - REPAIRS AND MAINTENANCE OF FACILITIES', 'Repairs', 'Facilities'),
('210303006', 'FHIT - REPAIRS AND MAINTENANCE OF VEHICLES', 'Repairs', 'Vehicles'),
('210303008', 'FHIT - SUPPLIES AND MATERIALS EXPENSES', 'Supplies', 'Materials'),
('210303015', 'FHIT - ADVERTISING EXPENSES', 'Advertising', 'Marketing'),
('210303016', 'FHIT - PRINTING AND BINDING EXPENSES', 'Printing', 'Binding'),
('210303014', 'FHIT - GENERAL SERVICES', 'General', 'Services'),
('210303004', 'FHIT - COMMUNICATION EXPENSES', 'Communication', 'Utilities'),
('210303009', 'FHIT - UTILITY EXPENSES', 'Utilities', 'General'),
('210303011', 'FHIT - SCHOLARSHIP EXPENSES', 'Scholarship', 'Educational'),
('210303010', 'FHIT - TRAINING, WORKSHOP, CONFERENCE', 'Training', 'Development'),
('210303027', 'FHIT - MEMBERSHIP FEE', 'Membership', 'Fees'),
('210303040', 'FHIT - INDIRECT COST - RESEARCH FEE', 'Research', 'Indirect'),
('210303043', 'FHIT - WITHDRAWAL OF FUND', 'Withdrawal', 'Fund'),
('210303012', 'FHIT - AWARDS/REWARDS, PRICES AND INDEMNITIES', 'Awards', 'Rewards'),
('210303013', 'FHIT - SURVEY, RESEARCH, EXPLORATION AND DEVELOPMENT EXPENSES', 'Research', 'Development'),
('210303017', 'FHIT - RENT EXPENSES', 'Rent', 'Facilities'),
('210303019', 'FHIT - SUBSCRIPTION EXPENSES', 'Subscription', 'Services'),
('210303020', 'FHIT - DONATIONS', 'Donations', 'Charitable'),
('210303022', 'FHIT - TAXES, INSURANCE PREMIUMS AND OTHER FEES', 'Taxes', 'Insurance'),
('210303023', 'FHIT - OTHER MAINTENANCE AND OPERATING EXPENSES', 'Maintenance', 'Operating');

INSERT INTO fund_type (code, name) VALUES ('FT01', 'FHIT Fund');
INSERT INTO nature (code, name) VALUES ('NT01', 'Operating');

INSERT INTO budget_category (code, expenditure_type) VALUES 
('CAT01', 'Salaries'), ('CAT02', 'Honoraria'), ('CAT03', 'Prof Fees');

INSERT INTO project_account (code, name) VALUES ('PA001', 'Project A');

-- WORKFLOW SETUP: ALL REQUESTS GO THROUGH ALL 3 LEVELS 
INSERT INTO approval_workflow (department_code, amount_threshold, approval_level, approver_role, is_required) VALUES
-- Test Department
('999', 0.01, 1, 'department_head', TRUE),
('999', 0.01, 2, 'dean', TRUE),
('999', 0.01, 3, 'vp_finance', TRUE),
-- CCS - College of Computer Studies
('CCS', 0.01, 1, 'department_head', TRUE),
('CCS', 0.01, 2, 'dean', TRUE),
('CCS', 0.01, 3, 'vp_finance', TRUE),
-- CLA - College of Liberal Arts
('CLA', 0.01, 1, 'department_head', TRUE),
('CLA', 0.01, 2, 'dean', TRUE),
('CLA', 0.01, 3, 'vp_finance', TRUE),
-- COB - Ramon V. del Rosario College of Business
('COB', 0.01, 1, 'department_head', TRUE),
('COB', 0.01, 2, 'dean', TRUE),
('COB', 0.01, 3, 'vp_finance', TRUE),
-- GCOE - Gokongwei College of Engineering
('GCOE', 0.01, 1, 'department_head', TRUE),
('GCOE', 0.01, 2, 'dean', TRUE),
('GCOE', 0.01, 3, 'vp_finance', TRUE),
-- COS - College of Science
('COS', 0.01, 1, 'department_head', TRUE),
('COS', 0.01, 2, 'dean', TRUE),
('COS', 0.01, 3, 'vp_finance', TRUE),
-- SOE - School of Economics
('SOE', 0.01, 1, 'department_head', TRUE),
('SOE', 0.01, 2, 'dean', TRUE),
('SOE', 0.01, 3, 'vp_finance', TRUE),
-- BAGCED - Br. Andrew Gonzalez College of Education
('BAGCED', 0.01, 1, 'department_head', TRUE),
('BAGCED', 0.01, 2, 'dean', TRUE),
('BAGCED', 0.01, 3, 'vp_finance', TRUE),
-- COL - College of Law
('COL', 0.01, 1, 'department_head', TRUE),
('COL', 0.01, 2, 'dean', TRUE),
('COL', 0.01, 3, 'vp_finance', TRUE),
-- JMRIG - Jesse M. Robredo Institute of Governance
('JMRIG', 0.01, 1, 'department_head', TRUE),
('JMRIG', 0.01, 2, 'dean', TRUE),
('JMRIG', 0.01, 3, 'vp_finance', TRUE),
-- GSB - Graduate School of Business
('GSB', 0.01, 1, 'department_head', TRUE),
('GSB', 0.01, 2, 'dean', TRUE),
('GSB', 0.01, 3, 'vp_finance', TRUE),
-- IGSP - La Salle Institute for Governance and Strategic Policy
('IGSP', 0.01, 1, 'department_head', TRUE),
('IGSP', 0.01, 2, 'dean', TRUE),
('IGSP', 0.01, 3, 'vp_finance', TRUE);

-- Insert sample budget requests
INSERT INTO budget_request (request_id, account_id, timestamp, department_code, campus_code, academic_year, status, proposed_budget, current_approval_level, workflow_complete, fund_account, fund_name, duration, budget_title, description) VALUES
('CCS2025001', 1, '2025-01-15 09:00:00', 'CCS', '11', '2025-2026', 'approved', 85000.00, 3, TRUE, 'CCS-FUND-001', 'Computer Studies Research Fund', 'Annually', 'Laboratory Equipment', 'New computers and networking equipment for labs'),
('CCS2025002', 1, '2025-01-20 10:00:00', 'CCS', '11', '2025-2026', 'approved', 65000.00, 3, TRUE, 'CCS-FUND-002', 'CCS Software Fund', 'Quarterly', 'Software Licenses', 'Development tools and software licenses'),
('CCS2025003', 1, '2025-02-01 11:00:00', 'CCS', '11', '2025-2026', 'pending', 90000.00, 2, FALSE, 'CCS-FUND-003', 'CCS Operations Fund', 'Monthly', 'Server Infrastructure', 'Server upgrade and maintenance');

-- Insert sample budget entries
INSERT INTO budget_entries (request_id, row_num, month_year, gl_code, budget_category_code, budget_description, remarks, amount, fund_type_code, nature_code, fund_account, fund_name) VALUES
('CCS2025001', 1, '2025-01-01', '210304001', 'CAT01', 'Computer hardware purchase', 'High-performance workstations', 50000.00, 'FT01', 'NT01', 'CCS-FUND-001', 'Computer Studies Research Fund'),
('CCS2025001', 2, '2025-01-01', '210303008', 'CAT03', 'Networking equipment', 'Switches and routers', 35000.00, 'FT01', 'NT01', 'CCS-FUND-001', 'Computer Studies Research Fund'),
('CCS2025002', 1, '2025-01-01', '210306001', 'CAT03', 'Software licenses', 'Development tools', 65000.00, 'FT01', 'NT01', 'CCS-FUND-002', 'CCS Software Fund'),
('CCS2025003', 1, '2025-01-01', '210303005', 'CAT03', 'Server maintenance', 'Hardware upgrades', 90000.00, 'FT01', 'NT01', 'CCS-FUND-003', 'CCS Operations Fund');

-- Insert sample amendments
INSERT INTO budget_amendments (request_id, amendment_number, created_by, amendment_type, amendment_title, amendment_reason, original_total_budget, amended_total_budget, status, approved_by, approved_timestamp, approval_comments) VALUES
('CCS2025001', 1, 4, 'budget_change', 'Budget Increase for Additional Equipment', 'After further review, additional laboratory equipment is needed to meet project objectives. This amendment increases the budget to accommodate the procurement of specialized research instruments.', 85000.00, 97750.00, 'approved', 4, '2025-01-22 14:30:00', 'Approved by VP Finance after reviewing project requirements and available funding.');

-- Insert sample amendment entries
INSERT INTO budget_amendment_entries (amendment_id, row_num, gl_code, budget_description, original_amount, amended_amount) VALUES
(1, 1, '210304001', 'Computer hardware purchase - Additional units', 50000.00, 57500.00),
(1, 2, '210303008', 'Networking equipment - Enhanced specifications', 35000.00, 40250.00);

-- Create indexes for better performance
CREATE INDEX idx_budget_request_status ON budget_request(status);
CREATE INDEX idx_budget_request_department ON budget_request(department_code);
CREATE INDEX idx_budget_request_account ON budget_request(account_id);
CREATE INDEX idx_approval_progress_request ON approval_progress(request_id);
CREATE INDEX idx_approval_progress_status ON approval_progress(status);
CREATE INDEX idx_budget_entries_request ON budget_entries(request_id);
CREATE INDEX idx_history_request ON history(request_id);
CREATE INDEX idx_attachments_request ON attachments(request_id);
CREATE INDEX idx_budget_amendments_request ON budget_amendments(request_id);

-- Enable Row Level Security (RLS) for better security (DONT ENABLE THIS YET)
/*
ALTER TABLE account ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_amendment_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE amendment_attachments ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can customize these based on your needs) (DONT ENABLE THIS YET)
/*
CREATE POLICY "Users can view their own account" ON account FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can view budget requests from their department" ON budget_request FOR SELECT USING (department_code IN (SELECT department_code FROM account WHERE id = auth.uid()::integer));
CREATE POLICY "Users can view budget entries for their requests" ON budget_entries FOR SELECT USING (request_id IN (SELECT request_id FROM budget_request WHERE account_id = auth.uid()::integer));
*/

-- Grant necessary permissions (DONT ENABLE THIS YET)
/* GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
*/