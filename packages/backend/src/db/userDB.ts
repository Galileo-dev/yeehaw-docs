import { DB } from "../abstract/DB";

export interface User {
  id?: number;
  username: string;
  password_hash: string;
  public_key: string;
  encrypted_private_key: string;
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
            encrypted_private_key TEXT NOT NULL
        )
    `);
  }

  // Get all users
  async getUsers(): Promise<{ username: string }[]> {
    return this.db.query("SELECT username FROM user").all() as {
      username: string;
    }[];
  }

  // Add a new user
  async addUser(user: User) {
    return this.db
      .query(
        `INSERT INTO user (username, password_hash, public_key, encrypted_private_key)
        VALUES (?, ?, ?, ?) returning *
      `
      )
      .get(
        user.username,
        user.password_hash,
        user.public_key,
        user.encrypted_private_key
      ) as User;
  }

  // Get a user by username
  async getUser(username: string) {
    return this.db
      .query("SELECT * FROM user WHERE username = ?")
      .get(username) as User;
  }
}
