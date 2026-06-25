import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";

let engine: MLCEngine | null = null;
let loadingPromise: Promise<MLCEngine> | null = null;

const MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

export async function getLLM(): Promise<MLCEngine> {
  if (engine) return engine;

  if (!loadingPromise) {
    loadingPromise = CreateMLCEngine(MODEL);
  }

  engine = await loadingPromise;
  return engine;
}
