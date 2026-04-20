import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area
} from 'recharts';
import { TrendingUp, AlertTriangle, Package, Calendar, Download, Filter } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { format, subDays, differenceInDays } from 'date-fns';
import { getModels, getBatchNumbers } from '@/db/api';
import { statsApi, type StockTrendItem, type DeadStockItem } from '@/db/serverApi';

interface StockAnalysisProps {
  dateRange?: DateRange;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// 库存状态颜色
const STATUS_COLORS = {
  normal: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
};

export function StockAnalysis({ dateRange }: StockAnalysisProps) {
  const [stockTrendData, setStockTrendData] = useState<any[]>([]);
  const [ageDistribution, setAgeDistribution] = useState<any[]>([]);
  const [deadStockList, setDeadStockList] = useState<DeadStockItem[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange, selectedModel, selectedBatch]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载筛选选项
      const [modelsData, batchesData] = await Promise.all([
        getModels(),
        getBatchNumbers()
      ]);
      setModels(modelsData || []);
      setBatches(batchesData || []);

      // 并行调用后端统计API
      const [trendResult, ageResult, deadStockResult] = await Promise.all([
        // 库存趋势
        statsApi.getStockTrend({
          days: 30,
          model: selectedModel === 'all' ? undefined : selectedModel,
          batchNo: selectedBatch === 'all' ? undefined : selectedBatch
        }),
        // 库龄分布
        statsApi.getAgeDistribution({
          model: selectedModel === 'all' ? undefined : selectedModel,
          batchNo: selectedBatch === 'all' ? undefined : selectedBatch
        }),
        // 呆滞物料
        statsApi.getDeadStock({
          days: 60,
          model: selectedModel === 'all' ? undefined : selectedModel,
          batchNo: selectedBatch === 'all' ? undefined : selectedBatch,
          page: 1,
          pageSize: 100
        })
      ]);

      // 处理库存趋势数据
      processStockTrend(trendResult);
      
      // 处理库龄分布
      processAgeDistribution(ageResult);
      
      // 设置呆滞物料列表
      setDeadStockList(deadStockResult.data || []);
    } catch (error) {
      console.error('加载库存分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理库存趋势数据（来自后端API）
  const processStockTrend = (data: StockTrendItem[]) => {
    const trendData = data.map(item => ({
      date: format(new Date(item.date), 'MM-dd'),
      库存数量: item.cumulative_count,
      库存重量: Math.round(item.cumulative_weight * 10) / 10,
    }));
    setStockTrendData(trendData);
  };

  // 处理库龄分布数据（来自后端API）
  const processAgeDistribution = (data: { groups: Record<string, { count: number; weight: number }> }) => {
    const groupLabels = ['0-7天', '8-30天', '31-90天', '90天以上'];
    const distributionData = groupLabels.map(name => {
      const group = data.groups[name] || { count: 0, weight: 0 };
      return {
        name,
        数量: group.count,
        重量: Math.round(group.weight * 10) / 10,
      };
    });
    setAgeDistribution(distributionData);
  };

  const handleExport = () => {
    // 导出呆滞预警报表
    const csv = [
      ['批次号', '型号', '包装号', '重量(kg)', '生产日期', '库龄(天)', '风险等级'].join(','),
      ...deadStockList.map(item => {
        const riskLevel = item.age > 120 ? 'danger' : item.age > 90 ? 'warning' : 'normal';
        return [
          item.batch_no,
          item.model,
          item.package_no,
          item.weight,
          format(new Date(item.production_date), 'yyyy-MM-dd'),
          item.age,
          riskLevel === 'danger' ? '高风险' : riskLevel === 'warning' ? '中风险' : '低风险'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `呆滞预警报表_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  // 获取风险等级
  const getRiskLevel = (age: number): 'danger' | 'warning' | 'normal' => {
    if (age > 120) return 'danger';
    if (age > 90) return 'warning';
    return 'normal';
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
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择批次" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部批次</SelectItem>
                {batches.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 库存趋势折线图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            库存趋势分析
          </CardTitle>
          <CardDescription>近30天库存数量与重量变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={stockTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="库存数量" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} />
              <Line yAxisId="right" type="monotone" dataKey="库存重量" stroke="#82ca9d" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 库龄分布分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              库龄分布（数量）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="数量" fill="#8884d8">
                  {ageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              库龄分布（重量kg）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="重量"
                >
                  {ageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 呆滞预警表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                呆滞预警
              </CardTitle>
              <CardDescription>库龄超过60天的物料（共 {deadStockList.length} 条）</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              导出报表
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>批次号</TableHead>
                  <TableHead>型号</TableHead>
                  <TableHead>包装号</TableHead>
                  <TableHead className="text-right">重量(kg)</TableHead>
                  <TableHead>生产日期</TableHead>
                  <TableHead className="text-right">库龄(天)</TableHead>
                  <TableHead>风险等级</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadStockList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      暂无呆滞物料
                    </TableCell>
                  </TableRow>
                ) : (
                  deadStockList.slice(0, 10).map((item) => {
                    const riskLevel = getRiskLevel(item.age);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.batch_no}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell>{item.package_no}</TableCell>
                        <TableCell className="text-right">{item.weight}</TableCell>
                        <TableCell>{item.production_date ? format(new Date(item.production_date), 'yyyy-MM-dd') : '-'}</TableCell>
                        <TableCell className="text-right font-medium">{item.age}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[riskLevel]}>
                            {riskLevel === 'danger' ? '高风险' : riskLevel === 'warning' ? '中风险' : '低风险'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
