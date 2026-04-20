import { useEffect, useState } from 'react';
import { getQcProductions } from '@/db/api';
import type { QcProduction, QcProductionDetail } from '@/types';
import DateQuickSelect from '@/components/common/DateQuickSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function QcProductionPage() {
  const [records, setRecords] = useState<QcProduction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<QcProductionDetail[]>([]);

  const [line, setLine] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateQuickKey, setDateQuickKey] = useState('');

  useEffect(() => {
    loadData();
  }, [page, line, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getQcProductions({
        page,
        pageSize,
        line: line !== 'all' ? line : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setRecords(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const showDetails = (details: QcProductionDetail[]) => {
    setSelectedDetails(details);
    setDetailDialogOpen(true);
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
          <CardTitle>生产质检</CardTitle>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={line} onValueChange={setLine}>
              <SelectTrigger>
                <SelectValue placeholder="生产线" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部生产线</SelectItem>
                <SelectItem value="1">生产线1</SelectItem>
                <SelectItem value="2">生产线2</SelectItem>
                <SelectItem value="3">生产线3</SelectItem>
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
                  <TableHead className="w-[140px]" align="center">日期</TableHead>
                  <TableHead className="w-[120px]" align="center">生产线</TableHead>
                  <TableHead className="w-[120px]" align="center">合格数</TableHead>
                  <TableHead className="w-[120px]" align="center">不合格数</TableHead>
                  <TableHead className="w-[120px]" align="center">合格率</TableHead>
                  <TableHead className="w-[100px]" align="center">操作</TableHead>
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
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id} className="table-row-highlight">
                      <TableCell align="center">{record.date}</TableCell>
                      <TableCell align="center">生产线{record.line}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary"
                          onClick={() => showDetails(record.details.filter((d) => d.result === '合格'))}
                        >
                          {record.qualified_count}
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="link"
                          className="p-0 h-auto text-destructive"
                          onClick={() => showDetails(record.details.filter((d) => d.result === '不合格'))}
                        >
                          {record.unqualified_count}
                        </Button>
                      </TableCell>
                      <TableCell align="center" className="font-medium tabular-nums">{record.rate.toFixed(2)}%</TableCell>
                      <TableCell align="center">
                        <Button variant="ghost" size="sm" onClick={() => showDetails(record.details)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
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

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>质检明细</DialogTitle>
          </DialogHeader>
          <div className="table-container max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead align="center">时间</TableHead>
                  <TableHead align="center">产品ID</TableHead>
                  <TableHead align="center">结果</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                      暂无明细
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedDetails.map((detail, index) => (
                    <TableRow key={index} className="table-row-highlight">
                      <TableCell align="center" className="text-slate-500 text-xs whitespace-nowrap">{new Date(detail.time).toLocaleString('zh-CN')}</TableCell>
                      <TableCell align="center" className="font-mono text-xs">{detail.productId}</TableCell>
                      <TableCell align="center">
                        <span className={cn(
                          "table-status-badge",
                          detail.result === '合格' ? "table-status-success" : "table-status-danger"
                        )}>
                          {detail.result}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
