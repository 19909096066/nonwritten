import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productionApi, type Product } from '@/db/serverApi';
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

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    spec_gsm: '',
    spec_width: '',
    spec_color: '',
    spec_material: 'PP',
    unit: '卷',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productionApi.getProducts();
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (error: any) {
      toast.error(error.message || '加载产品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        spec_gsm: parseFloat(formData.spec_gsm),
        spec_width: parseFloat(formData.spec_width),
      };

      if (editingProduct) {
        await productionApi.updateProduct(editingProduct.id, data);
        toast.success('更新成功');
      } else {
        await productionApi.createProduct(data);
        toast.success('创建成功');
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ product_code: '', product_name: '', spec_gsm: '', spec_width: '', spec_color: '', spec_material: 'PP', unit: '卷' });
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_code: product.product_code,
      product_name: product.product_name,
      spec_gsm: String(product.spec_gsm),
      spec_width: String(product.spec_width),
      spec_color: product.spec_color || '',
      spec_material: product.spec_material,
      unit: product.unit,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;
    try {
      await productionApi.deleteProduct(id);
      toast.success('删除成功');
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const openNewModal = () => {
    setEditingProduct(null);
    setFormData({ product_code: '', product_name: '', spec_gsm: '', spec_width: '', spec_color: '', spec_material: 'PP', unit: '卷' });
    setShowModal(true);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/production')} style={{ marginBottom: '8px', padding: '8px' }}>
            ← 返回
          </Button>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>产品管理</h1>
        </div>
        <Button onClick={openNewModal} style={{ backgroundColor: '#3b82f6' }}>
          + 新建产品
        </Button>
      </div>

      {/* 产品列表 */}
      <Card>
        <CardContent style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>产品编码</th>
                <th style={thStyle}>产品名称</th>
                <th style={thStyle}>克重(g/m²)</th>
                <th style={thStyle}>幅宽(mm)</th>
                <th style={thStyle}>颜色</th>
                <th style={thStyle}>材质</th>
                <th style={thStyle}>单位</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '40px' }}>
                    加载中...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '40px' }}>
                    暂无产品，点击"新建产品"添加
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} style={{ backgroundColor: p.is_active ? 'transparent' : '#f1f5f9' }}>
                    <td style={tdStyle}>{p.product_code}</td>
                    <td style={tdStyle}>{p.product_name}</td>
                    <td style={tdStyle}>{p.spec_gsm}</td>
                    <td style={tdStyle}>{p.spec_width}</td>
                    <td style={tdStyle}>{p.spec_color || '-'}</td>
                    <td style={tdStyle}>{p.spec_material}</td>
                    <td style={tdStyle}>{p.unit}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: p.is_active ? '#dcfce7' : '#f1f5f9',
                        color: p.is_active ? '#166534' : '#64748b',
                      }}>
                        {p.is_active ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>编辑</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} style={{ color: '#ef4444' }}>删除</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 弹窗 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <Card style={{ width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
            <CardHeader>
              <CardTitle>{editingProduct ? '编辑产品' : '新建产品'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>产品编码 *</label>
                  <Input value={formData.product_code} onChange={(e) => setFormData({ ...formData, product_code: e.target.value })} placeholder="如: FP-199-1600" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>产品名称 *</label>
                  <Input value={formData.product_name} onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} placeholder="产品名称" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>克重(g/m²) *</label>
                    <Input type="number" value={formData.spec_gsm} onChange={(e) => setFormData({ ...formData, spec_gsm: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>幅宽(mm) *</label>
                    <Input type="number" value={formData.spec_width} onChange={(e) => setFormData({ ...formData, spec_width: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>颜色</label>
                    <Input value={formData.spec_color} onChange={(e) => setFormData({ ...formData, spec_color: e.target.value })} placeholder="如: 白色" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>材质</label>
                    <Input value={formData.spec_material} onChange={(e) => setFormData({ ...formData, spec_material: e.target.value })} placeholder="PP/PET/PA" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#64748b' }}>单位</label>
                  <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="卷/kg" />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button variant="outline" onClick={() => setShowModal(false)}>取消</Button>
                  <Button onClick={handleSubmit} style={{ backgroundColor: '#3b82f6' }}>
                    {editingProduct ? '保存' : '创建'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
