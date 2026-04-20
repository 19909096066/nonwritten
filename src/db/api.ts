import { supabase } from './supabase';
import type {
  Profile,
  RawMaterial,
  OperationLog,
  QcStandard,
  QcPurchase,
  QcProduction,
  QcDefect,
  DashboardStats,
  QrCodeData,
  OperationType,
  UserRole,
  AppPermissions,
  WebPermissions,
} from '@/types';

// ==================== 工具函数 ====================

/**
 * 解析二维码字符串
 * 格式：P0126020012-01J1-8~kg~2026-02-04~140.15~B1250050T1
 */
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

// ==================== 用户管理 ====================

/**
 * 获取所有用户列表
 */
export async function getUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Profile[];
}

/**
 * 创建新用户
 */
export async function createUser(userData: {
  phone: string;
  name: string;
  password: string;
  role: UserRole;
  app_permissions: AppPermissions;
  web_permissions: WebPermissions;
}) {
  // 1. 在auth.users中创建用户
  const email = `${userData.phone}@nonwoven.local`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: userData.password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('创建用户失败');

  // 2. 更新profiles表中的用户信息
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      phone: userData.phone,
      name: userData.name,
      role: userData.role,
      app_permissions: userData.app_permissions,
      web_permissions: userData.web_permissions,
    })
    .eq('id', authData.user.id);

  if (profileError) throw profileError;

  return authData.user;
}

/**
 * 更新用户信息
 */
export async function updateUser(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Profile;
}

/**
 * 删除用户
 */
export async function deleteUser(id: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== 原材料管理 ====================

/**
 * 获取原材料列表（分页）
 */
export async function getRawMaterials(params: {
  page?: number;
  pageSize?: number;
  batchNo?: string;
  model?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, pageSize = 20, batchNo, model, status, startDate, endDate } = params;
  
  let query = supabase
    .from('raw_material')
    .select('*', { count: 'exact' });

  if (batchNo) query = query.eq('batch_no', batchNo);
  if (model) query = query.eq('model', model);
  if (status) query = query.eq('status', status);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;
  return {
    data: (Array.isArray(data) ? data : []) as RawMaterial[],
    total: count || 0,
  };
}

/**
 * 根据二维码查询原材料
 */
export async function getRawMaterialByQrCode(qrCode: string) {
  const { data, error } = await supabase
    .from('raw_material')
    .select('*')
    .eq('qr_code', qrCode)
    .maybeSingle();

  if (error) throw error;
  return data as RawMaterial | null;
}

/**
 * 入库
 */
export async function createRawMaterial(material: Omit<RawMaterial, 'id' | 'created_at' | 'out_at'>) {
  const { data, error } = await supabase
    .from('raw_material')
    .insert(material)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as RawMaterial;
}

/**
 * 出库
 */
export async function outRawMaterial(qrCode: string, operator: string) {
  const { data, error } = await supabase
    .from('raw_material')
    .update({
      status: 'out_stock',
      out_at: new Date().toISOString(),
      operator,
    })
    .eq('qr_code', qrCode)
    .eq('status', 'in_stock')
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as RawMaterial | null;
}

/**
 * 批量入库
 */
export async function batchCreateRawMaterials(materials: Omit<RawMaterial, 'id' | 'created_at' | 'out_at'>[]) {
  const { data, error } = await supabase
    .from('raw_material')
    .insert(materials)
    .select();

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as RawMaterial[];
}

/**
 * 获取批次号列表
 */
export async function getBatchNumbers() {
  const { data, error } = await supabase
    .from('raw_material')
    .select('batch_no')
    .order('batch_no');

  if (error) throw error;
  const uniqueBatchNos = [...new Set((data || []).map(item => item.batch_no))];
  return uniqueBatchNos;
}

/**
 * 获取型号列表
 */
export async function getModels() {
  const { data, error } = await supabase
    .from('raw_material')
    .select('model')
    .order('model');

  if (error) throw error;
  const uniqueModels = [...new Set((data || []).map(item => item.model))];
  return uniqueModels;
}

/**
 * 根据批次号获取包号列表
 */
export async function getPackageNumbersByBatch(batchNo: string) {
  const { data, error } = await supabase
    .from('raw_material')
    .select('package_no, model')
    .eq('batch_no', batchNo)
    .order('package_no');

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as { package_no: string; model: string }[];
}

// ==================== 操作日志 ====================

/**
 * 创建操作日志
 */
export async function createOperationLog(log: {
  qr_code?: string;
  operation_type: OperationType;
  operator: string;
  detail?: string;
  ip?: string;
}) {
  const { error } = await supabase
    .from('operation_log')
    .insert(log);

  if (error) throw error;
}

/**
 * 获取操作日志列表
 */
export async function getOperationLogs(params: {
  page?: number;
  pageSize?: number;
  operationType?: string;
  operator?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, pageSize = 20, operationType, operator, startDate, endDate } = params;
  
  let query = supabase
    .from('operation_log')
    .select('*', { count: 'exact' });

  if (operationType) query = query.eq('operation_type', operationType);
  if (operator) query = query.eq('operator', operator);
  if (startDate) query = query.gte('operate_time', startDate);
  if (endDate) query = query.lte('operate_time', endDate);

  const { data, error, count } = await query
    .order('operate_time', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;
  return {
    data: (Array.isArray(data) ? data : []) as OperationLog[],
    total: count || 0,
  };
}

// ==================== 质检标准 ====================

/**
 * 获取所有质检标准
 */
export async function getQcStandards() {
  const { data, error } = await supabase
    .from('qc_standard')
    .select('*')
    .order('material_model');

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as QcStandard[];
}

/**
 * 根据型号获取质检标准
 */
export async function getQcStandardByModel(model: string) {
  const { data, error } = await supabase
    .from('qc_standard')
    .select('*')
    .eq('material_model', model)
    .maybeSingle();

  if (error) throw error;
  return data as QcStandard | null;
}

/**
 * 创建质检标准
 */
export async function createQcStandard(standard: Omit<QcStandard, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('qc_standard')
    .insert(standard)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as QcStandard;
}

/**
 * 更新质检标准
 */
export async function updateQcStandard(id: string, updates: Partial<QcStandard>) {
  const { data, error } = await supabase
    .from('qc_standard')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as QcStandard;
}

/**
 * 删除质检标准
 */
export async function deleteQcStandard(id: string) {
  const { error } = await supabase
    .from('qc_standard')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== 采购质检 ====================

/**
 * 获取采购质检列表
 */
export async function getQcPurchases(params: {
  page?: number;
  pageSize?: number;
  batchNo?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, pageSize = 20, batchNo, result, startDate, endDate } = params;
  
  let query = supabase
    .from('qc_purchase')
    .select('*', { count: 'exact' });

  if (batchNo) query = query.eq('batch_no', batchNo);
  if (result) query = query.eq('result', result);
  if (startDate) query = query.gte('time', startDate);
  if (endDate) query = query.lte('time', endDate);

  const { data, error, count } = await query
    .order('time', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;
  return {
    data: (Array.isArray(data) ? data : []) as QcPurchase[],
    total: count || 0,
  };
}

/**
 * 创建采购质检记录
 */
export async function createQcPurchase(qc: Omit<QcPurchase, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('qc_purchase')
    .insert(qc)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as QcPurchase;
}

/**
 * 更新采购质检记录
 */
export async function updateQcPurchase(id: string, updates: Partial<QcPurchase>) {
  const { data, error } = await supabase
    .from('qc_purchase')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as QcPurchase;
}

/**
 * 删除采购质检记录
 */
export async function deleteQcPurchase(id: string) {
  const { error } = await supabase
    .from('qc_purchase')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== 生产质检 ====================

/**
 * 获取生产质检汇总列表
 */
export async function getQcProductions(params: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  line?: string;
}) {
  const { page = 1, pageSize = 20, startDate, endDate, line } = params;
  
  let query = supabase
    .from('qc_production')
    .select('*', { count: 'exact' });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (line) query = query.eq('line', line);

  const { data, error, count } = await query
    .order('date', { ascending: false })
    .order('line')
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;
  return {
    data: (Array.isArray(data) ? data : []) as QcProduction[],
    total: count || 0,
  };
}

// ==================== 次品明细 ====================

/**
 * 获取次品明细列表
 */
export async function getQcDefects(params: {
  page?: number;
  pageSize?: number;
  source?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, pageSize = 20, source, startDate, endDate } = params;
  
  let query = supabase
    .from('qc_defect')
    .select('*', { count: 'exact' });

  if (source) query = query.eq('source', source);
  if (startDate) query = query.gte('time', startDate);
  if (endDate) query = query.lte('time', endDate);

  const { data, error, count } = await query
    .order('time', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;
  return {
    data: (Array.isArray(data) ? data : []) as QcDefect[],
    total: count || 0,
  };
}

// ==================== 首页统计 ====================

/**
 * 获取首页统计数据
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];

  // 总库存卷数和总重量
  const { data: stockData } = await supabase
    .from('raw_material')
    .select('weight')
    .eq('status', 'in_stock');

  const totalStock = stockData?.length || 0;
  const totalWeight = stockData?.reduce((sum, item) => sum + Number(item.weight), 0) || 0;

  // 今日入库数
  const { count: todayIn } = await supabase
    .from('raw_material')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  // 今日出库数
  const { count: todayOut } = await supabase
    .from('raw_material')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'out_stock')
    .gte('out_at', `${today}T00:00:00`)
    .lte('out_at', `${today}T23:59:59`);

  // 待处理质检任务数（这里简化为不合格的采购质检数）
  const { count: pendingQc } = await supabase
    .from('qc_purchase')
    .select('*', { count: 'exact', head: true })
    .eq('result', 'unqualified');

  return {
    totalStock,
    totalWeight: Math.round(totalWeight * 100) / 100,
    todayIn: todayIn || 0,
    todayOut: todayOut || 0,
    pendingQc: pendingQc || 0,
  };
}

/**
 * 获取各型号库存占比
 */
export async function getModelStockDistribution() {
  const { data, error } = await supabase
    .from('raw_material')
    .select('model, weight')
    .eq('status', 'in_stock');

  if (error) throw error;

  const modelMap = new Map<string, number>();
  (data || []).forEach(item => {
    const current = modelMap.get(item.model) || 0;
    modelMap.set(item.model, current + Number(item.weight));
  });

  return Array.from(modelMap.entries()).map(([model, weight]) => ({
    model,
    weight: Math.round(weight * 100) / 100,
  }));
}

/**
 * 获取近7天出入库趋势
 */
export async function getWeeklyTrend() {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const trends = await Promise.all(
    dates.map(async (date) => {
      const [inResult, outResult] = await Promise.all([
        supabase
          .from('raw_material')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${date}T00:00:00`)
          .lte('created_at', `${date}T23:59:59`),
        supabase
          .from('raw_material')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'out_stock')
          .gte('out_at', `${date}T00:00:00`)
          .lte('out_at', `${date}T23:59:59`),
      ]);

      return {
        date,
        inCount: inResult.count || 0,
        outCount: outResult.count || 0,
      };
    })
  );

  return trends;
}
