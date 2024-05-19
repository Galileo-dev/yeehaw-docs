import { Database } from "bun:sqlite";
import crypto from "crypto";
import bun from "bun";

const db = new Database("../db.sqlite")
db.exec("PRAGMA journal_mode = WAL;")

export const user_table_query = db.prepare(`CREATE TABLE IF NOT EXISTS user (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL
)`).run()

export async function create_new_user(username: string, password: string): Promise<void> {
  const userExistsQuery = db.query(`SELECT * FROM user WHERE username = ?`);
  const userExists = userExistsQuery.get(username);

  if (userExists) {
    throw new Error(`User with username ${username} already exists.`);
  }

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

const hashedPassword = await bun.password.hash(password); 

const query = db.query(`INSERT INTO user (username, password, public_key, private_key) VALUES (?, ?, ?)`);
query.run(username, hashedPassword, publicKey, privateKey);
}
