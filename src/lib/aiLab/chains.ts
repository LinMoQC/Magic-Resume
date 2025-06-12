import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { resumeOptimizePrompt } from "@/prompts/agent-modify-prompt";
import { jdAnalysisPrompt } from "@/prompts/jd-analysis-prompt";
import { polishTextPrompt } from "@/prompts/polish-text-prompt";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { resumeAnalysisPrompt } from "@/prompts/resume-analysis-prompt";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { getModel } from "./aiService";

export const jdAnalysisSchema = z.object({
  keySkills: z
    .array(z.string())
    .describe(
      "List of key skills mentioned in the job description, e.g., 'React', 'Node.js', 'Project Management'"
    ),
  responsibilities: z
    .array(z.string())
    .describe("List of key responsibilities and tasks."),
  qualifications: z
    .array(z.string())
    .describe("List of key qualifications and experience requirements."),
  optimized_content: z
    .array(z.string())
    .describe("The optimized bullet points for the resume section"),
});

export type JdAnalysis = z.infer<typeof jdAnalysisSchema>;

export const itemOptimizationSchema = z.object({
  optimizedSummary: z
    .string()
    .describe("The rewritten, impactful resume item summary."),
});

export type ItemOptimizationOutput = z.infer<typeof itemOptimizationSchema>;

interface CreateChatChainOptions {
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Creates a chain to analyze a Job Description (JD).
 * This chain extracts key skills, responsibilities, and qualifications from a JD.
 * It uses OpenAI's function calling feature for reliable JSON output.
 * @returns A runnable chain that takes a JD string and outputs a structured object.
 */
export const createJdAnalysisChain = ({
  apiKey,
  baseUrl,
  modelName,
  maxTokens,
}: CreateChatChainOptions) => {
  if (!apiKey) throw new Error("API key is required for JD analysis chain.");

  const llm = getModel({
    apiKey,
    baseUrl,
    modelName: modelName ?? "gpt-4-turbo",
    maxTokens: maxTokens ?? 2048,
  });

  const parser = StructuredOutputParser.fromZodSchema(jdAnalysisSchema);

  const prompt = PromptTemplate.fromTemplate(jdAnalysisPrompt, {
    partialVariables: { format_instructions: parser.getFormatInstructions() },
  });

  return prompt.pipe(llm).pipe(parser);
};

/**
 * Creates a chain to optimize a single resume item (e.g., experience, project, skill).
 * @returns A runnable chain that takes context and a specific item, and outputs an optimized summary.
 */
export const createItemOptimizationChain = ({
  apiKey,
  baseUrl,
  modelName,
  maxTokens,
}: CreateChatChainOptions) => {
  if (!apiKey) throw new Error("API key is required for item optimization chain.");

  const model = getModel({
    apiKey,
    baseUrl,
    modelName: modelName ?? "gpt-3.5-turbo",
    maxTokens: maxTokens ?? 2048,
  });

  const parser = StructuredOutputParser.fromZodSchema(itemOptimizationSchema);

  const prompt = PromptTemplate.fromTemplate(resumeOptimizePrompt, {
    partialVariables: { format_instructions: parser.getFormatInstructions() },
  });

  return prompt.pipe(model).pipe(parser);
};

export const createPolishTextChain = ({
  apiKey,
  baseUrl,
  modelName,
  maxTokens,
}: CreateChatChainOptions) => {
  if (!apiKey) throw new Error("API key is required for polish text chain.");

  const model = getModel({
    apiKey,
    baseUrl,
    modelName: modelName ?? "gpt-4-turbo",
    maxTokens: maxTokens ?? 2048,
  });
  const prompt = PromptTemplate.fromTemplate(polishTextPrompt);

  return prompt.pipe(model).pipe(new StringOutputParser());
};

export const createResumeAnalysisChain = ({
  apiKey,
  baseUrl,
  modelName,
  maxTokens,
  temperature,
}: CreateChatChainOptions) => {
  if (!apiKey) throw new Error("API key is required for resume analysis chain.");

  const llm = getModel({
    apiKey,
    baseUrl,
    modelName: modelName ?? "gpt-4-turbo",
    maxTokens: maxTokens ?? 4096,
    temperature: temperature ?? 0.2,
  });

  const jsonModeLlm = llm.bind({
    response_format: { type: "json_object" },
  });

  const prompt = PromptTemplate.fromTemplate(resumeAnalysisPrompt);

  const chain = prompt.pipe(jsonModeLlm).pipe(new JsonOutputParser());

  return chain;
}; 