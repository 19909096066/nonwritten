import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { batchCreateRawMaterials, createOperationLog } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RawMaterial } from '@/types';

interface ImportRow {
  batchNo: string;
  packageNo: string;
  model: string;
  productionDate: string;
  weight: string;
  error?: string;
}

export default function BatchImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const { profile } = useAuth();

  const handleDownloadTemplate = () => {
    const template = `批次号,包号,原材料型号,生产日期,重量
P0126020012-01J1,8,B1250050T1,2026-02-04,140.15
P0126020012-01J1,9,B1250050T1,2026-02-04,138.50
P0126020012-01J2,1,B1250050T1,2026-02-04,142.30`;

    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '批量入库模板.csv';
    link.click();
    toast.success('模板下载成功');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('请上传CSV文件');
        return;
      }
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('文件内容为空');
        return;
      }

      // 跳过表头
      const dataLines = lines.slice(1);
      const rows: ImportRow[] = dataLines.map((line, index) => {
        const [batchNo, packageNo, model, productionDate, weight] = line.split(',').map(s => s.trim());
        
        const row: ImportRow = {
          batchNo: batchNo || '',
          packageNo: packageNo || '',
          model: model || '',
          productionDate: productionDate || '',
          weight: weight || '',
        };

        // 验证
        const errors: string[] = [];
        if (!row.batchNo) errors.push('批次号不能为空');
        if (!row.packageNo) errors.push('包号不能为空');
        if (!row.model) errors.push('型号不能为空');
        if (!row.productionDate) errors.push('生产日期不能为空');
        if (!row.weight || Number.isNaN(Number(row.weight))) errors.push('重量必须为数字');

        if (errors.length > 0) {
          row.error = `第${index + 2}行: ${errors.join(', ')}`;
        }

        return row;
      });

      setPreviewData(rows);
      
      const errorCount = rows.filter(r => r.error).length;
      if (errorCount > 0) {
        toast.warning(`发现 ${errorCount} 条数据有误，请检查`);
      } else {
        toast.success(`成功解析 ${rows.length} 条数据`);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('没有可导入的数据');
      return;
    }

    const validRows = previewData.filter(r => !r.error);
    if (validRows.length === 0) {
      toast.error('所有数据都有错误，无法导入');
      return;
    }

    setImporting(true);
    try {
      const materials: Omit<RawMaterial, 'id' | 'created_at' | 'out_at'>[] = validRows.map(row => ({
        qr_code: `${row.batchNo}-${row.packageNo}~kg~${row.productionDate}~${row.weight}~${row.model}`,
        batch_no: row.batchNo,
        package_no: row.packageNo,
        model: row.model,
        production_date: row.productionDate,
        weight: Number(row.weight),
        unit: 'kg',
        status: 'in_stock',
        operator: profile?.name || '',
        remark: null,
      }));

      await batchCreateRawMaterials(materials);

      // 记录日志
      await createOperationLog({
        operation_type: 'IMPORT',
        operator: profile?.name || '',
        detail: `批量导入 ${validRows.length} 条记录`,
      });

      setImportResult({
        success: validRows.length,
        failed: previewData.length - validRows.length,
        errors: previewData.filter(r => r.error).map(r => r.error || ''),
      });

      toast.success(`成功导入 ${validRows.length} 条记录`);
      setFile(null);
      setPreviewData([]);
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>批量入库</CardTitle>
          <CardDescription>通过上传CSV文件批量导入原材料入库记录</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              下载模板
            </Button>
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
              />
            </div>
            <Button onClick={handleImport} disabled={!file || importing || previewData.length === 0}>
              <Upload className="w-4 h-4 mr-2" />
              {importing ? '导入中...' : '开始导入'}
            </Button>
          </div>

          {previewData.length > 0 && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  共 {previewData.length} 条数据，其中 {previewData.filter(r => !r.error).length} 条有效，
                  {previewData.filter(r => r.error).length} 条有误
                </AlertDescription>
              </Alert>

              <div className="border rounded-md max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>批次号</TableHead>
                      <TableHead>包号</TableHead>
                      <TableHead>型号</TableHead>
                      <TableHead>生产日期</TableHead>
                      <TableHead>重量(kg)</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index} className={row.error ? 'bg-destructive/10' : ''}>
                        <TableCell>{row.batchNo}</TableCell>
                        <TableCell>{row.packageNo}</TableCell>
                        <TableCell>{row.model}</TableCell>
                        <TableCell>{row.productionDate}</TableCell>
                        <TableCell>{row.weight}</TableCell>
                        <TableCell>
                          {row.error ? (
                            <span className="text-destructive text-xs">{row.error}</span>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {importResult && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                导入完成！成功 {importResult.success} 条，失败 {importResult.failed} 条
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-xs text-destructive">
                    {importResult.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
