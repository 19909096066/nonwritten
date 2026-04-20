import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Search, FileText, LogOut, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/db/api';
import type { DashboardStats } from '@/types';

export default function MobileHomePage() {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  // 检查权限
  const hasPermission = (permission: string) => {
    if (profile?.role === 'admin') return true;
    return profile?.app_permissions?.[permission as keyof typeof profile.app_permissions] === true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* 顶部栏 */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-6 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">无纺布管理系统</h1>
            <p className="text-sm opacity-90 mt-1">移动端操作平台</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{profile?.name}</p>
              <p className="text-xs opacity-90">{profile?.role === 'admin' ? '管理员' : '操作员'}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{stats?.totalStock || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">总库存(卷)</p>
                <p className="text-xs text-primary font-medium mt-1">{stats?.totalWeight || 0} kg</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{stats?.todayIn || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">今日入库</p>
                <p className="text-xs text-green-600 font-medium mt-1">卷</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
                  <TrendingDown className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">{stats?.todayOut || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">今日出库</p>
                <p className="text-xs text-orange-600 font-medium mt-1">卷</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="p-4 space-y-4">
        {hasPermission('scanIn') && (
          <Link to="/mobile/scan-in" className="block">
            <div className="bg-white rounded-2xl p-5 shadow-lg active:scale-98 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">扫码入库</h3>
                  <p className="text-sm text-gray-500">扫描二维码快速入库</p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {hasPermission('scanOut') && (
          <Link to="/mobile/scan-out" className="block">
            <div className="bg-white rounded-2xl p-5 shadow-lg active:scale-98 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">扫码出库</h3>
                  <p className="text-sm text-gray-500">扫描二维码快速出库</p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {hasPermission('manualQuery') && (
          <Link to="/mobile/manual-query" className="block">
            <div className="bg-white rounded-2xl p-5 shadow-lg active:scale-98 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">库存查询</h3>
                  <p className="text-sm text-gray-500">输入批次号或型号查询</p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {hasPermission('viewRecords') && (
          <Link to="/mobile/records" className="block">
            <div className="bg-white rounded-2xl p-5 shadow-lg active:scale-98 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">操作记录</h3>
                  <p className="text-sm text-gray-500">查看历史操作记录</p>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-6 pb-8 text-center">
        <p className="text-xs text-muted-foreground">© 2026 无纺布原材料管理系统</p>
        <p className="text-xs text-muted-foreground mt-1">移动端 v1.0</p>
      </div>
    </div>
  );
}
