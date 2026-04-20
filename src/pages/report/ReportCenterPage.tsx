import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw, Package, ArrowLeftRight, CheckSquare, Users } from 'lucide-react';
import { StockAnalysis } from './StockAnalysis';
import { InOutAnalysis } from './InOutAnalysis';
import { QcAnalysis } from './QcAnalysis';
import { OperationAnalysis } from './OperationAnalysis';
import type { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';

export default function ReportCenterPage() {
  const [activeTab, setActiveTab] = useState('stock');
  const [days, setDays] = useState('30');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // 快捷时间选择
  const handleDaysChange = (value: string) => {
    setDays(value);
    const daysNum = parseInt(value);
    setDateRange({
      from: subDays(new Date(), daysNum),
      to: new Date(),
    });
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = () => {
    // 导出功能由各子模块实现
    const event = new CustomEvent('exportReport');
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和全局筛选 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">数据分析报表中心</h1>
          <p className="text-sm text-muted-foreground mt-1">多维度数据分析与可视化报表</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* 快捷时间筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">时间范围:</span>
            <Select value={days} onValueChange={handleDaysChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">近7天</SelectItem>
                <SelectItem value="30">近30天</SelectItem>
                <SelectItem value="90">近90天</SelectItem>
                <SelectItem value="365">近一年</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          
          <Button variant="default" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 模块选项卡 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>库存分析</span>
          </TabsTrigger>
          <TabsTrigger value="inout" className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            <span>出入库分析</span>
          </TabsTrigger>
          <TabsTrigger value="qc" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            <span>质检分析</span>
          </TabsTrigger>
          <TabsTrigger value="operation" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>操作分析</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-6">
          <StockAnalysis key={`stock-${refreshKey}`} dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="inout" className="mt-6">
          <InOutAnalysis key={`inout-${refreshKey}`} dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="qc" className="mt-6">
          <QcAnalysis key={`qc-${refreshKey}`} dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="operation" className="mt-6">
          <OperationAnalysis key={`operation-${refreshKey}`} dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
