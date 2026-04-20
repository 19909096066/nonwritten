/**
 * 质检管理模块 API
 * 无纺布管理系统
 * 
 * 使用方式:
 * const qcRouter = require('./routes/qc.js');
 * qcRouter.setup(app, authenticateToken, pool);
 */

const { v4: uuidv4 } = require('uuid');

let pool = null;

function setup(app, authenticateToken, dbPool) {
  pool = dbPool;
  
  // ============================================
  // 质检标准管理 API
  // ============================================

  /**
   * 获取质检标准列表
   * GET /api/qc/standards
   */
  app.get('/api/qc/standards', authenticateToken, async (req, res) => {
    try {
      const { page = 1, pageSize = 20, material_model, is_active } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = '1=1';
      const params = [];
      
      if (material_model) {
        whereClause += ' AND material_model LIKE ?';
        params.push(`%${material_model}%`);
      }
      
      if (is_active !== undefined) {
        whereClause += ' AND is_active = ?';
        params.push(is_active);
      }
      
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM qc_standards WHERE ${whereClause}`,
        params
      );
      
      const [rows] = await pool.query(
        `SELECT * FROM qc_standards WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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
      console.error('获取质检标准列表失败:', error);
      res.status(500).json({ error: '获取质检标准列表失败' });
    }
  });

  /**
   * 获取质检标准详情
   * GET /api/qc/standards/:id
   */
  app.get('/api/qc/standards/:id', authenticateToken, async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM qc_standards WHERE id = ?',
        [req.params.id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: '质检标准不存在' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('获取质检标准详情失败:', error);
      res.status(500).json({ error: '获取质检标准详情失败' });
    }
  });

  /**
   * 创建/更新质检标准
   * POST /api/qc/standards
   */
  app.post('/api/qc/standards', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        id,
        material_model,
        weight_tolerance_min,
        weight_tolerance_max,
        thickness_tolerance_min,
        thickness_tolerance_max,
        appearance_standard,
        packaging_standard,
        is_active = 1,
        remarks
      } = req.body;
      
      const now = new Date();
      
      if (id) {
        const [existing] = await connection.query(
          'SELECT id FROM qc_standards WHERE id = ?',
          [id]
        );
        
        if (existing.length === 0) {
          await connection.rollback();
          return res.status(404).json({ error: '质检标准不存在' });
        }
        
        await connection.query(
          `UPDATE qc_standards 
           SET material_model = ?, weight_tolerance_min = ?, weight_tolerance_max = ?,
               thickness_tolerance_min = ?, thickness_tolerance_max = ?,
               appearance_standard = ?, packaging_standard = ?, is_active = ?, remarks = ?, updated_at = ?
           WHERE id = ?`,
          [material_model, weight_tolerance_min, weight_tolerance_max, 
           thickness_tolerance_min, thickness_tolerance_max,
           appearance_standard, packaging_standard, is_active, remarks, now, id]
        );
        
        await connection.commit();
        
        const [updated] = await pool.query('SELECT * FROM qc_standards WHERE id = ?', [id]);
        res.json(updated[0]);
      } else {
        const [existing] = await connection.query(
          'SELECT id FROM qc_standards WHERE material_model = ?',
          [material_model]
        );
        
        if (existing.length > 0) {
          await connection.rollback();
          return res.status(400).json({ error: '该型号的质检标准已存在' });
        }
        
        const newId = uuidv4();
        
        await connection.query(
          `INSERT INTO qc_standards (id, material_model, weight_tolerance_min, weight_tolerance_max, thickness_tolerance_min, thickness_tolerance_max, appearance_standard, packaging_standard, is_active, remarks, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, material_model, weight_tolerance_min, weight_tolerance_max, 
           thickness_tolerance_min, thickness_tolerance_max,
           appearance_standard, packaging_standard, is_active, remarks, now, now]
        );
        
        await connection.commit();
        
        const [newStandard] = await pool.query('SELECT * FROM qc_standards WHERE id = ?', [newId]);
        res.status(201).json(newStandard[0]);
      }
    } catch (error) {
      await connection.rollback();
      console.error('保存质检标准失败:', error);
      res.status(500).json({ error: '保存质检标准失败' });
    } finally {
      connection.release();
    }
  });

  /**
   * 删除质检标准
   * DELETE /api/qc/standards/:id
   */
  app.delete('/api/qc/standards/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [result] = await pool.query('DELETE FROM qc_standards WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '质检标准不存在' });
      }
      
      res.json({ message: '删除成功' });
    } catch (error) {
      console.error('删除质检标准失败:', error);
      res.status(500).json({ error: '删除质检标准失败' });
    }
  });

  // ============================================
  // 质检记录 API
  // ============================================

  /**
   * 获取质检记录列表
   * GET /api/qc/records
   */
  app.get('/api/qc/records', authenticateToken, async (req, res) => {
    try {
      const { page = 1, pageSize = 20, qc_type, result, material_model } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = '1=1';
      const params = [];
      
      if (qc_type) {
        whereClause += ' AND qc_type = ?';
        params.push(qc_type);
      }
      
      if (result) {
        whereClause += ' AND result = ?';
        params.push(result);
      }
      
      if (material_model) {
        whereClause += ' AND material_model LIKE ?';
        params.push(`%${material_model}%`);
      }
      
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM qc_records WHERE ${whereClause}`,
        params
      );
      
      const [rows] = await pool.query(
        `SELECT * FROM qc_records WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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
      console.error('获取质检记录列表失败:', error);
      res.status(500).json({ error: '获取质检记录列表失败' });
    }
  });

  /**
   * 获取质检记录详情
   * GET /api/qc/records/:id
   */
  app.get('/api/qc/records/:id', authenticateToken, async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM qc_records WHERE id = ?',
        [req.params.id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: '质检记录不存在' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('获取质检记录详情失败:', error);
      res.status(500).json({ error: '获取质检记录详情失败' });
    }
  });

  /**
   * 创建质检记录
   * POST /api/qc/records
   */
  app.post('/api/qc/records', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        qc_type,
        material_model,
        batch_no,
        quantity,
        sample_size,
        inspected_size,
        qualified_size,
        result,
        defect_items,
        remarks,
        operator
      } = req.body;
      
      const now = new Date();
      
      let finalResult = result;
      if (!finalResult && inspected_size !== undefined && qualified_size !== undefined) {
        const qualifyRate = qualified_size / inspected_size;
        if (qualifyRate >= 0.95) {
          finalResult = 'qualified';
        } else if (qualifyRate >= 0.8) {
          finalResult = 'partial';
        } else {
          finalResult = 'rejected';
        }
      }
      
      const id = uuidv4();
      
      await connection.query(
        `INSERT INTO qc_records (id, qc_type, material_model, batch_no, quantity, sample_size, inspected_size, qualified_size, result, defect_items, remarks, operator, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, qc_type, material_model, batch_no, quantity, sample_size, inspected_size, qualified_size, finalResult, defect_items, remarks, operator, now]
      );
      
      if (finalResult === 'rejected' && inspected_size !== undefined) {
        const rejectQty = inspected_size - (qualified_size || 0);
        if (rejectQty > 0) {
          const defectId = uuidv4();
          await connection.query(
            `INSERT INTO qc_defects (id, qc_record_id, material_model, batch_no, defect_quantity, defect_type, defect_level, handle_result, remarks, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'serious', 'pending', ?, ?)`,
            [defectId, id, material_model, batch_no, rejectQty, defect_items || '外观/质量不合格', remarks, now]
          );
        }
      }
      
      await connection.commit();
      
      const [newRecord] = await pool.query('SELECT * FROM qc_records WHERE id = ?', [id]);
      res.status(201).json(newRecord[0]);
    } catch (error) {
      await connection.rollback();
      console.error('创建质检记录失败:', error);
      res.status(500).json({ error: '创建质检记录失败' });
    } finally {
      connection.release();
    }
  });

  /**
   * 删除质检记录
   * DELETE /api/qc/records/:id
   */
  app.delete('/api/qc/records/:id', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      
      await connection.query('DELETE FROM qc_defects WHERE qc_record_id = ?', [id]);
      
      const [result] = await connection.query('DELETE FROM qc_records WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: '质检记录不存在' });
      }
      
      await connection.commit();
      res.json({ message: '删除成功' });
    } catch (error) {
      await connection.rollback();
      console.error('删除质检记录失败:', error);
      res.status(500).json({ error: '删除质检记录失败' });
    } finally {
      connection.release();
    }
  });

  // ============================================
  // 次品明细 API
  // ============================================

  /**
   * 获取次品明细列表
   * GET /api/qc/defects
   */
  app.get('/api/qc/defects', authenticateToken, async (req, res) => {
    try {
      const { page = 1, pageSize = 20, handle_status, defect_level } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = '1=1';
      const params = [];
      
      if (handle_status) {
        whereClause += ' AND handle_status = ?';
        params.push(handle_status);
      }
      
      if (defect_level) {
        whereClause += ' AND defect_level = ?';
        params.push(defect_level);
      }
      
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM qc_defects WHERE ${whereClause}`,
        params
      );
      
      const [rows] = await pool.query(
        `SELECT d.*, r.qc_type, r.inspected_size, r.qualified_size
         FROM qc_defects d
         LEFT JOIN qc_records r ON d.qc_record_id = r.id
         WHERE ${whereClause}
         ORDER BY d.created_at DESC
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
      console.error('获取次品明细失败:', error);
      res.status(500).json({ error: '获取次品明细失败' });
    }
  });

  /**
   * 处理次品
   * PUT /api/qc/defects/:id/handle
   */
  app.put('/api/qc/defects/:id/handle', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { handle_result } = req.body;
      
      const [result] = await pool.query(
        'UPDATE qc_defects SET handle_status = "handled", handle_result = ?, updated_at = ? WHERE id = ?',
        [handle_result, new Date(), id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '次品记录不存在' });
      }
      
      const [updated] = await pool.query('SELECT * FROM qc_defects WHERE id = ?', [id]);
      res.json(updated[0]);
    } catch (error) {
      console.error('处理次品失败:', error);
      res.status(500).json({ error: '处理次品失败' });
    }
  });

  // ============================================
  // 统计分析 API
  // ============================================

  /**
   * 获取质检统计数据
   * GET /api/qc/stats
   */
  app.get('/api/qc/stats', authenticateToken, async (req, res) => {
    try {
      const { start_date, end_date, qc_type } = req.query;
      
      let dateFilter = '';
      const params = [];
      
      if (start_date && end_date) {
        dateFilter = ' AND DATE(created_at) BETWEEN ? AND ?';
        params.push(start_date, end_date);
      }
      
      if (qc_type) {
        dateFilter += ' AND qc_type = ?';
        params.push(qc_type);
      }
      
      const [totalStats] = await pool.query(
        `SELECT 
           COUNT(*) as total_inspections,
           COALESCE(SUM(inspected_size), 0) as total_inspected,
           COALESCE(SUM(qualified_size), 0) as total_qualified,
           COALESCE(SUM(inspected_size), 0) - COALESCE(SUM(qualified_size), 0) as total_rejected
         FROM qc_records 
         WHERE 1=1 ${dateFilter}`,
        params
      );
      
      const [resultStats] = await pool.query(
        `SELECT result, COUNT(*) as count 
         FROM qc_records 
         WHERE 1=1 ${dateFilter}
         GROUP BY result`,
        params
      );
      
      const [modelStats] = await pool.query(
        `SELECT material_model, 
           COUNT(*) as inspection_count,
           COALESCE(SUM(qualified_size), 0) as qualified,
           COALESCE(SUM(inspected_size), 0) - COALESCE(SUM(qualified_size), 0) as rejected
         FROM qc_records 
         WHERE 1=1 ${dateFilter}
         GROUP BY material_model
         ORDER BY inspection_count DESC
         LIMIT 10`,
        params
      );
      
      const [trendStats] = await pool.query(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as inspections,
           ROUND(COALESCE(SUM(qualified_size), 0) / COALESCE(SUM(inspected_size), 1) * 100, 2) as qualify_rate
         FROM qc_records
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         GROUP BY DATE(created_at)
         ORDER BY date`,
        []
      );
      
      res.json({
        summary: totalStats[0],
        byResult: resultStats,
        byModel: modelStats,
        trend: trendStats
      });
    } catch (error) {
      console.error('获取质检统计失败:', error);
      res.status(500).json({ error: '获取质检统计失败' });
    }
  });

  console.log('质检管理路由已注册');
}

module.exports = { setup };
