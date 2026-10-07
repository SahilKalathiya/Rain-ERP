const { pool } = require('../config/db');

// ==========================================
// 1. MASTERS: Vendors, Fabrics, Transporters
// ==========================================

const saveVendor = async (req, res) => {
  try {
    const v = req.body;
    const [existing] = await pool.query('SELECT id FROM vendors WHERE id = ?', [v.id]);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE vendors SET name=?, type=?, contact_person=?, phone=?, alternate_phone=?, email=?, address=?, city=?, state=?, gstin=?, rating=?, active=? WHERE id=?',
        [v.name, v.type, v.contactPerson || '', v.phone, v.alternatePhone, v.email, v.address, v.city, v.state, v.gstin, v.rating, v.active ? 1 : 0, v.id]
      );
    } else {
      await pool.query(
        'INSERT INTO vendors (id, name, type, contact_person, phone, alternate_phone, email, address, city, state, gstin, rating, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [v.id, v.name, v.type, v.contactPerson || '', v.phone, v.alternatePhone, v.email, v.address, v.city, v.state, v.gstin, v.rating || 5, v.active ? 1 : 0]
      );
    }
    res.json({ success: true, message: 'Vendor saved successfully', data: v });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFabrics = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM fabrics ORDER BY created_at DESC');
    const formatted = rows.map((r) => ({
      id: r.id,
      qualityName: r.quality_name || '',
      fabricType: r.fabric_type || 'Cotton',
      gsm: r.gsm || '',
      warpCount: r.warp_count || '',
      weftCount: r.weft_count || '',
      reed: r.reed || '',
      pick: r.pick || '',
      construction: r.construction || '',
      widths: typeof r.widths === 'string' ? JSON.parse(r.widths) : (r.widths || ['44', '58']),
      defaultFold: r.default_fold || 97,
      defaultShrinkage: r.default_shrinkage || 3.5,
      defaultRate: r.default_rate || 25,
      hsnCode: r.hsn_code || '520811',
      description: r.description || '',
      active: Boolean(r.active)
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getVendors = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vendors ORDER BY created_at DESC');
    const formatted = rows.map((v) => ({
      id: v.id,
      name: v.name,
      type: v.type,
      contactPerson: v.contact_person || '',
      phone: v.phone || '',
      alternatePhone: v.alternate_phone || '',
      email: v.email || '',
      address: v.address || '',
      city: v.city || 'Surat',
      state: v.state || 'Gujarat',
      gstin: v.gstin || '',
      rating: v.rating || 5,
      bankName: v.bank_name || '',
      accountNumber: v.account_number || '',
      ifscCode: v.ifsc_code || '',
      active: Boolean(v.active)
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTransporters = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transporters ORDER BY created_at DESC');
    const formatted = rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone || '',
      email: r.email || '',
      contactPerson: r.contact_person || '',
      address: r.address || '',
      city: r.city || 'Surat',
      state: r.state || 'Gujarat',
      gstin: r.gstin || '',
      vehicleTypes: typeof r.vehicle_types === 'string' ? JSON.parse(r.vehicle_types) : (r.vehicle_types || []),
      active: Boolean(r.active)
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getColors = async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS colors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        hex VARCHAR(20) NOT NULL,
        pantone VARCHAR(50),
        category VARCHAR(50) DEFAULT 'General',
        tag VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const [rows] = await pool.query('SELECT * FROM colors ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const saveColor = async (req, res) => {
  try {
    const c = req.body;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS colors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        hex VARCHAR(20) NOT NULL,
        pantone VARCHAR(50),
        category VARCHAR(50) DEFAULT 'General',
        tag VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const [existing] = await pool.query('SELECT id FROM colors WHERE id = ?', [c.id]);
    if (existing.length > 0) {
      await pool.query(
        'UPDATE colors SET name=?, hex=?, pantone=?, category=?, tag=? WHERE id=?',
        [c.name, c.hex, c.pantone || '', c.category || 'General', c.tag || '', c.id]
      );
    } else {
      await pool.query(
        'INSERT INTO colors (id, name, hex, pantone, category, tag) VALUES (?, ?, ?, ?, ?, ?)',
        [c.id, c.name, c.hex, c.pantone || '', c.category || 'General', c.tag || '']
      );
    }
    res.json({ success: true, message: 'Color saved successfully', data: c });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteColor = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM colors WHERE id = ?', [id]);
    res.json({ success: true, message: 'Color deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ==========================================
// 2. PURCHASE ORDERS (PO)
// ==========================================

const getPurchaseOrders = async (req, res) => {
  try {
    const [pos] = await pool.query('SELECT * FROM purchase_orders ORDER BY date DESC, created_at DESC');
    const [items] = await pool.query('SELECT * FROM purchase_order_items');

    const result = pos.map((po) => {
      const poItems = items
        .filter((it) => it.po_id === po.id)
        .map((it) => ({
          id: it.id,
          fabricId: it.fabric_id,
          fabricName: it.fabric_name,
          colorName: it.color_name,
          width: it.width,
          quantity: it.quantity,
          rate: it.rate,
          fold: it.fold,
          amount: it.amount
        }));

      return {
        id: po.id,
        date: po.date,
        vendorId: po.vendor_id,
        vendorName: po.vendor_name,
        expectedDeliveryDate: po.expected_delivery_date,
        bufferAllowed: Boolean(po.buffer_allowed),
        bufferPercent: po.buffer_percent,
        terms: po.terms,
        totalAmount: po.total_amount,
        status: po.status,
        items: poItems
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const savePurchaseOrder = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const po = req.body;

    const [existing] = await conn.query('SELECT id FROM purchase_orders WHERE id = ?', [po.id]);

    const expDate = po.expectedDeliveryDate ? po.expectedDeliveryDate : null;
    const poDate = po.date ? po.date : new Date().toISOString().split('T')[0];
    const terms = po.discountTerms || po.terms || '';

    if (existing.length > 0) {
      await conn.query(
        'UPDATE purchase_orders SET date=?, vendor_id=?, vendor_name=?, expected_delivery_date=?, buffer_allowed=?, buffer_percent=?, terms=?, total_amount=?, status=? WHERE id=?',
        [poDate, po.vendorId, po.vendorName, expDate, po.bufferAllowed ? 1 : 0, po.bufferPercent || 0, terms, po.totalAmount, po.status, po.id]
      );
      await conn.query('DELETE FROM purchase_order_items WHERE po_id = ?', [po.id]);
    } else {
      await conn.query(
        'INSERT INTO purchase_orders (id, date, vendor_id, vendor_name, expected_delivery_date, buffer_allowed, buffer_percent, terms, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [po.id, poDate, po.vendorId, po.vendorName, expDate, po.bufferAllowed ? 1 : 0, po.bufferPercent || 0, terms, po.totalAmount, po.status || 'Sent']
      );
    }

    if (po.items && po.items.length > 0) {
      for (const item of po.items) {
        await conn.query(
          'INSERT INTO purchase_order_items (po_id, fabric_id, fabric_name, color_name, width, quantity, rate, fold, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [po.id, item.fabricId, item.fabricName, item.colorName || '', item.width || '44', item.quantity, item.rate, item.fold || 97, item.amount]
        );
      }
    }

    await conn.commit();
    res.json({ success: true, message: 'Purchase Order saved successfully', data: po });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// ==========================================
// 3. GOODS RECEIPT NOTES (GRN)
// ==========================================

const getGRNs = async (req, res) => {
  try {
    const [grns] = await pool.query('SELECT * FROM goods_receipt_notes ORDER BY date DESC, created_at DESC');
    const [bales] = await pool.query('SELECT * FROM grn_bales');
    const [pieces] = await pool.query('SELECT * FROM grn_pieces');

    const result = grns.map((g) => {
      const gBales = bales
        .filter((b) => b.grn_id === g.id)
        .map((b) => {
          const bPieces = pieces
            .filter((p) => p.bale_id === b.id)
            .map((p) => ({
              pieceNo: p.piece_no,
              fabric: p.fabric_name,
              length: p.length,
              remarks: p.remarks
            }));
          return {
            baleNo: b.bale_no,
            piecesCount: b.pieces_count,
            totalLength: b.total_length,
            pieces: bPieces
          };
        });

      return {
        id: g.id,
        date: g.date,
        vendorId: g.vendor_id,
        vendorName: g.vendor_name,
        transporterId: g.transporter_id,
        transporterName: g.transporter_name,
        vendorInvoiceNo: g.vendor_invoice_no,
        vendorInvoiceDate: g.vendor_invoice_date,
        vendorChallanNo: g.vendor_challan_no,
        vendorChallanDate: g.vendor_challan_date,
        totalBales: g.total_bales,
        declaredTotalMeters: g.declared_total_meters,
        totalMetersEntered: g.total_meters_entered,
        status: g.status,
        adminApprovalNeeded: Boolean(g.admin_approval_needed),
        adminJustification: g.admin_justification,
        linkedPOs: typeof g.linked_pos === 'string' ? JSON.parse(g.linked_pos) : g.linked_pos,
        bales: gBales
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 4. QUALITY CHECKS (QC)
// ==========================================

const getQualityChecks = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quality_checks ORDER BY created_at DESC');
    const formatted = rows.map((r) => ({
      id: r.id,
      grnRef: r.grn_ref,
      inspectionScope: r.inspection_scope,
      baleRef: r.bale_ref,
      pieceRef: r.piece_ref,
      inspectorName: r.inspector_name,
      expectedWidth: r.expected_width,
      actualWidth: r.actual_width,
      expectedFold: r.expected_fold,
      actualFold: r.actual_fold,
      photos: typeof r.photos === 'string' ? JSON.parse(r.photos) : r.photos || [],
      notes: r.notes,
      qcStatus: r.qc_status,
      adminDecision: r.admin_decision,
      adminRemarks: r.admin_remarks,
      dateTime: r.date_time
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 5. REJECTED STOCK POOL
// ==========================================

const saveFabric = async (req, res) => {
  try {
    const f = req.body;
    const [existing] = await pool.query('SELECT id FROM fabrics WHERE id = ?', [f.id]);
    const widthsJson = JSON.stringify(f.widths || ['44']);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE fabrics SET quality_name=?, fabric_type=?, warp_count=?, weft_count=?, reed=?, pick=?, construction=?, widths=?, default_fold=?, default_rate=?, active=? WHERE id=?',
        [f.qualityName, f.fabricType, f.warpCount, f.weftCount, f.reed, f.pick, f.construction, widthsJson, f.defaultFold || 97, f.defaultRate || 0, f.active ? 1 : 0, f.id]
      );
    } else {
      await pool.query(
        'INSERT INTO fabrics (id, quality_name, fabric_type, warp_count, weft_count, reed, pick, construction, widths, default_fold, default_rate, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [f.id, f.qualityName, f.fabricType, f.warpCount, f.weftCount, f.reed, f.pick, f.construction, widthsJson, f.defaultFold || 97, f.defaultRate || 0, f.active ? 1 : 0]
      );
    }
    res.json({ success: true, message: 'Fabric saved successfully', data: f });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const saveTransporter = async (req, res) => {
  try {
    const t = req.body;
    const [existing] = await pool.query('SELECT id FROM transporters WHERE id = ?', [t.id]);
    const vehiclesJson = JSON.stringify(t.vehicleTypes || []);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE transporters SET name=?, contact_person=?, phone=?, email=?, address=?, city=?, state=?, gstin=?, vehicle_types=?, active=? WHERE id=?',
        [t.name, t.contactPerson, t.phone, t.email, t.address, t.city, t.state, t.gstin, vehiclesJson, t.active ? 1 : 0, t.id]
      );
    } else {
      await pool.query(
        'INSERT INTO transporters (id, name, contact_person, phone, email, address, city, state, gstin, vehicle_types, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.name, t.contactPerson, t.phone, t.email, t.address, t.city, t.state, t.gstin, vehiclesJson, t.active ? 1 : 0]
      );
    }
    res.json({ success: true, message: 'Transporter saved successfully', data: t });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const saveGRN = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const g = req.body;
    const [existing] = await conn.query('SELECT id FROM goods_receipt_notes WHERE id = ?', [g.id]);
    const linkedPosJson = JSON.stringify(g.linkedPOs || []);

    if (existing.length > 0) {
      await conn.query(
        'UPDATE goods_receipt_notes SET date=?, vendor_id=?, vendor_name=?, transporter_id=?, transporter_name=?, vendor_invoice_no=?, vendor_invoice_date=?, vendor_challan_no=?, vendor_challan_date=?, total_bales=?, declared_total_meters=?, total_meters_entered=?, status=?, admin_approval_needed=?, admin_justification=?, linked_pos=? WHERE id=?',
        [g.date, g.vendorId, g.vendorName, g.transporterId, g.transporterName, g.vendorInvoiceNo, g.vendorInvoiceDate, g.vendorChallanNo, g.vendorChallanDate, g.totalBales, g.declaredTotalMeters, g.totalMetersEntered || 0, g.status, g.adminApprovalNeeded ? 1 : 0, g.adminJustification || '', linkedPosJson, g.id]
      );
      await conn.query('DELETE FROM grn_pieces WHERE grn_id = ?', [g.id]);
      await conn.query('DELETE FROM grn_bales WHERE grn_id = ?', [g.id]);
    } else {
      await conn.query(
        'INSERT INTO goods_receipt_notes (id, date, vendor_id, vendor_name, transporter_id, transporter_name, vendor_invoice_no, vendor_invoice_date, vendor_challan_no, vendor_challan_date, total_bales, declared_total_meters, total_meters_entered, status, admin_approval_needed, admin_justification, linked_pos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [g.id, g.date, g.vendorId, g.vendorName, g.transporterId, g.transporterName, g.vendorInvoiceNo, g.vendorInvoiceDate, g.vendorChallanNo, g.vendorChallanDate, g.totalBales, g.declaredTotalMeters, g.totalMetersEntered || 0, g.status || 'Completed', g.adminApprovalNeeded ? 1 : 0, g.adminJustification || '', linkedPosJson]
      );
    }

    if (g.bales && g.bales.length > 0) {
      for (const bale of g.bales) {
        const [baleRes] = await conn.query(
          'INSERT INTO grn_bales (grn_id, bale_no, pieces_count, total_length) VALUES (?, ?, ?, ?)',
          [g.id, bale.baleNo, bale.piecesCount, bale.totalLength]
        );
        const baleId = baleRes.insertId;

        if (bale.pieces && bale.pieces.length > 0) {
          for (const piece of bale.pieces) {
            await conn.query(
              'INSERT INTO grn_pieces (bale_id, grn_id, piece_no, fabric_name, length, remarks) VALUES (?, ?, ?, ?, ?, ?)',
              [baleId, g.id, piece.pieceNo, piece.fabric, piece.length, piece.remarks || '']
            );
          }
        }
      }
    }

    await conn.commit();
    res.json({ success: true, message: 'GRN saved successfully', data: g });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

const saveQualityCheck = async (req, res) => {
  try {
    const q = req.body;
    const [existing] = await pool.query('SELECT id FROM quality_checks WHERE id = ?', [q.id]);
    const photosJson = JSON.stringify(q.photos || []);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE quality_checks SET grn_ref=?, inspection_scope=?, bale_ref=?, piece_ref=?, inspector_name=?, expected_width=?, actual_width=?, expected_fold=?, actual_fold=?, photos=?, notes=?, qc_status=?, admin_decision=?, admin_remarks=?, date_time=? WHERE id=?',
        [q.grnRef, q.inspectionScope, q.baleRef || '', q.pieceRef || '', q.inspectorName, q.expectedWidth, q.actualWidth, q.expectedFold, q.actualFold, photosJson, q.notes, q.qcStatus, q.adminDecision || '', q.adminRemarks || '', q.dateTime, q.id]
      );
    } else {
      await pool.query(
        'INSERT INTO quality_checks (id, grn_ref, inspection_scope, bale_ref, piece_ref, inspector_name, expected_width, actual_width, expected_fold, actual_fold, photos, notes, qc_status, admin_decision, admin_remarks, date_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [q.id, q.grnRef, q.inspectionScope, q.baleRef || '', q.pieceRef || '', q.inspectorName, q.expectedWidth, q.actualWidth, q.expectedFold, q.actualFold, photosJson, q.notes, q.qcStatus, q.adminDecision || '', q.adminRemarks || '', q.dateTime]
      );
    }
    res.json({ success: true, message: 'Quality Check saved successfully', data: q });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRejectedStock = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rejected_stock_pool ORDER BY created_at DESC');
    const formatted = rows.map((r) => ({
      id: r.id,
      sourceQcRef: r.source_qc_ref,
      grnRef: r.grn_ref,
      poRef: r.po_ref,
      vendorName: r.vendor_name,
      baleRef: r.bale_ref,
      pieceRef: r.piece_ref,
      fabricName: r.fabric_name,
      quantity: r.quantity,
      reason: r.reason,
      dateFlagged: r.date_flagged,
      status: r.status,
      actionDetails: typeof r.action_details === 'string' ? JSON.parse(r.action_details) : r.action_details
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const saveRejectedStock = async (req, res) => {
  try {
    const r = req.body;
    const [existing] = await pool.query('SELECT id FROM rejected_stock_pool WHERE id = ?', [r.id]);
    const actionDetailsJson = JSON.stringify(r.actionDetails || null);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE rejected_stock_pool SET source_qc_ref=?, grn_ref=?, po_ref=?, vendor_name=?, bale_ref=?, piece_ref=?, fabric_name=?, quantity=?, reason=?, date_flagged=?, status=?, action_details=? WHERE id=?',
        [r.sourceQcRef || r.qcId || '', r.grnRef || r.grnId || '', r.poRef || r.poId || '', r.vendorName || '', r.baleRef || '', r.pieceRef || '', r.fabricName || r.fabricQuality || '', r.quantity || r.rejectedMeters || 0, r.reason || '', r.dateFlagged || '', r.status || 'In Pool', actionDetailsJson, r.id]
      );
    } else {
      await pool.query(
        'INSERT INTO rejected_stock_pool (id, source_qc_ref, grn_ref, po_ref, vendor_name, bale_ref, piece_ref, fabric_name, quantity, reason, date_flagged, status, action_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.sourceQcRef || r.qcId || '', r.grnRef || r.grnId || '', r.poRef || r.poId || '', r.vendorName || '', r.baleRef || '', r.pieceRef || '', r.fabricName || r.fabricQuality || '', r.quantity || r.rejectedMeters || 0, r.reason || '', r.dateFlagged || '', r.status || 'In Pool', actionDetailsJson]
      );
    }
    res.json({ success: true, message: 'Rejected stock item saved successfully', data: r });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    const formatted = rows.map((r) => ({
      id: r.id,
      dateTime: r.date_time,
      user: r.user,
      role: r.role,
      action: r.action,
      module: r.module,
      recordNo: r.record_no,
      field: r.field,
      previousValue: r.previous_value,
      updatedValue: r.updated_value,
      remarks: r.remarks
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const saveAuditLog = async (req, res) => {
  try {
    const log = req.body;
    await pool.query(
      'INSERT INTO audit_logs (id, date_time, user, role, action, module, record_no, field, previous_value, updated_value, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [log.id, log.dateTime, log.user, log.role, log.action, log.module, log.recordNo, log.field, log.previousValue, log.updatedValue, log.remarks || '']
    );
    res.json({ success: true, message: 'Audit log recorded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getVendors,
  saveVendor,
  getFabrics,
  saveFabric,
  getTransporters,
  saveTransporter,
  getColors,
  saveColor,
  deleteColor,
  getPurchaseOrders,
  savePurchaseOrder,
  getGRNs,
  saveGRN,
  getQualityChecks,
  saveQualityCheck,
  getRejectedStock,
  saveRejectedStock,
  getAuditLogs,
  saveAuditLog
};
