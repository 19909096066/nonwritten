import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import { ArrowDownCircle, ArrowUpCircle, Scissors, TrendingUp, Download, Filter } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { getModels } from '@/db/api';
import { statsApi, type InOutSummary, type HourlyDistributionItem } from '@/db/serverApi';

interface InOutAnalysisProps {
  dateRange?: DateRange;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#00FF00'];

export function InOutAnalysis({ dateRange }: InOutAnalysisProps) {
  const [activeTab, setActiveTab] = useState('inbound');
  const [inboundData, setInboundData] = useState<any[]>([]);
  const [outboundData, setOutboundData] = useState<any[]>([]);
  const [splitData, setSplitData] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [modelDistribution, setModelDistribution] = useState<any[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange, selectedModel]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载型号列表
      const modelsData = await getModels();
      setModels(modelsData || []);

      // 使用后端统计API
      const [summaryResult, hourlyResult] = await Promise.all([
        statsApi.getInOutSummary({
          startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
          model: selectedModel === 'all' ? undefined : selectedModel
        }),
        statsApi.getHourlyDistribution({
          startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
        })
      ]);

      // 处理统计数据
      processSummaryData(summaryResult);
      processHourlyData(hourlyResult);
    } catch (error) {
      console.error('加载出入库分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理汇总数据（来自后端API）
  const processSummaryData = (data: InOutSummary) => {
    // 按操作员统计入库
    const inOperatorStats = data.operatorStats
      .filter(s => s.operation_type === 'IN')
      .reduce((acc, item) => {
        if (!acc[item.operator]) {
          acc[item.operator] = { operator: item.operator, count: 0 };
        }
        acc[item.operator].count += item.count;
        return acc;
      }, {} as Record<string, any>);
    setInboundData(Object.values(inOperatorStats));

    // 按操作员统计出库
    const outOperatorStats = data.operatorStats
      .filter(s => s.operation_type === 'OUT')
      .reduce((acc, item) => {
        if (!acc[item.operator]) {
          acc[item.operator] = { operator: item.operator, count: 0 };
        }
        acc[item.operator].count += item.count;
        return acc;
      }, {} as Record<string, any>);
    setOutboundData(Object.values(outOperatorStats));

    // 按操作员统计拆包（从OTHER类型或detail中判断）
    const splitOperatorStats = data.operatorStats
      .filter(s => s.operation_type === 'SPLIT' || s.operation_type === 'OTHER')
      .reduce((acc, item) => {
        if (!acc[item.operator]) {
          acc[item.operator] = { operator: item.operator, count: 0 };
        }
        acc[item.operator].count += item.count;
        return acc;
      }, {} as Record<string, any>);
    setSplitData(Object.values(splitOperatorStats));
  };

  // 处理小时分布数据（来自后端API）- 用于生成趋势
  const processHourlyData = (data: HourlyDistributionItem[]) => {
    // 按小时聚合为趋势（这里简化处理，实际应该用日期趋势API）
    const trendData = data.map(item => ({
      hour: `${item.hour}:00`,
      入库: item.in_count,
      出库: item.out_count,
      拆包: item.split_count,
    }));
    setDailyTrend(trendData);

    // 从小时数据生成型号分布（简化处理）
    const totalIn = data.reduce((sum, h) => sum + h.in_count, 0);
    const totalOut = data.reduce((sum, h) => sum + h.out_count, 0);
    setModelDistribution([
      { model: '总入库', 入库: totalIn, 出库: 0 },
      { model: '总出库', 入库: 0, 出库: totalOut },
    ]);
  };

  const handleExport = (type: string) => {
    let data: any[];
    let filename: string;
    let headers: string[];

    switch (type) {
      case 'inbound':
        data = inboundData;
        filename = '入库统计报表';
        headers = ['操作员', '入库数量'];
        break;
      case 'outbound':
        data = outboundData;
        filename = '出库统计报表';
        headers = ['操作员', '出库数量'];
        break;
      case 'split':
        data = splitData;
        filename = '拆包统计报表';
        headers = ['操作员', '拆包数量'];
        break;
      default:
        return;
    }

    const csv = [
      headers.join(','),
      ...data.map(item => [item.operator || item.model, item.count].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`;
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
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择型号" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部型号</SelectItem>
                {models.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 出入库趋势图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            出入库趋势分析
          </CardTitle>
          <CardDescription>近30天出入库数量变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="入库" fill="#82ca9d" />
              <Bar dataKey="出库" fill="#8884d8" />
              <Line type="monotone" dataKey="拆包" stroke="#ff7300" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 型号分布对比 */}
      <Card>
        <CardHeader>
          <CardTitle>型号出入库对比</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={modelDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="model" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="入库" fill="#82ca9d" />
              <Bar dataKey="出库" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 详细统计选项卡 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inbound" className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-green-500" />
            入库明细
          </TabsTrigger>
          <TabsTrigger value="outbound" className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-blue-500" />
            出库流向
          </TabsTrigger>
          <TabsTrigger value="split" className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-orange-500" />
            拆包作业
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbound" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>入库统计</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleExport('inbound')}>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={inboundData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="operator" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" name="入库数量" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>操作员</TableHead>
                        <TableHead className="text-right">入库数量</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inboundData.slice(0, 10).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.operator}</TableCell>
                          <TableCell className="text-right font-medium">{item.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outbound" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>出库流向统计</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleExport('outbound')}>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={outboundData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ operator, percent }) => `${operator} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="count"
                    >
                      {outboundData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>操作员</TableHead>
                        <TableHead className="text-right">出库数量</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outboundData.slice(0, 10).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.operator}</TableCell>
                          <TableCell className="text-right font-medium">{item.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="split" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>拆包作业统计</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleExport('split')}>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={splitData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="operator" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ff7300" name="拆包数量" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>操作员</TableHead>
                        <TableHead className="text-right">拆包数量</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {splitData.slice(0, 10).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.operator}</TableCell>
                          <TableCell className="text-right font-medium">{item.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
