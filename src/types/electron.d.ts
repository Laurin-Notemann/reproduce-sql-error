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
