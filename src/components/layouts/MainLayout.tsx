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
  BarChart3,
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
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
  const { user, profile, signOut } = useAuth();
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
          title: '拆包明细',
          path: '/stock/split',
          icon: <></>,
          permission: 'splitDetail',
        },
        {
          title: '出库明细',
          path: '/stock/out',
          icon: <></>,
          permission: 'outDetail',
        },

        {
          title: '采购建议',
          path: '/stock/purchase-suggestion',
          icon: <></>,
          permission: 'purchaseSuggestion',
        },
        {
          title: '待入库明细',
          path: '/stock/pending-inbound',
          icon: <></>,
          permission: 'pendingInbound',
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
    {
      title: '企业微信机器人',
      path: '/wechat-bot',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.32.32 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.267.267 0 00.139.045c.133 0 .241-.11.241-.245 0-.06-.024-.12-.04-.178l-.325-1.233a.492.492 0 01.177-.554c1.524-1.12 2.504-2.787 2.504-4.628 0-3.358-3.195-6.074-7.063-6.114zm-1.629 2.052c.536 0 .97.44.97.983a.976.976 0 01-.97.983.976.976 0 01-.97-.983c0-.542.434-.983.97-.983zm4.848 0c.536 0 .97.44.97.983a.976.976 0 01-.97.983.976.976 0 01-.97-.983c0-.542.434-.983.97-.983z"/></svg>,
      permission: 'userManage',
    },
    {
      title: '报表中心',
      path: '/report',
      icon: <BarChart3 className="w-5 h-5" />,
      permission: 'reportCenter',
    },
  ];

  // 检查权限
  const hasPermission = (permission?: string) => {
    // 没有定义权限的菜单项默认显示
    if (!permission) return true;
    
    // 管理员拥有所有权限
    if (profile?.role === 'admin') return true;
    
    // 检查 web_permissions
    const webPerms = profile?.web_permissions as Record<string, boolean> | undefined;
    if (webPerms && webPerms[permission] === true) {
      return true;
    }
    
    console.log('权限不足:', permission, '用户:', profile?.name, '权限:', webPerms);
    return false;
  };

  // 过滤菜单项
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => hasPermission(item.permission))
      .map(item => ({
        ...item,
        children: item.children ? filterMenuItems(item.children) : undefined,
      }))
      .filter(item => {
        // 如果没有子菜单，显示父菜单
        if (!item.children) return true;
        // 如果有子菜单且子菜单不为空，显示父菜单
        if (item.children.length > 0) return true;
        // 如果父菜单有path（可以直接点击），也显示
        if (item.path) return true;
        // 否则隐藏（子菜单全被过滤掉了）
        return false;
      });
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">无纺布管理系统</h1>
            <p className="text-xs text-muted-foreground">Nonwoven Management</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredMenuItems.map((item, index) => (
          <div key={index}>
            {item.children ? (
              <details className="group" open={item.children.some(child => child.path === location.pathname)}>
                <summary className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-sidebar-accent text-sidebar-foreground list-none transition-colors duration-150">
                  <span className="text-primary/70">{item.icon}</span>
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="ml-4 mt-1 space-y-0.5 pl-4 border-l-2 border-transparent">
                  {item.children.map((child, childIndex) => (
                    <Link
                      key={childIndex}
                      to={child.path || '#'}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm transition-all duration-150',
                        location.pathname === child.path
                          ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary font-medium shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <span className={location.pathname === item.path ? 'text-primary' : 'text-primary/70'}>{item.icon}</span>
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
      
      {/* Sidebar Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground text-center">
          © 2026 无纺布管理系统
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:block w-60 border-r border-sidebar-border bg-sidebar shrink-0 shadow-sm">
        <SidebarContent />
      </aside>

      {/* 移动端侧边栏 */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0 bg-sidebar lg:hidden">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏 */}
        <header className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {filteredMenuItems.find(item => item.path === location.pathname)?.title ||
                  filteredMenuItems
                    .flatMap(item => item.children || [])
                    .find(child => child.path === location.pathname)?.title ||
                  '首页'}
              </h2>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2.5 px-2.5 hover:bg-accent/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-sm font-semibold shadow-sm">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{profile?.name || '用户'}</span>
                  <span className="text-xs text-muted-foreground">{profile?.role === 'admin' ? '管理员' : '普通用户'}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-base font-semibold">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{profile?.name || '用户'}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.role === 'admin' ? '管理员' : '普通用户'}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-5 md:p-6 overflow-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
