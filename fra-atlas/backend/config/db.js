import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "Akshat#71",
  port: 5432,
});

export default pool;
