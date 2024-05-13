import { Database } from "bun:sqlite"

const db = new Database("../db.sqlite")
db.exec("PRAGMA journal_mode = WAL;")

export const note_table_query = db.prepare(`CREATE TABLE IF NOT EXISTS note (
  note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  note TEXT NOT NULL
)`)

export function create_new_note(note: string): void {
  const query = db.query(`INSERT INTO note (note) VALUES (?)`);
  query.run(note);
}
