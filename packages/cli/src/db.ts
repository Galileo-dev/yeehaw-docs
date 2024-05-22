import { Database } from "bun:sqlite";

interface User {
  id?: number;
  username: string;
  publicKey: string;
  privateKey: string;
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

function convertToCamelCase(user: any): User {
  return {
    id: user.id,
    username: user.username,
    publicKey: user.public_key,
    privateKey: user.private_key,
  };
}

export async function addUser(
  username: string,
  publicKey: string,
  privateKey: string
): Promise<User> {
  const user = db
    .query(
      `INSERT INTO user (username, public_key, private_key) VALUES (?, ?, ?) RETURNING *`
    )
    .get(username, publicKey, privateKey);

  return convertToCamelCase(user);
}

export async function getUser(username: string): Promise<User> {
  const user = db.query("SELECT * FROM user WHERE username = ?").get(username);

  return convertToCamelCase(user);
}

export async function getUsers(): Promise<User[]> {
  const user = db.query("SELECT * FROM user").all() as User[];

  return user.map(convertToCamelCase);
}

export async function deleteUser(username: string): Promise<void> {
  db.query("DELETE FROM user WHERE username = ?").run(username);
}
