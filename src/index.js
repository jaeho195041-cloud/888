"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// PostgreSQL 연결 풀 설정
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
exports.pool = pool;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static('public'));
// 기본 라우트
app.get('/', (req, res) => {
    res.send('<h1>777 Simple Board Server is running!</h1>');
});
// DB 연결 테스트 엔드포인트
app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0].now });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database connection failed' });
    }
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map