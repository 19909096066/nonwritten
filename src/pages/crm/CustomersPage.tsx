import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  contact_person: string;
  phone: string;
  address: string;
  region: string;
  industry: string;
  customer_level: string;
  r_score: number;
  f_score: number;
  m_score: number;
  rfm_total: number;
  total_order_count: number;
  total_order_amount: number;
  avg_order_amount: number;
  clv: number;
  churn_risk: string;
  status: string;
  last_order_date: string;
  remark: string;
}

const levelColors: Record<string, string> = {
  '重要保持客户': 'bg-red-100 text-red-800',
  '重要发展客户': 'bg-orange-100 text-orange-800',
  '重要挽留客户': 'bg-yellow-100 text-yellow-800',
  '重要保护客户': 'bg-blue-100 text-blue-800',
  '一般价值客户': 'bg-gray-100 text-gray-800',
  '一般发展客户': 'bg-green-100 text-green-800',
  '一般保持客户': 'bg-purple-100 text-purple-800',
  '一般挽留客户': 'bg-pink-100 text-pink-800',
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    important: 0,
    medium: 0,
    normal: 0,
    highRisk: 0
  });

  const [formData, setFormData] = useState({
    customer_name: '',
    contact_person: '',
    phone: '',
    address: '',
    region: '',
    industry: '',
    remark: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
        calculateStats(data.data);
      }
    } catch (error) {
      console.error('获取客户列表失败', error);
    }
    setLoading(false);
  };

  const calculateStats = (data: Customer[]) => {
    const important = data.filter(c => 
      c.customer_level?.startsWith('重要')
    ).length;
    const medium = data.filter(c => 
      c.customer_level?.startsWith('一般') && 
      c.customer_level !== '一般价值客户'
    ).length;
    const normal = data.filter(c => 
      c.customer_level === '一般价值客户' || !c.customer_level
    ).length;
    const highRisk = data.filter(c => c.churn_risk === 'high').length;
    
    setStats({
      total: data.length,
      important,
      medium,
      normal,
      highRisk
    });
  };

  const handleSubmit = async () => {
    try {
      const url = editingCustomer 
        ? `/api/crm/customers/${editingCustomer.id}`
        : '/api/crm/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({
          customer_name: '',
          contact_person: '',
          phone: '',
          address: '',
          region: '',
          industry: '',
          remark: ''
        });
        fetchCustomers();
      }
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customer_name: customer.customer_name || '',
      contact_person: customer.contact_person || '',
      phone: customer.phone || '',
      address: customer.address || '',
      region: customer.region || '',
      industry: customer.industry || '',
      remark: customer.remark || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该客户？')) return;
    try {
      await fetch(`/api/crm/customers/${id}`, { method: 'DELETE' });
      fetchCustomers();
    } catch (error) {
      console.error('删除失败', error);
    }
  };

  const calculateRFM = async () => {
    try {
      const res = await fetch('/api/crm/rfm/calculate', { method: 'POST' });
      if (res.ok) {
        alert('RFM计算完成！');
        fetchCustomers();
      }
    } catch (error) {
      console.error('RFM计算失败', error);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchLevel = !filterLevel || c.customer_level === filterLevel;
    const matchSearch = !searchKeyword || 
      c.customer_name?.includes(searchKeyword) ||
      c.customer_code?.includes(searchKeyword) ||
      c.phone?.includes(searchKeyword);
    return matchLevel && matchSearch;
  });

  const getLevelBadge = (level: string) => {
    const colorClass = levelColors[level] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`px-2 py-1 rounded text-xs ${colorClass}`}>
        {level || '未分级'}
      </span>
    );
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      high: 'bg-red-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-green-500 text-white'
    };
    const labels = { high: '高风险', medium: '中风险', low: '低风险' };
    return (
      <span className={`px-2 py-1 rounded text-xs ${colors[risk] || colors.low}`}>
        {labels[risk] || '低风险'}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">客户管理</h1>
          <p className="text-gray-500 text-sm mt-1">CRM客户关系管理 / RFM客户分级</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={calculateRFM}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重新计算RFM
          </button>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({
                customer_name: '',
                contact_person: '',
                phone: '',
                address: '',
                region: '',
                industry: '',
                remark: ''
              });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            + 新建客户
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">客户总数</div>
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">重要客户</div>
          <div className="text-3xl font-bold text-red-600">{stats.important}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">一般客户</div>
          <div className="text-3xl font-bold text-blue-600">{stats.medium}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">普通客户</div>
          <div className="text-3xl font-bold text-gray-600">{stats.normal}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">高流失风险</div>
          <div className="text-3xl font-bold text-orange-600">{stats.highRisk}</div>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索客户名称/编码/电话..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="">全部客户</option>
            <option value="重要保持客户">重要保持客户</option>
            <option value="重要发展客户">重要发展客户</option>
            <option value="重要挽留客户">重要挽留客户</option>
            <option value="重要保护客户">重要保护客户</option>
            <option value="一般价值客户">一般价值客户</option>
            <option value="一般发展客户">一般发展客户</option>
            <option value="一般保持客户">一般保持客户</option>
            <option value="一般挽留客户">一般挽留客户</option>
          </select>
        </div>
      </div>

      {/* 客户列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户编码</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">联系人/电话</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RFM分级</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RFM分数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">累计订单</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">累计金额</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户价值(CLV)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">流失风险</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{customer.customer_code}</td>
                  <td className="px-4 py-3 text-sm font-medium">{customer.customer_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>{customer.contact_person || '-'}</div>
                    <div className="text-gray-500 text-xs">{customer.phone || '-'}</div>
                  </td>
                  <td className="px-4 py-3">{getLevelBadge(customer.customer_level)}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <span className={customer.r_score >= 4 ? 'text-green-600' : customer.r_score <= 2 ? 'text-red-600' : ''}>
                        R:{customer.r_score || 3}
                      </span>
                      {' / '}
                      <span className={customer.f_score >= 4 ? 'text-green-600' : customer.f_score <= 2 ? 'text-red-600' : ''}>
                        F:{customer.f_score || 3}
                      </span>
                      {' / '}
                      <span className={customer.m_score >= 4 ? 'text-green-600' : customer.m_score <= 2 ? 'text-red-600' : ''}>
                        M:{customer.m_score || 3}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      总分: {customer.rfm_total || 333}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{customer.total_order_count || 0} 单</td>
                  <td className="px-4 py-3 text-sm">
                    ¥{(customer.total_order_amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-orange-600 font-medium">
                    ¥{(customer.clv || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{getRiskBadge(customer.churn_risk)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 新建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium">
                {editingCustomer ? '编辑客户' : '新建客户'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  客户名称 *
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={e => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="请输入客户名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系人
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={e => setFormData({...formData, contact_person: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="请输入联系人"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  电话
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="请输入电话"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  地址
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="请输入地址"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    地区
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={e => setFormData({...formData, region: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="如：华东/华南"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    行业
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={e => setFormData({...formData, industry: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="如：医疗/卫生"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={formData.remark}
                  onChange={e => setFormData({...formData, remark: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder="备注信息"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCustomer(null);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
