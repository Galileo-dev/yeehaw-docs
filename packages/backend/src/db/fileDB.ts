import { DB } from "../abstract/DB";

export interface YeehawFile {
  id?: number;
  fromUsername: string;
  toUsername: string;
  file: {
    name: string;
    size: number;
    data: string;
    iv: string;
    salt: string;
    authTag: string;
  };
}

interface YeehawFileDetails {
  id: number;
  fromUsername: string;
  name: string;
  size: number;
}

export class FileDB extends DB {
  constructor(path = "file.db") {
    super(path);
  }

  async init() {
    this.db.run(`
        CREATE TABLE IF NOT EXISTS file (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_username TEXT NOT NULL,
            to_username TEXT NOT NULL,
            name TEXT NOT NULL,
            size INTEGER NOT NULL,
            data BLOB NOT NULL,
            iv TEXT NOT NULL,
            salt TEXT NOT NULL,
            auth_tag TEXT NOT NULL
        )
    `);
  }

  async addFile(file: YeehawFile) {
    return this.db
      .query(
        `INSERT INTO file (from_username, to_username, name, size, data, iv, salt, auth_tag)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .get(
        file.fromUsername,
        file.toUsername,
        file.file.name,
        file.file.size,
        file.file.data,
        file.file.iv,
        file.file.salt,
        file.file.authTag
      );
  }

  async getSharedFiles(toUsername: string): Promise<
    {
      id: number;
      fromUsername: string;
      name: string;
      size: number;
    }[]
  > {
    return this.db
      .query(
        `SELECT id, name, size, from_username, to_username FROM file WHERE to_username = ?`
      )
      .all(toUsername)
      .map((file: any) => ({
        id: file.id,
        fromUsername: file.from_username,
        name: file.name,
        size: file.size,
      }));
  }
}
