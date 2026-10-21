const { pool } = require('../config/db');

/**
 * Module 3: Process PO & Job Work Controller
 * Handles Process POs, Process Challans, Returns, Open Bales, and QC & Lot Division
 */

// 1. Process POs
exports.getAllProcessPOs = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, 
        (SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'id', i.id, 'style_name', i.style_name, 'fabric_name', i.fabric_name,
          'color_name', i.color_name, 'article_name', i.article_name, 'width', i.width,
          'quantity_meters', i.quantity_meters, 'quantity_pieces', i.quantity_pieces,
          'fabric_rate', i.fabric_rate, 'dyeing_rate', i.dyeing_rate, 'total_amount', i.total_amount,
          'dispatched_meters', i.dispatched_meters, 'received_meters', i.received_meters, 'status', i.status
        )) FROM process_po_items i WHERE i.process_po_id = p.id) as items
      FROM process_pos p
      ORDER BY p.date DESC, p.created_at DESC
    `);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching process POs:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProcessPO = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      po_number,
      date,
      issue_date,
      vendor_id,
      vendor_name,
      linked_sales_order_id,
      style_names,
      number_of_styles,
      customer_brand_name,
      delivery_date,
      terms,
      total_meters,
      total_pieces,
      total_estimated_cost,
      created_by,
      items
    } = req.body;

    const ppoId = `PPO-${po_number || Date.now().toString().slice(-4)}`;

    await connection.query(`
      INSERT INTO process_pos (
        id, po_number, date, issue_date, vendor_id, vendor_name,
        linked_sales_order_id, style_names, number_of_styles, customer_brand_name,
        delivery_date, terms, total_meters, total_pieces, total_estimated_cost,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)
    `, [
      ppoId, po_number || ppoId, date, issue_date || date, vendor_id, vendor_name,
      linked_sales_order_id || null, JSON.stringify(style_names || []), number_of_styles || 1, customer_brand_name || '',
      delivery_date || null, terms || '', total_meters || 0, total_pieces || 0, total_estimated_cost || 0,
      created_by || 'Saksham Garg'
    ]);

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await connection.query(`
          INSERT INTO process_po_items (
            process_po_id, style_name, fabric_id, fabric_name, color_id, color_name,
            article_id, article_name, width, quantity_meters, quantity_pieces,
            consumption_per_piece, shrinkage_percent, raw_fabric_meters, fabric_rate,
            dyeing_rate, total_actual_cost, total_amount, remarks, sample_photo, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          ppoId, item.style_name || '', item.fabric_id || 'FAB-001', item.fabric_name,
          item.color_id || null, item.color_name, item.article_id || null, item.article_name || 'Kurta',
          item.width || '44', item.quantity_meters || 0, item.quantity_pieces || 0,
          item.consumption_per_piece || 2.60, item.shrinkage_percent || 4.00, item.raw_fabric_meters || item.quantity_meters || 0,
          item.fabric_rate || 0, item.dyeing_rate || 0, (Number(item.fabric_rate || 0) + Number(item.dyeing_rate || 0)),
          item.total_amount || 0, item.remarks || '', item.sample_photo || null, item.status || 'Not Ordered'
        ]);
      }
    }

    // Add Audit Log
    await connection.query(`
      INSERT INTO audit_logs (action, module, record_no, field, remarks, user)
      VALUES ('Create', 'Process PO', ?, 'New PO Created', ?, ?)
    `, [ppoId, `Created Process PO #${po_number || ppoId} for vendor ${vendor_name}`, created_by || 'Saksham Garg']);

    await connection.commit();
    connection.release();
    return res.status(201).json({ success: true, message: 'Process PO created successfully', id: ppoId });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error creating process PO:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Process Challans
exports.getAllChallans = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'id', ci.id, 'bale_roll_no', ci.bale_roll_no, 'fabric_name', ci.fabric_name,
          'color_name', ci.color_name, 'invoice_no', ci.invoice_no, 'original_piece_meters', ci.original_piece_meters,
          'dispatched_meters', ci.dispatched_meters, 'is_partial_cut', ci.is_partial_cut, 'folding', ci.folding
        )) FROM process_challan_items ci WHERE ci.challan_id = c.id) as items
      FROM process_challans c
      ORDER BY c.date DESC, c.created_at DESC
    `);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching process challans:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createChallan = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      challan_number,
      date,
      vendor_id,
      vendor_name,
      linked_pos,
      styles_info,
      po_link_status,
      folding_notation,
      total_bales,
      total_pieces,
      grand_total_meters,
      remarks,
      company_representative,
      created_by,
      items
    } = req.body;

    const pchId = `PCH-${challan_number || Date.now().toString().slice(-4)}`;
    const isEmergency = !linked_pos || linked_pos.length === 0;

    await connection.query(`
      INSERT INTO process_challans (
        id, challan_number, date, vendor_id, vendor_name, linked_pos, styles_info,
        po_link_status, admin_alert_triggered, folding_notation, total_bales,
        total_pieces, grand_total_meters, remarks, company_representative, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dispatched', ?)
    `, [
      pchId, challan_number || pchId, date, vendor_id, vendor_name,
      JSON.stringify(linked_pos || []), JSON.stringify(styles_info || []),
      isEmergency ? 'Pending PO Link' : 'Linked', isEmergency,
      folding_notation || 'L100', total_bales || 1, total_pieces || 1,
      grand_total_meters || 0, remarks || '', company_representative || 'Anurag',
      created_by || 'Saksham Garg'
    ]);

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await connection.query(`
          INSERT INTO process_challan_items (
            challan_id, po_id, fabric_name, color_name, invoice_no, bale_roll_no,
            is_partial_cut, original_piece_meters, dispatched_meters, folding, remarks
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          pchId, item.po_id || null, item.fabric_name, item.color_name, item.invoice_no || '',
          item.bale_roll_no, item.is_partial_cut || false, item.original_piece_meters || item.dispatched_meters,
          item.dispatched_meters, item.folding || 'L100', item.remarks || ''
        ]);
      }
    }

    await connection.commit();
    connection.release();
    return res.status(201).json({ success: true, message: 'Challan created successfully', id: pchId });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error creating process challan:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Process Returns / GRN
exports.getAllReturns = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'id', p.id, 'piece_no', p.piece_no, 'meters', p.meters,
          'color_name', p.color_name, 'folding', p.folding, 'qc_status', p.qc_status
        )) FROM process_return_pieces p WHERE p.return_id = r.id) as pieces
      FROM process_returns r
      ORDER BY r.received_date DESC, r.created_at DESC
    `);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching process returns:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Open Bales
exports.getOpenBales = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM open_bales ORDER BY created_at DESC
    `);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching open bales:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. QC Records
exports.getQCRecords = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM process_qc_records ORDER BY created_at DESC
    `);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching QC records:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
