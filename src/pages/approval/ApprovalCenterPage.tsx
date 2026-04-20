import { useState, useEffect } from 'react';

interface ApprovalItem {
  id: string;
  flow_name: string;
  flow_code: string;
  target_table: string;
  target_id: string;
  target_title: string;
  target_summary: string;
  requester_name: string;
  approver_name: string;
  current_step: number;
  total_steps: number;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  expired_at: string;
}

interface FlowDef {
  id: string;
  flow_name: string;
  flow_code: string;
  flow_type: string;
  description: string;
}

export default function ApprovalCenterPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [flows, setFlows] = useState<FlowDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    fetchApprovals();
    fetchFlows();
  }, [activeTab]);

  const fetchApprovals = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      let url = '/api/approval/records?pageSize=50';
      if (activeTab !== 'all') {
        url += `&status=${activeTab === 'pending' ? 'pending' : activeTab}`;
      }
      
      const res = await fetch(url, { headers });
      const json = await res.json();
      
      if (json.code === 0 || json.success) {
        setApprovals(json.data || []);
      } else {
        console.error('获取审批数据失败', json);
        // 使用模拟数据
        setApprovals([]);
      }
    } catch (error) {
      console.error('获取审批数据失败', error);
      setApprovals([]);
    }
    setLoading(false);
  };

  const fetchFlows = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/approval/flows?pageSize=100', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.code === 0 || json.success) {
        setFlows(json.data || []);
      }
    } catch (error) {
      console.error('获取流程定义失败', error);
    }
  };

  const handleApprove = async (item: ApprovalItem) => {
    setActionLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/approval/records/${item.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark })
      });
      const json = await res.json();
      if (json.code === 0 || json.success) {
        alert('审批通过！');
        setSelectedItem(null);
        setRemark('');
        fetchApprovals();
      } else {
        alert('审批失败：' + (json.message || '未知错误'));
      }
    } catch (error) {
      alert('审批失败');
    }
    setActionLoading(false);
  };

  const handleReject = async (item: ApprovalItem) => {
    if (!remark.trim()) {
      alert('请填写驳回原因');
      return;
    }
    setActionLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/approval/records/${item.id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark })
      });
      const json = await res.json();
      if (json.code === 0 || json.success) {
        alert('已驳回！');
        setSelectedItem(null);
        setRemark('');
        fetchApprovals();
      } else {
        alert('驳回失败：' + (json.message || '未知错误'));
      }
    } catch (error) {
      alert('驳回失败');
    }
    setActionLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '待审批' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: '已通过' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '已驳回' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: '已撤回' }
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return <span className={`px-2 py-1 rounded text-xs ${badge.bg} ${badge.text}`}>{badge.label}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    const labels: Record<string, string> = {
      high: '紧急',
      medium: '普通',
      low: '低'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[priority] || ''}`}>{labels[priority] || priority}</span>;
  };

  const getStepProgress = (current: number, total: number) => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{current}/{total}</span>
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full" 
            style={{ width: `${(current / total) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📋 审批中心</h1>
          <p className="text-gray-500">审批流程管理 / 待办处理 / 审批历史</p>
        </div>
        <button 
          onClick={() => fetchApprovals()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔄 刷新
        </button>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'pending', label: '待我审批', count: pendingCount },
          { key: 'approved', label: '已通过', count: 0 },
          { key: 'rejected', label: '已驳回', count: 0 },
          { key: 'all', label: '全部', count: 0 }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-white text-blue-500' : 'bg-red-500 text-white'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 审批列表 */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-4 border-b">
              <h3 className="font-bold">
                {activeTab === 'pending' ? '📝 待审批列表' : 
                 activeTab === 'approved' ? '✅ 已通过列表' : 
                 activeTab === 'rejected' ? '❌ 已驳回列表' : '📋 全部审批'}
              </h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : approvals.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-5xl mb-2">📭</div>
                <div>暂无{activeTab === 'pending' ? '待审批' : activeTab === 'approved' ? '已通过' : activeTab === 'rejected' ? '已驳回' : ''}记录</div>
              </div>
            ) : (
              <div className="divide-y">
                {approvals.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedItem?.id === item.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getPriorityBadge(item.priority)}
                          <span className="font-medium">{item.flow_name || '审批流程'}</span>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {item.target_title || item.target_summary || '审批事项'}
                        </div>
                        <div className="text-xs text-gray-400">
                          申请人：{item.requester_name || '系统'} | 
                          当前审批人：{item.approver_name || '-'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        {getStepProgress(item.current_step, item.total_steps)}
                        <div className="mt-1">{formatDate(item.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 详情面板 */}
        <div className="col-span-1">
          {selectedItem ? (
            <div className="bg-white rounded-xl shadow-lg sticky top-6">
              <div className="p-4 border-b">
                <h3 className="font-bold">审批详情</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* 基本信息 */}
                <div>
                  <label className="text-xs text-gray-500">流程名称</label>
                  <div className="font-medium">{selectedItem.flow_name || '-'}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">审批事项</label>
                  <div className="font-medium">{selectedItem.target_title || selectedItem.target_summary || '-'}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">申请人</label>
                  <div>{selectedItem.requester_name || '-'}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">当前审批人</label>
                  <div>{selectedItem.approver_name || '-'}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">申请时间</label>
                  <div>{formatDate(selectedItem.created_at)}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">状态</label>
                  <div>{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">审批进度</label>
                  <div className="mt-1">{getStepProgress(selectedItem.current_step, selectedItem.total_steps)}</div>
                </div>

                {/* 审批操作 */}
                {selectedItem.status === 'pending' && (
                  <div className="pt-4 border-t space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">审批意见</label>
                      <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="请输入审批意见（驳回时必填）"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(selectedItem)}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                      >
                        ✅ 通过
                      </button>
                      <button
                        onClick={() => handleReject(selectedItem)}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                      >
                        ❌ 驳回
                      </button>
                    </div>
                  </div>
                )}

                {/* 非待审批状态显示历史操作 */}
                {selectedItem.status !== 'pending' && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-500 mb-2">审批结果</div>
                    <div className={`p-3 rounded-lg ${
                      selectedItem.status === 'approved' ? 'bg-green-50 text-green-800' : 
                      selectedItem.status === 'rejected' ? 'bg-red-50 text-red-800' : 'bg-gray-50'
                    }`}>
                      {selectedItem.status === 'approved' ? '✅ 已通过' : 
                       selectedItem.status === 'rejected' ? '❌ 已驳回' : 
                       selectedItem.status === 'cancelled' ? '📌 已撤回' : selectedItem.status}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-400">
              <div className="text-5xl mb-2">👈</div>
              <div>选择一条审批记录查看详情</div>
            </div>
          )}
        </div>
      </div>

      {/* 流程定义列表 */}
      {flows.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-lg">
          <div className="p-4 border-b">
            <h3 className="font-bold">📌 审批流程定义</h3>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            {flows.map((flow) => (
              <div key={flow.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="font-medium mb-1">{flow.flow_name}</div>
                <div className="text-xs text-gray-500">
                  <span className="mr-3">编码：{flow.flow_code}</span>
                  <span>类型：{flow.flow_type}</span>
                </div>
                {flow.description && (
                  <div className="text-xs text-gray-400 mt-1">{flow.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
