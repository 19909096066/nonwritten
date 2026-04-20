// 用户角色
export type UserRole = 'admin' | 'user';

// 物料状态
export type MaterialStatus = 'in_stock' | 'out_stock' | 'split';

// 操作类型 - 与数据库文档一致
export type OperationType = 'IN' | 'OUT' | 'IMPORT' | 'USER_ADD' | 'USER_EDIT' | 'USER_DELETE' | 'QC_ADD' | 'QC_EDIT' | 'QC_DELETE' | 'LOGIN' | 'LOGOUT';

// 质检结果
export type QcResult = 'qualified' | 'unqualified';

// 质检来源
export type QcSource = 'purchase' | 'production';

// App权限
export interface AppPermissions {
  scanIn: boolean;
  scanOut: boolean;
  scanSplit: boolean; // 扫码拆包
  scanQuery: boolean;
  manualQuery: boolean;
  viewRecords: boolean;
  viewStockStats: boolean; // 查看库存统计（总库存、总重量）
}

// 后台权限
export interface WebPermissions {
  stockView: boolean;
  inDetail: boolean;
  outDetail: boolean;
  userManage: boolean;
  qcPurchase: boolean;
  qcProduction: boolean;
  qcDefect: boolean;
  qcStandard: boolean;
  operationLog: boolean;
}

// 用户信息
export interface Profile {
  id: string;
  username: string;
  phone: string | null;
  name: string;
  role: UserRole;
  app_permissions: AppPermissions;
  web_permissions: WebPermissions;
  is_active: boolean; // 是否启用
  created_at: string;
  last_login: string | null;
}

// 原材料 - 严格按照数据库字段文档
export interface RawMaterial {
  id: string;
  qr_code: string;
  batch_no: string;
  package_no: string;
  model: string;
  production_date: string;
  weight: number;
  unit: string;
  status: MaterialStatus;
  created_at: string;
  split_at: string | null;
  out_at: string | null;
  operator: string | null;
  remark: string | null;
  device: string | null;
}

// 操作日志 - 严格按照数据库字段文档
export interface OperationLog {
  id: string;
  qr_code: string | null;
  operation_type: OperationType;
  operator: string;
  operate_time: string;
  detail: string | null;
  device: string | null;
}

// 质检标准
export interface QcStandard {
  id: string;
  material_model: string;
  weight_tolerance: {
    min: number;
    max: number;
  };
  thickness_tolerance: {
    min: number;
    max: number;
  };
  created_at: string;
  updated_at: string;
}

// 采购质检
export interface QcPurchase {
  id: string;
  time: string;
  batch_no: string;
  package_no: string;
  material_model: string;
  weight: number;
  thickness: number;
  result: QcResult;
  reason: string | null;
  inspector: string;
  created_at: string;
}

// 生产质检明细项
export interface QcProductionDetail {
  time: string;
  productId: string;
  result: string;
}

// 生产质检汇总
export interface QcProduction {
  id: string;
  date: string;
  line: string;
  qualified_count: number;
  unqualified_count: number;
  rate: number;
  details: QcProductionDetail[];
  created_at: string;
}

// 次品明细
export interface QcDefect {
  id: string;
  source: QcSource;
  time: string;
  batch_no: string | null;
  line: string | null;
  package_no: string;
  material_model: string | null;
  reason: string;
  created_at: string;
}

// 二维码解析结果
export interface QrCodeData {
  batchNo: string;
  packageNo: string;
  unit: string;
  productionDate: string;
  weight: number;
  model: string;
}

// 统计数据
export interface DashboardStats {
  totalStock: number;
  totalWeight: number;
  todayIn: number;
  todayInWeight: number;
  todayOut: number;
  todayOutWeight: number;
  todaySplit: number;
  todaySplitWeight: number;
  pendingQc: number;
}

// API 通用响应
export interface ApiResponse<T> {
  data: T;
  total?: number;
  error?: Error;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 材料查询参数
export interface MaterialQueryParams extends PaginationParams {
  batchNo?: string;
  model?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// 采购参数
export interface PurchaseParam {
  id: string | null;
  model: string;
  stock_days: number;      // 备货库存天数
  lead_days: number;       // 进货周期
  min_purchase: number;    // 最小采购量
  enabled: boolean;        // 是否启用
  created_at?: string;
  updated_at?: string;
}

// 每日出库统计
export interface DailyOutStat {
  id: string;
  model: string;
  date: string;
  out_count: number;
  out_weight: number;
  created_at: string;
  updated_at: string;
}

// 采购建议
export interface PurchaseSuggestion {
  id: string;
  model: string;
  current_stock: number;    // 当前库存
  avg_daily_out: number;    // 日均出库量
  reorder_point: number;    // 再订货点
  suggest_qty: number;      // 建议采购量
  stock_days: number;       // 使用的备货天数
  lead_days: number;        // 使用的进货周期
  days_with_data: number;   // 有数据的天数
  status: 'pending' | 'processed' | 'ignored';  // 状态
  remark?: string;
  created_at: string;
  updated_at: string;
}

// 出库趋势数据
export interface OutTrend {
  date: string;
  out_count: number;
  out_weight: number;
}

// 用户创建参数
export interface CreateUserParams {
  username: string;
  password: string;
  phone: string;
  name: string;
  role: UserRole;
  app_permissions: AppPermissions;
  web_permissions: WebPermissions;
}

// 用户更新参数
export interface UpdateUserParams {
  username?: string;
  phone?: string;
  name?: string;
  role?: UserRole;
  app_permissions?: Partial<AppPermissions>;
  web_permissions?: Partial<WebPermissions>;
}

// 操作日志查询参数
export interface LogQueryParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
  operationType?: OperationType;
  operator?: string;
}

// 质检标准创建参数
export interface CreateQcStandardParams {
  material_model: string;
  weight_tolerance: { min: number; max: number };
  thickness_tolerance: { min: number; max: number };
}

// 质检标准更新参数
export interface UpdateQcStandardParams {
  material_model?: string;
  weight_tolerance?: { min: number; max: number };
  thickness_tolerance?: { min: number; max: number };
}

// 采购质检参数
export interface CreateQcPurchaseParams {
  batch_no: string;
  package_no: string;
  material_model: string;
  weight: number;
  thickness: number;
  result: QcResult;
  reason?: string;
}
