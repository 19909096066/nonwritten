// 更新默认用户密码
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'database.db');

// 新密码
const NEW_PASSWORD = 'Sebr%j&1gPmde3kJ';

// 生成哈希
const hashedPassword = bcrypt.hashSync(NEW_PASSWORD, 10);
console.log('生成的密码哈希:', hashedPassword);

// 连接数据库
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
  console.log('数据库连接成功');
});

// 更新 admin 用户密码
db.run(
  'UPDATE users SET password = ? WHERE phone = ?',
  [hashedPassword, 'admin'],
  function(err) {
    if (err) {
      console.error('更新密码失败:', err);
      db.close();
      process.exit(1);
    }
    
    if (this.changes === 0) {
      console.log('未找到 admin 用户，创建新用户...');
      const { v4: uuidv4 } = require('uuid');
      const adminId = uuidv4();
      
      db.run(
        `INSERT INTO users (id, phone, name, password, role, app_permissions, web_permissions) 
         VALUES (?, 'admin', '管理员', ?, 'admin', ?, ?)`,
        [
          adminId,
          hashedPassword,
          JSON.stringify({ scan_in: true, scan_out: true, query: true, records: true }),
          JSON.stringify({ dashboard: true, materials: true, users: true, settings: true })
        ],
        function(err) {
          if (err) {
            console.error('创建用户失败:', err);
          } else {
            console.log('✅ 管理员用户创建成功');
          }
          db.close();
        }
      );
    } else {
      console.log('✅ 密码更新成功');
      console.log('📋 新的登录凭证:');
      console.log('   账号: admin');
      console.log('   密码: Sebr%j&1gPmde3kJ');
      db.close();
    }
  }
);
