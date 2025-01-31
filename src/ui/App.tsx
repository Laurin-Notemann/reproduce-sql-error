import { useState } from "react";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [embeddings, setEmbeddings] = useState([]);
  const [queryResult, setQueryResult] = useState([]);

  const handleSaveEmbedding = async () => {
    const chunkId = count; // Example: using count as chunkId
    const embeddingVector = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]); // Example embedding vector

    try {
      await window.electron.saveEmbedding(chunkId, embeddingVector);
      setEmbeddings((prev) => [...prev, { chunkId, embeddingVector }]);
      console.log(`Saved embedding for chunkId: ${chunkId}`);
    } catch (error) {
      console.error("Error saving embedding:", error);
    }
  };

  const handleFindSimilarEmbeddings = async () => {
    const queryEmbedding = new Float32Array([0.1, 0.2, 0.3, 0.5, 0.4]); // Example query embedding

    try {
      const results =
        await window.electron.findSimilarEmbeddings(queryEmbedding);
      setQueryResult(results);
      console.log("Similar embeddings found:", results);
    } catch (error) {
      console.error("Error finding similar embeddings:", error);
    }
  };

  return (
    <>
      <h1>Error Demo</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </button>
        <button onClick={handleSaveEmbedding}>Save Embedding</button>
        <button onClick={handleFindSimilarEmbeddings}>
          Find Similar Embeddings
        </button>
      </div>
      <div>
        <h2>Embeddings</h2>
        <ul>
          {embeddings.map((embedding, index) => (
            <li key={index}>
              Chunk ID: {embedding.chunkId}, Vector:{" "}
              {embedding.embeddingVector.toString()}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Query Results</h2>
        <ul>
          {queryResult.map((result, index) => (
            <li key={index}>
              Chunk ID: {result.chunkId}, Distance: {result.distance}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
