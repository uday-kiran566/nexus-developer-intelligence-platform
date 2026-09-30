const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (process.env.DB_SSL === "true") {
    config.ssl = {
        ca: fs.readFileSync(
            path.join(__dirname, "../certs/isrgrootx1.pem")
        )
    };
}

const pool = mysql.createPool(config);

module.exports = pool;
