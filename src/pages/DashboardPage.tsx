import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats, getModelStockDistribution, getWeeklyTrend } from '@/db/api';
import type { DashboardStats } from '@/types';
import { Package, TrendingUp, TrendingDown, Smartphone, QrCode } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [modelDistribution, setModelDistribution] = useState<{ model: string; weight: number }[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<{ date: string; inCount: number; outCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, distributionData, trendData] = await Promise.all([
        getDashboardStats(),
        getModelStockDistribution(),
        getWeeklyTrend(),
      ]);
      setStats(statsData);
      setModelDistribution(distributionData);
      setWeeklyTrend(trendData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-muted" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full bg-muted" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-muted" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 移动端访问提示 */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">移动端应用</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  使用手机扫描右侧二维码，或访问 <span className="font-mono text-primary">{window.location.origin}/mobile</span>
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded">
                    <QrCode className="w-3 h-3" />
                    扫码入库
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded">
                    <QrCode className="w-3 h-3" />
                    扫码出库
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded">
                    <QrCode className="w-3 h-3" />
                    扫码查询
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <QRCodeDataUrl text={`${window.location.origin}/mobile`} width={120} />
              <span className="text-xs text-muted-foreground">扫码访问移动端</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总库存卷数</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats?.totalStock || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">当前在库</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总重量</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats?.totalWeight || 0} kg</div>
            <p className="text-xs text-muted-foreground mt-1">在库+拆包合计</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-2 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日入库</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.todayIn || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.todayInWeight || 0} kg</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-2 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日出库</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats?.todayOut || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.todayOutWeight || 0} kg</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-2 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日拆包</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.todaySplit || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.todaySplitWeight || 0} kg</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 型号库存列表 */}
        <Card>
          <CardHeader>
            <CardTitle>各型号库存占比</CardTitle>
          </CardHeader>
          <CardContent>
            {modelDistribution.length > 0 ? (
              <div className="h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-muted-foreground">型号</th>
                      <th className="text-right py-2 text-sm font-medium text-muted-foreground">重量(kg)</th>
                      <th className="text-right py-2 text-sm font-medium text-muted-foreground">占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const totalWeight = modelDistribution.reduce((sum, item) => sum + item.weight, 0);
                      return modelDistribution.map((entry, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-2 text-sm">{entry.model}</td>
                          <td className="py-2 text-sm text-right font-medium">{entry.weight.toLocaleString()}</td>
                          <td className="py-2 text-sm text-right text-muted-foreground">
                            {totalWeight > 0 ? ((entry.weight / totalWeight) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 近7天出入库趋势折线图 */}
        <Card>
          <CardHeader>
            <CardTitle>近7天出入库趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyTrend.length > 0 ? (
              <div style={{ width: '100%', height: '350px' }}>
                <ResponsiveContainer>
                  <LineChart data={weeklyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      allowDecimals={false}
                      domain={[0, 'auto']}
                      padding={{ top: 20 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}月${date.getDate()}日`;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="inCount" 
                      stroke="#22c55e" 
                      name="入库" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#22c55e' }}
                      activeDot={{ r: 6, fill: '#22c55e' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="outCount" 
                      stroke="#ef4444" 
                      name="出库" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#ef4444' }}
                      activeDot={{ r: 6, fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
