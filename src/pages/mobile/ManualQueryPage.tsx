import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Package, RefreshCw } from 'lucide-react';
import { getRawMaterials, getBatchNumbers, getModels } from '@/db/api';
import type { RawMaterial } from '@/types';
import { toast } from 'sonner';

export default function ManualQueryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [queryType, setQueryType] = useState<'batch' | 'model'>('batch');
  const [queryValue, setQueryValue] = useState('');
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [batchNumbers, setBatchNumbers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    // 从URL参数获取查询条件
    const batch = searchParams.get('batch');
    const model = searchParams.get('model');
    
    if (batch) {
      setQueryType('batch');
      setQueryValue(batch);
      handleSearch('batch', batch);
    } else if (model) {
      setQueryType('model');
      setQueryValue(model);
      handleSearch('model', model);
    }
  }, [searchParams]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const [batchNos, modelList] = await Promise.all([
        getBatchNumbers(),
        getModels()
      ]);
      setBatchNumbers(batchNos);
      setModels(modelList);
    } catch (error) {
      console.error('加载选项失败:', error);
      toast.error('加载选项失败');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSearch = async (type?: 'batch' | 'model', value?: string) => {
    const searchType = type || queryType;
    const searchValue = value || queryValue;

    if (!searchValue || !searchValue.trim()) {
      toast.error('请选择查询条件');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const filters: any = { page: 1, pageSize: 100 };
      if (searchType === 'batch') {
        filters.batchNo = searchValue;
      } else {
        filters.model = searchValue;
      }

      const result = await getRawMaterials(filters);
      setMaterials(result.data);
      
      if (result.data.length === 0) {
        toast.info('未找到相关物料');
      }
    } catch (error: any) {
      console.error('查询失败:', error);
      toast.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const inStockMaterials = materials.filter(m => m.status === 'in_stock');
  const totalWeight = inStockMaterials.reduce((sum, m) => sum + m.weight, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-secondary text-secondary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/mobile')} className="text-secondary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">手动查询</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <Tabs value={queryType} onValueChange={(v) => {
                setQueryType(v as 'batch' | 'model');
                setQueryValue('');
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="batch">按批次号</TabsTrigger>
                  <TabsTrigger value="model">按型号</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadOptions} 
                disabled={loadingOptions}
                className="ml-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingOptions ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-3">
              <Select value={queryValue} onValueChange={setQueryValue}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingOptions 
                      ? '加载中...' 
                      : queryType === 'batch' 
                        ? '请选择批次号' 
                        : '请选择原材料型号'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {queryType === 'batch' ? (
                    batchNumbers.length > 0 ? (
                      batchNumbers.map((batch) => (
                        <SelectItem key={batch} value={batch}>
                          {batch}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>
                        暂无批次号数据
                      </SelectItem>
                    )
                  ) : (
                    models.length > 0 ? (
                      models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>
                        暂无型号数据
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              <Button 
                onClick={() => handleSearch()} 
                disabled={loading || !queryValue}
                className="w-full"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? '查询中...' : '查询'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {searched && materials.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">汇总信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{materials.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">总卷数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{inStockMaterials.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">在库卷数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{totalWeight.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">在库重量(kg)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">物料明细</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {material.batch_no}-{material.package_no}
                        </span>
                      </div>
                      <Badge variant={material.status === 'in_stock' ? 'default' : 'secondary'} className="text-xs">
                        {material.status === 'in_stock' ? '在库' : '已出库'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">型号：</span>
                        <span className="font-medium">{material.model}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">重量：</span>
                        <span className="font-medium">{material.weight} {material.unit}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">生产日期：</span>
                        <span className="font-medium">{material.production_date}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">入库时间：</span>
                        <span className="font-medium">{new Date(material.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>

                    {material.status === 'out_stock' && material.out_at && (
                      <div className="text-xs text-muted-foreground">
                        出库时间：{new Date(material.out_at).toLocaleString('zh-CN')}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {searched && materials.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">未找到相关物料</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
