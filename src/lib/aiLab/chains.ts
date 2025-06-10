import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { getModel } from "./aiService";
import { StructuredOutputParser } from "langchain/output_parsers";
import { resumeOptimizePrompt } from "@/prompts/agent-modify-prompt";
import { jdAnalysisPrompt } from "@/prompts/jd-analysis-prompt";
import { polishTextPrompt } from "@/prompts/polish-text-prompt";
import { RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const jdAnalysisSchema = z.object({
  keySkills: z.array(z.string()).describe("List of key skills mentioned in the job description, e.g., 'React', 'Node.js', 'Project Management'"),
  responsibilities: z.array(z.string()).describe("List of key responsibilities and tasks."),
  qualifications: z.array(z.string()).describe("List of key qualifications and experience requirements."),
});

export type JdAnalysis = z.infer<typeof jdAnalysisSchema>;

const itemOptimizationSchema = z.object({
  optimizedSummary: z.string().describe("The rewritten, impactful resume item summary."),
});

export type ItemOptimizationOutput = z.infer<typeof itemOptimizationSchema>;

interface ChainConfig {
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
  maxTokens?: number;
}

/**
 * Creates a chain to analyze a Job Description (JD).
 * This chain extracts key skills, responsibilities, and qualifications from a JD.
 * It uses OpenAI's function calling feature for reliable JSON output.
 * @returns A runnable chain that takes a JD string and outputs a structured object.
 */
export const createJdAnalysisChain = ({ apiKey, baseUrl, modelName, maxTokens }: ChainConfig) => {
  const model = getModel({ 
    apiKey, 
    baseUrl, 
    modelName, 
    maxTokens,
    streaming: true,
  });

  const parser = StructuredOutputParser.fromZodSchema(jdAnalysisSchema);

  const chain = RunnablePassthrough.assign({
    format_instructions: () => parser.getFormatInstructions(),
  })
    .pipe(PromptTemplate.fromTemplate(jdAnalysisPrompt))
    .pipe(model)
    .pipe(parser);
  
  return chain;
};

/**
 * Creates a chain to optimize a single resume item (e.g., experience, project, skill).
 * @returns A runnable chain that takes context and a specific item, and outputs an optimized summary.
 */
export const createItemOptimizationChain = ({ apiKey, baseUrl, modelName, maxTokens }: ChainConfig) => {
  const model = getModel({
    apiKey,
    baseUrl,
    modelName,
    maxTokens,
  });

  const parser = StructuredOutputParser.fromZodSchema(itemOptimizationSchema);

  const chain = RunnablePassthrough.assign({
    format_instructions: () => parser.getFormatInstructions(),
  })
    .pipe(PromptTemplate.fromTemplate(resumeOptimizePrompt))
    .pipe(model)
    .pipe(parser);

  return chain;
};

export const createPolishTextChain = ({ apiKey, baseUrl, modelName, maxTokens }: ChainConfig) => {
  const model = getModel({
    apiKey,
    baseUrl,
    modelName,
    maxTokens,
  });

  const prompt = PromptTemplate.fromTemplate(polishTextPrompt);
  const parser = new StringOutputParser();

  return prompt.pipe(model).pipe(parser);
} 