# Uniapp移动端配置指南

## 一、环境准备

### 1. 安装HBuilderX（推荐）

下载地址：https://www.dcloud.io/hbuilderx.html

或使用命令行工具：

```bash
npm install -g @dcloudio/uvm
uvm install
```

### 2. 安装依赖

```bash
cd mobile-app
pnpm install
```

## 二、Supabase配置

### 1. 获取Supabase凭证

从主项目的Supabase配置中获取：
- SUPABASE_URL
- SUPABASE_ANON_KEY

### 2. 配置到移动端

编辑 `mobile-app/src/utils/common.ts`：

```typescript
export const SUPABASE_URL = 'https://your-project.supabase.co'
export const SUPABASE_ANON_KEY = 'your-anon-key'
```

## 三、平台配置

### H5平台

无需额外配置，直接运行：

```bash
pnpm dev:h5
```

访问：http://localhost:3001

### 微信小程序

#### 1. 注册小程序

访问：https://mp.weixin.qq.com/
注册并获取AppID

#### 2. 配置AppID

编辑 `mobile-app/src/manifest.json`：

```json
{
  "mp-weixin": {
    "appid": "你的小程序AppID"
  }
}
```

#### 3. 配置服务器域名

在微信公众平台配置以下域名：
- request合法域名：你的Supabase URL
- uploadFile合法域名：你的Supabase URL
- downloadFile合法域名：你的Supabase URL

#### 4. 运行小程序

```bash
pnpm dev:mp-weixin
```

使用微信开发者工具打开 `dist/dev/mp-weixin` 目录

### 安卓App

#### 1. 配置应用信息

编辑 `mobile-app/src/manifest.json`：

```json
{
  "app-plus": {
    "distribute": {
      "android": {
        "packagename": "com.yourcompany.material",
        "permissions": [
          // 已配置相机等权限
        ]
      }
    }
  }
}
```

#### 2. 云打包

使用HBuilderX进行云打包：
1. 发行 -> 原生App-云打包
2. 选择Android平台
3. 填写应用信息
4. 提交打包

#### 3. 本地打包

需要配置Android Studio环境，详见Uniapp官方文档。

## 四、图标资源

### Tabbar图标

需要准备6个图标文件（81x81px，PNG格式）：

```
mobile-app/src/static/tabbar/
├── home.png           # 首页-未选中（灰色）
├── home-active.png    # 首页-选中（蓝色）
├── search.png         # 查询-未选中（灰色）
├── search-active.png  # 查询-选中（蓝色）
├── record.png         # 记录-未选中（灰色）
└── record-active.png  # 记录-选中（蓝色）
```

可以使用在线工具生成：
- https://www.iconfont.cn/
- https://www.flaticon.com/

### 应用图标

在 `manifest.json` 中配置应用图标：

```json
{
  "app-plus": {
    "distribute": {
      "icons": {
        "android": {
          "hdpi": "static/logo.png",
          "xhdpi": "static/logo.png",
          "xxhdpi": "static/logo.png"
        }
      }
    }
  }
}
```

## 五、数据库表结构

确保Supabase中已创建以下表：

### users表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  app_permissions JSONB DEFAULT '{}',
  web_permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

### raw_materials表
```sql
CREATE TABLE raw_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code TEXT UNIQUE NOT NULL,
  batch_no TEXT NOT NULL,
  package_no TEXT NOT NULL,
  model TEXT NOT NULL,
  production_date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  status INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  out_at TIMESTAMPTZ,
  operator TEXT NOT NULL,
  remark TEXT
);
```

### operation_logs表
```sql
CREATE TABLE operation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code TEXT,
  operation_type TEXT NOT NULL,
  operator TEXT NOT NULL,
  operate_time TIMESTAMPTZ DEFAULT NOW(),
  detail TEXT,
  ip TEXT
);
```

## 六、权限配置

### RLS策略

为了安全，建议配置Row Level Security：

```sql
-- 启用RLS
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

-- 允许认证用户读取
CREATE POLICY "Allow authenticated read" ON raw_materials
  FOR SELECT TO authenticated USING (true);

-- 允许认证用户插入
CREATE POLICY "Allow authenticated insert" ON raw_materials
  FOR INSERT TO authenticated WITH CHECK (true);

-- 允许认证用户更新
CREATE POLICY "Allow authenticated update" ON raw_materials
  FOR UPDATE TO authenticated USING (true);
```

## 七、测试账号

创建测试用户：

```sql
INSERT INTO users (phone, name, password, role, app_permissions)
VALUES (
  '13800138000',
  '测试用户',
  'hashed_password', -- 需要使用bcrypt加密
  'user',
  '{
    "scan_in": true,
    "scan_out": true,
    "scan_query": true,
    "manual_query": true,
    "view_records": true
  }'::jsonb
);
```

## 八、调试技巧

### 1. 控制台调试

在代码中使用：
```typescript
console.log('调试信息', data)
```

### 2. 网络请求调试

在HBuilderX中查看网络请求：
- 运行 -> 运行到浏览器 -> Chrome
- 打开开发者工具 -> Network

### 3. 真机调试

使用HBuilderX真机运行：
- 运行 -> 运行到手机或模拟器
- 选择设备后自动安装并运行

## 九、常见问题

### 1. 扫码功能不可用

**问题**：点击扫码按钮无反应

**解决**：
- 确保在真机上测试
- 检查相机权限是否授予
- H5环境不支持扫码，需要使用小程序或App

### 2. 网络请求失败

**问题**：登录或数据加载失败

**解决**：
- 检查Supabase配置是否正确
- 确认网络连接正常
- 小程序需要配置合法域名

### 3. 样式显示异常

**问题**：页面样式错乱

**解决**：
- 检查rpx单位是否正确使用
- 确认全局样式已正确引入
- 清除缓存重新编译

### 4. 数据不同步

**问题**：操作后数据未更新

**解决**：
- 检查API调用是否成功
- 确认数据库操作权限
- 查看控制台错误信息

## 十、发布上线

### H5发布

```bash
pnpm build:h5
```

将 `dist/build/h5` 目录部署到Web服务器

### 小程序发布

1. 构建：`pnpm build:mp-weixin`
2. 使用微信开发者工具打开 `dist/build/mp-weixin`
3. 点击"上传"提交审核
4. 在微信公众平台提交审核

### App发布

1. 使用HBuilderX云打包生成APK
2. 签名APK文件
3. 上传到应用商店

## 十一、性能优化

### 1. 图片优化

- 使用WebP格式
- 压缩图片大小
- 使用CDN加速

### 2. 代码优化

- 使用分包加载
- 懒加载非首屏组件
- 减少不必要的API调用

### 3. 缓存策略

- 合理使用本地存储
- 实现数据缓存机制
- 离线数据支持

## 十二、技术支持

- Uniapp官方文档：https://uniapp.dcloud.net.cn/
- Supabase文档：https://supabase.com/docs
- 问题反馈：提交Issue到项目仓库
