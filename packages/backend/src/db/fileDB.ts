import { DB } from "../abstract/DB";

export interface User {
  id?: number;
  username: string;
  public_key: string;
}

export interface YeehawFile {
  id?: number;
  from_user_id: number;
  to_user_id: number;
  name: string;
  data: File;
}

export class FileDB extends DB {
  constructor() {
    super("file.db");
  }

  async init() {
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

  async addFile(file: YeehawFile) {
    const fileRaw = new Uint8Array(await file.data.arrayBuffer());
    return this.db
      .query(
        `INSERT INTO file (from_user_id, to_user_id, name, size, data)
            VALUES (?, ?, ?, ?, ?) RETURNING id`
      )
      .get(
        file.from_user_id,
        file.to_user_id,
        file.name,
        file.data.size,
        fileRaw
      ) as File;
  }
}
