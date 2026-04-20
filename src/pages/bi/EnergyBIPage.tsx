import { useState, useEffect } from 'react';

interface EnergyData {
  lineSummary: { line_name: string; line_type: string; total_consumption: number; avg_daily: number }[];
  dailyTrend: { date: string; meter_type: string; value: number }[];
  outputData: { date: string; output_weight: number }[];
}

export default function EnergyBIPage() {
  const [data, setData] = useState<EnergyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/bi/energy?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.code === 0) {
        setData(json.data);
      }
    } catch (error) {
      console.error('获取能源数据失败', error);
    }
    setLoading(false);
  };

  const formatNumber = (n: number, decimals = 0) => {
    if (n === undefined || n === null) return '0';
    return n.toLocaleString('zh-CN', { maximumFractionDigits: decimals });
  };

  // 计算总能耗
  const totalConsumption = data?.lineSummary?.reduce((s, l) => s + Number(l.total_consumption || 0), 0) || 0;
  const avgDaily = totalConsumption / (days || 1);

  // 计算吨产品能耗
  const totalOutput = data?.outputData?.reduce((s, o) => s + Number(o.output_weight || 0), 0) || 0;
  const tonPerConsumption = totalOutput > 0 ? totalConsumption / (totalOutput / 1000) : 0;

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
          <h1 className="text-3xl font-bold text-gray-800">⚡ 能源监控中心</h1>
          <p className="text-gray-500">能耗分析 / 吨产品能耗 / 能源趋势</p>
        </div>
        <div className="flex gap-2">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-3 py-2 border rounded-lg">
            <option value="7">近7天</option>
            <option value="30">近30天</option>
            <option value="90">近90天</option>
          </select>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            🔄 刷新
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 核心指标 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-80">总能耗</div>
            <div className="text-4xl font-bold mt-2">{formatNumber(totalConsumption, 2)}<span className="text-lg ml-1">kWh</span></div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-80">日均能耗</div>
            <div className="text-4xl font-bold mt-2">{formatNumber(avgDaily, 2)}<span className="text-lg ml-1">kWh</span></div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-80">总产量</div>
            <div className="text-4xl font-bold mt-2">{formatNumber(totalOutput, 2)}<span className="text-lg ml-1">吨</span></div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-80">吨产品能耗</div>
            <div className="text-4xl font-bold mt-2">{formatNumber(tonPerConsumption, 2)}<span className="text-lg ml-1">kWh/吨</span></div>
          </div>
        </div>

        {/* 产线能耗分布 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">🏭 产线能耗分布</h3>
          <div className="space-y-3">
            {data?.lineSummary?.map((line, idx) => {
              const pct = totalConsumption > 0 ? (Number(line.total_consumption || 0) / totalConsumption * 100) : 0;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-32 text-sm truncate">{line.line_name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                    <div className="bg-yellow-500 h-6 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="w-24 text-right text-sm">{formatNumber(line.total_consumption, 1)} kWh</div>
                  <div className="w-20 text-right text-xs text-gray-400">({pct.toFixed(1)}%)</div>
                </div>
              );
            })}
            {(!data?.lineSummary || data.lineSummary.length === 0) && (
              <div className="text-center text-gray-400 py-8">暂无数据</div>
            )}
          </div>
        </div>

        {/* 能耗趋势 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">📈 能耗趋势</h3>
          <div className="h-64 flex items-end gap-2">
            {data?.dailyTrend?.slice(-14).map((item, idx) => {
              const maxVal = Math.max(...(data?.dailyTrend?.map(d => Number(d.value || 0)) || [1]));
              const height = maxVal > 0 ? (Number(item.value || 0) / maxVal * 100) : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end">
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}%`, minHeight: '4px' }}></div>
                  <div className="text-xs text-gray-400 mt-1">{item.date?.slice(5)}</div>
                  <div className="text-xs">{formatNumber(item.value, 0)}</div>
                </div>
              );
            })}
            {(!data?.dailyTrend || data.dailyTrend.length === 0) && (
              <div className="flex-1 flex items-center justify-center text-gray-400">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
