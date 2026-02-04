import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { StructuredOutputParser, OutputFixingParser } from "langchain/output_parsers";
import { resumeOptimizePrompt } from "@/lib/aiLab/prompts/agent-modify-prompt";
import { jdAnalysisPrompt } from "@/lib/aiLab/prompts/jd-analysis-prompt";
import { polishTextPrompt } from "@/lib/aiLab/prompts/polish-text-prompt";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { resumeAnalysisPrompt, createSubAnalysisPrompt } from "@/lib/aiLab/prompts/resume-analysis-prompt";
import { getModel } from "./aiService";
import { Runnable } from "@langchain/core/runnables";

export const jdAnalysisSchema = z.object({
  jobTitle: z
    .string()
    .describe(
      "The job title, e.g., 'Senior Frontend Engineer', 'Product Manager'."
    ),
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
});

export type JdAnalysis = z.infer<typeof jdAnalysisSchema>;

export const itemOptimizationSchema = z.object({
  optimizedSummary: z
    .string()
    .describe("The rewritten, impactful resume item summary."),
});

export type ItemOptimizationOutput = z.infer<typeof itemOptimizationSchema>;

export interface CreateChatChainOptions {
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
    modelName,
    maxTokens: maxTokens ?? 2048,
  });

  const parser = StructuredOutputParser.fromZodSchema(jdAnalysisSchema);

  const prompt = PromptTemplate.fromTemplate(jdAnalysisPrompt, {
    partialVariables: { format_instructions: parser.getFormatInstructions() },
  });

  const chain: Runnable<{ jd: string }, JdAnalysis> = prompt.pipe(llm).pipe(parser);

  return chain;
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
    modelName,
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
    modelName,
    maxTokens: maxTokens ?? 2048,
  });
  const prompt = PromptTemplate.fromTemplate(polishTextPrompt);

  return prompt.pipe(model).pipe(new StringOutputParser());
};

export const subAnalysisSchema = z.object({
  score: z.number().describe("The numeric score from 0 to 100 for this category."),
  justification: z.string().describe("A brief justification for the score."),
  suggestions: z.array(z.string()).describe("2-3 specific, actionable suggestions for improvement."),
});

export const resumeAnalysisSchema = z.object({
  overallScore: z.number().describe("The overall score for the resume, from 0 to 100."),
  summary: z.string().describe("A brief summary of the resume's strengths and weaknesses."),
  detailedAnalysis: z.record(z.object({
    score: z.number().describe("The numeric score from 0 to 100 for this category."),
    justification: z.string().describe("A brief justification for the score."),
    suggestions: z.array(z.string()).describe("2-3 specific, actionable suggestions for improvement."),
  })).describe("A detailed breakdown of the analysis by category."),
});

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
    modelName,
    maxTokens: maxTokens ?? 4096,
    temperature: temperature ?? 0.2,
  });

  const parser = StructuredOutputParser.fromZodSchema(resumeAnalysisSchema);

  const prompt = new PromptTemplate({
    template: resumeAnalysisPrompt,
    inputVariables: ["resume"],
    partialVariables: { format_instructions: parser.getFormatInstructions() },
  });

  const mainChain = prompt.pipe(llm).pipe(parser);
  
  const fixingParser = OutputFixingParser.fromLLM(llm, parser);
  const fixingChain = prompt.pipe(llm).pipe(fixingParser);

  const chain = mainChain.withFallbacks({
    fallbacks: [fixingChain],
  });

  return chain;
};

export const createSubAnalysisChain = (
  {
    apiKey,
    baseUrl,
    modelName,
    maxTokens,
    temperature,
  }: CreateChatChainOptions,
  category: string
) => {
  if (!apiKey) throw new Error("API key is required for resume analysis chain.");

  const llm = getModel({
    apiKey,
    baseUrl,
    modelName,
    maxTokens: maxTokens ?? 1024, // Reduced tokens for smaller tasks
    temperature: temperature ?? 0.2,
  });

  const parser = StructuredOutputParser.fromZodSchema(subAnalysisSchema);

  const prompt = new PromptTemplate({
    template: createSubAnalysisPrompt(category),
    inputVariables: ["resume", "jd_analysis", "web_search_results"],
    partialVariables: { format_instructions: parser.getFormatInstructions() },
  });
  
  const mainChain = prompt.pipe(llm).pipe(parser);

  const fixingParser = OutputFixingParser.fromLLM(llm, parser);
  const fixingChain = prompt.pipe(llm).pipe(fixingParser);

  const chain = mainChain.withFallbacks({
    fallbacks: [fixingChain],
  });

  return chain;
}; 