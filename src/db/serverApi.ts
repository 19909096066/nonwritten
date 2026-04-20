// 腾讯云服务器 API 接口
// 服务器地址: 81.70.90.164

const SERVER_URL = 'http://81.70.90.164:3001/api';

// 获取 token
function getToken(): string | null {
  return localStorage.getItem('token');
}

// 通用请求函数
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${SERVER_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // 未授权，清除登录状态
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('登录已过期，请重新登录');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== 认证相关 API ====================

export const authApi = {
  // 登录
  async login(phone: string, password: string) {
    const data = await request<{
      token: string;
      user: {
        id: string;
        name: string;
        phone: string;
        role: 'admin' | 'user';
        app_permissions?: Record<string, boolean>;
        web_permissions?: Record<string, boolean>;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    // 保存到本地存储
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  },

  // 获取用户信息
  async getProfile() {
    return request<{
      id: string;
      name: string;
      phone: string;
      role: 'admin' | 'user';
      app_permissions?: Record<string, boolean>;
      web_permissions?: Record<string, boolean>;
    }>('/auth/profile');
  },

  // 退出登录
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ==================== 用户管理 API ====================

export const userApi = {
  // 获取用户列表
  async getUsers() {
    return request<Array<{
      id: string;
      username: string;
      name: string;
      phone: string;
      role: 'admin' | 'user';
      is_active: boolean;
      created_at: string;
      last_login?: string | null;
      app_permissions?: Record<string, boolean>;
      web_permissions?: Record<string, boolean>;
    }>>('/users');
  },

  // 创建用户
  async createUser(userData: {
    phone: string;
    name: string;
    password: string;
    role: 'admin' | 'user';
    app_permissions?: Record<string, boolean>;
    web_permissions?: Record<string, boolean>;
  }) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 更新用户
  async updateUser(id: string, updates: Partial<{
    name: string;
    phone: string;
    role: 'admin' | 'user';
    is_active: boolean;
    app_permissions: Record<string, boolean>;
    web_permissions: Record<string, boolean>;
  }>) {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除用户
  async deleteUser(id: string) {
    return request(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== 原材料管理 API ====================

export interface RawMaterial {
  id: string;
  qr_code: string;
  batch_no: string;
  package_no: string;
  model: string;
  production_date: string;
  weight: number;
  unit: string;
  status: 'in_stock' | 'out_stock';
  operator: string;
  device: string;
  created_at: string;
  out_at?: string;
  remark?: string;
}

export const materialApi = {
  // 获取原材料列表
  async getRawMaterials(params: {
    page?: number;
    pageSize?: number;
    batchNo?: string;
    model?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, pageSize = 20, batchNo, model, status, startDate, endDate } = params;
    
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(page));
    queryParams.append('pageSize', String(pageSize));
    if (batchNo) queryParams.append('batchNo', batchNo);
    if (model) queryParams.append('model', model);
    if (status) queryParams.append('status', status);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return request<{ data: RawMaterial[]; total: number }>(`/materials?${queryParams.toString()}`);
  },

  // 根据二维码获取物料
  async getRawMaterialByQrCode(qrCode: string) {
    return request<RawMaterial | null>(`/materials/qr/${encodeURIComponent(qrCode)}`);
  },

  // 创建原材料（入库）
  async createRawMaterial(material: Omit<RawMaterial, 'id' | 'created_at' | 'out_at'>) {
    return request<RawMaterial>('/materials', {
      method: 'POST',
      body: JSON.stringify(material),
    });
  },

  // 出库
  async outRawMaterial(qrCode: string, operator: string) {
    return request<RawMaterial>('/materials/out', {
      method: 'POST',
      body: JSON.stringify({ qrCode, operator }),
    });
  },

  // 批量创建
  async batchCreateRawMaterials(materials: Omit<RawMaterial, 'id' | 'created_at' | 'out_at'>[]) {
    return request<RawMaterial[]>('/materials/batch', {
      method: 'POST',
      body: JSON.stringify({ materials }),
    });
  },

  // 获取批次号列表
  async getBatchNumbers() {
    return request<string[]>('/materials/batches');
  },

  // 获取型号列表
  async getModels() {
    return request<string[]>('/materials/models');
  },

  // 获取包装号列表
  async getPackageNumbersByBatch(batchNo: string) {
    return request<Array<{ package_no: string; model: string }>>(`/materials/packages?batchNo=${encodeURIComponent(batchNo)}`);
  },
};

// ==================== 操作日志 API ====================

export interface OperationLog {
  id: string;
  qr_code?: string;
  operation_type: 'IN' | 'OUT';
  operator: string;
  operate_time: string;
  detail?: string;
  device?: string;
}

export const logApi = {
  // 创建操作日志
  async createOperationLog(log: Omit<OperationLog, 'id'>) {
    return request('/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },

  // 获取操作日志列表
  async getOperationLogs(params: {
    page?: number;
    pageSize?: number;
    operationType?: string;
    operator?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, pageSize = 20, operationType, operator, startDate, endDate } = params;
    
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(page));
    queryParams.append('pageSize', String(pageSize));
    if (operationType) queryParams.append('operationType', operationType);
    if (operator) queryParams.append('operator', operator);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return request<{ data: OperationLog[]; total: number }>(`/logs?${queryParams.toString()}`);
  },
};

// ==================== 统计数据 API ====================

export interface DashboardStats {
  totalStock: number;
  totalWeight: number;
  todayIn: number;
  todayInWeight: number;
  todayOut: number;
  todayOutWeight: number;
  todaySplit: number;
  todaySplitWeight: number;
  pendingQc?: number;
}

// 库存趋势数据类型
export interface StockTrendItem {
  date: string;
  in_count: number;
  in_weight: number;
  cumulative_count: number;
  cumulative_weight: number;
}

// 库龄分布数据类型
export interface AgeDistribution {
  groups: {
    '0-7天': { count: number; weight: number };
    '8-30天': { count: number; weight: number };
    '31-90天': { count: number; weight: number };
    '90天以上': { count: number; weight: number };
  };
  details?: Array<{
    id: string;
    batch_no: string;
    model: string;
    weight: number;
    age: number;
  }>;
}

// 呆滞物料数据类型
export interface DeadStockItem {
  id: string;
  qr_code: string;
  batch_no: string;
  package_no: string;
  model: string;
  weight: number;
  production_date: string;
  status: string;
  age: number;
}

// 出入库汇总数据类型
export interface InOutSummary {
  typeStats: Array<{ operation_type: string; count: number }>;
  operatorStats: Array<{ operator: string; operation_type: string; count: number }>;
  modelStats: Array<{ operation_type: string; count: number }>;
}

// 操作员排行数据类型
export interface OperatorRankingItem {
  operator: string;
  total_count: number;
  in_count: number;
  out_count: number;
  split_count: number;
  other_count: number;
}

// 设备负载数据类型
export interface DeviceLoadItem {
  device: string;
  count: number;
}

// 小时分布数据类型
export interface HourlyDistributionItem {
  hour: number;
  in_count: number;
  out_count: number;
  split_count: number;
}

export const statsApi = {
  // 获取仪表盘统计数据
  async getDashboardStats() {
    return request<DashboardStats>('/stats/dashboard');
  },

  // 获取型号库存分布
  async getModelStockDistribution() {
    return request<Array<{ model: string; weight: number }>>('/stats/model-distribution');
  },

  // 获取近7天趋势
  async getWeeklyTrend() {
    return request<Array<{ date: string; inCount: number; outCount: number }>>('/stats/weekly-trend');
  },

  // 获取库存趋势（新增）
  async getStockTrend(params?: { days?: number; model?: string; batchNo?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append('days', String(params.days));
    if (params?.model) queryParams.append('model', params.model);
    if (params?.batchNo) queryParams.append('batchNo', params.batchNo);
    return request<StockTrendItem[]>(`/stats/stock-trend?${queryParams.toString()}`);
  },

  // 获取库龄分布（新增）
  async getAgeDistribution(params?: { model?: string; batchNo?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.model) queryParams.append('model', params.model);
    if (params?.batchNo) queryParams.append('batchNo', params.batchNo);
    return request<AgeDistribution>(`/stats/age-distribution?${queryParams.toString()}`);
  },

  // 获取呆滞物料（新增）
  async getDeadStock(params?: { days?: number; model?: string; batchNo?: string; page?: number; pageSize?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append('days', String(params.days));
    if (params?.model) queryParams.append('model', params.model);
    if (params?.batchNo) queryParams.append('batchNo', params.batchNo);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
    return request<{ data: DeadStockItem[]; total: number }>(`/stats/dead-stock?${queryParams.toString()}`);
  },

  // 获取出入库汇总（新增）
  async getInOutSummary(params?: { startDate?: string; endDate?: string; model?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.model) queryParams.append('model', params.model);
    return request<InOutSummary>(`/stats/inout-summary?${queryParams.toString()}`);
  },

  // 获取操作员排行（新增）
  async getOperatorRanking(params?: { startDate?: string; endDate?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    return request<OperatorRankingItem[]>(`/stats/operator-ranking?${queryParams.toString()}`);
  },

  // 获取设备负载（新增）
  async getDeviceLoad(params?: { startDate?: string; endDate?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    return request<DeviceLoadItem[]>(`/stats/device-load?${queryParams.toString()}`);
  },

  // 获取小时分布（新增）
  async getHourlyDistribution(params?: { startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return request<HourlyDistributionItem[]>(`/stats/hourly-distribution?${queryParams.toString()}`);
  },
};

// ==================== 二维码解析 ====================

export interface QrCodeData {
  batchNo: string;
  packageNo: string;
  unit: string;
  productionDate: string;
  weight: number;
  model: string;
}

export function parseQrCode(qrCode: string): QrCodeData | null {
  try {
    const parts = qrCode.split('~');
    if (parts.length !== 5) return null;

    const [part1, unit, productionDate, weightStr, model] = parts;
    const lastDashIndex = part1.lastIndexOf('-');
    if (lastDashIndex === -1) return null;

    const batchNo = part1.substring(0, lastDashIndex);
    const packageNo = part1.substring(lastDashIndex + 1);
    const weight = Number.parseFloat(weightStr);

    if (Number.isNaN(weight)) return null;

    return {
      batchNo,
      packageNo,
      unit,
      productionDate,
      weight,
      model,
    };
  } catch (error) {
    console.error('解析二维码失败:', error);
    return null;
  }
}

// 统一导出
export default {
  production: productionApi,
  auth: authApi,
  user: userApi,
  material: materialApi,
  log: logApi,
  stats: statsApi,
  parseQrCode,
};


// ==================== 生产管理 API ====================

// 产品类型
export interface Product {
  id: string;
  product_code: string;
  product_name: string;
  spec_gsm: number;
  spec_width: number;
  spec_color: string;
  spec_material: string;
  unit: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// BOM类型
export interface BomHeader {
  id: string;
  bom_code: string;
  product_id: string;
  product_name?: string;
  spec_gsm?: number;
  spec_width?: number;
  spec_color?: string;
  bom_version: string;
  effective_date: string;
  status: 'draft' | 'active' | 'deprecated';
  total_loss_rate: number;
  remarks: string;
  created_by: string;
  created_at: string;
}

export interface BomItem {
  id: string;
  bom_id: string;
  material_model: string;
  quantity_per_unit: number;
  loss_rate: number;
  unit: string;
  material_order: number;
  remarks: string;
}

// 工单类型
export interface WorkOrder {
  id: string;
  order_no: string;
  product_id: string;
  product_name?: string;
  spec_gsm?: number;
  spec_width?: number;
  spec_color?: string;
  unit?: string;
  bom_id: string;
  bom_version?: string;
  plan_quantity: number;
  completed_quantity: number;
  qualified_quantity: number;
  reject_quantity: number;
  due_date: string;
  priority: number;
  status: 'pending' | 'released' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  line_id: string;
  remarks: string;
  created_by: string;
  created_at: string;
}

export interface WorkOrderMaterial {
  id: string;
  work_order_id: string;
  material_model: string;
  plan_quantity: number;
  actual_quantity: number;
  picked_quantity: number;
  shortage_quantity: number;
}

// 成品入库类型
export interface FinishedProduct {
  id: string;
  product_id: string;
  product_name?: string;
  spec_gsm?: number;
  spec_width?: number;
  spec_color?: number;
  unit?: string;
  work_order_id: string;
  order_no?: string;
  batch_no: string;
  quantity: number;
  qualified_qty: number;
  reject_qty: number;
  weight: number;
  warehouse: string;
  operator: string;
  produced_at: string;
  created_at: string;
}

// 生产管理 API
export const productionApi = {
  // -------- 产品管理 --------
  async getProducts(params?: { is_active?: number; keyword?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ success: boolean; data: Product[] }>(`/production/products${query}`);
  },

  async getProduct(id: string) {
    return request<{ success: boolean; data: Product }>(`/production/products/${id}`);
  },

  async createProduct(data: Partial<Product>) {
    return request<{ success: boolean; data: Product }>('/production/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, data: Partial<Product>) {
    return request<{ success: boolean; data: Product }>(`/production/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(id: string) {
    return request<{ success: boolean; message: string }>(`/production/products/${id}`, {
      method: 'DELETE',
    });
  },

  // -------- BOM管理 --------
  async getBoms(params?: { product_id?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ success: boolean; data: BomHeader[] }>(`/production/boms${query}`);
  },

  async getBom(id: string) {
    return request<{ success: boolean; data: BomHeader & { items: BomItem[] } }>(`/production/boms/${id}`);
  },

  async createBom(data: { product_id: string; bom_version?: string; effective_date: string; total_loss_rate?: number; remarks?: string; items: Partial<BomItem>[] }) {
    return request<{ success: boolean; data: BomHeader }>('/production/boms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBom(id: string, data: Partial<BomHeader>) {
    return request<{ success: boolean; data: BomHeader }>(`/production/boms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateBomItems(id: string, items: Partial<BomItem>[]) {
    return request<{ success: boolean; message: string }>(`/production/boms/${id}/items`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },

  async activateBom(id: string) {
    return request<{ success: boolean; message: string }>(`/production/boms/${id}/activate`, {
      method: 'PUT',
    });
  },

  async deleteBom(id: string) {
    return request<{ success: boolean; message: string }>(`/production/boms/${id}`, {
      method: 'DELETE',
    });
  },

  // -------- 工单管理 --------
  async getWorkOrders(params?: { status?: string; product_id?: string; keyword?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ success: boolean; data: WorkOrder[] }>(`/production/workorders${query}`);
  },

  async getWorkOrder(id: string) {
    return request<{ success: boolean; data: WorkOrder & { materials: WorkOrderMaterial[] } }>(`/production/workorders/${id}`);
  },

  async createWorkOrder(data: { product_id: string; bom_id: string; plan_quantity: number; due_date?: string; priority?: number; line_id?: string; remarks?: string }) {
    return request<{ success: boolean; data: WorkOrder }>('/production/workorders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateWorkOrderStatus(id: string, status: string) {
    return request<{ success: boolean; data: WorkOrder }>(`/production/workorders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async completeWorkOrder(id: string, data: { qualified_quantity: number; reject_quantity?: number; finished_products?: Partial<FinishedProduct>[] }) {
    return request<{ success: boolean; message: string }>(`/production/workorders/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteWorkOrder(id: string) {
    return request<{ success: boolean; message: string }>(`/production/workorders/${id}`, {
      method: 'DELETE',
    });
  },

  // -------- 成品入库 --------
  async getFinishedProducts(params?: { product_id?: string; start_date?: string; end_date?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ success: boolean; data: FinishedProduct[] }>(`/production/finished${query}`);
  },

  async createFinishedProduct(data: Partial<FinishedProduct>) {
    return request<{ success: boolean; data: FinishedProduct }>('/production/finished', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteFinishedProduct(id: string) {
    return request<{ success: boolean; message: string }>(`/production/finished/${id}`, {
      method: 'DELETE',
    });
  },

  // -------- 统计 --------
  async getOutputStats(params?: { start_date?: string; end_date?: string; group_by?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.group_by) searchParams.set('group_by', params.group_by);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ success: boolean; data: any[] }>(`/production/stats/output${query}`);
  },

  async getWorkOrderStats() {
    return request<{ success: boolean; data: any[] }>('/production/stats/workorders');
  },
};
