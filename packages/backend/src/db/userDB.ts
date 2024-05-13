import { DB } from "../abstract/DB";

export interface User {
  id?: number;
  username: string;
  public_key: string;
}

export interface File {
  id?: number;
  user_id: number;
  name: string;
  size: number;
  data: Buffer;
}

export class UserDB extends DB {
  constructor() {
    super("user.db");
  }

  async init() {
    // create user table
    this.db.run(`
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL
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
        `INSERT INTO user (username, public_key)
        VALUES (?, ?) RETURNING id`
      )
      .get(user.username, user.public_key) as User;
  }

  // Get a user by username
  async getUser(username: string) {
    return this.db
      .query("SELECT * FROM user WHERE username = ?")
      .get(username) as User;
  }

  // Add a new file
  async addFile(file: File) {
    return this.db
      .query(
        `INSERT INTO file (user_id, name, size, data)
            VALUES (?, ?, ?, ?) RETURNING id`
      )
      .get(file.user_id, file.name, file.size, file.data) as File;
  }
}
