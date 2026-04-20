import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const router = express.Router();
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:3001';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';

// JWT验证中间件（复用现有）
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供token' });
  }

  // 这里使用现有的JWT验证逻辑
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'token无效' });
    }
    req.user = user;
    next();
  });
}

/**
 * AI聊天接口适配
 * 将现有接口适配到OpenClaw
 */
router.post('/api/ai/chat', authenticateToken, async (req: Request, res: Response) => {
  const { messages, conversation_id } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '消息格式错误' });
  }

  try {
    // 调用OpenClaw API
    const response = await axios.post(`${OPENCLAW_URL}/api/chat`, {
      messages,
      conversation_id,
      skill: 'warehouse-management',
      user_id: req.user?.id
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_API_KEY}`
      },
      timeout: 30000 // 30秒超时
    });

    res.json({
      success: true,
      message: response.data.message
    });

  } catch (error: any) {
    console.error('OpenClaw调用错误:', error.message);
    
    if (error.response) {
      // OpenClaw返回的错误
      res.status(error.response.status).json({
        error: 'AI服务暂时不可用',
        details: error.response.data
      });
    } else if (error.code === 'ECONNREFUSED') {
      // 连接被拒绝
      res.status(503).json({
        error: 'AI服务未启动，请检查OpenClaw是否正常运行'
      });
    } else {
      // 其他错误
      res.status(500).json({
        error: 'AI服务请求失败',
        details: error.message
      });
    }
  }
});

/**
 * AI洞察接口适配
 */
router.get('/api/ai/insights', authenticateToken, async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${OPENCLAW_URL}/api/insights`, {
      params: { skill: 'warehouse-management' },
      headers: {
        'Authorization': `Bearer ${OPENCLAW_API_KEY}`
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error: any) {
    console.error('OpenClaw洞察接口错误:', error.message);
    res.status(500).json({
      error: '获取洞察数据失败',
      details: error.message
    });
  }
});

/**
 * AI模型列表接口
 */
router.get('/api/ai/models', authenticateToken, async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${OPENCLAW_URL}/api/models`, {
      headers: {
        'Authorization': `Bearer ${OPENCLAW_API_KEY}`
      },
      timeout: 5000
    });

    res.json(response.data);

  } catch (error: any) {
    console.error('获取模型列表失败:', error.message);
    res.status(500).json({
      error: '获取模型列表失败',
      details: error.message
    });
  }
});

/**
 * AI配置获取接口
 */
router.get('/api/ai/config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${OPENCLAW_URL}/api/config`, {
      headers: {
        'Authorization': `Bearer ${OPENCLAW_API_KEY}`
      },
      timeout: 5000
    });

    // 不返回完整的API Key，只返回是否已配置
    res.json({
      provider: response.data.provider,
      hasApiKey: !!response.data.apiKey,
      apiKeyPreview: response.data.apiKey ? response.data.apiKey.substring(0, 8) + '...' : ''
    });

  } catch (error: any) {
    console.error('获取AI配置失败:', error.message);
    res.status(500).json({
      error: '获取AI配置失败',
      details: error.message
    });
  }
});

/**
 * AI配置保存接口
 */
router.post('/api/ai/config', authenticateToken, async (req: Request, res: Response) => {
  const { provider, apiKey } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const response = await axios.post(`${OPENCLAW_URL}/api/config`, {
      provider,
      apiKey
    }, {
      headers: {
        'Authorization': `Bearer ${OPENCLAW_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    res.json(response.data);

  } catch (error: any) {
    console.error('保存AI配置失败:', error.message);
    res.status(500).json({
      error: '保存AI配置失败',
      details: error.message
    });
  }
});

/**
 * 快捷指令接口
 */
router.get('/api/ai/quick-commands', authenticateToken, (req: Request, res: Response) => {
  // 直接返回，不需要调用OpenClaw
  const commands = [
    { id: 1, command: '查询当前库存', description: '查看总库存和各型号库存情况' },
    { id: 2, command: '今日入库出库统计', description: '查看今天的入库和出库数据' },
    { id: 3, command: '是否有异常', description: '检查库存和质量异常情况' },
    { id: 4, command: '生成今日日报', description: '生成今天的运营报告' },
    { id: 5, command: '查看采购建议', description: '查看需要补货的型号' },
    { id: 6, command: '最近7天趋势', description: '查看近7天的出入库趋势' },
    { id: 7, command: '各型号库存占比', description: '查看各型号库存分布情况' },
    { id: 8, command: '最近操作记录', description: '查看最近的操作日志' }
  ];
  
  res.json({ success: true, data: commands });
});

/**
 * 健康检查接口
 */
router.get('/api/ai/health', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${OPENCLAW_URL}/health`, {
      timeout: 3000
    });

    res.json({
      status: 'ok',
      openclaw: 'connected',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'error',
      openclaw: 'disconnected',
      message: 'OpenClaw服务不可用',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
