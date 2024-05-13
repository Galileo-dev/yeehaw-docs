import Database from "bun:sqlite";

export abstract class DB {
  protected db: Database;

  constructor(protected dbPath: string) {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log(`🔥 Initializing database ${this.dbPath}...`);
    try {
      await this.init();
      console.log(`🔥 Database ${this.dbPath} is running...`);
    } catch (error) {
      console.error(error);
    }
  }

  protected abstract init(): Promise<void>;
}
