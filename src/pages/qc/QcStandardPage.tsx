import { useEffect, useState } from 'react';
import { getQcStandards, createQcStandard, updateQcStandard, deleteQcStandard } from '@/db/api';
import type { QcStandard } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function QcStandardPage() {
  const [standards, setStandards] = useState<QcStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<Partial<QcStandard> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getQcStandards();
      setStandards(data);
    } catch (error) {
      console.error('加载质检标准失败:', error);
      toast.error('加载质检标准失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStandard({
      material_model: '',
      weight_tolerance: { min: 0, max: 0 },
      thickness_tolerance: { min: 0, max: 0 },
    });
    setDialogOpen(true);
  };

  const handleEdit = (standard: QcStandard) => {
    setEditingStandard({ ...standard });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingStandard) return;

    if (!editingStandard.material_model) {
      toast.error('请输入原材料型号');
      return;
    }

    try {
      if (editingStandard.id) {
        await updateQcStandard(editingStandard.id, editingStandard as QcStandard);
        toast.success('更新成功');
      } else {
        await createQcStandard(editingStandard as Omit<QcStandard, 'id' | 'created_at' | 'updated_at'>);
        toast.success('添加成功');
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteQcStandard(deletingId);
      toast.success('删除成功');
      setDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>质检标准</CardTitle>
          <div className="flex gap-2">
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
            <Button onClick={handleAdd} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              新增标准
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>原材料型号</TableHead>
                  <TableHead>克重偏差下限(g)</TableHead>
                  <TableHead>克重偏差上限(g)</TableHead>
                  <TableHead>厚度偏差下限(mm)</TableHead>
                  <TableHead>厚度偏差上限(mm)</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : standards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      暂无质检标准
                    </TableCell>
                  </TableRow>
                ) : (
                  standards.map((standard) => (
                    <TableRow key={standard.id}>
                      <TableCell className="font-medium">{standard.material_model}</TableCell>
                      <TableCell>{standard.weight_tolerance.min}</TableCell>
                      <TableCell>{standard.weight_tolerance.max}</TableCell>
                      <TableCell>{standard.thickness_tolerance.min}</TableCell>
                      <TableCell>{standard.thickness_tolerance.max}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button onClick={() => handleEdit(standard)} variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setDeletingId(standard.id);
                              setDeleteDialogOpen(true);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStandard?.id ? '编辑质检标准' : '新增质检标准'}</DialogTitle>
          </DialogHeader>
          {editingStandard && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>原材料型号</Label>
                <Input
                  value={editingStandard.material_model}
                  onChange={(e) =>
                    setEditingStandard({ ...editingStandard, material_model: e.target.value })
                  }
                  placeholder="例如：B1250050T1"
                  disabled={!!editingStandard.id}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>克重偏差下限(g)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingStandard.weight_tolerance?.min || 0}
                    onChange={(e) =>
                      setEditingStandard({
                        ...editingStandard,
                        weight_tolerance: {
                          ...editingStandard.weight_tolerance!,
                          min: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>克重偏差上限(g)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingStandard.weight_tolerance?.max || 0}
                    onChange={(e) =>
                      setEditingStandard({
                        ...editingStandard,
                        weight_tolerance: {
                          ...editingStandard.weight_tolerance!,
                          max: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>厚度偏差下限(mm)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingStandard.thickness_tolerance?.min || 0}
                    onChange={(e) =>
                      setEditingStandard({
                        ...editingStandard,
                        thickness_tolerance: {
                          ...editingStandard.thickness_tolerance!,
                          min: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>厚度偏差上限(mm)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingStandard.thickness_tolerance?.max || 0}
                    onChange={(e) =>
                      setEditingStandard({
                        ...editingStandard,
                        thickness_tolerance: {
                          ...editingStandard.thickness_tolerance!,
                          max: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSave}>保存</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条质检标准吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
