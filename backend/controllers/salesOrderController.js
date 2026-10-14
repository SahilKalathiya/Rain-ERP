const db = require('../config/db');

// ==========================================
// SALES ORDER CRUD & SECTION-WISE HANDLERS
// ==========================================

// Get All Orders
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM sales_orders ORDER BY created_at DESC');
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Order Full Detail (for Universal View & Section Edit)
exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [orderRows] = await db.query('SELECT * FROM sales_orders WHERE id = ?', [id]);
    if (!orderRows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderRows[0];
    const [articles] = await db.query('SELECT * FROM order_articles WHERE order_id = ?', [id]);
    const [customers] = await db.query('SELECT * FROM order_customer_mappings WHERE order_id = ?', [id]);
    const [matrices] = await db.query('SELECT * FROM order_quantity_matrices WHERE order_id = ?', [id]);
    const [fabricConsumptions] = await db.query('SELECT * FROM order_fabric_consumptions WHERE order_id = ?', [id]);
    const [accessories] = await db.query('SELECT * FROM order_accessories_configs WHERE order_id = ?', [id]);

    res.json({
      success: true,
      data: {
        ...order,
        articles,
        customers,
        matrices,
        fabricConsumptions,
        accessories
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Complete Sales Order
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      id,
      style_name,
      order_date,
      expected_delivery,
      priority = 'Normal',
      size_series_id,
      articles = [],
      customers = [],
      matrices = [],
      fabricConsumptions = [],
      accessories = [],
      total_garments = 0,
      total_fabric_greige = 0,
      total_fabric_dyed = 0,
      estimated_cost = 0,
      created_by = 'Admin'
    } = req.body;

    const orderId = id || `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;

    // 1. Insert Header
    await connection.query(
      `INSERT INTO sales_orders 
       (id, style_name, order_date, expected_delivery, priority, size_series_id, status, stage, total_garments, total_fabric_greige, total_fabric_dyed, estimated_cost, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', 'Order Created', ?, ?, ?, ?, ?)`,
      [orderId, style_name, order_date, expected_delivery, priority, size_series_id, total_garments, total_fabric_greige, total_fabric_dyed, estimated_cost, created_by]
    );

    // 2. Insert Articles
    for (const art of articles) {
      await connection.query(
        `INSERT INTO order_articles (order_id, article_id, article_name, avg_garment_length, number_of_fabric_pieces, fabrics)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, art.article_id || art.id, art.article_name || art.name, art.avg_garment_length || 0, art.number_of_fabric_pieces || 1, JSON.stringify(art.fabrics || [])]
      );
    }

    // 3. Insert Customers
    for (const cust of customers) {
      await connection.query(
        `INSERT INTO order_customer_mappings (order_id, customer_id, customer_name, assigned_articles)
         VALUES (?, ?, ?, ?)`,
        [orderId, cust.customer_id || cust.id, cust.customer_name || cust.name, JSON.stringify(cust.assigned_articles || [])]
      );
    }

    // 4. Insert Quantity Matrices
    for (const mat of matrices) {
      await connection.query(
        `INSERT INTO order_quantity_matrices (order_id, group_name, is_uniform, ratio_used, ratio_string, base_quantity, quantities_by_combination)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, mat.group_name || 'All Articles', mat.is_uniform !== false, mat.ratio_used || false, mat.ratio_string, mat.base_quantity, JSON.stringify(mat.quantities_by_combination || [])]
      );
    }

    // 5. Insert Fabric Consumptions
    for (const fc of fabricConsumptions) {
      await connection.query(
        `INSERT INTO order_fabric_consumptions 
         (order_id, article_name, fabric_id, fabric_name, color_name, width, consumption_per_garment, total_pieces, shrinkage_percent, buffer_percent, total_greige, total_dyed, fabric_rate, dyed_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          fc.article_name,
          fc.fabric_id,
          fc.fabric_name,
          fc.color_name,
          fc.width,
          fc.consumption_per_garment,
          fc.total_pieces || 0,
          fc.shrinkage_percent || 0,
          fc.buffer_percent || 0,
          fc.total_greige || 0,
          fc.total_dyed || 0,
          fc.fabric_rate || 0,
          fc.dyed_rate || 0
        ]
      );
    }

    // 6. Insert Accessories Config
    for (const acc of accessories) {
      await connection.query(
        `INSERT INTO order_accessories_configs (order_id, category, variety_name, unit, applies_to_articles, configs)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, acc.category, acc.variety_name || acc.name, acc.unit || 'Piece', JSON.stringify(acc.applies_to_articles || []), JSON.stringify(acc.configs || [])]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, orderId, message: 'Sales Order created successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Section-Wise Independent Update (Universal View Edit Pattern)
exports.updateOrderSection = async (req, res) => {
  const { id, section } = req.params;
  const payload = req.body;

  try {
    if (section === 'header') {
      await db.query(
        `UPDATE sales_orders SET style_name=?, order_date=?, expected_delivery=?, priority=?, size_series_id=? WHERE id=?`,
        [payload.style_name, payload.order_date, payload.expected_delivery, payload.priority, payload.size_series_id, id]
      );
    } else if (section === 'fabric_consumption') {
      await db.query('DELETE FROM order_fabric_consumptions WHERE order_id = ?', [id]);
      for (const fc of payload.fabricConsumptions || []) {
        await db.query(
          `INSERT INTO order_fabric_consumptions 
           (order_id, article_name, fabric_id, fabric_name, color_name, width, consumption_per_garment, total_pieces, shrinkage_percent, buffer_percent, total_greige, total_dyed, fabric_rate, dyed_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, fc.article_name, fc.fabric_id, fc.fabric_name, fc.color_name, fc.width, fc.consumption_per_garment, fc.total_pieces || 0, fc.shrinkage_percent || 0, fc.buffer_percent || 0, fc.total_greige || 0, fc.total_dyed || 0, fc.fabric_rate || 0, fc.dyed_rate || 0]
        );
      }
    } else if (section === 'accessories') {
      await db.query('DELETE FROM order_accessories_configs WHERE order_id = ?', [id]);
      for (const acc of payload.accessories || []) {
        await db.query(
          `INSERT INTO order_accessories_configs (order_id, category, variety_name, unit, applies_to_articles, configs)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, acc.category, acc.variety_name, acc.unit, JSON.stringify(acc.applies_to_articles || []), JSON.stringify(acc.configs || [])]
        );
      }
    }

    res.json({ success: true, message: `Section '${section}' updated successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
