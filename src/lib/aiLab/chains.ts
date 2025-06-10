import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { getModel } from "./aiService";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { resumeOptimizePrompt } from "@/prompts/agent-modify-prompt";

const jdAnalysisSchema = z.object({
  keySkills: z.array(z.string()).describe("List of key skills mentioned in the job description, e.g., 'React', 'Node.js', 'Project Management'"),
  responsibilities: z.array(z.string()).describe("List of key responsibilities and tasks."),
  qualifications: z.array(z.string()).describe("List of key qualifications and experience requirements."),
});

// Exporting the type for external use
export type JdAnalysis = z.infer<typeof jdAnalysisSchema>;

// Zod schema for the item optimization output
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
  // 1. Initialize the model with all its configuration
  const model = getModel({ 
    apiKey, 
    baseUrl, 
    modelName, 
    maxTokens,
    streaming: true,
  });

  const prompt = PromptTemplate.fromTemplate(
`You are an expert HR analyst. Analyze the following job description and extract the key information.

Job Description:
{jd}

IMPORTANT: Your response MUST be a valid JSON object that conforms to the following Zod schema:
\`\`\`json
{{
  "keySkills": ["List of key skills mentioned in the job description, e.g., 'React', 'Node.js', 'Project Management'"],
  "responsibilities": ["List of key responsibilities and tasks."],
  "qualifications": ["List of key qualifications and experience requirements."]
}}
\`\`\`

Return ONLY the JSON object, without any markdown formatting or extra text.

JSON Output:`
  );
  
  const parser = new JsonOutputParser<JdAnalysis>();

  // 3. Pipe the components together
  return prompt.pipe(model).pipe(parser);
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

  const prompt = PromptTemplate.fromTemplate(resumeOptimizePrompt);

  const parser = new JsonOutputParser<ItemOptimizationOutput>();

  return prompt.pipe(model).pipe(parser);
}; 