import type {
  Profile,
  RawMaterial,
  OperationLog,
  OperationType,
  DashboardStats,
  QrCodeData,
  QcStandard,
  QcPurchase,
  QcProduction,
  QcDefect,
  CreateQcStandardParams,
  CreateQcPurchaseParams,
} from '@/types';

// 导入服务器API
import {
  authApi as serverAuthApi,
  userApi as serverUserApi,
  materialApi as serverMaterialApi,
  logApi as serverLogApi,
  statsApi as serverStatsApi,
  parseQrCode as serverParseQrCode,
  type RawMaterial as ServerRawMaterial,
  type OperationLog as ServerOperationLog,
  type DashboardStats as ServerDashboardStats,
  type QrCodeData as ServerQrCodeData,
} from './serverApi';

// 导入本地API
import {
  USE_LOCAL_DB,
  getRawMaterials as localGetRawMaterials,
  getRawMaterialByQrCode as localGetRawMaterialByQrCode,
  createRawMaterial as localCreateRawMaterial,
  outRawMaterial as localOutRawMaterial,
  batchCreateRawMaterials as localBatchCreateRawMaterials,
  getBatchNumbers as localGetBatchNumbers,
  getModels as localGetModels,
  getPackageNumbersByBatch as localGetPackageNumbersByBatch,
  getUsers as localGetUsers,
  createUser as localCreateUser,
  updateUser as localUpdateUser,
  deleteUser as localDeleteUser,
  createOperationLog as localCreateOperationLog,
  getOperationLogs as localGetOperationLogs,
  getDashboardStats as localGetDashboardStats,
  parseQrCode as localParseQrCode,
  getQcStandards as localGetQcStandards,
  getQcStandardByModel as localGetQcStandardByModel,
  createQcStandard as localCreateQcStandard,
  updateQcStandard as localUpdateQcStandard,
  deleteQcStandard as localDeleteQcStandard,
  getQcPurchases as localGetQcPurchases,
  createQcPurchase as localCreateQcPurchase,
  getQcProductions as localGetQcProductions,
  getQcDefects as localGetQcDefects,
} from './localApi';

// ==================== 工具函数 ====================

export function parseQrCode(qrCode: string): QrCodeData | null {
  if (USE_LOCAL_DB) {
    return localParseQrCode(qrCode);
  }

  // 服务器模式
  return serverParseQrCode(qrCode);
}

// ==================== 用户管理 ====================

export async function getUsers() {
  if (USE_LOCAL_DB) {
    return localGetUsers();
  }

  // 服务器模式
  const users = await serverUserApi.getUsers();
  return users as Profile[];
}

export async function createUser(userData: {
  phone: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
  app_permissions: any;
  web_permissions: any;
}) {
  if (USE_LOCAL_DB) {
    return localCreateUser(userData);
  }

  // 服务器模式
  return serverUserApi.createUser(userData);
}

export async function updateUser(id: string, updates: Partial<Profile>) {
  if (USE_LOCAL_DB) {
    return localUpdateUser(id, updates);
  }

  // 服务器模式
  return serverUserApi.updateUser(id, updates);
}

export async function deleteUser(id: string) {
  if (USE_LOCAL_DB) {
    return localDeleteUser(id);
  }

  // 服务器模式
  return serverUserApi.deleteUser(id);
}

// ==================== 原材料管理 ====================

export async function getRawMaterials(params: {
  page?: number;
  pageSize?: number;
  batchNo?: string;
  model?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  if (USE_LOCAL_DB) {
    return localGetRawMaterials(params);
  }

  // 服务器模式
  return serverMaterialApi.getRawMaterials(params);
}

export async function getRawMaterialByQrCode(qrCode: string) {
  if (USE_LOCAL_DB) {
    return localGetRawMaterialByQrCode(qrCode);
  }

  // 服务器模式
  return serverMaterialApi.getRawMaterialByQrCode(qrCode);
}

export async function createRawMaterial(material: Omit<RawMaterial, 'id' | 'created_at' | 'out_at'>) {
  if (USE_LOCAL_DB) {
    return localCreateRawMaterial(material);
  }

  // 服务器模式
  return serverMaterialApi.createRawMaterial(material);
}

export async function outRawMaterial(qrCode: string, operator: string) {
  if (USE_LOCAL_DB) {
    return localOutRawMaterial(qrCode, operator);
  }

  // 服务器模式
  return serverMaterialApi.outRawMaterial(qrCode, operator);
}

export async function batchCreateRawMaterials(materials: Omit<RawMaterial, 'id' | 'created_at' | 'out_at'>[]) {
  if (USE_LOCAL_DB) {
    return localBatchCreateRawMaterials(materials);
  }

  // 服务器模式
  return serverMaterialApi.batchCreateRawMaterials(materials);
}

export async function getBatchNumbers() {
  if (USE_LOCAL_DB) {
    return localGetBatchNumbers();
  }

  // 服务器模式
  return serverMaterialApi.getBatchNumbers();
}

export async function getModels() {
  if (USE_LOCAL_DB) {
    return localGetModels();
  }

  // 服务器模式
  return serverMaterialApi.getModels();
}

export async function getPackageNumbersByBatch(batchNo: string) {
  if (USE_LOCAL_DB) {
    return localGetPackageNumbersByBatch(batchNo);
  }

  // 服务器模式
  return serverMaterialApi.getPackageNumbersByBatch(batchNo);
}

// ==================== 操作日志 ====================

export async function createOperationLog(log: {
  qr_code?: string | null;
  operation_type: OperationType;
  operator: string;
  detail?: string | null;
  device?: string | null;
}) {
  if (USE_LOCAL_DB) {
    return localCreateOperationLog(log);
  }

  // 服务器模式
  return serverLogApi.createOperationLog({
    qr_code: log.qr_code,
    operation_type: log.operation_type,
    operator: log.operator,
    detail: log.detail,
    device: log.device || 'PC',
  });
}

export async function getOperationLogs(params: {
  page?: number;
  pageSize?: number;
  operationType?: string;
  operator?: string;
  startDate?: string;
  endDate?: string;
}) {
  if (USE_LOCAL_DB) {
    return localGetOperationLogs(params);
  }

  // 服务器模式
  return serverLogApi.getOperationLogs(params);
}

// ==================== 统计数据 ====================

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_LOCAL_DB) {
    return localGetDashboardStats();
  }

  // 服务器模式
  return serverStatsApi.getDashboardStats();
}

/**
 * 获取各型号库存分布
 */
export async function getModelStockDistribution() {
  if (USE_LOCAL_DB) {
    // 本地数据库实现：统计在库和已拆包的物料
    const materialsInStock = await localGetRawMaterials({ status: 'in_stock', page: 1, pageSize: 1000 });
    const materialsSplit = await localGetRawMaterials({ status: 'split', page: 1, pageSize: 1000 });
    const allMaterials = [...materialsInStock.data, ...materialsSplit.data];
    
    const modelMap = new Map<string, number>();
    allMaterials.forEach((item: any) => {
      const current = modelMap.get(item.model) || 0;
      modelMap.set(item.model, current + Number(item.weight));
    });
    return Array.from(modelMap.entries()).map(([model, weight]) => ({
      model,
      weight: Math.round(weight * 100) / 100,
    }));
  }

  // 服务器模式
  return serverStatsApi.getModelStockDistribution();
}

/**
 * 获取近7天出入库趋势
 */
export async function getWeeklyTrend() {
  if (USE_LOCAL_DB) {
    // 本地数据库实现
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const logsResult = await localGetOperationLogs({ page: 1, pageSize: 1000 });
    const allLogs = logsResult.data;

    const trends = dates.map(date => {
      const dateLogs = allLogs.filter((log: any) => log.operate_time?.startsWith(date));
      const inCount = dateLogs.filter((log: any) => log.operation_type === 'IN').length;
      const outCount = dateLogs.filter((log: any) => log.operation_type === 'OUT').length;

      return {
        date,
        inCount,
        outCount,
      };
    });

    return trends;
  }

  // 服务器模式
  return serverStatsApi.getWeeklyTrend();
}

/**
 * 获取库存趋势（新增）
 */
export async function getStockTrend(params?: { days?: number; model?: string; batchNo?: string }) {
  if (USE_LOCAL_DB) {
    // 本地模式暂不支持
    throw new Error('本地模式暂不支持库存趋势统计');
  }
  return serverStatsApi.getStockTrend(params);
}

/**
 * 获取库龄分布（新增）
 */
export async function getAgeDistribution(params?: { model?: string; batchNo?: string }) {
  if (USE_LOCAL_DB) {
    throw new Error('本地模式暂不支持库龄分布统计');
  }
  return serverStatsApi.getAgeDistribution(params);
}

/**
 * 获取呆滞物料（新增）
 */
export async function getDeadStock(params?: { days?: number; model?: string; batchNo?: string; page?: number; pageSize?: number }) {
  if (USE_LOCAL_DB) {
    throw new Error('本地模式暂不支持呆滞物料统计');
  }
  return serverStatsApi.getDeadStock(params);
}

/**
 * 获取出入库汇总（新增）
 */
export async function getInOutSummary(params?: { startDate?: string; endDate?: string; model?: string }) {
  if (USE_LOCAL_DB) {
    throw new Error('本地模式暂不支持出入库汇总统计');
  }
  return serverStatsApi.getInOutSummary(params);
}

/**
 * 获取操作员排行（新增）
 */
export async function getOperatorRanking(params?: { startDate?: string; endDate?: string; limit?: number }) {
  if (USE_LOCAL_DB) {
    throw new Error('本地模式暂不支持操作员排行统计');
  }
  return serverStatsApi.getOperatorRanking(params);
}

/**
 * 获取设备负载（新增）
 */
export async function getDeviceLoad(params?: { startDate?: string; endDate?: string; limit?: number }) {
  if (USE_LOCAL_DB) {
    throw new Error('本地模式暂不支持设备负载统计');
  }
  return serverStatsApi.getDeviceLoad(params);
}

/**
 * 获取小时分布（新增）
 */
export async function getHourlyDistribution(params?: { startDate?: string; endDate?: string }) {
  if (USE_LOCAL_DB) {
    throw new Error('本地模式暂不支持小时分布统计');
  }
  return serverStatsApi.getHourlyDistribution(params);
}

// ==================== 质检标准 ====================

/**
 * 获取质检标准列表
 */
export async function getQcStandards(params?: {
  page?: number;
  pageSize?: number;
}) {
  if (USE_LOCAL_DB) {
    return localGetQcStandards(params);
  }
  throw new Error('Supabase模式暂未实现质检标准功能');
}

/**
 * 根据型号获取质检标准
 */
export async function getQcStandardByModel(model: string): Promise<QcStandard | null> {
  if (USE_LOCAL_DB) {
    return localGetQcStandardByModel(model);
  }
  throw new Error('Supabase模式暂未实现质检标准功能');
}

/**
 * 创建质检标准
 */
export async function createQcStandard(params: CreateQcStandardParams): Promise<QcStandard> {
  if (USE_LOCAL_DB) {
    return localCreateQcStandard(params);
  }
  throw new Error('Supabase模式暂未实现质检标准功能');
}

/**
 * 更新质检标准
 */
export async function updateQcStandard(
  id: string,
  updates: Partial<CreateQcStandardParams>
): Promise<QcStandard | null> {
  if (USE_LOCAL_DB) {
    return localUpdateQcStandard(id, updates);
  }
  throw new Error('Supabase模式暂未实现质检标准功能');
}

/**
 * 删除质检标准
 */
export async function deleteQcStandard(id: string): Promise<boolean> {
  if (USE_LOCAL_DB) {
    return localDeleteQcStandard(id);
  }
  throw new Error('Supabase模式暂未实现质检标准功能');
}

// ==================== 采购质检 ====================

/**
 * 获取采购质检列表
 */
export async function getQcPurchases(params?: {
  page?: number;
  pageSize?: number;
  batchNo?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
}) {
  if (USE_LOCAL_DB) {
    return localGetQcPurchases(params);
  }
  throw new Error('Supabase模式暂未实现采购质检功能');
}

/**
 * 创建采购质检记录
 */
export async function createQcPurchase(params: CreateQcPurchaseParams): Promise<QcPurchase> {
  if (USE_LOCAL_DB) {
    return localCreateQcPurchase(params);
  }
  throw new Error('Supabase模式暂未实现采购质检功能');
}

// ==================== 生产质检 ====================

/**
 * 获取生产质检汇总列表
 */
export async function getQcProductions(params?: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  line?: string;
}) {
  if (USE_LOCAL_DB) {
    return localGetQcProductions(params);
  }
  throw new Error('Supabase模式暂未实现生产质检功能');
}

// ==================== 次品明细 ====================

/**
 * 获取次品明细列表
 */
export async function getQcDefects(params?: {
  page?: number;
  pageSize?: number;
  source?: string;
  startDate?: string;
  endDate?: string;
}) {
  if (USE_LOCAL_DB) {
    return localGetQcDefects(params);
  }
  throw new Error('Supabase模式暂未实现次品明细功能');
}

// 导出使用标志
export { USE_LOCAL_DB };
