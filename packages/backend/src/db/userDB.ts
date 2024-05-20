import { DB } from "../abstract/DB";

export interface User {
  id?: number;
  password: string;
  username: string;
  public_key: string
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
            password TEXT NOT NULL,
            public_key TEXT NOT NULL
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
        VALUES (?, ?) RETURNING *`
      )
      .get(user.username, user.public_key) as User;
  }

  // Get a user by username
  async getUser(username: string) {
    return this.db
      .query("SELECT * FROM user WHERE username = ?")
      .get(username) as User;
  }
}
