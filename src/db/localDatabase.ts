// 本地数据库模拟 - 使用 localStorage 模拟 Supabase 数据库

// 数据库初始化
const DB_KEYS = {
  USERS: 'db_users',
  MATERIALS: 'db_materials',
  OPERATION_LOGS: 'db_operation_logs',
  QC_STANDARDS: 'db_qc_standards',
  QC_PURCHASE: 'db_qc_purchase',
  QC_PRODUCTION: 'db_qc_production',
  QC_DEFECT: 'db_qc_defect'
}

// 获取 localStorage 数据
function getStorage(key: string, defaultValue: any = null) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

// 设置 localStorage 数据
function setStorage(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('保存数据失败:', error)
  }
}

// 删除 localStorage 数据
function removeStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('删除数据失败:', error)
  }
}

// 初始化默认数据
function initDatabase() {
  // 初始化用户数据
  if (!getStorage(DB_KEYS.USERS)) {
    const defaultUsers = [
      {
        id: 'admin-001',
        phone: '19909096066',
        email: '19909096066@nonwoven.local',
        name: '袁野',
        password: 'admin123',
        role: 'admin',
        app_permissions: {
          scanIn: true,
          scanOut: true,
          scanQuery: true,
          manualQuery: true,
          viewRecords: true
        },
        web_permissions: {
          stockView: true,
          inDetail: true,
          outDetail: true,
          userManage: true,
          qcPurchase: true,
          qcProduction: true,
          qcDefect: true,
          qcStandard: true,
          operationLog: true
        },
        created_at: new Date().toISOString()
      },
      {
        id: 'user-001',
        phone: '13800138000',
        email: '13800138000@nonwoven.local',
        name: '测试操作员',
        password: '123456',
        role: 'user',
        app_permissions: {
          scanIn: true,
          scanOut: true,
          scanQuery: true,
          manualQuery: false,
          viewRecords: true
        },
        web_permissions: {
          stockView: true,
          inDetail: true,
          outDetail: true,
          userManage: false,
          qcPurchase: false,
          qcProduction: false,
          qcDefect: false,
          qcStandard: false,
          operationLog: true
        },
        created_at: new Date().toISOString()
      }
    ]
    setStorage(DB_KEYS.USERS, defaultUsers)
  }

  // 初始化物料数据（严格按照数据库字段）
  const defaultMaterials = [
    {
      id: 'mat-001',
      qr_code: 'P2025022201-A01-8~kg~2026-02-20~145.50~B1250050T1',
      batch_no: 'P2025022201',
      package_no: 'A01',
      model: 'B1250050T1',
      production_date: '2026-02-20',
      weight: 145.50,
      unit: 'kg',
      status: 'in_stock',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      out_at: null,
      operator: '袁野',
      remark: null,
      device: 'PC'
    },
    {
      id: 'mat-002',
      qr_code: 'P2025022201-A02-8~kg~2026-02-20~142.30~B1250050T1',
      batch_no: 'P2025022201',
      package_no: 'A02',
      model: 'B1250050T1',
      production_date: '2026-02-20',
      weight: 142.30,
      unit: 'kg',
      status: 'in_stock',
      created_at: new Date(Date.now() - 80000000).toISOString(),
      out_at: null,
      operator: '袁野',
      remark: null,
      device: 'PC'
    },
    {
      id: 'mat-003',
      qr_code: 'P2025022202-B01-8~kg~2026-02-21~158.80~B1250060T2',
      batch_no: 'P2025022202',
      package_no: 'B01',
      model: 'B1250060T2',
      production_date: '2026-02-21',
      weight: 158.80,
      unit: 'kg',
      status: 'in_stock',
      created_at: new Date(Date.now() - 40000000).toISOString(),
      out_at: null,
      operator: '袁野',
      remark: null,
      device: 'PC'
    },
    {
      id: 'mat-004',
      qr_code: 'P2025022202-B02-8~kg~2026-02-21~160.20~B1250060T2',
      batch_no: 'P2025022202',
      package_no: 'B02',
      model: 'B1250060T2',
      production_date: '2026-02-21',
      weight: 160.20,
      unit: 'kg',
      status: 'out_stock',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      out_at: new Date(Date.now() - 3600000).toISOString(),
      operator: '袁野',
      remark: '已出库',
      device: 'PC'
    },
    {
      id: 'mat-005',
      qr_code: 'P2025022203-C01-8~kg~2026-02-22~125.60~B1250040T3',
      batch_no: 'P2025022203',
      package_no: 'C01',
      model: 'B1250040T3',
      production_date: '2026-02-22',
      weight: 125.60,
      unit: 'kg',
      status: 'in_stock',
      created_at: new Date(Date.now() - 18000000).toISOString(),
      out_at: null,
      operator: '袁野',
      remark: null,
      device: 'PC'
    }
  ]
  setStorage(DB_KEYS.MATERIALS, defaultMaterials)

  // 初始化操作日志（严格按照数据库字段）
  const now = Date.now()
  const defaultLogs = [
    {
      id: 'log-001',
      qr_code: 'P2025022201-A01-8~kg~2026-02-20~145.50~B1250050T1',
      operation_type: 'IN',
      operator: '袁野',
      operate_time: new Date(now - 86400000).toISOString(),
      detail: '入库批次: P2025022201, 包号: A01, 型号: B1250050T1, 重量: 145.50kg',
      device: 'PC'
    },
    {
      id: 'log-002',
      qr_code: 'P2025022201-A02-8~kg~2026-02-20~142.30~B1250050T1',
      operation_type: 'IN',
      operator: '袁野',
      operate_time: new Date(now - 80000000).toISOString(),
      detail: '入库批次: P2025022201, 包号: A02, 型号: B1250050T1, 重量: 142.30kg',
      device: 'PC'
    },
    {
      id: 'log-003',
      qr_code: 'P2025022202-B01-8~kg~2026-02-21~158.80~B1250060T2',
      operation_type: 'IN',
      operator: '袁野',
      operate_time: new Date(now - 40000000).toISOString(),
      detail: '入库批次: P2025022202, 包号: B01, 型号: B1250060T2, 重量: 158.80kg',
      device: 'PC'
    },
    {
      id: 'log-004',
      qr_code: 'P2025022202-B02-8~kg~2026-02-21~160.20~B1250060T2',
      operation_type: 'IN',
      operator: '袁野',
      operate_time: new Date(now - 86400000 * 2).toISOString(),
      detail: '入库批次: P2025022202, 包号: B02, 型号: B1250060T2, 重量: 160.20kg',
      device: 'PC'
    },
    {
      id: 'log-005',
      qr_code: 'P2025022202-B02-8~kg~2026-02-21~160.20~B1250060T2',
      operation_type: 'OUT',
      operator: '袁野',
      operate_time: new Date(now - 3600000).toISOString(),
      detail: '出库批次: P2025022202, 包号: B02, 型号: B1250060T2, 重量: 160.20kg',
      device: 'PC'
    },
    {
      id: 'log-006',
      qr_code: 'P2025022203-C01-8~kg~2026-02-22~125.60~B1250040T3',
      operation_type: 'IN',
      operator: '袁野',
      operate_time: new Date(now - 18000000).toISOString(),
      detail: '入库批次: P2025022203, 包号: C01, 型号: B1250040T3, 重量: 125.60kg',
      device: 'PC'
    },
    {
      id: 'log-007',
      qr_code: null,
      operation_type: 'LOGIN',
      operator: '袁野',
      operate_time: new Date(now - 90000000).toISOString(),
      detail: '用户登录系统',
      device: 'PC'
    }
  ]
  setStorage(DB_KEYS.OPERATION_LOGS, defaultLogs)

  console.log('本地数据库初始化完成')
}

// 导出类型和函数
export {
  DB_KEYS,
  getStorage,
  setStorage,
  removeStorage,
  initDatabase
}

// 默认初始化
initDatabase()
