import { LogOut, Settings, Bell, Shield, HelpCircle, User as UserIcon } from 'lucide-react';
import { MobileLayout } from '@/components/mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: '退出成功',
        description: '您已成功退出登录',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '退出失败',
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  const menuItems = [
    {
      icon: UserIcon,
      label: '个人信息',
      path: '/mobile/profile/info',
    },
    {
      icon: Bell,
      label: '消息通知',
      path: '/mobile/profile/notifications',
    },
    {
      icon: Shield,
      label: '安全设置',
      path: '/mobile/profile/security',
    },
    {
      icon: Settings,
      label: '系统设置',
      path: '/mobile/profile/settings',
    },
    {
      icon: HelpCircle,
      label: '帮助中心',
      path: '/mobile/profile/help',
    },
  ];

  return (
    <MobileLayout
      title="我的"
      hideNav
    >
      <div className="p-4 space-y-4">
        {/* 用户信息卡片 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <UserIcon size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.email || '用户'}</h2>
              <p className="text-sm text-blue-100 mt-1">
                {user?.role || '普通用户'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">128</p>
              <p className="text-xs text-blue-100 mt-1">入库次数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">56</p>
              <p className="text-xs text-blue-100 mt-1">出库次数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-blue-100 mt-1">质检次数</p>
            </div>
          </div>
        </div>

        {/* 菜单列表 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-gray-600" />
                  <span className="text-gray-900">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 退出登录 */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors text-gray-700"
        >
          <LogOut size={20} />
          <span>退出登录</span>
        </button>

        {/* 版本信息 */}
        <div className="text-center text-xs text-gray-400 mt-8">
          <p>苗达管理系统 v1.0.0</p>
          <p className="mt-1">© 2025 MiaoDa. All rights reserved.</p>
        </div>
      </div>
    </MobileLayout>
  );
};
