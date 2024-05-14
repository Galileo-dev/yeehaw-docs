import { DB } from "../abstract/DB";

export interface YeehawFile {
  id?: number;
  from_user_id: number;
  to_user_id: number;
  name: string;
  data: File;
}

export class FileDB extends DB {
  constructor(path = "file.db") {
    super(path);
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

  async getSharedFiles(to_user_id: number) {
    return this.db
      .query(`SELECT * FROM file WHERE to_user_id = ?`)
      .all(to_user_id) as YeehawFile[];
  }
}
