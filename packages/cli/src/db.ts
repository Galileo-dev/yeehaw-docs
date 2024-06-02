import { Database } from "bun:sqlite";
import { homedir, platform } from 'os';
import path from 'path';
import fs from 'fs';

interface User {
  id?: number;
  username: string;
  publicKey: string;
  privateKey: string;
}

// ============================================================
// create database in Local Application Data directory
// ============================================================

const getAppDataDirectory = () => {
  const homeDir = homedir();
  const plat = platform();

  switch (plat) {
    case 'win32':
      return process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support');
    case 'linux':
    default:
      return process.env.XDG_DATA_HOME || path.join(homeDir, '.local', 'share');
  }
};

const appDataDirectory = getAppDataDirectory();
const dbDirectory = path.join(appDataDirectory, 'YeehawDocs');


if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}


const dbFilePath = path.join(dbDirectory, 'cli.db');

const db = new Database(dbFilePath);


export const user_table_query = db
  .prepare(
    `CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  password_hash TEXT NOT NULL
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
  privateKey: string,
  passwordHash: string
): Promise<User> {
  const user = db
    .query(
      `INSERT INTO user (username, public_key, private_key, password_hash) VALUES (?, ?, ?, ?) RETURNING *`
    )
    .get(username, publicKey, privateKey, passwordHash);

  return convertToCamelCase(user);
}

export async function getUser(username: string): Promise<User | null> {
  const user = db.query("SELECT * FROM user WHERE username = ?").get(username);

  if (!user) {
    return null;
  }

  return convertToCamelCase(user);
}

export async function getUsers(): Promise<User[]> {
  const user = db.query("SELECT * FROM user").all() as User[];

  return user.map(convertToCamelCase);
}

export async function deleteUser(username: string): Promise<void> {
  db.query("DELETE FROM user WHERE username = ?").run(username);
}
