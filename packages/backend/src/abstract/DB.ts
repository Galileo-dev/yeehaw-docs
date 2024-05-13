export abstract class DB {
  constructor() {
    // Initialize the database
    console.log("\n🚀 Initializing database...");
    this.init()
      .then(() => console.log("\n✅ Database initialized"))
      .catch(console.error);
  }

  abstract init(): Promise<void>;
}
