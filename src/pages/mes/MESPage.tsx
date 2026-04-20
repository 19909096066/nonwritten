import { useState, useEffect } from 'react';

interface Line {
  id: string;
  line_code: string;
  line_name: string;
  line_type: string;
  location: string;
  status: string;
  capacity_per_hour: number;
  total_production: number;
  active_orders: number;
}

interface Equipment {
  id: string;
  equipment_code: string;
  equipment_name: string;
  equipment_type: string;
  line_id: string;
  line_name: string;
  status: string;
  model: string;
}

interface OEEData {
  shift_date: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

interface Dashboard {
  lineStatus: Line[];
  todayProduction: { order_count: number; output: number; qualified: number };
  equipmentStatus: { status: string; count: number }[];
  pendingRepairs: number;
  pendingMaintenance: number;
  recentOEE: number;
}

export default function MESPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lines' | 'equipment' | 'oee'>('dashboard');
  const [lines, setLines] = useState<Line[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [oeeData, setOeeData] = useState<OEEData[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLineModal, setShowLineModal] = useState(false);
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [editingEquip, setEditingEquip] = useState<Equipment | null>(null);

  const [lineForm, setLineForm] = useState({
    line_name: '', line_type: '', location: '',
    min_grammage: 0, max_grammage: 999, min_width: 0, max_width: 9999, capacity_per_hour: 1
  });

  const [equipForm, setEquipForm] = useState({
    equipment_name: '', equipment_type: '', line_id: '', model: '', manufacturer: '', serial_number: ''
  });

  useEffect(() => {
    fetchDashboard();
    fetchLines();
    fetchEquipment();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/mes/dashboard', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (data.success) setDashboard(data.data);
    } catch (error) { console.error('获取看板失败', error); }
  };

  const fetchLines = async () => {
    try {
      const res = await fetch('/api/mes/lines', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (data.success) setLines(data.data);
    } catch (error) { console.error('获取产线失败', error); }
    setLoading(false);
  };

  const fetchEquipment = async () => {
    try {
      const res = await fetch('/api/mes/equipment', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (data.success) setEquipment(data.data);
    } catch (error) { console.error('获取设备失败', error); }
  };

  const handleSaveLine = async () => {
    try {
      const url = editingLine ? `/api/mes/lines/${editingLine.id}` : '/api/mes/lines';
      const method = editingLine ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(lineForm)
      });
      if (res.ok) {
        setShowLineModal(false);
        setEditingLine(null);
        fetchLines();
        fetchDashboard();
      }
    } catch (error) { console.error('保存产线失败', error); }
  };

  const handleSaveEquip = async () => {
    try {
      const url = editingEquip ? `/api/mes/equipment/${editingEquip.id}` : '/api/mes/equipment';
      const method = editingEquip ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(equipForm)
      });
      if (res.ok) {
        setShowEquipModal(false);
        setEditingEquip(null);
        fetchEquipment();
      }
    } catch (error) { console.error('保存设备失败', error); }
  };

  const handleDeleteLine = async (id: string) => {
    if (!confirm('确定删除该产线？')) return;
    await fetch(`/api/mes/lines/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    fetchLines();
  };

  const handleDeleteEquip = async (id: string) => {
    if (!confirm('确定删除该设备？')) return;
    await fetch(`/api/mes/equipment/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    fetchEquipment();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      idle: 'bg-gray-100 text-gray-800', running: 'bg-green-100 text-green-800',
      maintaining: 'bg-yellow-100 text-yellow-800', repairing: 'bg-red-100 text-red-800'
    };
    const labels: Record<string, string> = {
      idle: '空闲', running: '运行中', maintaining: '保养中', repairing: '维修中'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[status] || colors.idle}`}>{labels[status] || status}</span>;
  };

  const formatNumber = (n: number) => n?.toLocaleString() || '0';

  if (loading) return <div className="p-6 text-center">加载中...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">MES生产执行系统</h1>
          <p className="text-gray-500 text-sm">产线管理 / 设备管理 / OEE监控</p>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { key: 'dashboard', label: '生产看板' },
          { key: 'lines', label: '产线管理' },
          { key: 'equipment', label: '设备管理' },
          { key: 'oee', label: 'OEE监控' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 border-b-2 ${activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 生产看板 */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* 核心指标 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-sm">今日产量</div>
              <div className="text-3xl font-bold text-blue-600">{formatNumber(dashboard.todayProduction.output)}吨</div>
              <div className="text-xs text-gray-400 mt-1">{dashboard.todayProduction.order_count}个工单</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-sm">今日OEE</div>
              <div className="text-3xl font-bold text-green-600">{((dashboard.recentOEE || 0) * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-400 mt-1">目标85%</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-sm">待处理维修</div>
              <div className="text-3xl font-bold text-orange-600">{dashboard.pendingRepairs}</div>
              <div className="text-xs text-gray-400 mt-1">设备维修单</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-sm">待执行保养</div>
              <div className="text-3xl font-bold text-purple-600">{dashboard.pendingMaintenance}</div>
              <div className="text-xs text-gray-400 mt-1">计划保养任务</div>
            </div>
          </div>

          {/* 产线状态 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">产线状态</h3>
            <div className="grid grid-cols-4 gap-4">
              {dashboard.lineStatus.map(line => (
                <div key={line.id} className="border rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{line.line_name}</span>
                    {getStatusBadge(line.status)}
                  </div>
                  <div className="text-xs text-gray-500">
                    <div>编码: {line.line_code}</div>
                    <div>活跃工单: {line.active_orders}个</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 设备状态 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">设备状态分布</h3>
            <div className="flex gap-4">
              {dashboard.equipmentStatus.map(es => (
                <div key={es.status} className="flex items-center gap-2">
                  {getStatusBadge(es.status)}
                  <span className="font-medium">{es.count}台</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 产线管理 */}
      {activeTab === 'lines' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">产线列表</h3>
            <button
              onClick={() => { setEditingLine(null); setLineForm({ line_name: '', line_type: '', location: '', min_grammage: 0, max_grammage: 999, min_width: 0, max_width: 9999, capacity_per_hour: 1 }); setShowLineModal(true); }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + 新增产线
            </button>
          </div>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs">编码</th>
                <th className="px-4 py-2 text-left text-xs">名称</th>
                <th className="px-4 py-2 text-left text-xs">类型</th>
                <th className="px-4 py-2 text-left text-xs">位置</th>
                <th className="px-4 py-2 text-left text-xs">产能</th>
                <th className="px-4 py-2 text-left text-xs">状态</th>
                <th className="px-4 py-2 text-left text-xs">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lines.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">暂无数据</td></tr>
              ) : lines.map(line => (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{line.line_code}</td>
                  <td className="px-4 py-2 text-sm font-medium">{line.line_name}</td>
                  <td className="px-4 py-2 text-sm">{line.line_type || '-'}</td>
                  <td className="px-4 py-2 text-sm">{line.location || '-'}</td>
                  <td className="px-4 py-2 text-sm">{line.capacity_per_hour}吨/时</td>
                  <td className="px-4 py-2">{getStatusBadge(line.status)}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => { setEditingLine(line); setLineForm({ line_name: line.line_name, line_type: line.line_type || '', location: line.location || '', min_grammage: line.min_grammage, max_grammage: line.max_grammage, min_width: line.min_width, max_width: line.max_width, capacity_per_hour: line.capacity_per_hour }); setShowLineModal(true); }} className="text-blue-600 text-sm mr-3">编辑</button>
                    <button onClick={() => handleDeleteLine(line.id)} className="text-red-600 text-sm">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 设备管理 */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">设备列表</h3>
            <button
              onClick={() => { setEditingEquip(null); setEquipForm({ equipment_name: '', equipment_type: '', line_id: '', model: '', manufacturer: '', serial_number: '' }); setShowEquipModal(true); }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + 新增设备
            </button>
          </div>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs">编码</th>
                <th className="px-4 py-2 text-left text-xs">名称</th>
                <th className="px-4 py-2 text-left text-xs">型号</th>
                <th className="px-4 py-2 text-left text-xs">产线</th>
                <th className="px-4 py-2 text-left text-xs">状态</th>
                <th className="px-4 py-2 text-left text-xs">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {equipment.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">暂无数据</td></tr>
              ) : equipment.map(eq => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{eq.equipment_code}</td>
                  <td className="px-4 py-2 text-sm font-medium">{eq.equipment_name}</td>
                  <td className="px-4 py-2 text-sm">{eq.model || '-'}</td>
                  <td className="px-4 py-2 text-sm">{eq.line_name || '-'}</td>
                  <td className="px-4 py-2">{getStatusBadge(eq.status)}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => { setEditingEquip(eq); setEquipForm({ equipment_name: eq.equipment_name, equipment_type: eq.equipment_type || '', line_id: eq.line_id || '', model: eq.model || '', manufacturer: eq.manufacturer || '', serial_number: eq.serial_number || '' }); setShowEquipModal(true); }} className="text-blue-600 text-sm mr-3">编辑</button>
                    <button onClick={() => handleDeleteEquip(eq.id)} className="text-red-600 text-sm">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* OEE监控 */}
      {activeTab === 'oee' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium mb-4">OEE监控说明</h3>
          <div className="text-gray-600 text-sm space-y-2">
            <p><strong>OEE = 可用率 × 性能率 × 良品率</strong></p>
            <p><strong>可用率</strong> = 有效开机时长 / 负荷时间 （目标: 90%）</p>
            <p><strong>性能率</strong> = 实际产量 / 理论产量 （目标: 95%）</p>
            <p><strong>良品率</strong> = 合格品数量 / 总产量 （目标: 99%）</p>
            <p><strong>世界级OEE标准：</strong>85%以上为优秀</p>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded p-4 text-center">
              <div className="text-3xl font-bold text-green-600">85%+</div>
              <div className="text-sm text-gray-600">优秀</div>
            </div>
            <div className="bg-yellow-50 rounded p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">70-85%</div>
              <div className="text-sm text-gray-600">良好</div>
            </div>
            <div className="bg-red-50 rounded p-4 text-center">
              <div className="text-3xl font-bold text-red-600">&lt;70%</div>
              <div className="text-sm text-gray-600">需改进</div>
            </div>
          </div>
        </div>
      )}

      {/* 产线弹窗 */}
      {showLineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium">{editingLine ? '编辑产线' : '新增产线'}</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">产线名称 *</label>
                <input type="text" value={lineForm.line_name} onChange={e => setLineForm({...lineForm, line_name: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">类型</label>
                  <select value={lineForm.line_type} onChange={e => setLineForm({...lineForm, line_type: e.target.value})} className="w-full px-3 py-2 border rounded">
                    <option value="">请选择</option>
                    <option value="水刺">水刺</option>
                    <option value="针刺">针刺</option>
                    <option value="热轧">热轧</option>
                    <option value="分切">分切</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">位置</label>
                  <input type="text" value={lineForm.location} onChange={e => setLineForm({...lineForm, location: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">小时产能(吨)</label>
                  <input type="number" value={lineForm.capacity_per_hour} onChange={e => setLineForm({...lineForm, capacity_per_hour: Number(e.target.value)})} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">状态</label>
                  <select value={editingLine?.status || 'idle'} onChange={e => setLineForm({...lineForm, status: e.target.value} as any)} className="w-full px-3 py-2 border rounded">
                    <option value="idle">空闲</option>
                    <option value="running">运行中</option>
                    <option value="maintaining">保养中</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowLineModal(false)} className="px-4 py-2 border rounded">取消</button>
              <button onClick={handleSaveLine} className="px-4 py-2 bg-blue-500 text-white rounded">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 设备弹窗 */}
      {showEquipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium">{editingEquip ? '编辑设备' : '新增设备'}</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">设备名称 *</label>
                <input type="text" value={equipForm.equipment_name} onChange={e => setEquipForm({...equipForm, equipment_name: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">类型</label>
                  <select value={equipForm.equipment_type} onChange={e => setEquipForm({...equipForm, equipment_type: e.target.value})} className="w-full px-3 py-2 border rounded">
                    <option value="">请选择</option>
                    <option value="水刺机">水刺机</option>
                    <option value="针刺机">针刺机</option>
                    <option value="热轧机">热轧机</option>
                    <option value="分切机">分切机</option>
                    <option value="打包机">打包机</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">关联产线</label>
                  <select value={equipForm.line_id} onChange={e => setEquipForm({...equipForm, line_id: e.target.value})} className="w-full px-3 py-2 border rounded">
                    <option value="">请选择</option>
                    {lines.map(l => <option key={l.id} value={l.id}>{l.line_name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">型号</label>
                <input type="text" value={equipForm.model} onChange={e => setEquipForm({...equipForm, model: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowEquipModal(false)} className="px-4 py-2 border rounded">取消</button>
              <button onClick={handleSaveEquip} className="px-4 py-2 bg-blue-500 text-white rounded">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
