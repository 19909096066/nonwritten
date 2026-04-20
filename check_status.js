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
  
  console.log("=== 待入库记录对应的入库状态 ===\n");

  for (const item of pendingItems) {
    const [stockItems] = await pool.execute(
      "SELECT batch_no, package_no, status FROM raw_materials WHERE batch_no LIKE ? AND package_no = ?",
      [`${item.batch_no}%`, item.package_no]
    );
    
    if (stockItems.length > 0) {
      const stock = stockItems[0];
      console.log(`包号 ${item.package_no}: 批号 ${stock.batch_no}, 状态=${stock.status}`);
    } else {
      console.log(`包号 ${item.package_no}: 无入库记录`);
    }
  }

  await pool.end();
}

main().catch(console.error);
