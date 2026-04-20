import { useEffect, useState } from 'react';
import { getRawMaterials, getBatchNumbers, getModels, createRawMaterial, getRawMaterialByQrCode, parseQrCode } from '@/db/api';
import type { RawMaterial } from '@/types';
import DateQuickSelect from '@/components/common/DateQuickSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// 统一的样式定义
const styles = {
  table: {
    borderCollapse: 'collapse' as const,
    width: 'max-content',
    minWidth: '100%',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: '14px',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    whiteSpace: 'nowrap' as const,
    borderBottom: '1px solid #e2e8f0',
  },
  thCenter: {
    padding: '12px 16px',
    textAlign: 'center' as const,
    fontWeight: 600,
    fontSize: '14px',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    whiteSpace: 'nowrap' as const,
    borderBottom: '1px solid #e2e8f0',
  },
  thRight: {
    padding: '12px 16px',
    textAlign: 'right' as const,
    fontWeight: 600,
    fontSize: '14px',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    whiteSpace: 'nowrap' as const,
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#334155',
    whiteSpace: 'nowrap' as const,
    borderBottom: '1px solid #e2e8f0',
  },
  tdCenter: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#334155',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
    borderBottom: '1px solid #e2e8f0',
  },
  tdRight: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#334155',
    textAlign: 'right' as const,
    whiteSpace: 'nowrap' as const,
    fontVariantNumeric: 'tabular-nums' as const,
    borderBottom: '1px solid #e2e8f0',
  },
  tr: {
    cursor: 'pointer',
  },
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'in_stock':
      return { bg: '#dcfce7', color: '#166534', border: '#86efac', text: '在库' };
    case 'split':
      return { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', text: '已拆包' };
    default:
      return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', text: '已出库' };
  }
};

export default function StockInPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  
  const [batchNo, setBatchNo] = useState('all');
  const [model, setModel] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateQuickKey, setDateQuickKey] = useState('');
  
  const [batchOptions, setBatchOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);

  // 手动入库相关状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseQrCode>>(null);
  const [existMaterial, setExistMaterial] = useState<RawMaterial | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleDateQuickSelect = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  // 打开手动入库对话框
  const handleOpenDialog = () => {
    setQrCodeInput('');
    setParsedData(null);
    setExistMaterial(null);
    setError('');
    setDialogOpen(true);
  };

  // 解析二维码
  const handleParseQrCode = () => {
    setError('');
    setParsedData(null);
    setExistMaterial(null);

    if (!qrCodeInput.trim()) {
      setError('请输入二维码');
      return;
    }

    const parsed = parseQrCode(qrCodeInput.trim());
    if (!parsed) {
      setError('二维码格式不正确');
      return;
    }

    setParsedData(parsed);
  };

  // 检查是否已存在
  const handleCheckExist = async () => {
    if (!qrCodeInput.trim()) return;

    try {
      const exist = await getRawMaterialByQrCode(qrCodeInput.trim());
      setExistMaterial(exist);
    } catch (err) {
      console.error('检查物料失败:', err);
    }
  };

  // 二维码输入变化时自动解析和检查
  const handleQrCodeChange = (value: string) => {
    setQrCodeInput(value);
    setError('');
    setParsedData(null);
    setExistMaterial(null);
  };

  // 输入框失焦时自动解析
  const handleQrCodeBlur = () => {
    if (qrCodeInput.trim()) {
      handleParseQrCode();
      handleCheckExist();
    }
  };

  // 提交入库
  const handleSubmit = async () => {
    if (!parsedData) {
      setError('请先解析二维码');
      return;
    }

    if (existMaterial) {
      setError('该物料已存在，不能重复入库');
      return;
    }

    if (!user?.name) {
      setError('无法获取当前用户信息');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createRawMaterial({
        qr_code: qrCodeInput.trim(),
        batch_no: parsedData.batchNo,
        package_no: parsedData.packageNo,
        model: parsedData.model,
        production_date: parsedData.productionDate,
        weight: parsedData.weight,
        unit: parsedData.unit,
        status: 'in_stock',
        operator: user.name,
        device: 'PC',
        remark: '',
      });

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || '入库失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowHover = (e: React.MouseEvent<HTMLTableRowElement>, isHover: boolean) => {
    e.currentTarget.style.backgroundColor = isHover ? '#f8fafc' : 'transparent';
  };

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
                  <SelectItem key={batch} value={batch}>{batch}</SelectItem>
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
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" placeholder="开始日期" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" placeholder="结束日期" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">快速选择：</span>
            <DateQuickSelect onSelect={handleDateQuickSelect} activeKey={dateQuickKey} />
          </div>

          <div className="flex gap-2">
            <Button onClick={loadData} size="sm"><Search className="w-4 h-4 mr-2" />查询</Button>
            <Button onClick={handleReset} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" />重置</Button>
            <Button onClick={handleOpenDialog} variant="default" size="sm"><Plus className="w-4 h-4 mr-2" />手动入库</Button>
          </div>

          {/* 统计信息 */}
          {!loading && materials.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
              <span className="font-medium text-blue-700 dark:text-blue-300">
                当前页合计: {materials.reduce((sum, item) => sum + Number(item.weight || 0), 0).toFixed(2)} kg
              </span>
              <span className="text-blue-600 dark:text-blue-400">({materials.length} 条记录)</span>
            </div>
          )}

          {/* 表格 */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{...styles.th, minWidth: '200px'}}>批次号</th>
                    <th style={{...styles.thCenter, width: '70px'}}>包号</th>
                    <th style={{...styles.th, minWidth: '120px'}}>型号</th>
                    <th style={{...styles.thCenter, width: '110px'}}>生产日期</th>
                    <th style={{...styles.thRight, width: '90px'}}>重量(kg)</th>
                    <th style={{...styles.thCenter, width: '160px'}}>入库时间</th>
                    <th style={{...styles.thCenter, width: '90px'}}>操作人</th>
                    <th style={{...styles.thCenter, width: '80px'}}>状态</th>
                    <th style={{...styles.th, minWidth: '180px'}}>二维码</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(9)].map((_, j) => (
                          <td key={j} style={styles.td}>
                            <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : materials.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ ...styles.tdCenter, padding: '48px', color: '#94a3b8' }}>
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    materials.map((item) => {
                      const statusStyle = getStatusStyle(item.status);
                      return (
                        <tr 
                          key={item.id} 
                          style={styles.tr}
                          onMouseEnter={(e) => handleRowHover(e, true)}
                          onMouseLeave={(e) => handleRowHover(e, false)}
                        >
                          <td style={styles.td}>{item.batch_no}</td>
                          <td style={styles.tdCenter}>{item.package_no}</td>
                          <td style={styles.td}>{item.model}</td>
                          <td style={styles.tdCenter}>{item.production_date}</td>
                          <td style={styles.tdRight}>{item.weight}</td>
                          <td style={{...styles.tdCenter, fontSize: '13px', color: '#64748b'}}>
                            {new Date(item.created_at).toLocaleString('zh-CN')}
                          </td>
                          <td style={styles.tdCenter}>{item.operator || '-'}</td>
                          <td style={styles.tdCenter}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                              border: `1px solid ${statusStyle.border}`
                            }}>
                              {statusStyle.text}
                            </span>
                          </td>
                          <td style={{...styles.td, fontSize: '12px', color: '#64748b', fontFamily: 'monospace'}}>
                            {item.qr_code}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
                      <PaginationLink onClick={() => setPage(pageNum)} isActive={page === pageNum} className="cursor-pointer">
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

      {/* 手动入库对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>手动入库</DialogTitle>
            <DialogDescription>
              输入物料二维码进行手动入库操作
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">二维码</label>
              <Input
                placeholder="请输入或扫描二维码"
                value={qrCodeInput}
                onChange={(e) => handleQrCodeChange(e.target.value)}
                onBlur={handleQrCodeBlur}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {existMaterial && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  该物料已存在，状态：{existMaterial.status === 'in_stock' ? '在库' : existMaterial.status === 'out_stock' ? '已出库' : '已拆包'}
                </p>
              </div>
            )}

            {parsedData && !existMaterial && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
                <h4 className="font-medium text-green-800">解析结果</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">批次号：</span>{parsedData.batchNo}</div>
                  <div><span className="text-gray-500">包号：</span>{parsedData.packageNo}</div>
                  <div><span className="text-gray-500">型号：</span>{parsedData.model}</div>
                  <div><span className="text-gray-500">重量：</span>{parsedData.weight} kg</div>
                  <div><span className="text-gray-500">生产日期：</span>{parsedData.productionDate}</div>
                  <div><span className="text-gray-500">单位：</span>{parsedData.unit}</div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!parsedData || !!existMaterial || submitting}
            >
              {submitting ? '入库中...' : '确认入库'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
