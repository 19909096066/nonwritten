// 本地API适配器 - 使用 localStorage 替代 Supabase API
import {
  getStorage,
  setStorage,
  DB_KEYS
} from './localDatabase';
import type {
  Profile,
  RawMaterial,
  OperationLog,
  OperationType,
  DashboardStats,
  QcStandard,
  QcPurchase,
  QcProduction,
  QcDefect,
  CreateQcStandardParams,
  CreateQcPurchaseParams,
} from '@/types';

// 本地模式开关
// true = 使用 localStorage 本地数据库
// false = 使用腾讯云服务器 API (81.70.90.164)
export const USE_LOCAL_DB = false;

// ==================== 工具函数 ====================

/**
 * 解析二维码字符串
 */
export function parseQrCode(qrCode: string) {
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

// ==================== 用户管理 ====================

export async function getUsers() {
  const users = getStorage(DB_KEYS.USERS, []);
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
  const users = getStorage(DB_KEYS.USERS, []);
  const newUser = {
    id: `user-${Date.now()}`,
    ...userData,
    email: `${userData.phone}@nonwoven.local`,
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  setStorage(DB_KEYS.USERS, users);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<Profile>) {
  const users = getStorage(DB_KEYS.USERS, []);
  const index = users.findIndex((u: any) => u.id === id);
  if (index === -1) {
    throw new Error('用户不存在');
  }
  users[index] = { ...users[index], ...updates };
  setStorage(DB_KEYS.USERS, users);
  return users[index] as Profile;
}

export async function deleteUser(id: string) {
  const users = getStorage(DB_KEYS.USERS, []);
  const filtered = users.filter((u: any) => u.id !== id);
  setStorage(DB_KEYS.USERS, filtered);
}

export async function loginByPhone(phone: string, password: string) {
  const users = getStorage(DB_KEYS.USERS, []);
  const user = users.find(
    (u: any) => u.phone === phone && u.password === password
  );

  if (!user) {
    throw new Error('手机号或密码错误');
  }

  return {
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      app_permissions: user.app_permissions,
      web_permissions: user.web_permissions,
    },
    session: {
      access_token: `local-token-${user.id}-${Date.now()}`,
      refresh_token: `local-refresh-${user.id}`,
    },
  };
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
  const {
    page = 1,
    pageSize = 20,
    batchNo,
    model,
    status,
    startDate,
    endDate,
  } = params;

  let materials = getStorage(DB_KEYS.MATERIALS, []);

  // 应用过滤器
  if (batchNo) {
    materials = materials.filter((m: any) => m.batch_no === batchNo);
  }
  if (model) {
    materials = materials.filter((m: any) => m.model === model);
  }
  if (status) {
    materials = materials.filter((m: any) => m.status === status);
  }
  if (startDate) {
    materials = materials.filter((m: any) => m.created_at >= startDate);
  }
  if (endDate) {
    materials = materials.filter((m: any) => m.created_at <= endDate);
  }

  // 排序
  materials.sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const total = materials.length;
  materials = materials.slice((page - 1) * pageSize, page * pageSize);

  return {
    data: materials as RawMaterial[],
    total,
  };
}

export async function getRawMaterialByQrCode(qrCode: string) {
  const materials = getStorage(DB_KEYS.MATERIALS, []);
  return materials.find((m: any) => m.qr_code === qrCode) as RawMaterial | null;
}

export async function createRawMaterial(
  material: Omit<RawMaterial, 'id' | 'created_at' | 'out_at'>
) {
  const materials = getStorage(DB_KEYS.MATERIALS, []);
  const newMaterial = {
    id: `mat-${Date.now()}`,
    ...material,
    created_at: new Date().toISOString(),
    out_at: null,
  };
  materials.push(newMaterial);
  setStorage(DB_KEYS.MATERIALS, materials);
  return newMaterial as RawMaterial;
}

export async function outRawMaterial(qrCode: string, operator: string) {
  const materials = getStorage(DB_KEYS.MATERIALS, []);
  const index = materials.findIndex(
    (m: any) => m.qr_code === qrCode && m.status === 'in_stock'
  );

  if (index === -1) {
    return null;
  }

  materials[index] = {
    ...materials[index],
    status: 'out_stock',
    out_at: new Date().toISOString(),
    operator,
  };
  setStorage(DB_KEYS.MATERIALS, materials);

  // 创建操作日志
  await createOperationLog({
    qr_code: qrCode,
    operation_type: 'OUT',
    operator,
    detail: `出库批次: ${materials[index].batch_no}, 型号: ${materials[index].model}, 净重: ${materials[index].weight}kg`,
    device: 'PC',
  });

  return materials[index] as RawMaterial;
}

export async function batchCreateRawMaterials(
  materials: Omit<RawMaterial, 'id' | 'created_at' | 'out_at'>[]
) {
  const existingMaterials = getStorage(DB_KEYS.MATERIALS, []);
  const newMaterials = materials.map((m) => ({
    id: `mat-${Date.now()}-${Math.random()}`,
    ...m,
    created_at: new Date().toISOString(),
    out_at: null,
  }));
  existingMaterials.push(...newMaterials);
  setStorage(DB_KEYS.MATERIALS, existingMaterials);
  return newMaterials as RawMaterial[];
}

export async function getBatchNumbers() {
  const materials = getStorage(DB_KEYS.MATERIALS, []);
  const batchNos = new Set(materials.map((m: any) => m.batch_no));
  return Array.from(batchNos);
}

export async function getModels() {
  const materials = getStorage(DB_KEYS.MATERIALS, []);
  const models = new Set(materials.map((m: any) => m.model));
  return Array.from(models);
}

export async function getPackageNumbersByBatch(batchNo: string) {
  const materials = getStorage(DB_KEYS.MATERIALS, []);
  return materials
    .filter((m: any) => m.batch_no === batchNo)
    .map((m: any) => ({
      package_no: m.package_no,
      model: m.model,
    }));
}

// ==================== 操作日志 ====================

export async function createOperationLog(log: {
  qr_code?: string | null;
  operation_type: OperationType;
  operator: string;
  detail?: string | null;
  device?: string | null;
}) {
  const logs = getStorage(DB_KEYS.OPERATION_LOGS, []);
  const newLog: OperationLog = {
    id: `log-${Date.now()}`,
    qr_code: log.qr_code || null,
    operation_type: log.operation_type,
    operator: log.operator,
    operate_time: new Date().toISOString(),
    detail: log.detail || null,
    device: log.device || 'PC',
  };
  logs.unshift(newLog);
  setStorage(DB_KEYS.OPERATION_LOGS, logs);
}

export async function getOperationLogs(params: {
  page?: number;
  pageSize?: number;
  operationType?: string;
  operator?: string;
  startDate?: string;
  endDate?: string;
}) {
  const {
    page = 1,
    pageSize = 20,
    operationType,
    operator,
    startDate,
    endDate,
  } = params;

  let logs = getStorage(DB_KEYS.OPERATION_LOGS, []);

  // 应用过滤器
  if (operationType) {
    logs = logs.filter((l: any) => l.operation_type === operationType);
  }
  if (operator) {
    logs = logs.filter((l: any) => l.operator === operator);
  }
  if (startDate) {
    logs = logs.filter((l: any) => l.operate_time >= startDate);
  }
  if (endDate) {
    logs = logs.filter((l: any) => l.operate_time <= endDate);
  }

  // 按操作时间排序
  logs.sort((a: any, b: any) => new Date(b.operate_time).getTime() - new Date(a.operate_time).getTime());

  const total = logs.length;
  logs = logs.slice((page - 1) * pageSize, page * pageSize);

  return {
    data: logs as OperationLog[],
    total,
  };
}

// ==================== 统计数据 ====================

export async function getDashboardStats(): Promise<DashboardStats> {
  const materials = getStorage(DB_KEYS.MATERIALS, []);
  const logs = getStorage(DB_KEYS.OPERATION_LOGS, []);

  // 总库存：包含在库(in_stock)和已拆包(split)状态的物料
  const stockMaterials = materials.filter(
    (m: any) => m.status === 'in_stock' || m.status === 'split'
  );
  const totalStock = stockMaterials.length;
  const totalWeight = stockMaterials.reduce(
    (sum: number, m: any) => sum + (m.weight || 0),
    0
  );

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((l: any) => l.operate_time?.startsWith(today));
  
  // 今日入库统计（卷数和重量）
  const todayInLogs = todayLogs.filter((l: any) => l.operation_type === 'IN');
  const todayIn = todayInLogs.length;
  const todayInWeight = todayInLogs.reduce((sum: number, log: any) => {
    const material = materials.find((m: any) => m.qr_code === log.qr_code);
    return sum + (material ? (material.weight || 0) : 0);
  }, 0);
  
  // 今日出库统计（卷数和重量）
  const todayOutLogs = todayLogs.filter((l: any) => l.operation_type === 'OUT');
  const todayOut = todayOutLogs.length;
  const todayOutWeight = todayOutLogs.reduce((sum: number, log: any) => {
    const material = materials.find((m: any) => m.qr_code === log.qr_code);
    return sum + (material ? (material.weight || 0) : 0);
  }, 0);
  
  // 今日拆包统计（卷数和重量）
  const todaySplitLogs = todayLogs.filter((l: any) => l.operation_type === 'SPLIT');
  const todaySplit = todaySplitLogs.length;
  const todaySplitWeight = todaySplitLogs.reduce((sum: number, log: any) => {
    const material = materials.find((m: any) => m.qr_code === log.qr_code);
    return sum + (material ? (material.weight || 0) : 0);
  }, 0);

  return {
    totalStock,
    totalWeight: Math.round(totalWeight),
    todayIn,
    todayInWeight: Math.round(todayInWeight * 100) / 100,
    todayOut,
    todayOutWeight: Math.round(todayOutWeight * 100) / 100,
    todaySplit,
    todaySplitWeight: Math.round(todaySplitWeight * 100) / 100,
    pendingQc: 0,
  };
}

// ==================== 质检标准 ====================

export function getQcStandards(params?: {
  page?: number;
  pageSize?: number;
}) {
  const { page = 1, pageSize = 100 } = params || {};
  const data = getStorage(DB_KEYS.QC_STANDARDS, []);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return data.slice(start, end);
}

export function getQcStandardByModel(model: string): QcStandard | null {
  const standards = getStorage(DB_KEYS.QC_STANDARDS, []);
  return standards.find((s: QcStandard) => s.material_model === model) || null;
}

export function createQcStandard(params: CreateQcStandardParams): QcStandard {
  const standards = getStorage(DB_KEYS.QC_STANDARDS, []);
  const newStandard: QcStandard = {
    id: Date.now().toString(),
    material_model: params.material_model,
    weight_tolerance: params.weight_tolerance,
    thickness_tolerance: params.thickness_tolerance,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  standards.push(newStandard);
  setStorage(DB_KEYS.QC_STANDARDS, standards);
  return newStandard;
}

export function updateQcStandard(id: string, updates: Partial<CreateQcStandardParams>): QcStandard | null {
  const standards = getStorage(DB_KEYS.QC_STANDARDS, []);
  const index = standards.findIndex((s: QcStandard) => s.id === id);
  if (index === -1) return null;
  standards[index] = {
    ...standards[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  setStorage(DB_KEYS.QC_STANDARDS, standards);
  return standards[index];
}

export function deleteQcStandard(id: string): boolean {
  const standards = getStorage(DB_KEYS.QC_STANDARDS, []);
  const filtered = standards.filter((s: QcStandard) => s.id !== id);
  setStorage(DB_KEYS.QC_STANDARDS, filtered);
  return true;
}

// ==================== 采购质检 ====================

export function getQcPurchases(params?: {
  page?: number;
  pageSize?: number;
  batchNo?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, pageSize = 20, batchNo, result, startDate, endDate } = params || {};
  let data = getStorage(DB_KEYS.QC_PURCHASE, []);

  if (batchNo) {
    data = data.filter((item: QcPurchase) => item.batch_no === batchNo);
  }
  if (result) {
    data = data.filter((item: QcPurchase) => item.result === result);
  }
  if (startDate) {
    data = data.filter((item: QcPurchase) => item.created_at >= startDate);
  }
  if (endDate) {
    data = data.filter((item: QcPurchase) => item.created_at <= endDate);
  }

  const total = data.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    total,
  };
}

export function createQcPurchase(params: CreateQcPurchaseParams): QcPurchase {
  const purchases = getStorage(DB_KEYS.QC_PURCHASE, []);
  const newPurchase: QcPurchase = {
    id: Date.now().toString(),
    time: new Date().toISOString(),
    batch_no: params.batch_no,
    package_no: params.package_no,
    material_model: params.material_model,
    weight: params.weight,
    thickness: params.thickness,
    result: params.result,
    reason: params.reason || null,
    inspector: '操作员', // TODO: 从当前用户获取
    created_at: new Date().toISOString(),
  };
  purchases.push(newPurchase);
  setStorage(DB_KEYS.QC_PURCHASE, purchases);
  return newPurchase;
}

// ==================== 生产质检 ====================

export function getQcProductions(params?: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  line?: string;
}) {
  const { page = 1, pageSize = 20, startDate, endDate, line } = params || {};
  let data = getStorage(DB_KEYS.QC_PRODUCTION, []);

  if (startDate) {
    data = data.filter((item: QcProduction) => item.date >= startDate);
  }
  if (endDate) {
    data = data.filter((item: QcProduction) => item.date <= endDate);
  }
  if (line) {
    data = data.filter((item: QcProduction) => item.line === line);
  }

  const total = data.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    total,
  };
}

// ==================== 次品明细 ====================

export function getQcDefects(params?: {
  page?: number;
  pageSize?: number;
  source?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, pageSize = 20, source, startDate, endDate } = params || {};
  let data = getStorage(DB_KEYS.QC_DEFECT, []);

  if (source) {
    data = data.filter((item: QcDefect) => item.source === source);
  }
  if (startDate) {
    data = data.filter((item: QcDefect) => item.created_at >= startDate);
  }
  if (endDate) {
    data = data.filter((item: QcDefect) => item.created_at <= endDate);
  }

  const total = data.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    total,
  };
}

// ==================== 清空数据库 ====================

export function clearDatabase() {
  localStorage.removeItem(DB_KEYS.USERS);
  localStorage.removeItem(DB_KEYS.MATERIALS);
  localStorage.removeItem(DB_KEYS.OPERATION_LOGS);
  localStorage.removeItem(DB_KEYS.QC_STANDARDS);
  localStorage.removeItem(DB_KEYS.QC_PURCHASE);
  localStorage.removeItem(DB_KEYS.QC_PRODUCTION);
  localStorage.removeItem(DB_KEYS.QC_DEFECT);
  window.location.reload();
}
