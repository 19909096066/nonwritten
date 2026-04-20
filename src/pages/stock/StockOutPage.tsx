import { useEffect, useState } from 'react';
import { getRawMaterials, getBatchNumbers, getModels } from '@/db/api';
import type { RawMaterial } from '@/types';
import DateQuickSelect from '@/components/common/DateQuickSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw } from 'lucide-react';
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

export default function StockOutPage() {
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
        status: 'out_stock',
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

  const handleRowHover = (e: React.MouseEvent<HTMLTableRowElement>, isHover: boolean) => {
    e.currentTarget.style.backgroundColor = isHover ? '#f8fafc' : 'transparent';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>出库明细</CardTitle>
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
                    <th style={{...styles.thCenter, width: '160px'}}>出库时间</th>
                    <th style={{...styles.thCenter, width: '90px'}}>操作人</th>
                    <th style={{...styles.th, minWidth: '180px'}}>二维码</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(8)].map((_, j) => (
                          <td key={j} style={styles.td}>
                            <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : materials.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...styles.tdCenter, padding: '48px', color: '#94a3b8' }}>
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    materials.map((item) => (
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
                          {item.out_at ? new Date(item.out_at).toLocaleString('zh-CN') : '-'}
                        </td>
                        <td style={styles.tdCenter}>{item.operator || '-'}</td>
                        <td style={{...styles.td, fontSize: '12px', color: '#64748b', fontFamily: 'monospace'}}>
                          {item.qr_code}
                        </td>
                      </tr>
                    ))
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
            <span className="font-semibold">出库总重量：{totalWeight.toFixed(2)} kg</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
