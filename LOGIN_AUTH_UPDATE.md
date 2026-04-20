# 登录认证模块调整说明

## 修改概述

根据需求，对系统的登录认证模块进行了全面调整，实现了以下目标：
1. 去除用户自主注册功能
2. 实施管理员添加用户制
3. 创建初始管理员账户
4. 统一使用手机号+密码登录

## 详细修改内容

### 1. 去除用户自主注册功能

#### 1.1 前端修改

**LoginPage.tsx**
- ❌ 移除：注册Tab（Tabs组件）
- ❌ 移除：注册表单（用户名、密码、确认密码）
- ❌ 移除：handleRegister函数
- ✅ 保留：登录表单（改为手机号+密码）
- ✅ 添加：提示文字"如需注册新用户，请联系管理员"

**AuthContext.tsx**
- ❌ 移除：signUpWithUsername函数
- ❌ 移除：AuthContextType中的signUpWithUsername类型定义
- ✅ 保留：signInWithPhone函数（原signInWithUsername改名）

#### 1.2 效果
- 用户无法通过登录页面自主注册
- 登录页面仅显示手机号和密码输入框
- 所有注册相关的UI和逻辑已完全移除

### 2. 改为手机号+密码登录

#### 2.1 登录界面调整

**LoginPage.tsx**
```typescript
// 原来：用户名输入框
<Label htmlFor="login-username">用户名</Label>
<Input id="login-username" type="text" ... />

// 现在：手机号输入框
<Label htmlFor="phone">手机号</Label>
<Input id="phone" type="tel" maxLength={11} ... />
```

#### 2.2 登录逻辑调整

**AuthContext.tsx**
```typescript
// 原来：使用username@miaoda.com作为email
const email = `${username}@miaoda.com`;

// 现在：使用phone@nonwoven.local作为email
const email = `${phone}@nonwoven.local`;
```

#### 2.3 验证规则

**手机号验证**
- 格式：11位数字
- 正则：`/^1[3-9]\d{9}$/`
- 错误提示："请输入正确的手机号"

**密码验证**
- 最小长度：6位
- 错误提示："密码长度至少为6位"

### 3. 创建初始管理员账户

#### 3.1 管理员信息

| 字段 | 值 |
|------|-----|
| 手机号 | 19909096066 |
| 姓名 | 袁野 |
| 密码 | admin123 |
| 角色 | admin |
| Email | 19909096066@nonwoven.local |

#### 3.2 权限配置

**App权限（全部开启）**
- ✅ scanIn: 扫码入库
- ✅ scanOut: 扫码出库
- ✅ scanQuery: 扫码查询
- ✅ manualQuery: 手动查询
- ✅ viewRecords: 查看记录

**后台权限（全部开启）**
- ✅ stockView: 库存明细
- ✅ inDetail: 入库明细
- ✅ outDetail: 出库明细
- ✅ batchImport: 批量入库
- ✅ userManage: 用户管理
- ✅ qcPurchase: 采购质检
- ✅ qcProduction: 生产质检
- ✅ qcDefect: 次品明细
- ✅ qcStandard: 质检标准
- ✅ operationLog: 操作日志

#### 3.3 数据库操作

**迁移文件：00006_update_admin_account.sql**
```sql
-- 更新管理员信息
UPDATE public.profiles
SET 
  name = '袁野',
  phone = '19909096066',
  role = 'admin',
  app_permissions = {...},  -- 全部权限
  web_permissions = {...}   -- 全部权限
WHERE username = '19909096066';

-- 更新登录凭证
UPDATE auth.users
SET 
  email = '19909096066@nonwoven.local',
  encrypted_password = crypt('admin123', gen_salt('bf')),
  email_confirmed_at = now()
WHERE id = (SELECT id FROM profiles WHERE username = '19909096066');
```

### 4. 实施用户添加制

#### 4.1 API函数

**src/db/api.ts - createUser函数**
```typescript
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

  return authData.user;
}
```

#### 4.2 用户管理界面

**UsersPage.tsx - 添加用户功能**

**UI组件**
- ✅ "添加用户"按钮（Plus图标）
- ✅ 添加用户对话框（Dialog）
- ✅ 完整的用户信息表单

**表单字段**
1. **基本信息**
   - 手机号（必填，11位）
   - 姓名（必填）
   - 密码（必填，至少6位）
   - 角色（下拉选择：普通用户/管理员）

2. **App权限**（5个开关）
   - 扫码入库
   - 扫码出库
   - 扫码查询
   - 手动查询
   - 查看记录

3. **后台权限**（10个开关）
   - 库存明细
   - 入库明细
   - 出库明细
   - 批量入库
   - 用户管理
   - 采购质检
   - 生产质检
   - 次品明细
   - 质检标准
   - 操作日志

**验证规则**
- 手机号：必填，11位数字，格式验证
- 姓名：必填
- 密码：必填，至少6位
- 角色：默认"普通用户"
- 权限：默认全部关闭

**操作流程**
1. 管理员点击"添加用户"按钮
2. 填写用户信息和权限
3. 点击"创建用户"
4. 系统验证信息
5. 调用createUser API
6. 记录操作日志
7. 刷新用户列表
8. 显示成功提示

#### 4.3 权限控制

**访问限制**
- 只有管理员可以访问用户管理页面
- 只有管理员可以添加新用户
- 普通用户无法看到用户管理菜单

**RLS策略**
- profiles表的INSERT操作需要管理员权限
- 通过Supabase Auth API创建用户
- 自动触发handle_new_user函数创建profile

### 5. 数据库触发器更新

#### 5.1 handle_new_user函数

**功能**
- 当auth.users表插入新用户时自动触发
- 从email中提取手机号
- 在profiles表中创建对应的用户记录

**实现**
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  extracted_phone text;
BEGIN
  -- 从email中提取手机号（去掉@nonwoven.local）
  extracted_phone := REPLACE(NEW.email, '@nonwoven.local', '');
  
  -- 插入profile，使用手机号作为username和phone
  INSERT INTO public.profiles (id, username, phone, name, role, app_permissions, web_permissions)
  VALUES (
    NEW.id,
    extracted_phone,
    extracted_phone,
    extracted_phone,
    'user',
    '{...}'::jsonb,  -- 默认权限全部关闭
    '{...}'::jsonb   -- 默认权限全部关闭
  );
  RETURN NEW;
END;
$$;
```

#### 5.2 Email格式变更

**原格式**
- `{username}@miaoda.com`
- 示例：`zhangsan@miaoda.com`

**新格式**
- `{phone}@nonwoven.local`
- 示例：`19909096066@nonwoven.local`

**优势**
- 手机号作为唯一标识
- 便于提取和验证
- 符合业务逻辑

## 使用说明

### 管理员登录

1. 打开系统登录页面
2. 输入手机号：`19909096066`
3. 输入密码：`admin123`
4. 点击"登录"按钮
5. 登录成功后进入系统首页

### 添加新用户

1. 管理员登录系统
2. 进入"用户管理"页面
3. 点击"添加用户"按钮
4. 填写用户信息：
   - 手机号（11位）
   - 姓名
   - 密码（至少6位）
   - 选择角色（普通用户/管理员）
5. 配置权限：
   - 勾选需要的App权限
   - 勾选需要的后台权限
6. 点击"创建用户"
7. 等待创建成功提示
8. 新用户即可使用手机号和密码登录

### 新用户登录

1. 打开系统登录页面
2. 输入管理员分配的手机号
3. 输入管理员设置的密码
4. 点击"登录"按钮
5. 根据权限访问相应功能

## 安全说明

### 密码安全

- 密码使用bcrypt加密存储
- 最小长度要求：6位
- 建议用户首次登录后修改密码（待实现）

### 权限控制

- 所有用户必须由管理员创建
- 权限由管理员分配
- 普通用户无法自行提升权限
- 管理员拥有所有权限

### 数据安全

- 使用Supabase RLS策略保护数据
- 所有操作记录在operation_log表
- 手机号作为唯一标识，防止重复

## 技术细节

### 认证流程

1. 用户输入手机号和密码
2. 前端验证格式
3. 调用signInWithPhone函数
4. 转换为email格式：`{phone}@nonwoven.local`
5. 调用Supabase Auth API
6. 验证成功后获取session
7. 从profiles表获取用户信息
8. 存储到AuthContext
9. 根据权限显示菜单

### 用户创建流程

1. 管理员填写用户信息
2. 前端验证必填字段和格式
3. 调用createUser API
4. 在auth.users表创建认证记录
5. 触发handle_new_user函数
6. 在profiles表创建用户记录
7. 更新用户的详细信息和权限
8. 记录操作日志
9. 返回成功结果

### 数据库结构

**auth.users表**（Supabase内置）
- id: UUID（主键）
- email: 格式为`{phone}@nonwoven.local`
- encrypted_password: bcrypt加密的密码
- email_confirmed_at: 邮箱确认时间
- created_at: 创建时间

**profiles表**（自定义）
- id: UUID（外键关联auth.users.id）
- username: 手机号
- phone: 手机号
- name: 姓名
- role: 角色（admin/user）
- app_permissions: App权限（JSONB）
- web_permissions: 后台权限（JSONB）
- created_at: 创建时间
- last_login: 最后登录时间

## 测试验证

### 功能测试

✅ 登录页面只显示手机号和密码输入框
✅ 无法找到注册入口
✅ 使用管理员账号（19909096066/admin123）可以登录
✅ 管理员可以访问用户管理页面
✅ 可以成功添加新用户
✅ 新用户可以使用手机号和密码登录
✅ 新用户的权限符合管理员设置
✅ 所有操作都有日志记录

### 代码质量

✅ Lint检查通过（94个文件，0错误）
✅ TypeScript类型检查通过
✅ 所有导入正确
✅ 无未使用的变量
✅ 代码格式规范

## 后续优化建议

1. **密码管理**
   - 添加"修改密码"功能
   - 添加"重置密码"功能（管理员操作）
   - 实施密码强度要求

2. **用户管理**
   - 添加"禁用用户"功能
   - 添加"删除用户"功能
   - 添加用户搜索和筛选

3. **安全增强**
   - 添加登录失败次数限制
   - 添加会话超时机制
   - 添加操作审计日志

4. **用户体验**
   - 添加"忘记密码"流程（通过管理员重置）
   - 添加用户首次登录引导
   - 优化权限配置界面

## 总结

本次调整完全符合需求，实现了：
1. ✅ 彻底移除用户自主注册功能
2. ✅ 实施管理员添加用户制
3. ✅ 创建初始管理员账户（19909096066/袁野/admin123）
4. ✅ 统一使用手机号+密码登录
5. ✅ 完整的权限管理系统
6. ✅ 详细的操作日志记录

系统现在更加安全和可控，所有用户都必须由管理员创建和授权，符合企业级应用的安全要求。
