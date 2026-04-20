import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productionApi, type Product, type FinishedProduct } from '@/db/serverApi';
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

export default function FinishedPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<FinishedProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    batch_no: '',
    quantity: '',
    qualified_qty: '',
    reject_qty: '0',
    weight: '',
    warehouse: '',
    produced_at: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsRes, productsRes] = await Promise.all([
        productionApi.getFinishedProducts(),
        productionApi.getProducts({ is_active: 1 }),
      ]);
      if (recordsRes.success) setRecords(recordsRes.data || []);
      if (productsRes.success) setProducts(productsRes.data || []);
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
        quantity: parseFloat(formData.quantity),
        qualified_qty: parseFloat(formData.qualified_qty || formData.quantity),
        reject_qty: parseFloat(formData.reject_qty || '0'),
        weight: parseFloat(formData.weight || '0'),
      };
      await productionApi.createFinishedProduct(data);
      toast.success('入库成功');
      setShowModal(false);
      setFormData({ product_id: '', batch_no: '', quantity: '', qualified_qty: '', reject_qty: '0', weight: '', warehouse: '', produced_at: new Date().toISOString().slice(0, 16) });
      loadData();
    } catch (error: any) {
      toast.error(error.message || '入库失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条入库记录吗？')) return;
    try {
      await productionApi.deleteFinishedProduct(id);
      toast.success('删除成功');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const openNewModal = () => {
    setFormData({ product_id: '', batch_no: '', quantity: '', qualified_qty: '', reject_qty: '0', weight: '', warehouse: '', produced_at: new Date().toISOString().slice(0, 16) });
    setShowModal(true);
  };

  // 计算今日总计
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter(r => r.produced_at && r.produced_at.slice(0, 10) === today);
  const todayQty = todayRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const todayWeight = todayRecords.reduce((sum, r) => sum + (r.weight || 0), 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/production')} style={{ marginBottom: '8px', padding: '8px' }}>
            ← 返回
          </Button>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>成品入库</h1>
        </div>
        <Button onClick={openNewModal} style={{ backgroundColor: '#8b5cf6' }}>+ 新增进库</Button>
      </div>

      {/* 今日统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <CardContent style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{todayRecords.length}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>今日入库次数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{todayQty}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>今日产出数量</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{todayWeight.toFixed(1)}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>今日产出重量(kg)</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>批次号</th>
                <th style={thStyle}>产品</th>
                <th style={thStyle}>数量</th>
                <th style={thStyle}>合格/不良</th>
                <th style={thStyle}>重量(kg)</th>
                <th style={thStyle}>仓库</th>
                <th style={thStyle}>生产时间</th>
                <th style={thStyle}>操作人</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '40px' }}>加载中...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '40px' }}>暂无入库记录</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td style={tdStyle}>{r.batch_no}</td>
                    <td style={tdStyle}>{r.product_name} ({r.spec_gsm}g/{r.spec_width}mm)</td>
                    <td style={tdStyle}>{r.quantity} {r.unit}</td>
                    <td style={tdStyle}>
                      <span style={{ color: '#10b981' }}>{r.qualified_qty}</span>
                      {r.reject_qty > 0 && <span style={{ color: '#ef4444', marginLeft: '8px' }}>/ {r.reject_qty}</span>}
                    </td>
                    <td style={tdStyle}>{r.weight || '-'}</td>
                    <td style={tdStyle}>{r.warehouse || '-'}</td>
                    <td style={tdStyle}>{r.produced_at ? r.produced_at.slice(0, 16) : '-'}</td>
                    <td style={tdStyle}>{r.operator || '-'}</td>
                    <td style={tdStyle}>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} style={{ color: '#ef4444' }}>删除</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 新增进库弹窗 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '450px', maxHeight: '90vh', overflow: 'auto' }}>
            <CardContent style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>新增成品入库</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>产品 *</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="">选择产品</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.product_name} ({p.spec_gsm}g/{p.spec_width}mm)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>批次号 *</label>
                  <Input value={formData.batch_no} onChange={(e) => setFormData({ ...formData, batch_no: e.target.value })} placeholder="批次号" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>数量 *</label>
                    <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>合格数量</label>
                    <Input type="number" value={formData.qualified_qty} onChange={(e) => setFormData({ ...formData, qualified_qty: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>不良数量</label>
                    <Input type="number" value={formData.reject_qty} onChange={(e) => setFormData({ ...formData, reject_qty: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>重量(kg)</label>
                    <Input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>仓库</label>
                  <Input value={formData.warehouse} onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })} placeholder="仓库位置" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>生产时间</label>
                  <Input type="datetime-local" value={formData.produced_at} onChange={(e) => setFormData({ ...formData, produced_at: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button variant="outline" onClick={() => setShowModal(false)}>取消</Button>
                  <Button onClick={handleSubmit} style={{ backgroundColor: '#8b5cf6' }}>确认入库</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
