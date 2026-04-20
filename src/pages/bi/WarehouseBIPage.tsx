import { useState, useEffect } from 'react';

interface WarehouseData {
  stockSummary: { total_batches: number; total_weight: number; model_count: number };
  ageDistribution: { age_range: string; count: number; weight: number }[];
  productDistribution: { model: string; batch_count: number; weight: number }[];
  inOutTrend: { date: string; operation_type: string; count: number; weight: number }[];
  deadStock: any[];
}

export default function WarehouseBIPage() {
  const [data, setData] = useState<WarehouseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/bi/warehouse', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.code === 0) {
        setData(json.data);
      }
    } catch (error) {
      console.error('获取仓储数据失败', error);
    }
    setLoading(false);
  };

  const formatNumber = (n: number, decimals = 0) => {
    if (n === undefined || n === null) return '0';
    return n.toLocaleString('zh-CN', { maximumFractionDigits: decimals });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📦 仓储监控中心</h1>
          <p className="text-gray-500">库存分析 / 库龄分布 / 呆滞预警</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          🔄 刷新
        </button>
      </div>

      <div className="space-y-6">
        {/* 核心指标 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-80">库存总量</div>
            <div className="text-4xl font-bold mt-2">{formatNumber(data?.stockSummary?.total_weight || 0, 2)}<span className="text-lg ml-1">吨</span></div>
            <div className="text-sm opacity-80 mt-1">{formatNumber(data?.stockSummary?.total_batches || 0)} 批次</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-80">产品种类</div>
            <div className="text-4xl font-bold mt-2">{formatNumber(data?.stockSummary?.model_count || 0)}<span className="text-lg ml-1">种</span></div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-80">呆滞物料</div>
            <div className="text-4xl font-bold mt-2">{formatNumber(data?.deadStock?.length || 0)}<span className="text-lg ml-1">条</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 库龄分布 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">📊 库龄分布</h3>
            <div className="space-y-2">
              {data?.ageDistribution?.map((item, idx) => {
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500'];
                const total = data?.ageDistribution?.reduce((s, i) => s + Number(i.weight || 0), 0) || 1;
                const pct = (Number(item.weight || 0) / total * 100).toFixed(1);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-20 text-sm">{item.age_range}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div className={`${colors[idx % colors.length]} h-4 rounded-full`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="w-20 text-right text-sm">{formatNumber(item.weight, 1)}吨</div>
                    <div className="w-16 text-right text-xs text-gray-400">{pct}%</div>
                  </div>
                );
              })}
              {(!data?.ageDistribution || data.ageDistribution.length === 0) && (
                <div className="text-center text-gray-400 py-4">暂无数据</div>
              )}
            </div>
          </div>

          {/* 产品分布TOP10 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">🏭 产品分布 TOP10</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data?.productDistribution?.map((item, idx) => {
                const maxWeight = Math.max(...(data?.productDistribution?.map(p => Number(p.weight || 0)) || [1]));
                const pct = (Number(item.weight || 0) / maxWeight * 100).toFixed(1);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 text-center text-xs font-bold">{idx + 1}</div>
                    <div className="w-24 text-sm truncate">{item.model}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="w-16 text-right text-sm">{formatNumber(item.weight, 0)}</div>
                  </div>
                );
              })}
              {(!data?.productDistribution || data.productDistribution.length === 0) && (
                <div className="text-center text-gray-400 py-4">暂无数据</div>
              )}
            </div>
          </div>
        </div>

        {/* 呆滞物料预警 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">⚠️ 呆滞物料预警（库龄>30天）</h3>
          {data?.deadStock && data.deadStock.length > 0 ? (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs">批次号</th>
                  <th className="px-4 py-2 text-left text-xs">型号</th>
                  <th className="px-4 py-2 text-right text-xs">重量(吨)</th>
                  <th className="px-4 py-2 text-left text-xs">入库日期</th>
                  <th className="px-4 py-2 text-right text-xs">库龄(天)</th>
                </tr>
              </thead>
              <tbody>
                {data.deadStock.slice(0, 10).map((item: any, idx: number) => {
                  const inboundDate = new Date(item.inbound_date);
                  const today = new Date();
                  const days = Math.floor((today.getTime() - inboundDate.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2 text-sm">{item.batch_no}</td>
                      <td className="px-4 py-2 text-sm">{item.model}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatNumber(item.weight, 2)}</td>
                      <td className="px-4 py-2 text-sm">{item.inbound_date?.split('T')[0]}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${days > 60 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {days}天
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-400 py-8">✅ 暂无呆滞物料</div>
          )}
        </div>
      </div>
    </div>
  );
}
