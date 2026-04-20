import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Calculator,
  Download,
  BarChart3,
} from 'lucide-react';
import type { PurchaseSuggestion, PurchaseParam, OutTrend } from '@/types';

// 所有型号分析结果类型
interface ModelAnalysis {
  model: string;
  current_stock: number;
  avg_daily_out: number;
  reorder_point: number;
  suggest_qty: number;
  stock_days: number;
  lead_days: number;
  min_purchase: number;
  enabled: boolean;
  days_with_data: number;
  total_out_7days: number;
  need_purchase: boolean;
  stock_status: string;
}

const SERVER_URL = 'http://81.70.90.164/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${SERVER_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export default function PurchaseSuggestionPage() {
  const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // 参数设置对话框
  const [paramsDialogOpen, setParamsDialogOpen] = useState(false);
  const [params, setParams] = useState<PurchaseParam[]>([]);
  const [paramsLoading, setParamsLoading] = useState(false);
  const [paramsSaving, setParamsSaving] = useState(false);

  // 详情对话框
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<PurchaseSuggestion | null>(null);
  const [trendData, setTrendData] = useState<OutTrend[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // 分析对话框
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<ModelAnalysis[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // 筛选
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => {
    loadSuggestions();
  }, [statusFilter]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      const query = status ? `?status=${status}` : '';
      const result = await request<PurchaseSuggestion[]>(`/purchase/suggestions${query}`);
      setSuggestions(result);
    } catch (error) {
      console.error('加载采购建议失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算采购建议
  const handleCalculate = async () => {
    try {
      setCalculating(true);
      // 先计算每日统计
      await request('/purchase/calc-daily-stats', { method: 'POST' });
      // 再计算建议
      const result = await request<{ count: number }>('/purchase/calc-suggestions', { method: 'POST' });
      alert(`计算完成，共生成 ${result.count} 条采购建议`);
      loadSuggestions();
    } catch (error: any) {
      alert('计算失败: ' + error.message);
    } finally {
      setCalculating(false);
    }
  };

  // 加载参数
  const loadParams = async () => {
    try {
      setParamsLoading(true);
      const result = await request<PurchaseParam[]>('/purchase/params');
      setParams(result);
    } catch (error) {
      console.error('加载参数失败:', error);
    } finally {
      setParamsLoading(false);
    }
  };

  // 打开参数设置
  const handleOpenParams = () => {
    loadParams();
    setParamsDialogOpen(true);
  };

  // 更新单个参数
  const handleParamChange = (model: string, field: keyof PurchaseParam, value: any) => {
    setParams(prev => prev.map(p => 
      p.model === model ? { ...p, [field]: value } : p
    ));
  };

  // 保存参数
  const handleSaveParams = async () => {
    try {
      setParamsSaving(true);
      await request('/purchase/params/batch', {
        method: 'POST',
        body: JSON.stringify({ params }),
      });
      setParamsDialogOpen(false);
      alert('参数保存成功');
    } catch (error: any) {
      alert('保存失败: ' + error.message);
    } finally {
      setParamsSaving(false);
    }
  };

  // 更新建议状态
  const handleUpdateStatus = async (id: string, status: 'processed' | 'ignored') => {
    try {
      await request(`/purchase/suggestions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      loadSuggestions();
    } catch (error: any) {
      alert('操作失败: ' + error.message);
    }
  };

  // 查看详情
  const handleViewDetail = async (suggestion: PurchaseSuggestion) => {
    setSelectedSuggestion(suggestion);
    setDetailDialogOpen(true);
    
    try {
      setTrendLoading(true);
      const result = await request<OutTrend[]>(`/purchase/model-trend/${encodeURIComponent(suggestion.model)}?days=14`);
      setTrendData(result);
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    } finally {
      setTrendLoading(false);
    }
  };

  // 导出Excel
  const handleExport = () => {
    const headers = ['型号', '当前库存(kg)', '日均出库(kg)', '再订货点(kg)', '建议采购量(kg)', '状态', '生成日期'];
    const rows = suggestions.map(s => [
      s.model,
      s.current_stock,
      s.avg_daily_out,
      s.reorder_point,
      s.suggest_qty,
      s.status === 'pending' ? '待处理' : s.status === 'processed' ? '已处理' : '已忽略',
      new Date(s.created_at).toLocaleDateString('zh-CN')
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `采购建议_${new Date().toLocaleDateString('zh-CN')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 加载所有型号分析数据
  const loadAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      const result = await request<ModelAnalysis[]>('/purchase/all-analysis');
      setAnalysisData(result);
    } catch (error) {
      console.error('加载分析数据失败:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // 打开分析对话框
  const handleOpenAnalysis = () => {
    loadAnalysis();
    setAnalysisDialogOpen(true);
  };

  // 查看型号趋势（从全部分析）
  const handleViewTrend = async (model: string) => {
    setTrendLoading(true);
    setTrendData([]);
    
    // 创建一个临时的分析对象用于显示
    const analysisItem = analysisData.find(a => a.model === model);
    if (analysisItem) {
      setSelectedSuggestion({
        id: '',
        model: analysisItem.model,
        current_stock: analysisItem.current_stock,
        avg_daily_out: analysisItem.avg_daily_out,
        reorder_point: analysisItem.reorder_point,
        suggest_qty: analysisItem.suggest_qty,
        stock_days: analysisItem.stock_days,
        lead_days: analysisItem.lead_days,
        days_with_data: analysisItem.days_with_data,
        status: 'pending',
        created_at: '',
        updated_at: ''
      });
      setDetailDialogOpen(true);
    }
    
    try {
      const result = await request<OutTrend[]>(`/purchase/model-trend/${encodeURIComponent(model)}?days=14`);
      setTrendData(result);
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    } finally {
      setTrendLoading(false);
    }
  };

  // 状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'ignored': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'processed': return '已处理';
      case 'ignored': return '已忽略';
      default: return status;
    }
  };

  // 统计数据
  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const totalSuggestQty = suggestions
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + Number(s.suggest_qty || 0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>采购建议</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenAnalysis}>
                <BarChart3 className="w-4 h-4 mr-2" />
                全部分析
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenParams}>
                <Settings className="w-4 h-4 mr-2" />
                参数设置
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={suggestions.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
              <Button variant="default" size="sm" onClick={handleCalculate} disabled={calculating}>
                <Calculator className="w-4 h-4 mr-2" />
                {calculating ? '计算中...' : '重新计算'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 统计概览 */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">待处理建议</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalSuggestQty.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">建议采购总量(kg)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{suggestions.length}</div>
              <div className="text-sm text-muted-foreground">总建议数</div>
            </div>
          </div>

          {/* 筛选 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">状态筛选：</span>
            <div className="flex gap-2">
              {[
                { value: 'pending', label: '待处理' },
                { value: 'processed', label: '已处理' },
                { value: 'ignored', label: '已忽略' },
                { value: 'all', label: '全部' },
              ].map(opt => (
                <Button
                  key={opt.value}
                  variant={statusFilter === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 表格 */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>型号</TableHead>
                  <TableHead className="text-right">当前库存(kg)</TableHead>
                  <TableHead className="text-right">日均出库(kg)</TableHead>
                  <TableHead className="text-right">再订货点(kg)</TableHead>
                  <TableHead className="text-right">建议采购量(kg)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>生成日期</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : suggestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      暂无采购建议，点击"重新计算"生成
                    </TableCell>
                  </TableRow>
                ) : (
                  suggestions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.model}</TableCell>
                      <TableCell className="text-right">{item.current_stock}</TableCell>
                      <TableCell className="text-right">{item.avg_daily_out}</TableCell>
                      <TableCell className="text-right">{item.reorder_point}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        {item.suggest_qty}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString('zh-CN')}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(item)}
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {item.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(item.id, 'processed')}
                                title="标记已处理"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(item.id, 'ignored')}
                                title="忽略"
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 说明 */}
          <div className="text-sm text-muted-foreground p-4 bg-blue-50 rounded-md">
            <p className="font-medium text-blue-800 mb-2">计算说明：</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li><strong>再订货点</strong> = (备货库存天数 + 进货周期) × 日均出库量</li>
              <li><strong>建议采购量</strong> = 再订货点 - 当前库存</li>
              <li>日均出库量基于最近7天的出库数据计算</li>
              <li>可通过"参数设置"调整每个型号的备货天数和进货周期</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 参数设置对话框 */}
      <Dialog open={paramsDialogOpen} onOpenChange={setParamsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>采购参数设置</DialogTitle>
            <DialogDescription>
              为每个型号设置备货库存天数、进货周期等参数
            </DialogDescription>
          </DialogHeader>

          {paramsLoading ? (
            <div className="py-8 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">加载中...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>型号</TableHead>
                    <TableHead className="text-center w-24">备货天数</TableHead>
                    <TableHead className="text-center w-24">进货周期</TableHead>
                    <TableHead className="text-center w-28">最小采购量</TableHead>
                    <TableHead className="text-center w-20">启用</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {params.map((param) => (
                    <TableRow key={param.model}>
                      <TableCell className="font-medium">{param.model}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={param.stock_days}
                          onChange={(e) => handleParamChange(param.model, 'stock_days', parseInt(e.target.value) || 7)}
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={param.lead_days}
                          onChange={(e) => handleParamChange(param.model, 'lead_days', parseInt(e.target.value) || 3)}
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={param.min_purchase}
                          onChange={(e) => handleParamChange(param.model, 'min_purchase', parseFloat(e.target.value) || 0)}
                          className="w-24 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={param.enabled}
                          onChange={(e) => handleParamChange(param.model, 'enabled', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                <p><strong>参数说明：</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>备货天数</strong>：为保证正常销售，希望库存能覆盖的未来天数</li>
                  <li><strong>进货周期</strong>：从下采购单到货物入库所需的天数</li>
                  <li><strong>最小采购量</strong>：建议采购量不会低于此值</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setParamsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveParams} disabled={paramsSaving}>
              {paramsSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>采购建议详情 - {selectedSuggestion?.model}</DialogTitle>
          </DialogHeader>

          {selectedSuggestion && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">当前库存</div>
                  <div className="text-xl font-semibold">{selectedSuggestion.current_stock} kg</div>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">日均出库</div>
                  <div className="text-xl font-semibold">{selectedSuggestion.avg_daily_out} kg</div>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">再订货点</div>
                  <div className="text-xl font-semibold text-orange-600">{selectedSuggestion.reorder_point} kg</div>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <div className="text-sm text-blue-600">建议采购量</div>
                  <div className="text-xl font-semibold text-blue-600">{selectedSuggestion.suggest_qty} kg</div>
                </div>
              </div>

              {/* 计算依据 */}
              <div className="p-3 bg-muted/30 rounded text-sm">
                <p className="font-medium mb-1">计算依据：</p>
                <p>备货天数: {selectedSuggestion.stock_days}天 + 进货周期: {selectedSuggestion.lead_days}天 = {selectedSuggestion.stock_days + selectedSuggestion.lead_days}天</p>
                <p className="mt-1">日均出库量基于最近7天数据，有{selectedSuggestion.days_with_data}天有出库记录</p>
              </div>

              {/* 趋势图 */}
              <div>
                <h4 className="font-medium mb-2">近14天出库趋势</h4>
                {trendLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : trendData.length === 0 ? (
                  <div className="h-40 flex items-center justify-center border rounded bg-muted/30 text-muted-foreground">
                    暂无趋势数据
                  </div>
                ) : (
                  (() => {
                    const maxWeight = Math.max(...trendData.map(t => Number(t.out_weight || 0)), 0.1);
                    const totalWeight = trendData.reduce((sum, t) => sum + Number(t.out_weight || 0), 0);
                    
                    if (totalWeight === 0) {
                      return (
                        <div className="h-40 flex items-center justify-center border rounded bg-muted/30 text-muted-foreground">
                          近14天无出库记录
                        </div>
                      );
                    }
                    
                    return (
                      <div className="border rounded p-3">
                        <div className="h-36 flex items-end gap-1">
                          {trendData.map((d, i) => {
                            const weight = Number(d.out_weight || 0);
                            const height = (weight / maxWeight) * 100;
                            const hasData = weight > 0;
                            return (
                              <div
                                key={i}
                                className="flex-1 flex flex-col items-center justify-end h-full"
                                title={`${d.date}: ${weight.toFixed(1)}kg (${d.out_count}次)`}
                              >
                                <div className="text-xs text-muted-foreground mb-1">
                                  {hasData ? weight.toFixed(1) : ''}
                                </div>
                                <div
                                  className={`w-full rounded-t transition-all ${hasData ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-200'}`}
                                  style={{ height: `${Math.max(height, 3)}%` }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {trendData.map((d, i) => (
                            <div key={i} className="flex-1 text-center">
                              {i % 3 === 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {d.date.slice(5)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-center text-sm text-muted-foreground">
                          总出库: {totalWeight.toFixed(1)} kg，日均: {(totalWeight / 14).toFixed(2)} kg
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
            {selectedSuggestion?.status === 'pending' && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    handleUpdateStatus(selectedSuggestion.id, 'processed');
                    setDetailDialogOpen(false);
                  }}
                >
                  标记已处理
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleUpdateStatus(selectedSuggestion.id, 'ignored');
                    setDetailDialogOpen(false);
                  }}
                >
                  忽略
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 全部分析对话框 */}
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>所有型号库存分析</DialogTitle>
            <DialogDescription>
              查看所有型号的计算结果，了解库存状态
            </DialogDescription>
          </DialogHeader>

          {analysisLoading ? (
            <div className="py-8 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">计算中...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 汇总统计 */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analysisData.length}</div>
                  <div className="text-sm text-muted-foreground">型号总数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {analysisData.filter(a => a.need_purchase).length}
                  </div>
                  <div className="text-sm text-muted-foreground">需要补货</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysisData.filter(a => a.stock_status === '充足').length}
                  </div>
                  <div className="text-sm text-muted-foreground">库存充足</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {analysisData.filter(a => a.avg_daily_out === 0).length}
                  </div>
                  <div className="text-sm text-muted-foreground">无出库数据</div>
                </div>
              </div>

              {/* 分析表格 */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>型号</TableHead>
                    <TableHead className="text-right">当前库存(kg)</TableHead>
                    <TableHead className="text-right">7天出库(kg)</TableHead>
                    <TableHead className="text-right">日均出库(kg)</TableHead>
                    <TableHead className="text-right">再订货点(kg)</TableHead>
                    <TableHead className="text-right">建议采购(kg)</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-center">参数</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisData.map((item) => (
                    <TableRow key={item.model} className={item.need_purchase ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{item.model}</TableCell>
                      <TableCell className="text-right">{item.current_stock}</TableCell>
                      <TableCell className="text-right">{item.total_out_7days}</TableCell>
                      <TableCell className="text-right">{item.avg_daily_out}</TableCell>
                      <TableCell className="text-right">{item.reorder_point}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.suggest_qty > 0 ? (
                          <span className="text-blue-600">{item.suggest_qty}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          item.need_purchase ? 'bg-red-100 text-red-800' :
                          item.avg_daily_out === 0 ? 'bg-gray-100 text-gray-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {item.stock_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {item.stock_days}天+{item.lead_days}天
                        {!item.enabled && ' (已禁用)'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTrend(item.model)}
                          title="查看趋势"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded">
                <p><strong>说明：</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>再订货点</strong> = (备货天数 + 进货周期) × 日均出库量</li>
                  <li><strong>需要补货</strong>：当前库存 ≤ 再订货点，且有出库数据</li>
                  <li><strong>无出库数据</strong>：最近7天没有出库记录，无法计算日均消耗</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalysisDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
