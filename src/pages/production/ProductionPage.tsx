import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { productionApi, type Product, type WorkOrder, type FinishedProduct } from '@/db/serverApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// 统计卡片样式
const statCardStyle = {
  padding: '24px',
  borderRadius: '12px',
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
};

const statNumberStyle = {
  fontSize: '32px',
  fontWeight: 700,
  color: '#1e293b',
};

const statLabelStyle = {
  fontSize: '14px',
  color: '#64748b',
  marginTop: '4px',
};

export default function ProductionPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    products: 0,
    activeBoms: 0,
    pendingOrders: 0,
    todayOutput: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // 获取产品数量
      const productsRes = await productionApi.getProducts({ is_active: 1 });
      const products = productsRes.data?.length || 0;

      // 获取激活的BOM数量
      const bomsRes = await productionApi.getBoms({ status: 'active' });
      const activeBoms = bomsRes.data?.length || 0;

      // 获取待处理工单数量
      const ordersRes = await productionApi.getWorkOrders({ status: 'pending' });
      const pendingOrders = ordersRes.data?.length || 0;

      // 获取今日成品入库
      const today = new Date().toISOString().slice(0, 10);
      const outputRes = await productionApi.getFinishedProducts({ start_date: today, end_date: today });
      const todayOutput = outputRes.data?.reduce((sum, fp) => sum + (fp.quantity || 0), 0) || 0;

      setStats({ products, activeBoms, pendingOrders, todayOutput });
    } catch (error: any) {
      console.error('加载统计失败:', error);
      toast.error(error.message || '加载统计失败');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: '产品管理',
      description: '管理产品档案、BOM配方',
      icon: '📦',
      path: '/production/products',
      color: '#3b82f6',
    },
    {
      title: 'BOM管理',
      description: '管理物料清单、配方版本',
      icon: '📋',
      path: '/production/boms',
      color: '#10b981',
    },
    {
      title: '生产工单',
      description: '创建工单、领料、完工',
      icon: '📝',
      path: '/production/workorders',
      color: '#f59e0b',
    },
    {
      title: '成品入库',
      description: '记录成品入库、库存查询',
      icon: '🏭',
      color: '#8b5cf6',
    },
    {
      title: '生产统计',
      description: '产量报表、合格率统计',
      icon: '📊',
      path: '/production/stats',
      color: '#ec4899',
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
          生产管理
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          管理产品、BOM、工单和成品入库
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <Card>
          <CardContent style={{ padding: '24px' }}>
            <div style={statNumberStyle}>{loading ? '-' : stats.products}</div>
            <div style={statLabelStyle}>产品数量</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: '24px' }}>
            <div style={statNumberStyle}>{loading ? '-' : stats.activeBoms}</div>
            <div style={statLabelStyle}>激活BOM</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: '24px' }}>
            <div style={statNumberStyle}>{loading ? '-' : stats.pendingOrders}</div>
            <div style={statLabelStyle}>待处理工单</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: '24px' }}>
            <div style={statNumberStyle}>{loading ? '-' : todayOutput}</div>
            <div style={statLabelStyle}>今日产出</div>
          </CardContent>
        </Card>
      </div>

      {/* 功能菜单 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {menuItems.map((item) => (
          <Card
            key={item.title}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid #e2e8f0',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => item.path && navigate(item.path)}
          >
            <CardContent style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
