import { Database } from "bun:sqlite";

export interface User {
  id?: number;
  username: string;
  password_hash: string;
}

export interface File {
  id?: number;
  user_id: number;
  name: string;
  size: number;
  data: Buffer;
}

export class FileSharingDatabase {
  private db: Database;

  constructor() {
    this.db = new Database("db.db");
    // Initialize the database
    console.log("\n🚀 Initializing database...");
    this.init()
      .then(() => console.log("\n✅ Database initialized"))
      .catch(console.error);
  }

  // Get all users
  async getUsers() {
    return this.db.query("SELECT * FROM user").all();
  }

  // Add a new user
  async addUser(user: User) {
    return this.db
      .query(
        `INSERT INTO user (username, password_hash)
        VALUES (?, ?) RETURNING id`
      )
      .get(user.username, user.password_hash) as User;
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

  async init() {
    this.db.run(`
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL
        )
    `);

    // create file upload table
    this.db.run(`
        CREATE TABLE IF NOT EXISTS file (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            size INTEGER NOT NULL,
            data BLOB NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user(id)
        )
    `);
  }
}
