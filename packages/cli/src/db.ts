import { Database } from "bun:sqlite";

interface User {
  id?: number;
  username: string;
  public_key: string;
  private_key: string;
}

const db = new Database("../cli.db");

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

export async function addUser(
  username: string,
  publicKey: string,
  privateKey: string
): Promise<User> {
  return db
    .query(
      `INSERT INTO user (username, public_key, private_key) VALUES (?, ?, ?) RETURNING *`
    )
    .get(username, publicKey, privateKey) as User;
}

export async function getUser(username: string): Promise<User> {
  return db
    .query("SELECT * FROM user WHERE username = ?")
    .get(username) as User;
}
