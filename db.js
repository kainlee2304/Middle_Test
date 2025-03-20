// File: db.js
const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

let pool;

if (isProduction) {
  // In production (on Render), use the DATABASE_URL environment variable
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  console.log("Using production database configuration");
} else {
  // In development, use local connection details
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });
  console.log("Using development database configuration");
}

pool.on("error", (err, client) => {
  console.error("Lỗi kết nối database:", err.stack);
});

module.exports = pool;
