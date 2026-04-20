/**
 * 应用常量
 */

/**
 * 操作类型
 */
export const OPERATION_TYPES = {
  IN: 'in' as const,
  OUT: 'out' as const,
  TRANSFER: 'transfer' as const,
  ADJUST: 'adjust' as const,
} as const;

export type OperationType = typeof OPERATION_TYPES[keyof typeof OPERATION_TYPES];

/**
 * 操作类型映射
 */
export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  [OPERATION_TYPES.IN]: '入库',
  [OPERATION_TYPES.OUT]: '出库',
  [OPERATION_TYPES.TRANSFER]: '调拨',
  [OPERATION_TYPES.ADJUST]: '调整',
};

/**
 * 库存状态
 */
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock' as const,
  LOW_STOCK: 'low_stock' as const,
  OUT_OF_STOCK: 'out_of_stock' as const,
} as const;

export type StockStatus = typeof STOCK_STATUS[keyof typeof STOCK_STATUS];

/**
 * 库存状态标签
 */
export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  [STOCK_STATUS.IN_STOCK]: '充足',
  [STOCK_STATUS.LOW_STOCK]: '低库存',
  [STOCK_STATUS.OUT_OF_STOCK]: '缺货',
};

/**
 * 库存阈值
 */
export const STOCK_THRESHOLDS = {
  LOW_STOCK: 10, // 低库存阈值
  OUT_OF_STOCK: 0, // 缺货阈值
} as const;

/**
 * 分页配置
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000,
} as const;

/**
 * 质检结果
 */
export const QC_RESULT = {
  PASS: 'pass' as const,
  FAIL: 'fail' as const,
  PENDING: 'pending' as const,
} as const;

export type QcResult = typeof QC_RESULT[keyof typeof QC_RESULT];

/**
 * 质检结果标签
 */
export const QC_RESULT_LABELS: Record<QcResult, string> = {
  [QC_RESULT.PASS]: '合格',
  [QC_RESULT.FAIL]: '不合格',
  [QC_RESULT.PENDING]: '待检验',
};

/**
 * 用户角色
 */
export const USER_ROLES = {
  ADMIN: 'admin' as const,
  USER: 'user' as const,
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * 角色标签
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: '管理员',
  [USER_ROLES.USER]: '操作员',
};

/**
 * 权限常量
 */
export const PERMISSIONS = {
  // 库存管理
  STOCK_VIEW: 'stock_view',
  STOCK_ADD: 'stock_add',
  STOCK_EDIT: 'stock_edit',
  STOCK_DELETE: 'stock_delete',
  STOCK_EXPORT: 'stock_export',

  // 质检管理
  QC_VIEW: 'qc_view',
  QC_ADD: 'qc_add',
  QC_EDIT: 'qc_edit',
  QC_DELETE: 'qc_delete',

  // 用户管理
  USER_VIEW: 'user_view',
  USER_ADD: 'user_add',
  USER_EDIT: 'user_edit',
  USER_DELETE: 'user_delete',

  // 日志查看
  LOG_VIEW: 'log_view',

  // 系统设置
  SETTINGS: 'settings',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * 管理员权限（所有权限）
 */
export const ADMIN_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/**
 * 操作员默认权限
 */
export const USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.STOCK_VIEW,
  PERMISSIONS.STOCK_ADD,
  PERMISSIONS.QC_VIEW,
  PERMISSIONS.QC_ADD,
];
