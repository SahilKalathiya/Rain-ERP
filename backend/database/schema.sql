-- =======================================================
-- RAIN ERP DATABASE SCHEMA (MySQL)
-- Textiles & Raw Material Procurement System
-- =======================================================

CREATE DATABASE IF NOT EXISTS rain_erp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rain_erp_db;

-- 1. USERS TABLE (Authentication & Role Based Access)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'Procurement & Quality Manager',
  password_hash VARCHAR(255) NOT NULL,
  avatar TEXT,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  country VARCHAR(50) DEFAULT 'India',
  state VARCHAR(50) DEFAULT 'Gujarat',
  city VARCHAR(50) DEFAULT 'Surat',
  pincode VARCHAR(10) DEFAULT '395002',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. VENDORS MASTER TABLE
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(30) PRIMARY KEY, -- e.g. VEND-0001
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) DEFAULT 'Fabric Supplier',
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  alternate_phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(50) DEFAULT 'Surat',
  state VARCHAR(50) DEFAULT 'Gujarat',
  gstin VARCHAR(15),
  rating INT DEFAULT 5,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. FABRIC MASTER TABLE
CREATE TABLE IF NOT EXISTS fabrics (
  id VARCHAR(30) PRIMARY KEY, -- e.g. FAB-001
  quality_name VARCHAR(150) NOT NULL,
  fabric_type VARCHAR(50) DEFAULT 'Grey Cotton',
  warp_count VARCHAR(50),
  weft_count VARCHAR(50),
  reed VARCHAR(50),
  pick VARCHAR(50),
  construction VARCHAR(100),
  widths JSON, -- e.g. ["44", "48", "58"]
  default_fold DECIMAL(5,2) DEFAULT 97.00,
  default_rate DECIMAL(10,2) DEFAULT 25.00,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. TRANSPORTERS MASTER TABLE
CREATE TABLE IF NOT EXISTS transporters (
  id VARCHAR(30) PRIMARY KEY, -- e.g. TRANS-001
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  contact_person VARCHAR(100),
  address TEXT,
  city VARCHAR(50) DEFAULT 'Surat',
  state VARCHAR(50) DEFAULT 'Gujarat',
  gstin VARCHAR(15),
  vehicle_types JSON,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. PURCHASE ORDERS (Header)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(30) PRIMARY KEY, -- e.g. PO-6043
  date DATE NOT NULL,
  vendor_id VARCHAR(30) NOT NULL,
  vendor_name VARCHAR(150) NOT NULL,
  expected_delivery_date DATE,
  buffer_allowed BOOLEAN DEFAULT FALSE,
  buffer_percent DECIMAL(5,2) DEFAULT 0.00,
  terms TEXT,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Sent', -- Draft, Sent, Partially Received, Completed, Cancelled
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON UPDATE CASCADE
);

-- 6. PURCHASE ORDER LINE ITEMS
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_id VARCHAR(30) NOT NULL,
  fabric_id VARCHAR(30) NOT NULL,
  fabric_name VARCHAR(150) NOT NULL,
  color_name VARCHAR(100) DEFAULT '',
  width VARCHAR(20) DEFAULT '44',
  quantity DECIMAL(12,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  fold DECIMAL(5,2) DEFAULT 97.00,
  amount DECIMAL(12,2) NOT NULL,
  received_quantity DECIMAL(12,2) DEFAULT 0.00,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- 7. GOODS RECEIPT NOTES (GRN Header)
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id VARCHAR(30) PRIMARY KEY, -- e.g. GRN-0001
  date DATE NOT NULL,
  vendor_id VARCHAR(30) NOT NULL,
  vendor_name VARCHAR(150) NOT NULL,
  transporter_id VARCHAR(30),
  transporter_name VARCHAR(150),
  vendor_invoice_no VARCHAR(100),
  vendor_invoice_date DATE,
  vendor_challan_no VARCHAR(100),
  vendor_challan_date DATE,
  total_bales INT DEFAULT 0,
  declared_total_meters DECIMAL(12,2) DEFAULT 0.00,
  total_meters_entered DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Bale Entry in Progress', -- Bale Entry in Progress, Completed
  admin_approval_needed BOOLEAN DEFAULT FALSE,
  admin_justification TEXT,
  linked_pos JSON, -- Array of PO IDs e.g. ["PO-6043"]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. GRN BALES (Level 2)
CREATE TABLE IF NOT EXISTS grn_bales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grn_id VARCHAR(30) NOT NULL,
  bale_no VARCHAR(50) NOT NULL, -- e.g. Bale 01
  pieces_count INT DEFAULT 0,
  total_length DECIMAL(12,2) DEFAULT 0.00,
  FOREIGN KEY (grn_id) REFERENCES goods_receipt_notes(id) ON DELETE CASCADE
);

-- 9. GRN PIECES (Level 3 - Individual Taka)
CREATE TABLE IF NOT EXISTS grn_pieces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bale_id INT NOT NULL,
  grn_id VARCHAR(30) NOT NULL,
  piece_no VARCHAR(50) NOT NULL, -- e.g. Piece 01
  fabric_name VARCHAR(150) NOT NULL,
  length DECIMAL(10,2) NOT NULL,
  remarks VARCHAR(255) DEFAULT 'Clean',
  FOREIGN KEY (bale_id) REFERENCES grn_bales(id) ON DELETE CASCADE,
  FOREIGN KEY (grn_id) REFERENCES goods_receipt_notes(id) ON DELETE CASCADE
);

-- 10. QUALITY CHECKS (QC Records)
CREATE TABLE IF NOT EXISTS quality_checks (
  id VARCHAR(30) PRIMARY KEY, -- e.g. QC-0001
  grn_ref VARCHAR(30) NOT NULL,
  inspection_scope VARCHAR(50) DEFAULT 'Whole Shipment', -- Whole Shipment, Bale-Level, Piece-Level
  bale_ref VARCHAR(50),
  piece_ref VARCHAR(50),
  inspector_name VARCHAR(100) NOT NULL,
  expected_width VARCHAR(20) DEFAULT '44',
  actual_width DECIMAL(5,2) DEFAULT 44.00,
  expected_fold VARCHAR(20) DEFAULT '97',
  actual_fold DECIMAL(5,2) DEFAULT 97.00,
  photos JSON, -- Array of photo URLs or local file paths
  notes TEXT,
  qc_status VARCHAR(50) DEFAULT 'OK', -- OK, Send for Admin Approval, Reject
  admin_decision VARCHAR(50), -- Approve, Reject
  admin_remarks TEXT,
  date_time VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 11. REJECTED STOCK POOL
CREATE TABLE IF NOT EXISTS rejected_stock_pool (
  id VARCHAR(30) PRIMARY KEY, -- e.g. REJ-0001
  source_qc_ref VARCHAR(30) NOT NULL,
  grn_ref VARCHAR(30),
  po_ref VARCHAR(30),
  vendor_name VARCHAR(150),
  bale_ref VARCHAR(50),
  piece_ref VARCHAR(50),
  fabric_name VARCHAR(150),
  quantity DECIMAL(10,2) NOT NULL,
  reason TEXT,
  date_flagged VARCHAR(50),
  status VARCHAR(50) DEFAULT 'In Pool', -- In Pool, Returned to Vendor, Re-inspected, Scrapped
  action_details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 12. AUDIT LOGS (Live Activity Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(50) NOT NULL, -- Create, Update, Reject, Delete, Inward
  module VARCHAR(100) NOT NULL,
  record_no VARCHAR(50) NOT NULL,
  field VARCHAR(100),
  previous_value TEXT,
  updated_value TEXT,
  remarks TEXT,
  user VARCHAR(100) DEFAULT 'Saksham Garg',
  date_time VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- INITIAL SEED DATA (Demo Setup)
-- =======================================================

-- Seed Users
INSERT INTO users (name, email, password_hash, role, phone, city) VALUES
('Sahil Kalathiya', 'sahil@rainerp.com', '$2b$10$YourHashedPasswordHere', 'General Manager (Admin)', '+91 99000 88776', 'Surat'),
('Saksham Garg', 'saksham.garg@rainerp.com', '$2b$10$YourHashedPasswordHere', 'Procurement & Quality Manager', '+91 98765 43210', 'Surat'),
('Priya Sharma', 'priya.qc@rainerp.com', '$2b$10$YourHashedPasswordHere', 'Quality Control Inspector', '+91 98250 11223', 'Surat')
ON DUPLICATE KEY UPDATE name=name;

-- Seed Vendors
INSERT INTO vendors (id, name, type, phone, city, gstin, rating, active) VALUES
('VEND-0001', 'M.S. Textiles', 'Fabric Supplier', '+91 98765 43210', 'Surat', '24ABCDE1234F1Z5', 5, TRUE),
('VEND-0002', 'Surat Rayon & Silk Mills', 'Mill / Manufacturer', '+91 98250 12345', 'Surat', '24FGHIJ5678K1Z2', 4, TRUE),
('VEND-0003', 'Ichalkaranji Weavers Co-op', 'Weaving Unit', '+91 94230 98765', 'Ichalkaranji', '27LMNOP9012Q1Z9', 5, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Seed Fabrics
INSERT INTO fabrics (id, quality_name, fabric_type, widths, default_fold, default_rate, active) VALUES
('FAB-001', 'Grey Cotton Fabrics (100*100)', 'Grey Cotton', '["44", "48", "58"]', 97.00, 25.00, TRUE),
('FAB-002', 'Rayon 14kg Liva', 'Viscose Rayon', '["44", "58"]', 97.00, 30.00, TRUE),
('FAB-003', 'Cotton Cambric 60*60', 'Cambric', '["44", "58"]', 98.00, 42.00, TRUE)
ON DUPLICATE KEY UPDATE quality_name=quality_name;

-- Seed Transporters
INSERT INTO transporters (id, name, phone, city, gstin, vehicle_types, active) VALUES
('TRANS-001', 'Keshav Freight Carriers', '+91 98790 11223', 'Surat', '24TRANS1234T1Z1', '["Tempo", "Truck (10 Wheeler)"]', TRUE),
('TRANS-002', 'Mahalaxmi Logistics', '+91 98241 44556', 'Ichalkaranji', '27MAHA5678L1Z9', '["Eicher 14ft", "Truck"]', TRUE)
ON DUPLICATE KEY UPDATE name=name;
