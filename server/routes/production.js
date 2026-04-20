/**
 * 生产管理模块 - 产品、BOM、工单 API
 * 无纺布管理系统
 * 
 * 使用方式:
 * const productionRouter = require('./routes/production.js');
 * productionRouter.setup(app, authenticateToken, pool);
 */

const { v4: uuidv4 } = require('uuid');

// 创建独立的数据库连接池（因为被require时可能还没有pool）
let pool = null;

function setup(app, authenticateToken, dbPool) {
  pool = dbPool;
  
  // ============================================
  // 产品管理 API
  // ============================================

  /**
   * 获取产品列表
   * GET /api/production/products
   */
  app.get('/api/production/products', authenticateToken, async (req, res) => {
    try {
      const { page = 1, pageSize = 20, is_active, keyword } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = '1=1';
      const params = [];
      
      if (is_active !== undefined) {
        whereClause += ' AND is_active = ?';
        params.push(is_active);
      }
      
      if (keyword) {
        whereClause += ' AND (product_name LIKE ? OR product_code LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM products WHERE ${whereClause}`,
        params
      );
      
      const [rows] = await pool.query(
        `SELECT * FROM products WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );
      
      res.json({
        list: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      });
    } catch (error) {
      console.error('获取产品列表失败:', error);
      res.status(500).json({ error: '获取产品列表失败' });
    }
  });

  /**
   * 获取产品详情
   * GET /api/production/products/:id
   */
  app.get('/api/production/products/:id', authenticateToken, async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM products WHERE id = ?',
        [req.params.id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: '产品不存在' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('获取产品详情失败:', error);
      res.status(500).json({ error: '获取产品详情失败' });
    }
  });

  /**
   * 创建产品
   * POST /api/production/products
   */
  app.post('/api/production/products', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        product_code,
        product_name,
        spec_gsm,
        spec_width,
        spec_color,
        spec_material = 'PP',
        unit = '卷',
        is_active = 1
      } = req.body;
      
      const [existing] = await connection.query(
        'SELECT id FROM products WHERE product_code = ?',
        [product_code]
      );
      
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: '产品编号已存在' });
      }
      
      const id = uuidv4();
      const now = new Date();
      
      await connection.query(
        `INSERT INTO products (id, product_code, product_name, spec_gsm, spec_width, spec_color, spec_material, unit, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, product_code, product_name, spec_gsm, spec_width, spec_color, spec_material, unit, is_active, now, now]
      );
      
      await connection.commit();
      
      const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
      res.status(201).json(newProduct[0]);
    } catch (error) {
      await connection.rollback();
      console.error('创建产品失败:', error);
      res.status(500).json({ error: '创建产品失败' });
    } finally {
      connection.release();
    }
  });

  /**
   * 更新产品
   * PUT /api/production/products/:id
   */
  app.put('/api/production/products/:id', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      const {
        product_code,
        product_name,
        spec_gsm,
        spec_width,
        spec_color,
        spec_material,
        unit,
        is_active
      } = req.body;
      
      const [existing] = await connection.query(
        'SELECT id FROM products WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: '产品不存在' });
      }
      
      if (product_code) {
        const [codeExists] = await connection.query(
          'SELECT id FROM products WHERE product_code = ? AND id != ?',
          [product_code, id]
        );
        if (codeExists.length > 0) {
          await connection.rollback();
          return res.status(400).json({ error: '产品编号已存在' });
        }
      }
      
      const updates = [];
      const params = [];
      
      if (product_code) { updates.push('product_code = ?'); params.push(product_code); }
      if (product_name) { updates.push('product_name = ?'); params.push(product_name); }
      if (spec_gsm !== undefined) { updates.push('spec_gsm = ?'); params.push(spec_gsm); }
      if (spec_width !== undefined) { updates.push('spec_width = ?'); params.push(spec_width); }
      if (spec_color !== undefined) { updates.push('spec_color = ?'); params.push(spec_color); }
      if (spec_material) { updates.push('spec_material = ?'); params.push(spec_material); }
      if (unit) { updates.push('unit = ?'); params.push(unit); }
      if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
      
      updates.push('updated_at = ?');
      params.push(new Date());
      params.push(id);
      
      if (updates.length > 1) {
        await connection.query(
          `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      }
      
      await connection.commit();
      
      const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
      res.json(updated[0]);
    } catch (error) {
      await connection.rollback();
      console.error('更新产品失败:', error);
      res.status(500).json({ error: '更新产品失败' });
    } finally {
      connection.release();
    }
  });

  /**
   * 删除产品
   * DELETE /api/production/products/:id
   */
  app.delete('/api/production/products/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [bomUsage] = await pool.query(
        'SELECT id FROM bom_headers WHERE product_id = ? LIMIT 1',
        [id]
      );
      
      if (bomUsage.length > 0) {
        return res.status(400).json({ error: '该产品已被BOM使用，无法删除' });
      }
      
      const [woUsage] = await pool.query(
        'SELECT id FROM work_orders WHERE product_id = ? AND status NOT IN ("completed", "cancelled") LIMIT 1',
        [id]
      );
      
      if (woUsage.length > 0) {
        return res.status(400).json({ error: '该产品有未完成的工单，无法删除' });
      }
      
      const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '产品不存在' });
      }
      
      res.json({ message: '删除成功' });
    } catch (error) {
      console.error('删除产品失败:', error);
      res.status(500).json({ error: '删除产品失败' });
    }
  });

  // ============================================
  // BOM 管理 API
  // ============================================

  /**
   * 获取BOM列表
   * GET /api/production/boms
   */
  app.get('/api/production/boms', authenticateToken, async (req, res) => {
    try {
      const { page = 1, pageSize = 20, product_id, status, keyword } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = '1=1';
      const params = [];
      
      if (product_id) {
        whereClause += ' AND b.product_id = ?';
        params.push(product_id);
      }
      
      if (status) {
        whereClause += ' AND b.status = ?';
        params.push(status);
      }
      
      if (keyword) {
        whereClause += ' AND (b.bom_code LIKE ? OR p.product_name LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM bom_headers b 
         LEFT JOIN products p ON b.product_id = p.id 
         WHERE ${whereClause}`,
        params
      );
      
      const [rows] = await pool.query(
        `SELECT b.*, p.product_name, p.product_code 
         FROM bom_headers b 
         LEFT JOIN products p ON b.product_id = p.id 
         WHERE ${whereClause} 
         ORDER BY b.created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );
      
      res.json({
        list: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      });
    } catch (error) {
      console.error('获取BOM列表失败:', error);
      res.status(500).json({ error: '获取BOM列表失败' });
    }
  });

  /**
   * 获取BOM详情
   * GET /api/production/boms/:id
   */
  app.get('/api/production/boms/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [headers] = await pool.query(
        `SELECT b.*, p.product_name, p.product_code 
         FROM bom_headers b 
         LEFT JOIN products p ON b.product_id = p.id 
         WHERE b.id = ?`,
        [id]
      );
      
      if (headers.length === 0) {
        return res.status(404).json({ error: 'BOM不存在' });
      }
      
      const [items] = await pool.query(
        'SELECT * FROM bom_items WHERE bom_id = ? ORDER BY material_order, created_at',
        [id]
      );
      
      res.json({
        ...headers[0],
        items
      });
    } catch (error) {
      console.error('获取BOM详情失败:', error);
      res.status(500).json({ error: '获取BOM详情失败' });
    }
  });

  /**
   * 创建BOM
   * POST /api/production/boms
   */
  app.post('/api/production/boms', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        bom_code,
        product_id,
        bom_version = 'v1.0',
        effective_date,
        total_loss_rate = 0,
        remarks,
        items = []
      } = req.body;
      
      const [product] = await connection.query(
        'SELECT id FROM products WHERE id = ?',
        [product_id]
      );
      if (product.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: '产品不存在' });
      }
      
      const [existing] = await connection.query(
        'SELECT id FROM bom_headers WHERE bom_code = ?',
        [bom_code]
      );
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'BOM编号已存在' });
      }
      
      const id = uuidv4();
      const now = new Date();
      const userId = req.user?.id || 'system';
      
      await connection.query(
        `INSERT INTO bom_headers (id, bom_code, product_id, bom_version, effective_date, status, total_loss_rate, remarks, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`,
        [id, bom_code, product_id, bom_version, effective_date, total_loss_rate, remarks, userId, now, now]
      );
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemId = uuidv4();
        await connection.query(
          `INSERT INTO bom_items (id, bom_id, material_model, quantity_per_unit, loss_rate, unit, material_order, remarks, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, id, item.material_model, item.quantity_per_unit, item.loss_rate || 0, item.unit || 'kg', i, item.remarks || '', now]
        );
      }
      
      await connection.commit();
      
      const [newBom] = await pool.query(
        `SELECT b.*, p.product_name, p.product_code 
         FROM bom_headers b 
         LEFT JOIN products p ON b.product_id = p.id 
         WHERE b.id = ?`,
        [id]
      );
      const [newItems] = await pool.query('SELECT * FROM bom_items WHERE bom_id = ?', [id]);
      
      res.status(201).json({
        ...newBom[0],
        items: newItems
      });
    } catch (error) {
      await connection.rollback();
      console.error('创建BOM失败:', error);
      res.status(500).json({ error: '创建BOM失败' });
    } finally {
      connection.release();
    }
  });

  /**
   * 更新BOM
   * PUT /api/production/boms/:id
   */
  app.put('/api/production/boms/:id', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      const {
        bom_version,
        effective_date,
        status,
        total_loss_rate,
        remarks,
        items
      } = req.body;
      
      const [existing] = await connection.query(
        'SELECT id, status FROM bom_headers WHERE id = ?',
        [id]
      );
      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'BOM不存在' });
      }
      
      const currentStatus = existing[0].status;
      if (status && status !== currentStatus) {
        if (currentStatus === 'active' && status === 'draft') {
          await connection.rollback();
          return res.status(400).json({ error: '已激活的BOM不能降为草稿' });
        }
      }
      
      const updates = [];
      const params = [];
      
      if (bom_version) { updates.push('bom_version = ?'); params.push(bom_version); }
      if (effective_date) { updates.push('effective_date = ?'); params.push(effective_date); }
      if (status) { updates.push('status = ?'); params.push(status); }
      if (total_loss_rate !== undefined) { updates.push('total_loss_rate = ?'); params.push(total_loss_rate); }
      if (remarks !== undefined) { updates.push('remarks = ?'); params.push(remarks); }
      
      updates.push('updated_at = ?');
      params.push(new Date());
      params.push(id);
      
      if (updates.length > 1) {
        await connection.query(
          `UPDATE bom_headers SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      }
      
      if (items && Array.isArray(items)) {
        await connection.query('DELETE FROM bom_items WHERE bom_id = ?', [id]);
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemId = uuidv4();
          await connection.query(
            `INSERT INTO bom_items (id, bom_id, material_model, quantity_per_unit, loss_rate, unit, material_order, remarks, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [itemId, id, item.material_model, item.quantity_per_unit, item.loss_rate || 0, item.unit || 'kg', i, item.remarks || '', new Date()]
          );
        }
      }
      
      await connection.commit();
      
      const [updatedBom] = await pool.query(
        `SELECT b.*, p.product_name, p.product_code 
         FROM bom_headers b 
         LEFT JOIN products p ON b.product_id = p.id 
         WHERE b.id = ?`,
        [id]
      );
      const [updatedItems] = await pool.query('SELECT * FROM bom_items WHERE bom_id = ? ORDER BY material_order', [id]);
      
      res.json({
        ...updatedBom[0],
        items: updatedItems
      });
    } catch (error) {
      await connection.rollback();
      console.error('更新BOM失败:', error);
      res.status(500).json({ error: '更新BOM失败' });
    } finally {
      connection.release();
    }
  });

  /**
   * 删除BOM
   * DELETE /api/production/boms/:id
   */
  app.delete('/api/production/boms/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [usage] = await pool.query(
        'SELECT id FROM work_orders WHERE bom_id = ? AND status NOT IN ("completed", "cancelled") LIMIT 1',
        [id]
      );
      
      if (usage.length > 0) {
        return res.status(400).json({ error: '该BOM有未完成的工单使用，无法删除' });
      }
      
      await pool.query('DELETE FROM bom_items WHERE bom_id = ?', [id]);
      const [result] = await pool.query('DELETE FROM bom_headers WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'BOM不存在' });
      }
      
      res.json({ message: '删除成功' });
    } catch (error) {
      console.error('删除BOM失败:', error);
      res.status(500).json({ error: '删除BOM失败' });
    }
  });

  /**
   * 获取BOM物料明细
   * GET /api/production/boms/:id/items
   */
  app.get('/api/production/boms/:id/items', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [items] = await pool.query(
        'SELECT * FROM bom_items WHERE bom_id = ? ORDER BY material_order, created_at',
        [id]
      );
      
      res.json(items);
    } catch (error) {
      console.error('获取BOM物料明细失败:', error);
      res.status(500).json({ error: '获取BOM物料明细失败' });
    }
  });

  /**
   * 添加BOM物料
   * POST /api/production/boms/:id/items
   */
  app.post('/api/production/boms/:id/items', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { material_model, quantity_per_unit, loss_rate = 0, unit = 'kg', remarks } = req.body;
      
      const [bom] = await pool.query('SELECT id FROM bom_headers WHERE id = ?', [id]);
      if (bom.length === 0) {
        return res.status(404).json({ error: 'BOM不存在' });
      }
      
      const [maxOrder] = await pool.query(
        'SELECT COALESCE(MAX(material_order), -1) as max_order FROM bom_items WHERE bom_id = ?',
        [id]
      );
      
      const itemId = uuidv4();
      const now = new Date();
      
      await pool.query(
        `INSERT INTO bom_items (id, bom_id, material_model, quantity_per_unit, loss_rate, unit, material_order, remarks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, id, material_model, quantity_per_unit, loss_rate, unit, maxOrder[0].max_order + 1, remarks || '', now]
      );
      
      const [newItem] = await pool.query('SELECT * FROM bom_items WHERE id = ?', [itemId]);
      res.status(201).json(newItem[0]);
    } catch (error) {
      console.error('添加BOM物料失败:', error);
      res.status(500).json({ error: '添加BOM物料失败' });
    }
  });

  // ============================================
  // 工单管理 API
  // ============================================

  /**
   * 获取工单列表
   * GET /api/production/workorders
   */
  app.get('/api/production/workorders', authenticateToken, async (req, res) => {
    try {
      const { page = 1, pageSize = 20, status, product_id, priority } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = '1=1';
      const params = [];
      
      if (status) {
        if (status === 'active') {
          whereClause += ' AND w.status IN ("released", "in_progress", "paused")';
        } else {
          whereClause += ' AND w.status = ?';
          params.push(status);
        }
      }
      
      if (product_id) {
        whereClause += ' AND w.product_id = ?';
        params.push(product_id);
      }
      
      if (priority) {
        whereClause += ' AND w.priority <= ?';
        params.push(parseInt(priority));
      }
      
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM work_orders w WHERE ${whereClause}`,
        params
      );
      
      const [rows] = await pool.query(
        `SELECT w.*, p.product_name, p.product_code, p.spec_gsm, p.spec_width, b.bom_code, b.bom_version
         FROM work_orders w
         LEFT JOIN products p ON w.product_id = p.id
         LEFT JOIN bom_headers b ON w.bom_id = b.id
         WHERE ${whereClause}
         ORDER BY w.priority ASC, w.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );
      
      res.json({
        list: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      });
    } catch (error) {
      console.error('获取工单列表失败:', error);
      res.status(500).json({ error: '获取工单列表失败' });
    }
  });

  /**
   * 获取工单详情
   * GET /api/production/workorders/:id
   */
  app.get('/api/production/workorders/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [headers] = await pool.query(
        `SELECT w.*, p.product_name, p.product_code, p.spec_gsm, p.spec_width, p.unit as product_unit,
                b.bom_code, b.bom_version, b.total_loss_rate
         FROM work_orders w
         LEFT JOIN products p ON w.product_id = p.id
         LEFT JOIN bom_headers b ON w.bom_id = b.id
         WHERE w.id = ?`,
        [id]
      );
      
      if (headers.length === 0) {
        return res.status(404).json({ error: '工单不存在' });
      }
      
      const [materials] = await pool.query(
        'SELECT * FROM work_order_materials WHERE work_order_id = ? ORDER BY created_at',
        [id]
      );
      
      res.json({
        ...headers[0],
        materials
      });
    } catch (error) {
      console.error('获取工单详情失败:', error);
      res.status(500).json({ error: '获取工单详情失败' });
    }
  });

  /**
   * 创建工单
   * POST /api/production/workorders
   */
  app.post('/api/production/workorders', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        product_id,
        bom_id,
        plan_quantity,
        due_date,
        priority = 5,
        line_id,
        remarks
      } = req.body;
      
      const [product] = await connection.query(
        'SELECT id, unit FROM products WHERE id = ?',
        [product_id]
      );
      if (product.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: '产品不存在' });
      }
      
      if (bom_id) {
        const [bom] = await connection.query(
          'SELECT id, total_loss_rate FROM bom_headers WHERE id = ? AND status = "active"',
          [bom_id]
        );
        if (bom.length === 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'BOM不存在或未激活' });
        }
      }
      
      const order_no = 'WO' + Date.now().toString().slice(-8);
      
      const id = uuidv4();
      const now = new Date();
      const userId = req.user?.id || 'system';
      
      await connection.query(
        `INSERT INTO work_orders (id, order_no, product_id, bom_id, plan_quantity, completed_quantity, qualified_quantity, reject_quantity, due_date, priority, status, line_id, remarks, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, "pending", ?, ?, ?, ?, ?)`,
        [id, order_no, product_id, bom_id, plan_quantity, due_date, priority, line_id, remarks || '', userId, now, now]
      );
      
      if (bom_id) {
        const [bomItems] = await connection.query(
          'SELECT material_model, quantity_per_unit, loss_rate, unit FROM bom_items WHERE bom_id = ?',
          [bom_id]
        );
        
        const [bomHeader] = await connection.query(
          'SELECT total_loss_rate FROM bom_headers WHERE id = ?',
          [bom_id]
        );
        
        const totalLossRate = bomHeader[0]?.total_loss_rate || 0;
        const actualQuantity = plan_quantity * (1 + totalLossRate / 100);
        
        for (const item of bomItems) {
          const materialId = uuidv4();
          const requiredQty = actualQuantity * item.quantity_per_unit;
          await connection.query(
            `INSERT INTO work_order_materials (id, work_order_id, material_model, required_quantity, issued_quantity, unit, remarks, created_at)
             VALUES (?, ?, ?, ?, 0, ?, '', ?)`,
            [materialId, id, item.material_model, requiredQty, item.unit, now]
          );
        }
      }
      
      await connection.commit();
      
      const [newWo] = await pool.query(
        `SELECT w.*, p.product_name, p.product_code
         FROM work_orders w
         LEFT JOIN products p ON w.product_id = p.id
         WHERE w.id = ?`,
        [id]
      );
      
      res.status(201).json(newWo[0]);
    } catch (error) {
      await connection.rollback();
      console.error('创建工单失败:', error);
      res.status(500).json({ error: '创建工单失败' });
    } finally {
      connection.release();
    }
  });

  /**
   * 更新工单
   * PUT /api/production/workorders/:id
   */
  app.put('/api/production/workorders/:id', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      const {
        product_id,
        bom_id,
        plan_quantity,
        due_date,
        priority,
        line_id,
        remarks
      } = req.body;
      
      const [existing] = await connection.query(
        'SELECT id, status FROM work_orders WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: '工单不存在' });
      }
      
      if (existing[0].status === 'completed' || existing[0].status === 'cancelled') {
        await connection.rollback();
        return res.status(400).json({ error: '已完成或已取消的工单无法修改' });
      }
      
      const updates = [];
      const params = [];
      
      if (product_id) { updates.push('product_id = ?'); params.push(product_id); }
      if (bom_id) { updates.push('bom_id = ?'); params.push(bom_id); }
      if (plan_quantity !== undefined) { updates.push('plan_quantity = ?'); params.push(plan_quantity); }
      if (due_date) { updates.push('due_date = ?'); params.push(due_date); }
      if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
      if (line_id !== undefined) { updates.push('line_id = ?'); params.push(line_id); }
      if (remarks !== undefined) { updates.push('remarks = ?'); params.push(remarks); }
      
      updates.push('updated_at = ?');
      params.push(new Date());
      params.push(id);
      
      if (updates.length > 1) {
        await connection.query(
          `UPDATE work_orders SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      }
      
      await connection.commit();
      
      const [updated] = await pool.query(
        `SELECT w.*, p.product_name, p.product_code
         FROM work_orders w
         LEFT JOIN products p ON w.product_id = p.id
         WHERE w.id = ?`,
        [id]
      );
      
      res.json(updated[0]);
    } catch (error) {
      await connection.rollback();
      console.error('更新工单失败:', error);
      res.status(500).json({ error: '更新工单失败' });
    } finally {
      connection.release();
    }
  });

  /**
   * 更新工单状态
   * PUT /api/production/workorders/:id/status
   */
  app.put('/api/production/workorders/:id/status', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      const { status } = req.body;
      
      const validTransitions = {
        'pending': ['released', 'cancelled'],
        'released': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'paused', 'cancelled'],
        'paused': ['in_progress', 'cancelled'],
        'completed': [],
        'cancelled': []
      };
      
      const [existing] = await connection.query(
        'SELECT id, status FROM work_orders WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: '工单不存在' });
      }
      
      const currentStatus = existing[0].status;
      
      if (!validTransitions[currentStatus].includes(status)) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `状态转换无效: ${currentStatus} -> ${status}` 
        });
      }
      
      await connection.query(
        'UPDATE work_orders SET status = ?, updated_at = ? WHERE id = ?',
        [status, new Date(), id]
      );
      
      await connection.commit();
      
      const [updated] = await pool.query(
        `SELECT w.*, p.product_name, p.product_code
         FROM work_orders w
         LEFT JOIN products p ON w.product_id = p.id
         WHERE w.id = ?`,
        [id]
      );
      
      res.json(updated[0]);
    } catch (error) {
      await connection.rollback();
      console.error('更新工单状态失败:', error);
      res.status(500).json({ error: '更新工单状态失败' });
    } finally {
      connection.release();
    }
  });

  /**
   * 发放工单物料
   * POST /api/production/workorders/:id/materials
   */
  app.post('/api/production/workorders/:id/materials', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { material_model, required_quantity, unit = 'kg' } = req.body;
      
      const [wo] = await pool.query(
        'SELECT id, status FROM work_orders WHERE id = ?',
        [id]
      );
      if (wo.length === 0) {
        return res.status(404).json({ error: '工单不存在' });
      }
      
      if (wo[0].status !== 'released' && wo[0].status !== 'in_progress') {
        return res.status(400).json({ error: '工单未发放或已完工，无法发放物料' });
      }
      
      const materialId = uuidv4();
      const now = new Date();
      
      await pool.query(
        `INSERT INTO work_order_materials (id, work_order_id, material_model, required_quantity, issued_quantity, unit, created_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
        [materialId, id, material_model, required_quantity, unit, now]
      );
      
      const [newMaterial] = await pool.query(
        'SELECT * FROM work_order_materials WHERE id = ?',
        [materialId]
      );
      
      res.status(201).json(newMaterial[0]);
    } catch (error) {
      console.error('发放工单物料失败:', error);
      res.status(500).json({ error: '发放工单物料失败' });
    }
  });

  /**
   * 完工入库
   * POST /api/production/workorders/:id/finish
   */
  app.post('/api/production/workorders/:id/finish', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      const { qualified_quantity, reject_quantity = 0, remarks } = req.body;
      
      const [wo] = await connection.query(
        'SELECT * FROM work_orders WHERE id = ?',
        [id]
      );
      
      if (wo.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: '工单不存在' });
      }
      
      if (wo[0].status !== 'in_progress') {
        await connection.rollback();
        return res.status(400).json({ error: '只有生产中的工单才能完工' });
      }
      
      await connection.query(
        `UPDATE work_orders 
         SET status = "completed", 
             completed_quantity = ?, 
             qualified_quantity = ?,
             reject_quantity = ?,
             updated_at = ?
         WHERE id = ?`,
        [qualified_quantity, qualified_quantity, reject_quantity, new Date(), id]
      );
      
      const fpId = uuidv4();
      const now = new Date();
      
      await connection.query(
        `INSERT INTO finished_products (id, work_order_id, product_id, quantity, qualified_quantity, reject_quantity, unit, remarks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fpId, id, wo[0].product_id, qualified_quantity, qualified_quantity, reject_quantity, wo[0].unit || '卷', remarks || '', now]
      );
      
      await connection.commit();
      
      const [updated] = await pool.query(
        `SELECT w.*, p.product_name, p.product_code
         FROM work_orders w
         LEFT JOIN products p ON w.product_id = p.id
         WHERE w.id = ?`,
        [id]
      );
      
      res.json(updated[0]);
    } catch (error) {
      await connection.rollback();
      console.error('完工入库失败:', error);
      res.status(500).json({ error: '完工入库失败' });
    } finally {
      connection.release();
    }
  });

  /**
   * 删除工单
   * DELETE /api/production/workorders/:id
   */
  app.delete('/api/production/workorders/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [existing] = await pool.query(
        'SELECT id, status FROM work_orders WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({ error: '工单不存在' });
      }
      
      if (existing[0].status !== 'pending' && existing[0].status !== 'cancelled') {
        return res.status(400).json({ error: '只能删除待发放或已取消的工单' });
      }
      
      await pool.query('DELETE FROM work_order_materials WHERE work_order_id = ?', [id]);
      await pool.query('DELETE FROM work_orders WHERE id = ?', [id]);
      
      res.json({ message: '删除成功' });
    } catch (error) {
      console.error('删除工单失败:', error);
      res.status(500).json({ error: '删除工单失败' });
    }
  });

  // ============================================
  // 成品管理 API
  // ============================================

  /**
   * 获取成品入库记录
   * GET /api/production/finished
   */
  app.get('/api/production/finished', authenticateToken, async (req, res) => {
    try {
      const { page = 1, pageSize = 20, product_id } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = '1=1';
      const params = [];
      
      if (product_id) {
        whereClause += ' AND f.product_id = ?';
        params.push(product_id);
      }
      
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM finished_products f WHERE ${whereClause}`,
        params
      );
      
      const [rows] = await pool.query(
        `SELECT f.*, p.product_name, p.product_code, p.spec_gsm, p.spec_width, w.order_no
         FROM finished_products f
         LEFT JOIN products p ON f.product_id = p.id
         LEFT JOIN work_orders w ON f.work_order_id = w.id
         WHERE ${whereClause}
         ORDER BY f.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );
      
      res.json({
        list: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      });
    } catch (error) {
      console.error('获取成品记录失败:', error);
      res.status(500).json({ error: '获取成品记录失败' });
    }
  });

  console.log('生产管理路由已注册');
}

module.exports = { setup };
