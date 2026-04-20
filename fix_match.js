const mysql = require('mysql2/promise');
async function main() {
  const pool = mysql.createPool({
    host: 'gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com',
    port: 29477,
    user: 'root',
    password: 'Mygbbyy1.',
    database: 'nonwoven'
  });
  
  // 获取所有入库记录
  const [inStock] = await pool.execute("SELECT id, batch_no, package_no, qr_code FROM raw_materials WHERE status='in_stock'");
  
  // 获取所有待入库记录
  const [pending] = await pool.execute("SELECT id, batch_no, package_no FROM shipping_items WHERE status='pending'");
  
  let matchCount = 0;
  
  for (const item of pending) {
    const pBatch = item.batch_no;
    const pPackage = item.package_no;
    
    // 查找匹配的入库记录
    const matched = inStock.find(m => {
      const batchMatch = m.batch_no === pBatch || m.batch_no.startsWith(pBatch + '-');
      const packageMatch = m.package_no === pPackage;
      return batchMatch && packageMatch;
    });
    
    if (matched) {
      await pool.execute(
        "UPDATE shipping_items SET status = 'matched', qr_code = ? WHERE id = ?",
        [matched.qr_code, item.id]
      );
      matchCount++;
      console.log(`✓ 已匹配: ${pBatch}#${pPackage} -> ${matched.batch_no}#${matched.package_no}`);
    }
  }
  
  console.log(`\n完成！共匹配 ${matchCount} 条记录`);
  
  await pool.end();
}
main();
