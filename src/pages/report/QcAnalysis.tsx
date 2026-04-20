import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Download, Search, Filter } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { getQcPurchases, getQcProductions, getQcDefects, getModels } from '@/db/api';

interface QcAnalysisProps {
  dateRange?: DateRange;
}

const COLORS = ['#00C49F', '#FF8042', '#FFBB28', '#0088FE', '#8884D8'];

export function QcAnalysis({ dateRange }: QcAnalysisProps) {
  const [passRateTrend, setPassRateTrend] = useState<any[]>([]);
  const [defectPareto, setDefectPareto] = useState<any[]>([]);
  const [defectList, setDefectList] = useState<any[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({
    totalQc: 0,
    passCount: 0,
    failCount: 0,
    passRate: 0,
  });

  useEffect(() => {
    loadData();
  }, [dateRange, selectedModel, selectedSource]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载型号列表
      const modelsData = await getModels();
      setModels(modelsData || []);

      // 加载质检数据
      const [purchaseResult, productionResult, defectResult] = await Promise.all([
        getQcPurchases({ page: 1, pageSize: 1000 }),
        getQcProductions({ page: 1, pageSize: 1000 }),
        getQcDefects({ page: 1, pageSize: 1000 })
      ]);

      const purchases = purchaseResult?.data || [];
      const productions = productionResult?.data || [];
      const defects = defectResult?.data || [];

      // 处理合格率趋势
      processPassRateTrend(purchases, productions);
      
      // 处理缺陷帕累托
      processDefectPareto(defects);
      
      // 处理次品明细
      processDefectList(defects);
      
      // 计算汇总统计
      calculateSummaryStats(purchases, productions, defects);
    } catch (error) {
      console.error('加载质检分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPassRateTrend = (purchases: any[], productions: any[]) => {
    const days = 30;
    const trendData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // 统计当天的质检数据
      const dayPurchases = purchases.filter(p => p.qc_date?.startsWith(dateStr));
      const dayProductions = productions.filter(p => p.qc_date?.startsWith(dateStr));
      
      const total = dayPurchases.length + dayProductions.length;
      const passed = dayPurchases.filter(p => p.result === 'qualified').length +
                     dayProductions.filter(p => p.result === 'qualified').length;
      
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
      
      trendData.push({
        date: format(date, 'MM-dd'),
        合格率: passRate,
        检验数量: total,
      });
    }
    
    setPassRateTrend(trendData);
  };

  const processDefectPareto = (defects: any[]) => {
    // 按缺陷类型统计
    const defectTypes = defects.reduce((acc, d) => {
      const type = d.defect_type || '其他缺陷';
      if (!acc[type]) {
        acc[type] = { type, count: 0 };
      }
      acc[type].count++;
      return acc;
    }, {} as Record<string, any>);

    // 排序并计算累计百分比
    const sortedDefects = Object.values(defectTypes)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10) as any[];

    const total = sortedDefects.reduce((sum: number, d: any) => sum + d.count, 0);
    let cumulative = 0;
    
    const paretoData = sortedDefects.map((d: any) => {
      cumulative += d.count;
      return {
        ...d,
        累计占比: Math.round((cumulative / total) * 100),
      };
    });

    setDefectPareto(paretoData);
  };

  const processDefectList = (defects: any[]) => {
    // 筛选和搜索
    let filtered = defects;
    
    if (selectedModel !== 'all') {
      filtered = filtered.filter(d => d.model === selectedModel);
    }
    
    if (selectedSource !== 'all') {
      filtered = filtered.filter(d => d.source === selectedSource);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.batch_no?.includes(searchTerm) ||
        d.model?.includes(searchTerm) ||
        d.defect_type?.includes(searchTerm)
      );
    }

    setDefectList(filtered);
  };

  const calculateSummaryStats = (purchases: any[], productions: any[], defects: any[]) => {
    const total = purchases.length + productions.length;
    const passed = purchases.filter(p => p.result === 'qualified').length +
                   productions.filter(p => p.result === 'qualified').length;
    const failed = defects.length;
    
    setSummaryStats({
      totalQc: total,
      passCount: passed,
      failCount: failed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    });
  };

  const handleExport = () => {
    const csv = [
      ['批次号', '型号', '缺陷类型', '来源', '数量', '日期'].join(','),
      ...defectList.map(item => [
        item.batch_no || '',
        item.model || '',
        item.defect_type || '',
        item.source === 'purchase' ? '采购' : '生产',
        item.quantity || 1,
        format(new Date(item.created_at), 'yyyy-MM-dd')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `次品明细报表_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* 汇总统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总检验次数</p>
                <p className="text-2xl font-bold">{summaryStats.totalQc}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">合格数量</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.passCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">次品数量</p>
                <p className="text-2xl font-bold text-red-600">{summaryStats.failCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">合格率</p>
                <p className="text-2xl font-bold text-primary">{summaryStats.passRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 合格率趋势图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            合格率趋势
          </CardTitle>
          <CardDescription>近30天质检合格率变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={passRateTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="right" dataKey="检验数量" fill="#8884d8" opacity={0.5} />
              <Line yAxisId="left" type="monotone" dataKey="合格率" stroke="#82ca9d" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 缺陷帕累托图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            缺陷帕累托分析
          </CardTitle>
          <CardDescription>缺陷类型分布及累计占比（二八法则分析）</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={defectPareto} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="type" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#FF8042" name="缺陷数量" />
              <Line dataKey="累计占比" stroke="#ff7300" strokeWidth={2} name="累计占比(%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 次品明细查询 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>次品明细查询</CardTitle>
              <CardDescription>共 {defectList.length} 条记录</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选条件 */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索批次号/型号/缺陷类型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
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
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="purchase">采购</SelectItem>
                <SelectItem value="production">生产</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>批次号</TableHead>
                  <TableHead>型号</TableHead>
                  <TableHead>缺陷类型</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead>日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defectList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      暂无次品记录
                    </TableCell>
                  </TableRow>
                ) : (
                  defectList.slice(0, 20).map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell className="font-medium">{item.batch_no || '-'}</TableCell>
                      <TableCell>{item.model || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.defect_type || '未知'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.source === 'purchase' ? 'default' : 'secondary'}>
                          {item.source === 'purchase' ? '采购' : '生产'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity || 1}</TableCell>
                      <TableCell>{format(new Date(item.created_at), 'yyyy-MM-dd')}</TableCell>
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
