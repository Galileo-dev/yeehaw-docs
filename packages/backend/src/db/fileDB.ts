import { DB } from "./DB";

export interface YeehawFile {
  id?: number;
  fromUsername: string;
  toUsername: string;
  file: {
    name: string;
    size: number;
    data: string;
    iv: string;
    authTag: string;
    encryptedSymmetricKey: string;
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
            auth_tag TEXT NOT NULL,
            encrypted_symmetric_key TEXT NOT NULL
        )
    `);
  }

  async addFile(file: YeehawFile) {
    const result = this.db
      .query(
        `INSERT INTO file (from_username, to_username, name, size, data, iv, auth_tag, encrypted_symmetric_key)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) returning id`
      )
      .get(
        file.fromUsername,
        file.toUsername,
        file.file.name,
        file.file.size,
        file.file.data,
        file.file.iv,
        file.file.authTag,
        file.file.encryptedSymmetricKey
      );

    return this.convertToCamelCase(result);
  }

  async getFile(id: number): Promise<YeehawFile | null> {
    const file = this.db.query(`SELECT * FROM file WHERE id = ?`).get(id);
    return file ? this.convertToCamelCase(file) : null;
  }

  async getSharedFiles(toUsername: string): Promise<YeehawFileDetails[]> {
    const files = this.db
      .query(
        `SELECT id, from_username, name, size FROM file WHERE to_username = ?`
      )
      .all(toUsername);

    return files.map(this.convertDetailsToCamelCase);
  }

  private convertToCamelCase(file: any): YeehawFile {
    return {
      id: file.id,
      fromUsername: file.from_username,
      toUsername: file.to_username,
      file: {
        name: file.name,
        size: file.size,
        data: file.data,
        iv: file.iv,
        authTag: file.auth_tag,
        encryptedSymmetricKey: file.encrypted_symmetric_key,
      },
    };
  }

  private convertDetailsToCamelCase(file: any): YeehawFileDetails {
    return {
      id: file.id,
      fromUsername: file.from_username,
      name: file.name,
      size: file.size,
    };
  }
}
