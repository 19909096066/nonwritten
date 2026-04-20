// 用户角色
export type UserRole = 'admin' | 'user';

// 物料状态
export type MaterialStatus = 'in_stock' | 'out_stock';

// 操作类型
export type OperationType = 'IN' | 'OUT' | 'QUERY' | 'IMPORT' | 'USER_ADD' | 'USER_EDIT' | 'USER_DELETE' | 'QC_ADD' | 'QC_EDIT' | 'QC_DELETE' | 'LOGIN' | 'LOGOUT';

// 质检结果
export type QcResult = 'qualified' | 'unqualified';

// 质检来源
export type QcSource = 'purchase' | 'production';

// App权限
export interface AppPermissions {
  scanIn: boolean;
  scanOut: boolean;
  scanQuery: boolean;
  manualQuery: boolean;
  viewRecords: boolean;
}

// 后台权限
export interface WebPermissions {
  stockView: boolean;
  inDetail: boolean;
  outDetail: boolean;
  batchImport: boolean;
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
  created_at: string;
  last_login: string | null;
}

// 原材料
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
  out_at: string | null;
  operator: string | null;
  remark: string | null;
}

// 操作日志
export interface OperationLog {
  id: string;
  qr_code: string | null;
  operation_type: OperationType;
  operator: string;
  operate_time: string;
  detail: string | null;
  ip: string | null;
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
  todayOut: number;
  pendingQc: number;
}
