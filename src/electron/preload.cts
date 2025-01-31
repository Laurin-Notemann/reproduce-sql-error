const { contextBridge, ipcRenderer } = require("electron");

interface ElectronAPI {
  saveEmbedding: (
    chunkId: number,
    embeddingVector: Float32Array,
  ) => Promise<void>;
  findSimilarEmbeddings: (
    queryEmbedding: Float32Array,
    limit?: number,
    distanceThreshold?: number,
  ) => Promise<Array<{ chunkId: number; distance: number }>>;
}

// Declare the electron property on the Window interface
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("electron", {
  saveEmbedding: (chunkId: number, embeddingVector: Float32Array) =>
    ipcRenderer.invoke("saveEmbedding", chunkId, embeddingVector),
  findSimilarEmbeddings: (
    queryEmbedding: Float32Array,
    limit = 5,
    distanceThreshold = 20,
  ) =>
    ipcRenderer.invoke(
      "findSimilarEmbeddings",
      queryEmbedding,
      limit,
      distanceThreshold,
    ),
} as ElectronAPI);
