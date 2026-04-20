import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Trophy, Monitor, User, TrendingUp, Download, Medal, Filter } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { statsApi, type OperatorRankingItem, type DeviceLoadItem, type HourlyDistributionItem } from '@/db/serverApi';

interface OperationAnalysisProps {
  dateRange?: DateRange;
}

const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-orange-400',
};

export function OperationAnalysis({ dateRange }: OperationAnalysisProps) {
  const [operatorRanking, setOperatorRanking] = useState<OperatorRankingItem[]>([]);
  const [deviceLoad, setDeviceLoad] = useState<DeviceLoadItem[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<any[]>([]);
  const [operationTypeStats, setOperationTypeStats] = useState<any[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange, selectedOperator]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 使用后端统计API
      const [rankingResult, deviceResult, hourlyResult] = await Promise.all([
        statsApi.getOperatorRanking({
          startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
          limit: 20
        }),
        statsApi.getDeviceLoad({
          startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
          limit: 10
        }),
        statsApi.getHourlyDistribution({
          startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
        })
      ]);

      // 设置操作员列表
      const operatorSet = new Set(rankingResult.map(r => r.operator).filter(Boolean));
      setOperators(Array.from(operatorSet));

      // 设置操作员排行
      setOperatorRanking(rankingResult);

      // 处理设备负载数据
      processDeviceLoadData(deviceResult);

      // 处理小时分布数据
      processHourlyData(hourlyResult);

      // 处理操作类型统计
      processOperationTypeStatsData(rankingResult);
    } catch (error) {
      console.error('加载操作分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理设备负载数据（来自后端API）
  const processDeviceLoadData = (data: DeviceLoadItem[]) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const deviceLoadData = data.map(d => ({
      ...d,
      usageRate: Math.round((d.count / maxCount) * 100),
    }));
    setDeviceLoad(deviceLoadData);
  };

  // 处理小时分布数据（来自后端API）
  const processHourlyData = (data: HourlyDistributionItem[]) => {
    const hourlyData = data.map(item => ({
      hour: `${item.hour}:00`,
      入库: item.in_count,
      出库: item.out_count,
      拆包: item.split_count,
    }));
    setHourlyDistribution(hourlyData);
  };

  // 处理操作类型统计（从排行数据聚合）
  const processOperationTypeStatsData = (data: OperatorRankingItem[]) => {
    const typeTotals = {
      'IN': 0,
      'OUT': 0,
      'SPLIT': 0,
      'OTHER': 0,
    };

    data.forEach(item => {
      typeTotals['IN'] += item.in_count;
      typeTotals['OUT'] += item.out_count;
      typeTotals['SPLIT'] += item.split_count;
      typeTotals['OTHER'] += item.other_count;
    });

    const typeLabels: Record<string, string> = {
      'IN': '入库',
      'OUT': '出库',
      'SPLIT': '拆包',
      'OTHER': '其他',
    };

    const radarData = Object.entries(typeTotals)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type,
        label: typeLabels[type] || type,
        count,
      }));

    setOperationTypeStats(radarData);
  };

  const handleExport = () => {
    const csv = [
      ['操作员', '总操作数', '入库', '出库', '拆包', '其他'].join(','),
      ...operatorRanking.map(item => [
        item.operator,
        item.total_count,
        item.in_count,
        item.out_count,
        item.split_count,
        item.other_count
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `操作员绩效报表_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* 筛选条件 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">筛选条件:</span>
            </div>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择操作员" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部操作员</SelectItem>
                {operators.map(op => (
                  <SelectItem key={op} value={op}>{op}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 操作员绩效排行榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  操作员绩效排行榜
                </CardTitle>
                <CardDescription>按操作数量统计</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={operatorRanking.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="operator" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="in_count" name="入库" stackId="a" fill="#82ca9d" />
                <Bar dataKey="out_count" name="出库" stackId="a" fill="#8884d8" />
                <Bar dataKey="split_count" name="拆包" stackId="a" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 前三名卡片 */}
        <div className="space-y-4">
          {operatorRanking.slice(0, 3).map((item, index) => (
            <Card key={index} className={index === 0 ? 'border-yellow-300 bg-yellow-50/50' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : 'bg-orange-100'
                  }`}>
                    {index === 0 ? (
                      <Medal className="w-6 h-6 text-yellow-500" />
                    ) : index === 1 ? (
                      <Medal className="w-6 h-6 text-gray-400" />
                    ) : (
                      <Medal className="w-6 h-6 text-orange-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.operator}</p>
                    <p className="text-sm text-muted-foreground">{item.total_count} 次操作</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 设备使用负载 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            设备使用负载统计
          </CardTitle>
          <CardDescription>各设备操作次数及使用率</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {deviceLoad.slice(0, 8).map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.device}</span>
                    <span className="text-sm text-muted-foreground">{item.count} 次</span>
                  </div>
                  <Progress value={item.usageRate} className="h-2" />
                </div>
              ))}
            </div>
            
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceLoad}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="count"
                >
                  {deviceLoad.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 时间分布和操作类型 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>操作时间分布</CardTitle>
            <CardDescription>24小时操作分布</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="入库" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="出库" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="拆包" stroke="#ff7300" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>操作类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={operationTypeStats}>
                <PolarGrid />
                <PolarAngleAxis dataKey="label" />
                <PolarRadiusAxis />
                <Radar name="操作次数" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 详细排行表格 */}
      <Card>
        <CardHeader>
          <CardTitle>操作员绩效明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">排名</TableHead>
                  <TableHead>操作员</TableHead>
                  <TableHead className="text-right">总操作数</TableHead>
                  <TableHead className="text-right">入库</TableHead>
                  <TableHead className="text-right">出库</TableHead>
                  <TableHead className="text-right">拆包</TableHead>
                  <TableHead className="text-right">其他</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operatorRanking.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  operatorRanking.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {index < 3 ? (
                          <span className={`text-lg font-bold ${RANK_COLORS[index + 1]}`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.operator}</TableCell>
                      <TableCell className="text-right font-bold">{item.total_count}</TableCell>
                      <TableCell className="text-right text-green-600">{item.in_count}</TableCell>
                      <TableCell className="text-right text-blue-600">{item.out_count}</TableCell>
                      <TableCell className="text-right text-orange-600">{item.split_count}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.other_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
