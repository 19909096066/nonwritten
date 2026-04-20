import { useEffect, useState } from 'react';
import {
  getQcPurchases,
  createQcPurchase,
  getBatchNumbers,
  getPackageNumbersByBatch,
  getQcStandardByModel,
  createOperationLog,
} from '@/db/api';
import type { QcPurchase } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function QcPurchasePage() {
  const [records, setRecords] = useState<QcPurchase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { profile } = useAuth();

  const [batchNo, setBatchNo] = useState('all');
  const [result, setResult] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [batchOptions, setBatchOptions] = useState<string[]>([]);
  const [packageOptions, setPackageOptions] = useState<{ package_no: string; model: string }[]>([]);

  const [newRecord, setNewRecord] = useState({
    batch_no: '',
    package_no: '',
    material_model: '',
    weight: 0,
    thickness: 0,
    result: 'qualified' as 'qualified' | 'unqualified',
    reason: '',
  });

  useEffect(() => {
    loadBatchOptions();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, batchNo, result, startDate, endDate]);

  useEffect(() => {
    if (newRecord.batch_no) {
      loadPackageOptions(newRecord.batch_no);
    }
  }, [newRecord.batch_no]);

  const loadBatchOptions = async () => {
    try {
      const batches = await getBatchNumbers();
      setBatchOptions(batches);
    } catch (error) {
      console.error('加载批次失败:', error);
    }
  };

  const loadPackageOptions = async (batch: string) => {
    try {
      const packages = await getPackageNumbersByBatch(batch);
      setPackageOptions(packages);
    } catch (error) {
      console.error('加载包号失败:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getQcPurchases({
        page,
        pageSize,
        batchNo: batchNo !== 'all' ? batchNo : undefined,
        result: result !== 'all' ? result : undefined,
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

  const handleAdd = () => {
    setNewRecord({
      batch_no: '',
      package_no: '',
      material_model: '',
      weight: 0,
      thickness: 0,
      result: 'qualified',
      reason: '',
    });
    setDialogOpen(true);
  };

  const handlePackageChange = (packageNo: string) => {
    const pkg = packageOptions.find((p) => p.package_no === packageNo);
    setNewRecord({
      ...newRecord,
      package_no: packageNo,
      material_model: pkg?.model || '',
    });
  };

  const checkQuality = async () => {
    if (!newRecord.material_model) return;

    try {
      const standard = await getQcStandardByModel(newRecord.material_model);
      if (!standard) {
        toast.warning('该型号暂无质检标准');
        return;
      }

      const weightOk =
        newRecord.weight >= standard.weight_tolerance.min &&
        newRecord.weight <= standard.weight_tolerance.max;
      const thicknessOk =
        newRecord.thickness >= standard.thickness_tolerance.min &&
        newRecord.thickness <= standard.thickness_tolerance.max;

      if (weightOk && thicknessOk) {
        setNewRecord({ ...newRecord, result: 'qualified', reason: '' });
        toast.success('质检合格');
      } else {
        const reasons: string[] = [];
        if (!weightOk) reasons.push('克重超出允许偏差');
        if (!thicknessOk) reasons.push('厚度超出允许偏差');
        setNewRecord({ ...newRecord, result: 'unqualified', reason: reasons.join('；') });
        toast.error('质检不合格：' + reasons.join('；'));
      }
    } catch (error) {
      console.error('检查质量失败:', error);
    }
  };

  const handleSave = async () => {
    if (!newRecord.batch_no || !newRecord.package_no || !newRecord.material_model) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      await createQcPurchase({
        time: new Date().toISOString(),
        batch_no: newRecord.batch_no,
        package_no: newRecord.package_no,
        material_model: newRecord.material_model,
        weight: newRecord.weight,
        thickness: newRecord.thickness,
        result: newRecord.result,
        reason: newRecord.reason || null,
        inspector: profile?.name || '',
      });

      await createOperationLog({
        operation_type: 'QC_ADD',
        operator: profile?.name || '',
        detail: `添加采购质检记录：${newRecord.batch_no}-${newRecord.package_no}`,
      });

      toast.success('添加成功');
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>采购质检</CardTitle>
          <div className="flex gap-2">
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
            <Button onClick={handleAdd} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              新增记录
            </Button>
          </div>
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

            <Select value={result} onValueChange={setResult}>
              <SelectTrigger>
                <SelectValue placeholder="检验结果" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部结果</SelectItem>
                <SelectItem value="qualified">合格</SelectItem>
                <SelectItem value="unqualified">不合格</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>检验时间</TableHead>
                  <TableHead>批次号</TableHead>
                  <TableHead>包号</TableHead>
                  <TableHead>型号</TableHead>
                  <TableHead>实测克重(g)</TableHead>
                  <TableHead>实测厚度(mm)</TableHead>
                  <TableHead>结果</TableHead>
                  <TableHead>不合格原因</TableHead>
                  <TableHead>质检员</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(9)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.time).toLocaleString('zh-CN')}</TableCell>
                      <TableCell>{record.batch_no}</TableCell>
                      <TableCell>{record.package_no}</TableCell>
                      <TableCell>{record.material_model}</TableCell>
                      <TableCell>{record.weight}</TableCell>
                      <TableCell>{record.thickness}</TableCell>
                      <TableCell>
                        <Badge variant={record.result === 'qualified' ? 'default' : 'destructive'}>
                          {record.result === 'qualified' ? '合格' : '不合格'}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.reason || '-'}</TableCell>
                      <TableCell>{record.inspector}</TableCell>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增采购质检记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>批次号</Label>
              <Select value={newRecord.batch_no} onValueChange={(v) => setNewRecord({ ...newRecord, batch_no: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择批次号" />
                </SelectTrigger>
                <SelectContent>
                  {batchOptions.map((batch) => (
                    <SelectItem key={batch} value={batch}>
                      {batch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>包号</Label>
              <Select value={newRecord.package_no} onValueChange={handlePackageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择包号" />
                </SelectTrigger>
                <SelectContent>
                  {packageOptions.map((pkg) => (
                    <SelectItem key={pkg.package_no} value={pkg.package_no}>
                      {pkg.package_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>原材料型号</Label>
              <Input value={newRecord.material_model} disabled />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>实测克重(g)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRecord.weight}
                  onChange={(e) => setNewRecord({ ...newRecord, weight: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>实测厚度(mm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRecord.thickness}
                  onChange={(e) => setNewRecord({ ...newRecord, thickness: Number(e.target.value) })}
                />
              </div>
            </div>

            <Button onClick={checkQuality} variant="outline" className="w-full">
              自动判定
            </Button>

            <div className="space-y-2">
              <Label>检验结果</Label>
              <Select
                value={newRecord.result}
                onValueChange={(v: 'qualified' | 'unqualified') => setNewRecord({ ...newRecord, result: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualified">合格</SelectItem>
                  <SelectItem value="unqualified">不合格</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newRecord.result === 'unqualified' && (
              <div className="space-y-2">
                <Label>不合格原因</Label>
                <Input
                  value={newRecord.reason}
                  onChange={(e) => setNewRecord({ ...newRecord, reason: e.target.value })}
                  placeholder="请输入不合格原因"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
