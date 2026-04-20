import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productionApi, type Product, type BomHeader, type WorkOrder } from '@/db/serverApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left' as const,
  fontWeight: 600,
  fontSize: '14px',
  color: '#334155',
  backgroundColor: '#f1f5f9',
  borderBottom: '1px solid #e2e8f0',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '14px',
  color: '#334155',
  borderBottom: '1px solid #e2e8f0',
};

const statusMap: Record<string, { text: string; bg: string; color: string }> = {
  pending: { text: '待发放', bg: '#fef9c3', color: '#854d0e' },
  released: { text: '已发放', bg: '#dbeafe', color: '#1e40af' },
  in_progress: { text: '生产中', bg: '#fce7f3', color: '#9d174d' },
  paused: { text: '已暂停', bg: '#f1f5f9', color: '#64748b' },
  completed: { text: '已完成', bg: '#dcfce7', color: '#166534' },
  cancelled: { text: '已取消', bg: '#fee2e2', color: '#991b1b' },
};

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [boms, setBoms] = useState<BomHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState({
    product_id: '',
    bom_id: '',
    plan_quantity: '',
    due_date: '',
    priority: '5',
    remarks: '',
  });
  const [completeData, setCompleteData] = useState({
    qualified_quantity: '',
    reject_quantity: '0',
  });

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, productsRes, bomsRes] = await Promise.all([
        productionApi.getWorkOrders(statusFilter ? { status: statusFilter } : undefined),
        productionApi.getProducts({ is_active: 1 }),
        productionApi.getBoms({ status: 'active' }),
      ]);
      if (ordersRes.success) setWorkOrders(ordersRes.data || []);
      if (productsRes.success) setProducts(productsRes.data || []);
      if (bomsRes.success) setBoms(bomsRes.data || []);
    } catch (error: any) {
      toast.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        plan_quantity: parseFloat(formData.plan_quantity),
        priority: parseInt(formData.priority),
      };
      await productionApi.createWorkOrder(data);
      toast.success('工单创建成功');
      setShowModal(false);
      setFormData({ product_id: '', bom_id: '', plan_quantity: '', due_date: '', priority: '5', remarks: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || '创建失败');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await productionApi.updateWorkOrderStatus(id, newStatus);
      toast.success('状态更新成功');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    }
  };

  const handleComplete = async () => {
    if (!selectedOrder) return;
    try {
      await productionApi.completeWorkOrder(selectedOrder.id, {
        qualified_quantity: parseFloat(completeData.qualified_quantity),
        reject_quantity: parseFloat(completeData.reject_quantity || '0'),
      });
      toast.success('完工录入成功');
      setShowCompleteModal(false);
      setSelectedOrder(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || '完工失败');
    }
  };

  const openCompleteModal = (order: WorkOrder) => {
    setSelectedOrder(order);
    setCompleteData({ qualified_quantity: String(order.plan_quantity), reject_quantity: '0' });
    setShowCompleteModal(true);
  };

  const openNewModal = () => {
    setFormData({ product_id: '', bom_id: '', plan_quantity: '', due_date: '', priority: '5', remarks: '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个工单吗？')) return;
    try {
      await productionApi.deleteWorkOrder(id);
      toast.success('删除成功');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  // 获取某产品的激活BOM
  const getProductBoms = (productId: string) => {
    return boms.filter(b => b.product_id === productId);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/production')} style={{ marginBottom: '8px', padding: '8px' }}>
            ← 返回
          </Button>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>生产工单</h1>
        </div>
        <Button onClick={openNewModal} style={{ backgroundColor: '#f59e0b' }}>+ 新建工单</Button>
      </div>

      {/* 状态筛选 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button size="sm" variant={statusFilter === '' ? 'default' : 'outline'} onClick={() => setStatusFilter('')}>全部</Button>
        {Object.entries(statusMap).map(([key, val]) => (
          <Button key={key} size="sm" variant={statusFilter === key ? 'default' : 'outline'} onClick={() => setStatusFilter(key)}>
            {val.text}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>工单号</th>
                <th style={thStyle}>产品</th>
                <th style={thStyle}>计划数量</th>
                <th style={thStyle}>已完成</th>
                <th style={thStyle}>合格率</th>
                <th style={thStyle}>交期</th>
                <th style={thStyle}>优先级</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '40px' }}>加载中...</td></tr>
              ) : workOrders.length === 0 ? (
                <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '40px' }}>暂无工单</td></tr>
              ) : (
                workOrders.map((wo) => {
                  const status = statusMap[wo.status] || statusMap.pending;
                  const qualifyRate = wo.completed_quantity > 0 ? ((wo.qualified_quantity / wo.completed_quantity) * 100).toFixed(1) : '-';
                  return (
                    <tr key={wo.id}>
                      <td style={tdStyle}>{wo.order_no}</td>
                      <td style={tdStyle}>{wo.product_name} ({wo.spec_gsm}g/{wo.spec_width}mm)</td>
                      <td style={tdStyle}>{wo.plan_quantity} {wo.unit}</td>
                      <td style={tdStyle}>{wo.completed_quantity} {wo.unit}</td>
                      <td style={tdStyle}>{qualifyRate}%</td>
                      <td style={tdStyle}>{wo.due_date || '-'}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: wo.priority <= 3 ? '#fee2e2' : wo.priority <= 6 ? '#fef9c3' : '#dcfce7',
                          color: wo.priority <= 3 ? '#991b1b' : wo.priority <= 6 ? '#854d0e' : '#166534',
                        }}>
                          {wo.priority}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: status.bg, color: status.color }}>
                          {status.text}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {wo.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(wo.id, 'released')}>发放</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(wo.id)} style={{ color: '#ef4444' }}>删除</Button>
                          </>
                        )}
                        {wo.status === 'released' && (
                          <Button variant="ghost" size="sm" onClick={() => handleStatusChange(wo.id, 'in_progress')}>开始生产</Button>
                        )}
                        {wo.status === 'in_progress' && (
                          <Button variant="ghost" size="sm" onClick={() => openCompleteModal(wo)} style={{ color: '#10b981' }}>完工</Button>
                        )}
                        {wo.status === 'completed' && (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>已完成</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 新建工单弹窗 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
            <CardContent style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>新建工单</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>产品 *</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value, bom_id: '' })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="">选择产品</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.product_name} ({p.spec_gsm}g/{p.spec_width}mm)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>BOM版本 *</label>
                  <select
                    value={formData.bom_id}
                    onChange={(e) => setFormData({ ...formData, bom_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                    disabled={!formData.product_id}
                  >
                    <option value="">选择BOM</option>
                    {formData.product_id && getProductBoms(formData.product_id).map(b => (
                      <option key={b.id} value={b.id}>{b.bom_version} - 损耗率{b.total_loss_rate}%</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>计划数量 *</label>
                    <Input type="number" value={formData.plan_quantity} onChange={(e) => setFormData({ ...formData, plan_quantity: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>优先级</label>
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}>
                      <option value="1">1 - 最高</option>
                      <option value="3">3 - 高</option>
                      <option value="5">5 - 普通</option>
                      <option value="7">7 - 低</option>
                      <option value="10">10 - 最低</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>交期</label>
                  <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>备注</label>
                  <Input value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button variant="outline" onClick={() => setShowModal(false)}>取消</Button>
                  <Button onClick={handleSubmit} style={{ backgroundColor: '#f59e0b' }}>创建</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 完工弹窗 */}
      {showCompleteModal && selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '400px' }}>
            <CardContent style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>完工录入</h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                工单: {selectedOrder.order_no}<br />
                产品: {selectedOrder.product_name}<br />
                计划数量: {selectedOrder.plan_quantity}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>合格数量 *</label>
                  <Input type="number" value={completeData.qualified_quantity} onChange={(e) => setCompleteData({ ...completeData, qualified_quantity: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>不良数量</label>
                  <Input type="number" value={completeData.reject_quantity} onChange={(e) => setCompleteData({ ...completeData, reject_quantity: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <Button variant="outline" onClick={() => setShowCompleteModal(false)}>取消</Button>
                  <Button onClick={handleComplete} style={{ backgroundColor: '#10b981' }}>确认完工</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
