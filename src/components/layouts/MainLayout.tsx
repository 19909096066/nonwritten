import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  FileText,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  permission?: string;
  children?: MenuItem[];
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems: MenuItem[] = [
    {
      title: '首页',
      path: '/',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      title: '库存管理',
      icon: <Package className="w-5 h-5" />,
      children: [
        {
          title: '库存明细',
          path: '/stock/list',
          icon: <></>,
          permission: 'stockView',
        },
        {
          title: '入库明细',
          path: '/stock/in',
          icon: <></>,
          permission: 'inDetail',
        },
        {
          title: '出库明细',
          path: '/stock/out',
          icon: <></>,
          permission: 'outDetail',
        },
        {
          title: '批量入库',
          path: '/stock/batch-import',
          icon: <></>,
          permission: 'batchImport',
        },
      ],
    },
    {
      title: '质检中心',
      icon: <ClipboardList className="w-5 h-5" />,
      children: [
        {
          title: '质检标准',
          path: '/qc/standard',
          icon: <></>,
          permission: 'qcStandard',
        },
        {
          title: '采购质检',
          path: '/qc/purchase',
          icon: <></>,
          permission: 'qcPurchase',
        },
        {
          title: '生产质检',
          path: '/qc/production',
          icon: <></>,
          permission: 'qcProduction',
        },
        {
          title: '次品明细',
          path: '/qc/defect',
          icon: <></>,
          permission: 'qcDefect',
        },
      ],
    },
    {
      title: '用户管理',
      path: '/users',
      icon: <Users className="w-5 h-5" />,
      permission: 'userManage',
    },
    {
      title: '操作日志',
      path: '/logs',
      icon: <FileText className="w-5 h-5" />,
      permission: 'operationLog',
    },
  ];

  // 检查权限
  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (profile?.role === 'admin') return true;
    return profile?.web_permissions?.[permission as keyof typeof profile.web_permissions] === true;
  };

  // 过滤菜单项
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => hasPermission(item.permission))
      .map(item => ({
        ...item,
        children: item.children ? filterMenuItems(item.children) : undefined,
      }))
      .filter(item => !item.children || item.children.length > 0);
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">无纺布管理系统</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item, index) => (
          <div key={index}>
            {item.children ? (
              <details className="group" open={item.children.some(child => child.path === location.pathname)}>
                <summary className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-sidebar-accent text-sidebar-foreground list-none">
                  {item.icon}
                  <span className="flex-1">{item.title}</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child, childIndex) => (
                    <Link
                      key={childIndex}
                      to={child.path || '#'}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'block px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent',
                        location.pathname === child.path
                          ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                          : 'text-sidebar-foreground'
                      )}
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link
                to={item.path || '#'}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent',
                  location.pathname === item.path
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground'
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:block w-64 border-r border-sidebar-border bg-sidebar shrink-0">
        <SidebarContent />
      </aside>

      {/* 移动端侧边栏 */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar lg:hidden">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏 */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h2 className="text-lg font-semibold text-foreground">
              {filteredMenuItems.find(item => item.path === location.pathname)?.title ||
                filteredMenuItems
                  .flatMap(item => item.children || [])
                  .find(child => child.path === location.pathname)?.title ||
                '首页'}
            </h2>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:inline">{profile?.name || '用户'}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.name || '用户'}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.role === 'admin' ? '管理员' : '普通用户'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
