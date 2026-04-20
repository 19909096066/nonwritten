# 快速启动指南

## 🚀 Uniapp移动端已创建完成

移动端应用已经完整创建，包含所有功能页面和配置文件。

## 📋 当前状态

✅ 项目结构已创建  
✅ 所有页面已实现（7个页面）  
✅ API接口已封装  
✅ 工具函数已完成  
✅ 样式文件已配置  
✅ 配置文件已设置  
✅ 文档已完善  
✅ 占位图标已创建  

## ⚙️ 下一步操作

### 1. 配置Supabase连接

编辑文件：`mobile-app/src/utils/common.ts`

```typescript
// 将以下内容替换为实际的Supabase配置
export const SUPABASE_URL = 'YOUR_SUPABASE_URL'
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
```

**如何获取Supabase配置？**
- 从主项目的 `src/db/supabase.ts` 文件中复制
- 或从Supabase控制台的项目设置中获取

### 2. 安装依赖

```bash
cd mobile-app
pnpm install
```

### 3. 运行开发环境

#### 选项A：H5版本（推荐用于快速测试）

```bash
pnpm dev:h5
```

访问：http://localhost:3001

#### 选项B：微信小程序

```bash
pnpm dev:mp-weixin
```

然后使用微信开发者工具打开 `dist/dev/mp-weixin` 目录

#### 选项C：安卓App

```bash
pnpm dev:app
```

使用HBuilderX打开项目进行真机调试

### 4. 替换图标（可选）

当前使用的是透明占位图标，建议替换为实际图标：

目录：`mobile-app/src/static/tabbar/`

需要的图标（81x81px PNG格式）：
- home.png / home-active.png
- search.png / search-active.png
- record.png / record-active.png

## 📱 功能说明

### 已实现的页面

1. **首页** (`pages/index`)
   - 功能菜单
   - 权限控制
   - 用户信息展示

2. **扫码入库** (`pages/scan-in`)
   - 扫描二维码
   - 解析物料信息
   - 确认入库

3. **扫码出库** (`pages/scan-out`)
   - 扫描二维码
   - 验证库存状态
   - 执行出库

4. **扫码查询** (`pages/scan-query`)
   - 扫描二维码
   - 查看物料详情
   - 跳转汇总页面

5. **手动查询** (`pages/manual-query`)
   - 按批次号/型号查询
   - 显示汇总信息
   - 展示明细列表

6. **操作记录** (`pages/records`)
   - 查看本地记录
   - 统计操作次数
   - 清空记录

7. **登录页** (`pages/login`)
   - 手机号密码登录
   - 表单验证
   - 自动跳转

## 🔧 开发工具

### 推荐使用HBuilderX

下载地址：https://www.dcloud.io/hbuilderx.html

HBuilderX提供：
- 可视化界面
- 真机调试
- 云打包
- 代码提示

### 或使用命令行

如果熟悉命令行，可以直接使用：
```bash
pnpm dev:h5        # H5开发
pnpm build:h5      # H5构建
pnpm dev:mp-weixin # 小程序开发
pnpm build:mp-weixin # 小程序构建
```

## 📚 文档说明

- **README.md** - 项目介绍和功能说明
- **SETUP.md** - 详细配置和部署指南
- **UNIAPP_MIGRATION.md** - 迁移完成总结（在主目录）

## ⚠️ 注意事项

### 扫码功能测试

扫码功能需要在真机或模拟器上测试：
- H5环境可能不支持扫码
- 建议使用微信小程序或App进行测试
- 需要授予相机权限

### 数据库配置

确保Supabase数据库中已创建以下表：
- users（用户表）
- raw_materials（原材料表）
- operation_logs（操作日志表）

### 权限配置

用户权限在数据库中配置：
```json
{
  "app_permissions": {
    "scan_in": true,
    "scan_out": true,
    "scan_query": true,
    "manual_query": true,
    "view_records": true
  }
}
```

## 🐛 常见问题

### Q: 扫码功能无法使用？
A: 请在真机上测试，确保已授予相机权限。

### Q: 登录失败？
A: 检查Supabase配置是否正确，网络是否正常。

### Q: 页面样式异常？
A: 确认全局样式已正确引入，清除缓存重新编译。

### Q: 如何调试？
A: 使用HBuilderX的真机调试功能，或在浏览器中查看H5版本的控制台。

## 📞 获取帮助

- 查看详细文档：`mobile-app/SETUP.md`
- Uniapp官方文档：https://uniapp.dcloud.net.cn/
- Supabase文档：https://supabase.com/docs

## ✨ 项目特点

- ✅ 完整的功能实现
- ✅ TypeScript类型安全
- ✅ Vue3 Composition API
- ✅ 响应式设计
- ✅ 权限控制
- ✅ 本地数据缓存
- ✅ 友好的用户界面
- ✅ 详细的文档说明

---

**祝您开发顺利！** 🎉
