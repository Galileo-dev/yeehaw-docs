import { Database } from "bun:sqlite";

const db = new Database("../db.sqlite")
db.exec("PRAGMA journal_mode = WAL;")

export const user_table_query = db.prepare(`CREATE TABLE IF NOT EXISTS user (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
)`).run()

export function create_new_user(username: string, password: string): void {
  const userExistsQuery = db.query(`SELECT * FROM user WHERE username = ?`);
  const userExists = userExistsQuery.get(username);

  if (userExists) {
    console.error(`User with username ${username} already exists.`);
    return;
  }

  const query = db.query(`INSERT INTO user (username, password) VALUES (?, ?)`);
  query.run(username, password);
}
