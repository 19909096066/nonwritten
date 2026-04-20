import { useEffect, useState } from 'react';
import { getOperationLogs } from '@/db/api';
import type { OperationLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const operationTypeMap: Record<string, string> = {
  IN: '入库',
  OUT: '出库',
  IMPORT: '批量导入',
  USER_ADD: '添加用户',
  USER_EDIT: '编辑用户',
  USER_DELETE: '删除用户',
  QC_ADD: '添加质检',
  QC_EDIT: '编辑质检',
  QC_DELETE: '删除质检',
  LOGIN: '登录',
  LOGOUT: '登出',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const [operationType, setOperationType] = useState('all');
  const [operator, setOperator] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, [page, operationType, operator, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getOperationLogs({
        page,
        pageSize,
        operationType: operationType !== 'all' ? operationType : undefined,
        operator: operator || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('加载日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>操作日志</CardTitle>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={operationType} onValueChange={setOperationType}>
              <SelectTrigger>
                <SelectValue placeholder="操作类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {Object.entries(operationTypeMap).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="操作人"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            />

            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>操作时间</TableHead>
                  <TableHead>操作类型</TableHead>
                  <TableHead>操作人</TableHead>
                  <TableHead>二维码/详情</TableHead>
                  <TableHead>IP地址</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      暂无日志
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.operate_time).toLocaleString('zh-CN')}</TableCell>
                      <TableCell>
                        <Badge>{operationTypeMap[log.operation_type] || log.operation_type}</Badge>
                      </TableCell>
                      <TableCell>{log.operator}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.qr_code ? (
                          <span className="font-mono text-xs">{log.qr_code}</span>
                        ) : (
                          log.detail || '-'
                        )}
                      </TableCell>
                      <TableCell>{log.ip || '-'}</TableCell>
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

          <div className="text-sm text-muted-foreground">
            共 {total} 条记录，第 {page} / {totalPages} 页
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
