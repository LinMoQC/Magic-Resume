import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MODEL_API_URL_MAP } from "@/constant/modals";

interface ModelConfig {
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
  temperature?: number;
  streaming?: boolean;
  maxTokens?: number;
}

/**
 * Initializes and returns a model instance based on provided config.
 * @param {ModelConfig} config - The configuration object for the model.
 * @returns A model instance from LangChain (e.g., ChatOpenAI, ChatAnthropic).
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

  const effectiveBaseUrl = baseUrl || MODEL_API_URL_MAP[modelName as keyof typeof MODEL_API_URL_MAP];

  console.log("effectiveBaseUrl", effectiveBaseUrl);

  const commonProps = {
    modelName,
    temperature,
    maxTokens,
    streaming,
    apiKey,
  };

  if (effectiveBaseUrl.includes("anthropic")) {
    return new ChatAnthropic({ ...commonProps, anthropicApiUrl: effectiveBaseUrl });
  }

  if (effectiveBaseUrl.includes("google")) {
    const { modelName, ...rest } = commonProps;
    return new ChatGoogleGenerativeAI({ ...rest, model: modelName });
  }

  return new ChatOpenAI({
    ...commonProps,
    configuration: {
      apiKey,
      baseURL: effectiveBaseUrl,
    },
  });
}; 