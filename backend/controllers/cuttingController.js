const { pool } = require('../config/db');

/**
 * Module 4: Cutting & Consumption Controller
 * Handles Cutting POs, Tally Rolls, Layers, Consumption Sheets, and Old Fabric Stock
 */

exports.getAllCuttingPOs = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM cutting_pos ORDER BY created_at DESC
    `);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching cutting POs:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveCuttingPO = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {
      id,
      poNumber,
      entryMode,
      selectedStyle,
      selectedColor,
      selectedLotId,
      fabricWidthInput,
      garmentsToCut,
      fabricToIssue,
      poStatus,
      poRemarks,
      payload
    } = req.body;

    const cuttingId = id || poNumber;

    await connection.query(`
      INSERT INTO cutting_pos (
        id, po_number, entry_mode, style_name, color_name, lot_id,
        fabric_width, garments_to_cut, fabric_to_issue, status, remarks, payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        entry_mode = VALUES(entry_mode),
        style_name = VALUES(style_name),
        color_name = VALUES(color_name),
        lot_id = VALUES(lot_id),
        fabric_width = VALUES(fabric_width),
        garments_to_cut = VALUES(garments_to_cut),
        fabric_to_issue = VALUES(fabric_to_issue),
        status = VALUES(status),
        remarks = VALUES(remarks),
        payload = VALUES(payload)
    `, [
      cuttingId,
      poNumber || cuttingId,
      entryMode || '',
      selectedStyle || '',
      selectedColor || '',
      selectedLotId || '',
      fabricWidthInput || '',
      parseInt(garmentsToCut, 10) || 0,
      parseFloat(fabricToIssue) || 0,
      poStatus || 'Draft',
      poRemarks || '',
      JSON.stringify(payload || req.body)
    ]);

    await connection.commit();
    connection.release();
    return res.status(200).json({ success: true, message: 'Cutting PO saved', id: cuttingId });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error saving cutting PO:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOldFabricStock = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM old_fabric_stock ORDER BY created_at DESC
    `);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching old fabric stock:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveOldFabricStock = async (req, res) => {
  try {
    const { id, date, poNumber, style, color, lotId, usableMeters, width } = req.body;
    await pool.query(`
      INSERT INTO old_fabric_stock (id, date, po_number, style_name, color_name, lot_id, usable_meters, width)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        usable_meters = VALUES(usable_meters),
        width = VALUES(width)
    `, [
      id,
      date || new Date().toISOString().slice(0, 10),
      poNumber || '',
      style || '',
      color || '',
      lotId || '',
      parseFloat(usableMeters) || 0,
      width || ''
    ]);
    return res.status(200).json({ success: true, message: 'Old fabric stock updated' });
  } catch (error) {
    console.error('Error saving old fabric stock:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
