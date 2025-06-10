import { ChatOpenAI } from "@langchain/openai";

interface ModelConfig {
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
  temperature?: number;
  streaming?: boolean;
  maxTokens?: number;
}

/**
 * Initializes and returns a ChatOpenAI model instance based on provided config.
 * @param {ModelConfig} config - The configuration object for the model.
 * @returns A ChatOpenAI model instance.
 */
export const getModel = ({
  apiKey,
  baseUrl,
  modelName = "gpt-4o-mini",
  temperature = 0.7,
  maxTokens = 1024,
  streaming = true,
}: ModelConfig) => {
  if (!apiKey) {
    throw new Error("API key is required to initialize the model.");
  }

  return new ChatOpenAI({
    modelName,
    temperature,
    streaming: streaming,
    maxTokens,
    configuration: {
      apiKey,
      baseURL: baseUrl,
    }
  });
}; 