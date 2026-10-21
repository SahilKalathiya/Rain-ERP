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
-- 13. CUSTOMER MASTER TABLE
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(30) PRIMARY KEY, -- e.g. CUST-001
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) DEFAULT 'B2B Retailer', -- B2B Retailer, Distributor, Direct Customer, Online Platform
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(50) DEFAULT 'Surat',
  state VARCHAR(50) DEFAULT 'Gujarat',
  gstin VARCHAR(15),
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 14. COLOR MASTER (Extended with Seasonality & Trending)
CREATE TABLE IF NOT EXISTS colors (
  id VARCHAR(30) PRIMARY KEY, -- e.g. COL-001
  name VARCHAR(100) NOT NULL,
  hex_code VARCHAR(10) NOT NULL,
  pantone_code VARCHAR(50),
  quarter_tag VARCHAR(10), -- Q1, Q2, Q3, Q4
  is_trending BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 15. ARTICLE MASTER TABLE
CREATE TABLE IF NOT EXISTS articles (
  id VARCHAR(30) PRIMARY KEY, -- e.g. ART-001
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT '👕',
  sort_order INT DEFAULT 1,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 16. SIZE SERIES & SIZES MASTER
CREATE TABLE IF NOT EXISTS size_series (
  id VARCHAR(30) PRIMARY KEY, -- e.g. SER-ALPHA
  name VARCHAR(100) NOT NULL, -- Alphabetic, Numeric, Roman, Mixed
  display_order INT DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS size_masters (
  id VARCHAR(30) PRIMARY KEY, -- e.g. SIZ-001
  series_id VARCHAR(30) NOT NULL,
  size_name VARCHAR(50) NOT NULL, -- S, M, L, XL, 32, 34
  display_name VARCHAR(50),
  description TEXT,
  display_order INT DEFAULT 1,
  FOREIGN KEY (series_id) REFERENCES size_series(id) ON DELETE CASCADE
);

-- 17. ACCESSORIES MASTER
CREATE TABLE IF NOT EXISTS accessory_masters (
  id VARCHAR(30) PRIMARY KEY, -- e.g. ACC-001
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL, -- Buttons, Lace, Tassels, Dori, Thread, Elastic, Beads & Sequins
  unit VARCHAR(30) DEFAULT 'Piece',
  pieces_per_unit INT DEFAULT 1,
  max_buffer DECIMAL(5,2) DEFAULT 10.00,
  hsn_code VARCHAR(30),
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  config JSON, -- Category-specific configuration fields (sizes, varieties, thread pattern, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 18. THREAD SIZES MASTER (Packaging & Units)
CREATE TABLE IF NOT EXISTS thread_sizes (
  id VARCHAR(30) PRIMARY KEY, -- e.g. THS-001
  brand_name VARCHAR(100) NOT NULL,
  packaging_type VARCHAR(50) DEFAULT 'Reel', -- Reel, Cone, Other
  pieces_per_box INT DEFAULT 15,
  thread_length_per_piece DECIMAL(10,2) DEFAULT 20.00, -- in metres
  box_capacity DECIMAL(10,2),
  cones INT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. THREAD BRAND & COLOR CODE MASTER
CREATE TABLE IF NOT EXISTS thread_color_codes (
  id VARCHAR(30) PRIMARY KEY, -- e.g. TCC-001
  brand_name VARCHAR(100) NOT NULL,
  color_number VARCHAR(50) NOT NULL,
  color_code VARCHAR(10) NOT NULL, -- HEX code
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. SALES ORDERS (Header)
CREATE TABLE IF NOT EXISTS sales_orders (
  id VARCHAR(30) PRIMARY KEY, -- e.g. ORD-2026-001
  style_name VARCHAR(200) NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery DATE,
  priority VARCHAR(30) DEFAULT 'Normal', -- Normal, High, Urgent
  size_series_id VARCHAR(30),
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Confirmed, In Production, Completed
  stage VARCHAR(100) DEFAULT 'Order Created',
  total_garments INT DEFAULT 0,
  total_fabric_greige DECIMAL(12,2) DEFAULT 0.00,
  total_fabric_dyed DECIMAL(12,2) DEFAULT 0.00,
  estimated_cost DECIMAL(12,2) DEFAULT 0.00,
  created_by VARCHAR(100) DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 21. ORDER LINE ITEMS & SPECIFICATIONS
CREATE TABLE IF NOT EXISTS order_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(30) NOT NULL,
  article_id VARCHAR(30) NOT NULL,
  article_name VARCHAR(100) NOT NULL,
  avg_garment_length DECIMAL(8,2) NOT NULL,
  number_of_fabric_pieces INT DEFAULT 1,
  fabrics JSON, -- [{piece_label, fabric_id, fabric_name, width, shrinkage_percent}]
  FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_customer_mappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(30) NOT NULL,
  customer_id VARCHAR(30) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  assigned_articles JSON, -- ["Kurta", "Pant"]
  FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_quantity_matrices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(30) NOT NULL,
  group_name VARCHAR(100) DEFAULT 'Default Group',
  is_uniform BOOLEAN DEFAULT TRUE,
  ratio_used BOOLEAN DEFAULT FALSE,
  ratio_string VARCHAR(50),
  base_quantity INT,
  quantities_by_combination JSON, -- [{article, customer, color, size, quantity}]
  FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_fabric_consumptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(30) NOT NULL,
  article_name VARCHAR(100) NOT NULL,
  fabric_id VARCHAR(30) NOT NULL,
  fabric_name VARCHAR(150) NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  width VARCHAR(20) NOT NULL,
  consumption_per_garment DECIMAL(8,2) NOT NULL,
  total_pieces INT DEFAULT 0,
  shrinkage_percent DECIMAL(5,2) DEFAULT 0.00,
  buffer_percent DECIMAL(5,2) DEFAULT 0.00,
  total_greige DECIMAL(10,2) DEFAULT 0.00,
  total_dyed DECIMAL(10,2) DEFAULT 0.00,
  fabric_rate DECIMAL(10,2) DEFAULT 0.00,
  dyed_rate DECIMAL(10,2) DEFAULT 0.00,
  FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_accessories_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(30) NOT NULL,
  category VARCHAR(50) NOT NULL,
  variety_name VARCHAR(100) NOT NULL,
  unit VARCHAR(30) DEFAULT 'Piece',
  applies_to_articles JSON, -- ["Kurta"]
  configs JSON, -- [{article, color, total_garments, placement, accessory_color, size, source, fabric_color, req_per_pc, extra_per_pack, buffer_percent, total_qty}]
  FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
);

-- =======================================================
-- INITIAL SEED DATA FOR MASTERS & ORDERS
-- =======================================================

-- Seed Customers
INSERT INTO customers (id, name, type, phone, city, gstin, active) VALUES
('CUST-001', 'Manyavar Trends Retail', 'B2B Retailer', '+91 98980 12345', 'Ahmedabad', '24AAACM1234F1Z1', TRUE),
('CUST-002', 'FabIndia Lifestyle Hub', 'Distributor', '+91 98220 54321', 'Mumbai', '27AABCF5678G1Z2', TRUE),
('CUST-003', 'Ethnicity Boutiques', 'Direct Customer', '+91 97110 98765', 'Jaipur', '08AACCE9012H1Z3', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Seed Colors with Quarter/Season & Trending Flag
INSERT INTO colors (id, name, hex_code, pantone_code, quarter_tag, is_trending, active) VALUES
('COL-001', 'Charcoal', '#333333', 'PANTONE 19-4008', 'Q1', TRUE, TRUE),
('COL-002', 'Green', '#228B22', 'PANTONE 18-6030', 'Q1', TRUE, TRUE),
('COL-003', 'Ivory', '#FFFFF0', 'PANTONE 11-0601', 'Q2', TRUE, TRUE),
('COL-004', 'Jamun', '#4B0082', 'PANTONE 19-3518', 'Q3', TRUE, TRUE),
('COL-005', 'Lavender', '#E6E6FA', 'PANTONE 14-3907', 'Q2', FALSE, TRUE),
('COL-006', 'Maroon', '#800000', 'PANTONE 19-1528', 'Q4', TRUE, TRUE),
('COL-007', 'Navy Blue', '#000080', 'PANTONE 19-3832', 'Q1', TRUE, TRUE),
('COL-008', 'Pastel Red', '#FF6961', 'PANTONE 16-1546', 'Q2', FALSE, TRUE),
('COL-009', 'Rama Green', '#20B2AA', 'PANTONE 16-5121', 'Q3', TRUE, TRUE),
('COL-010', 'Rust Light', '#B7410E', 'PANTONE 18-1248', 'Q4', TRUE, TRUE),
('COL-011', 'Sea Green', '#2E8B57', 'PANTONE 16-5418', 'Q1', FALSE, TRUE),
('COL-012', 'Watermelon', '#FC6C85', 'PANTONE 16-1735', 'Q2', TRUE, TRUE),
('COL-013', 'Wine', '#722F37', 'PANTONE 19-1815', 'Q4', TRUE, TRUE),
('COL-014', 'Yellow', '#FFD700', 'PANTONE 13-0858', 'Q3', FALSE, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Seed Articles
INSERT INTO articles (id, name, icon, sort_order, active) VALUES
('ART-001', 'Kurta', '👕', 1, TRUE),
('ART-002', 'Pajama', '👖', 2, TRUE),
('ART-003', 'Dupatta', '🧣', 3, TRUE),
('ART-004', 'Jacket', '🧥', 4, TRUE),
('ART-005', 'Top', '👚', 5, TRUE),
('ART-006', 'Bottom', '👖', 6, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Seed Size Series
INSERT INTO size_series (id, name, display_order, active) VALUES
('SER-ALPHA', 'Alphabetic (S, M, L, XL, XXL)', 1, TRUE),
('SER-NUM', 'Numeric (32, 34, 36, 38, 40)', 2, TRUE),
('SER-MIX', 'Alpha + Numeric Mixed', 3, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Seed Sizes
INSERT INTO size_masters (id, series_id, size_name, display_name, display_order) VALUES
('SIZ-001', 'SER-ALPHA', 'S', 'Small (S)', 1),
('SIZ-002', 'SER-ALPHA', 'M', 'Medium (M)', 2),
('SIZ-003', 'SER-ALPHA', 'L', 'Large (L)', 3),
('SIZ-004', 'SER-ALPHA', 'XL', 'Extra Large (XL)', 4),
('SIZ-005', 'SER-ALPHA', 'XXL', 'Double Large (XXL)', 5),
('SIZ-006', 'SER-NUM', '36', 'Size 36', 1),
('SIZ-007', 'SER-NUM', '38', 'Size 38', 2),
('SIZ-008', 'SER-NUM', '40', 'Size 40', 3),
('SIZ-009', 'SER-NUM', '42', 'Size 42', 4)
ON DUPLICATE KEY UPDATE size_name=size_name;

-- Seed Thread Sizes
INSERT INTO thread_sizes (id, brand_name, packaging_type, pieces_per_box, thread_length_per_piece, box_capacity, cones, active) VALUES
('THS-001', 'Vardhman Poly', 'Reel', 15, 20.00, 6000.00, NULL, TRUE),
('THS-002', 'Coats Astra', 'Cone', 1, 5000.00, 5000.00, 1, TRUE),
('THS-003', 'Madura Coats', 'Cone', 1, 10000.00, 10000.00, 1, TRUE)
ON DUPLICATE KEY UPDATE brand_name=brand_name;

-- Seed Accessory Masters
INSERT INTO accessory_masters (id, name, category, unit, pieces_per_unit, max_buffer, hsn_code, config, active) VALUES
('ACC-001', 'Coconut Natural Buttons (14L / 18L)', 'Buttons', 'Piece', 1, 10.00, '96062100', '{"variants": ["14L", "18L", "20L"], "colors": ["Natural", "Dark Brown", "Gold"]}', TRUE),
('ACC-002', 'Cotton Crochet Lace 18mm', 'Lace', 'Meter', 1, 5.00, '58081000', '{"size": "18mm", "unit": "Meter", "shrinkage_percent": 3.00, "fabric_per_meter_lace": 0.15}', TRUE),
('ACC-003', 'Handmade Silk Tassels', 'Tassels', 'Piece', 1, 8.00, '58089000', '{"tassel_type": "Job Work", "sizes": [{"size": "2 inch", "thread_consumption": 12}]}', TRUE),
('ACC-004', 'Matching Fabric Drawstring (Dori)', 'Dori', 'Meter', 1, 5.00, '56075000', '{"fabrics": [{"fabric_id": "FAB-001", "widths": ["44", "58"], "consumption_per_width": {"44": 12.5, "58": 9.8}}]}', TRUE),
('ACC-005', 'Braided Waist Elastic 1 inch', 'Elastic', 'Meter', 1, 5.00, '56041000', '{"fabric_consumption": 0.85, "unit": "Meter"}', TRUE),
('ACC-006', 'Vardhman Kantha Embroidery Thread', 'Thread', 'Meter', 1, 10.00, '52041100', '{"thread_pattern": "Kantha", "thread_per_stitch": 15.0, "global_stitching_metric": 15.0, "boxes": [{"reels_per_box": 15, "metres_per_reel": 400}]}', TRUE)
ON DUPLICATE KEY UPDATE name=name;
-- =======================================================
-- MODULE 3: PROCESS PO — JOB WORK PROCUREMENT MODULE
-- =======================================================

-- 22. PROCESS PURCHASE ORDERS (Header)
CREATE TABLE IF NOT EXISTS process_pos (
  id VARCHAR(30) PRIMARY KEY, -- e.g. PPO-7611
  po_number VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  issue_date DATE,
  vendor_id VARCHAR(30) NOT NULL,
  vendor_name VARCHAR(150) NOT NULL,
  linked_sales_order_id VARCHAR(30),
  style_names JSON, -- Array of style names
  number_of_styles INT DEFAULT 1,
  customer_brand_name VARCHAR(150),
  delivery_date DATE,
  terms TEXT,
  total_meters DECIMAL(12,2) DEFAULT 0.00,
  total_pieces DECIMAL(12,2) DEFAULT 0.00,
  total_estimated_cost DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Sent to Vendor, Partially Dispatched, Fully Dispatched, Completed, Cancelled
  created_by VARCHAR(100) DEFAULT 'Saksham Garg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON UPDATE CASCADE
);

-- 23. PROCESS PO LINE ITEMS
CREATE TABLE IF NOT EXISTS process_po_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  process_po_id VARCHAR(30) NOT NULL,
  style_name VARCHAR(100),
  fabric_id VARCHAR(30) NOT NULL,
  fabric_name VARCHAR(150) NOT NULL,
  color_id VARCHAR(30),
  color_name VARCHAR(100) NOT NULL,
  article_id VARCHAR(30),
  article_name VARCHAR(100),
  width VARCHAR(20) NOT NULL,
  quantity_meters DECIMAL(12,2) NOT NULL,
  quantity_pieces DECIMAL(12,2) NOT NULL,
  consumption_per_piece DECIMAL(8,2) DEFAULT 2.60,
  shrinkage_percent DECIMAL(5,2) DEFAULT 4.00,
  raw_fabric_meters DECIMAL(12,2) NOT NULL,
  fabric_rate DECIMAL(10,2) NOT NULL,
  dyeing_rate DECIMAL(10,2) NOT NULL,
  total_actual_cost DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  remarks TEXT,
  sample_photo MEDIUMTEXT,
  status VARCHAR(50) DEFAULT 'Not Ordered', -- Not Ordered, Partially Ordered, Already Ordered
  dispatched_meters DECIMAL(12,2) DEFAULT 0.00,
  received_meters DECIMAL(12,2) DEFAULT 0.00,
  FOREIGN KEY (process_po_id) REFERENCES process_pos(id) ON DELETE CASCADE
);

-- 24. PROCESS CHALLANS (Dispatch to Job Work Vendor)
CREATE TABLE IF NOT EXISTS process_challans (
  id VARCHAR(30) PRIMARY KEY, -- e.g. PCH-4903
  challan_number VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  vendor_id VARCHAR(30) NOT NULL,
  vendor_name VARCHAR(150) NOT NULL,
  linked_pos JSON, -- ["PPO-7611", "PPO-7612", "PPO-7613"]
  styles_info JSON,
  po_link_status VARCHAR(50) DEFAULT 'Linked', -- Linked, Pending PO Link
  admin_alert_triggered BOOLEAN DEFAULT FALSE,
  folding_notation VARCHAR(50) DEFAULT 'L100',
  total_bales INT DEFAULT 0,
  total_pieces INT DEFAULT 0,
  grand_total_meters DECIMAL(12,2) DEFAULT 0.00,
  remarks TEXT,
  receiver_signature VARCHAR(100),
  company_representative VARCHAR(100) DEFAULT 'Anurag',
  status VARCHAR(50) DEFAULT 'Dispatched', -- Dispatched, Partially Returned, Fully Returned, Cancelled
  created_by VARCHAR(100) DEFAULT 'Saksham Garg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON UPDATE CASCADE
);

-- 25. PROCESS CHALLAN LINE ITEMS
CREATE TABLE IF NOT EXISTS process_challan_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challan_id VARCHAR(30) NOT NULL,
  po_id VARCHAR(30),
  fabric_name VARCHAR(150) NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  invoice_no VARCHAR(100),
  bale_roll_no VARCHAR(100) NOT NULL,
  is_partial_cut BOOLEAN DEFAULT FALSE,
  original_piece_meters DECIMAL(10,2),
  dispatched_meters DECIMAL(10,2) NOT NULL,
  folding VARCHAR(50) DEFAULT 'L100',
  remarks VARCHAR(255),
  FOREIGN KEY (challan_id) REFERENCES process_challans(id) ON DELETE CASCADE
);

-- 26. PROCESS RETURNS / INBOUND GRN (Vendor Returns Processed Fabric)
CREATE TABLE IF NOT EXISTS process_returns (
  id VARCHAR(30) PRIMARY KEY, -- e.g. PRN-2196
  vendor_id VARCHAR(30) NOT NULL,
  vendor_name VARCHAR(150) NOT NULL,
  vendor_external_challan_no VARCHAR(100) NOT NULL,
  vendor_challan_date DATE NOT NULL,
  vendor_invoice_no VARCHAR(100),
  vendor_invoice_date DATE,
  vendor_invoice_value DECIMAL(12,2),
  internal_series VARCHAR(50) DEFAULT 'Job Work', -- Job Work, Selling
  linked_po_id VARCHAR(30) NOT NULL,
  linked_challan_id VARCHAR(30) NOT NULL,
  received_date DATE NOT NULL,
  fabric_quality VARCHAR(150) NOT NULL,
  width VARCHAR(20),
  weight DECIMAL(8,2),
  folding_standard VARCHAR(50) DEFAULT 'Fold 100',
  total_pieces INT DEFAULT 0,
  total_meters DECIMAL(12,2) DEFAULT 0.00,
  vendor_declared_pieces INT,
  vendor_declared_meters DECIMAL(12,2),
  grey_fabric_returned_meters DECIMAL(10,2) DEFAULT 0.00,
  transport_details JSON,
  status VARCHAR(50) DEFAULT 'Received', -- Received, QC In Progress, QC Completed
  created_by VARCHAR(100) DEFAULT 'Saksham Garg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON UPDATE CASCADE
);

-- 27. PROCESS RETURN PIECES (Piece-Wise Meterage Breakdown)
CREATE TABLE IF NOT EXISTS process_return_pieces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_id VARCHAR(30) NOT NULL,
  piece_no INT NOT NULL,
  meters DECIMAL(10,2) NOT NULL,
  color_name VARCHAR(100),
  folding VARCHAR(50) DEFAULT 'Fold 100',
  qc_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Accepted, Rejected - Reprocess, Rejected - Scrap
  FOREIGN KEY (return_id) REFERENCES process_returns(id) ON DELETE CASCADE
);

-- 28. OPEN BALES (Unprocessed Grey Fabric Returns)
CREATE TABLE IF NOT EXISTS open_bales (
  id VARCHAR(30) PRIMARY KEY, -- e.g. OB-0001
  return_id VARCHAR(30) NOT NULL,
  fabric_id VARCHAR(30),
  fabric_name VARCHAR(150) NOT NULL,
  original_vendor_invoice_ref VARCHAR(100) NOT NULL,
  returned_meters DECIMAL(10,2) NOT NULL,
  remaining_meters DECIMAL(10,2) NOT NULL,
  audit_trail JSON,
  status VARCHAR(50) DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES process_returns(id) ON DELETE CASCADE
);

-- 29. PROCESS QC RECORDS (Quality Control & Lot Splitting)
CREATE TABLE IF NOT EXISTS process_qc_records (
  id VARCHAR(30) PRIMARY KEY, -- e.g. PQC-0001
  return_id VARCHAR(30) NOT NULL,
  piece_id INT NOT NULL,
  piece_no INT NOT NULL,
  original_length DECIMAL(10,2) NOT NULL,
  qc_outcome VARCHAR(50) NOT NULL, -- Accepted, Full Rejection
  rejection_action VARCHAR(50), -- Reprocess, Scrap
  reprocessing_challan_id VARCHAR(30),
  reprocessing_loop_status VARCHAR(50) DEFAULT 'Cleared', -- In Loop, Cleared
  division_type VARCHAR(50) DEFAULT 'None', -- None, Piece Division, Lot Division
  piece_splits JSON, -- [{ piece_suffix: "A", meters: 30.00 }, { piece_suffix: "B", meters: 33.10 }]
  lot_batch_id VARCHAR(50), -- Batch 1, Batch 2
  paper_qc_report_photo MEDIUMTEXT,
  adjusted_yield INT,
  color_fastness VARCHAR(20) DEFAULT 'Pass', -- Pass, Fail
  color_fastness_proof_photo MEDIUMTEXT,
  inspector_name VARCHAR(100) DEFAULT 'Priya Sharma',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES process_returns(id) ON DELETE CASCADE
);
