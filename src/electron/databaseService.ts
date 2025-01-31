import BetterSqlite3 from "better-sqlite3";
import fs from "fs";
import path from "path";
import * as sqliteVec from "sqlite-vec";
import { getDatabasePath } from "./pathResolver.js";
import { app } from 'electron';  // Add this import

export class DatabaseService {
  private static instance: DatabaseService;
  private vectorDb: BetterSqlite3.Database;
  private dbPath: string;
  private requiredTables = ["Embeddings"];

  constructor() {
    this.dbPath = getDatabasePath();
    const dbDir = path.dirname(this.dbPath);
    console.log("Database path (this.dbPath):", this.dbPath);

    // Ensure database directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize Better SQLite3
    this.vectorDb = new BetterSqlite3(this.dbPath);
    
    // Resolve the correct path for the SQLite extension
    const extensionPath = path.join(
      app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
      'node_modules/sqlite-vec-darwin-arm64/vec0.dylib'
    );
    console.log("Extension path:", extensionPath);
    console.log("Extension exists:", fs.existsSync(extensionPath));

    // Load the SQLite extension using the correct path
    try {
      this.vectorDb.loadExtension(extensionPath);
    } catch (error) {
      console.error("Failed to load extension:", error);
      throw error;
    }

    // Initialize the database schema
    this.initializeSchema();
    this.checkRequiredTables();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private logDatabaseVersions() {
    const { sqlite_version, vec_version } = this.vectorDb
      .prepare(
        "select sqlite_version() as sqlite_version, vec_version() as vec_version;",
      )
      .get() as { sqlite_version: string; vec_version: string };
    console.log(`sqlite_version=${sqlite_version}, vec_version=${vec_version}`);
  }

  private tableExists(tableName: string): boolean {
    const result = this.vectorDb
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='table' 
      AND name = ?
    `,
      )
      .get(tableName) as { count: number };

    return result.count > 0;
  }

  private checkRequiredTables() {
    console.log("\nChecking required tables:");
    for (const table of this.requiredTables) {
      const exists = this.tableExists(table);
      console.log(`- ${table}: ${exists ? "✓" : "✗"}`);

      if (exists) {
        // Get row count for each table
        const countResult = this.vectorDb
          .prepare(`SELECT COUNT(*) as count FROM ${table}`)
          .get() as { count: number };
        console.log(`  Rows: ${countResult.count}`);
      }
    }
  }

  private initializeSchema() {
    try {
      // Enable foreign key support
      this.vectorDb.exec("PRAGMA foreign_keys=ON;");

      this.vectorDb.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS Embeddings USING vec0(
          chunkId integer primary key,
          embedding float[5]
        );`);

      console.log("Database schema initialized");
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  public cleanAllTables(): void {
    try {
      // Begin a transaction to ensure data consistency
      const transaction = this.vectorDb.transaction(() => {
        // Disable foreign key constraints temporarily
        this.vectorDb.exec("PRAGMA foreign_keys=OFF;");
        // Delete data from all tables
        for (const table of this.requiredTables) {
          this.vectorDb.prepare(`DELETE FROM ${table}`).run();
        }
        // Re-enable foreign key constraints
        this.vectorDb.exec("PRAGMA foreign_keys=ON;");
      });
      // Execute the transaction
      transaction();

      console.log("All tables have been cleaned successfully");
    } catch (error) {
      console.error("Error cleaning tables:", error);
      throw error;
    }
  }

  async saveEmbedding(
    chunkId: number,
    embeddingVector: Float32Array,
  ): Promise<void> {
    const embeddingStmt = this.vectorDb.prepare(
      "INSERT OR REPLACE INTO Embeddings(chunkId, embedding) VALUES (?, ?)",
    );
    embeddingStmt.run(BigInt(chunkId), embeddingVector);
  }

  async findSimilarEmbeddings(
    queryEmbedding: Float32Array,
    limit: number = 5,
    distanceThreshold: number = 20,
  ): Promise<Array<{ chunkId: number; distance: number }>> {
    const stmt = this.vectorDb.prepare(`
      SELECT 
        chunkId,
        distance
      FROM Embeddings
      WHERE embedding MATCH ?
        AND k = ?
        AND distance < ?
      ORDER BY distance ASC
  `);

    const results = stmt.all(
      queryEmbedding,
      limit,
      distanceThreshold,
    ) as Array<{
      chunkId: number;
      distance: number;
    }>;
    console.log(results);
    return results;
  }

  async close(): Promise<void> {
    this.vectorDb.close();
  }
}
