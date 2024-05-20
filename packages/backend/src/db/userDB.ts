import { DB } from "../abstract/DB";

export interface User {
  id?: number;
  username: string;
  password_hash: string;
  public_key: string;
  encrypted_private_key: Buffer;
  salt: Buffer;
  iv: Buffer;
  auth_tag: Buffer;
}

export class UserDB extends DB {
  constructor(path = "user.db") {
    super(path);
  }

  async init() {
    // create user table
    this.db.run(`
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            public_key TEXT NOT NULL,
            encrypted_private_key BLOB NOT NULL,
            salt BLOB NOT NULL,
            iv BLOB NOT NULL,
            auth_tag BLOB NOT NULL
        )
    `);
  }

  // Get all users
  async getUsers() {
    return this.db.query("SELECT * FROM user").all();
  }

  // Add a new user
  async addUser(user: User) {
    return this.db
      .query(
        `INSERT INTO user (username, password_hash, public_key, encrypted_private_key, salt, iv, auth_tag)
        VALUES (?, ?, ?, ?, ?, ?, ?) returning *`
      )
      .get(
        user.username,
        user.password_hash,
        user.public_key,
        user.encrypted_private_key,
        user.salt,
        user.iv,
        user.auth_tag
      ) as User;
  }

  // Get a user by username
  async getUser(username: string) {
    return this.db
      .query("SELECT * FROM user WHERE username = ?")
      .get(username) as User;
  }
}
