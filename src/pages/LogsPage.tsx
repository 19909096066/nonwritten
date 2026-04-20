import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import DateQuickSelect from '@/components/common/DateQuickSelect';
import { RefreshCw, FileText, Filter } from 'lucide-react';

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
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

const operationTypeMap: Record<string, string> = {
  IN: '入库',
  OUT: '出库',
  SPLIT: '拆包',
  IMPORT: '批量导入',
  USER_ADD: '添加用户',
  USER_EDIT: '编辑用户',
  USER_DELETE: '删除用户',
  user_edit: '编辑用户',
  QC_ADD: '添加质检',
  QC_EDIT: '编辑质检',
  QC_DELETE: '删除质检',
  LOGIN: '登录',
  LOGOUT: '登出',
};

const operationTypeColor: Record<string, string> = {
  IN: 'bg-green-100 text-green-800',
  OUT: 'bg-blue-100 text-blue-800',
  SPLIT: 'bg-purple-100 text-purple-800',
  IMPORT: 'bg-cyan-100 text-cyan-800',
  USER_ADD: 'bg-emerald-100 text-emerald-800',
  USER_EDIT: 'bg-amber-100 text-amber-800',
  USER_DELETE: 'bg-red-100 text-red-800',
  user_edit: 'bg-amber-100 text-amber-800',
  QC_ADD: 'bg-teal-100 text-teal-800',
  QC_EDIT: 'bg-orange-100 text-orange-800',
  QC_DELETE: 'bg-rose-100 text-rose-800',
  LOGIN: 'bg-indigo-100 text-indigo-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
};

// 用户类型
interface Profile {
  id: string;
  name: string;
}

// 操作日志类型
interface OperationLog {
  id: string;
  operation_type: string;
  operator: string;
  qr_code: string | null;
  detail: string | null;
  ip: string | null;
  operate_time: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);

  const [operationType, setOperationType] = useState('all');
  const [operator, setOperator] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateQuickKey, setDateQuickKey] = useState('');

  // 加载用户列表
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await request<Profile[]>('/users');
        setUsers(userList);
      } catch (error) {
        console.error('加载用户列表失败:', error);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, operationType, operator, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));
      if (operationType !== 'all') {
        params.append('operationType', operationType);
      }
      if (operator !== 'all') {
        params.append('operator', operator);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      const data = await request<{ data: OperationLog[]; total: number }>(`/logs?${params.toString()}`);
      setLogs(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('加载日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const handleDateQuickSelect = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    if (start === today && end === today) {
      setDateQuickKey('today');
    } else if (start === yesterday && end === yesterday) {
      setDateQuickKey('yesterday');
    } else {
      setDateQuickKey('');
    }
  };

  const getTypeColor = (type: string) => {
    return operationTypeColor[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    return operationTypeMap[type] || type;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              操作日志
            </span>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 筛选条件 */}
          <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">筛选：</span>
            </div>
            <Select value={operationType} onValueChange={setOperationType}>
              <SelectTrigger className="w-32">
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

            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="操作人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部操作人</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.name}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDateQuickKey(''); }}
              className="w-36"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setDateQuickKey(''); }}
              className="w-36"
            />

            <Button variant="default" size="sm" onClick={loadData}>
              应用筛选
            </Button>
          </div>

          {/* 快速日期选择 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">快速选择：</span>
            <DateQuickSelect onSelect={handleDateQuickSelect} activeKey={dateQuickKey} />
          </div>

          {/* 表格 */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">操作时间</TableHead>
                  <TableHead className="w-[120px]">操作类型</TableHead>
                  <TableHead className="w-[100px]">操作人</TableHead>
                  <TableHead>二维码/详情</TableHead>
                  <TableHead className="w-[140px]">IP地址</TableHead>
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      暂无日志
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(log.operate_time).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(log.operation_type)}>
                          {getTypeLabel(log.operation_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.operator}</TableCell>
                      <TableCell className="truncate max-w-xs">
                        {log.qr_code ? (
                          <span className="font-mono text-xs text-blue-600">{log.qr_code}</span>
                        ) : (
                          <span className="text-muted-foreground">{log.detail || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{log.ip || '-'}</TableCell>
                    </TableRow>
                  ))
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
            共 {total} 条记录，第 {page} / {totalPages || 1} 页
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
