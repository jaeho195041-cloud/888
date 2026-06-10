"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const init = async () => {
    try {
        console.log('Connecting to database...');
        await pool.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
        console.log('Users table created or exists');
        await pool.query('CREATE TABLE IF NOT EXISTS posts (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
        console.log('Posts table created or exists');
        await pool.query('CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
        console.log('Comments table created or exists');
        await pool.query('CREATE TABLE IF NOT EXISTS likes (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE, PRIMARY KEY (user_id, post_id));');
        console.log('Likes table created or exists');
        console.log('ALL TABLES INITIALIZED SUCCESSFULLY');
        await pool.end();
        process.exit(0);
    }
    catch (err) {
        console.error('ERROR INITIALIZING TABLES:', err);
        process.exit(1);
    }
};
init();
//# sourceMappingURL=init-db.js.map