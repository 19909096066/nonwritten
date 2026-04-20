import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats, getModelStockDistribution, getWeeklyTrend } from '@/db/api';
import type { DashboardStats } from '@/types';
import { Package, TrendingUp, TrendingDown, AlertCircle, Smartphone, QrCode } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
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

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总库存卷数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStock || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">当前在库</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总重量</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWeight || 0} kg</div>
            <p className="text-xs text-muted-foreground mt-1">当前在库</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日入库</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.todayIn || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">卷</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日出库</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.todayOut || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">卷</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">待处理质检</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.pendingQc || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">不合格项</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 型号库存占比饼图 */}
        <Card>
          <CardHeader>
            <CardTitle>各型号库存占比</CardTitle>
          </CardHeader>
          <CardContent>
            {modelDistribution.length > 0 ? (
              <ChartContainer
                config={{
                  weight: {
                    label: '重量',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelDistribution}
                      dataKey="weight"
                      nameKey="model"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.model}: ${entry.weight}kg`}
                    >
                      {modelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
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
              <ChartContainer
                config={{
                  inCount: {
                    label: '入库',
                    color: 'hsl(var(--chart-1))',
                  },
                  outCount: {
                    label: '出库',
                    color: 'hsl(var(--chart-2))',
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="inCount" stroke="hsl(var(--chart-1))" name="入库" strokeWidth={2} />
                    <Line type="monotone" dataKey="outCount" stroke="hsl(var(--chart-2))" name="出库" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
