import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
  }
}

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 테이블 생성 초기화
const initDB = async () => {
  try {
    // 순차적으로 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, post_id)
      );
    `);
    console.log('Database initialized successfully: All tables are ready');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
};
initDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.use(session({
  secret: 'secret-key-777',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7일 (자동 로그인 효과)
}));

// 로그인 체크 미들웨어
const checkAuth = (req: any, res: any, next: any) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// 회원가입 API
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  console.log('Signup request received:', username);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );
    console.log('User created successfully, ID:', result.rows[0].id);
    res.json({ success: true, userId: result.rows[0].id });
  } catch (err: any) {
    console.error('Signup error details:', err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error: ' + err.message });
    }
  }
});

// 로그인 API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ success: true, username: user.username });
      } else {
        res.status(400).json({ error: 'Invalid password' });
      }
    } else {
      res.status(400).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 로그아웃 API
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// 현재 세션 확인 API
app.get('/api/me', (req: any, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

export { pool };
