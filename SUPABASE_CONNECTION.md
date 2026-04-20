# Supabase连接方式说明

## 当前连接配置

本项目使用 **秒哒平台托管的Supabase实例**，Web管理后台和Uniapp移动端共享同一个数据库。

### 连接信息

```
Supabase URL: https://backend.appmiaoda.com/projects/supabase283449093093634048
Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
App ID: app-9s1afi57chs1
```

## 配置位置

### Web管理后台

**配置文件**: `.env`

```env
VITE_SUPABASE_URL=https://backend.appmiaoda.com/projects/supabase283449093093634048
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDg3MDA2NzMwLCJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwic3ViIjoiYW5vbiJ9.cdrO9jbyJrTgqRF8Z9DiVtIdUVJQNTx6dnDVMeZoLys
VITE_APP_ID=app-9s1afi57chs1
```

**代码位置**: `src/db/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Uniapp移动端

**配置文件**: `mobile-app/src/utils/common.ts`

```typescript
// Supabase配置
// 使用与Web后台相同的Supabase实例
export const SUPABASE_URL = 'https://backend.appmiaoda.com/projects/supabase283449093093634048'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDg3MDA2NzMwLCJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwic3ViIjoiYW5vbiJ9.cdrO9jbyJrTgqRF8Z9DiVtIdUVJQNTx6dnDVMeZoLys'
```

**代码位置**: `mobile-app/src/api/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/common'

// 创建Supabase客户端
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

## 连接方式特点

### 1. 秒哒平台托管

- **优点**:
  - 无需自己搭建Supabase服务器
  - 平台统一管理和维护
  - 自动备份和监控
  - 开箱即用

- **URL格式**: `https://backend.appmiaoda.com/projects/supabase{project_id}`

### 2. 统一数据源

Web后台和移动端使用**相同的Supabase实例**：

```
┌─────────────────────────────────────────────┐
│  Supabase实例 (秒哒平台托管)                 │
│  supabase283449093093634048                 │
│                                             │
│  • auth.users (用户认证)                     │
│  • profiles (用户信息)                       │
│  • raw_materials (原材料)                   │
│  • operation_logs (操作日志)                │
│  • qc_* (质检相关表)                         │
└─────────────────────────────────────────────┘
                    ▲
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  Web管理后台    │    │  Uniapp移动端   │
│  .env配置       │    │  common.ts配置  │
└────────────────┘    └─────────────────┘
```

### 3. 认证机制

两端使用相同的认证方式：

```typescript
// 手机号登录 → 转换为email格式
const email = `${phone}@nonwoven.local`

// 使用Supabase Auth
await supabase.auth.signInWithPassword({
  email,
  password
})
```

## 数据库表结构

### 核心表

| 表名 | 说明 | 用途 |
|------|------|------|
| auth.users | Supabase认证表 | 用户登录认证 |
| profiles | 用户信息表 | 用户详细信息、权限 |
| raw_materials | 原材料表 | 物料库存数据 |
| operation_logs | 操作日志表 | 入库/出库记录 |
| qc_standard | 质检标准表 | 质检标准配置 |
| qc_purchase | 采购质检表 | 采购质检记录 |
| qc_production | 生产质检表 | 生产质检记录 |
| qc_defect | 次品明细表 | 次品记录 |

### 表关系

```
auth.users (1) ←→ (1) profiles
                      ↓
                  (用户ID)
                      ↓
              ┌───────┴────────┐
              ↓                ↓
      operation_logs    qc_purchase/production
```

## 权限控制

### RLS (Row Level Security)

Supabase使用行级安全策略控制数据访问：

```sql
-- 示例：管理员可以访问所有数据
CREATE POLICY "管理员拥有所有权限" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 示例：用户只能查看自己的信息
CREATE POLICY "用户可以查看自己的信息" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
```

### 权限字段

**App权限** (app_permissions):
```json
{
  "scanIn": true,
  "scanOut": true,
  "scanQuery": true,
  "manualQuery": true,
  "viewRecords": true
}
```

**Web权限** (web_permissions):
```json
{
  "stockView": true,
  "inDetail": true,
  "outDetail": true,
  "batchImport": true,
  "userManage": true,
  "qcPurchase": true,
  "qcProduction": true,
  "qcDefect": true,
  "qcStandard": true,
  "operationLog": true
}
```

## 数据同步

### 实时更新

两端的数据会实时同步：

1. **移动端扫码入库** → 数据写入Supabase → **Web后台立即可见**
2. **Web后台批量导入** → 数据写入Supabase → **移动端查询可见**

### 操作流程示例

```
移动端操作:
1. 用户扫码入库
2. 调用 supabase.from('raw_materials').insert()
3. 数据写入数据库
4. 同时写入 operation_logs

Web后台查看:
1. 打开库存明细页面
2. 调用 supabase.from('raw_materials').select()
3. 显示包含刚才入库的数据
4. 在操作日志中看到入库记录
```

## 连接测试

### 测试Web后台连接

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
# 尝试登录，如果成功说明连接正常
```

### 测试移动端连接

```bash
# 进入移动端目录
cd mobile-app

# 启动H5开发服务器
pnpm dev:h5

# 访问 http://localhost:3001
# 尝试登录，如果成功说明连接正常
```

## 管理员账号

使用以下账号测试连接：

```
手机号：19909096066
密码：admin123
```

## 注意事项

### 1. 配置已完成

✅ Web后台配置已完成（.env文件）  
✅ 移动端配置已完成（common.ts文件）  
✅ 两端使用相同的Supabase实例  
✅ 管理员账号已创建并修复

### 2. 无需额外配置

由于使用秒哒平台托管的Supabase，**不需要**：
- ❌ 自己搭建Supabase服务器
- ❌ 配置数据库连接字符串
- ❌ 手动创建数据库表（已通过迁移创建）
- ❌ 配置CORS跨域（平台已处理）

### 3. 开发环境

- Web后台：http://localhost:5173
- 移动端H5：http://localhost:3001
- 数据库：秒哒平台托管

### 4. 生产环境

部署时使用相同的Supabase配置，无需修改。

## 常见问题

### Q: 为什么移动端不使用.env文件？

A: Uniapp项目的配置方式与Vite不同，直接在代码中配置更简单可靠。

### Q: 两端的数据会冲突吗？

A: 不会。两端使用相同的数据库，数据是实时同步的。

### Q: 如何切换到其他Supabase实例？

A: 修改两个配置文件中的URL和Key即可：
- Web后台：`.env`
- 移动端：`mobile-app/src/utils/common.ts`

### Q: 数据库迁移如何执行？

A: 使用秒哒平台的MCP工具自动执行，已完成的迁移：
- 00001_create_user_role_and_profiles.sql
- 00002_create_raw_materials_table.sql
- 00003_create_operation_log_table.sql
- 00004_create_qc_tables.sql
- 00005_fix_rls_uid_function.sql
- 00006_update_admin_account.sql
- 00007_create_admin_user_yuanye.sql
- 00008_fix_admin_email_format.sql

## 总结

✅ **连接方式**: 秒哒平台托管的Supabase  
✅ **配置状态**: 已完成配置  
✅ **数据同步**: Web后台和移动端实时同步  
✅ **管理员账号**: 已创建并可正常登录  
✅ **数据库表**: 已通过迁移创建完成  

现在可以直接使用，无需额外配置！

---

**文档版本**: v1.0  
**最后更新**: 2026-02-21  
**连接状态**: ✅ 已配置完成
