import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// 内联 Badge 组件
const Badge = ({ className = '', variant = 'default', children, ...props }: { className?: string; variant?: string; children?: React.ReactNode }) => {
  const variantClasses: Record<string, string> = {
    default: 'border-transparent bg-blue-100 text-blue-800',
    secondary: 'border-transparent bg-gray-100 text-gray-800',
    outline: 'border-gray-300 text-gray-700',
    destructive: 'border-transparent bg-red-100 text-red-800',
  };
  return (
    <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant] || variantClasses.default} ${className}`} {...props}>
      {children}
    </div>
  );
};
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  RefreshCw,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  Package,
  Truck,
  Calendar,
  FileSpreadsheet,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

// 清单汇总类型
interface ShippingList {
  id: string;
  batch_no: string;
  shipping_date: string;
  vehicle_plate: string;
  total_count: number;
  pending_count: number;
  matched_count: number;
  manual_count: number;
  created_at: string;
}

// 待入库明细类型
interface ShippingItem {
  id: string;
  list_id: string;
  batch_no: string;
  package_no: string;
  weight: number;
  shipping_date: string;
  vehicle_plate: string;
  status: 'pending' | 'matched' | 'manual';
  matched_at: string | null;
  manual_note: string | null;
  created_at: string;
  matched_stock_id?: string | null;
}

// Excel解析结果类型
interface ParsedExcelItem {
  batch_no: string;
  package_no: string;
  weight: number;
}

// 批次导入数据类型
interface BatchImportData {
  batch_no: string;
  shipping_date: string;
  vehicle_plate: string;
  items: ParsedExcelItem[];
}

// Excel解析结果类型（单工作表）
interface ParsedExcelSheet {
  batch_no: string;
  shipping_date: string;
  vehicle_plate: string;
  items: ParsedExcelItem[];
}

export default function PendingInboundPage() {
  // 数据状态
  const [lists, setLists] = useState<ShippingList[]>([]);
  const [items, setItems] = useState<ShippingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listsLoading, setListsLoading] = useState(true);

  // 筛选状态
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [filterBatchNo, setFilterBatchNo] = useState('');
  const [filterPackageNo, setFilterPackageNo] = useState('');
  const [filterVehiclePlate, setFilterVehiclePlate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'manual'>('pending');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // 对话框状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<BatchImportData | null>(null);
  const [importMultiData, setImportMultiData] = useState<BatchImportData[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<ShippingList | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [unimportedDialogOpen, setUnimportedDialogOpen] = useState(false);
  const [unimportedItems, setUnimportedItems] = useState<any[]>([]);
  const [unimportedLoading, setUnimportedLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLists();
    loadItems();
  }, []);

  // 加载清单汇总
  const loadLists = async () => {
    try {
      setListsLoading(true);
      const result = await request<ShippingList[]>('/shipping/lists?status=all');
      setLists(result);
    } catch (error) {
      console.error('加载清单列表失败:', error);
    } finally {
      setListsLoading(false);
    }
  };

  // 加载待入库明细（分页）
  const loadItems = async (pageNum?: number) => {
    try {
      setLoading(true);
      const pageToUse = pageNum ?? currentPage;
      const params = new URLSearchParams();
      params.append('page', pageToUse.toString());
      params.append('pageSize', pageSize.toString());
      if (selectedListId) params.append('list_id', selectedListId);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterBatchNo) params.append('batch_no', filterBatchNo);
      if (filterPackageNo) params.append('package_no', filterPackageNo);
      if (filterVehiclePlate) params.append('vehicle_plate', filterVehiclePlate);

      const result = await request<{ items: ShippingItem[]; total: number }>(`/shipping/items?${params.toString()}`);
      setItems(result.items);
      setTotalCount(result.total);
    } catch (error) {
      console.error('加载待入库明细失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 分页处理
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadItems(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    setTimeout(() => loadItems(1), 0);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // 刷新数据
  const handleRefresh = async () => {
    await loadLists();
    await loadItems();
  };

  // 解析Excel文件 - 根据固定格式解析
  const parseExcelFile = (file: File): Promise<ParsedExcelSheet[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const results: ParsedExcelSheet[] = [];

          // 车牌号正则
          const platePattern = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]?$/;
          
          // 辅助函数：验证是否是有效的车牌号（排除电话号码）
          const isValidPlateNumber = (str: string): boolean => {
            if (!str || str.length < 6 || str.length > 10) return false;
            if (/^1[3-9]\d{9}$/.test(str)) return false;
            if (/^\d{11}$/.test(str)) return false;
            if (/^\d+$/.test(str)) return false;
            if (!/[A-Za-z]/.test(str)) return false;
            if (platePattern.test(str)) return true;
            if (/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼]/.test(str) && 
                /[A-Za-z]/.test(str) && /[0-9]/.test(str)) {
              return true;
            }
            return false;
          };

          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
            
            // 辅助函数：获取单元格值
            const getCellValue = (row: number, col: number): any => {
              const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
              return cell && cell.v !== undefined && cell.v !== null && cell.v !== '' ? cell.v : null;
            };
            
            // ========== 1. 提取批号（在第2行搜索包含"批号："的单元格）==========
            let batchNo = '';
            
            // 遍历第2行所有单元格，查找包含"批号"的单元格
            for (let col = 0; col <= Math.min(30, range.e.c); col++) {
              const cellVal = getCellValue(1, col); // 第2行（索引1）
              if (cellVal !== null) {
                const cellStr = String(cellVal).trim();
                // 检查是否包含"批号"关键字
                if (cellStr.includes('批号')) {
                  // 使用正则提取批号，支持全角/半角冒号
                  const batchMatch = cellStr.match(/批号\s*[：:]\s*([A-Za-z0-9\-]+)/);
                  if (batchMatch && batchMatch[1]) {
                    batchNo = batchMatch[1].trim();
                    break;
                  }
                }
              }
            }
            
            // 如果没找到，使用工作表名作为批号
            if (!batchNo) {
              batchNo = sheetName.trim();
              console.warn(`工作表 "${sheetName}" 未找到有效批号，使用工作表名作为批号`);
            }
            
            // ========== 2. 提取发货日期（第2行W列，索引22）==========
            let shippingDate = '';
            const dateRaw = getCellValue(1, 22); // 第2行，W列（索引22）
            if (dateRaw !== null) {
              shippingDate = formatDate(dateRaw);
            }
            // 如果没找到，尝试查找其他位置的日期
            if (!shippingDate) {
              // 遍历第2行查找日期值
              for (let col = 0; col <= 30; col++) {
                const val = getCellValue(1, col);
                if (val !== null) {
                  const dateStr = formatDate(val);
                  if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    shippingDate = dateStr;
                    break;
                  }
                }
              }
            }
            
            // ========== 3. 提取承运车牌号（在表格底部查找"承运车号"）==========
            let vehiclePlate = '';
            
            // 在整个表格中查找包含"承运车号"的单元格
            for (let row = 0; row <= range.e.r; row++) {
              for (let col = 0; col <= range.e.c; col++) {
                const cellVal = getCellValue(row, col);
                if (cellVal !== null) {
                  const strVal = String(cellVal).trim();
                  
                  // 检查是否包含"承运车号"
                  if (strVal.includes('承运车号')) {
                    // 情况1："承运车号：川AJY209"在同一个单元格
                    if (strVal.includes('：')) {
                      const parts = strVal.split('：');
                      if (parts.length > 1) {
                        const plate = parts[1].trim();
                        if (isValidPlateNumber(plate)) {
                          vehiclePlate = plate.toUpperCase();
                          break;
                        }
                      }
                    } else if (strVal.includes(':')) {
                      const parts = strVal.split(':');
                      if (parts.length > 1) {
                        const plate = parts[1].trim();
                        if (isValidPlateNumber(plate)) {
                          vehiclePlate = plate.toUpperCase();
                          break;
                        }
                      }
                    }
                    
                    // 情况2："承运车号"单独在一个单元格，车牌号在右侧单元格
                    if (!vehiclePlate) {
                      for (let c = col + 1; c <= col + 5; c++) {
                        const rightVal = getCellValue(row, c);
                        if (rightVal !== null) {
                          const plate = String(rightVal).trim();
                          if (isValidPlateNumber(plate)) {
                            vehiclePlate = plate.toUpperCase();
                            break;
                          }
                        }
                      }
                    }
                  }
                  
                  // 也检查"承运车辆"关键字
                  if (strVal.includes('承运车辆') && !vehiclePlate) {
                    for (let c = col + 1; c <= col + 5; c++) {
                      const rightVal = getCellValue(row, c);
                      if (rightVal !== null) {
                        const plate = String(rightVal).trim();
                        if (isValidPlateNumber(plate)) {
                          vehiclePlate = plate.toUpperCase();
                          break;
                        }
                      }
                    }
                  }
                }
                if (vehiclePlate) break;
              }
              if (vehiclePlate) break;
            }
            
            // ========== 4. 解析明细数据（第4-33行，即索引3-32）==========
            const parsedItems: ParsedExcelItem[] = [];
            
            // 包号列索引：1, 5, 9, 13, 17, 21, 25（每组第2列）
            // 净重列索引：3, 7, 11, 15, 19, 23, 27（每组第4列）
            const packageNoCols = [1, 5, 9, 13, 17, 21, 25];
            const weightCols = [3, 7, 11, 15, 19, 23, 27];
            
            // 遍历数据行（第4-33行，0-based索引3-32）
            for (let row = 3; row <= Math.min(32, range.e.r); row++) {
              // 遍历7组数据
              for (let group = 0; group < 7; group++) {
                const packageNoVal = getCellValue(row, packageNoCols[group]);
                const weightVal = getCellValue(row, weightCols[group]);
                
                if (packageNoVal !== null && weightVal !== null) {
                  const packageNo = String(packageNoVal).trim();
                  const weight = parseFloat(weightVal);
                  
                  // 包号非空，且净重有效
                  if (packageNo && packageNo !== '' && !isNaN(weight) && weight > 0) {
                    parsedItems.push({
                      batch_no: batchNo,
                      package_no: packageNo,
                      weight: parseFloat(weight.toFixed(2))
                    });
                  }
                }
              }
            }

            // 如果解析到了数据，添加到结果
            if (parsedItems.length > 0) {
              results.push({
                batch_no: batchNo,
                shipping_date: shippingDate || new Date().toISOString().split('T')[0],
                vehicle_plate: vehiclePlate || '未知',
                items: parsedItems
              });
            }
          });

          resolve(results);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // 格式化日期
  const formatDate = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'number') {
      // Excel日期序列号
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
      // 尝试解析日期字符串
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return String(value);
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedResults = await parseExcelFile(file);
      
      if (parsedResults.length === 0) {
        alert('未能从文件中解析出有效数据，请检查文件格式');
        return;
      }

      // 显示预览对话框
      if (parsedResults.length === 1) {
        setImportData(parsedResults[0]);
        setImportMultiData(null);
      } else {
        // 多个工作表，保存多批数据
        setImportMultiData(parsedResults);
        // 合并显示预览
        const allItems = parsedResults.flatMap(r => r.items);
        const allVehiclePlates = [...new Set(parsedResults.map(r => r.vehicle_plate))];
        const allBatchNos = [...new Set(parsedResults.map(r => r.batch_no))];
        setImportData({
          batch_no: allBatchNos.join(', '),
          shipping_date: parsedResults[0].shipping_date,
          vehicle_plate: allVehiclePlates.join(', '),
          items: allItems
        });
      }
      setImportDialogOpen(true);
    } catch (error: any) {
      alert('文件解析失败: ' + error.message);
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 确认导入
  const handleConfirmImport = async (force: boolean = false) => {
    if (!importData) return;

    try {
      setImporting(true);
      
      // 如果有多个工作表数据，分别导入
      if (importMultiData && importMultiData.length > 1) {
        let totalItems = 0;
        let totalMatched = 0;
        let totalPending = 0;
        let hasError = false;
        
        for (const batchData of importMultiData) {
          try {
            const result = await request('/shipping/import', {
              method: 'POST',
              body: JSON.stringify({ ...batchData, force })
            }) as { total_items: number; matched_count: number; pending_count: number };
            totalItems += result.total_items;
            totalMatched += result.matched_count;
            totalPending += result.pending_count;
          } catch (err: any) {
            if (err.message.includes('已导入') || err.message.includes('已存在')) {
              const shouldOverwrite = confirm(`该清单已存在，是否覆盖已有数据？\n\n${err.message}`);
              if (shouldOverwrite) {
                try {
                  const result = await request('/shipping/import', {
                    method: 'POST',
                    body: JSON.stringify({ ...batchData, force: true })
                  }) as { total_items: number; matched_count: number; pending_count: number };
                  totalItems += result.total_items;
                  totalMatched += result.matched_count;
                  totalPending += result.pending_count;
                } catch (retryErr: any) {
                  hasError = true;
                  alert('覆盖导入失败: ' + retryErr.message);
                }
              }
            } else {
              hasError = true;
              alert('导入批次失败: ' + err.message);
            }
          }
        }
        
        if (totalItems > 0) {
          alert(`导入完成！共${importMultiData.length}个批次，${totalItems}条记录，已匹配${totalMatched}条，待入库${totalPending}条`);
        } else if (hasError) {
          alert('导入失败，请检查数据格式');
        }
      } else {
        // 单批次导入
        try {
          const result = await request('/shipping/import', {
            method: 'POST',
            body: JSON.stringify({ ...importData, force })
          }) as { total_items: number; matched_count: number; pending_count: number };
          alert(`导入成功！共${result.total_items}条，已匹配${result.matched_count}条，待入库${result.pending_count}条`);
        } catch (err: any) {
          if (err.message.includes('已导入') || err.message.includes('已存在')) {
            const shouldOverwrite = confirm(`该清单已存在，是否覆盖已有数据？\n\n${err.message}`);
            if (shouldOverwrite) {
              try {
                const result = await request('/shipping/import', {
                  method: 'POST',
                  body: JSON.stringify({ ...importData, force: true })
                }) as { total_items: number; matched_count: number; pending_count: number };
                alert(`导入成功！共${result.total_items}条，已匹配${result.matched_count}条，待入库${result.pending_count}条`);
              } catch (retryErr: any) {
                alert('覆盖导入失败: ' + retryErr.message);
              }
            }
          } else {
            throw err;
          }
        }
      }
      
      setImportDialogOpen(false);
      setImportData(null);
      setImportMultiData(null);
      handleRefresh();
    } catch (error: any) {
      alert('导入失败: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  // 刷新匹配
  const handleRefreshMatch = async () => {
    try {
      const result = await request<{ matched_count: number; remaining_pending: number }>('/shipping/refresh-match', {
        method: 'POST',
        body: JSON.stringify({})
      });
      alert(`匹配完成！新匹配${result.matched_count}条，剩余待入库${result.remaining_pending}条`);
      handleRefresh();
    } catch (error: any) {
      alert('刷新失败: ' + error.message);
    }
  };

  // 删除清单
  const handleDeleteList = async (listId: string) => {
    if (!confirm('确定要删除该清单及其所有明细吗？此操作不可恢复。')) return;

    try {
      await request(`/shipping/lists/${listId}`, { method: 'DELETE' });
      alert('删除成功');
      handleRefresh();
    } catch (error: any) {
      alert('删除失败: ' + error.message);
    }
  };

  // 导出
  const handleExport = () => {
    window.open(`${SERVER_URL}/shipping/export?list_id=${selectedListId || ''}`, '_blank');
  };

  // 查看清单详情
  const handleViewListDetail = async (list: ShippingList) => {
    setSelectedList(list);
    setSelectedListId(list.id);
    setDetailDialogOpen(true);
    loadItems();
  };

  // 选择清单筛选
  const handleSelectList = (listId: string | null) => {
    setSelectedListId(listId === selectedListId ? null : listId);
  };

  // 加载已入库未导入发货清单的数据
  const loadUnimportedItems = async () => {
    try {
      setUnimportedLoading(true);
      const result = await request<any[]>('/shipping/unimported');
      setUnimportedItems(result);
      setUnimportedDialogOpen(true);
    } catch (error) {
      console.error('加载未导入数据失败:', error);
      alert('加载失败');
    } finally {
      setUnimportedLoading(false);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'matched': return 'bg-green-100 text-green-800';
      case 'manual': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待入库';
      case 'matched': return '已入库';
      case 'manual': return '手动标记';
      default: return status;
    }
  };

  // 计算统计
  const totalPending = lists.reduce((sum, l) => sum + l.pending_count, 0);
  const totalLists = lists.length;

  return (
    <div className="space-y-4">
      {/* 清单汇总区 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              发货清单汇总
            </span>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="default" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                导入清单
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefreshMatch}>
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新匹配
              </Button>
              {lists.filter(l => l.pending_count === 0).length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setHistoryDialogOpen(true)} className="text-green-600 hover:text-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  已完成({lists.filter(l => l.pending_count === 0).length})
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 统计概览 */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalLists}</div>
              <div className="text-sm text-muted-foreground">清单总数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
              <div className="text-sm text-muted-foreground">待入库总数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {lists.filter(l => l.pending_count === 0).length}
              </div>
              <div className="text-sm text-muted-foreground">已完成清单</div>
            </div>
          </div>

          {/* 清单列表 */}
          {listsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无发货清单，点击"导入清单"开始
            </div>
          ) : (
            (() => {
              // 分组：相同批次号的发货记录合并
              const groupedByBatchNo = lists.reduce((acc, list) => {
                const batchNo = list.batch_no || '未知批次';
                if (!acc[batchNo]) {
                  acc[batchNo] = {
                    batch_no: batchNo,
                    ids: [],
                    total_count: 0,
                    pending_count: 0,
                    matched_count: 0,
                    shipments: [] as { date: string; plate: string; count: number; id: string }[]
                  };
                }
                acc[batchNo].ids.push(list.id);
                acc[batchNo].total_count += list.total_count || 0;
                acc[batchNo].pending_count += list.pending_count || 0;
                acc[batchNo].matched_count += list.matched_count || 0;
                acc[batchNo].shipments.push({
                  date: list.shipping_date || '未知日期',
                  plate: list.vehicle_plate || '未知车牌',
                  count: list.total_count || 0,
                  id: list.id
                });
                return acc;
              }, {} as Record<string, {
                batch_no: string;
                ids: string[];
                total_count: number;
                pending_count: number;
                matched_count: number;
                shipments: { date: string; plate: string; count: number; id: string }[];
              }>);

              // 分离待入库和已完成的
              const pendingGroups = Object.entries(groupedByBatchNo).filter(([_, g]) => g.pending_count > 0);
              const completedGroups = Object.entries(groupedByBatchNo).filter(([_, g]) => g.pending_count === 0);

              return (
                <>
                  {pendingGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>所有清单已完成入库</p>
                      {completedGroups.length > 0 && (
                        <p className="text-sm mt-1">共 {completedGroups.length} 个批次已完成</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pendingGroups.map(([batchNo, group]) => (
                        <Card
                          key={batchNo}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedListId && group.ids.includes(selectedListId) ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => {
                            if (group.ids.length === 1) {
                              handleSelectList(group.ids[0]);
                            }
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-blue-600 truncate" title={batchNo}>
                                  {batchNo}
                                </div>
                                {group.shipments.length > 1 && (
                                  <div className="text-xs text-orange-600 mt-0.5">
                                    共{group.shipments.length}次发货
                                  </div>
                                )}
                                <div className="mt-1.5 space-y-0.5">
                                  {group.shipments.slice(0, 3).map((ship) => (
                                    <div key={ship.id} className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{ship.date}</span>
                                      <Truck className="w-3 h-3 ml-1" />
                                      <span>{ship.plate}</span>
                                      <span className="text-gray-400">({ship.count}包)</span>
                                    </div>
                                  ))}
                                  {group.shipments.length > 3 && (
                                    <div className="text-xs text-gray-400">
                                      ... 还有{group.shipments.length - 3}次发货
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 ml-2 flex-shrink-0">
                                {group.ids.length === 1 && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => { e.stopPropagation(); handleViewListDetail(lists.find(l => l.id === group.ids[0])!); }}
                                      title="查看详情"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteList(group.ids[0]); }}
                                      title="删除"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {group.ids.length > 1 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {group.ids.length}条清单
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                              <span className="text-muted-foreground">总包数: {group.total_count}</span>
                              <span className="text-yellow-600 font-medium">
                                待入库: {group.pending_count}
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${((group.total_count - group.pending_count) / group.total_count * 100)}%` }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              );
            })()
          )}
        </CardContent>
      </Card>

      {/* 待入库明细列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              待入库明细
              {selectedListId && (
                <Badge variant="outline" className="ml-2">
                  已筛选清单
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => { setSelectedListId(null); loadItems(); }}
                  />
                </Badge>
              )}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadUnimportedItems} disabled={unimportedLoading}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                入库未导入
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 筛选条件 */}
          <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">筛选：</span>
            </div>
            <Input
              placeholder="批号"
              value={filterBatchNo}
              onChange={(e) => setFilterBatchNo(e.target.value)}
              className="w-32"
            />
            <Input
              placeholder="包号"
              value={filterPackageNo}
              onChange={(e) => setFilterPackageNo(e.target.value)}
              className="w-32"
            />
            <Input
              placeholder="车牌号"
              value={filterVehiclePlate}
              onChange={(e) => setFilterVehiclePlate(e.target.value)}
              className="w-32"
            />
            <div className="flex gap-1">
              {[
                { value: 'pending', label: '待入库' },
                { value: 'manual', label: '手动标记' },
                { value: 'all', label: '全部' },
              ].map(opt => (
                <Button
                  key={opt.value}
                  variant={filterStatus === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(opt.value as any)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <Button variant="default" size="sm" onClick={() => { setCurrentPage(1); loadItems(1); }}>
              应用筛选
            </Button>
          </div>

          {/* 明细表格 */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发货日期</TableHead>
                  <TableHead>承运车牌</TableHead>
                  <TableHead>批号</TableHead>
                  <TableHead>包号</TableHead>
                  <TableHead className="text-right">清单重量(kg)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>入库时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      暂无待入库明细
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.shipping_date}</TableCell>
                      <TableCell>{item.vehicle_plate}</TableCell>
                      <TableCell className="font-medium">{item.batch_no}</TableCell>
                      <TableCell>{item.package_no}</TableCell>
                      <TableCell className="text-right">{item.weight}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.status === 'matched' && item.matched_at 
                          ? new Date(item.matched_at).toLocaleString('zh-CN')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* 分页 */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span>每页</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="h-8 rounded border px-2"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>条</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} 条，共 {totalCount} 条
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 导入预览对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              确认导入清单
            </DialogTitle>
            <DialogDescription>
              请确认以下信息是否正确
            </DialogDescription>
          </DialogHeader>

          {importData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">批次号</div>
                  <div className="font-medium text-wrap">{importData.batch_no}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">发货日期</div>
                  <div className="font-medium">{importData.shipping_date}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">承运车牌</div>
                  <div className="font-medium text-wrap">{importData.vehicle_plate}</div>
                </div>
              </div>

              {/* 多工作表批次汇总 */}
              {importMultiData && importMultiData.length > 1 && (
                <div className="p-3 bg-blue-50 rounded">
                  <div className="text-sm text-blue-600 font-medium mb-2">
                    共 {importMultiData.length} 个批次（工作表）
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {importMultiData.map((batch, i) => (
                      <div key={i} className="bg-white p-2 rounded border text-sm">
                        <div className="font-medium text-gray-700">{batch.batch_no || `批次${i+1}`}</div>
                        <div className="text-gray-500">{batch.items.length} 条记录</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-green-50 rounded">
                <div className="text-sm text-green-600">共解析 {importData.items.length} 条明细</div>
              </div>

              <div className="border rounded max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>批号</TableHead>
                      <TableHead>包号</TableHead>
                      <TableHead className="text-right">重量(kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.items.slice(0, 20).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-blue-600">{item.batch_no}</TableCell>
                        <TableCell>{item.package_no}</TableCell>
                        <TableCell className="text-right">{item.weight}</TableCell>
                      </TableRow>
                    ))}
                    {importData.items.length > 20 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          ... 还有 {importData.items.length - 20} 条
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportDialogOpen(false); setImportMultiData(null); }}>
              取消
            </Button>
            <Button onClick={() => handleConfirmImport(false)} disabled={importing}>
              {importing ? '导入中...' : '确认导入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清单详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>清单详情</DialogTitle>
            <DialogDescription>
              {selectedList?.shipping_date} - {selectedList?.vehicle_plate}
            </DialogDescription>
          </DialogHeader>

          {selectedList && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedList.total_count}</div>
                  <div className="text-sm text-muted-foreground">总件数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedList.matched_count}</div>
                  <div className="text-sm text-muted-foreground">已入库</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{selectedList.pending_count}</div>
                  <div className="text-sm text-muted-foreground">待入库</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedList.manual_count}</div>
                  <div className="text-sm text-muted-foreground">手动标记</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* 已完成历史记录对话框 */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              已完成入库记录
            </DialogTitle>
            <DialogDescription>
              以下批次已全部完成入库
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(() => {
              const groupedByBatchNo = lists.reduce((acc, list) => {
                const batchNo = list.batch_no || '未知批次';
                if (!acc[batchNo]) {
                  acc[batchNo] = {
                    batch_no: batchNo,
                    ids: [],
                    total_count: 0,
                    pending_count: 0,
                    matched_count: 0,
                    shipments: [] as { date: string; plate: string; count: number; id: string }[]
                  };
                }
                acc[batchNo].ids.push(list.id);
                acc[batchNo].total_count += list.total_count || 0;
                acc[batchNo].pending_count += list.pending_count || 0;
                acc[batchNo].matched_count += list.matched_count || 0;
                acc[batchNo].shipments.push({
                  date: list.shipping_date || '未知日期',
                  plate: list.vehicle_plate || '未知车牌',
                  count: list.total_count || 0,
                  id: list.id
                });
                return acc;
              }, {} as Record<string, {
                batch_no: string;
                ids: string[];
                total_count: number;
                pending_count: number;
                matched_count: number;
                shipments: { date: string; plate: string; count: number; id: string }[];
              }>);

              const completedGroups = Object.entries(groupedByBatchNo).filter(([_, g]) => g.pending_count === 0);

              return completedGroups.map(([batchNo, group]) => (
                <Card key={batchNo} className="bg-green-50 border-green-200">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-green-700 truncate" title={batchNo}>
                          {batchNo}
                        </div>
                        {group.shipments.length > 1 && (
                          <div className="text-xs text-green-600 mt-0.5">
                            共{group.shipments.length}次发货
                          </div>
                        )}
                        <div className="mt-1.5 space-y-0.5">
                          {group.shipments.slice(0, 2).map((ship) => (
                            <div key={ship.id} className="text-xs text-green-600 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{ship.date}</span>
                              <Truck className="w-3 h-3 ml-1" />
                              <span>{ship.plate}</span>
                            </div>
                          ))}
                          {group.shipments.length > 2 && (
                            <div className="text-xs text-green-500">
                              +{group.shipments.length - 2}次发货
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-green-200">
                      <span className="text-green-600">总包数: {group.total_count}</span>
                      <span className="text-green-600 font-medium">
                        已入库: {group.matched_count}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 入库未导入弹窗 */}
      <Dialog open={unimportedDialogOpen} onOpenChange={setUnimportedDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              入库未导入发货清单
            </DialogTitle>
            <DialogDescription>
              以下数据已入库但未导入发货清单（可能是在发货清单导入前入库的）
            </DialogDescription>
          </DialogHeader>

          {unimportedLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : unimportedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>所有入库记录都已导入发货清单</p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-orange-50 rounded mb-4 flex items-center justify-between">
                <div className="text-sm text-orange-600">共 {unimportedItems.length} 条记录未导入发货清单</div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    if (!confirm(`确定要将 ${unimportedItems.length} 条记录导入发货清单吗？\n\n这将创建一个虚拟发货清单来管理这些历史数据。`)) return;
                    
                    try {
                      const result = await request('/shipping/import-all-unimported', {
                        method: 'POST',
                        body: JSON.stringify({
                          batch_no: '历史数据批量导入',
                          vehicle_plate: '系统导入'
                        })
                      }) as { success: boolean; message: string; count: number };
                      
                      alert(result.message);
                      setUnimportedDialogOpen(false);
                      handleRefresh();
                    } catch (error: any) {
                      alert('导入失败: ' + error.message);
                    }
                  }}
                >
                  一键导入全部
                </Button>
              </div>
              <div className="border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>批号</TableHead>
                      <TableHead>包号</TableHead>
                      <TableHead>型号</TableHead>
                      <TableHead className="text-right">重量(kg)</TableHead>
                      <TableHead>入库时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unimportedItems.slice(0, 100).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-blue-600">{item.batch_no}</TableCell>
                        <TableCell>{item.package_no}</TableCell>
                        <TableCell>{item.model || '-'}</TableCell>
                        <TableCell className="text-right">{item.weight}</TableCell>
                        <TableCell>
                          {item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {unimportedItems.length > 100 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          ... 还有 {unimportedItems.length - 100} 条记录
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUnimportedDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
