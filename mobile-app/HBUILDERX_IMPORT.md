# HBuilderX 项目导入指南

## ❓ 遇到的问题

HBuilderX提示：
```
检测到当前目录下的子目录包括uni-app/5+项目。如想
正确运行这些项目，需将正确的项目根目录拖入
HBuilderX。
```

## ✅ 解决方案

### Uniapp移动端项目的正确根目录

**正确的根目录路径**：
```
/workspace/app-9s1afi57chs1/mobile-app
```

**不是**：
```
/workspace/app-9s1afi57chs1  ← 这是主项目（Web管理后台）
```

## 📁 项目结构说明

```
/workspace/app-9s1afi57chs1/
├── src/                    # Web管理后台源码
├── package.json            # Web后台配置
├── .env                    # Web后台环境变量
│
└── mobile-app/             ← 这是Uniapp项目根目录 ⭐
    ├── src/
    │   ├── pages/          # 页面目录
    │   ├── pages.json      # 页面配置 ✓
    │   ├── manifest.json   # 应用配置 ✓
    │   ├── App.vue         # 应用入口
    │   └── main.ts         # 主文件
    ├── package.json        # Uniapp项目配置 ✓
    ├── vite.config.ts      # Vite配置
    └── tsconfig.json       # TypeScript配置
```

## 🎯 正确的导入步骤

### 方法1：拖拽导入（推荐）

1. 打开文件管理器
2. 找到 `mobile-app` 文件夹
3. 将 `mobile-app` 文件夹拖入HBuilderX窗口

### 方法2：菜单导入

1. 打开HBuilderX
2. 点击菜单：**文件** → **打开目录**
3. 导航到：`/workspace/app-9s1afi57chs1/mobile-app`
4. 点击"选择文件夹"

### 方法3：命令行导入（如果支持）

```bash
# 在HBuilderX中打开终端，执行：
cd /workspace/app-9s1afi57chs1/mobile-app
```

## ✓ 验证是否导入正确

导入后，在HBuilderX的项目管理器中应该看到：

```
mobile-app/                 ← 项目名称
├── src/
│   ├── pages/
│   │   ├── index/
│   │   ├── login/
│   │   ├── scan-in/
│   │   ├── scan-out/
│   │   ├── scan-query/
│   │   ├── manual-query/
│   │   └── records/
│   ├── api/
│   ├── utils/
│   ├── styles/
│   ├── static/
│   ├── pages.json          ← 应该能看到这个文件
│   ├── manifest.json       ← 应该能看到这个文件
│   ├── App.vue
│   └── main.ts
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🚀 导入后的操作

### 1. 安装依赖

在HBuilderX终端中执行：
```bash
pnpm install
```

或者在外部终端：
```bash
cd /workspace/app-9s1afi57chs1/mobile-app
pnpm install
```

### 2. 运行项目

#### 运行H5版本
```bash
pnpm dev:h5
```
访问：http://localhost:3001

#### 运行微信小程序
```bash
pnpm dev:mp-weixin
```
然后在微信开发者工具中打开 `dist/dev/mp-weixin` 目录

#### 运行App
在HBuilderX中：
- 点击工具栏的"运行"按钮
- 选择"运行到手机或模拟器"

## 📝 两个项目的区别

| 项目 | 根目录 | 技术栈 | 用途 |
|------|--------|--------|------|
| Web管理后台 | `/workspace/app-9s1afi57chs1` | React + Vite | 桌面端管理系统 |
| Uniapp移动端 | `/workspace/app-9s1afi57chs1/mobile-app` | Vue3 + Uniapp | 移动端应用 |

## 🔧 开发工具选择

### Web管理后台
- **推荐**: VS Code、WebStorm
- **运行**: `npm run dev`
- **端口**: 5173

### Uniapp移动端
- **推荐**: HBuilderX（官方IDE）
- **备选**: VS Code + Uniapp插件
- **运行**: `pnpm dev:h5` 或 HBuilderX运行按钮
- **端口**: 3001（H5版本）

## ⚠️ 常见错误

### 错误1：打开了主项目目录
```
❌ 打开了：/workspace/app-9s1afi57chs1
✅ 应该打开：/workspace/app-9s1afi57chs1/mobile-app
```

### 错误2：找不到pages.json
**原因**：打开的目录不正确

**解决**：确保打开的是 `mobile-app` 目录

### 错误3：依赖安装失败
**原因**：没有在正确的目录执行安装命令

**解决**：
```bash
cd /workspace/app-9s1afi57chs1/mobile-app
pnpm install
```

## 💡 提示

1. **HBuilderX只需要打开移动端项目**
   - Web管理后台用其他编辑器打开

2. **两个项目可以同时运行**
   - Web后台：http://localhost:5173
   - 移动端H5：http://localhost:3001

3. **共享同一个Supabase数据库**
   - 数据实时同步
   - 无需额外配置

## 📞 需要帮助？

如果导入后仍有问题，检查：
1. ✓ 是否打开了 `mobile-app` 目录
2. ✓ 是否能看到 `pages.json` 和 `manifest.json`
3. ✓ 是否执行了 `pnpm install`
4. ✓ HBuilderX版本是否为最新版

---

**正确的根目录**: `/workspace/app-9s1afi57chs1/mobile-app`  
**项目类型**: Uniapp (Vue3 + TypeScript)  
**支持平台**: H5、微信小程序、安卓App、iOS App
