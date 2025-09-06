import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "fra-atlas",
  password: "v202005V*",
  port: 5432,
});

export default pool;
