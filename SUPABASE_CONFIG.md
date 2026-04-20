# Supabase配置指南

## ✅ 配置状态：已完成

本项目的Supabase配置已经完成，Web管理后台和Uniapp移动端都已配置好连接信息。

**当前使用**: 秒哒平台托管的Supabase实例

详细连接信息请查看：[SUPABASE_CONNECTION.md](SUPABASE_CONNECTION.md)

---

## 概述

本项目使用Supabase作为后端服务，Web管理后台和Uniapp移动端共享同一个Supabase实例。

## 配置位置

### ✅ Web管理后台（已配置）

配置文件：`.env`

```env
VITE_SUPABASE_URL=https://backend.appmiaoda.com/projects/supabase283449093093634048
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDg3MDA2NzMwLCJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwic3ViIjoiYW5vbiJ9.cdrO9jbyJrTgqRF8Z9DiVtIdUVJQNTx6dnDVMeZoLys
VITE_APP_ID=app-9s1afi57chs1
```

代码位置：`src/db/supabase.ts`

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### ✅ Uniapp移动端（已配置）

配置文件：`mobile-app/src/utils/common.ts`

```typescript
// 已配置为与Web后台相同的Supabase实例
export const SUPABASE_URL = 'https://backend.appmiaoda.com/projects/supabase283449093093634048'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDg3MDA2NzMwLCJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwic3ViIjoiYW5vbiJ9.cdrO9jbyJrTgqRF8Z9DiVtIdUVJQNTx6dnDVMeZoLys'
```

## 如何获取Supabase配置

### 方法1：从Supabase控制台获取

1. 登录 [Supabase控制台](https://app.supabase.com/)
2. 选择你的项目
3. 点击左侧菜单的 "Settings" (设置)
4. 点击 "API"
5. 复制以下信息：
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

### 方法2：从Web后台配置文件获取

如果Web后台已经配置好，可以从 `.env` 文件中复制：

```bash
# 查看Web后台的配置
cat .env
# 或
cat .env.local
```

## 配置步骤

### 配置Web管理后台

1. 在项目根目录创建 `.env.local` 文件：

```bash
cd /workspace/app-9s1afi57chs1
touch .env.local
```

2. 编辑 `.env.local` 文件，添加配置：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. 重启开发服务器

### 配置Uniapp移动端

1. 编辑 `mobile-app/src/utils/common.ts`：

```typescript
// 替换为实际的Supabase配置
export const SUPABASE_URL = 'https://your-project.supabase.co'
export const SUPABASE_ANON_KEY = 'your-anon-key-here'
```

2. 保存文件并重新编译

## 验证配置

### 验证Web后台配置

```bash
# 启动开发服务器
npm run dev

# 访问登录页面，尝试登录
# 如果能正常登录，说明配置正确
```

### 验证移动端配置

```bash
# 进入移动端目录
cd mobile-app

# 启动H5开发服务器
pnpm dev:h5

# 访问 http://localhost:3001
# 尝试登录，如果能正常登录，说明配置正确
```

## 常见问题

### Q: 提示"Invalid API key"

**原因**：SUPABASE_ANON_KEY配置错误

**解决**：
1. 检查key是否完整复制
2. 确认没有多余的空格或换行
3. 确认使用的是 "anon public" key，不是 "service_role" key

### Q: 提示"Failed to fetch"

**原因**：SUPABASE_URL配置错误或网络问题

**解决**：
1. 检查URL格式是否正确（应该是 https://xxx.supabase.co）
2. 确认网络连接正常
3. 检查Supabase项目是否已暂停

### Q: 登录提示"Invalid login credentials"

**原因**：
1. 用户账号不存在
2. 密码错误
3. Email格式不匹配

**解决**：
1. 确认使用正确的手机号和密码
2. 检查数据库中用户的email格式是否为 `{phone}@nonwoven.local`
3. 参考 `LOGIN_FIX.md` 文档

### Q: 移动端无法连接Supabase

**原因**：
1. 配置文件未正确修改
2. 小程序需要配置合法域名

**解决**：
1. 确认 `mobile-app/src/utils/common.ts` 中的配置已更新
2. 微信小程序需要在公众平台配置 Supabase URL 为合法域名
3. H5版本检查浏览器控制台的网络请求

## 安全注意事项

### ⚠️ 重要提示

1. **不要提交敏感信息到Git**
   - `.env.local` 文件已在 `.gitignore` 中
   - 移动端的 `common.ts` 需要手动配置，不要提交真实的key

2. **使用环境变量**
   - Web后台使用 `.env.local` 文件
   - 生产环境使用服务器的环境变量

3. **Key的使用**
   - 前端只使用 `anon public` key
   - `service_role` key 只能在服务器端使用
   - 不要在前端代码中硬编码任何key

## 生产环境配置

### Web管理后台

在生产服务器上设置环境变量：

```bash
export VITE_SUPABASE_URL=https://your-project.supabase.co
export VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

或在部署平台（如Vercel、Netlify）的环境变量设置中配置。

### Uniapp移动端

1. **H5版本**：
   - 可以使用环境变量
   - 或在构建时替换配置

2. **小程序版本**：
   - 需要在代码中配置
   - 确保在微信公众平台配置合法域名

3. **App版本**：
   - 可以在打包时配置
   - 或使用远程配置服务

## 配置模板

### Web后台 .env.local 模板

```env
# Supabase配置
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 其他配置（如有）
# VITE_API_BASE_URL=https://api.example.com
```

### 移动端配置模板

```typescript
// mobile-app/src/utils/common.ts

// Supabase配置
export const SUPABASE_URL = 'https://your-project-id.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// 注意：
// 1. 替换为实际的Supabase项目URL和Key
// 2. 确保与Web后台使用相同的Supabase项目
// 3. 不要提交真实的Key到Git仓库
```

## 测试配置

配置完成后，使用管理员账号测试：

```
手机号：19909096066
密码：admin123
```

如果能成功登录，说明配置正确！

## 相关文档

- [Supabase官方文档](https://supabase.com/docs)
- [ADMIN_ACCOUNT.md](ADMIN_ACCOUNT.md) - 管理员账号信息
- [LOGIN_FIX.md](LOGIN_FIX.md) - 登录问题修复说明
- [mobile-app/SETUP.md](mobile-app/SETUP.md) - 移动端详细配置指南

---

**文档版本**: v1.0  
**最后更新**: 2026-02-21
