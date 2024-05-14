import { Database } from "bun:sqlite";

interface User {
  id?: number;
  username: string;
  public_key: string;
  private_key: string;
}

const db = new Database("../db.sqlite");
db.exec("PRAGMA journal_mode = WAL;");

export const user_table_query = db
  .prepare(
    `CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL
)`
  )
  .run();

export async function createNewUser(
  username: string,
  publicKey: string,
  privateKey: string
) {
  return db
    .query(
      `INSERT INTO user (username, public_key, private_key) VALUES (?, ?, ?) RETURNING id`
    )
    .get(username, publicKey, privateKey) as User;
}
