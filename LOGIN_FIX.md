# 登录问题修复说明

## 问题描述

在尝试使用管理员账号登录时，出现"Invalid login credentials"（登录失败：无效的登录凭据）错误。

## 问题原因

系统的登录认证机制使用的email格式与创建账号时使用的格式不一致：

- **创建账号时使用**: `19909096066@miaoda.com`
- **登录系统期望**: `19909096066@nonwoven.local`

在 `AuthContext.tsx` 中，登录函数会将手机号转换为特定格式的email：

```typescript
const signInWithPhone = async (phone: string, password: string) => {
  const email = `${phone}@nonwoven.local`;  // 使用 @nonwoven.local 后缀
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // ...
}
```

## 解决方案

已执行数据库迁移，将管理员账号的email从 `19909096066@miaoda.com` 更新为 `19909096066@nonwoven.local`。

### 执行的SQL

```sql
UPDATE auth.users
SET email = '19909096066@nonwoven.local',
    raw_user_meta_data = jsonb_set(
      raw_user_meta_data,
      '{email}',
      '"19909096066@nonwoven.local"'
    ),
    updated_at = now()
WHERE phone = '19909096066' AND email = '19909096066@miaoda.com';
```

## 验证结果

✅ 管理员账号信息已更新：

| 字段 | 值 |
|------|-----|
| 手机号 | 19909096066 |
| Email | 19909096066@nonwoven.local |
| 姓名 | 袁野 |
| 角色 | admin |
| 状态 | 已激活 |

## 现在可以正常登录

### Web管理后台

```
手机号: 19909096066
密码: admin123
```

系统会自动将手机号 `19909096066` 转换为 `19909096066@nonwoven.local` 进行认证。

### Uniapp移动端

移动端需要确保使用相同的email格式转换逻辑。请检查 `mobile-app/src/api/index.ts` 中的登录函数。

## 移动端登录函数建议

如果移动端也使用手机号登录，需要确保email格式一致：

```typescript
// mobile-app/src/api/index.ts
export async function login(phone: string, password: string) {
  // 使用与Web后台相同的email格式
  const email = `${phone}@nonwoven.local`;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  // 更新最后登录时间
  if (data.user) {
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);
  }

  return data;
}
```

## 系统设计说明

### Email格式约定

系统使用 `{phone}@nonwoven.local` 作为统一的email格式：

- **优点**：
  - 用户只需记住手机号和密码
  - 避免用户输入错误的email
  - 统一的格式便于管理

- **实现位置**：
  - Web后台：`src/contexts/AuthContext.tsx`
  - 移动端：`mobile-app/src/api/index.ts`

### 创建新用户的正确方式

以后创建新用户时，应该使用正确的email格式：

```sql
-- 正确的方式
INSERT INTO auth.users (
  id,
  email,  -- 使用 {phone}@nonwoven.local 格式
  phone,
  encrypted_password,
  -- ...
) VALUES (
  gen_random_uuid(),
  '13800138000@nonwoven.local',  -- ✅ 正确
  '13800138000',
  crypt('password', gen_salt('bf')),
  -- ...
);
```

## 预防措施

为了避免将来出现类似问题，建议：

1. **统一email格式**：在所有创建用户的地方使用 `@nonwoven.local` 后缀
2. **文档说明**：在用户管理文档中明确说明email格式约定
3. **代码注释**：在相关代码中添加注释说明email格式规则
4. **测试用例**：添加登录测试用例，确保email格式正确

## 相关文件

- `src/contexts/AuthContext.tsx` - Web后台登录逻辑
- `mobile-app/src/api/index.ts` - 移动端登录逻辑
- `supabase/migrations/00007_fix_admin_email_format.sql` - 修复迁移文件
- `ADMIN_ACCOUNT.md` - 管理员账号文档（已更新）
- `ADMIN_CREDENTIALS.txt` - 快速参考卡片（已更新）
- `TESTING_GUIDE.md` - 测试指南（已更新）

## 总结

问题已解决！管理员账号现在可以正常登录了。

**登录凭据**：
- 手机号：19909096066
- 密码：admin123

---

**修复日期**: 2026-02-21  
**问题类型**: Email格式不匹配  
**解决方案**: 数据库迁移更新email格式  
**状态**: ✅ 已解决
