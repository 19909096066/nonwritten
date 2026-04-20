import { useEffect, useState } from 'react';
import { getUsers, updateUser, createUser, createOperationLog } from '@/db/api';
import type { Profile, AppPermissions, WebPermissions, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, RefreshCw, Plus, Power, PowerOff, Search, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const [newUser, setNewUser] = useState({
    phone: '',
    name: '',
    password: '',
    role: 'user' as UserRole,
    app_permissions: {
      scanIn: false,
      scanOut: false,
      scanSplit: false,
      scanQuery: false,
      manualQuery: false,
      viewRecords: false,
      viewStockStats: true,
    },
    web_permissions: {
      stockView: false,
      inDetail: false,
      outDetail: false,
      userManage: false,
      qcPurchase: false,
      qcProduction: false,
      qcDefect: false,
      qcStandard: false,
      operationLog: false,
    },
  });
  const { profile: currentUser } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('加载用户失败:', error);
      toast.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  };

  // 过滤和分页
  const filteredUsers = users.filter(user => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      user.username?.toLowerCase().includes(keyword) ||
      user.name?.toLowerCase().includes(keyword) ||
      user.phone?.includes(keyword)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  // 重置页码
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [filteredUsers.length, totalPages]);

  const handleEdit = (user: Profile) => {
    const cleanWebPermissions = (({ batchImport, ...rest }) => rest)(user.web_permissions || {}) as WebPermissions;
    
    setEditingUser({
      ...user,
      app_permissions: user.app_permissions || {
        scanIn: false,
        scanOut: false,
        scanSplit: false,
        scanQuery: false,
        manualQuery: false,
        viewRecords: false,
        viewStockStats: true,
      },
      web_permissions: {
        stockView: cleanWebPermissions.stockView ?? false,
        inDetail: cleanWebPermissions.inDetail ?? false,
        outDetail: cleanWebPermissions.outDetail ?? false,
        userManage: cleanWebPermissions.userManage ?? false,
        qcPurchase: cleanWebPermissions.qcPurchase ?? false,
        qcProduction: cleanWebPermissions.qcProduction ?? false,
        qcDefect: cleanWebPermissions.qcDefect ?? false,
        qcStandard: cleanWebPermissions.qcStandard ?? false,
        operationLog: cleanWebPermissions.operationLog ?? false,
      },
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, {
        name: editingUser.name,
        phone: editingUser.phone,
        app_permissions: editingUser.app_permissions,
        web_permissions: editingUser.web_permissions,
      });

      await createOperationLog({
        operation_type: 'user_edit',
        operator: currentUser?.name || '',
        detail: `编辑用户 ${editingUser.name}`,
      });

      toast.success('保存成功');
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error(error.message || '保存失败');
    }
  };

  const handleToggleActive = async (user: Profile) => {
    const newStatus = !user.is_active;
    try {
      await updateUser(user.id, { is_active: newStatus });

      await createOperationLog({
        operation_type: 'user_edit',
        operator: currentUser?.name || '',
        detail: `${newStatus ? '启用' : '停用'}用户 ${user.name}`,
      });

      toast.success(newStatus ? '用户已启用' : '用户已停用');
      loadData();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error('操作失败');
    }
  };

  const handleAddUser = async () => {
    if (creating) return;

    if (!newUser.phone || !newUser.name || !newUser.password) {
      toast.error('请填写所有必填字段');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(newUser.phone)) {
      toast.error('请输入正确的手机号');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('密码长度至少为6位');
      return;
    }

    try {
      setCreating(true);
      await createUser(newUser);

      await createOperationLog({
        operation_type: 'user_add',
        operator: currentUser?.name || '',
        detail: `添加用户 ${newUser.name} (${newUser.phone})`,
      });

      toast.success('用户创建成功');
      setAddDialogOpen(false);
      setNewUser({
        phone: '',
        name: '',
        password: '',
        role: 'user',
        app_permissions: {
          scanIn: false,
          scanOut: false,
          scanSplit: false,
          scanQuery: false,
          manualQuery: false,
          viewRecords: false,
          viewStockStats: true,
        },
        web_permissions: {
          stockView: false,
          inDetail: false,
          outDetail: false,
          userManage: false,
          qcPurchase: false,
          qcProduction: false,
          qcDefect: false,
          qcStandard: false,
          operationLog: false,
        },
      });
      loadData();
    } catch (error: any) {
      console.error('创建用户失败:', error);
      toast.error(error.message || '创建用户失败');
    } finally {
      setCreating(false);
    }
  };

  const updateNewUserAppPermission = (key: keyof AppPermissions, value: boolean) => {
    setNewUser({
      ...newUser,
      app_permissions: {
        ...newUser.app_permissions,
        [key]: value,
      },
    });
  };

  const updateNewUserWebPermission = (key: keyof WebPermissions, value: boolean) => {
    setNewUser({
      ...newUser,
      web_permissions: {
        ...newUser.web_permissions,
        [key]: value,
      },
    });
  };

  const updateAppPermission = (key: keyof AppPermissions, value: boolean) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      app_permissions: {
        ...(editingUser.app_permissions || {}),
        [key]: value,
      },
    });
  };

  const updateWebPermission = (key: keyof WebPermissions, value: boolean) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      web_permissions: {
        ...(editingUser.web_permissions || {}),
        [key]: value,
      },
    });
  };

  // 权限标签渲染
  const renderPermissionBadges = (user: Profile) => {
    if (user.role === 'admin') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">全部权限</span>;
    }

    const badges: React.ReactNode[] = [];
    
    const appLabels: Record<keyof AppPermissions, string> = {
      scanIn: '入库',
      scanOut: '出库',
      scanSplit: '拆包',
      scanQuery: '扫码查',
      manualQuery: '手动查',
      viewRecords: '记录',
      viewStockStats: '统计',
    };

    const webLabels: Record<keyof WebPermissions, string> = {
      stockView: '库存',
      inDetail: '入库',
      outDetail: '出库',
      userManage: '用户',
      qcPurchase: '采购质检',
      qcProduction: '生产质检',
      qcDefect: '次品',
      qcStandard: '标准',
      operationLog: '日志',
    };

    if (user.app_permissions) {
      (Object.keys(appLabels) as (keyof AppPermissions)[]).forEach(key => {
        if (user.app_permissions?.[key]) {
          badges.push(
            <span key={`app-${key}`} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {appLabels[key]}
            </span>
          );
        }
      });
    }

    if (user.web_permissions) {
      (Object.keys(webLabels) as (keyof WebPermissions)[]).forEach(key => {
        if (user.web_permissions?.[key]) {
          badges.push(
            <span key={`web-${key}`} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              {webLabels[key]}
            </span>
          );
        }
      });
    }

    return badges.length > 0 ? badges : <span className="text-slate-400 text-xs">无权限</span>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">用户管理</CardTitle>
          <div className="flex gap-2 flex-shrink-0">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  添加用户
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>添加新用户</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-phone">手机号 *</Label>
                        <Input
                          id="new-phone"
                          type="tel"
                          placeholder="请输入11位手机号"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                          maxLength={11}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-name">姓名 *</Label>
                        <Input
                          id="new-name"
                          placeholder="请输入姓名"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">密码 *</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="至少6位"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-role">角色</Label>
                        <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">普通用户</SelectItem>
                            <SelectItem value="admin">管理员</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>App权限</Label>
                      <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-slate-50">
                        {[
                          { key: 'scanIn', label: '扫码入库' },
                          { key: 'scanOut', label: '扫码出库' },
                          { key: 'scanSplit', label: '扫码拆包' },
                          { key: 'scanQuery', label: '扫码查询' },
                          { key: 'manualQuery', label: '手动查询' },
                          { key: 'viewRecords', label: '查看记录' },
                          { key: 'viewStockStats', label: '查看库存统计' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm">{label}</span>
                            <Switch
                              checked={newUser.app_permissions[key as keyof AppPermissions] || false}
                              onCheckedChange={(checked) => updateNewUserAppPermission(key as keyof AppPermissions, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>后台权限</Label>
                      <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-slate-50">
                        {[
                          { key: 'stockView', label: '库存明细' },
                          { key: 'inDetail', label: '入库明细' },
                          { key: 'outDetail', label: '出库明细' },
                          { key: 'userManage', label: '用户管理' },
                          { key: 'qcPurchase', label: '采购质检' },
                          { key: 'qcProduction', label: '生产质检' },
                          { key: 'qcDefect', label: '次品明细' },
                          { key: 'qcStandard', label: '质检标准' },
                          { key: 'operationLog', label: '操作日志' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm">{label}</span>
                            <Switch
                              checked={newUser.web_permissions[key as keyof WebPermissions] || false}
                              onCheckedChange={(checked) => updateNewUserWebPermission(key as keyof WebPermissions, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddUser} disabled={creating}>
                        {creating ? '创建中...' : '创建用户'}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索栏 */}
          <div className="mb-4 flex items-center gap-4 flex-wrap">
            <div className="relative w-full sm:w-auto sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索用户名、姓名或手机号..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-slate-500 whitespace-nowrap">
              共 {filteredUsers.length} 条记录
            </div>
          </div>

          {/* 表格容器 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">用户名</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">姓名</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 whitespace-nowrap">手机号</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 whitespace-nowrap">角色</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 whitespace-nowrap">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">权限</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 whitespace-nowrap">创建时间</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b">
                        {[...Array(8)].map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-200 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className={cn(
                          "border-b hover:bg-slate-50 transition-colors",
                          !user.is_active && "opacity-50 bg-slate-50"
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-sm text-slate-600">
                          {user.username}
                        </td>
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{user.phone || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            user.role === 'admin' ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                          )}>
                            {user.role === 'admin' ? '管理员' : '普通用户'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            user.is_active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          )}>
                            {user.is_active !== false ? '启用' : '停用'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {renderPermissionBadges(user)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-500">
                          {new Date(user.created_at).toLocaleString('zh-CN')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              onClick={() => handleEdit(user)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="编辑权限"
                            >
                              <UserCog className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              onClick={() => handleToggleActive(user)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={user.is_active !== false ? '停用' : '启用'}
                            >
                              {user.is_active !== false ? (
                                <PowerOff className="w-4 h-4 text-orange-500" />
                              ) : (
                                <Power className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-50 cursor-default' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setPage(i + 1)}
                        isActive={page === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? 'pointer-events-none opacity-50 cursor-default' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>编辑用户权限</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>用户名</Label>
                    <Input value={editingUser.username} disabled className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>姓名</Label>
                    <Input
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>手机号</Label>
                    <Input
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      placeholder="选填"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>角色</Label>
                    <div className="flex h-10 items-center px-3 rounded-md border bg-slate-50 text-sm">
                      {editingUser.role === 'admin' ? '管理员（拥有所有权限）' : '普通用户'}
                    </div>
                  </div>
                </div>

                {editingUser.role !== 'admin' && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">App权限</Label>
                      <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50">
                        {[
                          { key: 'scanIn', label: '扫码入库' },
                          { key: 'scanOut', label: '扫码出库' },
                          { key: 'scanSplit', label: '扫码拆包' },
                          { key: 'scanQuery', label: '扫码查询' },
                          { key: 'manualQuery', label: '手动查询' },
                          { key: 'viewRecords', label: '查看记录' },
                          { key: 'viewStockStats', label: '查看库存统计' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm">{label}</span>
                            <Switch
                              checked={editingUser.app_permissions?.[key as keyof AppPermissions] || false}
                              onCheckedChange={(checked) =>
                                updateAppPermission(key as keyof AppPermissions, checked)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">后台权限</Label>
                      <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50">
                        {[
                          { key: 'stockView', label: '库存明细' },
                          { key: 'inDetail', label: '入库明细' },
                          { key: 'outDetail', label: '出库明细' },
                          { key: 'userManage', label: '用户管理' },
                          { key: 'qcPurchase', label: '采购质检' },
                          { key: 'qcProduction', label: '生产质检' },
                          { key: 'qcDefect', label: '次品明细' },
                          { key: 'qcStandard', label: '质检标准' },
                          { key: 'operationLog', label: '操作日志' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm">{label}</span>
                            <Switch
                              checked={editingUser.web_permissions?.[key as keyof WebPermissions] || false}
                              onCheckedChange={(checked) =>
                                updateWebPermission(key as keyof WebPermissions, checked)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSave}>保存</Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
