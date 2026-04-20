import { useState, useEffect } from 'react';

interface DashboardData {
  // 库存
  totalStock: { count: number; weight: number };
  stockTrend: { date: string; inWeight: number; outWeight: number; stockWeight: number }[];
  stockByModel: { model: string; weight: number }[];
  deadStock: { batch_no: string; model: string; weight: number; stock_days: number }[];
  
  // 客户
  customerStats: { total: number; newThisMonth: number; important: number; highRisk: number };
  customerByLevel: { level: string; count: number }[];
  topCustomers: { name: string; total_amount: number; order_count: number }[];
  
  // 生产
  productionStats: { todayOutput: number; monthOutput: number; pendingOrders: number; completedOrders: number };
  lineStatus: { line_name: string; status: string; active_orders: number }[];
  
  // OEE
  oeeStats: { avgOee: number; excellent: number; good: number; fair: number; poor: number };
  oeeTrend: { date: string; oee: number }[];
  
  // 质检
  qcStats: { pending: number; qualified: number; unqualified: number };
}

export default function BIDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'customer' | 'production' | 'qc'>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      // 并行获取所有数据
      const [
        stockRes, stockTrendRes, stockByModelRes, deadStockRes,
        customerRes, oeeDashboardRes,
        productionRes, lineStatusRes
      ] = await Promise.all([
        fetch('/api/materials?status=in_stock&pageSize=1', { headers }),
        fetch('/api/stats/stock-trend?days=14', { headers }),
        fetch('/api/stats/model-distribution', { headers }),
        fetch('/api/stats/dead-stock?days=30', { headers }),
        fetch('/api/crm/dashboard', { headers }),
        fetch('/api/mes/oee/dashboard', { headers }),
        fetch('/api/mes/dashboard', { headers }),
        fetch('/api/mes/lines', { headers })
      ]);

      const stockJson = await stockRes.json();
      const stockTrendJson = await stockTrendRes.json();
      const stockByModelJson = await stockByModelRes.json();
      const deadStockJson = await deadStockRes.json();
      const customerJson = await customerRes.json();
      const oeeJson = await oeeDashboardRes.json();
      const productionJson = await productionRes.json();
      const lineStatusJson = await lineStatusRes.json();

      setData({
        totalStock: { 
          count: stockJson.total || 0, 
          weight: stockJson.data?.reduce((s: number, m: any) => s + (m.weight || 0), 0) || 0 
        },
        stockTrend: stockTrendJson.data || [],
        stockByModel: stockByModelJson.data || [],
        deadStock: deadStockJson.data?.slice(0, 10) || [],
        customerStats: {
          total: customerJson.data?.total || 0,
          newThisMonth: customerJson.data?.newClients || 0,
          important: customerJson.data?.levelStats?.filter((l: any) => l.customer_level?.startsWith('重要')).reduce((s: number, l: any) => s + l.count, 0) || 0,
          highRisk: customerJson.data?.riskStats?.filter((r: any) => r.churn_risk === 'high').reduce((s: number, r: any) => s + r.count, 0) || 0
        },
        customerByLevel: customerJson.data?.levelStats || [],
        topCustomers: customerJson.data?.topClients || [],
        productionStats: {
          todayOutput: productionJson.data?.todayProduction?.output || 0,
          monthOutput: productionJson.data?.todayProduction?.output || 0,
          pendingOrders: productionJson.data?.lineStatus?.reduce((s: number, l: any) => s + (l.active_orders || 0), 0) || 0,
          completedOrders: 0
        },
        lineStatus: lineStatusJson.data || [],
        oeeStats: {
          avgOee: oeeJson.data?.todayOEE?.reduce((s: number, o: any) => s + (o.avg_oee || 0), 0) / (oeeJson.data?.todayOEE?.length || 1) || 0,
          excellent: oeeJson.data?.oeeDistribution?.find((d: any) => d.grade === 'excellent')?.count || 0,
          good: oeeJson.data?.oeeDistribution?.find((d: any) => d.grade === 'good')?.count || 0,
          fair: oeeJson.data?.oeeDistribution?.find((d: any) => d.grade === 'fair')?.count || 0,
          poor: oeeJson.data?.oeeDistribution?.find((d: any) => d.grade === 'poor')?.count || 0
        },
        oeeTrend: oeeJson.data?.monthTrend || [],
        qcStats: { pending: 0, qualified: 0, unqualified: 0 }
      });
    } catch (error) {
      console.error('获取数据失败', error);
    }
    setLoading(false);
  };

  const formatNumber = (n: number, decimals = 0) => {
    if (n === undefined || n === null) return '0';
    return n.toLocaleString('zh-CN', { maximumFractionDigits: decimals });
  };

  const formatDate = (d: string) => d?.split('T')[0] || d || '';

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
          <h1 className="text-3xl font-bold text-gray-800">📊 BI智能分析中心</h1>
          <p className="text-gray-500">数据驱动决策 / 实时监控 / 预测分析</p>
        </div>
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔄 刷新数据
        </button>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'overview', label: '综合概览', icon: '🏠' },
          { key: 'stock', label: '仓储分析', icon: '📦' },
          { key: 'customer', label: '客户分析', icon: '👥' },
          { key: 'production', label: '生产分析', icon: '🏭' },
          { key: 'qc', label: '质量分析', icon: '✅' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 综合概览 */}
      {activeTab === 'overview' && data && (
        <div className="space-y-6">
          {/* 核心指标卡片 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-80">原材料库存</div>
              <div className="text-4xl font-bold mt-2">{formatNumber(data.totalStock.weight, 2)}<span className="text-lg ml-1">吨</span></div>
              <div className="text-sm opacity-80 mt-1">{formatNumber(data.totalStock.count)} 条记录</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-80">客户总数</div>
              <div className="text-4xl font-bold mt-2">{formatNumber(data.customerStats.total)}<span className="text-lg ml-1">家</span></div>
              <div className="text-sm opacity-80 mt-1">本月新增 {formatNumber(data.customerStats.newThisMonth)} 家</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-80">生产OEE</div>
              <div className="text-4xl font-bold mt-2">{formatNumber(data.oeeStats.avgOee * 100, 1)}<span className="text-lg ml-1">%</span></div>
              <div className="text-sm opacity-80 mt-1">优秀率 {formatNumber(data.oeeStats.excellent)} 次</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-80">今日产量</div>
              <div className="text-4xl font-bold mt-2">{formatNumber(data.productionStats.todayOutput, 2)}<span className="text-lg ml-1">吨</span></div>
              <div className="text-sm opacity-80 mt-1">待执行 {formatNumber(data.productionStats.pendingOrders)} 工单</div>
            </div>
          </div>

          {/* 产线状态 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">🏭 产线状态监控</h3>
            <div className="grid grid-cols-4 gap-4">
              {data.lineStatus.map((line, idx) => (
                <div key={idx} className={`border-2 rounded-xl p-4 ${line.status === 'running' ? 'border-green-500 bg-green-50' : line.status === 'idle' ? 'border-gray-300 bg-gray-50' : 'border-yellow-500 bg-yellow-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{line.line_name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${line.status === 'running' ? 'bg-green-500 text-white' : line.status === 'idle' ? 'bg-gray-400 text-white' : 'bg-yellow-500 text-white'}`}>
                      {line.status === 'running' ? '运行中' : line.status === 'idle' ? '空闲' : '维护'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    活跃工单: <span className="font-bold text-gray-800">{line.active_orders}</span> 个
                  </div>
                </div>
              ))}
              {data.lineStatus.length === 0 && (
                <div className="col-span-4 text-center text-gray-400 py-8">
                  暂无产线数据
                </div>
              )}
            </div>
          </div>

          {/* 客户分级分布 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">👥 客户分级分布</h3>
              <div className="space-y-2">
                {data.customerByLevel.map((item: any, idx: number) => {
                  const total = data.customerByLevel.reduce((s: number, i: any) => s + (i.count || 0), 0) || 1;
                  const pct = ((item.count || 0) / total * 100).toFixed(1);
                  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-gray-400', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-32 text-sm truncate">{item.customer_level || '未知'}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div className={`${colors[idx % colors.length]} h-4 rounded-full`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="w-20 text-right text-sm">{item.count || 0} ({pct}%)</div>
                    </div>
                  );
                })}
                {data.customerByLevel.length === 0 && (
                  <div className="text-center text-gray-400 py-4">暂无客户数据</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">📈 OEE趋势（月度）</h3>
              <div className="h-48 flex items-end justify-between gap-2">
                {data.oeeTrend.map((item: any, idx: number) => {
                  const maxOee = Math.max(...data.oeeTrend.map((d: any) => d.avg_oee || 0), 0.01);
                  const height = ((item.avg_oee || 0) / maxOee * 100).toFixed(1);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-blue-100 rounded-t relative" style={{ height: `${height}%`, minHeight: '4px' }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs">{formatNumber((item.avg_oee || 0) * 100, 0)}%</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">{formatDate(item.shift_date)}</div>
                    </div>
                  );
                })}
                {data.oeeTrend.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-gray-400">暂无OEE数据</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 仓储分析 */}
      {activeTab === 'stock' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-sm text-gray-500">库存总量</h3>
              <div className="text-4xl font-bold text-blue-600 mt-2">{formatNumber(data.totalStock.weight, 2)}<span className="text-lg"> 吨</span></div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-sm text-gray-500">库存批次</h3>
              <div className="text-4xl font-bold text-green-600 mt-2">{formatNumber(data.totalStock.count)}<span className="text-lg"> 条</span></div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-sm text-gray-500">呆滞物料</h3>
              <div className="text-4xl font-bold text-red-600 mt-2">{formatNumber(data.deadStock.length)}<span className="text-lg"> 条</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">📊 库存趋势（14天）</h3>
              <div className="h-64 flex items-end gap-1">
                {data.stockTrend.map((item: any, idx: number) => {
                  const maxVal = Math.max(...data.stockTrend.map((d: any) => d.stockWeight || 0), 1);
                  const height = ((item.stockWeight || 0) / maxVal * 100).toFixed(1);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end">
                      <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}%`, minHeight: '8px' }}></div>
                      <div className="text-xs text-gray-400 mt-1 rotate-0">{item.date?.slice(5)}</div>
                    </div>
                  );
                })}
                {data.stockTrend.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-gray-400">暂无数据</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">🥧 产品分布</h3>
              <div className="space-y-2">
                {data.stockByModel.slice(0, 8).map((item: any, idx: number) => {
                  const total = data.stockByModel.reduce((s: number, i: any) => s + (i.weight || 0), 0) || 1;
                  const pct = ((item.weight || 0) / total * 100).toFixed(1);
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-24 text-sm truncate">{item.model || '未知'}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="w-20 text-right text-sm">{formatNumber(item.weight, 1)}吨</div>
                    </div>
                  );
                })}
                {data.stockByModel.length === 0 && (
                  <div className="text-center text-gray-400 py-4">暂无数据</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">⚠️ 呆滞物料预警（30天以上）</h3>
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs">批次号</th>
                  <th className="px-4 py-2 text-left text-xs">型号</th>
                  <th className="px-4 py-2 text-right text-xs">重量(吨)</th>
                  <th className="px-4 py-2 text-right text-xs">库龄(天)</th>
                </tr>
              </thead>
              <tbody>
                {data.deadStock.map((item: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2 text-sm">{item.batch_no}</td>
                    <td className="px-4 py-2 text-sm">{item.model}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatNumber(item.weight, 2)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <span className={`px-2 py-1 rounded text-xs ${item.stock_days > 60 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {item.stock_days}天
                      </span>
                    </td>
                  </tr>
                ))}
                {data.deadStock.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-4 text-gray-400">暂无呆滞物料</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 客户分析 */}
      {activeTab === 'customer' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">客户总数</div>
              <div className="text-4xl font-bold text-blue-600 mt-2">{formatNumber(data.customerStats.total)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">重要客户</div>
              <div className="text-4xl font-bold text-red-600 mt-2">{formatNumber(data.customerStats.important)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">本月新增</div>
              <div className="text-4xl font-bold text-green-600 mt-2">{formatNumber(data.customerStats.newThisMonth)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">高流失风险</div>
              <div className="text-4xl font-bold text-orange-600 mt-2">{formatNumber(data.customerStats.highRisk)}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">🏆 TOP10 高价值客户</h3>
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs">排名</th>
                  <th className="px-4 py-2 text-left text-xs">客户名称</th>
                  <th className="px-4 py-2 text-right text-xs">订单数</th>
                  <th className="px-4 py-2 text-right text-xs">累计金额</th>
                  <th className="px-4 py-2 text-right text-xs">客户价值(CLV)</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((cust: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium">{cust.customer_name || cust.name}</td>
                    <td className="px-4 py-2 text-right">{formatNumber(cust.total_order_count || cust.order_count || 0)}</td>
                    <td className="px-4 py-2 text-right">¥{formatNumber(cust.total_order_amount || cust.total_amount || 0)}</td>
                    <td className="px-4 py-2 text-right text-orange-600 font-bold">¥{formatNumber(cust.clv || 0)}</td>
                  </tr>
                ))}
                {data.topCustomers.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">暂无客户数据，请先同步客户数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 生产分析 */}
      {activeTab === 'production' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">今日产量</div>
              <div className="text-4xl font-bold text-blue-600 mt-2">{formatNumber(data.productionStats.todayOutput, 2)}<span className="text-lg"> 吨</span></div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">本月产量</div>
              <div className="text-4xl font-bold text-green-600 mt-2">{formatNumber(data.productionStats.monthOutput, 2)}<span className="text-lg"> 吨</span></div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">待生产工单</div>
              <div className="text-4xl font-bold text-orange-600 mt-2">{formatNumber(data.productionStats.pendingOrders)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500">OEE均值</div>
              <div className="text-4xl font-bold text-purple-600 mt-2">{formatNumber(data.oeeStats.avgOee * 100, 1)}<span className="text-lg"> %</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">📊 OEE分布</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-20 text-sm">优秀 (85%+)</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                    <div className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(data.oeeStats.excellent * 10, 4)}%` }}>
                      <span className="text-xs text-white font-bold">{data.oeeStats.excellent}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-sm">良好 (70-85%)</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                    <div className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(data.oeeStats.good * 10, 4)}%` }}>
                      <span className="text-xs text-white font-bold">{data.oeeStats.good}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-sm">一般 (50-70%)</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                    <div className="bg-yellow-500 h-6 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(data.oeeStats.fair * 10, 4)}%` }}>
                      <span className="text-xs text-white font-bold">{data.oeeStats.fair}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-sm">较差 (&lt;50%)</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                    <div className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(data.oeeStats.poor * 10, 4)}%` }}>
                      <span className="text-xs text-white font-bold">{data.oeeStats.poor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">🏭 产线状态</h3>
              <div className="grid grid-cols-2 gap-3">
                {data.lineStatus.map((line, idx) => (
                  <div key={idx} className={`border-2 rounded-lg p-3 ${line.status === 'running' ? 'border-green-500' : 'border-gray-300'}`}>
                    <div className="font-medium">{line.line_name}</div>
                    <div className={`text-sm ${line.status === 'running' ? 'text-green-600' : 'text-gray-500'}`}>
                      {line.status === 'running' ? '● 运行中' : line.status === 'idle' ? '○ 空闲' : '⚠ 维护中'}
                    </div>
                  </div>
                ))}
                {data.lineStatus.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-gray-400">暂无产线数据</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 质量分析 */}
      {activeTab === 'qc' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">✅ 质量分析</h3>
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">🔧</div>
            <p>质检分析功能正在完善中...</p>
            <p className="text-sm mt-2">质检数据来源：qc_records、qc_defects</p>
          </div>
        </div>
      )}
    </div>
  );
}
