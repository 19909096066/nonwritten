import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Save, Send, RefreshCw, Loader2, Eye, EyeOff, Plus, Trash2, Edit, 
  Bot, Users, Settings, FileText, BarChart3, CheckCircle2, XCircle,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { createOperationLog } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';

// 类型定义
interface Bot {
  id: string;
  name: string;
  webhook_url: string;
  description: string;
  enabled: boolean;
  daily_limit: number;
  sent_today: number;
  group_count: number;
  created_at: string;
}

interface Group {
  id: string;
  bot_id: string;
  bot_name: string;
  group_name: string;
  group_id: string;
  webhook_url: string;
  enabled: boolean;
  mention_list: string;
  created_at: string;
}

interface Rule {
  id: string;
  name: string;
  message_type: string;
  group_ids: string;
  keyword_filter: string;
  tag_filter: string;
  priority: number;
  enabled: boolean;
  template: string;
  target_groups: { id: string; name: string }[];
}

interface MessageLog {
  id: string;
  bot_id: string;
  bot_name: string;
  group_id: string;
  group_name: string;
  message_type: string;
  content: string;
  status: string;
  sent_at: string;
}

interface Stats {
  bots: number;
  groups: number;
  rules: number;
  todayMessages: number;
}

// 消息类型选项
const MESSAGE_TYPE_OPTIONS = [
  { value: 'stock_in', label: '入库通知' },
  { value: 'stock_out', label: '出库通知' },
  { value: 'stock_warning', label: '库存预警' },
  { value: 'qc_result', label: '质检结果' },
  { value: 'system', label: '系统通知' },
  { value: 'all', label: '全部类型' },
];

export default function WeChatBotPage() {
  const [activeTab, setActiveTab] = useState<'bots' | 'groups' | 'rules' | 'logs'>('bots');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWebhook, setShowWebhook] = useState<Record<string, boolean>>({});
  
  // 数据
  const [stats, setStats] = useState<Stats>({ bots: 0, groups: 0, rules: 0, todayMessages: 0 });
  const [bots, setBots] = useState<Bot[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  
  // 编辑状态
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  
  const { profile: currentUser } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, botsRes, groupsRes, rulesRes] = await Promise.all([
        fetch('/api/wechat-bot/stats', { headers }),
        fetch('/api/wechat-bot/bots', { headers }),
        fetch('/api/wechat-bot/groups', { headers }),
        fetch('/api/wechat-bot/rules', { headers }),
      ]);
      
      if (statsRes.ok) setStats((await statsRes.json()));
      if (botsRes.ok) setBots((await botsRes.json()).bots || []);
      if (groupsRes.ok) setGroups((await groupsRes.json()).groups || []);
      if (rulesRes.ok) setRules((await rulesRes.json()).rules || []);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wechat-bot/logs?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setLogs((await res.json()).logs || []);
    } catch (error) {
      console.error('加载日志失败:', error);
    }
  };

  // ==================== 机器人操作 ====================
  const handleSaveBot = async (bot: Partial<Bot>) => {
    if (!bot.name || !bot.webhook_url) {
      toast.error('名称和Webhook URL不能为空');
      return;
    }
    
    if (!bot.webhook_url.startsWith('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=')) {
      toast.error('Webhook URL格式不正确');
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const url = bot.id ? `/api/wechat-bot/bots/${bot.id}` : '/api/wechat-bot/bots';
      const method = bot.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bot),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success(bot.id ? '更新成功' : '创建成功');
        await createOperationLog({
          operation_type: 'wechat_bot_manage',
          operator: currentUser?.name || '',
          detail: `${bot.id ? '更新' : '创建'}机器人: ${bot.name}`,
        });
        loadData();
        setEditingBot(null);
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBot = async (id: string) => {
    if (!confirm('确定删除此机器人？关联的群聊也会被删除。')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/wechat-bot/bots/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        toast.success('删除成功');
        loadData();
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleTestBot = async (bot: Bot) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/wechat-bot/bots/${bot.id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('测试消息发送成功');
      } else {
        toast.error(result.error || '发送失败');
      }
    } catch (error) {
      toast.error('测试失败');
    }
  };

  // ==================== 群聊操作 ====================
  const handleSaveGroup = async (group: Partial<Group>) => {
    if (!group.bot_id || !group.group_name) {
      toast.error('机器人和群名称不能为空');
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const url = group.id ? `/api/wechat-bot/groups/${group.id}` : '/api/wechat-bot/groups';
      const method = group.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(group),
      });
      
      if (res.ok) {
        toast.success(group.id ? '更新成功' : '创建成功');
        loadData();
        setEditingGroup(null);
      } else {
        const result = await res.json();
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('确定删除此群聊？')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/wechat-bot/groups/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('删除成功');
      loadData();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // ==================== 规则操作 ====================
  const handleSaveRule = async (rule: Partial<Rule>) => {
    if (!rule.name || !rule.message_type || !rule.group_ids) {
      toast.error('规则名称、消息类型和目标群组不能为空');
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const url = rule.id ? `/api/wechat-bot/rules/${rule.id}` : '/api/wechat-bot/rules';
      const method = rule.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(rule),
      });
      
      if (res.ok) {
        toast.success(rule.id ? '更新成功' : '创建成功');
        loadData();
        setEditingRule(null);
      } else {
        const result = await res.json();
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('确定删除此规则？')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/wechat-bot/rules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('删除成功');
      loadData();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // Tab切换时加载日志
  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">机器人总数</p>
                <p className="text-2xl font-bold text-blue-700">{stats.bots}</p>
              </div>
              <Bot className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">群聊总数</p>
                <p className="text-2xl font-bold text-green-700">{stats.groups}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">分发规则</p>
                <p className="text-2xl font-bold text-purple-700">{stats.rules}</p>
              </div>
              <Settings className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">今日消息</p>
                <p className="text-2xl font-bold text-orange-700">{stats.todayMessages}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab导航 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.32.32 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.267.267 0 00.139.045c.133 0 .241-.11.241-.245 0-.06-.024-.12-.04-.178l-.325-1.233a.492.492 0 01.177-.554c1.524-1.12 2.504-2.787 2.504-4.628 0-3.358-3.195-6.074-7.063-6.114zm-1.629 2.052c.536 0 .97.44.97.983a.976.976 0 01-.97.983.976.976 0 01-.97-.983c0-.542.434-.983.97-.983zm4.848 0c.536 0 .97.44.97.983a.976.976 0 01-.97.983.976.976 0 01-.97-.983c0-.542.434-.983.97-.983z"/>
              </svg>
              企业微信机器人管理
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
          
          <div className="flex gap-1 mt-4 border-b -mb-3">
            {[
              { key: 'bots', label: '机器人管理', icon: Bot },
              { key: 'groups', label: '群聊管理', icon: Users },
              { key: 'rules', label: '分发规则', icon: Settings },
              { key: 'logs', label: '发送日志', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* 机器人管理 */}
              {activeTab === 'bots' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setEditingBot({} as Bot)}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加机器人
                    </Button>
                  </div>
                  
                  {editingBot && (
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingBot.id ? '编辑机器人' : '新建机器人'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>机器人名称 *</Label>
                            <Input
                              value={editingBot.name || ''}
                              onChange={(e) => setEditingBot({ ...editingBot, name: e.target.value })}
                              placeholder="如：生产群机器人"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>每日限额</Label>
                            <Input
                              type="number"
                              value={editingBot.daily_limit || 1000}
                              onChange={(e) => setEditingBot({ ...editingBot, daily_limit: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Webhook URL *</Label>
                          <div className="relative">
                            <Input
                              type={showWebhook['edit'] ? 'text' : 'password'}
                              value={editingBot.webhook_url || ''}
                              onChange={(e) => setEditingBot({ ...editingBot, webhook_url: e.target.value })}
                              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
                              className="pr-20"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                              onClick={() => setShowWebhook({ ...showWebhook, edit: !showWebhook['edit'] })}
                            >
                              {showWebhook['edit'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>描述</Label>
                          <Textarea
                            value={editingBot.description || ''}
                            onChange={(e) => setEditingBot({ ...editingBot, description: e.target.value })}
                            placeholder="机器人用途说明"
                            rows={2}
                          />
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editingBot.enabled ?? true}
                              onCheckedChange={(checked) => setEditingBot({ ...editingBot, enabled: checked })}
                            />
                            <Label>启用</Label>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={() => handleSaveBot(editingBot)} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            保存
                          </Button>
                          <Button variant="outline" onClick={() => setEditingBot(null)}>
                            取消
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="space-y-3">
                    {bots.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Bot className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>暂无机器人配置</p>
                      </div>
                    ) : (
                      bots.map((bot) => (
                        <div key={bot.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${bot.enabled ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <div>
                              <div className="font-medium">{bot.name}</div>
                              <div className="text-sm text-slate-500">
                                已发送: {bot.sent_today} / {bot.daily_limit} | 群聊: {bot.group_count}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleTestBot(bot)}>
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingBot(bot)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteBot(bot.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 群聊管理 */}
              {activeTab === 'groups' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setEditingGroup({} as Group)}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加群聊
                    </Button>
                  </div>
                  
                  {editingGroup && (
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingGroup.id ? '编辑群聊' : '新建群聊'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>关联机器人 *</Label>
                            <Select
                              value={editingGroup.bot_id || ''}
                              onValueChange={(v) => setEditingGroup({ ...editingGroup, bot_id: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="选择机器人" />
                              </SelectTrigger>
                              <SelectContent>
                                {bots.map((bot) => (
                                  <SelectItem key={bot.id} value={bot.id}>{bot.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>群名称 *</Label>
                            <Input
                              value={editingGroup.group_name || ''}
                              onChange={(e) => setEditingGroup({ ...editingGroup, group_name: e.target.value })}
                              placeholder="如：生产部通知群"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>群ID（可选）</Label>
                            <Input
                              value={editingGroup.group_id || ''}
                              onChange={(e) => setEditingGroup({ ...editingGroup, group_id: e.target.value })}
                              placeholder="企业微信群ID"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>独立Webhook（可选）</Label>
                            <Input
                              value={editingGroup.webhook_url || ''}
                              onChange={(e) => setEditingGroup({ ...editingGroup, webhook_url: e.target.value })}
                              placeholder="留空则使用机器人的Webhook"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>@人员列表</Label>
                          <Input
                            value={editingGroup.mention_list || ''}
                            onChange={(e) => setEditingGroup({ ...editingGroup, mention_list: e.target.value })}
                            placeholder="成员ID，多个用逗号分隔"
                          />
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editingGroup.enabled ?? true}
                              onCheckedChange={(checked) => setEditingGroup({ ...editingGroup, enabled: checked })}
                            />
                            <Label>启用</Label>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={() => handleSaveGroup(editingGroup)} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            保存
                          </Button>
                          <Button variant="outline" onClick={() => setEditingGroup(null)}>
                            取消
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="space-y-3">
                    {groups.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>暂无群聊配置</p>
                      </div>
                    ) : (
                      groups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${group.enabled ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <div>
                              <div className="font-medium">{group.group_name}</div>
                              <div className="text-sm text-slate-500">
                                机器人: {group.bot_name}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingGroup(group)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteGroup(group.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 分发规则 */}
              {activeTab === 'rules' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setEditingRule({} as Rule)}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加规则
                    </Button>
                  </div>
                  
                  {editingRule && (
                    <Card className="border-purple-200 bg-purple-50/50">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingRule.id ? '编辑规则' : '新建规则'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>规则名称 *</Label>
                            <Input
                              value={editingRule.name || ''}
                              onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                              placeholder="如：入库通知推送"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>消息类型 *</Label>
                            <Select
                              value={editingRule.message_type || ''}
                              onValueChange={(v) => setEditingRule({ ...editingRule, message_type: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="选择消息类型" />
                              </SelectTrigger>
                              <SelectContent>
                                {MESSAGE_TYPE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>优先级</Label>
                            <Input
                              type="number"
                              value={editingRule.priority || 0}
                              onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) })}
                              placeholder="数字越大优先级越高"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>目标群组 *</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border rounded-md">
                            {groups.map((group) => (
                              <label key={group.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(editingRule.group_ids || '').split(',').includes(group.id)}
                                  onChange={(e) => {
                                    const currentIds = (editingRule.group_ids || '').split(',').filter(Boolean);
                                    const newIds = e.target.checked
                                      ? [...currentIds, group.id]
                                      : currentIds.filter((id) => id !== group.id);
                                    setEditingRule({ ...editingRule, group_ids: newIds.join(',') });
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{group.group_name}</span>
                              </label>
                            ))}
                          </div>
                          {groups.length === 0 && (
                            <p className="text-sm text-amber-600">请先添加群聊</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>关键词过滤</Label>
                            <Input
                              value={editingRule.keyword_filter || ''}
                              onChange={(e) => setEditingRule({ ...editingRule, keyword_filter: e.target.value })}
                              placeholder="多个关键词用逗号分隔"
                            />
                            <p className="text-xs text-slate-500">只有包含这些关键词的消息才会推送</p>
                          </div>
                          <div className="space-y-2">
                            <Label>标签过滤</Label>
                            <Input
                              value={editingRule.tag_filter || ''}
                              onChange={(e) => setEditingRule({ ...editingRule, tag_filter: e.target.value })}
                              placeholder="多个标签用逗号分隔"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>消息模板</Label>
                          <Textarea
                            value={editingRule.template || ''}
                            onChange={(e) => setEditingRule({ ...editingRule, template: e.target.value })}
                            placeholder="使用 {content} 和 {time} 作为占位符"
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editingRule.enabled ?? true}
                              onCheckedChange={(checked) => setEditingRule({ ...editingRule, enabled: checked })}
                            />
                            <Label>启用</Label>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={() => handleSaveRule(editingRule)} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            保存
                          </Button>
                          <Button variant="outline" onClick={() => setEditingRule(null)}>
                            取消
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="space-y-3">
                    {rules.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Settings className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>暂无分发规则</p>
                      </div>
                    ) : (
                      rules.map((rule) => (
                        <div key={rule.id} className="p-4 border rounded-lg hover:bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-purple-500' : 'bg-slate-300'}`} />
                              <span className="font-medium">{rule.name}</span>
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {MESSAGE_TYPE_OPTIONS.find(o => o.value === rule.message_type)?.label || rule.message_type}
                              </span>
                              <span className="text-xs text-slate-500">优先级: {rule.priority}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setEditingRule(rule)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteRule(rule.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {rule.target_groups?.map((g) => (
                              <span key={g.id} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                {g.name}
                              </span>
                            ))}
                          </div>
                          {rule.keyword_filter && (
                            <div className="mt-2 text-xs text-slate-500">
                              关键词: {rule.keyword_filter}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 发送日志 */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">最近50条消息</h3>
                    <Button variant="outline" size="sm" onClick={loadLogs}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      刷新
                    </Button>
                  </div>
                  
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p>暂无发送记录</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                          <div className="flex items-center gap-3">
                            {log.status === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <div>
                              <div className="font-medium">
                                [{MESSAGE_TYPE_OPTIONS.find(o => o.value === log.message_type)?.label || log.message_type}]
                                → {log.group_name}
                              </div>
                              <div className="text-slate-500 text-xs truncate max-w-md">
                                {log.content?.substring(0, 100)}...
                              </div>
                            </div>
                          </div>
                          <div className="text-slate-400 text-xs">
                            {new Date(log.sent_at).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            使用说明
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-slate-700">1. 创建机器人</h4>
              <p>在企业微信群中添加机器人，获取Webhook地址后在此创建机器人配置</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-700">2. 配置群聊</h4>
              <p>为每个机器人绑定一个或多个群聊，可设置独立Webhook和@人员列表</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-700">3. 设置分发规则</h4>
              <p>根据消息类型（入库、出库、质检等）配置推送到哪些群聊，支持关键词和标签过滤</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-700">4. 消息自动分发</h4>
              <p>系统在业务操作时自动调用分发逻辑，根据规则将消息推送到对应群聊</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-blue-700 font-medium">API调用示例：</p>
            <code className="text-xs block mt-1 text-blue-600">
              POST /api/wechat-bot/send {'{'} "message_type": "stock_in", "content": "新入库通知", "tags": ["urgent"] {'}'}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
