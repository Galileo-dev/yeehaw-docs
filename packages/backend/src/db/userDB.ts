import { DB } from "./DB";

export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  publicKey: string;
  encryptedPrivateKey: {
    iv: string;
    salt: string;
    data: string;
    authTag: string;
  };
}

export interface UserDto {
  id?: number;
  username: string;
  password_hash: string;
  public_key: string;
  iv: string;
  salt: string;
  data: string;
  auth_tag: string;
}

export class UserDB extends DB {
  constructor(path = "user.db") {
    super(path);
  }

  async init() {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        public_key TEXT NOT NULL,
        iv TEXT NOT NULL,
        salt TEXT NOT NULL,
        data TEXT NOT NULL,
        auth_tag TEXT NOT NULL
      )
    `);
  }

  // Get all users
  async getUsers(): Promise<{ username: string }[]> {
    const users = await this.db.query("SELECT username FROM user").all();
    return users as { username: string }[];
  }

  // Add a new user
  async addUser(user: User): Promise<User> {
    const newUser = (await this.db
      .query(
        `INSERT INTO user (username, password_hash, public_key, iv, salt, data, auth_tag)
         VALUES (?, ?, ?, ?, ?, ?, ?) returning *`
      )
      .get(
        user.username,
        user.passwordHash,
        user.publicKey,
        user.encryptedPrivateKey.iv,
        user.encryptedPrivateKey.salt,
        user.encryptedPrivateKey.data,
        user.encryptedPrivateKey.authTag
      )) as UserDto;

    if (!newUser) {
      throw new Error("Failed to add user");
    }

    return {
      id: newUser.id,
      username: newUser.username,
      passwordHash: newUser.password_hash,
      publicKey: newUser.public_key,
      encryptedPrivateKey: {
        iv: newUser.iv,
        salt: newUser.salt,
        data: newUser.data,
        authTag: newUser.auth_tag,
      },
    };
  }

  // Get a user by username
  async getUser(username: string): Promise<User | null> {
    const user = (await this.db
      .query("SELECT * FROM user WHERE username = ?")
      .get(username)) as UserDto;

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      passwordHash: user.password_hash,
      publicKey: user.public_key,
      encryptedPrivateKey: {
        iv: user.iv,
        salt: user.salt,
        data: user.data,
        authTag: user.auth_tag,
      },
    };
  }
  // Get a user by id
  async getUserById(id: number): Promise<User | null> {
    const user = (await this.db
      .query("SELECT * FROM user WHERE id = ?")
      .get(id)) as UserDto;

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      passwordHash: user.password_hash,
      publicKey: user.public_key,
      encryptedPrivateKey: {
        iv: user.iv,
        salt: user.salt,
        data: user.data,
        authTag: user.auth_tag,
      },
    };
  }
}
