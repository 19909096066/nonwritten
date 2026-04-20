import { useEffect, useState } from 'react';
import { getRawMaterials, getBatchNumbers, getModels } from '@/db/api';
import type { RawMaterial } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function StockInPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  
  const [batchNo, setBatchNo] = useState('all');
  const [model, setModel] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [batchOptions, setBatchOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, batchNo, model, startDate, endDate]);

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
        status: 'in_stock', // 只显示在库的
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
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);
  const totalWeight = materials.reduce((sum, item) => sum + Number(item.weight), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>入库明细</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>批次号</TableHead>
                  <TableHead>包号</TableHead>
                  <TableHead>型号</TableHead>
                  <TableHead>生产日期</TableHead>
                  <TableHead>重量(kg)</TableHead>
                  <TableHead>入库时间</TableHead>
                  <TableHead>操作人</TableHead>
                  <TableHead>二维码</TableHead>
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
                ) : materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                        <TableCell>{new Date(item.created_at).toLocaleString('zh-CN')}</TableCell>
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
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

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

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>共 {total} 条记录，第 {page} / {totalPages} 页</span>
            <span className="font-semibold">在库总重量：{totalWeight.toFixed(2)} kg</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
