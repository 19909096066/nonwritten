const mysql = require("mysql2/promise");

async function main() {
  const pool = mysql.createPool({
    host: "gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com",
    port: 29477,
    user: "root",
    password: "Mygbbyy1.",
    database: "nonwoven"
  });

  // 获取所有待入库记录
  const [pendingItems] = await pool.execute(
    "SELECT id, batch_no, package_no FROM shipping_items WHERE status = 'pending'"
  );
  
  console.log("=== 剩余待入库记录 ===");
  
  for (const item of pendingItems) {
    // 查找相同批号前缀的入库记录
    const batchPrefix = item.batch_no.split('-')[0];
    const [stockItems] = await pool.execute(
      "SELECT batch_no, package_no, qr_code FROM raw_materials WHERE status = 'in_stock' AND (batch_no = ? OR batch_no LIKE ?)",
      [item.batch_no, `${batchPrefix}%`]
    );
    
    console.log(`\n待入库: 批号="${item.batch_no}", 包号="${item.package_no}"`);
    
    // 查找包号匹配的
    const matched = stockItems.find(s => s.package_no === item.package_no);
    if (matched) {
      console.log(`  ✓ 找到匹配: 入库批号="${matched.batch_no}", 入库包号="${matched.package_no}"`);
    } else {
      console.log(`  ✗ 未找到包号匹配`);
      console.log(`  入库记录中有相同批号前缀的包号: ${stockItems.map(s => s.package_no).slice(0, 10).join(', ')}...`);
    }
  }

  await pool.end();
}

main().catch(console.error);
