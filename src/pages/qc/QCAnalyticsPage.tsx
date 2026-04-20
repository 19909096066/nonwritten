import { useState, useEffect } from 'react';

interface QcStandard {
  id: string;
  product_name: string;
  check_item: string;
  standard_type: string;
  min_value: number;
  max_value: number;
  unit: string;
}

interface QcRecord {
  id: string;
  order_no: string;
  product_name: string;
  check_item: string;
  check_value: number;
  result: string;
  inspector: string;
  created_at: string;
}

interface QcDefect {
  id: string;
  defect_type: string;
  defect_level: string;
  quantity: number;
  description: string;
  handle_result: string;
  created_at: string;
}

export default function QCAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'standards' | 'records' | 'defects'>('overview');
  const [standards, setStandards] = useState<QcStandard[]>([]);
  const [records, setRecords] = useState<QcRecord[]>([]);
  const [defects, setDefects] = useState<QcDefect[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // 默认7天

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      if (activeTab === 'overview' || activeTab === 'standards') {
        const res = await fetch('/api/qc/standards', { headers });
        const json = await res.json();
        if (json.code === 0 || json.success) {
          setStandards(json.data || []);
        }
      }
      
      if (activeTab === 'overview' || activeTab === 'records') {
        const res = await fetch(`/api/qc/records?pageSize=100&days=${dateRange}`, { headers });
        const json = await res.json();
        if (json.code === 0 || json.success) {
          setRecords(json.data || []);
        }
      }
      
      if (activeTab === 'overview' || activeTab === 'defects') {
        const res = await fetch('/api/qc/defects?pageSize=100', { headers });
        const json = await res.json();
        if (json.code === 0 || json.success) {
          setDefects(json.data || []);
        }
      }
    } catch (error) {
      console.error('获取数据失败', error);
    }
    setLoading(false);
  };

  // 计算统计数据
  const stats = {
    totalRecords: records.length,
    qualified: records.filter(r => r.result === 'pass' || r.result === 'qualified').length,
    unqualified: records.filter(r => r.result === 'fail' || r.result === 'unqualified').length,
    qualifiedRate: records.length > 0 ? ((records.filter(r => r.result === 'pass' || r.result === 'qualified').length / records.length) * 100).toFixed(1) : '0',
    totalDefects: defects.reduce((s, d) => s + (d.quantity || 0), 0),
    seriousDefects: defects.filter(d => d.defect_level === 'serious' || d.defect_level === '严重').length,
  };

  // 按产品统计合格率
  const productStats = records.reduce((acc: Record<string, { total: number; qualified: number }>, r) => {
    const key = r.product_name || '未知产品';
    if (!acc[key]) acc[key] = { total: 0, qualified: 0 };
    acc[key].total++;
    if (r.result === 'pass' || r.result === 'qualified') acc[key].qualified++;
    return acc;
  }, {});

  // 按日期统计
  const dateStats = records.reduce((acc: Record<string, { total: number; qualified: number }>, r) => {
    const date = r.created_at?.split('T')[0] || '未知';
    if (!acc[date]) acc[date] = { total: 0, qualified: 0 };
    acc[date].total++;
    if (r.result === 'pass' || r.result === 'qualified') acc[date].qualified++;
    return acc;
  }, {});

  // 按缺陷类型统计
  const defectTypeStats = defects.reduce((acc: Record<string, number>, d) => {
    const key = d.defect_type || '未知';
    acc[key] = (acc[key] || 0) + (d.quantity || 0);
    return acc;
  }, {});

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">数据加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🔍 质检分析中心</h1>
          <p className="text-gray-500">质量追踪 / 不良分析 / 标准管理</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="7">最近7天</option>
            <option value="14">最近14天</option>
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
          </select>
          <button 
            onClick={() => fetchData()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'overview', label: '质量概览', icon: '📊' },
          { key: 'standards', label: '质检标准', icon: '📋' },
          { key: 'records', label: '检验记录', icon: '📝' },
          { key: 'defects', label: '次品分析', icon: '⚠️' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 综合概览 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 核心指标 */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">检验批次</div>
              <div className="text-4xl font-bold text-blue-600 mt-2">{stats.totalRecords}</div>
              <div className="text-xs text-gray-400 mt-1">批次</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">合格批次</div>
              <div className="text-4xl font-bold text-green-600 mt-2">{stats.qualified}</div>
              <div className="text-xs text-gray-400 mt-1">批次</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">不合格批次</div>
              <div className="text-4xl font-bold text-red-600 mt-2">{stats.unqualified}</div>
              <div className="text-xs text-gray-400 mt-1">批次</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">合格率</div>
              <div className={`text-4xl font-bold mt-2 ${parseFloat(stats.qualifiedRate) >= 95 ? 'text-green-600' : parseFloat(stats.qualifiedRate) >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                {stats.qualifiedRate}%
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">次品总量</div>
              <div className="text-4xl font-bold text-orange-600 mt-2">{stats.totalDefects}</div>
              <div className="text-xs text-gray-400 mt-1">件/米</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* 合格率趋势 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">📈 合格率趋势</h3>
              <div className="h-64 flex items-end gap-2">
                {Object.entries(dateStats).slice(-14).map(([date, data]: [string, any], idx) => {
                  const rate = data.total > 0 ? (data.qualified / data.total * 100) : 0;
                  const height = rate;
                  const color = rate >= 95 ? 'bg-green-500' : rate >= 90 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end">
                      <div className={`w-full ${color} rounded-t`} style={{ height: `${height}%`, minHeight: '4px' }}></div>
                      <div className="text-xs text-gray-400 mt-1">{formatDate(date)}</div>
                      <div className="text-xs font-medium">{rate.toFixed(0)}%</div>
                    </div>
                  );
                })}
                {Object.keys(dateStats).length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-gray-400">暂无数据</div>
                )}
              </div>
            </div>

            {/* 产品合格率分布 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">🏭 产品合格率分布</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(productStats).map(([product, data]: [string, any], idx) => {
                  const rate = data.total > 0 ? (data.qualified / data.total * 100) : 0;
                  const color = rate >= 95 ? 'bg-green-500' : rate >= 90 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-32 text-sm truncate">{product}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div className={`${color} h-4 rounded-full`} style={{ width: `${rate}%` }}></div>
                      </div>
                      <div className="w-16 text-right text-sm">{rate.toFixed(1)}%</div>
                      <div className="w-12 text-right text-xs text-gray-400">({data.total})</div>
                    </div>
                  );
                })}
                {Object.keys(productStats).length === 0 && (
                  <div className="text-center text-gray-400 py-4">暂无数据</div>
                )}
              </div>
            </div>
          </div>

          {/* 缺陷类型分布 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">⚠️ 缺陷类型分布</h3>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(defectTypeStats).map(([type, count]: [string, any], idx) => (
                <div key={idx} className="border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{count}</div>
                  <div className="text-sm text-gray-500 mt-1">{type}</div>
                </div>
              ))}
              {Object.keys(defectTypeStats).length === 0 && (
                <div className="col-span-4 text-center text-gray-400 py-4">暂无缺陷数据</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 质检标准 */}
      {activeTab === 'standards' && (
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-4 border-b">
            <h3 className="font-bold">📋 质检标准配置</h3>
          </div>
          {standards.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-5xl mb-2">📭</div>
              <div>暂无质检标准</div>
              <div className="text-sm mt-1">请先在质检标准页面添加标准</div>
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs">产品名称</th>
                  <th className="px-4 py-2 text-left text-xs">检验项目</th>
                  <th className="px-4 py-2 text-left text-xs">标准类型</th>
                  <th className="px-4 py-2 text-right text-xs">最小值</th>
                  <th className="px-4 py-2 text-right text-xs">最大值</th>
                  <th className="px-4 py-2 text-left text-xs">单位</th>
                </tr>
              </thead>
              <tbody>
                {standards.map((std, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{std.product_name}</td>
                    <td className="px-4 py-2 text-sm">{std.check_item}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        std.standard_type === 'range' ? 'bg-blue-100 text-blue-800' : 
                        std.standard_type === 'min' ? 'bg-green-100 text-green-800' : 
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {std.standard_type === 'range' ? '范围' : std.standard_type === 'min' ? '最小值' : '最大值'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-right">{std.min_value ?? '-'}</td>
                    <td className="px-4 py-2 text-sm text-right">{std.max_value ?? '-'}</td>
                    <td className="px-4 py-2 text-sm">{std.unit || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 检验记录 */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-4 border-b">
            <h3 className="font-bold">📝 检验记录（共 {records.length} 条）</h3>
          </div>
          {records.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-5xl mb-2">📭</div>
              <div>暂无检验记录</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs">订单号</th>
                    <th className="px-4 py-2 text-left text-xs">产品名称</th>
                    <th className="px-4 py-2 text-left text-xs">检验项目</th>
                    <th className="px-4 py-2 text-right text-xs">检验值</th>
                    <th className="px-4 py-2 text-left text-xs">结果</th>
                    <th className="px-4 py-2 text-left text-xs">检验员</th>
                    <th className="px-4 py-2 text-left text-xs">检验时间</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 50).map((rec, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{rec.order_no}</td>
                      <td className="px-4 py-2 text-sm">{rec.product_name}</td>
                      <td className="px-4 py-2 text-sm">{rec.check_item}</td>
                      <td className="px-4 py-2 text-sm text-right font-mono">{rec.check_value}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          rec.result === 'pass' || rec.result === 'qualified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {rec.result === 'pass' || rec.result === 'qualified' ? '合格' : '不合格'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{rec.inspector}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{formatDate(rec.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 次品分析 */}
      {activeTab === 'defects' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-4 border-b">
              <h3 className="font-bold">⚠️ 次品记录（共 {defects.length} 条）</h3>
            </div>
            {defects.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-5xl mb-2">✅</div>
                <div>暂无次品记录，质量状况良好！</div>
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs">缺陷类型</th>
                    <th className="px-4 py-2 text-left text-xs">缺陷等级</th>
                    <th className="px-4 py-2 text-right text-xs">数量</th>
                    <th className="px-4 py-2 text-left text-xs">描述</th>
                    <th className="px-4 py-2 text-left text-xs">处理方式</th>
                    <th className="px-4 py-2 text-left text-xs">日期</th>
                  </tr>
                </thead>
                <tbody>
                  {defects.map((def, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium">{def.defect_type}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          def.defect_level === 'serious' || def.defect_level === '严重' ? 'bg-red-100 text-red-800' :
                          def.defect_level === 'major' || def.defect_level === '一般' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {def.defect_level || '轻微'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-mono">{def.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">{def.description}</td>
                      <td className="px-4 py-2 text-sm">{def.handle_result || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{formatDate(def.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 缺陷帕累托图 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">📊 缺陷帕累托分析</h3>
            <div className="space-y-2">
              {Object.entries(defectTypeStats)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([type, count]: [string, any], idx) => {
                  const total = Object.values(defectTypeStats).reduce((s: number, v: any) => s + v, 0) || 1;
                  const pct = (count / total * 100).toFixed(1);
                  const cumulative = Object.entries(defectTypeStats)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, idx + 1)
                    .reduce((s: number, [, v]: [string, any]) => s + v, 0) / total * 100;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 text-center text-sm font-bold">{idx + 1}</div>
                      <div className="w-32 text-sm truncate">{type}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6">
                        <div className="bg-orange-500 h-6 rounded-full flex items-center justify-end pr-2" style={{ width: `${pct}%` }}>
                          <span className="text-xs text-white font-bold">{count}</span>
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm">{pct}%</div>
                      <div className="w-16 text-right text-sm text-blue-600">累计{cumulative.toFixed(0)}%</div>
                    </div>
                  );
                })}
              {Object.keys(defectTypeStats).length === 0 && (
                <div className="text-center text-gray-400 py-4">暂无缺陷数据</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
