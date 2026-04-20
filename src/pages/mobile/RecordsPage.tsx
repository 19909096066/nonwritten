import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, TrendingUp, TrendingDown, Search, RefreshCw } from 'lucide-react';
import { getOperationLogs } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { OperationLog } from '@/types';

export default function RecordsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [records, setRecords] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      // 获取当前用户的操作记录，最近50条
      // 如果有用户名则筛选，否则显示所有记录
      const params: {
        pageSize: number;
        operator?: string;
      } = {
        pageSize: 50
      };
      
      // 只有当用户名存在且不为空时才添加筛选条件
      if (profile?.name && profile.name.trim()) {
        params.operator = profile.name;
      }
      
      const result = await getOperationLogs(params);
      setRecords(result.data);
    } catch (error) {
      console.error('加载记录失败:', error);
      toast.error('加载记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('IN') || type.includes('入库')) {
      return <TrendingUp className="w-4 h-4" />;
    }
    if (type.includes('OUT') || type.includes('出库')) {
      return <TrendingDown className="w-4 h-4" />;
    }
    if (type.includes('QUERY') || type.includes('查询')) {
      return <Search className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getTypeName = (type: string) => {
    if (type.includes('IN') || type.includes('入库')) return '入库';
    if (type.includes('OUT') || type.includes('出库')) return '出库';
    if (type.includes('QUERY') || type.includes('查询')) return '查询';
    return type;
  };

  const getTypeVariant = (type: string): 'default' | 'destructive' | 'secondary' => {
    if (type.includes('IN') || type.includes('入库')) return 'default';
    if (type.includes('OUT') || type.includes('出库')) return 'destructive';
    return 'secondary';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-secondary text-secondary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/mobile')} className="text-secondary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">操作记录</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {profile?.name ? `${profile.name}的操作记录` : '操作记录'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={loadRecords} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {profile?.name ? '最近50条个人操作记录' : '最近50条操作记录'}（已同步到数据库）
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 text-muted-foreground animate-spin" />
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">暂无操作记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(record.operation_type)}
                        <Badge variant={getTypeVariant(record.operation_type)} className="text-xs">
                          {getTypeName(record.operation_type)}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.operate_time).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {record.qr_code && (
                      <div className="text-xs">
                        <p className="text-muted-foreground mb-1">二维码</p>
                        <p className="font-mono bg-muted p-2 rounded break-all text-xs">
                          {record.qr_code}
                        </p>
                      </div>
                    )}

                    {record.detail && (
                      <div className="text-xs">
                        <p className="text-muted-foreground mb-1">详情</p>
                        <p className="text-xs">{record.detail}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
            <p>💡 提示：</p>
            <p>• 操作记录已自动同步到数据库</p>
            <p>• 可在后台管理系统查看完整的操作日志</p>
            <p>• 记录包含操作类型、时间、二维码等详细信息</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
