const mysql = require('mysql2/promise');
async function main() {
  const pool = mysql.createPool({
    host: 'gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com',
    port: 29477,
    user: 'root',
    password: 'Mygbbyy1.',
    database: 'nonwoven'
  });
  console.log('=== raw_materials (已入库) ===');
  const [r1] = await pool.execute("SELECT batch_no, package_no, qr_code FROM raw_materials WHERE status='in_stock' LIMIT 5");
  console.log(JSON.stringify(r1, null, 2));
  console.log('\n=== shipping_items (待入库) ===');
  const [r2] = await pool.execute("SELECT batch_no, package_no FROM shipping_items WHERE status='pending' LIMIT 5");
  console.log(JSON.stringify(r2, null, 2));
  await pool.end();
}
main();
