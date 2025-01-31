import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import { DatabaseService } from "./databaseService.js";

export let mainWindow: BrowserWindow | null = null;
let dbService: DatabaseService;

async function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      webPreferences: {
        preload: getPreloadPath(),
        sandbox: false, // Ensure sandbox is disabled
        nodeIntegration: true,
        contextIsolation: true,
      },
      titleBarStyle: "hidden",
      frame: false,
      backgroundColor: "#F2F2F7",
      useContentSize: true,
      thickFrame: false,
    });

    if (isDev()) {
      mainWindow.loadURL("http://localhost:5123");
    } else {
      mainWindow.loadFile(
        path.join(app.getAppPath(), "/dist-react/index.html"),
      );
    }

    mainWindow.webContents.on(
      "did-fail-load",
      (errorCode, errorDescription) => {
        console.error("Failed to load:", errorCode, errorDescription);
      },
    );

    // Initialize database service
    dbService = new DatabaseService();

    // Database IPC handlers
    ipcMain.handle(
      "saveEmbedding",
      async (_event, chunkId: number, embeddingVector: Float32Array) => {
        const dbService = DatabaseService.getInstance();
        await dbService.saveEmbedding(chunkId, embeddingVector);
      },
    );

    ipcMain.handle(
      "findSimilarEmbeddings",
      async (
        _event,
        queryEmbedding: Float32Array,
        limit?: number,
        distanceThreshold?: number,
      ) => {
        const dbService = DatabaseService.getInstance();
        return await dbService.findSimilarEmbeddings(
          queryEmbedding,
          limit,
          distanceThreshold,
        );
      },
    );

    // Set up error handling for the window
    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } catch (error) {
    console.error("Failed to create window:", error);
    throw error;
  }
}

async function initializeApp() {
  try {
    // then create the window
    await createWindow();
    console.log("Window created successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    app.quit();
  }
}

// App event handlers
app.on("ready", () => {
  console.log("App ready event fired");
  console.log("Electron version:", process.versions.electron);
  console.log("Chrome version:", process.versions.chrome);
  console.log("Node version:", process.versions.node);

  initializeApp().catch((error) => {
    console.error("Failed to initialize app:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
    app.quit();
  });
});

app.on("window-all-closed", async () => {
  if (dbService) {
    await dbService.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    initializeApp().catch((error) => {
      console.error("Failed to initialize app on activate:", error);
      app.quit();
    });
  }
});

// Handle any unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle cleanup on app quit
app.on("before-quit", async (event) => {
  if (dbService) {
    event.preventDefault();
    try {
      await dbService.close();
      app.quit();
    } catch (error) {
      console.error("Error closing database:", error);
      app.quit();
    }
  }
});
