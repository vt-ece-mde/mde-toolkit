import { Pool } from "pg";

let conn: Pool|undefined = undefined;

// Create database connection if not exists.
// See: https://www.simplenextjs.com/posts/next-postgresql
if (!conn) {
    conn = new Pool({
        user: process.env.PGSQL_USER,
        password: process.env.PGSQL_PASSWORD,
        host: process.env.PGSQL_HOST,
        port: Number(process.env.PGSQL_PORT),
        database: process.env.PGSQL_DATABASE,
    })
}

export default conn;