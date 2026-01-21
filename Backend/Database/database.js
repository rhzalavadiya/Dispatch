require("dotenv").config();
const mysql = require("mysql2/promise");

const conn = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

(async () => {
    try {
        const connection = await conn.getConnection();
        console.log("connected to the Local database");
        connection.release();
    } catch (err) {
        console.error("Database connection error in Local :", err);
    }
})();


module.exports = conn;
