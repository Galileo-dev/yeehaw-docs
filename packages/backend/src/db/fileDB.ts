import { DB } from "../abstract/DB";

export interface YeehawFile {
  id?: number;
  fromUsername: string;
  toUsername: string;
  name: string;
  size: number;
  data: string;
  iv: string;
  salt: string;
  auth_tag: string;
}

interface YeehawFileDto {
  id?: number;
  fromUsername: string;
  toUsername: string;
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
            fromUsername TEXT NOT NULL,
            toUsername TEXT NOT NULL,
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
    const fileRaw = Buffer.from(file.data, "base64");
    return this.db
      .query(
        `INSERT INTO file (fromUsername, toUsername, name, size, data, iv, salt, auth_tag)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .get(
        file.fromUsername,
        file.toUsername,
        file.name,
        file.size,
        fileRaw,
        file.iv,
        file.salt,
        file.auth_tag
      ) as YeehawFileDto;
  }

  async getSharedFiles(toUsername: string): Promise<
    {
      fromUsername: string;
      name: string;
      size: number;
    }[]
  > {
    const files = this.db
      .query(`SELECT name, size, fromUsername FROM file WHERE toUsername = ?`)
      .all(toUsername) as YeehawFileDto[];

    return files.map((file: any) => ({
      id: file.id,
      fromUsername: file.fromUsername,
      toUsername: file.toUsername,
      name: file.name,
      size: file.size,
    }));
  }
}
