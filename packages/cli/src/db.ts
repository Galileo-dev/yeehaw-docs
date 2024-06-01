import { Database } from "bun:sqlite";

interface User {
  id?: number;
  username: string;
  publicKey: string;
  encryptedPrivateKey: {
    iv: string;
    salt: string;
    data: string;
    authTag: string;
  };
  jwtToken: string;
}

const db = new Database("../cli.db");

export const user_table_query = db
  .prepare(
    `CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  data TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  jwt_token TEXT NOT NULL
)`
  )
  .run();

export const active_user_table_query = db
  .prepare(
    `CREATE TABLE IF NOT EXISTS active_user (
  active_user_id INTEGER,
  FOREIGN KEY(active_user_id) REFERENCES user(id)
)`
  )
  .run();

function convertToCamelCase(user: any): User {
  return {
    id: user.id,
    username: user.username,
    publicKey: user.public_key,
    encryptedPrivateKey: {
      iv: user.iv,
      salt: user.salt,
      data: user.data,
      authTag: user.auth_tag,
    },
    jwtToken: user.jwt_token,
  };
}

export async function addUser(
  username: string,
  publicKey: string,
  encryptedPrivateKey: {
    iv: string;
    salt: string;
    data: string;
    authTag: string;
  },
  jwtToken: string
): Promise<User> {
  const user = db
    .query(
      `INSERT INTO user (username, public_key, iv, salt, data, auth_tag, jwt_token) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      username,
      publicKey,
      encryptedPrivateKey.iv,
      encryptedPrivateKey.salt,
      encryptedPrivateKey.data,
      encryptedPrivateKey.authTag,
      jwtToken
    );

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

export async function setActiveUser(username: string): Promise<void> {
  const user = await getUser(username);

  if (!user) {
    throw new Error("User not found");
  }
  db.query("DELETE FROM active_user").run();
  db.query("INSERT INTO active_user (active_user_id) VALUES (?)").run(user.id!);
}

export async function getActiveUser(): Promise<User | null> {
  const activeUserId = (await db
    .query("SELECT active_user_id FROM active_user")
    .get()) as { active_user_id: number } | null;

  if (!activeUserId) {
    return null;
  }

  const user = db
    .query("SELECT * FROM user WHERE id = ?")
    .get(activeUserId.active_user_id);

  if (!user) {
    return null;
  }

  return convertToCamelCase(user);
}

export async function clearActiveUser(): Promise<void> {
  db.query("DELETE FROM active_user").run();
}

export async function getJwtToken(): Promise<string | null> {
  const user = await getActiveUser();

  if (!user) {
    return null;
  }

  return user.jwtToken.split(";")[0];
}
