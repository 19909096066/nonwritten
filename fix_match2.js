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
  
  console.log(`剩余待入库: ${pendingItems.length} 条`);
  let matchedCount = 0;

  for (const item of pendingItems) {
    const itemBatchNo = (item.batch_no || '').trim();
    const itemPackageNo = (item.package_no || '').trim();
    
    // 使用批号前缀匹配 + 包号精确匹配
    const [matched] = await pool.execute(
      `SELECT id, qr_code, batch_no, package_no FROM raw_materials 
       WHERE package_no = ? AND status = 'in_stock' 
       AND (batch_no = ? OR batch_no LIKE ?)
       LIMIT 1`,
      [itemPackageNo, itemBatchNo, `${itemBatchNo}-%`]
    );
    
    if (matched.length > 0) {
      console.log(`匹配: 清单[${itemBatchNo}/${itemPackageNo}] -> 入库[${matched[0].batch_no}/${matched[0].package_no}]`);
      await pool.execute(
        "UPDATE shipping_items SET status = 'matched', qr_code = ? WHERE id = ?",
        [matched[0].qr_code, item.id]
      );
      matchedCount++;
    } else {
      console.log(`未匹配: 清单[${itemBatchNo}/${itemPackageNo}]`);
    }
  }

  console.log(`\n本次匹配: ${matchedCount} 条`);
  
  // 检查剩余
  const [remaining] = await pool.execute(
    "SELECT COUNT(*) as count FROM shipping_items WHERE status = 'pending'"
  );
  console.log(`剩余待入库: ${remaining[0].count} 条`);

  await pool.end();
}

main().catch(console.error);
