import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productionApi, type Product, type BomHeader, type BomItem } from '@/db/serverApi';
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

export default function BomsPage() {
  const navigate = useNavigate();
  const [boms, setBoms] = useState<BomHeader[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedBom, setSelectedBom] = useState<BomHeader & { items?: BomItem[] } | null>(null);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    product_id: '',
    bom_version: 'v1.0',
    effective_date: new Date().toISOString().slice(0, 10),
    total_loss_rate: '0',
    remarks: '',
  });
  const [items, setItems] = useState<Partial<BomItem>[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bomsRes, productsRes] = await Promise.all([
        productionApi.getBoms(),
        productionApi.getProducts({ is_active: 1 }),
      ]);
      if (bomsRes.success) setBoms(bomsRes.data || []);
      if (productsRes.success) setProducts(productsRes.data || []);
    } catch (error: any) {
      toast.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadRawMaterials = async () => {
    try {
      // 获取原材料型号列表
      const res = await fetch('http://81.70.90.164:3001/api/materials/models', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data) setRawMaterials(data);
    } catch (error) {
      console.error('加载原材料失败', error);
    }
  };

  const handleViewItems = async (id: string) => {
    try {
      const res = await productionApi.getBom(id);
      if (res.success) {
        setSelectedBom(res.data);
        setShowItemsModal(true);
      }
    } catch (error: any) {
      toast.error(error.message || '加载失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        total_loss_rate: parseFloat(formData.total_loss_rate),
        items: items.filter(i => i.material_model && i.quantity_per_unit),
      };
      await productionApi.createBom(data);
      toast.success('创建成功');
      setShowModal(false);
      setItems([]);
      setFormData({ product_id: '', bom_version: 'v1.0', effective_date: new Date().toISOString().slice(0, 10), total_loss_rate: '0', remarks: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || '创建失败');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await productionApi.activateBom(id);
      toast.success('激活成功');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '激活失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个BOM吗？')) return;
    try {
      await productionApi.deleteBom(id);
      toast.success('删除成功');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const addItem = () => {
    setItems([...items, { material_model: '', quantity_per_unit: 0, loss_rate: 0, unit: 'kg' }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const openNewModal = () => {
    loadRawMaterials();
    setItems([]);
    setFormData({ product_id: '', bom_version: 'v1.0', effective_date: new Date().toISOString().slice(0, 10), total_loss_rate: '0', remarks: '' });
    setShowModal(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', color: '#166534' };
      case 'draft': return { bg: '#fef9c3', color: '#854d0e' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const statusText = { active: '已激活', draft: '草稿', deprecated: '已废弃' };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/production')} style={{ marginBottom: '8px', padding: '8px' }}>
            ← 返回
          </Button>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>BOM管理</h1>
        </div>
        <Button onClick={openNewModal} style={{ backgroundColor: '#10b981' }}>+ 新建BOM</Button>
      </div>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>BOM编码</th>
                <th style={thStyle}>产品</th>
                <th style={thStyle}>版本</th>
                <th style={thStyle}>生效日期</th>
                <th style={thStyle}>损耗率</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '40px' }}>加载中...</td></tr>
              ) : boms.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '40px' }}>暂无BOM</td></tr>
              ) : (
                boms.map((bom) => {
                  const s = getStatusStyle(bom.status);
                  return (
                    <tr key={bom.id}>
                      <td style={tdStyle}>{bom.bom_code}</td>
                      <td style={tdStyle}>{bom.product_name} ({bom.spec_gsm}g/{bom.spec_width}mm)</td>
                      <td style={tdStyle}>{bom.bom_version}</td>
                      <td style={tdStyle}>{bom.effective_date}</td>
                      <td style={tdStyle}>{bom.total_loss_rate}%</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: s.bg, color: s.color }}>
                          {statusText[bom.status as keyof typeof statusText] || bom.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <Button variant="ghost" size="sm" onClick={() => handleViewItems(bom.id)}>查看物料</Button>
                        {bom.status !== 'active' && (
                          <Button variant="ghost" size="sm" onClick={() => handleActivate(bom.id)} style={{ color: '#10b981' }}>激活</Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(bom.id)} style={{ color: '#ef4444' }}>删除</Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 新建BOM弹窗 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '600px', maxHeight: '90vh', overflow: 'auto' }}>
            <CardHeader><CardTitle>新建BOM</CardTitle></CardHeader>
            <CardContent>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>版本</label>
                    <Input value={formData.bom_version} onChange={(e) => setFormData({ ...formData, bom_version: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>生效日期</label>
                    <Input type="date" value={formData.effective_date} onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>损耗率%</label>
                    <Input type="number" value={formData.total_loss_rate} onChange={(e) => setFormData({ ...formData, total_loss_rate: e.target.value })} />
                  </div>
                </div>

                {/* 物料明细 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', color: '#64748b' }}>物料明细</label>
                    <Button size="sm" variant="outline" onClick={addItem}>+ 添加物料</Button>
                  </div>
                  {items.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>点击"添加物料"添加配方物料</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>原材料型号</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', width: '100px' }}>用量/kg</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', width: '80px' }}>损耗%</th>
                          <th style={{ padding: '8px', width: '60px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '4px', borderBottom: '1px solid #e2e8f0' }}>
                              <Input
                                value={item.material_model || ''}
                                onChange={(e) => updateItem(idx, 'material_model', e.target.value)}
                                placeholder="型号如 B1990085T1"
                                style={{ fontSize: '13px' }}
                              />
                            </td>
                            <td style={{ padding: '4px', borderBottom: '1px solid #e2e8f0' }}>
                              <Input type="number" value={item.quantity_per_unit || ''} onChange={(e) => updateItem(idx, 'quantity_per_unit', parseFloat(e.target.value))} style={{ fontSize: '13px' }} />
                            </td>
                            <td style={{ padding: '4px', borderBottom: '1px solid #e2e8f0' }}>
                              <Input type="number" value={item.loss_rate || ''} onChange={(e) => updateItem(idx, 'loss_rate', parseFloat(e.target.value))} style={{ fontSize: '13px' }} />
                            </td>
                            <td style={{ padding: '4px', borderBottom: '1px solid #e2e8f0' }}>
                              <Button size="sm" variant="ghost" onClick={() => removeItem(idx)} style={{ color: '#ef4444', fontSize: '12px', padding: '4px' }}>删除</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button variant="outline" onClick={() => setShowModal(false)}>取消</Button>
                  <Button onClick={handleSubmit} style={{ backgroundColor: '#10b981' }}>创建</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 查看物料弹窗 */}
      {showItemsModal && selectedBom && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
            <CardHeader>
              <CardTitle>BOM物料明细</CardTitle>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                {selectedBom.product_name} - {selectedBom.bom_version}
              </p>
            </CardHeader>
            <CardContent>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>原材料型号</th>
                    <th style={thStyle}>单位用量</th>
                    <th style={thStyle}>损耗率</th>
                    <th style={thStyle}>实际用量</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBom.items?.map((item) => (
                    <tr key={item.id}>
                      <td style={tdStyle}>{item.material_model}</td>
                      <td style={tdStyle}>{item.quantity_per_unit} {item.unit}</td>
                      <td style={tdStyle}>{item.loss_rate}%</td>
                      <td style={tdStyle}>{(item.quantity_per_unit * (1 + item.loss_rate / 100)).toFixed(4)} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <Button variant="outline" onClick={() => setShowItemsModal(false)}>关闭</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
