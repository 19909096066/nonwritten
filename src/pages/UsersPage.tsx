import { useEffect, useState } from 'react';
import { getUsers, updateUser, createUser, createOperationLog } from '@/db/api';
import type { Profile, AppPermissions, WebPermissions, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    phone: '',
    name: '',
    password: '',
    role: 'user' as UserRole,
    app_permissions: {
      scanIn: false,
      scanOut: false,
      scanQuery: false,
      manualQuery: false,
      viewRecords: false,
    },
    web_permissions: {
      stockView: false,
      inDetail: false,
      outDetail: false,
      batchImport: false,
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

  const handleEdit = (user: Profile) => {
    setEditingUser({ ...user });
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
        operation_type: 'USER_EDIT',
        operator: currentUser?.name || '',
        detail: `编辑用户 ${editingUser.name}`,
      });

      toast.success('保存成功');
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    }
  };

  const handleAddUser = async () => {
    // 验证必填字段
    if (!newUser.phone || !newUser.name || !newUser.password) {
      toast.error('请填写所有必填字段');
      return;
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(newUser.phone)) {
      toast.error('请输入正确的手机号');
      return;
    }

    // 验证密码长度
    if (newUser.password.length < 6) {
      toast.error('密码长度至少为6位');
      return;
    }

    try {
      await createUser(newUser);

      await createOperationLog({
        operation_type: 'USER_ADD',
        operator: currentUser?.name || '',
        detail: `添加用户 ${newUser.name} (${newUser.phone})`,
      });

      toast.success('用户创建成功');
      setAddDialogOpen(false);
      // 重置表单
      setNewUser({
        phone: '',
        name: '',
        password: '',
        role: 'user',
        app_permissions: {
          scanIn: false,
          scanOut: false,
          scanQuery: false,
          manualQuery: false,
          viewRecords: false,
        },
        web_permissions: {
          stockView: false,
          inDetail: false,
          outDetail: false,
          batchImport: false,
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
        ...editingUser.app_permissions,
        [key]: value,
      },
    });
  };

  const updateWebPermission = (key: keyof WebPermissions, value: boolean) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      web_permissions: {
        ...editingUser.web_permissions,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>用户管理</CardTitle>
          <div className="flex gap-2">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  添加用户
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>添加新用户</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
                  <div className="space-y-4">
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
                      <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">扫码入库</span>
                          <Switch
                            checked={newUser.app_permissions.scanIn}
                            onCheckedChange={(checked) => updateNewUserAppPermission('scanIn', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">扫码出库</span>
                          <Switch
                            checked={newUser.app_permissions.scanOut}
                            onCheckedChange={(checked) => updateNewUserAppPermission('scanOut', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">扫码查询</span>
                          <Switch
                            checked={newUser.app_permissions.scanQuery}
                            onCheckedChange={(checked) => updateNewUserAppPermission('scanQuery', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">手动查询</span>
                          <Switch
                            checked={newUser.app_permissions.manualQuery}
                            onCheckedChange={(checked) => updateNewUserAppPermission('manualQuery', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">查看记录</span>
                          <Switch
                            checked={newUser.app_permissions.viewRecords}
                            onCheckedChange={(checked) => updateNewUserAppPermission('viewRecords', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>后台权限</Label>
                      <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">库存明细</span>
                          <Switch
                            checked={newUser.web_permissions.stockView}
                            onCheckedChange={(checked) => updateNewUserWebPermission('stockView', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">入库明细</span>
                          <Switch
                            checked={newUser.web_permissions.inDetail}
                            onCheckedChange={(checked) => updateNewUserWebPermission('inDetail', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">出库明细</span>
                          <Switch
                            checked={newUser.web_permissions.outDetail}
                            onCheckedChange={(checked) => updateNewUserWebPermission('outDetail', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">批量入库</span>
                          <Switch
                            checked={newUser.web_permissions.batchImport}
                            onCheckedChange={(checked) => updateNewUserWebPermission('batchImport', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">用户管理</span>
                          <Switch
                            checked={newUser.web_permissions.userManage}
                            onCheckedChange={(checked) => updateNewUserWebPermission('userManage', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">采购质检</span>
                          <Switch
                            checked={newUser.web_permissions.qcPurchase}
                            onCheckedChange={(checked) => updateNewUserWebPermission('qcPurchase', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">生产质检</span>
                          <Switch
                            checked={newUser.web_permissions.qcProduction}
                            onCheckedChange={(checked) => updateNewUserWebPermission('qcProduction', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">次品明细</span>
                          <Switch
                            checked={newUser.web_permissions.qcDefect}
                            onCheckedChange={(checked) => updateNewUserWebPermission('qcDefect', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">质检标准</span>
                          <Switch
                            checked={newUser.web_permissions.qcStandard}
                            onCheckedChange={(checked) => updateNewUserWebPermission('qcStandard', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">操作日志</span>
                          <Switch
                            checked={newUser.web_permissions.operationLog}
                            onCheckedChange={(checked) => updateNewUserWebPermission('operationLog', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddUser}>
                        创建用户
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
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      暂无用户
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleString('zh-CN')}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleEdit(user)} variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>用户名</Label>
                  <Input value={editingUser.username} disabled />
                </div>

                <div className="space-y-2">
                  <Label>姓名</Label>
                  <Input
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>手机号</Label>
                  <Input
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value || null })}
                    placeholder="选填"
                  />
                </div>

                <div className="space-y-2">
                  <Label>角色</Label>
                  <div className="text-sm text-muted-foreground">
                    {editingUser.role === 'admin' ? '管理员（拥有所有权限）' : '普通用户'}
                  </div>
                </div>

                {editingUser.role !== 'admin' && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">App权限</Label>
                      <div className="space-y-2">
                        {[
                          { key: 'scanIn', label: '扫码入库' },
                          { key: 'scanOut', label: '扫码出库' },
                          { key: 'scanQuery', label: '扫码查询' },
                          { key: 'manualQuery', label: '手动查询' },
                          { key: 'viewRecords', label: '查看记录' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm">{label}</span>
                            <Switch
                              checked={editingUser.app_permissions[key as keyof AppPermissions]}
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
                      <div className="space-y-2">
                        {[
                          { key: 'stockView', label: '库存明细' },
                          { key: 'inDetail', label: '入库明细' },
                          { key: 'outDetail', label: '出库明细' },
                          { key: 'batchImport', label: '批量入库' },
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
                              checked={editingUser.web_permissions[key as keyof WebPermissions]}
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
