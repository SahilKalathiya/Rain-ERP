const db = require('../config/db');

// ==========================================
// 1. CUSTOMER MASTER CONTROLLERS
// ==========================================
exports.getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { id, name, type, phone, email, address, city, state, gstin, notes, active = true } = req.body;
    const customerId = id || `CUST-${Date.now().toString().slice(-4)}`;
    
    await db.query(
      `INSERT INTO customers (id, name, type, phone, email, address, city, state, gstin, notes, active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerId, name, type, phone, email, address, city || 'Surat', state || 'Gujarat', gstin, notes, active]
    );

    const [created] = await db.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, phone, email, address, city, state, gstin, notes, active } = req.body;
    
    await db.query(
      `UPDATE customers SET name=?, type=?, phone=?, email=?, address=?, city=?, state=?, gstin=?, notes=?, active=? WHERE id=?`,
      [name, type, phone, email, address, city, state, gstin, notes, active, id]
    );

    const [updated] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE customers SET active = FALSE WHERE id = ?', [id]);
    res.json({ success: true, message: 'Customer deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. COLOR MASTER CONTROLLERS (Quarter & Trending)
// ==========================================
exports.getColors = async (req, res) => {
  try {
    const { quarter, trending_only } = req.query;
    let sql = 'SELECT * FROM colors WHERE active = TRUE';
    const params = [];

    if (quarter && quarter !== 'All') {
      sql += ' AND (quarter_tag = ? OR quarter_tag = "All Season" OR quarter_tag = "ALL")';
      params.push(quarter);
    }

    sql += ' ORDER BY name ASC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createColor = async (req, res) => {
  try {
    const { id, name, hex_code, pantone_code, quarter_tag, is_trending = false, active = true } = req.body;
    const colorId = id || `COL-${Date.now().toString().slice(-4)}`;

    await db.query(
      `INSERT INTO colors (id, name, hex_code, pantone_code, quarter_tag, is_trending, active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [colorId, name, hex_code, pantone_code, quarter_tag, is_trending, active]
    );

    const [created] = await db.query('SELECT * FROM colors WHERE id = ?', [colorId]);
    res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. ARTICLE MASTER CONTROLLERS (Tiles & Sort Order)
// ==========================================
exports.getArticles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM articles WHERE active = TRUE ORDER BY sort_order ASC, name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const { id, name, icon = '👕', sort_order = 1, description, active = true } = req.body;
    const articleId = id || `ART-${Date.now().toString().slice(-4)}`;

    await db.query(
      `INSERT INTO articles (id, name, icon, sort_order, description, active) VALUES (?, ?, ?, ?, ?, ?)`,
      [articleId, name, icon, sort_order, description, active]
    );

    const [created] = await db.query('SELECT * FROM articles WHERE id = ?', [articleId]);
    res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. SIZE SERIES & SIZES CONTROLLERS
// ==========================================
exports.getSizeSeries = async (req, res) => {
  try {
    const [series] = await db.query('SELECT * FROM size_series WHERE active = TRUE ORDER BY display_order ASC');
    const [sizes] = await db.query('SELECT * FROM size_masters ORDER BY display_order ASC');

    const result = series.map((s) => ({
      ...s,
      sizes: sizes.filter((sz) => sz.series_id === s.id)
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSizeSeries = async (req, res) => {
  try {
    const { id, name, display_order = 1, sizes = [] } = req.body;
    const seriesId = id || `SER-${Date.now().toString().slice(-4)}`;

    await db.query('INSERT INTO size_series (id, name, display_order) VALUES (?, ?, ?)', [seriesId, name, display_order]);

    for (let i = 0; i < sizes.length; i++) {
      const sz = sizes[i];
      const szId = sz.id || `SIZ-${Date.now().toString().slice(-4)}-${i}`;
      await db.query(
        'INSERT INTO size_masters (id, series_id, size_name, display_name, display_order) VALUES (?, ?, ?, ?, ?)',
        [szId, seriesId, sz.size_name || sz, sz.display_name || sz, i + 1]
      );
    }

    res.status(201).json({ success: true, message: 'Size series created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. ACCESSORIES MASTER CONTROLLERS
// ==========================================
exports.getAccessories = async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM accessory_masters WHERE active = TRUE';
    const params = [];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY name ASC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAccessory = async (req, res) => {
  try {
    const { id, name, category, unit = 'Piece', pieces_per_unit = 1, max_buffer = 10, hsn_code, description, config = {} } = req.body;
    const accId = id || `ACC-${Date.now().toString().slice(-4)}`;

    await db.query(
      `INSERT INTO accessory_masters (id, name, category, unit, pieces_per_unit, max_buffer, hsn_code, description, config) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [accId, name, category, unit, pieces_per_unit, max_buffer, hsn_code, description, JSON.stringify(config)]
    );

    const [created] = await db.query('SELECT * FROM accessory_masters WHERE id = ?', [accId]);
    res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. THREAD SIZES & THREAD COLORS CONTROLLERS
// ==========================================
exports.getThreadSizes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM thread_sizes WHERE active = TRUE ORDER BY brand_name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getThreadColors = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM thread_color_codes WHERE active = TRUE ORDER BY brand_name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
