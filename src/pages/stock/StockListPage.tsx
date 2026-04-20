import { useEffect, useState } from 'react';
import { getRawMaterials, getBatchNumbers, getModels } from '@/db/api';
import type { RawMaterial } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function StockListPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  
  // 筛选条件
  const [batchNo, setBatchNo] = useState('all');
  const [model, setModel] = useState('all');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 下拉选项
  const [batchOptions, setBatchOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, batchNo, model, status, startDate, endDate]);

  const loadOptions = async () => {
    try {
      const [batches, models] = await Promise.all([getBatchNumbers(), getModels()]);
      setBatchOptions(batches);
      setModelOptions(models);
    } catch (error) {
      console.error('加载选项失败:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getRawMaterials({
        page,
        pageSize,
        batchNo: batchNo !== 'all' ? batchNo : undefined,
        model: model !== 'all' ? model : undefined,
        status: status !== 'all' ? status : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setMaterials(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBatchNo('all');
    setModel('all');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExport = async () => {
    try {
      toast.info('正在导出数据...');
      // 获取所有数据（不分页）
      const result = await getRawMaterials({
        page: 1,
        pageSize: 10000,
        batchNo: batchNo !== 'all' ? batchNo : undefined,
        model: model !== 'all' ? model : undefined,
        status: status !== 'all' ? status : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      // 生成CSV内容
      const headers = ['二维码', '批次号', '包号', '原材料型号', '生产日期', '重量', '单位', '状态', '入库时间', '出库时间', '操作人', '备注'];
      const rows = result.data.map(m => [
        m.qr_code,
        m.batch_no,
        m.package_no,
        m.model,
        m.production_date,
        m.weight,
        m.unit,
        m.status === 'in_stock' ? '在库' : '已出库',
        new Date(m.created_at).toLocaleString('zh-CN'),
        m.out_at ? new Date(m.out_at).toLocaleString('zh-CN') : '',
        m.operator,
        m.remark || '',
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `库存明细_${new Date().toLocaleDateString('zh-CN')}.csv`;
      link.click();
      toast.success(`成功导出 ${result.data.length} 条数据`);
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>库存明细</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 筛选条件 */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Select value={batchNo} onValueChange={setBatchNo}>
              <SelectTrigger>
                <SelectValue placeholder="批次号" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部批次</SelectItem>
                {batchOptions.map((batch) => (
                  <SelectItem key={batch} value={batch}>
                    {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue placeholder="原材料型号" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部型号</SelectItem>
                {modelOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="in_stock">在库</SelectItem>
                <SelectItem value="out_stock">已出库</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="开始日期"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              type="date"
              placeholder="结束日期"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={loadData} size="sm">
              <Search className="w-4 h-4 mr-2" />
              查询
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              重置
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
          </div>

          {/* 表格 */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>批次号</TableHead>
                  <TableHead>包号</TableHead>
                  <TableHead>型号</TableHead>
                  <TableHead>生产日期</TableHead>
                  <TableHead>重量(kg)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>入库时间</TableHead>
                  <TableHead>出库时间</TableHead>
                  <TableHead>操作人</TableHead>
                  <TableHead>二维码</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(10)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {materials.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.batch_no}</TableCell>
                        <TableCell>{item.package_no}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell>{item.production_date}</TableCell>
                        <TableCell>{item.weight}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'in_stock' ? 'default' : 'secondary'}>
                            {item.status === 'in_stock' ? '在库' : '已出库'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleString('zh-CN')}</TableCell>
                        <TableCell>{item.out_at ? new Date(item.out_at).toLocaleString('zh-CN') : '-'}</TableCell>
                        <TableCell>{item.operator || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{item.qr_code}</TableCell>
                      </TableRow>
                    ))}
                    {materials.length > 0 && (
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={4} className="text-right">合计：</TableCell>
                        <TableCell>
                          {materials.reduce((sum, item) => sum + Number(item.weight || 0), 0).toFixed(2)} kg
                        </TableCell>
                        <TableCell colSpan={5}></TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <div className="text-sm text-muted-foreground">
            共 {total} 条记录，第 {page} / {totalPages} 页
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
