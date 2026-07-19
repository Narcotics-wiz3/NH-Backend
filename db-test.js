// Simple DB connectivity test for MySQL or JDBC URL
require('dotenv').config();
const mysql = require('mysql2/promise');

function parseJdbcUrl(jdbcUrl) {
  // Accepts jdbc:mysql://host:port/db?params or jdbc:mysql://user:pass@host:port/db
  let url = jdbcUrl;
  if (url.startsWith('jdbc:')) url = url.replace(/^jdbc:/, '');
  try {
    return new URL(url);
  } catch (err) {
    // Try to coerce missing auth format
    return null;
  }
}

async function getMysqlConfig() {
  // Priority: explicit MYSQL_* vars, then DATABASE_URL (mysql://), then JDBC_DATABASE_URL
  if (process.env.MYSQL_HOST) {
    return {
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };
  }

  let url = process.env.DATABASE_URL || process.env.JDBC_DATABASE_URL;
  if (!url) throw new Error('No MySQL connection info found in env (MYSQL_HOST or DATABASE_URL or JDBC_DATABASE_URL)');

  if (url.startsWith('jdbc:')) url = url.replace(/^jdbc:/, '');
  const parsed = new URL(url);
  const auth = parsed.username ? { user: decodeURIComponent(parsed.username), password: decodeURIComponent(parsed.password) } : {};
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '3306', 10),
    user: auth.user || process.env.MYSQL_USER,
    password: auth.password || process.env.MYSQL_PASSWORD,
    database: (parsed.pathname || '').replace('/', ''),
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
}

(async function main() {
  try {
    const cfg = await getMysqlConfig();
    console.log('Attempting MySQL connection with:', Object.assign({}, cfg, { password: cfg.password ? '******' : undefined }));
    const pool = mysql.createPool(Object.assign({ waitForConnections: true, connectionLimit: 5 }, cfg));
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT 1 AS ok');
    console.log('Connection successful:', rows && rows[0] && rows[0].ok === 1);
    conn.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('MySQL connection failed:', err.message || err);
    process.exit(2);
  }
})();
