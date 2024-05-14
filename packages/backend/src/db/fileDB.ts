import { DB } from "../abstract/DB";

export interface YeehawFile {
  id: number;
  from_user_name: string;
  to_user_name: string;
  name: string;
  size: number;
}

interface YeehawFileDto {
  id?: number;
  from_user_name: string;
  to_user_name: string;
  name: string;
  size: number;
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
            from_user_name TEXT NOT NULL,
            to_user_name TEXT NOT NULL,
            name TEXT NOT NULL,
            size INTEGER NOT NULL,
            data BLOB NOT NULL
        )
    `);
  }

  async addFile(file: YeehawFileDto) {
    const fileRaw = new Uint8Array(await file.data.arrayBuffer());
    return this.db
      .query(
        `INSERT INTO file (from_user_name, to_user_name, name, size, data)
            VALUES (?, ?, ?, ?, ?) RETURNING id`
      )
      .get(
        file.from_user_name,
        file.to_user_name,
        file.name,
        file.size,
        fileRaw
      ) as YeehawFileDto;
  }

  async getSharedFiles(to_user_name: string): Promise<YeehawFile[]> {
    const files = this.db
      .query(`SELECT * FROM file WHERE to_user_name = ?`)
      .all(to_user_name) as YeehawFileDto[];

    return files.map((file: any) => ({
      id: file.id,
      from_user_name: file.from_user_name,
      to_user_name: file.to_user_name,
      name: file.name,
      size: file.size,
    }));
  }
}
