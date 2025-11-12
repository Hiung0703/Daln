const pgp = require('pg-promise')();

const connection = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'ocr_app',
    user: process.env.POSTGRES_USER || 'postgres',
    password: String(process.env.POSTGRES_PASSWORD || 'postgres'),
    // Bổ sung SSL nếu cần
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const db = pgp(connection);

// Kiểm tra kết nối
db.connect()
    .then(obj => {
        console.log('Database connected successfully');
        obj.done(); // giải phóng connection khi đã xong
    })
    .catch(error => {
        console.error('Database connection error:', error);
    });

module.exports = db;