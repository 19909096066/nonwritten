import { useEffect, useState } from 'react';
import { getQcDefects } from '@/db/api';
import type { QcDefect } from '@/types';
import DateQuickSelect from '@/components/common/DateQuickSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function QcDefectPage() {
  const [defects, setDefects] = useState<QcDefect[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const [source, setSource] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateQuickKey, setDateQuickKey] = useState('');

  useEffect(() => {
    loadData();
  }, [page, source, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getQcDefects({
        page,
        pageSize,
        source: source !== 'all' ? source : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setDefects(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const handleDateQuickSelect = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>次品明细</CardTitle>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue placeholder="来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="purchase">采购质检</SelectItem>
                <SelectItem value="production">生产质检</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">快速选择：</span>
            <DateQuickSelect onSelect={handleDateQuickSelect} activeKey={dateQuickKey} />
          </div>

          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]" align="center">来源</TableHead>
                  <TableHead className="w-[160px]" align="center">时间</TableHead>
                  <TableHead className="w-[140px]" align="center">批次号/生产线</TableHead>
                  <TableHead className="w-[120px]" align="center">包号/产品ID</TableHead>
                  <TableHead className="w-[140px]">型号</TableHead>
                  <TableHead>不合格原因</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="table-skeleton h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : defects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  defects.map((defect) => (
                    <TableRow key={defect.id} className="table-row-highlight">
                      <TableCell align="center">
                        <span className={cn(
                          "table-status-badge",
                          defect.source === 'purchase' ? "table-status-info" : "table-status-warning"
                        )}>
                          {defect.source === 'purchase' ? '采购质检' : '生产质检'}
                        </span>
                      </TableCell>
                      <TableCell align="center" className="text-slate-500 text-xs whitespace-nowrap">{new Date(defect.time).toLocaleString('zh-CN')}</TableCell>
                      <TableCell align="center">
                        {defect.source === 'purchase' ? defect.batch_no : `生产线${defect.line}`}
                      </TableCell>
                      <TableCell align="center" className="font-mono text-xs">{defect.package_no}</TableCell>
                      <TableCell>{defect.material_model || '-'}</TableCell>
                      <TableCell className="text-sm">{defect.reason}</TableCell>
                    </TableRow>
                  ))
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
        </CardContent>
      </Card>
    </div>
  );
}
