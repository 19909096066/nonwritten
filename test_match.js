const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({
    host: 'gz-cynosdbmysql-grp-g4mz63v7.sql.tencentcdb.com',
    port: 29477,
    user: 'root',
    password: 'Mygbbyy1.',
    database: 'nonwoven',
    charset: 'utf8mb4'
  });
  
  const [rmItems] = await pool.execute("SELECT batch_no, package_no, weight FROM raw_materials WHERE batch_no = 'P0126020014-01B2' AND package_no = '72'");
  const [siItems] = await pool.execute("SELECT batch_no, package_no, weight FROM shipping_items WHERE batch_no = 'P0126020014' AND package_no = '72'");
  
  console.log('raw_materials:', JSON.stringify(rmItems[0]));
  console.log('shipping_items:', JSON.stringify(siItems[0]));
  
  if (rmItems[0] && siItems[0]) {
    const rm = rmItems[0];
    const si = siItems[0];
    const rmPkg = String(rm.package_no).trim();
    const siPkg = String(si.package_no).trim();
    const rmBatch = String(rm.batch_no).trim();
    const siBatch = String(si.batch_no).trim();
    const rmWeight = parseFloat(rm.weight) || 0;
    const siWeight = parseFloat(si.weight) || 0;
    const rmPrefix = rmBatch.split('-')[0];
    
    console.log('rmPkg:', rmPkg, 'siPkg:', siPkg, 'match:', rmPkg === siPkg);
    console.log('rmBatch:', rmBatch, 'siBatch:', siBatch, 'rmPrefix:', rmPrefix, 'match:', siBatch === rmBatch || siBatch === rmPrefix);
    console.log('rmWeight:', rmWeight, 'siWeight:', siWeight, 'match:', siWeight === rmWeight);
    console.log('rm.weight type:', typeof rm.weight, 'si.weight type:', typeof si.weight);
    console.log('rm.weight value:', rm.weight, 'si.weight value:', si.weight);
    console.log('rm.weight === si.weight:', rm.weight === si.weight);
  }
  
  pool.end();
})();
