import Database from "bun:sqlite";

export abstract class DB {
  protected db: Database;

  constructor(protected dbPath: string) {
    this.db = new Database(dbPath);
    this.initialize();
  }

  async healthCheck(): Promise<void> {
    await this.db.query("SELECT 1");
  }

  private async initialize(): Promise<void> {
    try {
      await this.init();
    } catch (error) {
      console.error(error);
    }
  }

  protected abstract init(): Promise<void>;
}
